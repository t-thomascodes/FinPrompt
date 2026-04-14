import type { WorkflowLog } from "@/lib/types";

export const SEED_LOGS: WorkflowLog[] = [
  {
    id: "seed-1001",
    promptId: "bull-bear",
    promptTitle: "Bull/Bear Case Generator",
    categoryId: "research",
    inputs: "NVDA, NVIDIA Corp",
    variables: {},
    hadData: true,
    timestamp: "4/10/2026, 9:14:22 AM",
    rating: 5,
    marketData:
      "--- COMPANY OVERVIEW ---\nNVIDIA Corp (NVDA) | Technology · Semiconductors\nMkt Cap: $2,874,000,000,000 | EV: $2,841,000,000,000\nNVIDIA designs and manufactures GPUs and AI accelerators...\n\n--- VALUATION ---\nP/E: 54.2 | Fwd P/E: 32.8 | PEG: 1.12\nP/B: 48.6 | P/S: 29.3\nEV/Rev: 28.1 | EV/EBITDA: 46.7\n\n--- FUNDAMENTALS ---\nRev TTM: $96,300,000,000 | EBITDA: $64,200,000,000\nMargin: 55.8% | Op Margin: 62.4%\nROE: 115.7% | Rev Growth: 78.2%\n\n--- LIVE QUOTE ---\n$142.87 | Chg: +3.42 (+2.45%)\nVol: 312,847,000 | Open: $139.50 | H/L: $143.22/$138.90\n\n--- NEWS ---\n1. NVIDIA Blackwell Ultra chips see record demand from hyperscalers (Reuters) — Bullish\n2. New export controls on AI chips to Middle East under review (Bloomberg) — Bearish\n3. NVIDIA partners with sovereign AI funds in Southeast Asia (CNBC) — Bullish",
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
    id: "seed-1002",
    promptId: "earnings-prep",
    promptTitle: "Earnings Call Prep",
    categoryId: "research",
    inputs: "AAPL",
    variables: {},
    hadData: true,
    timestamp: "4/10/2026, 8:47:05 AM",
    rating: 4,
    marketData:
      "--- COMPANY OVERVIEW ---\nApple Inc (AAPL) | Technology · Consumer Electronics\nMkt Cap: $3,241,000,000,000\n\n--- VALUATION ---\nP/E: 33.1 | Fwd P/E: 28.4 | PEG: 2.8\n\n--- LIVE QUOTE ---\n$214.29 | Chg: -1.03 (-0.48%)\nVol: 54,221,000",
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
    id: "seed-1003",
    promptId: "risk-assessment",
    promptTitle: "Position Risk Assessment",
    categoryId: "risk",
    inputs: "TSLA, 5% of NAV",
    variables: {},
    hadData: true,
    timestamp: "4/9/2026, 4:32:18 PM",
    rating: 3,
    marketData:
      "--- COMPANY OVERVIEW ---\nTesla Inc (TSLA) | Automotive · Electric Vehicles\nMkt Cap: $892,000,000,000\n\n--- TRADING ---\nBeta: 2.07 | 52W: $138.80–$488.54\nVol: 98,432,000",
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
    id: "seed-1004",
    promptId: "investor-update",
    promptTitle: "Investor Letter Draft",
    categoryId: "operations",
    inputs: "+3.2% gross vs S&P +4.1%, AI infrastructure buildout",
    variables: {},
    hadData: false,
    timestamp: "4/9/2026, 2:15:41 PM",
    rating: 5,
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
    id: "seed-1005",
    promptId: "bull-bear",
    promptTitle: "Bull/Bear Case Generator",
    categoryId: "research",
    inputs: "META, Meta Platforms",
    variables: {},
    hadData: true,
    timestamp: "4/9/2026, 11:08:33 AM",
    rating: 4,
    marketData:
      "--- COMPANY OVERVIEW ---\nMeta Platforms (META) | Technology · Social Media\nMkt Cap: $1,580,000,000,000\n\n--- VALUATION ---\nP/E: 25.8 | Fwd P/E: 21.2\nEV/EBITDA: 16.9",
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
    id: "seed-1006",
    promptId: "process-automation",
    promptTitle: "Process Automation Spec",
    categoryId: "operations",
    inputs: "Daily trade reconciliation, Daily ~2 hours",
    variables: {},
    hadData: false,
    timestamp: "4/8/2026, 3:45:00 PM",
    rating: 4,
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
    id: "seed-1007",
    promptId: "comp-analysis",
    promptTitle: "Comparable Company Screen",
    categoryId: "research",
    inputs: "PANW, Palo Alto Networks",
    variables: {},
    hadData: true,
    timestamp: "4/8/2026, 10:22:14 AM",
    rating: 3,
    marketData:
      "--- COMPANY OVERVIEW ---\nPalo Alto Networks (PANW) | Technology · Cybersecurity\nMkt Cap: $128,000,000,000\n\n--- VALUATION ---\nP/E: 51.4 | Fwd P/E: 38.2 | EV/Rev: 16.8",
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
    id: "seed-1009",
    promptId: "compliance-check",
    promptTitle: "Compliance Pre-Trade Check",
    categoryId: "risk",
    inputs: "Buy 50,000 shares of XYZ at market",
    variables: {},
    hadData: false,
    timestamp: "4/7/2026, 11:30:00 AM",
    rating: 4,
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
];
