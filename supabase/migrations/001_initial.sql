-- Meridian core schema. Run in Supabase SQL Editor or via Supabase CLI.

create table if not exists public.categories (
  id text primary key,
  label text not null,
  icon text not null default '',
  color text not null,
  sort_order int not null default 0
);

create table if not exists public.prompts (
  id text primary key,
  category_id text not null references public.categories (id) on delete cascade,
  title text not null,
  description text not null default '',
  template text not null,
  variables jsonb not null default '[]'::jsonb,
  enrich_ticker text,
  sort_order int not null default 0
);

create index if not exists prompts_category_id_idx on public.prompts (category_id);

create table if not exists public.workflow_logs (
  id uuid primary key default gen_random_uuid (),
  prompt_id text not null,
  prompt_title text not null,
  category_id text not null,
  inputs text not null default '',
  variables jsonb not null default '{}'::jsonb,
  output text not null default '',
  market_data text not null default '',
  market_data_structured jsonb,
  had_data boolean not null default false,
  rating smallint not null default 0,
  full_prompt text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists workflow_logs_created_at_idx on public.workflow_logs (created_at desc);

alter table public.categories enable row level security;
alter table public.prompts enable row level security;
alter table public.workflow_logs enable row level security;

-- No policies: the anon key cannot read or write these tables.
-- The Next.js server uses SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
-- Add explicit policies only if you introduce a browser Supabase client (e.g. per-user auth).
