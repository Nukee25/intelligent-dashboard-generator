import React, { useState, useEffect } from 'react';
import { parsePrompt } from '../lib/nlpParser';
import { queryData } from '../lib/queryEngine';
import { selectCharts } from '../lib/chartSelector';
import { salesData } from '../data/salesData';
import KPICard from './KPICard';
import ChartPanel from './ChartPanel';
import type { KPIData } from '../lib/queryEngine';
import type { ChartConfig } from '../lib/chartSelector';
import type { DashboardIntent } from '../lib/nlpParser';

interface DashboardProps {
  prompt: string;
}

interface DashboardData {
  intent: DashboardIntent;
  kpis: KPIData[];
  charts: ChartConfig[];
  totalRecords: number;
  aiGenerated: boolean;
}

const KPI_COLORS = ['#2563eb', '#16a34a', '#7c3aed', '#f59e0b', '#0891b2'];

function buildSubtitle(intent: DashboardIntent): string {
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

function computeLocally(prompt: string): DashboardData {
  const intent = parsePrompt(prompt);
  const queryResult = queryData(intent, salesData);
  const charts = selectCharts(intent, queryResult);
  return { intent, kpis: queryResult.kpis, charts, totalRecords: queryResult.totalRecords, aiGenerated: false };
}

const Dashboard: React.FC<DashboardProps> = ({ prompt }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'api' | 'local'>('api');

  useEffect(() => {
    setLoading(true);
    setData(null);

    const controller = new AbortController();

    fetch('/api/dashboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const json = await res.json() as {
          intent: DashboardIntent;
          kpis: KPIData[];
          charts: ChartConfig[];
          totalRecords: number;
          aiGenerated: boolean;
        };
        setData({ intent: json.intent, kpis: json.kpis, charts: json.charts, totalRecords: json.totalRecords, aiGenerated: json.aiGenerated ?? false });
        setSource('api');
      })
      .catch((err) => {
        if ((err as Error).name === 'AbortError') return;
        // Fall back to local computation
        setData(computeLocally(prompt));
        setSource('local');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [prompt]);

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner" />
        <p>Generating dashboard…</p>
      </div>
    );
  }

  if (!data || data.totalRecords === 0) {
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
        <p className="dashboard-subtitle">{buildSubtitle(data.intent)}</p>
        <p className="dashboard-records">
          {data.totalRecords.toLocaleString()} records analyzed
          {data.aiGenerated && <span className="badge-ai">✨ AI-powered</span>}
          {source === 'local' && <span className="badge-local"> (local mode)</span>}
        </p>
      </div>

      <div className="kpi-grid">
        {data.kpis.map((kpi, idx) => (
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
        {data.charts.map((chart) => (
          <ChartPanel key={chart.id} config={chart} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
