-- Optional variable key for comma-separated peer tickers; each peer gets a compact market block in MARKET_DATA.

alter table public.prompts
add column if not exists enrich_peer_tickers text;
