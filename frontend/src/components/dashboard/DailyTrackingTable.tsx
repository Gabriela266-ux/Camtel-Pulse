import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, FileText } from 'lucide-react';
import type { DailyRecord } from '../../types';

interface DailyTrackingTableProps {
  records: DailyRecord[];
  canCreateEntry: boolean;
  onNewEntry: () => void;
  canCreateForecast: boolean;
  onNewForecast: () => void;
  isDark?: boolean;
  purchaseLabel?: string;
  stockSecurite?: number;
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

const Delta: React.FC<{ value: number }> = ({ value }) => (
  <span
    className={`font-mono text-xs font-bold ${
      value >= 0 ? 'text-emerald-600' : 'text-rose-600'
    }`}
  >
    {value >= 0 ? '+' : ''}
    {value.toLocaleString('fr-FR')}
  </span>
);

const StatusDot: React.FC<{ status: 'NORMAL' | 'CRITIQUE' }> = ({ status }) => (
  <span
    className={`inline-block h-2.5 w-2.5 rounded-full ${
      status === 'CRITIQUE' ? 'bg-rose-500' : 'bg-emerald-500'
    }`}
    title={status === 'CRITIQUE' ? 'Critique' : 'OK'}
  />
);

function downloadExcel(records: DailyRecord[], purchaseLabel: string, stockSecurite: number) {
  const cumulMap = computeCumulCalendrier(records);
  const rows = records.map((record) => {
    const cumulCalendrier = cumulMap.get(record.date) ?? 0;
    const ecartCalendrier = record.cumul_achat - cumulCalendrier;

    return {
      Date: new Date(`${record.date}T00:00:00`),
      'Stock Journalier (U)': record.stock_journalier,
      'Écart Stock Sécurité (U)': record.stock_journalier - stockSecurite,
      'Statut Sécurité': record.stock_journalier >= stockSecurite ? 'NORMAL' : 'CRITIQUE',
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
}) => {
  const [downloadType, setDownloadType] = useState<'xlsx' | 'pdf' | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

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
  ];

  const cumulMap = useMemo(() => computeCumulCalendrier(records), [records]);

  const openPrintWindow = () => {
    const tableRows = [
      [...headers],
      ...[...records].reverse().map((r) => {
        const cumulCalendrier = cumulMap.get(r.date) ?? 0;
        const ecartCalendrier = r.cumul_achat - cumulCalendrier;
        return [
          r.date,
          String(r.stock_journalier),
          String(r.stock_journalier - stockSecurite),
          r.stock_journalier >= stockSecurite ? 'NORMAL' : 'CRITIQUE',
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
    } catch (error) {
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
    } catch (error) {
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
              className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 hover:bg-violet-100"
            >
              + Prévisions mensuelles
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
            {[...records].reverse().map((record) => {
              const todayKey = new Date().toISOString().slice(0, 10);
              const isToday = record.date === todayKey;
              const ecartStockSecurite = record.stock_journalier - stockSecurite;
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
                    {record.stock_journalier.toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-2.5">
                    <Delta value={ecartStockSecurite} />
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusDot status={ecartStockSecurite >= 0 ? 'NORMAL' : 'CRITIQUE'} />
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
