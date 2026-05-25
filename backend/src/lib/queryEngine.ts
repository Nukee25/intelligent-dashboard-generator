import type { SaleRecord } from '../data/salesData';
import { MONTHS } from '../data/salesData';
import type { DashboardIntent } from './nlpParser';

export interface AggregatedDataPoint {
  [key: string]: string | number;
}

export interface KPIData {
  label: string;
  value: number;
  type: 'currency' | 'number' | 'percentage';
  trend?: number;
}

export interface QueryResult {
  primaryData: AggregatedDataPoint[];
  secondaryData?: AggregatedDataPoint[];
  kpis: KPIData[];
  xAxisKey: string;
  dataKeys: string[];
  intent: DashboardIntent;
  totalRecords: number;
}

function filterData(intent: DashboardIntent, data: SaleRecord[]): SaleRecord[] {
  return data.filter((record) => {
    const { timePeriod, filterRegion, filterCategory } = intent;

    if (filterRegion && record.region !== filterRegion) return false;
    if (filterCategory && record.category !== filterCategory) return false;

    if (timePeriod.type === 'all') return true;

    if (timePeriod.type === 'year') {
      return record.year === timePeriod.year;
    }

    if (timePeriod.type === 'quarter') {
      const yearMatch = timePeriod.year ? record.year === timePeriod.year : true;
      return yearMatch && timePeriod.startMonth !== undefined && timePeriod.endMonth !== undefined &&
        record.monthNum >= timePeriod.startMonth && record.monthNum <= timePeriod.endMonth;
    }

    if (timePeriod.type === 'range') {
      if (timePeriod.startYear !== undefined && timePeriod.endYear !== undefined) {
        return record.year >= timePeriod.startYear && record.year <= timePeriod.endYear;
      }
      if (timePeriod.startMonth !== undefined && timePeriod.endMonth !== undefined) {
        return record.monthNum >= timePeriod.startMonth && record.monthNum <= timePeriod.endMonth;
      }
    }

    return true;
  });
}

type MetricKey = 'revenue' | 'profit' | 'units' | 'customerCount';

function aggregateBy(
  records: SaleRecord[],
  groupByKey: keyof SaleRecord,
  metrics: MetricKey[]
): AggregatedDataPoint[] {
  const map = new Map<string, AggregatedDataPoint>();

  for (const record of records) {
    const key = String(record[groupByKey]);
    if (!map.has(key)) {
      const point: AggregatedDataPoint = { [groupByKey]: key };
      for (const m of metrics) point[m] = 0;
      map.set(key, point);
    }
    const point = map.get(key)!;
    for (const m of metrics) {
      (point[m] as number) += record[m];
    }
  }

  return Array.from(map.values());
}

function aggregateByMonth(records: SaleRecord[], metrics: MetricKey[]): AggregatedDataPoint[] {
  const map = new Map<string, AggregatedDataPoint>();

  for (const record of records) {
    const key = record.year > 2023 || records.some(r => r.year !== record.year)
      ? `${record.month} ${record.year}`
      : record.month;
    const sortKey = `${record.year}-${String(record.monthNum).padStart(2, '0')}`;

    if (!map.has(key)) {
      const point: AggregatedDataPoint = { month: key, sortKey, monthNum: record.monthNum, year: record.year };
      for (const m of metrics) point[m] = 0;
      map.set(key, point);
    }
    const point = map.get(key)!;
    for (const m of metrics) {
      (point[m] as number) += record[m];
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    String(a.sortKey).localeCompare(String(b.sortKey))
  );
}

function aggregateByQuarter(records: SaleRecord[], metrics: MetricKey[]): AggregatedDataPoint[] {
  const map = new Map<string, AggregatedDataPoint>();

  for (const record of records) {
    const key = `Q${record.quarter} ${record.year}`;
    if (!map.has(key)) {
      const point: AggregatedDataPoint = { quarter: key, sortKey: `${record.year}-${record.quarter}` };
      for (const m of metrics) point[m] = 0;
      map.set(key, point);
    }
    const point = map.get(key)!;
    for (const m of metrics) {
      (point[m] as number) += record[m];
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    String(a.sortKey).localeCompare(String(b.sortKey))
  );
}

function computeKPIs(filtered: SaleRecord[], allData: SaleRecord[], intent: DashboardIntent): KPIData[] {
  const totalRevenue = filtered.reduce((s, r) => s + r.revenue, 0);
  const totalProfit = filtered.reduce((s, r) => s + r.profit, 0);
  const totalUnits = filtered.reduce((s, r) => s + r.units, 0);
  const totalCustomers = filtered.reduce((s, r) => s + r.customerCount, 0);
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Compute prior period for trend
  let priorRevenue = 0;
  let priorProfit = 0;
  if (intent.timePeriod.type === 'year' && intent.timePeriod.year) {
    const priorYear = intent.timePeriod.year - 1;
    const priorData = allData.filter(r => {
      if (r.year !== priorYear) return false;
      if (intent.filterRegion && r.region !== intent.filterRegion) return false;
      if (intent.filterCategory && r.category !== intent.filterCategory) return false;
      return true;
    });
    priorRevenue = priorData.reduce((s, r) => s + r.revenue, 0);
    priorProfit = priorData.reduce((s, r) => s + r.profit, 0);
  }

  const revenueTrend = priorRevenue > 0 ? ((totalRevenue - priorRevenue) / priorRevenue) * 100 : undefined;
  const profitTrend = priorProfit > 0 ? ((totalProfit - priorProfit) / priorProfit) * 100 : undefined;

  return [
    { label: 'Total Revenue', value: totalRevenue, type: 'currency', trend: revenueTrend },
    { label: 'Total Profit', value: totalProfit, type: 'currency', trend: profitTrend },
    { label: 'Profit Margin', value: parseFloat(profitMargin.toFixed(1)), type: 'percentage' },
    { label: 'Total Units Sold', value: totalUnits, type: 'number' },
    { label: 'Total Customers', value: totalCustomers, type: 'number' },
  ];
}

export function queryData(intent: DashboardIntent, data: SaleRecord[]): QueryResult {
  const filtered = filterData(intent, data);
  const metrics = intent.metrics as MetricKey[];

  if (filtered.length === 0) {
    return {
      primaryData: [],
      kpis: [],
      xAxisKey: 'name',
      dataKeys: metrics,
      intent,
      totalRecords: 0,
    };
  }

  const kpis = computeKPIs(filtered, data, intent);

  let primaryData: AggregatedDataPoint[] = [];
  let xAxisKey = 'name';
  let secondaryData: AggregatedDataPoint[] | undefined;

  const dims = intent.dimensions;
  const primaryDim = dims[0];

  if (primaryDim === 'month') {
    primaryData = aggregateByMonth(filtered, metrics);
    xAxisKey = 'month';
  } else if (primaryDim === 'quarter') {
    primaryData = aggregateByQuarter(filtered, metrics);
    xAxisKey = 'quarter';
  } else if (primaryDim === 'region') {
    primaryData = aggregateBy(filtered, 'region', metrics);
    xAxisKey = 'region';
  } else if (primaryDim === 'category') {
    primaryData = aggregateBy(filtered, 'category', metrics);
    xAxisKey = 'category';
  } else {
    primaryData = aggregateBy(filtered, 'category', metrics);
    xAxisKey = 'category';
  }

  // Sort and limit for top/bottom
  if (intent.aggregationType === 'top' || intent.aggregationType === 'bottom') {
    const primaryMetric = metrics[0];
    primaryData.sort((a, b) => (b[primaryMetric] as number) - (a[primaryMetric] as number));
    if (intent.aggregationType === 'bottom') primaryData.reverse();
    const n = intent.topN ?? 5;
    primaryData = primaryData.slice(0, n);
  }

  // If multiple dimensions, generate secondary data for the second dimension
  if (dims.length > 1) {
    const secondDim = dims[1];
    if (secondDim === 'region') {
      secondaryData = aggregateBy(filtered, 'region', metrics);
      xAxisKey = primaryDim === 'month' ? 'month' : primaryDim === 'quarter' ? 'quarter' : primaryDim === 'region' ? 'region' : 'category';
    } else if (secondDim === 'category') {
      secondaryData = aggregateBy(filtered, 'category', metrics);
    } else if (secondDim === 'month') {
      secondaryData = aggregateByMonth(filtered, metrics);
    }
  }

  // For 'compare' with month dimension, show month labels using MONTHS abbreviations
  if (intent.aggregationType === 'trend' && primaryDim === 'month') {
    // Already handled above
  }

  // Ensure month labels are short when only one year
  const years = [...new Set(filtered.map(r => r.year))];
  if (years.length === 1 && primaryDim === 'month') {
    primaryData = primaryData.map(d => ({ ...d, month: MONTHS[(d.monthNum as number) - 1] }));
  }

  return {
    primaryData,
    secondaryData,
    kpis,
    xAxisKey,
    dataKeys: metrics,
    intent,
    totalRecords: filtered.length,
  };
}
