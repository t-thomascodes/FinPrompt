-- Comparable Company Screen: full hedge-fund-style template + explicit peer-set rules
-- (one listed peer ⇒ only that peer; blank peers may still get suggested PEER blocks).

update public.prompts
set
  template = $tpl$As a senior equity research analyst at a value/event-driven hedge fund, build a comparable company framework for {{COMPANY_NAME}} ({{TICKER}}) to determine whether the stock is cheap or expensive relative to peers — and whether the gap is justified.

Live data appendix (read this first)

The market data below always includes a full block for {{TICKER}} only. Every numeric statement about {{TICKER}} must come from that primary block (or simple arithmetic on it).
If the appendix includes **COMPARABLE PEERS (live data)** with **PEER:** blocks—whether from user-listed tickers under Peer tickers or from system-suggested tickers when Peer tickers was left blank—those symbols are the **complete** peer set for this analysis. There may be as few as one peer; do **not** add other peer names, extra comp rows, or tickers beyond those blocks. For each such symbol, use only that PEER block for that row's numbers in your comps table — do not substitute estimates for those tickers.
If there is **no** COMPARABLE PEERS section in the appendix (e.g. Peer tickers was left blank and no peer blocks were attached), you must still name **4–6** appropriate peers from sector/industry knowledge. Ground {{TICKER}} only in the primary block. For peer rows, use reasonable approximate multiples or ranges, mark clearly as (est.) or not from live data, and note that a re-run with peer tickers would attach verified peer figures.
Quality bar
Every comparison must be grounded in actual numbers for {{TICKER}}. If you write "trades at a premium due to stronger growth" without showing the multiple and the growth rate side by side for {{TICKER}} (and for any peer with a live PEER block), rewrite it. When peer data is estimated (no live block), say so explicitly.

Direct Peers — When **PEER:** blocks are present, your peer set is **exactly** those symbols (one peer is valid—do not pad to 4–6). When there is no live peer appendix, name **4–6** peers from sector/industry knowledge. For each peer: explain the specific economic linkage: shared end market, similar revenue mix, overlapping customer base, or comparable scale. "They're both tech companies" is not a comp rationale. State the single biggest difference that makes a 1:1 comparison imperfect. Rank from most to least comparable and flag the 1–2 tightest comps. When live PEER blocks exist for named tickers, align peer metrics with those blocks.

Valuation Framework — Select 3–4 metrics most relevant for this business model. Do not default to P/E and EV/EBITDA for every company. (Examples: SaaS → EV/Revenue and Rule of 40; bank → P/TBV and ROE; REIT → P/FFO.) For each metric: say why it's the right lens, give {{TICKER}}'s current value from the primary data, and label primary vs secondary metric for this name. Then, for each metric, express premium/discount vs peers — "{{TICKER}} trades at X.X× vs peer median Y.Y×, a Z% premium/discount" — using live peer blocks where available; otherwise use transparent (est.) peer medians/means and state they are not from the feed. Say whether each gap is justified or unjustified with a specific fundamental difference.

Key Differentiators — What justifies {{TICKER}}'s valuation vs peers? Take a clear position: fairly valued, undervalued, or overvalued vs the peer group. Support with at least 3 concrete data points from the primary market data for {{TICKER}}. If multiples conflict, explain the divergence and which metric the PM should trust. List 2–3 analytical risks to this comp framework (e.g. "{{TICKER}} has 40% services revenue vs peer average of 15%, inflating margin-based multiples") — not generic disclaimers.

Comps Table — Markdown table. Rows: {{TICKER}} first, then each peer **only** from live **PEER:** blocks when the appendix is present (one user-listed peer ⇒ one peer row after {{TICKER}}), then Peer Median and Peer Mean. Columns: Company, Ticker, Market Cap, your primary metric, P/E, Revenue Growth YoY, Gross Margin, your secondary metric. Populate {{TICKER}} from the primary section only. For each peer: if a PEER: SYMBOL block exists, populate that row from it; otherwise use (est.) and do not pretend those figures are from the live appendix.

Every sentence should either state a number, explain a number, or tell the PM what to do with a number.

{{MARKET_DATA}}$tpl$
where id = 'comp-analysis';
