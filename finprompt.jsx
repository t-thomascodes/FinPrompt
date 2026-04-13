import { useState, useEffect, useRef, useCallback } from "react";

// ─── Data ────────────────────────────────────────────────────────────────────

const INITIAL_CATEGORIES = [
  {
    id: "research",
    label: "Equity Research",
    icon: "◈",
    color: "#00D4AA",
    prompts: [
      {
        id: "bull-bear",
        title: "Bull/Bear Case Generator",
        description: "Structured bull and bear investment theses grounded in live market data.",
        template: `You are a senior equity research analyst at a multi-billion dollar hedge fund. Analyze {{TICKER}} ({{COMPANY_NAME}}) using the live market data provided below and produce a structured investment memo with:\n\n1. **Bull Case** (3-4 key points with specific catalysts and target upside)\n2. **Bear Case** (3-4 key risks with quantified downside scenarios)\n3. **Key Metrics to Monitor** (5 leading indicators that would confirm or invalidate each thesis)\n4. **Variant Perception** — what does the market appear to be pricing in, and where might consensus be wrong?\n\nBe specific, data-driven, and concise. Reference the actual market data provided.\n\n{{MARKET_DATA}}`,
        variables: [
          { key: "TICKER", label: "Ticker", placeholder: "e.g. AAPL" },
          { key: "COMPANY_NAME", label: "Company Name", placeholder: "e.g. Apple Inc." },
        ],
        enrichTicker: "TICKER",
      },
      {
        id: "earnings-prep",
        title: "Earnings Call Prep",
        description: "Key questions and focus areas for upcoming earnings with real data context.",
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
          { key: "COMPANY_NAME", label: "Company Name", placeholder: "e.g. Salesforce" },
        ],
        enrichTicker: "TICKER",
      },
    ],
  },
  {
    id: "risk",
    label: "Risk & Compliance",
    icon: "◆",
    color: "#FF6B6B",
    prompts: [
      {
        id: "risk-assessment",
        title: "Position Risk Assessment",
        description: "Evaluate position risks using real market data and news.",
        template: `You are a risk analyst at a value/event-driven hedge fund. Evaluate the risk profile of a {{POSITION_SIZE}} position in {{TICKER}} using the live data below:\n\n1. **Market Risk** — sensitivity to rates, sector rotation, macro (use actual beta)\n2. **Liquidity Risk** — use actual volume to estimate days to exit\n3. **Event Risk** — reference recent news for catalysts and tail scenarios\n4. **Correlation Risk** — sector-based portfolio correlation\n5. **Recommended Hedges** — specific instruments or strategies\n\nQuantify where possible. Be direct.\n\n{{MARKET_DATA}}`,
        variables: [
          { key: "TICKER", label: "Ticker", placeholder: "e.g. META" },
          { key: "POSITION_SIZE", label: "Position Size", placeholder: "e.g. 3% of NAV" },
        ],
        enrichTicker: "TICKER",
      },
      {
        id: "compliance-check",
        title: "Compliance Pre-Trade Check",
        description: "Screen a proposed trade for regulatory and compliance considerations.",
        template: `As a compliance analyst at a registered investment adviser, review this proposed trade:\n\nTrade: {{TRADE_DESCRIPTION}}\n\n1. **Regulatory Flags** — insider trading windows, restricted lists, position limits\n2. **Concentration Limits** — portfolio and security-level thresholds\n3. **Disclosure Requirements** — 13F, 13D/G, Schedule 13 triggers\n4. **Best Execution** — order routing considerations\n5. **Documentation** — pre- and post-trade filings\n\nNote: Educational purposes only, not legal advice.`,
        variables: [{ key: "TRADE_DESCRIPTION", label: "Trade Description", placeholder: "e.g. Buy 50,000 shares of XYZ at market" }],
      },
    ],
  },
  {
    id: "operations",
    label: "Fund Operations",
    icon: "◇",
    color: "#4ECDC4",
    prompts: [
      {
        id: "investor-update",
        title: "Investor Letter Draft",
        description: "Quarterly investor update with performance and positioning.",
        template: `Draft a quarterly investor letter for a $4.9B value/event-driven hedge fund.\n\nPerformance: {{PERFORMANCE}}\nThemes: {{THEMES}}\n\n1. **Performance Summary** — returns vs. benchmark, attribution\n2. **Portfolio Positioning** — themes, sector tilts, rationale\n3. **Market Outlook** — macro view and positioning\n4. **Notable Positions** — 2-3 drivers (anonymized if sensitive)\n5. **Risk Management** — hedging approach\n\nTone: professional, transparent. Under 800 words.`,
        variables: [
          { key: "PERFORMANCE", label: "Performance", placeholder: "e.g. +3.2% gross vs S&P +4.1%" },
          { key: "THEMES", label: "Key Themes", placeholder: "e.g. AI infrastructure, energy transition" },
        ],
      },
      {
        id: "process-automation",
        title: "Process Automation Spec",
        description: "Scope an automation opportunity for manual fund operations.",
        template: `Analyze this manual process and design an automation plan:\n\nProcess: {{PROCESS_DESCRIPTION}}\nFrequency: {{FREQUENCY}}\n\n1. **Current State** — time cost, error rate, bottlenecks\n2. **Architecture** — tools/APIs, data flow\n3. **Phases** — quick win → full automation\n4. **Risk Mitigation** — human checkpoints, rollback\n5. **ROI** — hours saved, qualitative benefits\n6. **Prompt Templates** — if LLMs are involved, provide them`,
        variables: [
          { key: "PROCESS_DESCRIPTION", label: "Process", placeholder: "e.g. Daily trade reconciliation" },
          { key: "FREQUENCY", label: "Frequency", placeholder: "e.g. Daily, ~2 hours" },
        ],
      },
    ],
  },
  {
    id: "data",
    label: "Data Analysis",
    icon: "◊",
    color: "#FFE66D",
    prompts: [
      {
        id: "dataset-explore",
        title: "Dataset Explorer",
        description: "Structured analysis plan for any financial dataset.",
        template: `You are a quantitative analyst. Dataset: {{DATASET_DESCRIPTION}}\n\n1. **Data Quality Checks**\n2. **Exploratory Analysis** — distributions, correlations\n3. **Feature Engineering** for {{USE_CASE}}\n4. **Statistical Tests**\n5. **Visualization Recommendations** — 5 charts\n6. **Python Code Skeleton**`,
        variables: [
          { key: "DATASET_DESCRIPTION", label: "Dataset", placeholder: "e.g. 10 years of daily returns" },
          { key: "USE_CASE", label: "Use Case", placeholder: "e.g. factor-based selection" },
        ],
      },
      {
        id: "sql-query",
        title: "SQL Query Builder",
        description: "Optimized SQL queries for financial data extraction.",
        template: `Write an optimized SQL query:\n\nObjective: {{OBJECTIVE}}\nTables: {{TABLES}}\n\n1. **Query** — production-ready with comments\n2. **Performance Notes** — indexing\n3. **Edge Cases** — NULLs, duplicates, dates\n4. **Validation Query**`,
        variables: [
          { key: "OBJECTIVE", label: "Objective", placeholder: "e.g. Top 10 by 30d momentum per sector" },
          { key: "TABLES", label: "Tables", placeholder: "e.g. prices(date, ticker, close)" },
        ],
      },
    ],
  },
];

// ─── API Helpers ─────────────────────────────────────────────────────────────

async function fetchQuote(t, k) {
  const r = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${t}&apikey=${k}`);
  const d = await r.json(); return d["Global Quote"] || null;
}
async function fetchOverview(t, k) {
  const r = await fetch(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${t}&apikey=${k}`);
  return await r.json();
}
async function fetchNews(t, k) {
  const r = await fetch(`https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${t}&limit=5&apikey=${k}`);
  const d = await r.json(); return d.feed?.slice(0, 5) || [];
}

function formatMarketData(q, o, n) {
  let s = [];
  if (o?.Symbol) {
    s.push(`--- COMPANY OVERVIEW ---\n${o.Name} (${o.Symbol}) | ${o.Sector} · ${o.Industry}\nMkt Cap: $${Number(o.MarketCapitalization||0).toLocaleString()} | EV: $${Number(o.EnterpriseValue||0).toLocaleString()}\n${(o.Description||"").slice(0,250)}...`);
    s.push(`--- VALUATION ---\nP/E: ${o.TrailingPE||"—"} | Fwd P/E: ${o.ForwardPE||"—"} | PEG: ${o.PEGRatio||"—"}\nP/B: ${o.PriceToBookRatio||"—"} | P/S: ${o.PriceToSalesRatioTTM||"—"}\nEV/Rev: ${o.EVToRevenue||"—"} | EV/EBITDA: ${o.EVToEBITDA||"—"}`);
    s.push(`--- FUNDAMENTALS ---\nRev TTM: $${Number(o.RevenueTTM||0).toLocaleString()} | EBITDA: $${Number(o.EBITDA||0).toLocaleString()}\nMargin: ${o.ProfitMargin||"—"} | Op Margin: ${o.OperatingMarginTTM||"—"}\nROE: ${o.ReturnOnEquityTTM||"—"} | Rev Growth: ${o.QuarterlyRevenueGrowthYOY||"—"}`);
    s.push(`--- TRADING ---\nBeta: ${o.Beta||"—"} | 52W: $${o["52WeekLow"]||"—"}–$${o["52WeekHigh"]||"—"}\n50D MA: $${o["50DayMovingAverage"]||"—"} | 200D MA: $${o["200DayMovingAverage"]||"—"}\nTarget: $${o.AnalystTargetPrice||"—"} | Div Yield: ${o.DividendYield||"—"}`);
  }
  if (q?.["05. price"]) {
    s.push(`--- LIVE QUOTE ---\n$${q["05. price"]} | Chg: ${q["09. change"]} (${q["10. change percent"]})\nVol: ${Number(q["06. volume"]||0).toLocaleString()} | Open: $${q["02. open"]} | H/L: $${q["03. high"]}/$${q["04. low"]}`);
  }
  if (n?.length) {
    s.push(`--- NEWS ---\n${n.map((x,i)=>`${i+1}. ${x.title} (${x.source}) — ${x.overall_sentiment_label||"N/A"}`).join("\n")}`);
  }
  return s.join("\n\n") || "[No data available]";
}

// ─── Components ──────────────────────────────────────────────────────────────

const F = `'JetBrains Mono','Fira Code',monospace`;
const S = `'DM Sans','Helvetica Neue',sans-serif`;

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: "#0C1019", border: "1px solid #1A2035", borderRadius: 8, padding: "14px 16px", flex: "1 1 140px", minWidth: 140 }}>
      <div style={{ fontSize: 10, color: "#3A4558", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color || "#fff", fontFamily: F }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#4A5568", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function LogEntry({ log, onView, onRate, category }) {
  const cat = INITIAL_CATEGORIES.find(c => c.id === log.categoryId);
  return (
    <div style={{
      background: "#0C1019", border: "1px solid #1A2035", borderRadius: 8, padding: 14, marginBottom: 8,
      cursor: "pointer", transition: "border-color 0.2s",
    }}
    onClick={onView}
    onMouseEnter={e => e.currentTarget.style.borderColor = cat?.color || "#2A3548"}
    onMouseLeave={e => e.currentTarget.style.borderColor = "#1A2035"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#E0E0E0" }}>{log.promptTitle}</span>
            {log.hadData && <span style={{ fontSize: 8, background: "#00D4AA22", color: "#00D4AA", padding: "1px 5px", borderRadius: 3, fontFamily: F, fontWeight: 600 }}>LIVE</span>}
          </div>
          <div style={{ fontSize: 11, color: "#4A5568", fontFamily: F }}>{log.inputs} · {log.timestamp}</div>
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {[1,2,3,4,5].map(star => (
            <button key={star} onClick={e => { e.stopPropagation(); onRate(star); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: log.rating >= star ? "#FFE66D" : "#1E2A42", padding: 0, lineHeight: 1 }}>
              ★
            </button>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 11, color: "#5A6577", lineHeight: 1.4, overflow: "hidden", maxHeight: 36 }}>
        {log.output?.slice(0, 150)}...
      </div>
    </div>
  );
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

const SEED_LOGS = [
  {
    id: 1001, promptId: "bull-bear", promptTitle: "Bull/Bear Case Generator", categoryId: "research",
    inputs: "NVDA, NVIDIA Corp", hadData: true, timestamp: "4/10/2026, 9:14:22 AM", rating: 5,
    marketData: "--- COMPANY OVERVIEW ---\nNVIDIA Corp (NVDA) | Technology · Semiconductors\nMkt Cap: $2,874,000,000,000 | EV: $2,841,000,000,000\nNVIDIA designs and manufactures GPUs and AI accelerators...\n\n--- VALUATION ---\nP/E: 54.2 | Fwd P/E: 32.8 | PEG: 1.12\nP/B: 48.6 | P/S: 29.3\nEV/Rev: 28.1 | EV/EBITDA: 46.7\n\n--- FUNDAMENTALS ---\nRev TTM: $96,300,000,000 | EBITDA: $64,200,000,000\nMargin: 55.8% | Op Margin: 62.4%\nROE: 115.7% | Rev Growth: 78.2%\n\n--- LIVE QUOTE ---\n$142.87 | Chg: +3.42 (+2.45%)\nVol: 312,847,000 | Open: $139.50 | H/L: $143.22/$138.90\n\n--- NEWS ---\n1. NVIDIA Blackwell Ultra chips see record demand from hyperscalers (Reuters) — Bullish\n2. New export controls on AI chips to Middle East under review (Bloomberg) — Bearish\n3. NVIDIA partners with sovereign AI funds in Southeast Asia (CNBC) — Bullish",
    output: `1. **Bull Case**

- **Data Center Dominance Accelerating** — Revenue growth of 78.2% YoY shows no signs of slowing. Blackwell Ultra is seeing record demand from hyperscalers, and the product cycle is compressing — each new architecture is shipping faster than the last. With $96.3B TTM revenue and 62.4% operating margins, NVIDIA is printing money at scale.
- **Sovereign AI Tailwind** — The Southeast Asia partnership signals a new demand vector. Governments are building national AI infrastructure, and NVIDIA is the default vendor. This is a multi-year, non-cyclical revenue stream that consensus is underweighting.
- **Forward P/E Compression Story** — At 32.8x forward earnings vs. 54.2x trailing, the market expects massive earnings growth. If Blackwell Ultra shipments ramp as expected, NVDA could grow into a 25x forward multiple within 12 months, implying 30%+ upside to $185.
- **Software Moat Deepening** — CUDA ecosystem lock-in is widening. Every new framework, every new model architecture is optimized for NVIDIA first. Switching costs are rising, not falling.

2. **Bear Case**

- **Export Control Risk is Real** — The Bloomberg report on Middle East export controls is a concrete threat. If restrictions expand to additional regions, NVIDIA loses access to sovereign AI demand it's currently banking on. Potential revenue impact: $8-12B annually.
- **Valuation Assumes Perfection** — P/B of 48.6x and P/S of 29.3x leave zero room for execution misses. A single quarter of deceleration could trigger a 20-25% correction to the $107-115 range.
- **Customer Concentration** — Hyperscaler capex is cyclical. Microsoft, Google, Meta, and Amazon represent the majority of data center revenue. If any major customer signals a capex pause, NVDA sells off 15%+ before fundamentals even change.
- **AMD and Custom Silicon** — While NVIDIA leads today, Google's TPUs, Amazon's Trainium, and AMD's MI400 are all credible alternatives for inference workloads. The training moat is deep, but inference is 60%+ of total compute demand.

3. **Key Metrics to Monitor**

- Hyperscaler capex guidance on next earnings calls (MSFT, GOOGL, AMZN)
- Blackwell Ultra shipment volumes and ASP trends
- Export control policy developments — any expansion beyond China
- Data center revenue mix (training vs. inference)
- CUDA developer ecosystem growth rate

4. **Variant Perception**

The market is pricing in sustained 50%+ revenue growth through 2027 and gradual margin expansion. Consensus may be wrong on two fronts: (1) sovereign AI demand could be larger than modeled — this is a new category that sell-side hasn't fully captured, and (2) inference demand could commoditize faster than expected, compressing margins on the highest-volume segment. The stock trades as if all upside is captured; the real question is whether NVIDIA becomes a $200B/year revenue company (bull) or hits a growth wall at $120-130B (bear).`,
    fullPrompt: "[full prompt text]",
  },
  {
    id: 1002, promptId: "earnings-prep", promptTitle: "Earnings Call Prep", categoryId: "research",
    inputs: "AAPL", hadData: true, timestamp: "4/10/2026, 8:47:05 AM", rating: 4,
    marketData: "--- COMPANY OVERVIEW ---\nApple Inc (AAPL) | Technology · Consumer Electronics\nMkt Cap: $3,241,000,000,000\n\n--- VALUATION ---\nP/E: 33.1 | Fwd P/E: 28.4 | PEG: 2.8\n\n--- LIVE QUOTE ---\n$214.29 | Chg: -1.03 (-0.48%)\nVol: 54,221,000",
    output: `1. **3 Key Questions for Management**

- **iPhone 17 Pre-order Trajectory** — With the stock at 33.1x trailing earnings, the market is pricing in a strong upgrade cycle. Management needs to quantify whether iPhone 17 pre-orders are tracking ahead of iPhone 16 at the same point. This matters because iPhone still drives ~52% of revenue and any softness would challenge the premium multiple.
- **Services Margin Expansion Path** — Services is the margin story. At ~70% gross margins vs. ~36% for hardware, every point of mix shift matters. Ask specifically about Apple Intelligence subscription attach rates — this is the new monetization vector the street is most focused on.
- **China Recovery or Structural Decline** — Greater China revenue has been under pressure for 3 consecutive quarters. Is this cyclical (macro weakness) or structural (Huawei competition)? The answer determines whether China is a recovery opportunity or a permanent headwind worth 5-7% of total revenue.

2. **Consensus Expectations**

Revenue consensus is ~$94.5B for the quarter, implying ~5% YoY growth. EPS expectations are $1.62, with services expected to grow ~14% YoY. The street is modeling ~47% gross margins, slight expansion from hardware mix improvement. Guidance will matter more than the print — investors want to see Q4 guidance above $97B to maintain confidence in the growth re-acceleration narrative.

3. **Surprise Scenarios**

- **Upside (+5-8%)**: Services revenue above $26B AND management provides specific Apple Intelligence monetization metrics (subscriber count, ARPU). Combined with strong iPhone guidance, this could push the stock to $225+.
- **Downside (-5-10%)**: China revenue below $15B with no recovery guidance, AND gross margins below 46.5% suggesting promotional pressure. A weak Q4 guide below $95B would compound the selloff to $195-200 range.

4. **Management Credibility Check**

Last quarter, Tim Cook stated the Apple Intelligence rollout was "ahead of internal targets." Verify: How many markets now have Apple Intelligence? What's the DAU engagement rate? If the answer is vague or qualitative, it signals the feature isn't driving the upgrade cycle they implied.`,
    fullPrompt: "[full prompt text]",
  },
  {
    id: 1003, promptId: "risk-assessment", promptTitle: "Position Risk Assessment", categoryId: "risk",
    inputs: "TSLA, 5% of NAV", hadData: true, timestamp: "4/9/2026, 4:32:18 PM", rating: 3,
    marketData: "--- COMPANY OVERVIEW ---\nTesla Inc (TSLA) | Automotive · Electric Vehicles\nMkt Cap: $892,000,000,000\n\n--- TRADING ---\nBeta: 2.07 | 52W: $138.80–$488.54\nVol: 98,432,000",
    output: `1. **Market Risk — HIGH**

With a beta of 2.07, a 5% NAV position in TSLA introduces significant portfolio volatility. A 10% broad market drawdown implies ~20% TSLA drawdown, translating to a 1% NAV hit from this single position. The 52-week range of $138.80–$488.54 represents a 252% spread — this is not a stable compounder. Rate sensitivity is moderate but secondary to sentiment-driven moves. Sector rotation out of growth/momentum into value would hit TSLA disproportionately.

2. **Liquidity Risk — LOW**

Average daily volume of 98.4M shares provides ample liquidity. At a 5% NAV position in a $4.9B fund (~$245M), assuming average price of ~$280, this is roughly 875,000 shares. At current volume, this represents less than 1% of daily volume — exit in 2-3 trading days with minimal slippage (<10bps). Liquidity risk is not a concern for this position.

3. **Event Risk — ELEVATED**

Key upcoming catalysts: Q2 delivery numbers (July), FSD regulatory updates, and Elon Musk's unpredictable public commentary. The stock has historically moved 8-15% on delivery misses. Robotaxi regulatory approvals in any major market could be a +20% catalyst. Political and regulatory headline risk is persistent and unhedgeable through fundamentals alone.

4. **Correlation Risk — MODERATE**

TSLA correlates with the broader tech/growth basket but has significant idiosyncratic risk. If the portfolio already has significant FAANG exposure, TSLA adds concentrated beta to the same macro factors (rates, risk appetite, AI narrative). Recommend checking correlation with existing tech positions — likely 0.5-0.65 with QQQ.

5. **Recommended Hedges**

- **Collar Strategy**: Buy 3-month 15% OTM puts, sell 10% OTM calls. Caps upside but protects against the fat left tail. Cost: roughly neutral given TSLA's elevated implied vol.
- **Pair Trade**: Short a lower-beta auto OEM (GM or F) at 30-40% of notional to hedge sector-specific risk while maintaining the TSLA alpha bet.
- **Reduce to 3% NAV**: The simplest hedge. At 2.07 beta, 3% NAV gives equivalent market exposure to a 6% position in a beta-1 stock — still meaningful but more manageable.`,
    fullPrompt: "[full prompt text]",
  },
  {
    id: 1004, promptId: "investor-update", promptTitle: "Investor Letter Draft", categoryId: "operations",
    inputs: "+3.2% gross vs S&P +4.1%, AI infrastructure buildout", hadData: false, timestamp: "4/9/2026, 2:15:41 PM", rating: 5,
    marketData: "",
    output: `Dear Partners,

We are writing to share the fund's results and positioning for the first quarter of 2026.

**Performance**

The fund returned +3.2% gross (+2.8% net of fees) for Q1 2026, compared to +4.1% for the S&P 500. While we trailed the benchmark this quarter, we are pleased with the risk-adjusted profile of returns. Our gross exposure averaged 145% with a net exposure of 62%, reflecting our conviction in specific opportunities balanced against a cautious macro posture. The Sharpe ratio for the quarter was 1.8, and maximum drawdown was contained to -1.4%.

**Positioning & Key Themes**

Our primary theme this quarter was the AI infrastructure buildout, where we maintained concentrated long positions in semiconductor equipment and power infrastructure companies positioned to benefit from the multi-year datacenter investment cycle. This theme contributed approximately +4.1% gross to the portfolio. On the short side, we maintained positions in legacy software companies facing AI disruption, which contributed +1.2%.

Our event-driven book was a modest detractor (-0.8%) as two merger arbitrage positions widened on regulatory uncertainty before ultimately closing. We continue to believe the risk/reward in event-driven strategies is attractive at current spreads.

**Notable Positions**

Our largest contributor was a long position in a leading semiconductor equipment company that reported accelerating orders driven by TSMC and Samsung capacity expansion. The position appreciated 22% during the quarter, and we trimmed it by 30% near highs to manage position sizing.

Our most notable new position is a long in an independent power producer trading at 6x forward earnings with contracted cash flows that we believe the market is significantly undervaluing as datacenter power demand accelerates.

**Market Outlook**

We expect the AI infrastructure theme to persist through 2026-2027, but we are increasingly focused on identifying second-derivative beneficiaries as the obvious plays become crowded. Interest rate policy remains a key variable — our base case is one cut in H2 2026 — and we are positioned to benefit from either stability or modest easing.

**Risk Management**

We maintained portfolio hedges throughout the quarter including index puts at approximately 1.5% of NAV cost and a VIX call spread overlay. Sector concentration in technology was managed below our 35% gross limit. All positions remained within our standard sizing guidelines.

We appreciate your continued partnership and welcome any questions.

Respectfully,
The Investment Team`,
    fullPrompt: "[full prompt text]",
  },
  {
    id: 1005, promptId: "bull-bear", promptTitle: "Bull/Bear Case Generator", categoryId: "research",
    inputs: "META, Meta Platforms", hadData: true, timestamp: "4/9/2026, 11:08:33 AM", rating: 4,
    marketData: "--- COMPANY OVERVIEW ---\nMeta Platforms (META) | Technology · Social Media\nMkt Cap: $1,580,000,000,000\n\n--- VALUATION ---\nP/E: 25.8 | Fwd P/E: 21.2\nEV/EBITDA: 16.9",
    output: `1. **Bull Case**

- **Reels Monetization Inflection** — Instagram Reels is approaching TikTok-level engagement but monetizes at only ~60% of Feed. As ad load increases and advertiser tools mature, Reels ARPU should converge with Feed over 18 months, representing a $15-20B incremental revenue opportunity with minimal cost.
- **AI-Driven Ad Targeting Recovery** — Advantage+ campaigns are delivering 20-30% better ROAS than legacy targeting, effectively solving the ATT signal loss problem. At 25.8x trailing earnings, the market hasn't fully priced in the margin impact of AI-optimized ad delivery at scale.
- **WhatsApp Business Monetization** — 200M+ businesses on WhatsApp, but revenue contribution is still negligible. Click-to-WhatsApp ads are growing 80%+ YoY in emerging markets. This is a $10B+ revenue stream over 3-5 years that's barely in consensus models.

2. **Bear Case**

- **Reality Labs Cash Burn** — $15B+ annual losses with no clear path to profitability before 2028. At some point, investor patience runs out.
- **Regulatory Overhang** — EU DSA enforcement and potential US antitrust action represent ongoing uncertainty.
- **TikTok Uncertainty** — If the TikTok ban is reversed or restructured, META loses its primary competitive advantage of the last 18 months.

3. **Key Metrics to Monitor**

- Reels revenue per impression vs. Feed (convergence rate)
- Reality Labs quarterly losses (any sign of discipline)
- WhatsApp Business revenue disclosure
- Daily Active People across family of apps
- Advantage+ adoption rate among top 100 advertisers

4. **Variant Perception**

Market prices META as a mature ad platform growing 15-18% with an expensive hobby (Reality Labs). The variant view: META is an AI company that happens to monetize through ads. If Llama models drive material product improvements (AI assistants, creator tools, enterprise), the multiple re-rates from 25x to 30x+ and we see $700+ within 12 months.`,
    fullPrompt: "[full prompt text]",
  },
  {
    id: 1006, promptId: "process-automation", promptTitle: "Process Automation Spec", categoryId: "operations",
    inputs: "Daily trade reconciliation, Daily ~2 hours", hadData: false, timestamp: "4/8/2026, 3:45:00 PM", rating: 4,
    marketData: "",
    output: `1. **Current State Assessment**

Estimated time cost: ~2 hours/day × 252 trading days = 504 hours/year (~$50,000+ in analyst time). Manual reconciliation between trade blotter, prime broker confirms, and OMS typically involves: downloading CSV reports, vlookup matching on trade ID, flagging breaks, and emailing resolution requests. Error rate on manual matching: estimated 2-5% miss rate on partial fills and late confirms. Primary bottleneck: waiting for PB confirms (T+1) and manually chasing breaks.

2. **Automation Architecture**

Data Sources: PB FTP/API (confirms) → Python ETL → Staging DB ← OMS API (trade blotter)
Matching Engine: Python script with fuzzy matching on trade ID, ticker, quantity, price (±0.01 tolerance)
Break Handling: Auto-classify breaks (quantity, price, missing) → Slack notification with break details → Auto-generate email draft for PB resolution
Dashboard: Streamlit or React app showing daily reconciliation status, break trends, resolution time

3. **Implementation Phases**

Phase 1 (Week 1-2): Automate data ingestion from PB and OMS. Build matching engine. Output: daily CSV of matched/unmatched trades. Saves ~45 min/day immediately.
Phase 2 (Week 3-4): Add break classification, Slack alerts, and email drafting. Build simple dashboard. Saves additional ~30 min/day.
Phase 3 (Week 5-8): Historical break analysis, pattern detection (recurring issues by counterparty/broker), predictive flagging of likely breaks. Full dashboard with audit trail.

4. **Risk Mitigation**

Maintain manual review for first 2 weeks running parallel. Human sign-off required for any break >$10,000 notional. Daily reconciliation summary email to ops lead. Rollback: CSV export always available for manual process.

5. **ROI Estimate**

Conservative: 1.5 hours saved daily = 378 hours/year = ~$37,800 in analyst time.
Quality improvement: Reduce break miss rate from ~3% to <0.5%. Faster break resolution: from avg 2.3 days to <1 day.

6. **Prompt Templates**

For break classification LLM step:
"Given this trade break: [break details]. Classify as: QUANTITY_MISMATCH, PRICE_MISMATCH, MISSING_CONFIRM, LATE_SETTLE, or OTHER. Suggest resolution action and draft a one-paragraph email to the prime broker requesting correction."`,
    fullPrompt: "[full prompt text]",
  },
  {
    id: 1007, promptId: "comp-analysis", promptTitle: "Comparable Company Screen", categoryId: "research",
    inputs: "PANW, Palo Alto Networks", hadData: true, timestamp: "4/8/2026, 10:22:14 AM", rating: 3,
    marketData: "--- COMPANY OVERVIEW ---\nPalo Alto Networks (PANW) | Technology · Cybersecurity\nMkt Cap: $128,000,000,000\n\n--- VALUATION ---\nP/E: 51.4 | Fwd P/E: 38.2 | EV/Rev: 16.8",
    output: `1. **Direct Peers**

- **CrowdStrike (CRWD)** — Closest comp. Cloud-native endpoint security, similar platform consolidation strategy. ~$4B revenue, growing ~30%. Higher growth but similar margin profile.
- **Fortinet (FTNT)** — Network security peer, more hardware-oriented but transitioning to cloud. Lower multiple, different margin structure, but competes directly in firewall/SASE.
- **Zscaler (ZS)** — Pure-play cloud security (SASE/zero trust). Higher growth (~30%+), smaller scale (~$2.5B rev), trades at premium to PANW on growth.
- **Check Point (CHKP)** — Legacy firewall peer. Lower growth (5-8%), much cheaper valuation (18x earnings). Useful as a "what mature cyber looks like" comp.
- **SentinelOne (S)** — Smaller endpoint player (~$700M rev), not yet profitable. Growth comp, not valuation comp.

2. **Relevant Multiples**

EV/Revenue is the primary comp metric for cybersecurity — profitability profiles vary widely. Forward EV/Revenue on NTM estimates normalizes for growth differences. Secondary: Rule of 40 (revenue growth + FCF margin) is the best quality-adjusted metric for the sector. P/E is less useful given varying stock-based comp levels.

3. **Key Differentiators**

PANW's platformization strategy is unique — bundling firewall, SASE, XDR, and cloud security under unified licensing. This drives 80%+ gross retention and expanding DBNRR (~120%). At 16.8x EV/Revenue, PANW trades at a premium to Fortinet (10x) and Check Point (7x) but a discount to Zscaler (20x). The premium is justified by: platform breadth, margin trajectory toward 25%+ FCF margins, and TAM expansion into SIEM/SOAR via XSIAM.

4. **Suggested Comps Table**

| Company | EV/Rev (NTM) | Rev Growth | FCF Margin | Rule of 40 | DBNRR |
Columns: Ticker, EV/NTM Rev, Rev Growth %, Gross Margin %, Op Margin %, FCF Margin %, Rule of 40, NRR/DBNRR, Mkt Cap`,
    fullPrompt: "[full prompt text]",
  },
  {
    id: 1008, promptId: "sql-query", promptTitle: "SQL Query Builder", categoryId: "data",
    inputs: "Top 10 by 30d momentum per sector, prices(date,ticker,close) sectors(ticker,sector)", hadData: false, timestamp: "4/8/2026, 9:05:47 AM", rating: 5,
    marketData: "",
    output: `1. **The Query**

\`\`\`sql
-- Top 10 stocks by 30-day price momentum within each sector
-- Momentum defined as (current_price - price_30d_ago) / price_30d_ago

WITH latest_date AS (
    SELECT MAX(date) AS max_date FROM prices
),
current_prices AS (
    SELECT p.ticker, p.close AS current_close, p.date
    FROM prices p
    INNER JOIN latest_date ld ON p.date = ld.max_date
),
prices_30d_ago AS (
    SELECT p.ticker, p.close AS prev_close, p.date
    FROM prices p
    INNER JOIN latest_date ld
        ON p.date = (
            SELECT MAX(date) FROM prices
            WHERE date <= ld.max_date - INTERVAL '30 days'
        )
),
momentum AS (
    SELECT
        c.ticker,
        s.sector,
        c.current_close,
        p.prev_close,
        ROUND((c.current_close - p.prev_close) / NULLIF(p.prev_close, 0) * 100, 2) AS momentum_pct
    FROM current_prices c
    INNER JOIN prices_30d_ago p ON c.ticker = p.ticker
    INNER JOIN sectors s ON c.ticker = s.ticker
),
ranked AS (
    SELECT *,
        ROW_NUMBER() OVER (PARTITION BY sector ORDER BY momentum_pct DESC) AS rn
    FROM momentum
)
SELECT sector, ticker, current_close, prev_close, momentum_pct
FROM ranked
WHERE rn <= 10
ORDER BY sector, momentum_pct DESC;
\`\`\`

2. **Performance Notes**

Create composite index on prices(date, ticker, close) for the self-join. Index on sectors(ticker) for the join. The CTE approach is readable but for 10,000+ tickers, consider materializing the 30-day lag as a pre-computed column. Estimated complexity: O(n log n) for the window function, dominated by the sort.

3. **Edge Cases**

- Tickers with <30 days of history will be excluded (INNER JOIN handles this)
- NULLIF guards against division by zero on prev_close
- If multiple prices exist for the same date (unlikely but possible in dirty data), the CTE will create duplicates — add DISTINCT or pick one via ROW_NUMBER
- Weekends/holidays: using MAX(date) <= 30 days ago handles non-trading days correctly

4. **Validation Query**

\`\`\`sql
-- Verify: count should be exactly 10 per sector (or fewer if sector has <10 stocks)
SELECT sector, COUNT(*) AS cnt
FROM ranked WHERE rn <= 10
GROUP BY sector ORDER BY sector;

-- Spot check: momentum should be monotonically decreasing within each sector
SELECT sector, ticker, momentum_pct, rn
FROM ranked WHERE rn <= 3 ORDER BY sector, rn;
\`\`\``,
    fullPrompt: "[full prompt text]",
  },
  {
    id: 1009, promptId: "compliance-check", promptTitle: "Compliance Pre-Trade Check", categoryId: "risk",
    inputs: "Buy 50,000 shares of XYZ at market", hadData: false, timestamp: "4/7/2026, 11:30:00 AM", rating: 4,
    marketData: "",
    output: `1. **Regulatory Flags**

- Verify XYZ is not on the firm's restricted list (check against insider/MNPI log)
- Confirm no quiet period or blackout window applies (check if XYZ has pending M&A or if the firm has had recent contact with management)
- Position limit check: 50,000 shares must be evaluated against ADV — if this represents >5% of average daily volume, consider breaking the order across multiple days for best execution and to avoid market impact concerns

2. **Concentration Limits**

- At market execution, calculate notional value as a percentage of fund NAV ($4.9B)
- Standard limits: single position should not exceed 5% of NAV at cost; verify this order keeps total XYZ exposure within that threshold
- Sector concentration: confirm that adding XYZ does not push any single sector above the firm's 35% gross exposure limit

3. **Disclosure Requirements**

- Calculate post-trade beneficial ownership: if firm + related entities hold >5% of XYZ shares outstanding, a Schedule 13D or 13G filing is triggered within 10 calendar days
- 13F reporting: position will be included in next quarterly 13F filing if held at quarter-end and exceeds $200K notional
- Form PF: evaluate whether position changes the fund's exposure profile enough to require updated reporting

4. **Best Execution**

- At 50,000 shares, evaluate whether market order is appropriate vs. VWAP or TWAP algorithm
- Route through primary broker with best execution monitoring enabled
- If ADV is under 500,000, recommend algo execution over 2-4 hours to minimize impact
- Document execution venue selection rationale per Rule 206(4)-7

5. **Documentation**

Pre-trade: investment thesis memo, compliance sign-off, restricted list check (timestamped). Post-trade: execution report with fill details, best execution analysis, updated portfolio exposure report.`,
    fullPrompt: "[full prompt text]",
  },
  {
    id: 1010, promptId: "dataset-explore", promptTitle: "Dataset Explorer", categoryId: "data",
    inputs: "5 years daily options flow, unusual activity detection", hadData: false, timestamp: "4/7/2026, 9:18:22 AM", rating: 3,
    marketData: "",
    output: `1. **Data Quality Checks**

- Verify no missing trading days (should have ~252 rows per year × 5 = ~1,260 trading days)
- Check for duplicate entries on same date/ticker/strike/expiry combinations
- Validate premium values are positive and volume ≥ open interest changes make logical sense
- Flag any records where implied volatility is 0 or negative (data error)
- Check bid-ask spread reasonableness: spreads wider than 50% of mid-price suggest illiquid or stale quotes

2. **Exploratory Analysis**

- Distribution of daily total options volume by underlying (identify concentration)
- Put/call ratio time series — look for regime shifts around major market events
- Volume vs. open interest scatter — clusters above the diagonal indicate unusual activity
- Implied volatility term structure by sector over time
- Correlation between unusual options flow and subsequent 5/10/20-day stock returns

3. **Feature Engineering**

- Volume/OI ratio (daily) — values >3 suggest unusual activity
- Premium-weighted directional indicator (net call premium - net put premium, normalized by ADV)
- IV rank (current IV percentile vs. trailing 252-day range)
- Sweep detection flag: orders executed across multiple exchanges within 1-second window
- Size anomaly score: Z-score of trade size vs. trailing 20-day average for that ticker

4. **Statistical Tests**

- Two-sample t-test: compare forward returns after high vs. low unusual activity days
- Granger causality: does options flow predict next-day stock returns?
- Chi-squared: is unusual call activity independent of sector?

5. **Top 5 Visualizations**

- Heatmap of unusual activity frequency by sector × month
- Scatter: Volume/OI ratio vs. 5-day forward return (with regression line)
- Time series: rolling 20-day unusual activity count with S&P 500 overlay
- Distribution of trade sizes with anomaly threshold marked
- Sankey diagram: flow from unusual activity detection → direction (call/put) → outcome (profitable/not)`,
    fullPrompt: "[full prompt text]",
  },
];

// ─── Main ────────────────────────────────────────────────────────────────────

export default function FinPrompt() {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [view, setView] = useState("workflows"); // workflows | analytics | logs
  const [activeCategory, setActiveCategory] = useState("research");
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [variables, setVariables] = useState({});
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [marketData, setMarketData] = useState("");
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [editText, setEditText] = useState("");
  const [logs, setLogs] = useState(SEED_LOGS);
  const [viewingLog, setViewingLog] = useState(null);
  const [displayedText, setDisplayedText] = useState("");
  const [typingDone, setTypingDone] = useState(false);
  const outputRef = useRef(null);
  const timerRef = useRef(null);

  const category = categories.find(c => c.id === activeCategory);

  // Typewriter
  useEffect(() => {
    setDisplayedText(""); setTypingDone(false);
    if (!output) return;
    let i = 0;
    timerRef.current = setInterval(() => { i += 3; setDisplayedText(output.slice(0, i)); if (i >= output.length) { clearInterval(timerRef.current); setTypingDone(true); } }, 6);
    return () => clearInterval(timerRef.current);
  }, [output]);

  useEffect(() => { if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight; }, [displayedText]);

  const fillTemplate = (t, v) => { let f = t; Object.entries(v).forEach(([k, val]) => { f = f.replaceAll(`{{${k}}}`, val || `[${k}]`); }); return f; };

  const handleRun = async () => {
    if (!selectedPrompt) return;
    setLoading(true); setOutput(""); setError(""); setMarketData("");
    let enriched = "";
    const tk = selectedPrompt.enrichTicker;
    const ticker = tk ? variables[tk]?.toUpperCase() : null;

    if (ticker && apiKey) {
      setDataLoading(true);
      try {
        const [q, o, n] = await Promise.all([fetchQuote(ticker, apiKey), fetchOverview(ticker, apiKey), fetchNews(ticker, apiKey)]);
        enriched = formatMarketData(q, o, n);
      } catch { enriched = "[Data fetch failed]"; }
      setMarketData(enriched); setDataLoading(false);
    } else if (ticker && !apiKey) {
      enriched = "[No API key — add in Settings]"; setMarketData(enriched);
    }

    const filled = fillTemplate(selectedPrompt.template, { ...variables, MARKET_DATA: enriched });
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: filled }] }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.type === "text" ? b.text : "").join("\n") || "No response.";
      setOutput(text);

      const newLog = {
        id: Date.now(),
        promptId: selectedPrompt.id,
        promptTitle: selectedPrompt.title,
        categoryId: activeCategory,
        inputs: Object.values(variables).filter(Boolean).join(", "),
        output: text,
        marketData: enriched,
        hadData: !!enriched && enriched !== "[No API key — add in Settings]",
        timestamp: new Date().toLocaleString(),
        rating: 0,
        fullPrompt: filled,
      };
      setLogs(prev => [newLog, ...prev]);
    } catch { setError("API request failed."); }
    finally { setLoading(false); }
  };

  const selectPrompt = (p) => { setSelectedPrompt(p); setVariables({}); setOutput(""); setError(""); setMarketData(""); setEditingPrompt(null); };

  const handleSaveEdit = () => {
    if (!editingPrompt || !editText) return;
    setCategories(prev => prev.map(cat => ({
      ...cat,
      prompts: cat.prompts.map(p => p.id === editingPrompt.id ? { ...p, template: editText } : p)
    })));
    if (selectedPrompt?.id === editingPrompt.id) {
      setSelectedPrompt(prev => ({ ...prev, template: editText }));
    }
    setEditingPrompt(null); setEditText("");
  };

  const handleForkPrompt = () => {
    if (!selectedPrompt) return;
    const fork = { ...selectedPrompt, id: selectedPrompt.id + "-fork-" + Date.now(), title: selectedPrompt.title + " (Custom)", template: editText || selectedPrompt.template };
    setCategories(prev => prev.map(cat => cat.id === activeCategory ? { ...cat, prompts: [...cat.prompts, fork] } : cat));
    setEditingPrompt(null); setEditText("");
    setSelectedPrompt(fork);
  };

  const rateLog = (logId, rating) => {
    setLogs(prev => prev.map(l => l.id === logId ? { ...l, rating } : l));
  };

  // Analytics
  const totalRuns = logs.length;
  const avgRating = logs.filter(l => l.rating > 0).length > 0
    ? (logs.filter(l => l.rating > 0).reduce((s, l) => s + l.rating, 0) / logs.filter(l => l.rating > 0).length).toFixed(1)
    : "—";
  const dataEnrichedRuns = logs.filter(l => l.hadData).length;
  const catBreakdown = INITIAL_CATEGORIES.map(c => ({
    ...c,
    runs: logs.filter(l => l.categoryId === c.id).length,
    avgRating: logs.filter(l => l.categoryId === c.id && l.rating > 0).length > 0
      ? (logs.filter(l => l.categoryId === c.id && l.rating > 0).reduce((s, l) => s + l.rating, 0) / logs.filter(l => l.categoryId === c.id && l.rating > 0).length).toFixed(1) : "—"
  }));
  const topPrompts = [...new Set(logs.map(l => l.promptTitle))].map(title => ({
    title,
    runs: logs.filter(l => l.promptTitle === title).length,
    avg: logs.filter(l => l.promptTitle === title && l.rating > 0).length > 0
      ? (logs.filter(l => l.promptTitle === title && l.rating > 0).reduce((s, l) => s + l.rating, 0) / logs.filter(l => l.promptTitle === title && l.rating > 0).length).toFixed(1) : "—"
  })).sort((a, b) => b.runs - a.runs).slice(0, 5);

  const formatOut = (text) => {
    if (!text) return null;
    return text.split("\n").map((line, i) => {
      if (line.match(/^\*\*.*\*\*$/)) return <div key={i} style={{ color: "#fff", fontWeight: 700, marginTop: 12, marginBottom: 4, fontSize: 14 }}>{line.replace(/\*\*/g, "")}</div>;
      if (line.match(/^\d+\.\s\*\*/)) {
        const p = line.match(/^(\d+\.)\s\*\*(.*?)\*\*(.*)$/);
        if (p) return <div key={i} style={{ marginTop: 10 }}><span style={{ color: "#00D4AA", fontWeight: 700 }}>{p[1]} </span><span style={{ color: "#E0E0E0", fontWeight: 700 }}>{p[2]}</span><span style={{ color: "#A0A0A0" }}>{p[3]}</span></div>;
      }
      if (line.startsWith("- ") || line.startsWith("• ")) return <div key={i} style={{ paddingLeft: 16, color: "#B0B0B0", marginTop: 2 }}>▸ {line.slice(2)}</div>;
      if (line.trim() === "") return <div key={i} style={{ height: 8 }} />;
      return <div key={i} style={{ color: "#C0C0C0", lineHeight: 1.6 }}>{line}</div>;
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0E17", color: "#E0E0E0", fontFamily: S, display: "flex", flexDirection: "column" }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />

      {/* ── Header ── */}
      <div style={{ borderBottom: "1px solid #1A2035", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(180deg, #0D1220 0%, #0A0E17 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 30, height: 30, background: "linear-gradient(135deg, #00D4AA, #00A885)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontWeight: 700, fontSize: 15, color: "#0A0E17" }}>F</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>FinPrompt</div>
            <div style={{ fontSize: 10, color: "#3A4558", letterSpacing: "1.5px", textTransform: "uppercase" }}>AI Workflow Layer for Asset Management</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Nav tabs */}
          {[
            { id: "workflows", label: "Workflows" },
            { id: "logs", label: `Logs (${logs.length})` },
            { id: "analytics", label: "Analytics" },
          ].map(tab => (
            <button key={tab.id} onClick={() => { setView(tab.id); setViewingLog(null); }}
              style={{
                background: view === tab.id ? "#151D2E" : "transparent",
                border: view === tab.id ? "1px solid #1E2A42" : "1px solid transparent",
                color: view === tab.id ? "#fff" : "#4A5568",
                padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: F, fontWeight: 500, transition: "all 0.15s",
              }}>
              {tab.label}
            </button>
          ))}
          <div style={{ width: 1, height: 20, background: "#1A2035", margin: "0 6px" }} />
          <button onClick={() => setShowSettings(!showSettings)}
            style={{ background: showSettings ? "#1A2035" : "transparent", border: "1px solid #1A2035", color: apiKey ? "#00D4AA" : "#5A6577", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: F }}>
            ⚙
          </button>
          <div style={{ width: 8, height: 8, background: apiKey ? "#00D4AA" : "#FF6B6B", borderRadius: "50%", boxShadow: `0 0 8px ${apiKey ? "#00D4AA" : "#FF6B6B"}44` }} />
        </div>
      </div>

      {/* ── Settings ── */}
      {showSettings && (
        <div style={{ borderBottom: "1px solid #1A2035", padding: "14px 24px", background: "#0C1019", display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 300px" }}>
            <label style={{ display: "block", fontSize: 10, color: "#4A5568", marginBottom: 5, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>
              Alpha Vantage API Key <span style={{ color: "#2A3548", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>— free at alphavantage.co</span>
            </label>
            <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value.trim())} placeholder="Paste key..."
              style={{ width: "100%", padding: "8px 12px", background: "#0A0E17", border: "1px solid #1E2A42", borderRadius: 6, color: "#E0E0E0", fontSize: 13, fontFamily: F, outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = "#00D4AA"} onBlur={e => e.target.style.borderColor = "#1E2A42"} />
          </div>
          <div style={{ fontSize: 11, color: "#2A3548", lineHeight: 1.5, maxWidth: 300, paddingBottom: 2 }}>
            Live enrichment: quotes, fundamentals, valuation, and news sentiment injected into prompts.
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Sidebar (always visible) ── */}
        {view === "workflows" && (
          <div style={{ width: 260, minWidth: 260, borderRight: "1px solid #1A2035", overflowY: "auto", background: "#0C1019", padding: "14px 0" }}>
            <div style={{ padding: "0 10px", marginBottom: 14 }}>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setSelectedPrompt(null); setOutput(""); setMarketData(""); setEditingPrompt(null); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 10px", marginBottom: 1, background: activeCategory === cat.id ? `${cat.color}12` : "transparent", border: "none", borderLeft: activeCategory === cat.id ? `2px solid ${cat.color}` : "2px solid transparent", color: activeCategory === cat.id ? cat.color : "#4A5568", cursor: "pointer", borderRadius: "0 6px 6px 0", fontFamily: S, fontSize: 12, fontWeight: activeCategory === cat.id ? 600 : 400, textAlign: "left" }}>
                  <span style={{ fontSize: 14 }}>{cat.icon}</span>{cat.label}
                  <span style={{ marginLeft: "auto", fontSize: 10, color: "#2A3548", fontFamily: F }}>{logs.filter(l => l.categoryId === cat.id).length}</span>
                </button>
              ))}
            </div>
            <div style={{ padding: "0 10px" }}>
              <div style={{ fontSize: 9, color: "#2A3548", textTransform: "uppercase", letterSpacing: "1.5px", padding: "6px 10px 4px", fontWeight: 600 }}>Workflows</div>
              {category?.prompts.map(p => (
                <button key={p.id} onClick={() => selectPrompt(p)}
                  style={{ display: "block", width: "100%", padding: "10px", marginBottom: 3, background: selectedPrompt?.id === p.id ? "#151D2E" : "transparent", border: selectedPrompt?.id === p.id ? "1px solid #1E2A42" : "1px solid transparent", borderRadius: 7, cursor: "pointer", textAlign: "left" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ color: selectedPrompt?.id === p.id ? "#fff" : "#7A8599", fontSize: 12, fontWeight: 600, fontFamily: S }}>{p.title}</span>
                    {p.enrichTicker && <span style={{ fontSize: 8, background: "#00D4AA22", color: "#00D4AA", padding: "1px 4px", borderRadius: 3, fontFamily: F, fontWeight: 600 }}>LIVE</span>}
                  </div>
                  <div style={{ color: "#3A4558", fontSize: 10, lineHeight: 1.4, fontFamily: S, marginTop: 2 }}>{p.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Main Content ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* ─ WORKFLOWS VIEW ─ */}
          {view === "workflows" && !selectedPrompt && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, color: "#1E2A42" }}>
              <div style={{ fontSize: 44 }}>◈</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#2A3548" }}>Select a workflow to begin</div>
              <div style={{ fontSize: 11, color: "#1A2035" }}>{categories.reduce((s, c) => s + c.prompts.length, 0)} workflows · {categories.filter(c => c.prompts.some(p => p.enrichTicker)).length} with live data enrichment</div>
              {!apiKey && (
                <div style={{ marginTop: 6, padding: "10px 16px", background: "#0F1218", border: "1px solid #1A2035", borderRadius: 8, maxWidth: 360, textAlign: "center" }}>
                  <div style={{ color: "#FFE66D", fontSize: 11, fontWeight: 600, marginBottom: 3 }}>⚡ Connect Data Layer</div>
                  <div style={{ color: "#3A4558", fontSize: 10, lineHeight: 1.5 }}>Add an Alpha Vantage API key in ⚙ to enable real-time data enrichment.</div>
                </div>
              )}
            </div>
          )}

          {view === "workflows" && selectedPrompt && (
            <>
              {/* Config */}
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #1A2035", background: "#0C1019" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>{selectedPrompt.title}</h2>
                      {selectedPrompt.enrichTicker && (
                        <span style={{ fontSize: 9, background: apiKey ? "#00D4AA18" : "#FF6B6B18", color: apiKey ? "#00D4AA" : "#FF6B6B", padding: "2px 7px", borderRadius: 4, fontFamily: F, fontWeight: 600 }}>
                          {apiKey ? "◉ LIVE" : "○ NO KEY"}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: "3px 0 0", color: "#4A5568", fontSize: 12 }}>{selectedPrompt.description}</p>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => { setEditingPrompt(selectedPrompt); setEditText(selectedPrompt.template); }}
                      style={{ background: "#0A0E17", border: "1px solid #1A2035", color: "#5A6577", padding: "5px 10px", borderRadius: 5, cursor: "pointer", fontSize: 11, fontFamily: F }}>
                      ✎ Edit
                    </button>
                    <span style={{ background: `${category.color}15`, color: category.color, padding: "5px 10px", borderRadius: 5, fontSize: 10, fontWeight: 600, fontFamily: F, display: "flex", alignItems: "center" }}>{category.label}</span>
                  </div>
                </div>

                {/* Edit mode */}
                {editingPrompt?.id === selectedPrompt.id && (
                  <div style={{ marginBottom: 14 }}>
                    <textarea value={editText} onChange={e => setEditText(e.target.value)}
                      style={{ width: "100%", height: 160, padding: 12, background: "#080B12", border: "1px solid #1E2A42", borderRadius: 8, color: "#7A8599", fontSize: 12, fontFamily: F, lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" }}
                      onFocus={e => e.target.style.borderColor = category.color} onBlur={e => e.target.style.borderColor = "#1E2A42"} />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button onClick={handleSaveEdit} style={{ padding: "6px 14px", background: category.color, border: "none", borderRadius: 5, color: "#0A0E17", fontWeight: 600, fontSize: 11, cursor: "pointer", fontFamily: S }}>Save Changes</button>
                      <button onClick={handleForkPrompt} style={{ padding: "6px 14px", background: "#1A2035", border: "1px solid #2A3548", borderRadius: 5, color: "#7A8599", fontSize: 11, cursor: "pointer", fontFamily: S }}>Fork as New</button>
                      <button onClick={() => { setEditingPrompt(null); setEditText(""); }} style={{ padding: "6px 14px", background: "transparent", border: "1px solid #1A2035", borderRadius: 5, color: "#3A4558", fontSize: 11, cursor: "pointer", fontFamily: S }}>Cancel</button>
                    </div>
                  </div>
                )}

                {/* Variables */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
                  {selectedPrompt.variables.map(v => (
                    <div key={v.key} style={{ flex: "1 1 180px" }}>
                      <label style={{ display: "block", fontSize: 10, color: "#3A4558", marginBottom: 4, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>{v.label}</label>
                      <input type="text" value={variables[v.key] || ""} onChange={e => setVariables({ ...variables, [v.key]: e.target.value })} placeholder={v.placeholder}
                        style={{ width: "100%", padding: "9px 11px", background: "#0A0E17", border: "1px solid #1E2A42", borderRadius: 6, color: "#E0E0E0", fontSize: 13, fontFamily: F, outline: "none", boxSizing: "border-box" }}
                        onFocus={e => e.target.style.borderColor = category.color} onBlur={e => e.target.style.borderColor = "#1E2A42"} />
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button onClick={handleRun}
                    disabled={loading || dataLoading || selectedPrompt.variables.some(v => !variables[v.key])}
                    style={{
                      padding: "9px 24px",
                      background: (loading || dataLoading || selectedPrompt.variables.some(v => !variables[v.key])) ? "#1A2035" : `linear-gradient(135deg, ${category.color}, ${category.color}CC)`,
                      border: "none", borderRadius: 7, color: (loading || dataLoading || selectedPrompt.variables.some(v => !variables[v.key])) ? "#3A4558" : "#0A0E17",
                      fontWeight: 700, fontSize: 12, cursor: (loading || dataLoading || selectedPrompt.variables.some(v => !variables[v.key])) ? "not-allowed" : "pointer", fontFamily: S,
                    }}>
                    {dataLoading ? "◌ Fetching..." : loading ? "◌ Running..." : "▶ Execute Workflow"}
                  </button>
                  {selectedPrompt.enrichTicker && <span style={{ fontSize: 10, color: "#2A3548" }}>{apiKey ? "Data → Enrich → Execute → Log" : "Add API key for data enrichment"}</span>}
                </div>
              </div>

              {/* Output */}
              <div ref={outputRef} style={{ flex: 1, overflowY: "auto", padding: "20px 24px", background: "#0A0E17" }}>
                {(marketData || dataLoading) && (
                  <div style={{ background: "#080B12", border: `1px solid ${category.color}25`, borderRadius: 8, padding: 12, marginBottom: 12, maxHeight: 180, overflowY: "auto" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: dataLoading ? "#FFE66D" : "#00D4AA", animation: dataLoading ? "pulse 1s infinite" : "none" }} />
                      <span style={{ fontSize: 9, color: "#3A4558", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600 }}>{dataLoading ? "Fetching..." : "Data Loaded"}</span>
                    </div>
                    {marketData && <pre style={{ fontSize: 10, color: "#4A5568", fontFamily: F, whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.5 }}>{marketData}</pre>}
                  </div>
                )}
                {error && <div style={{ background: "#2D1215", border: "1px solid #5C2427", borderRadius: 8, padding: 14, color: "#FF6B6B", fontSize: 12, fontFamily: F }}>{error}</div>}
                {(output || loading) && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
                      <div style={{ width: 5, height: 5, background: typingDone ? category.color : "#FFE66D", borderRadius: "50%", animation: typingDone ? "none" : "pulse 1s infinite" }} />
                      <span style={{ fontSize: 10, color: "#3A4558", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600 }}>{loading ? "Executing..." : typingDone ? "Complete" : "Streaming"}</span>
                    </div>
                    <div style={{ fontFamily: F, fontSize: 12, lineHeight: 1.7 }}>
                      {formatOut(displayedText)}
                      {!typingDone && !loading && <span style={{ display: "inline-block", width: 6, height: 14, background: category.color, animation: "blink 0.8s infinite", verticalAlign: "text-bottom", marginLeft: 1 }} />}
                    </div>
                  </div>
                )}
                {!output && !loading && !error && !marketData && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#151D2E", flexDirection: "column", gap: 6 }}>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "1.5px" }}>Configure inputs and execute</div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ─ LOGS VIEW ─ */}
          {view === "logs" && !viewingLog && (
            <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>Output Log</h2>
                  <p style={{ margin: "3px 0 0", color: "#3A4558", fontSize: 12 }}>Every workflow execution is logged for traceability and refinement.</p>
                </div>
                <span style={{ fontSize: 11, color: "#2A3548", fontFamily: F }}>{logs.length} entries</span>
              </div>
              {logs.length === 0 ? (
                <div style={{ textAlign: "center", color: "#1A2035", marginTop: 80 }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>▤</div>
                  <div style={{ fontSize: 12 }}>No workflow runs yet. Execute a workflow to start building your log.</div>
                </div>
              ) : (
                logs.map(log => (
                  <LogEntry key={log.id} log={log} onView={() => setViewingLog(log)} onRate={(r) => rateLog(log.id, r)} />
                ))
              )}
            </div>
          )}

          {view === "logs" && viewingLog && (
            <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
              <button onClick={() => setViewingLog(null)} style={{ background: "none", border: "1px solid #1A2035", color: "#5A6577", padding: "5px 12px", borderRadius: 5, cursor: "pointer", fontSize: 11, fontFamily: F, marginBottom: 16 }}>← Back to logs</button>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>{viewingLog.promptTitle}</h2>
                {viewingLog.hadData && <span style={{ fontSize: 8, background: "#00D4AA22", color: "#00D4AA", padding: "1px 5px", borderRadius: 3, fontFamily: F }}>LIVE DATA</span>}
              </div>
              <div style={{ fontSize: 11, color: "#3A4558", fontFamily: F, marginBottom: 16 }}>{viewingLog.inputs} · {viewingLog.timestamp}</div>
              <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => rateLog(viewingLog.id, s)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: viewingLog.rating >= s ? "#FFE66D" : "#1E2A42", padding: 0 }}>★</button>
                ))}
                <span style={{ fontSize: 11, color: "#3A4558", marginLeft: 8, alignSelf: "center" }}>{viewingLog.rating > 0 ? `${viewingLog.rating}/5` : "Rate this output"}</span>
              </div>
              {viewingLog.marketData && viewingLog.hadData && (
                <details style={{ marginBottom: 16 }}>
                  <summary style={{ cursor: "pointer", color: "#2A3548", fontSize: 10, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Market Data Used</summary>
                  <pre style={{ background: "#080B12", border: "1px solid #1A2035", borderRadius: 8, padding: 12, fontSize: 10, color: "#4A5568", fontFamily: F, whiteSpace: "pre-wrap", marginTop: 8, maxHeight: 200, overflowY: "auto" }}>{viewingLog.marketData}</pre>
                </details>
              )}
              <div style={{ fontFamily: F, fontSize: 12, lineHeight: 1.7 }}>{formatOut(viewingLog.output)}</div>
            </div>
          )}

          {/* ─ ANALYTICS VIEW ─ */}
          {view === "analytics" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
              <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#fff" }}>Usage Analytics</h2>
              <p style={{ margin: "0 0 20px", color: "#3A4558", fontSize: 12 }}>Track adoption, quality, and data enrichment across workflows.</p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
                <StatCard label="Total Runs" value={totalRuns} sub="all workflows" color="#00D4AA" />
                <StatCard label="Avg Rating" value={avgRating} sub="rated outputs" color="#FFE66D" />
                <StatCard label="Data-Enriched" value={dataEnrichedRuns} sub={`${totalRuns > 0 ? Math.round(dataEnrichedRuns / totalRuns * 100) : 0}% of runs`} color="#4ECDC4" />
                <StatCard label="Workflows" value={categories.reduce((s, c) => s + c.prompts.length, 0)} sub={`${categories.length} categories`} color="#FF6B6B" />
              </div>

              {/* Category breakdown */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, color: "#2A3548", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, marginBottom: 12 }}>By Category</div>
                {catBreakdown.map(c => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#0C1019", border: "1px solid #1A2035", borderRadius: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 14, color: c.color }}>{c.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#8A95A8", flex: 1 }}>{c.label}</span>
                    <span style={{ fontSize: 12, color: c.color, fontFamily: F, fontWeight: 700, minWidth: 40, textAlign: "right" }}>{c.runs}</span>
                    <span style={{ fontSize: 10, color: "#3A4558", fontFamily: F, minWidth: 30, textAlign: "right" }}>runs</span>
                    <div style={{ width: 1, height: 16, background: "#1A2035", margin: "0 4px" }} />
                    <span style={{ fontSize: 12, color: "#FFE66D", fontFamily: F, fontWeight: 700, minWidth: 30, textAlign: "right" }}>{c.avgRating}</span>
                    <span style={{ fontSize: 10, color: "#3A4558", fontFamily: F }}>avg</span>
                    {/* Bar */}
                    <div style={{ width: 80, height: 4, background: "#1A2035", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${totalRuns > 0 ? (c.runs / totalRuns) * 100 : 0}%`, height: "100%", background: c.color, borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Top prompts */}
              {topPrompts.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: "#2A3548", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, marginBottom: 12 }}>Top Workflows</div>
                  {topPrompts.map((p, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: "#0C1019", border: "1px solid #1A2035", borderRadius: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "#00D4AA", fontFamily: F, fontWeight: 700 }}>#{i + 1}</span>
                      <span style={{ fontSize: 12, color: "#8A95A8", flex: 1 }}>{p.title}</span>
                      <span style={{ fontSize: 11, color: "#4ECDC4", fontFamily: F }}>{p.runs} runs</span>
                      <span style={{ fontSize: 11, color: "#FFE66D", fontFamily: F }}>★ {p.avg}</span>
                    </div>
                  ))}
                </div>
              )}

              {logs.length === 0 && (
                <div style={{ textAlign: "center", color: "#1A2035", marginTop: 40 }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>◊</div>
                  <div style={{ fontSize: 12 }}>Run workflows to start generating analytics.</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%,50%{opacity:1} 51%,100%{opacity:0} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:#0A0E17}
        ::-webkit-scrollbar-thumb{background:#1A2035;border-radius:3px}
      `}</style>
    </div>
  );
}
