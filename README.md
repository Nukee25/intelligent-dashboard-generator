# Intelligent Dashboard Generator

Generate fully interactive data dashboards from plain English prompts. Describe what you want in natural language and the system — powered by the **Gemini AI** — will parse your intent, query the sales dataset, pick the right chart types, and render a live dashboard instantly.

## Features

- 🤖 **Gemini AI-powered** natural language understanding (with rule-based fallback when no API key is set)
- 📊 Interactive charts — line, area, bar, grouped bar, and pie via Recharts
- 📈 KPI summary cards with year-over-year trend indicators
- 🔍 24 months of sample sales data (4 regions × 6 product categories)
- ⚡ React + TypeScript frontend, Express backend

## Quick Start

### 1. Install dependencies

```bash
# Frontend
npm install

# Backend
cd backend && npm install && cd ..
```

### 2. Configure Gemini API key (optional but recommended)

```bash
cp backend/.env.example backend/.env
# Edit backend/.env and add your GEMINI_API_KEY
```

Get a free API key at <https://aistudio.google.com/app/apikey>.

> Without a key the system falls back to the built-in rule-based parser — all features still work.

### 3. Run both servers

```bash
npm run dev:all
```

- Frontend: <http://localhost:5173>
- Backend API: <http://localhost:3001>

Or run them separately:

```bash
npm run dev            # frontend only
npm run backend:dev    # backend only (requires ts-node-dev)
```

### 4. Build for production

```bash
npm run build          # frontend
npm run backend:build  # backend (outputs to backend/dist/)
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check; includes `geminiConfigured` flag |
| `GET` | `/api/data` | Raw sales dataset (filterable by `region`, `category`, `year`) |
| `POST` | `/api/dashboard` | Generate a dashboard from a prompt |

### POST /api/dashboard

**Request body:**
```json
{ "prompt": "Show me monthly sales revenue for Q3 2024 broken down by region" }
```

**Response:**
```json
{
  "intent": { ... },
  "kpis": [ ... ],
  "charts": [ ... ],
  "totalRecords": 72,
  "timePeriodLabel": "Q3 2024",
  "aiGenerated": true
}
```

`aiGenerated: true` means the intent was parsed by Gemini; `false` means the rule-based fallback was used.

## Example Prompts

- *"Show me monthly sales revenue for Q3 2024 broken down by region"*
- *"Compare product category performance for 2024"*
- *"What are the top performing regions by profit this year?"*
- *"Show revenue trend for Electronics category over the past year"*
- *"Give me a complete sales overview for Q4 2024"*

