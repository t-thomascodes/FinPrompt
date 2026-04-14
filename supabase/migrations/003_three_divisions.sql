-- Three workflow divisions: research, risk, operations. Retire standalone "data" category.

update public.workflow_logs
set category_id = 'operations'
where category_id = 'data';

update public.prompts
set category_id = 'operations'
where category_id = 'data';

delete from public.categories where id = 'data';
