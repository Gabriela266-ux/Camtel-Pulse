import React, { useMemo, useState } from 'react';
import { Eraser, Eye, FileSpreadsheet, FileText, Save } from 'lucide-react';
import type { DailyRecord } from '../../types';
import { EntryDetailsModal } from './EntryDetailsModal';

interface DailyTrackingTableProps {
  records: DailyRecord[];
  canCreateEntry: boolean;
  onNewEntry: () => void;
  canCreateForecast: boolean;
  onNewForecast: () => void;
  isDark?: boolean;
  purchaseLabel?: string;
  stockSecurite?: number;
  /** Actions de modification réservées aux rôles opérationnels. */
  canClear?: boolean;
  canSave?: boolean;
  onSaveSnapshot?: () => Promise<void>;
  onRefresh?: () => Promise<void> | void;
  canViewDetails?: boolean;
  entityName?: string;
}

const formatDate = (value: string) => {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
};

// Cumul courant du calendrier d'achat = somme cumulée des prévisions,
// remise à zéro au début de chaque mois.
function computeCumulCalendrier(records: DailyRecord[]): Map<string, number> {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const runningByMonth: Record<string, number> = {};
  const cumulMap = new Map<string, number>();

  for (const record of sorted) {
    const monthKey = record.date.slice(0, 7);
    runningByMonth[monthKey] = (runningByMonth[monthKey] ?? 0) + (record.prevision_ca ?? 0);
    cumulMap.set(record.date, runningByMonth[monthKey]);
  }

  return cumulMap;
}

const Delta: React.FC<{ value: number | null }> = ({ value }) =>
  value === null ? (
    <span className="font-mono text-xs font-bold text-slate-400">—</span>
  ) : (
    <span
      className={`font-mono text-xs font-bold ${
        value >= 0 ? 'text-emerald-600' : 'text-rose-600'
      }`}
    >
      {value >= 0 ? '+' : ''}
      {value.toLocaleString('fr-FR')}
    </span>
  );

const StatusDot: React.FC<{ status: 'NORMAL' | 'CRITIQUE' | null }> = ({ status }) => (
  <span
    className={`inline-block h-2.5 w-2.5 rounded-full ${
      status === null ? 'bg-slate-300' : status === 'CRITIQUE' ? 'bg-rose-500' : 'bg-emerald-500'
    }`}
    title={status === null ? 'Non saisi' : status === 'CRITIQUE' ? 'Critique' : 'OK'}
  />
);

async function downloadExcel(records: DailyRecord[], purchaseLabel: string, stockSecurite: number) {
  const XLSX = await import('xlsx');
  const cumulMap = computeCumulCalendrier(records);
  const rows = [...records].sort((a, b) => a.date.localeCompare(b.date)).map((record) => {
    const cumulCalendrier = cumulMap.get(record.date) ?? 0;
    const ecartCalendrier = record.cumul_achat - cumulCalendrier;

    return {
      Date: new Date(`${record.date}T00:00:00`),
      'Stock Journalier (U)': record.stock_journalier ?? 'Non saisi',
      'Écart Stock Sécurité (U)': record.stock_journalier !== null ? record.stock_journalier - stockSecurite : '',
      'Statut Sécurité': record.stock_journalier !== null ? (record.stock_journalier >= stockSecurite ? 'NORMAL' : 'CRITIQUE') : 'N/A',
      'Calendrier d\'Achat (U)': record.prevision_ca,
      'Cumul Calendrier d\'Achat (U)': cumulCalendrier,
      [purchaseLabel]: record.achat,
      'Cumul achat (U)': record.cumul_achat,
      'Écart Calendrier d\'Achat (U)': ecartCalendrier,
      'Statut': ecartCalendrier >= 0 ? 'NORMAL' : 'CRITIQUE',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 20 },
    { wch: 22 },
    { wch: 18 },
    { wch: 24 },
    { wch: 26 },
    { wch: 22 },
    { wch: 20 },
    { wch: 26 },
    { wch: 14 },
  ];

  worksheet['!autofilter'] = {
    ref: `A1:J${Math.max(rows.length + 1, 2)}`,
  };

  for (let row = 2; row <= rows.length + 1; row += 1) {
    const dateCell = worksheet[`A${row}`];
    if (dateCell) {
      dateCell.z = 'dd/mm/yyyy';
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Suivi journalier');

  XLSX.writeFile(workbook, 'suivi-journalier.xlsx', {
    compression: true,
    cellDates: true,
  });
}

export const DailyTrackingTable: React.FC<DailyTrackingTableProps> = ({
  records,
  canCreateEntry,
  onNewEntry,
  canCreateForecast,
  onNewForecast,
  isDark = false,
  purchaseLabel = 'Achat (U)',
  stockSecurite = 0,
  canClear = false,
  canSave = false,
  onSaveSnapshot,
  onRefresh,
  canViewDetails = false,
  entityName = 'Entité sélectionnée',
}) => {
  const [downloadType, setDownloadType] = useState<'xlsx' | 'pdf' | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'ok' | 'error' | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [detailRecord, setDetailRecord] = useState<DailyRecord | null>(null);

  const headers = [
    'Date',
    'Stock Journalier (U)',
    'Écart Stock Sécurité (U)',
    'Statut Sécurité',
    'Calendrier d\'Achat (U)',
    'Cumul Calendrier d\'Achat (U)',
    purchaseLabel,
    'Cumul achat (U)',
    'Écart Calendrier d\'Achat (U)',
    'Statut',
    ...(canViewDetails ? ['Saisi par', 'Détails'] : []),
  ];

  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => a.date.localeCompare(b.date)),
    [records],
  );
  const cumulMap = useMemo(() => computeCumulCalendrier(sortedRecords), [sortedRecords]);

  // Totaux par colonne numérique (affichés en pied de tableau et transmis au serveur).
  const totals = useMemo(() => {
    const stock = records.reduce((s, r) => s + Number(r.stock_journalier || 0), 0);
    const prevision = records.reduce((s, r) => s + Number(r.prevision_ca || 0), 0);
    const achat = records.reduce((s, r) => s + Number(r.achat || 0), 0);
    const cumulFinal = sortedRecords.length ? Number(sortedRecords[sortedRecords.length - 1].cumul_achat || 0) : 0;
    return {
      stock: Math.round(stock * 100) / 100,
      prevision: Math.round(prevision * 100) / 100,
      achat: Math.round(achat * 100) / 100,
      cumul: Math.round(cumulFinal * 100) / 100,
      ecartStock: records.reduce((s, r) => s + (r.stock_journalier !== null ? r.stock_journalier - stockSecurite : 0), 0),
      ecartCalendrier: records.reduce((s, r) => s + (r.cumul_achat - (cumulMap.get(r.date) ?? 0)), 0),
    };
  }, [records, sortedRecords, stockSecurite, cumulMap]);

  const handleSave = async () => {
    if (!onSaveSnapshot || saving || records.length === 0) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      await onSaveSnapshot();
      setSaveStatus('ok');
    } catch (error) {
      console.error('Échec de l\'enregistrement du tableau :', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const openPrintWindow = () => {
    const tableRows = [
      [...headers],
      ...sortedRecords.map((r) => {
        const cumulCalendrier = cumulMap.get(r.date) ?? 0;
        const ecartCalendrier = r.cumul_achat - cumulCalendrier;
        return [
          r.date,
          r.stock_journalier !== null ? String(r.stock_journalier) : 'Non saisi',
          r.stock_journalier !== null ? String(r.stock_journalier - stockSecurite) : '—',
          r.stock_journalier !== null ? (r.stock_journalier >= stockSecurite ? 'NORMAL' : 'CRITIQUE') : 'N/A',
          String(r.prevision_ca),
          String(cumulCalendrier),
          String(r.achat),
          String(r.cumul_achat),
          String(ecartCalendrier),
          ecartCalendrier >= 0 ? 'NORMAL' : 'CRITIQUE',
        ];
      }),
    ];

    const html = `
      <html>
        <head>
          <title>Suivi journalier</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, Helvetica, sans-serif; padding: 12px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 6px; font-size: 12px; }
            th { background: #f8fafc; font-weight: 700; }
          </style>
        </head>
        <body>
          <h2>Suivi journalier</h2>
          <table>
            ${tableRows
              .map(
                (row) =>
                  `<tr>${row.map((cell) => `<td>${String(cell)}</td>`).join('')}</tr>`
              )
              .join('')}
          </table>
        </body>
      </html>
    `;

    const newWin = window.open('', '_blank');
    if (!newWin) return;
    newWin.document.open();
    newWin.document.write(html);
    newWin.document.close();
    setTimeout(() => {
      newWin.print();
    }, 250);
  };

  const tableShell = isDark ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white text-slate-700';
  const headerBorder = isDark ? 'border-slate-700' : 'border-slate-100';

  const handleExcelDownload = async () => {
    try {
      setDownloadError(null);
      setDownloadType('xlsx');
      await downloadExcel(records, purchaseLabel, stockSecurite);
    } catch {
      setDownloadError('Impossible de générer le fichier Excel. Réessayez.');
    } finally {
      setDownloadType(null);
    }
  };

  const handlePdfDownload = async () => {
    try {
      setDownloadError(null);
      setDownloadType('pdf');
      await Promise.resolve(openPrintWindow());
    } catch {
      setDownloadError('Impossible de générer le fichier PDF. Réessayez.');
    } finally {
      setDownloadType(null);
    }
  };

  return (
    <section className={`overflow-hidden rounded-xl border shadow-sm ${tableShell}`}>
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5 ${headerBorder}`}>
        <div className="flex items-center gap-3">
          <h3 className={`text-sm font-black ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>Suivi journalier</h3>
          <span className={`rounded-full px-2 py-0.5 font-mono text-xs font-bold ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
            {records.length} lignes
          </span>
        </div>

        <div className="flex items-center gap-2">
          {canClear && onRefresh && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || records.length === 0}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50 ${
                isDark
                  ? 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
              title="Supprimer les données enregistrées de l’entité et de la période actives"
            >
              <Eraser className="h-3.5 w-3.5" />
              {refreshing ? 'Vidage…' : 'Vider'}
            </button>
          )}

          {canCreateEntry && (
            <button
              type="button"
              onClick={onNewEntry}
              className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-sky-700"
            >
              + Saisie journalière
            </button>
          )}

          {canCreateForecast && (
            <button
              type="button"
              onClick={onNewForecast}
              className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100"
            >
              + Calendrier d'achat
            </button>
          )}

          {canSave && (
            <button
              type="button"
              onClick={handleSave}
              disabled={records.length === 0 || saving}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50 ${
                isDark
                  ? 'border-sky-500/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20'
                  : 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100'
              }`}
              title="Enregistrer ce tableau dans la base (immuable)"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          )}

          <button
            type="button"
            onClick={handleExcelDownload}
            disabled={records.length === 0 || downloadType !== null}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50 ${
              isDark
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </button>

          <button
            type="button"
            onClick={handlePdfDownload}
            disabled={records.length === 0 || downloadType !== null}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50 ${
              isDark
                ? 'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <FileText className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      {downloadType && (
        <div className="flex items-center gap-2 border-b border-sky-200 bg-sky-50 px-5 py-2 text-xs font-semibold text-sky-700">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />
          Téléchargement {downloadType === 'xlsx' ? 'Excel' : 'PDF'} en cours…
        </div>
      )}

      {downloadError && (
        <div className="border-b border-red-200 bg-red-50 px-5 py-2 text-xs font-semibold text-red-700">
          {downloadError}
        </div>
      )}

      {saveStatus === 'ok' && (
        <div className="flex items-center gap-2 border-b border-emerald-200 bg-emerald-50 px-5 py-2 text-xs font-semibold text-emerald-700">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          Tableau enregistré dans la base. Il est consultable par l&apos;admin et le manager (lecture seule).
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="border-b border-red-200 bg-red-50 px-5 py-2 text-xs font-semibold text-red-700">
          Impossible d&apos;enregistrer le tableau. Réessayez.
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className={isDark ? 'bg-slate-800' : 'bg-slate-50'}>
              {headers.map((column) => (
                <th
                  key={column}
                  className={`whitespace-nowrap border-b px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-wide ${
                    isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-400'
                  }`}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRecords.map((record) => {
              const todayKey = new Date().toISOString().slice(0, 10);
              const isToday = record.date === todayKey;
              const ecartStockSecurite = record.stock_journalier !== null ? record.stock_journalier - stockSecurite : null;
              const cumulCalendrier = cumulMap.get(record.date) ?? 0;
              const ecartCalendrier = record.cumul_achat - cumulCalendrier;

              return (
                <tr
                  key={record.date}
                  className={
                    isToday
                      ? isDark
                        ? 'bg-sky-900/40'
                        : 'bg-sky-50'
                      : isDark
                        ? 'odd:bg-slate-900 even:bg-slate-800/60'
                        : 'odd:bg-white even:bg-slate-50/50'
                  }
                >
                  <td className={`whitespace-nowrap px-4 py-2.5 font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {formatDate(record.date)}
                    {isToday && (
                      <span className="ml-2 rounded-full bg-sky-200 px-1.5 py-0.5 text-[9px] font-black text-sky-700">
                        AUJOURD'HUI
                      </span>
                    )}
                  </td>
                  <td className={`px-4 py-2.5 font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {record.stock_journalier !== null ? record.stock_journalier.toLocaleString('fr-FR') : (
                      <span className="text-slate-400">Non saisi</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <Delta value={ecartStockSecurite} />
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusDot status={ecartStockSecurite !== null ? (ecartStockSecurite >= 0 ? 'NORMAL' : 'CRITIQUE') : null} />
                  </td>
                  <td className={`px-4 py-2.5 font-mono ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                    {record.prevision_ca.toLocaleString('fr-FR')}
                  </td>
                  <td className={`px-4 py-2.5 font-mono ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                    {cumulCalendrier.toLocaleString('fr-FR')}
                  </td>
                  <td className={`px-4 py-2.5 font-mono font-bold ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>
                    {record.achat.toLocaleString('fr-FR')}
                  </td>
                  <td className={`px-4 py-2.5 font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {record.cumul_achat.toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-2.5">
                    <Delta value={ecartCalendrier} />
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusDot status={ecartCalendrier >= 0 ? 'NORMAL' : 'CRITIQUE'} />
                  </td>
                  {canViewDetails && (
                    <>
                      <td className={`max-w-[180px] px-4 py-2.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        <p className="truncate text-xs font-bold">{record.saisi_par?.nomComplet || record.saisi_par?.email || 'Ancienne donnée'}</p>
                        {record.saisi_par?.role && <p className="mt-0.5 text-[10px] text-slate-400">{record.saisi_par.role} / Chef : {record.saisi_par.chefOperationnel?.nomComplet || 'Non applicable'}</p>}
                      </td>
                      <td className="px-4 py-2.5">
                        <button type="button" onClick={() => setDetailRecord(record)} className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] font-bold text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-950/70">
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" /> Voir
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className={isDark ? 'bg-slate-800/90' : 'bg-slate-100'}>
              <td className={`whitespace-nowrap border-t px-4 py-2.5 text-[10px] font-black uppercase tracking-wide ${isDark ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-500'}`}>
                TOTAL
              </td>
              <td className={`border-t px-4 py-2.5 font-mono font-bold ${isDark ? 'border-slate-700 text-slate-100' : 'border-slate-200 text-slate-800'}`}>
                {totals.stock.toLocaleString('fr-FR')}
              </td>
              <td className={`border-t px-4 py-2.5 font-mono font-bold ${totals.ecartStock >= 0 ? 'text-emerald-600' : 'text-rose-600'} ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                {totals.ecartStock >= 0 ? '+' : ''}{totals.ecartStock.toLocaleString('fr-FR')}
              </td>
              <td className={`border-t px-4 py-2.5 ${isDark ? 'border-slate-700' : 'border-slate-200'}`} />
              <td className={`border-t px-4 py-2.5 font-mono font-bold ${isDark ? 'border-slate-700 text-slate-100' : 'border-slate-200 text-slate-800'}`}>
                {totals.prevision.toLocaleString('fr-FR')}
              </td>
              <td className={`border-t px-4 py-2.5 font-mono font-bold ${isDark ? 'border-slate-700 text-slate-100' : 'border-slate-200 text-slate-800'}`}>
                {totals.prevision.toLocaleString('fr-FR')}
              </td>
              <td className={`border-t px-4 py-2.5 font-mono font-black ${isDark ? 'border-slate-700 text-sky-300' : 'border-slate-200 text-sky-700'}`}>
                {totals.achat.toLocaleString('fr-FR')}
              </td>
              <td className={`border-t px-4 py-2.5 font-mono font-bold ${isDark ? 'border-slate-700 text-slate-100' : 'border-slate-200 text-slate-800'}`}>
                {totals.cumul.toLocaleString('fr-FR')}
              </td>
              <td className={`border-t px-4 py-2.5 font-mono font-bold ${totals.ecartCalendrier >= 0 ? 'text-emerald-600' : 'text-rose-600'} ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                {totals.ecartCalendrier >= 0 ? '+' : ''}{totals.ecartCalendrier.toLocaleString('fr-FR')}
              </td>
              <td className={`border-t px-4 py-2.5 ${isDark ? 'border-slate-700' : 'border-slate-200'}`} />
              {canViewDetails && <><td className={`border-t px-4 py-2.5 ${isDark ? 'border-slate-700' : 'border-slate-200'}`} /><td className={`border-t px-4 py-2.5 ${isDark ? 'border-slate-700' : 'border-slate-200'}`} /></>}
            </tr>
          </tfoot>
        </table>
      </div>
      {detailRecord && <EntryDetailsModal record={detailRecord} entityName={entityName} isDark={isDark} onClose={() => setDetailRecord(null)} />}
    </section>
  );
};
