import React from 'react';

interface IndicatorCardProps {
  label: string;
  value: number;
  isAlert: boolean; // true = rouge si négatif, false = vert si >= 0
}

const IndicatorCard: React.FC<IndicatorCardProps> = ({ label, value, isAlert }) => {
  const bg = isAlert ? '#ffdddd' : '#ddffdd';
  const color = isAlert ? '#b00000' : '#006600';

  return (
    <div
      style={{
        padding: '0.75rem 1rem',
        margin: '0.5rem',
        borderRadius: '8px',
        backgroundColor: bg,
        color,
        minWidth: '150px',
      }}
    >
      <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>{label}</div>
      <div style={{ fontWeight: 'bold' }}>{value.toLocaleString('fr-FR')}</div>
    </div>
  );
};

export default IndicatorCard;
