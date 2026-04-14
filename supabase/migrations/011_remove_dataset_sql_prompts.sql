-- Retire Dataset Explorer and SQL Query Builder workflows.

delete from public.prompts
where id in ('dataset-explore', 'sql-query');
