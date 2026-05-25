import { Router, Request, Response } from 'express';
import { parsePromptWithGemini } from '../lib/geminiParser';
import { queryData } from '../lib/queryEngine';
import { selectCharts } from '../lib/chartSelector';
import { salesData } from '../data/salesData';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

router.get('/data', (req: Request, res: Response) => {
  const { region, category, year } = req.query;
  let data = salesData;
  if (typeof region === 'string') data = data.filter(r => r.region === region);
  if (typeof category === 'string') data = data.filter(r => r.category === category);
  if (typeof year === 'string') data = data.filter(r => r.year === parseInt(year));
  res.json({ count: data.length, data });
});

router.post('/dashboard', async (req: Request, res: Response) => {
  const { prompt } = req.body as { prompt?: string };
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    res.status(400).json({ error: 'prompt is required' });
    return;
  }

  const { intent, aiGenerated } = await parsePromptWithGemini(prompt.trim());
  const queryResult = queryData(intent, salesData);
  const charts = selectCharts(intent, queryResult);

  res.json({
    intent,
    kpis: queryResult.kpis,
    charts,
    primaryData: queryResult.primaryData,
    secondaryData: queryResult.secondaryData,
    xAxisKey: queryResult.xAxisKey,
    dataKeys: queryResult.dataKeys,
    totalRecords: queryResult.totalRecords,
    timePeriodLabel: intent.timePeriod.label,
    aiGenerated,
  });
});

export default router;
