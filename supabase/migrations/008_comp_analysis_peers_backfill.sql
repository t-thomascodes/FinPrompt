-- Backfill Comparable Company Screen so API payloads include optional peer tickers (client also merges from seed).

update public.prompts
set
  enrich_peer_tickers = coalesce(nullif(trim(enrich_peer_tickers), ''), 'PEERS'),
  variables = variables || jsonb_build_array(
    jsonb_build_object(
      'key', 'PEERS',
      'label', 'Peer tickers (optional)',
      'placeholder', 'Leave blank to suggest peers; or MSFT, ORCL… (comma-separated, max 6) for live peer data',
      'optional', true
    )
  )
where id = 'comp-analysis'
  and not (variables @> '[{"key":"PEERS"}]'::jsonb);
