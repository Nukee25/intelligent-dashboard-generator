import React from 'react';

interface KPICardProps {
  label: string;
  value: number;
  type: 'currency' | 'number' | 'percentage';
  trend?: number;
  color?: string;
}

function formatValue(value: number, type: 'currency' | 'number' | 'percentage'): string {
  if (type === 'currency') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  }
  if (type === 'percentage') {
    return `${value.toFixed(1)}%`;
  }
  return new Intl.NumberFormat('en-US').format(value);
}

const KPICard: React.FC<KPICardProps> = ({ label, value, type, trend, color = '#2563eb' }) => {
  const hasTrend = trend !== undefined && trend !== null;
  const isPositive = hasTrend && trend! >= 0;

  return (
    <div className="kpi-card" style={{ borderTop: `4px solid ${color}` }}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{formatValue(value, type)}</div>
      {hasTrend && (
        <div className={`kpi-trend ${isPositive ? 'trend-up' : 'trend-down'}`}>
          {isPositive ? '↑' : '↓'} {Math.abs(trend!).toFixed(1)}% vs prior period
        </div>
      )}
    </div>
  );
};

export default KPICard;
