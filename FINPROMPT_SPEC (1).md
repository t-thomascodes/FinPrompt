# FinPrompt — Full Project Specification

## What This Is

FinPrompt is an AI-powered workflow tool for asset management firms. It standardizes how a firm uses AI by providing a centralized library of structured prompt templates mapped to core finance functions, enriched with live market data, and exportable in professional formats (Word, Excel, PowerPoint).

This is a **portfolio project** for a co-op application to Finepoint Capital LP, a $4.9B Boston-based hedge fund. Their AI Co-Op role's #1 responsibility is "build a comprehensive firmwide prompt database to facilitate AI implementation across each functional area." This tool is a working prototype of exactly that.

---

## Tech Stack

### Framework
- **Next.js 14+ (App Router)** — React frontend + API routes for server-side operations
- **TypeScript** — type safety across the project
- **Tailwind CSS** — styling (use custom theme tokens below, not defaults)

### Key Dependencies
```json
{
  "dependencies": {
    "next": "^14",
    "react": "^18",
    "docx": "^8",
    "exceljs": "^4",
    "pptxgenjs": "^3",
    "@anthropic-ai/sdk": "^0.30"
  }
}
```

- **`docx`** — server-side Word document generation (proper .docx with formatting, headers, tables)
- **`exceljs`** — server-side Excel generation (formatted sheets, multiple tabs, styled tables)
- **`pptxgenjs`** — server-side PowerPoint generation (dark-themed slides, structured content)
- **`@anthropic-ai/sdk`** — Anthropic Claude API (server-side, keeps API key secure)

### Why Server-Side Exports
The document generation libraries (`docx`, `exceljs`, `pptxgenjs`) are all Node.js packages that work best server-side. Running them in API routes means:
- Proper file generation with full library capabilities
- API keys stay on the server (Claude API key, Alpha Vantage key)
- Clean client experience — user clicks export, gets a file download
- No heavy library bundles shipped to the browser

### Deployment
- **Vercel** (free tier) — automatic deployments from GitHub
- Environment variables for API keys (`ANTHROPIC_API_KEY`, `ALPHA_VANTAGE_API_KEY`)

---

## Project Structure

```
finprompt/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, fonts, metadata
│   │   ├── page.tsx                # Main app page
│   │   ├── api/
│   │   │   ├── execute/
│   │   │   │   └── route.ts        # POST — run workflow (fetch market data + call Claude)
│   │   │   └── export/
│   │   │       ├── docx/
│   │   │       │   └── route.ts    # POST — generate and return .docx
│   │   │       ├── xlsx/
│   │   │       │   └── route.ts    # POST — generate and return .xlsx
│   │   │       └── pptx/
│   │   │           └── route.ts    # POST — generate and return .pptx
│   ├── components/
│   │   ├── FinPrompt.tsx           # Main app shell (tabs, layout)
│   │   ├── Header.tsx              # Top nav: logo, tabs (Workflows/Logs/Analytics), settings
│   │   ├── Sidebar.tsx             # Category list + workflow template list
│   │   ├── WorkflowConfig.tsx      # Variable inputs, edit/fork, execute button
│   │   ├── OutputPanel.tsx         # Streaming output display + export bar
│   │   ├── ExportBar.tsx           # Export buttons (docx, xlsx, pptx, copy)
│   │   ├── DataPreview.tsx         # Collapsible market data panel
│   │   ├── LogsList.tsx            # Logs tab — list of all runs
│   │   ├── LogDetail.tsx           # Individual log view with full output + export
│   │   ├── Analytics.tsx           # Analytics dashboard with stats and charts
│   │   ├── Settings.tsx            # API key configuration panel
│   │   └── StarRating.tsx          # Reusable 5-star rating component
│   ├── lib/
│   │   ├── categories.ts           # Workflow categories and prompt templates (data)
│   │   ├── seedLogs.ts             # Fake seed data for demo mode
│   │   ├── marketData.ts           # Alpha Vantage fetch + formatting functions
│   │   ├── parseOutput.ts          # Markdown-to-structured parser (for UI + exports)
│   │   ├── exportDocx.ts           # Word document generation logic
│   │   ├── exportXlsx.ts           # Excel workbook generation logic
│   │   ├── exportPptx.ts           # PowerPoint deck generation logic
│   │   └── types.ts                # Shared TypeScript interfaces
│   └── styles/
│       └── globals.css             # Tailwind base + custom scrollbar styles + animations
├── public/
│   └── favicon.ico
├── tailwind.config.ts              # Custom theme tokens
├── tsconfig.json
├── package.json
├── .env.local                      # API keys (gitignored)
├── .env.example                    # Template for env vars
└── README.md
```

---

## Data Model

### Types (`lib/types.ts`)

```typescript
interface Category {
  id: string;                  // "research" | "risk" | "operations" | "data"
  label: string;               // "Equity Research"
  icon: string;                // "◈"
  color: string;               // "#00D4AA"
  prompts: PromptTemplate[];
}

interface PromptTemplate {
  id: string;                  // "bull-bear"
  title: string;               // "Bull/Bear Case Generator"
  description: string;
  template: string;            // Prompt with {{VARIABLE}} placeholders
  variables: Variable[];
  enrichTicker?: string;       // Key of the variable that contains the ticker (enables LIVE data)
}

interface Variable {
  key: string;                 // "TICKER"
  label: string;               // "Ticker"
  placeholder: string;         // "e.g. AAPL"
}

interface WorkflowLog {
  id: number;
  promptId: string;
  promptTitle: string;
  categoryId: string;
  inputs: string;              // Comma-separated input values
  variables: Record<string, string>;
  output: string;              // Full Claude response text
  marketData: string;          // Raw market data that was injected
  hadData: boolean;            // Whether live data was used
  timestamp: string;
  rating: number;              // 0-5 stars
  fullPrompt: string;          // The complete assembled prompt that was sent
}

interface MarketDataResult {
  quote: Record<string, string> | null;
  overview: Record<string, string> | null;
  news: Array<{ title: string; source: string; overall_sentiment_label: string }>;
  formatted: string;           // The formatted text block injected into prompt
}
```

---

## Workflow Categories & Templates

### Research (color: #00D4AA)
1. **Bull/Bear Case Generator** [LIVE] — Structured investment theses with live fundamentals
2. **Earnings Call Prep** [LIVE] — Key questions, consensus expectations, surprise scenarios
3. **Comparable Company Screen** [LIVE] — Peer framework with valuation multiples

### Risk & Compliance (color: #FF6B6B)
4. **Position Risk Assessment** [LIVE] — Market, liquidity, event, correlation risk with hedging recs
5. **Compliance Pre-Trade Check** — Regulatory flags, concentration limits, disclosure requirements

### Fund Operations (color: #4ECDC4)
6. **Investor Letter Draft** — Quarterly update with performance, positioning, outlook
7. **Process Automation Spec** — Scoping doc for automating manual fund operations

### Data Analysis (color: #FFE66D)
8. **Dataset Explorer** — Structured analysis plan with Python code skeleton
9. **SQL Query Builder** — Optimized queries with performance notes and validation

[LIVE] = auto-fetches market data from Alpha Vantage before sending to Claude. Templates tagged LIVE have an `enrichTicker` field pointing to the variable that contains the ticker symbol.

Each template's full prompt text is in the existing `finprompt.jsx` file — port them directly.

---

## API Routes

### `POST /api/execute`

The core workflow execution endpoint. Handles data enrichment + Claude API call.

**Request body:**
```json
{
  "template": "full prompt template string",
  "variables": { "TICKER": "NVDA", "COMPANY_NAME": "NVIDIA Corp" },
  "enrichTicker": "TICKER"
}
```

**Logic:**
1. If `enrichTicker` is set and the corresponding variable has a value:
   - Fetch from Alpha Vantage in parallel: `GLOBAL_QUOTE`, `OVERVIEW`, `NEWS_SENTIMENT`
   - Format into structured text block
2. Replace all `{{VARIABLE}}` placeholders including `{{MARKET_DATA}}`
3. Call Claude API (`claude-sonnet-4-20250514`, max_tokens: 4096)
4. Return response

**Response:**
```json
{
  "output": "Claude's response text",
  "marketData": "formatted market data string",
  "hadData": true
}
```

### `POST /api/export/docx`

**Request body:**
```json
{
  "title": "Bull/Bear Case: NVDA — NVIDIA Corp",
  "output": "full output text",
  "marketData": "market data string (optional)",
  "category": "Equity Research",
  "inputs": "NVDA, NVIDIA Corp",
  "timestamp": "4/10/2026, 9:14:22 AM"
}
```

**Response:** Binary `.docx` file with `Content-Disposition: attachment`

**Document structure:**
- Header: "FinPrompt" branding, small gray text
- Title: Workflow name + inputs, bold, large
- Subtitle: Category + timestamp
- Horizontal rule
- If market data present: "Data Context" section in smaller font, or formatted as a table
- Main body: Parse markdown into proper Word formatting:
  - `**text**` → bold runs
  - `1. **Header**` → numbered heading + bold
  - `- item` → bullet list (use proper Word numbering, NOT unicode bullets)
  - Code blocks → monospace font, light gray background shading
  - Tables → proper Word tables with borders
- Footer: "Generated by FinPrompt · [timestamp]"
- Font: Arial, 11pt body, 14pt title
- Use the `docx` npm package (see their docs for Paragraph, TextRun, Table, etc.)

### `POST /api/export/xlsx`

**Request body:** Same as docx

**Response:** Binary `.xlsx` file

**Workbook structure:**
- **Sheet 1 "Analysis"**: Main output
  - Row 1: Title (bold, merged cells)
  - Row 2: Category · Timestamp
  - Row 3: blank
  - Row 4+: Output text, with section headers in bold. Parse any markdown tables into actual Excel tables with header rows styled.
- **Sheet 2 "Market Data"** (if enriched): Parse the market data into structured rows
  - Column A: Metric name ("P/E Trailing", "Market Cap", etc.)
  - Column B: Value
  - Column C: Category ("Valuation", "Fundamentals", "Trading")
  - Styled as a proper data table with header row, alternating row colors, number formatting
- **Sheet 3 "Metadata"**: Workflow name, inputs, timestamp, rating, full prompt used
- Use `exceljs` for proper formatting (bold, column widths, number formats, colors)
- Style: Professional — no garish colors. Light blue header rows, gray borders, Arial font.

### `POST /api/export/pptx`

**Request body:** Same as docx

**Response:** Binary `.pptx` file

**Slide structure:**
- **Slide 1 (Title):**
  - Dark background (#0A0E17)
  - Workflow title in white, large font
  - Inputs + date in muted gray
  - "FinPrompt" small branding in corner
  - Category-colored accent bar at bottom
- **Slide 2+ (Content):**
  - Parse output by major sections (each `1. **Section Header**` = new slide)
  - Slide title = section header, category-colored
  - Slide body = content under that section, white text on dark background
  - Bullet points properly formatted
- **Final slide (if market data exists):**
  - "Data Context" title
  - Key metrics in a grid layout (2 columns of key-value pairs)
- Use `pptxgenjs` — dark master slide, category-colored accent elements
- Font: Arial or Helvetica, consistent sizing

---

## Alpha Vantage API

Base: `https://www.alphavantage.co/query`

### Endpoints Used
| Function | Params | Returns |
|----------|--------|---------|
| `GLOBAL_QUOTE` | `symbol`, `apikey` | Real-time price, volume, change, open, high, low |
| `OVERVIEW` | `symbol`, `apikey` | Company fundamentals: P/E, margins, market cap, beta, 52-week range, analyst target, revenue, EBITDA, ROE, shares outstanding, dividend yield, sector, industry, description |
| `NEWS_SENTIMENT` | `tickers`, `limit=5`, `apikey` | Recent headlines with source and sentiment label |

### Formatting
The raw API responses need to be formatted into a readable text block that gets injected into the prompt. Format as labeled sections:

```
--- COMPANY OVERVIEW ---
NVIDIA Corp (NVDA) | Technology · Semiconductors
Mkt Cap: $2,874,000,000,000 | EV: $2,841,000,000,000

--- VALUATION ---
P/E: 54.2 | Fwd P/E: 32.8 | PEG: 1.12
P/B: 48.6 | P/S: 29.3 | EV/Rev: 28.1

--- FUNDAMENTALS ---
Rev TTM: $96,300,000,000 | EBITDA: $64,200,000,000
Margin: 55.8% | Op Margin: 62.4% | ROE: 115.7%

--- LIVE QUOTE ---
$142.87 | Chg: +3.42 (+2.45%)
Vol: 312,847,000 | Open: $139.50 | H/L: $143.22/$138.90

--- NEWS ---
1. NVIDIA Blackwell Ultra chips see record demand (Reuters) — Bullish
2. New export controls on AI chips under review (Bloomberg) — Bearish
```

### Rate Limits
- Free tier: 25 requests/day (5 per minute)
- Each workflow execution uses 3 requests (quote + overview + news)
- Handle rate limiting gracefully — if API returns error, proceed without enrichment and show a message

---

## Design System

### Colors (Tailwind custom config)
```javascript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      fp: {
        bg: '#0A0E17',
        surface: '#0C1019',
        border: '#1A2035',
        'border-hover': '#2A3548',
        'text-primary': '#E0E0E0',
        'text-secondary': '#7A8599',
        'text-muted': '#4A5568',
        'text-dim': '#3A4558',
        'text-ghost': '#1E2A42',
        research: '#00D4AA',
        risk: '#FF6B6B',
        operations: '#4ECDC4',
        data: '#FFE66D',
      }
    }
  }
}
```

### Typography
- **Headings / body**: `DM Sans` (Google Fonts)
- **Code / data / labels**: `JetBrains Mono` (Google Fonts)
- Load via `next/font/google` for optimal performance

### UI Conventions
- Dark theme throughout — Bloomberg terminal inspired
- Category colors are used for: active sidebar indicator, execute button gradient, status badges, chart accents
- Buttons: `rounded-md`, category-colored gradient for primary, dark border for secondary
- Status dots: 5-8px circles with subtle `box-shadow` glow
- Section labels: uppercase, tracking-widest, text-xs, muted color
- Cards: surface background, 1px border, rounded-lg
- Inputs: bg-fp-bg, border highlights to category color on focus
- Animations: pulse for loading, blink for cursor, typewriter for output
- Export bar: horizontal row of icon buttons below output, subtle until hovered

---

## State Management

Use React `useState` + `useContext` for simplicity. No Redux/Zustand needed.

### App-level state:
```typescript
- view: "workflows" | "logs" | "analytics"
- activeCategory: string
- selectedPrompt: PromptTemplate | null
- variables: Record<string, string>
- output: string
- loading: boolean
- dataLoading: boolean
- error: string
- marketData: string
- logs: WorkflowLog[]
- apiKeyConfigured: boolean  // server-side, just a boolean flag
- showSettings: boolean
- editingPrompt: PromptTemplate | null
- editText: string
```

### Persistence
- For the demo/portfolio version: seed data is loaded on mount, new runs are stored in-memory only (lost on refresh). This is fine for a demo.
- If you want persistence: add a simple SQLite database via Prisma, or just use `localStorage` for the deployed version (not available in Claude artifacts, but works in a real Next.js app).

---

## Seed Data

The existing `finprompt.jsx` contains 10 realistic seed log entries. Port these into `lib/seedLogs.ts`. They cover:

1. NVDA Bull/Bear Case (research, LIVE, ★★★★★)
2. AAPL Earnings Call Prep (research, LIVE, ★★★★)
3. TSLA Position Risk Assessment (risk, LIVE, ★★★)
4. Investor Letter Draft (operations, ★★★★★)
5. META Bull/Bear Case (research, LIVE, ★★★★)
6. Trade Reconciliation Automation (operations, ★★★★)
7. PANW Comparable Company Screen (research, LIVE, ★★★)
8. SQL Query Builder - Momentum (data, ★★★★★)
9. Compliance Pre-Trade Check (risk, ★★★★)
10. Options Flow Dataset Explorer (data, ★★★)

These make the Logs and Analytics tabs look populated on first load. The full output text for each is in the existing JSX file.

---

## Output Parsing (`lib/parseOutput.ts`)

A shared parser that converts Claude's markdown output into:
1. **React elements** — for rendering in the UI
2. **Structured sections** — for export functions to consume

```typescript
interface ParsedSection {
  type: "heading" | "numbered" | "bullet" | "paragraph" | "code" | "table";
  level?: number;           // heading level or list depth
  title?: string;           // for numbered sections
  content: string;
  children?: ParsedSection[];
}

function parseOutput(text: string): ParsedSection[];
```

### Parsing rules:
- `**text**` on its own line → heading
- `1. **Title** — description` → numbered section (new slide in pptx, new heading in docx)
- `- text` or `• text` → bullet point
- Triple backtick blocks → code (monospace in docx, code box in UI)
- `| col | col |` lines → table (actual table in docx/xlsx, HTML table in UI)
- Empty lines → paragraph break
- Everything else → paragraph text

This parser is critical because it's used by the UI renderer AND all three export functions. Build it once, use it everywhere.

---

## Feature Checklist

### Core (must have for demo)
- [ ] Next.js project scaffolding with Tailwind
- [ ] Port all UI components from existing JSX (Header, Sidebar, WorkflowConfig, OutputPanel, Logs, Analytics)
- [ ] Port all 10 prompt templates and seed data
- [ ] `/api/execute` route — market data fetch + Claude API call
- [ ] Streaming output display with typewriter effect
- [ ] Output logging with star ratings
- [ ] Analytics dashboard
- [ ] Workflow editing and forking
- [ ] Export: Copy to clipboard
- [ ] Export: Download as .docx (via `/api/export/docx`)
- [ ] Export: Download as .xlsx (via `/api/export/xlsx`)
- [ ] Export: Download as .pptx (via `/api/export/pptx`)
- [ ] Settings panel for API key status
- [ ] Deploy to Vercel

### Polish
- [ ] Robust markdown parser for UI + exports
- [ ] Loading states and error handling on all API calls
- [ ] Responsive design (at minimum, don't break on tablet)
- [ ] File naming: `finprompt_[workflow]_[input]_[date].[ext]`
- [ ] Increase Claude max_tokens to 4096
- [ ] Export bar on log detail views too (not just live output)

### Nice to Have (v2)
- [ ] Structured output mode — ask Claude to return JSON data block alongside narrative
- [ ] PDF document ingestion — drag-and-drop PDFs for context injection
- [ ] Persistent storage (SQLite/Prisma or localStorage)
- [ ] Real-time streaming from Claude API (SSE) instead of waiting for full response
- [ ] Prompt performance tracking — which templates have highest avg ratings over time
- [ ] Team/role-based template visibility

---

## Environment Variables

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...          # Required — Claude API
ALPHA_VANTAGE_API_KEY=...             # Required — Market data
```

```bash
# .env.example
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here
```

---

## Product One-Pager

> FinPrompt standardizes how AI is used across an asset management firm by turning fragmented prompt usage into structured, data-driven workflows.
>
> Instead of analysts writing ad hoc prompts, FinPrompt provides a centralized library of tested templates mapped to core functions such as equity research, risk analysis, fund operations, and data exploration. Each workflow accepts structured inputs like tickers, position sizes, or datasets, and generates outputs in analyst-ready formats.
>
> The key differentiator is a dynamic data layer. Prompts are automatically enriched with real-time market data, fundamentals, and news, enabling the model to reason over actual inputs rather than relying on static knowledge.
>
> Beyond prompt execution, FinPrompt introduces standardization, traceability, and continuous improvement. Usage is tracked, outputs are logged, and workflows can be refined over time, allowing firms to build institutional knowledge around AI.
>
> The long-term vision is to integrate directly with internal data systems and portfolio data, enabling end-to-end AI-assisted workflows for research, risk management, and reporting.

---

## Reference Files

- `finprompt.jsx` — Current working prototype (single-file React component with all templates, seed data, UI, and logic). Use this as the source of truth for porting.

---

## Context

- **Builder**: Tony Thomas — 3rd year Honors CS + Business Administration @ Northeastern (3.8 GPA), building AI agents at Disrupt/Enigma Technologies, prior Regeneron co-op, TA for CS1210
- **Target**: Finepoint Capital LP AI Co-Op application, deadline April 20, 2026
- **Goal**: Demonstrate the ability to build the exact tool they're hiring someone to create, before they even hire you
