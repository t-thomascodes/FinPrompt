-- List endpoint used to SELECT full `output` / `inputs` for every row; truncation happened in JS after
-- transfer. Large LLM outputs can make /api/app-state time out on serverless hosts even though inserts succeed.
-- These stored generated columns keep list reads small (same caps as APP_STATE_LIST_* in workflowDb.ts).

alter table public.workflow_logs
  add column if not exists output_list_excerpt text
  generated always as (left(coalesce(output, ''), 3200)) stored;

alter table public.workflow_logs
  add column if not exists inputs_list_excerpt text
  generated always as (left(coalesce(inputs, ''), 3200)) stored;
