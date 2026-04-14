-- Raw workflow template (pre-fill) for copy/view on By workflow; optional on older rows.

alter table public.workflow_logs
  add column if not exists prompt_template_snapshot text;
