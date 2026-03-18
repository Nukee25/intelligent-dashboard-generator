export interface DashboardIntent {
  timePeriod: {
    type: 'quarter' | 'month' | 'year' | 'range' | 'all';
    quarter?: number;
    month?: number;
    year?: number;
    startMonth?: number;
    endMonth?: number;
    startYear?: number;
    endYear?: number;
    label: string;
  };
  metrics: Array<'revenue' | 'profit' | 'units' | 'customerCount'>;
  dimensions: Array<'region' | 'category' | 'month' | 'quarter'>;
  aggregationType: 'total' | 'average' | 'trend' | 'compare' | 'top' | 'bottom';
  chartPreference?: 'bar' | 'line' | 'pie' | 'area';
  highlightTop: boolean;
  highlightBottom: boolean;
  topN?: number;
  filterRegion?: string;
  filterCategory?: string;
  rawPrompt: string;
}

export function parsePrompt(prompt: string): DashboardIntent {
  const lower = prompt.toLowerCase();

  // --- Time period ---
  let timePeriod: DashboardIntent['timePeriod'] = { type: 'all', label: 'All Time' };

  const quarterMatch = lower.match(/q([1-4])/);
  const yearMatch = lower.match(/\b(2023|2024)\b/);
  const year = yearMatch ? parseInt(yearMatch[1]) : undefined;

  if (lower.includes('this year')) {
    timePeriod = { type: 'year', year: 2024, label: '2024' };
  } else if (lower.includes('last year')) {
    timePeriod = { type: 'year', year: 2023, label: '2023' };
  } else if (lower.includes('past year')) {
    timePeriod = { type: 'range', startYear: 2023, endYear: 2024, startMonth: 1, endMonth: 12, label: 'Past Year' };
  } else if (lower.includes('all time') || lower.includes('overall') || lower.includes('all data')) {
    timePeriod = { type: 'all', label: 'All Time' };
  } else if (quarterMatch) {
    const q = parseInt(quarterMatch[1]);
    const startMonth = (q - 1) * 3 + 1;
    const endMonth = q * 3;
    timePeriod = {
      type: 'quarter',
      quarter: q,
      year,
      startMonth,
      endMonth,
      ...(year ? { startYear: year, endYear: year } : {}),
      label: year ? `Q${q} ${year}` : `Q${q}`,
    };
  } else if (year) {
    timePeriod = { type: 'year', year, label: String(year) };
  }

  // --- Metrics ---
  const metrics: DashboardIntent['metrics'] = [];
  if (lower.includes('revenue') || lower.includes('sales') || lower.includes('income')) metrics.push('revenue');
  if (lower.includes('profit') || lower.includes('margin')) metrics.push('profit');
  if (lower.includes('unit') || lower.includes('volume') || lower.includes('quantity')) metrics.push('units');
  if (lower.includes('customer') || lower.includes('buyer')) metrics.push('customerCount');
  if (metrics.length === 0) metrics.push('revenue');

  // --- Dimensions ---
  const dimensions: DashboardIntent['dimensions'] = [];
  if (lower.includes('region') || lower.includes('area') || lower.includes('north') || lower.includes('south') || lower.includes('east') || lower.includes('west')) {
    dimensions.push('region');
  }
  if (lower.includes('category') || lower.includes('product') || lower.includes('segment') || lower.includes('type') ||
      lower.includes('electronics') || lower.includes('clothing') || lower.includes('food') || lower.includes('garden') || lower.includes('sports') || lower.includes('books')) {
    dimensions.push('category');
  }
  if (lower.includes('monthly') || lower.includes('month') || lower.includes('over time') || lower.includes('trend') || lower.includes('per month')) {
    dimensions.push('month');
  }
  if (lower.includes('quarterly') || lower.includes('quarter') || lower.includes('per quarter')) {
    dimensions.push('quarter');
  }
  if (dimensions.length === 0) {
    // default dimension based on context
    if (lower.includes('overview') || lower.includes('complete') || lower.includes('full')) {
      dimensions.push('category');
      dimensions.push('region');
    } else {
      dimensions.push('category');
    }
  }

  // --- Aggregation type ---
  let aggregationType: DashboardIntent['aggregationType'] = 'total';
  if (lower.includes('top') || lower.includes('best') || lower.includes('highest') || lower.includes('leading')) {
    aggregationType = 'top';
  } else if (lower.includes('worst') || lower.includes('lowest') || lower.includes('bottom') || lower.includes('least')) {
    aggregationType = 'bottom';
  } else if (lower.includes('trend') || lower.includes('over time') || lower.includes('over the')) {
    aggregationType = 'trend';
    if (!dimensions.includes('month')) dimensions.push('month');
  } else if (lower.includes('compare') || lower.includes('comparison') || lower.includes('breakdown') || lower.includes('vs') || lower.includes('versus') || lower.includes('performance')) {
    aggregationType = 'compare';
  } else if (lower.includes('average') || lower.includes('avg') || lower.includes('mean')) {
    aggregationType = 'average';
  }

  // Ensure month dimension for trend
  if (aggregationType === 'trend' && !dimensions.includes('month')) {
    dimensions.push('month');
  }

  // --- Chart preference ---
  let chartPreference: DashboardIntent['chartPreference'] | undefined;
  if (lower.includes('pie') || lower.includes('donut')) chartPreference = 'pie';
  else if (lower.includes('line') || lower.includes('trend')) chartPreference = 'line';
  else if (lower.includes('bar') || lower.includes('chart')) chartPreference = 'bar';
  else if (lower.includes('area')) chartPreference = 'area';

  // --- Top N ---
  const topNMatch = lower.match(/top\s+(\d+)/);
  const topN = topNMatch ? parseInt(topNMatch[1]) : 5;

  // --- Highlight flags ---
  const highlightTop = lower.includes('top') || lower.includes('best') || lower.includes('highest');
  const highlightBottom = lower.includes('worst') || lower.includes('bottom') || lower.includes('lowest');

  // --- Filters ---
  let filterRegion: string | undefined;
  if (lower.includes('north')) filterRegion = 'North';
  else if (lower.includes('south')) filterRegion = 'South';
  else if (lower.includes('east')) filterRegion = 'East';
  else if (lower.includes('west')) filterRegion = 'West';

  let filterCategory: string | undefined;
  if (lower.includes('electronics')) filterCategory = 'Electronics';
  else if (lower.includes('clothing')) filterCategory = 'Clothing';
  else if (lower.includes('food')) filterCategory = 'Food & Beverage';
  else if (lower.includes('home') || lower.includes('garden')) filterCategory = 'Home & Garden';
  else if (lower.includes('sports')) filterCategory = 'Sports';
  else if (lower.includes('books')) filterCategory = 'Books';

  // If category filter is set, remove category from dimensions (no point grouping by a single category)
  if (filterCategory && dimensions.includes('category') && dimensions.length > 1) {
    const idx = dimensions.indexOf('category');
    dimensions.splice(idx, 1);
  }

  return {
    timePeriod,
    metrics,
    dimensions,
    aggregationType,
    chartPreference,
    highlightTop,
    highlightBottom,
    topN,
    filterRegion,
    filterCategory,
    rawPrompt: prompt,
  };
}
