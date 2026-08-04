import React from 'react';
import type { DailyEntry } from '../types';
import IndicatorCard from './IndicatorCard';

interface DailyTableProps {
  entries: DailyEntry[];
  selectedDate: string;
}

const escapePdfText = (text: string) =>
  text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const createPdfData = (lines: string[]) => {
  const contentLines = ['BT', '/F1 10 Tf', '40 820 Td'];
  lines.forEach((line, index) => {
    contentLines.push(`(${escapePdfText(line)}) Tj`);
    if (index < lines.length - 1) {
      contentLines.push('0 -18 Td');
    }
  });
  contentLines.push('ET');

  const content = contentLines.join('\n');
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj',
    `4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
  ];

  let offset = 0;
  const header = '%PDF-1.4\n';
  offset += new TextEncoder().encode(header).length;
  const xrefPositions = objects.map((obj) => {
    const pos = offset;
    offset += new TextEncoder().encode(`${obj}\n`).length;
    return pos;
  });

  const xref = ['xref', `0 ${objects.length + 1}`, '0000000000 65535 f '].concat(
    xrefPositions.map((pos) => `${pos.toString().padStart(10, '0')} 00000 n `),
  );

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF`;
  const pdf = [header].concat(objects.map((obj) => `${obj}\n`), xref.join('\n') + '\n', trailer).join('');
  return new TextEncoder().encode(pdf);
};

const DailyTable: React.FC<DailyTableProps> = ({ entries, selectedDate }) => {
  if (entries.length === 0) {
    return (
      <section className="table-card">
        <h3>Suivi journalier détaillé</h3>
        <p className="panel-text">Aucune donnée pour cette entité.</p>
      </section>
    );
  }

  const last = entries[entries.length - 1];
  const selectedEntry = entries.find((entry) => entry.date === selectedDate);
  const displayDate = selectedEntry ? selectedDate : last.date;

  const headers = [
    'Date',
    'Entité',
    'Vente du jour',
    'Achats cumulés',
    'Stock sécurité',
    'Écart jour',
    'Écart cumulé',
  ];
  const rows = entries.map((entry) => [
    entry.date,
    entry.entityName,
    entry.venteJour.toLocaleString('fr-FR'),
    entry.achatsCumulés.toLocaleString('fr-FR'),
    entry.stockSécurité.toLocaleString('fr-FR'),
    entry.écartJour.toLocaleString('fr-FR'),
    entry.écartCumulé.toLocaleString('fr-FR'),
  ]);

  const exportToXls = () => {
    const tableRows = [headers, ...rows]
      .map(
        (row) =>
          `<tr>${row
            .map((cell) => `<td>${cell}</td>`)
            .join('')}</tr>`,
      )
      .join('');
    const html = `<table>${tableRows}</table>`;
    const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `suivi-journalier-${selectedDate}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToPdf = () => {
    const lines = [
      'Suivi journalier détaillé',
      `Date de référence: ${displayDate}`,
      '',
      headers.join(' | '),
      ...rows.map((row) => row.join(' | ')),
    ];
    const pdfData = createPdfData(lines);
    const blob = new Blob([pdfData], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `suivi-journalier-${selectedDate}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="table-card">
      <div className="table-header">
        <div>
          <h3>Suivi journalier détaillé</h3>
          <p className="panel-text">Données de référence : {displayDate}</p>
        </div>
        <div className="export-controls">
          <button type="button" className="export-btn" onClick={exportToXls}>
            Exporter XLS
          </button>
          <button type="button" className="export-btn" onClick={exportToPdf}>
            Exporter PDF
          </button>
        </div>
      </div>

      <div className="indicator-grid">
        <IndicatorCard
          label="Vente du jour"
          value={last.venteJour}
          isAlert={last.venteJour < last.stockSécurité}
        />
        <IndicatorCard
          label="Achats cumulés"
          value={last.achatsCumulés}
          isAlert={last.achatsCumulés < last.stockSécurité}
        />
        <IndicatorCard
          label="Stock de sécurité"
          value={last.stockSécurité}
          isAlert={false}
        />
        <IndicatorCard
          label="Écart du jour"
          value={last.écartJour}
          isAlert={last.écartJour < 0}
          trend={last.écartJour >= 0 ? 'up' : 'down'}
        />
        <IndicatorCard
          label="Écart cumulé"
          value={last.écartCumulé}
          isAlert={last.écartCumulé < 0}
          trend={last.écartCumulé >= 0 ? 'up' : 'down'}
        />
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Entité</th>
              <th>Vente du jour</th>
              <th>Achats cumulés</th>
              <th>Stock sécurité</th>
              <th>Écart jour</th>
              <th>Écart cumulé</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={`${entry.date}-${entry.entityId}`}
                className={entry.date === selectedDate ? 'selected-row' : undefined}
              >
                <td>{entry.date}</td>
                <td>{entry.entityName}</td>
                <td>{entry.venteJour.toLocaleString('fr-FR')}</td>
                <td>{entry.achatsCumulés.toLocaleString('fr-FR')}</td>
                <td>{entry.stockSécurité.toLocaleString('fr-FR')}</td>
                <td className={entry.écartJour < 0 ? 'negative' : 'positive'}>
                  {entry.écartJour.toLocaleString('fr-FR')}
                </td>
                <td className={entry.écartCumulé < 0 ? 'negative' : 'positive'}>
                  {entry.écartCumulé.toLocaleString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default DailyTable;
