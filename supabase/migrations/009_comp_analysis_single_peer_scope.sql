-- Comparable Company Screen: when live PEER blocks exist, the model must not add extra peers
-- (e.g. user lists one ticker → only that peer). Aligns DB template with src/lib/categories.ts seed.

update public.prompts
set
  template = $m$As a research analyst, build a comparable company framework for {{COMPANY_NAME}} ({{TICKER}}).

**How to use the live data below**
- There is always a **full** market data block for **{{TICKER}}** only. Every numeric claim about {{TICKER}} must come from that block (or simple arithmetic on it).
- **Peer live data:** The appendix may include **COMPARABLE PEERS (live data)**—one compact block per peer symbol when the user **listed peer tickers** OR **left them blank** (the system suggests tickers and fetches the same kind of data). For any symbol that has a **PEER:** block below, use **only** those numbers for that row in the comps table—do not substitute estimates for those tickers.
- **Peer set scope:** If the **COMPARABLE PEERS** appendix is present, the symbols with **PEER:** blocks are the **complete** peer set for this run—include **only** those tickers as peer companies (there may be as few as one). Do **not** add other peer names, extra comp rows, or additional comparable tickers. If the appendix is **absent**, name **4–6** appropriate peers from sector knowledge; for {{TICKER}} only use the primary block; for peers without live blocks, use **(est.)** and state figures are not from the feed.

1. **Direct Peers** — If live **PEER:** blocks exist: cover **only** those symbols (rank by comparability; a single peer is valid). If there is no peer appendix: **4–6 companies** from sector knowledge; economic linkage for each.
2. **Relevant Valuation Metrics** — Right lenses for this business model; primary company from the {{TICKER}} block; peers from PEER blocks when present, otherwise transparent estimates.
3. **Key Differentiators** — Fair vs cheap vs expensive vs peers; ground {{TICKER}} in provided data.
4. **Comps Table** — Markdown: {{TICKER}} row from primary data only; peer rows from PEER blocks when present (one row per listed peer—no extra peer tickers), otherwise clearly marked estimates.

Every sentence about {{TICKER}} should be traceable to the primary market data section.

{{MARKET_DATA}}$m$
where id = 'comp-analysis';
