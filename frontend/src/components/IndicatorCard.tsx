import React from 'react';

interface IndicatorCardProps {
  label: string;
  value: number;
  isAlert: boolean;
  trend?: 'up' | 'down';
}

const IndicatorCard: React.FC<IndicatorCardProps> = ({ label, value, isAlert, trend }) => {
  return (
    <div className={`indicator-card ${isAlert ? 'alert' : 'success'}`}>
      <span className="indicator-label">{label}</span>
      <div className="indicator-value-row">
        <span className="indicator-value">{value.toLocaleString('fr-FR')} FCFA</span>
        {trend ? (
          <span className={`trend-icon ${trend}`} aria-hidden="true">
            {trend === 'up' ? '▲' : '▼'}
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default IndicatorCard;
