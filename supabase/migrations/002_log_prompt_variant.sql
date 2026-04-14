-- Prompt *template* variant under the same workflow row (pre-substitution template;
-- same template + different tickers shares one fingerprint).

alter table public.workflow_logs
  add column if not exists full_prompt_fingerprint text,
  add column if not exists full_prompt_excerpt text;
