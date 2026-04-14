import type { Category } from "@/lib/types";
import {
  INSTRUCTION_FOOTER_BULL_BEAR,
  INSTRUCTION_FOOTER_MARKET_DATA,
} from "@/lib/promptInstructionFooter";

export const CATEGORIES: Category[] = [
  {
    id: "research",
    label: "Equity research",
    icon: "\u25C8",
    color: "#0F6E56",
    prompts: [
      {
        id: "bull-bear",
        title: "Bull/Bear Case Generator",
        description:
          "Structured bull and bear investment theses grounded in live market data.",
        template: `You are a senior equity research analyst at a $4.9B value/event-driven hedge fund. You are writing an internal investment memo on the provided ticker for the portfolio manager. This memo will be used to make an actual allocation decision. You have been provided with live market data below. You MUST reference specific numbers from this data throughout your analysis — never use generic statements that could apply to any company at any time. Structure your memo as: (1) Bull Case with 3-4 points, each naming a specific catalyst with timeframe, an explicit price target anchored to the current stock price, referencing at least one news headline, and using valuation multiples to justify upside. (2) Bear Case with 3-4 points, each with a quantified downside price level, at least one referencing current valuation data to argue overvaluation, at least one referencing a news headline. (3) Key Metrics to Monitor — 5 metrics, each stating the current value from the data and what a bullish vs bearish reading looks like. (4) Variant Perception — state what the current price and multiples imply about growth expectations, identify where the market is wrong with evidence, and reference where the price sits relative to 52-week range and analyst target.${INSTRUCTION_FOOTER_BULL_BEAR}`,
        instructionFooter: INSTRUCTION_FOOTER_BULL_BEAR,
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
        template: `You are preparing a portfolio manager for {{TICKER}}'s upcoming earnings call. Using the live market data and recent news below, generate:\n\n1. **3 Key Questions** management must answer — with why each matters for the investment thesis\n2. **Consensus Expectations** — what the street is likely expecting based on current valuation and trends\n3. **Surprise Scenarios** — what upside/downside surprises could move the stock ±5%+\n4. **Management Credibility Check** — what should we verify based on recent news?\n\nKeep it sharp and actionable. Reference the provided data.${INSTRUCTION_FOOTER_MARKET_DATA}`,
        instructionFooter: INSTRUCTION_FOOTER_MARKET_DATA,
        variables: [{ key: "TICKER", label: "Ticker", placeholder: "e.g. MSFT" }],
        enrichTicker: "TICKER",
      },
      {
        id: "comp-analysis",
        title: "Comparable Company Screen",
        description:
          "Full live data for the primary ticker; peer tickers optional—manual list or leave blank for AI-chosen peers with live compact data per peer.",
        template: `As a senior equity research analyst at a value/event-driven hedge fund, build a comparable company framework for {{COMPANY_NAME}} ({{TICKER}}) to determine whether the stock is cheap or expensive relative to peers — and whether the gap is justified.

Live data appendix (read this first)

The market data below always includes a full block for {{TICKER}} only. Every numeric statement about {{TICKER}} must come from that primary block (or simple arithmetic on it).
If the appendix includes **COMPARABLE PEERS (live data)** with **PEER:** blocks—whether from user-listed tickers under Peer tickers or from system-suggested tickers when Peer tickers was left blank—those symbols are the **complete** peer set for this analysis. There may be as few as one peer; do **not** add other peer names, extra comp rows, or tickers beyond those blocks. For each such symbol, use only that PEER block for that row’s numbers in your comps table — do not substitute estimates for those tickers.
If there is **no** COMPARABLE PEERS section in the appendix (e.g. Peer tickers was left blank and no peer blocks were attached), you must still name **4–6** appropriate peers from sector/industry knowledge. Ground {{TICKER}} only in the primary block. For peer rows, use reasonable approximate multiples or ranges, mark clearly as (est.) or not from live data, and note that a re-run with peer tickers would attach verified peer figures.
Quality bar
Every comparison must be grounded in actual numbers for {{TICKER}}. If you write “trades at a premium due to stronger growth” without showing the multiple and the growth rate side by side for {{TICKER}} (and for any peer with a live PEER block), rewrite it. When peer data is estimated (no live block), say so explicitly.

Direct Peers — When **PEER:** blocks are present, your peer set is **exactly** those symbols (one peer is valid—do not pad to 4–6). When there is no live peer appendix, name **4–6** peers from sector/industry knowledge. For each peer: explain the specific economic linkage: shared end market, similar revenue mix, overlapping customer base, or comparable scale. “They’re both tech companies” is not a comp rationale. State the single biggest difference that makes a 1:1 comparison imperfect. Rank from most to least comparable and flag the 1–2 tightest comps. When live PEER blocks exist for named tickers, align peer metrics with those blocks.

Valuation Framework — Select 3–4 metrics most relevant for this business model. Do not default to P/E and EV/EBITDA for every company. (Examples: SaaS → EV/Revenue and Rule of 40; bank → P/TBV and ROE; REIT → P/FFO.) For each metric: say why it’s the right lens, give {{TICKER}}’s current value from the primary data, and label primary vs secondary metric for this name. Then, for each metric, express premium/discount vs peers — “{{TICKER}} trades at X.X× vs peer median Y.Y×, a Z% premium/discount” — using live peer blocks where available; otherwise use transparent (est.) peer medians/means and state they are not from the feed. Say whether each gap is justified or unjustified with a specific fundamental difference.

Key Differentiators — What justifies {{TICKER}}’s valuation vs peers? Take a clear position: fairly valued, undervalued, or overvalued vs the peer group. Support with at least 3 concrete data points from the primary market data for {{TICKER}}. If multiples conflict, explain the divergence and which metric the PM should trust. List 2–3 analytical risks to this comp framework (e.g. “{{TICKER}} has 40% services revenue vs peer average of 15%, inflating margin-based multiples”) — not generic disclaimers.

Comps Table — Markdown table. Rows: {{TICKER}} first, then each peer **only** from live **PEER:** blocks when the appendix is present (one user-listed peer ⇒ one peer row after {{TICKER}}), then Peer Median and Peer Mean. Columns: Company, Ticker, Market Cap, your primary metric, P/E, Revenue Growth YoY, Gross Margin, your secondary metric. Populate {{TICKER}} from the primary section only. For each peer: if a PEER: SYMBOL block exists, populate that row from it; otherwise use (est.) and do not pretend those figures are from the live appendix.

Every sentence should either state a number, explain a number, or tell the PM what to do with a number.${INSTRUCTION_FOOTER_MARKET_DATA}`,
        instructionFooter: INSTRUCTION_FOOTER_MARKET_DATA,
        variables: [
          { key: "TICKER", label: "Ticker", placeholder: "e.g. CRM" },
          {
            key: "COMPANY_NAME",
            label: "Company Name",
            placeholder: "e.g. Salesforce",
          },
          {
            key: "PEERS",
            label: "Peer tickers (optional)",
            placeholder:
              "Leave blank to suggest peers; or MSFT, ORCL, NOW (comma-separated, max 6) for live peer data",
            optional: true,
          },
        ],
        enrichTicker: "TICKER",
        enrichPeerTickers: "PEERS",
      },
    ],
  },
  {
    id: "risk",
    label: "Risk and compliance",
    icon: "\u25C6",
    color: "#993C1D",
    prompts: [
      {
        id: "risk-assessment",
        title: "Position Risk Assessment",
        description: "Evaluate position risks using real market data and news.",
        template: `You are a risk analyst at a value/event-driven hedge fund. Evaluate the risk profile of a {{POSITION_SIZE}} position in {{TICKER}} using the live data below:\n\n1. **Market Risk** — sensitivity to rates, sector rotation, macro (use actual beta)\n2. **Liquidity Risk** — use actual volume to estimate days to exit\n3. **Event Risk** — reference recent news for catalysts and tail scenarios\n4. **Correlation Risk** — sector-based portfolio correlation\n5. **Recommended Hedges** — specific instruments or strategies\n\nQuantify where possible. Be direct.${INSTRUCTION_FOOTER_MARKET_DATA}`,
        instructionFooter: INSTRUCTION_FOOTER_MARKET_DATA,
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
    label: "Fund operations",
    icon: "\u25C7",
    color: "#1B4F72",
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
];
