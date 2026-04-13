import type { Category } from "@/lib/types";

export const CATEGORIES: Category[] = [
  {
    id: "research",
    label: "Equity Research",
    icon: "\u25C8",
    color: "#0F6E56",
    prompts: [
      {
        id: "bull-bear",
        title: "Bull/Bear Case Generator",
        description:
          "Structured bull and bear investment theses grounded in live market data.",
        template: `You are a senior equity research analyst at a multi-billion dollar hedge fund. Analyze {{TICKER}} ({{COMPANY_NAME}}) using the live market data provided below and produce a structured investment memo with:\n\n1. **Bull Case** (3-4 key points with specific catalysts and target upside)\n2. **Bear Case** (3-4 key risks with quantified downside scenarios)\n3. **Key Metrics to Monitor** (5 leading indicators that would confirm or invalidate each thesis)\n4. **Variant Perception** — what does the market appear to be pricing in, and where might consensus be wrong?\n\nBe specific, data-driven, and concise. Reference the actual market data provided.\n\n{{MARKET_DATA}}`,
        variables: [
          { key: "TICKER", label: "Ticker", placeholder: "e.g. AAPL" },
          {
            key: "COMPANY_NAME",
            label: "Company Name",
            placeholder: "e.g. Apple Inc.",
          },
        ],
        enrichTicker: "TICKER",
      },
      {
        id: "earnings-prep",
        title: "Earnings Call Prep",
        description:
          "Key questions and focus areas for upcoming earnings with real data context.",
        template: `You are preparing a portfolio manager for {{TICKER}}'s upcoming earnings call. Using the live market data and recent news below, generate:\n\n1. **3 Key Questions** management must answer — with why each matters for the investment thesis\n2. **Consensus Expectations** — what the street is likely expecting based on current valuation and trends\n3. **Surprise Scenarios** — what upside/downside surprises could move the stock ±5%+\n4. **Management Credibility Check** — what should we verify based on recent news?\n\nKeep it sharp and actionable. Reference the provided data.\n\n{{MARKET_DATA}}`,
        variables: [{ key: "TICKER", label: "Ticker", placeholder: "e.g. MSFT" }],
        enrichTicker: "TICKER",
      },
      {
        id: "comp-analysis",
        title: "Comparable Company Screen",
        description: "Peer comparison framework using live valuation data.",
        template: `As a research analyst, build a comparable company framework for {{COMPANY_NAME}} ({{TICKER}}). Using the market data below:\n\n1. **Direct Peers** (4-6 companies) — explain why each is comparable\n2. **Relevant Valuation Metrics** — which multiples matter most and why\n3. **Key Differentiators** — what justifies {{TICKER}}'s current valuation vs. peers\n4. **Comps Table Structure** — suggest columns/rows using actual metrics\n\n{{MARKET_DATA}}`,
        variables: [
          { key: "TICKER", label: "Ticker", placeholder: "e.g. CRM" },
          {
            key: "COMPANY_NAME",
            label: "Company Name",
            placeholder: "e.g. Salesforce",
          },
        ],
        enrichTicker: "TICKER",
      },
    ],
  },
  {
    id: "risk",
    label: "Risk & Compliance",
    icon: "\u25C6",
    color: "#993C1D",
    prompts: [
      {
        id: "risk-assessment",
        title: "Position Risk Assessment",
        description: "Evaluate position risks using real market data and news.",
        template: `You are a risk analyst at a value/event-driven hedge fund. Evaluate the risk profile of a {{POSITION_SIZE}} position in {{TICKER}} using the live data below:\n\n1. **Market Risk** — sensitivity to rates, sector rotation, macro (use actual beta)\n2. **Liquidity Risk** — use actual volume to estimate days to exit\n3. **Event Risk** — reference recent news for catalysts and tail scenarios\n4. **Correlation Risk** — sector-based portfolio correlation\n5. **Recommended Hedges** — specific instruments or strategies\n\nQuantify where possible. Be direct.\n\n{{MARKET_DATA}}`,
        variables: [
          { key: "TICKER", label: "Ticker", placeholder: "e.g. META" },
          {
            key: "POSITION_SIZE",
            label: "Position Size",
            placeholder: "e.g. 3% of NAV",
          },
        ],
        enrichTicker: "TICKER",
      },
      {
        id: "compliance-check",
        title: "Compliance Pre-Trade Check",
        description:
          "Screen a proposed trade for regulatory and compliance considerations.",
        template: `As a compliance analyst at a registered investment adviser, review this proposed trade:\n\nTrade: {{TRADE_DESCRIPTION}}\n\n1. **Regulatory Flags** — insider trading windows, restricted lists, position limits\n2. **Concentration Limits** — portfolio and security-level thresholds\n3. **Disclosure Requirements** — 13F, 13D/G, Schedule 13 triggers\n4. **Best Execution** — order routing considerations\n5. **Documentation** — pre- and post-trade filings\n\nNote: Educational purposes only, not legal advice.`,
        variables: [
          {
            key: "TRADE_DESCRIPTION",
            label: "Trade Description",
            placeholder: "e.g. Buy 50,000 shares of XYZ at market",
          },
        ],
      },
    ],
  },
  {
    id: "operations",
    label: "Fund Operations",
    icon: "\u25C7",
    color: "#0F6E56",
    prompts: [
      {
        id: "investor-update",
        title: "Investor Letter Draft",
        description: "Quarterly investor update with performance and positioning.",
        template: `Draft a quarterly investor letter for a $4.9B value/event-driven hedge fund.\n\nPerformance: {{PERFORMANCE}}\nThemes: {{THEMES}}\n\n1. **Performance Summary** — returns vs. benchmark, attribution\n2. **Portfolio Positioning** — themes, sector tilts, rationale\n3. **Market Outlook** — macro view and positioning\n4. **Notable Positions** — 2-3 drivers (anonymized if sensitive)\n5. **Risk Management** — hedging approach\n\nTone: professional, transparent. Under 800 words.`,
        variables: [
          {
            key: "PERFORMANCE",
            label: "Performance",
            placeholder: "e.g. +3.2% gross vs S&P +4.1%",
          },
          {
            key: "THEMES",
            label: "Key Themes",
            placeholder: "e.g. AI infrastructure, energy transition",
          },
        ],
      },
      {
        id: "process-automation",
        title: "Process Automation Spec",
        description: "Scope an automation opportunity for manual fund operations.",
        template: `Analyze this manual process and design an automation plan:\n\nProcess: {{PROCESS_DESCRIPTION}}\nFrequency: {{FREQUENCY}}\n\n1. **Current State** — time cost, error rate, bottlenecks\n2. **Architecture** — tools/APIs, data flow\n3. **Phases** — quick win → full automation\n4. **Risk Mitigation** — human checkpoints, rollback\n5. **ROI** — hours saved, qualitative benefits\n6. **Prompt Templates** — if LLMs are involved, provide them`,
        variables: [
          {
            key: "PROCESS_DESCRIPTION",
            label: "Process",
            placeholder: "e.g. Daily trade reconciliation",
          },
          {
            key: "FREQUENCY",
            label: "Frequency",
            placeholder: "e.g. Daily, ~2 hours",
          },
        ],
      },
    ],
  },
  {
    id: "data",
    label: "Data Analysis",
    icon: "\u25CA",
    color: "#854F0B",
    prompts: [
      {
        id: "dataset-explore",
        title: "Dataset Explorer",
        description: "Structured analysis plan for any financial dataset.",
        template: `You are a quantitative analyst. Dataset: {{DATASET_DESCRIPTION}}\n\n1. **Data Quality Checks**\n2. **Exploratory Analysis** — distributions, correlations\n3. **Feature Engineering** for {{USE_CASE}}\n4. **Statistical Tests**\n5. **Visualization Recommendations** — 5 charts\n6. **Python Code Skeleton**`,
        variables: [
          {
            key: "DATASET_DESCRIPTION",
            label: "Dataset",
            placeholder: "e.g. 10 years of daily returns",
          },
          {
            key: "USE_CASE",
            label: "Use Case",
            placeholder: "e.g. factor-based selection",
          },
        ],
      },
      {
        id: "sql-query",
        title: "SQL Query Builder",
        description: "Optimized SQL queries for financial data extraction.",
        template: `Write an optimized SQL query:\n\nObjective: {{OBJECTIVE}}\nTables: {{TABLES}}\n\n1. **Query** — production-ready with comments\n2. **Performance Notes** — indexing\n3. **Edge Cases** — NULLs, duplicates, dates\n4. **Validation Query**`,
        variables: [
          {
            key: "OBJECTIVE",
            label: "Objective",
            placeholder: "e.g. Top 10 by 30d momentum per sector",
          },
          {
            key: "TABLES",
            label: "Tables",
            placeholder: "e.g. prices(date, ticker, close)",
          },
        ],
      },
    ],
  },
];
