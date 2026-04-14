-- Optional suffix appended after user-editable instruction body (ticker line, {{MARKET_DATA}}, etc.)

alter table public.prompts
  add column if not exists instruction_footer text not null default '';
