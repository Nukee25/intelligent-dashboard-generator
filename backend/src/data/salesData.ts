export interface SaleRecord {
  date: string;
  month: string;
  monthNum: number;
  year: number;
  quarter: number;
  region: string;
  category: string;
  revenue: number;
  units: number;
  profit: number;
  customerCount: number;
}

export const REGIONS = ['North', 'South', 'East', 'West'];
export const CATEGORIES = ['Electronics', 'Clothing', 'Food & Beverage', 'Home & Garden', 'Sports', 'Books'];
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const BASE_REVENUE: Record<string, number> = {
  Electronics: 50000,
  Clothing: 30000,
  'Food & Beverage': 20000,
  'Home & Garden': 25000,
  Sports: 22000,
  Books: 8000,
};

const MARGIN: Record<string, number> = {
  Electronics: 0.30,
  Clothing: 0.40,
  'Food & Beverage': 0.20,
  'Home & Garden': 0.35,
  Sports: 0.32,
  Books: 0.45,
};

const REGION_MULTIPLIER: Record<string, number> = {
  North: 1.2,
  South: 1.1,
  East: 1.0,
  West: 1.15,
};

// Seasonality by month (1-indexed)
const SEASONALITY: number[] = [0.8, 0.85, 0.95, 1.0, 1.05, 1.1, 1.15, 1.1, 1.0, 1.05, 1.3, 1.4];

// Deterministic variation based on indices to avoid Math.random()
function deterministicVariation(seed1: number, seed2: number, seed3: number, seed4: number): number {
  const val = ((seed1 * 17 + seed2 * 31 + seed3 * 7 + seed4 * 13) % 20) / 100; // 0..0.19
  return 0.92 + val; // 0.92..1.11
}

function generateSalesData(): SaleRecord[] {
  const records: SaleRecord[] = [];
  const years = [2023, 2024];

  years.forEach((year, yIdx) => {
    MONTHS.forEach((month, mIdx) => {
      const monthNum = mIdx + 1;
      const quarter = Math.ceil(monthNum / 3);
      const seasonality = SEASONALITY[mIdx];

      REGIONS.forEach((region, rIdx) => {
        CATEGORIES.forEach((category, cIdx) => {
          const base = BASE_REVENUE[category];
          const regionMul = REGION_MULTIPLIER[region];
          const variation = deterministicVariation(yIdx, mIdx, rIdx, cIdx);

          const revenue = Math.round(base * regionMul * seasonality * variation);
          const margin = MARGIN[category];
          const profit = Math.round(revenue * margin);
          const avgPrice = category === 'Electronics' ? 250 : category === 'Clothing' ? 45 : category === 'Food & Beverage' ? 15 : category === 'Home & Garden' ? 60 : category === 'Sports' ? 55 : 18;
          const units = Math.round(revenue / avgPrice);
          const customerCount = Math.round(units * (0.6 + (cIdx * 0.05)));

          records.push({
            date: `${year}-${String(monthNum).padStart(2, '0')}-01`,
            month,
            monthNum,
            year,
            quarter,
            region,
            category,
            revenue,
            units,
            profit,
            customerCount,
          });
        });
      });
    });
  });

  return records;
}

export const salesData: SaleRecord[] = generateSalesData();
