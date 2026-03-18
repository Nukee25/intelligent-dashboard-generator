import type { DashboardIntent } from './nlpParser';
import type { QueryResult, AggregatedDataPoint } from './queryEngine';

export interface ChartConfig {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'grouped-bar';
  title: string;
  dataKey: string | string[];
  xAxisKey: string;
  data: AggregatedDataPoint[];
  colors: string[];
  showLegend: boolean;
  highlight?: string;
}

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#f59e0b', '#7c3aed', '#0891b2'];

function metricLabel(metric: string): string {
  switch (metric) {
    case 'revenue': return 'Revenue';
    case 'profit': return 'Profit';
    case 'units': return 'Units Sold';
    case 'customerCount': return 'Customers';
    default: return metric;
  }
}

function dimensionLabel(dim: string): string {
  switch (dim) {
    case 'region': return 'Region';
    case 'category': return 'Category';
    case 'month': return 'Month';
    case 'quarter': return 'Quarter';
    default: return dim;
  }
}

export function selectCharts(_intent: DashboardIntent, queryResult: QueryResult): ChartConfig[] {
  if (queryResult.primaryData.length === 0) return [];

  const charts: ChartConfig[] = [];
  const { primaryData, secondaryData, xAxisKey, dataKeys, intent: qi } = queryResult;
  const dims = qi.dimensions;
  const primaryMetric = dataKeys[0];
  const timePeriodLabel = qi.timePeriod.label;

  // Determine primary chart type
  let primaryType: ChartConfig['type'] = 'bar';

  if (qi.chartPreference) {
    primaryType = qi.chartPreference;
  } else if (dims.includes('month') || dims.includes('quarter')) {
    primaryType = qi.aggregationType === 'trend' ? 'area' : 'line';
  } else if (qi.aggregationType === 'compare' || qi.aggregationType === 'top' || qi.aggregationType === 'bottom') {
    primaryType = 'bar';
  } else if (primaryData.length <= 6 && (qi.aggregationType === 'total' || qi.aggregationType === 'average')) {
    primaryType = 'pie';
  }

  // Primary chart
  charts.push({
    id: 'primary',
    type: primaryType,
    title: `${metricLabel(primaryMetric)} by ${dimensionLabel(dims[0])} — ${timePeriodLabel}`,
    dataKey: primaryMetric,
    xAxisKey,
    data: primaryData,
    colors: COLORS,
    showLegend: primaryType === 'pie' || primaryData.length > 4,
    highlight: qi.highlightTop ? String(primaryData[0]?.[xAxisKey] ?? '') : undefined,
  });

  // Second metric chart if multiple metrics
  if (dataKeys.length > 1) {
    const secondMetric = dataKeys[1];
    charts.push({
      id: 'secondary-metric',
      type: dims.includes('month') || dims.includes('quarter') ? 'line' : 'bar',
      title: `${metricLabel(secondMetric)} by ${dimensionLabel(dims[0])} — ${timePeriodLabel}`,
      dataKey: secondMetric,
      xAxisKey,
      data: primaryData,
      colors: [COLORS[1], COLORS[2], COLORS[3], COLORS[4], COLORS[5], COLORS[0]],
      showLegend: false,
    });
  }

  // Revenue vs Profit comparison chart if not already shown
  if (dataKeys.length === 1 && primaryMetric === 'revenue' && qi.aggregationType !== 'top' && qi.aggregationType !== 'bottom') {
    charts.push({
      id: 'profit-comparison',
      type: dims.includes('month') || dims.includes('quarter') ? 'area' : 'grouped-bar',
      title: `Revenue vs Profit — ${timePeriodLabel}`,
      dataKey: ['revenue', 'profit'],
      xAxisKey,
      data: primaryData,
      colors: [COLORS[0], COLORS[1]],
      showLegend: true,
    });
  }

  // Secondary dimension chart
  if (secondaryData && secondaryData.length > 0) {
    const secondDim = dims[1];
    charts.push({
      id: 'secondary-dim',
      type: 'bar',
      title: `${metricLabel(primaryMetric)} by ${dimensionLabel(secondDim)} — ${timePeriodLabel}`,
      dataKey: primaryMetric,
      xAxisKey: secondDim === 'region' ? 'region' : secondDim === 'category' ? 'category' : secondDim === 'month' ? 'month' : 'quarter',
      data: secondaryData,
      colors: COLORS,
      showLegend: false,
    });
  }

  // If we only have 1 chart and no secondary data, add a pie breakdown
  if (charts.length === 1 && primaryType !== 'pie' && primaryData.length <= 8) {
    charts.push({
      id: 'pie-breakdown',
      type: 'pie',
      title: `${metricLabel(primaryMetric)} Distribution — ${timePeriodLabel}`,
      dataKey: primaryMetric,
      xAxisKey,
      data: primaryData,
      colors: COLORS,
      showLegend: true,
    });
  }

  // Limit to 4 charts
  return charts.slice(0, 4);
}
