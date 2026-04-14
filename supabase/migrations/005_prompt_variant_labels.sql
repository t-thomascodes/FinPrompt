-- Custom display names for template versions under each workflow (By workflow → prompt groups).

create table if not exists public.prompt_variant_labels (
  prompt_id text not null,
  variant_key text not null,
  label text not null,
  updated_at timestamptz not null default now(),
  primary key (prompt_id, variant_key)
);
