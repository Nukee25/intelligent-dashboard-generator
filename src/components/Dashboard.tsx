import React, { useMemo } from 'react';
import { parsePrompt } from '../lib/nlpParser';
import { queryData } from '../lib/queryEngine';
import { selectCharts } from '../lib/chartSelector';
import { salesData } from '../data/salesData';
import KPICard from './KPICard';
import ChartPanel from './ChartPanel';

interface DashboardProps {
  prompt: string;
}

const KPI_COLORS = ['#2563eb', '#16a34a', '#7c3aed', '#f59e0b', '#0891b2'];

function buildSubtitle(prompt: string): string {
  const intent = parsePrompt(prompt);
  const parts: string[] = [];

  if (intent.timePeriod.type !== 'all') parts.push(intent.timePeriod.label);
  if (intent.filterCategory) parts.push(intent.filterCategory);
  if (intent.filterRegion) parts.push(`${intent.filterRegion} Region`);

  const metricNames = intent.metrics.map(m =>
    m === 'revenue' ? 'Revenue' : m === 'profit' ? 'Profit' : m === 'units' ? 'Units' : 'Customers'
  ).join(', ');
  parts.push(metricNames);

  return `Showing ${parts.join(' · ')}`;
}

const Dashboard: React.FC<DashboardProps> = ({ prompt }) => {
  const { intent, queryResult, charts } = useMemo(() => {
    const intent = parsePrompt(prompt);
    const queryResult = queryData(intent, salesData);
    const charts = selectCharts(intent, queryResult);
    return { intent, queryResult, charts };
  }, [prompt]);

  if (queryResult.totalRecords === 0) {
    return (
      <div className="dashboard-empty">
        <div className="empty-icon">📊</div>
        <h2>No data found</h2>
        <p>Try adjusting your query. Available data spans 2023–2024 across 4 regions and 6 product categories.</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Dashboard Results</h2>
        <p className="dashboard-subtitle">{buildSubtitle(intent.rawPrompt)}</p>
        <p className="dashboard-records">{queryResult.totalRecords.toLocaleString()} records analyzed</p>
      </div>

      <div className="kpi-grid">
        {queryResult.kpis.map((kpi, idx) => (
          <KPICard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            type={kpi.type}
            trend={kpi.trend}
            color={KPI_COLORS[idx % KPI_COLORS.length]}
          />
        ))}
      </div>

      <div className="charts-grid">
        {charts.map((chart) => (
          <ChartPanel key={chart.id} config={chart} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
