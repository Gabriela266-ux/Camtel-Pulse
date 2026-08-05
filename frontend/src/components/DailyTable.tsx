import React from 'react';
import { DailyEntry } from '../types';
import IndicatorCard from './IndicatorCard';

interface DailyTableProps {
  entries: DailyEntry[];
}

const DailyTable: React.FC<DailyTableProps> = ({ entries }) => {
  if (entries.length === 0) {
    return <p>Aucune donnée pour cette entité.</p>;
  }

  const last = entries[entries.length - 1];

  return (
    <div>
      <h3>Suivi journalier</h3>

      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
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
        />
        <IndicatorCard
          label="Écart cumulé"
          value={last.écartCumulé}
          isAlert={last.écartCumulé < 0}
        />
      </div>

      <table style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse' }}>
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
          {entries.map((e) => (
            <tr key={e.date}>
              <td>{e.date}</td>
              <td>{e.entityName}</td>
              <td>{e.venteJour.toLocaleString('fr-FR')}</td>
              <td>{e.achatsCumulés.toLocaleString('fr-FR')}</td>
              <td>{e.stockSécurité.toLocaleString('fr-FR')}</td>
              <td
                style={{ color: e.écartJour < 0 ? 'red' : 'green' }}
              >
                {e.écartJour.toLocaleString('fr-FR')}
              </td>
              <td
                style={{ color: e.écartCumulé < 0 ? 'red' : 'green' }}
              >
                {e.écartCumulé.toLocaleString('fr-FR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DailyTable;
