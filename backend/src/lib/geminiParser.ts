import { GoogleGenerativeAI } from '@google/generative-ai';
import { parsePrompt, type DashboardIntent } from './nlpParser';

const SYSTEM_CONTEXT = `You are a data analytics assistant. Extract a structured dashboard intent from the user's natural language query.

The dataset contains sales records from January 2023 to December 2024 with these fields:
- Regions: North, South, East, West
- Categories: Electronics, Clothing, Food & Beverage, Home & Garden, Sports, Books
- Metrics: revenue, profit, units (quantity sold), customerCount
- Time: by month, quarter (Q1-Q4), year (2023 or 2024)

Respond with ONLY valid JSON matching this exact schema (no markdown, no extra text):
{
  "timePeriod": {
    "type": "quarter" | "month" | "year" | "range" | "all",
    "quarter": <1-4 or omit>,
    "month": <1-12 or omit>,
    "year": <2023 | 2024 or omit>,
    "startMonth": <1-12 or omit>,
    "endMonth": <1-12 or omit>,
    "startYear": <2023 | 2024 or omit>,
    "endYear": <2023 | 2024 or omit>,
    "label": "<human-readable label like 'Q3 2024' or '2024' or 'All Time'>"
  },
  "metrics": ["revenue" | "profit" | "units" | "customerCount"],
  "dimensions": ["region" | "category" | "month" | "quarter"],
  "aggregationType": "total" | "average" | "trend" | "compare" | "top" | "bottom",
  "chartPreference": "bar" | "line" | "pie" | "area" | null,
  "highlightTop": true | false,
  "highlightBottom": true | false,
  "topN": <number, default 5>,
  "filterRegion": "North" | "South" | "East" | "West" | null,
  "filterCategory": "Electronics" | "Clothing" | "Food & Beverage" | "Home & Garden" | "Sports" | "Books" | null
}

Rules:
- metrics must have at least one entry; default to ["revenue"] if unclear
- dimensions must have at least one entry; default to ["category"] if unclear
- Use "trend" aggregationType when the query asks about time series/over time
- Use "compare" for breakdowns and comparisons
- Use "top" / "bottom" for ranking queries
- If a quarter is mentioned (e.g. "Q3"), set startMonth and endMonth accordingly (Q1=1-3, Q2=4-6, Q3=7-9, Q4=10-12)
- "this year" = 2024, "last year" = 2023`;

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

export async function parsePromptWithGemini(
  prompt: string
): Promise<{ intent: DashboardIntent; aiGenerated: boolean }> {
  const client = getClient();

  if (!client) {
    // No API key — use rule-based fallback
    return { intent: parsePrompt(prompt), aiGenerated: false };
  }

  try {
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent([
      { text: SYSTEM_CONTEXT },
      { text: `User query: ${prompt}` },
    ]);

    const raw = result.response.text().trim();

    // Strip any accidental markdown fences
    const jsonText = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');

    const parsed = JSON.parse(jsonText) as Partial<DashboardIntent>;

    // Validate and normalise required fields, filling defaults if Gemini omitted them
    const intent: DashboardIntent = {
      timePeriod: parsed.timePeriod ?? { type: 'all', label: 'All Time' },
      metrics: Array.isArray(parsed.metrics) && parsed.metrics.length > 0
        ? parsed.metrics
        : ['revenue'],
      dimensions: Array.isArray(parsed.dimensions) && parsed.dimensions.length > 0
        ? parsed.dimensions
        : ['category'],
      aggregationType: parsed.aggregationType ?? 'total',
      chartPreference: parsed.chartPreference ?? undefined,
      highlightTop: parsed.highlightTop ?? false,
      highlightBottom: parsed.highlightBottom ?? false,
      topN: typeof parsed.topN === 'number' ? parsed.topN : 5,
      filterRegion: parsed.filterRegion ?? undefined,
      filterCategory: parsed.filterCategory ?? undefined,
      rawPrompt: prompt,
    };

    return { intent, aiGenerated: true };
  } catch {
    // Gemini call failed — fall back gracefully to rule-based parser
    return { intent: parsePrompt(prompt), aiGenerated: false };
  }
}
