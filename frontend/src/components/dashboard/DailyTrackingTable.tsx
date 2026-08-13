import React from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, FileText } from 'lucide-react';
import type { DailyRecord } from '../../types';

interface DailyTrackingTableProps {
  records: DailyRecord[];
  canCreateEntry: boolean;
  onNewEntry: () => void;
}

const formatDate = (value: string) => {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
};

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

function downloadExcel(records: DailyRecord[]) {
  const rows = records.map((record) => ({
    Date: new Date(`${record.date}T00:00:00`),
    'Prévision / CA (U)': record.prevision_ca,
    'Réalisation / VA (U)': record.realisation_va,
    'Cumul achat (U)': record.cumul_achat,
    'Écart stock sec (U)': record.ecart_stock_sec,
    'Écart jour': record.ecart_jour,
    'Écart cumulé': record.ecart_cumule,
    Statut: record.statut,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 20 },
    { wch: 22 },
    { wch: 20 },
    { wch: 22 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
  ];

  worksheet['!autofilter'] = {
    ref: `A1:H${Math.max(rows.length + 1, 2)}`,
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
}) => {
  const headers = [
    'Date',
    'Prévision/CA(U)',
    'Réalisation/VA(U)',
    'Cumul achat (U)',
    'Écart stock sec (U)',
    'Écart jour',
    'Écart cumulé',
    'Statut',
  ];

  const openPrintWindow = () => {
    const tableRows = [
      [...headers],
      ...[...records].reverse().map((r) => [
        r.date,
        String(r.prevision_ca),
        String(r.realisation_va),
        String(r.cumul_achat),
        String(r.ecart_stock_sec),
        String(r.ecart_jour),
        String(r.ecart_cumule),
        r.statut,
      ]),
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

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-black text-slate-700">Suivi journalier</h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-500">
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

          <button
            type="button"
            onClick={() => downloadExcel(records)}
            disabled={records.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </button>

          <button
            type="button"
            onClick={openPrintWindow}
            disabled={records.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileText className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50">
              {headers.map((column) => (
                <th
                  key={column}
                  className="whitespace-nowrap border-b border-slate-200 px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-wide text-slate-400"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...records].reverse().map((record) => {
              const isToday = record.date === '2026-08-11';
              const isNormal = record.statut === 'NORMAL';

              return (
                <tr
                  key={record.date}
                  className={
                    isToday ? 'bg-sky-50' : 'odd:bg-white even:bg-slate-50/50'
                  }
                >
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-slate-600">
                    {formatDate(record.date)}
                    {isToday && (
                      <span className="ml-2 rounded-full bg-sky-200 px-1.5 py-0.5 text-[9px] font-black text-sky-700">
                        AUJOURD'HUI
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-400">
                    {record.prevision_ca}
                  </td>
                  <td className="px-4 py-2.5 font-mono font-bold text-slate-700">
                    {record.realisation_va}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-600">
                    {record.cumul_achat.toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-2.5 font-mono font-bold text-amber-600">
                    {record.ecart_stock_sec}
                  </td>
                  <td className="px-4 py-2.5">
                    <Delta value={record.ecart_jour} />
                  </td>
                  <td className="px-4 py-2.5">
                    <Delta value={record.ecart_cumule} />
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${
                        isNormal
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-rose-200 bg-rose-50 text-rose-700'
                      }`}
                    >
                      {isNormal ? 'NORMAL' : 'CRITIQUE'}
                    </span>
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