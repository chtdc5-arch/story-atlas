-- Story Atlas 無帳號同步工作庫
-- 請在 Supabase SQL Editor 執行一次。
-- workspace_key 就是同步碼；請使用足夠長、不可猜測的字串。

create table if not exists public.workspace_sync (
  workspace_key text primary key,
  payload jsonb not null default '{"works":[],"selectedWorkId":null,"view":"overview"}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.workspace_sync enable row level security;

drop policy if exists "anonymous workspace sync" on public.workspace_sync;
create policy "anonymous workspace sync" on public.workspace_sync
  for all to anon using (true) with check (true);

grant select, insert, update on public.workspace_sync to anon;
