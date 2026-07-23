-- =============================================================================
-- TaskFlow — Supabase schema
-- Run this entire file once in the Supabase SQL Editor (Project > SQL Editor)
-- for a fresh project. Safe to re-run: uses IF NOT EXISTS / OR REPLACE guards.
-- =============================================================================

-- 1. Extensions -----------------------------------------------------------
create extension if not exists "pgcrypto";

-- 2. Enum types -------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'task_status') then
    create type task_status as enum ('todo', 'in_progress', 'completed');
  end if;

  if not exists (select 1 from pg_type where typname = 'task_priority') then
    create type task_priority as enum ('low', 'medium', 'high');
  end if;
end $$;

-- 3. Tasks table --------------------------------------------------------------
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null check (char_length(trim(title)) > 0 and char_length(title) <= 200),
  description text check (char_length(description) <= 2000),
  status      task_status not null default 'todo',
  priority    task_priority not null default 'medium',
  due_date    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.tasks is 'Tasks owned by an authenticated user.';

-- 4. Indexes ------------------------------------------------------------------
create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists tasks_user_id_created_at_idx on public.tasks (user_id, created_at desc);
create index if not exists tasks_user_id_status_idx on public.tasks (user_id, status);
create index if not exists tasks_user_id_priority_idx on public.tasks (user_id, priority);
create index if not exists tasks_user_id_due_date_idx on public.tasks (user_id, due_date);

-- 5. updated_at trigger ---------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row
  execute function public.set_updated_at();

-- 6. Row Level Security -----------------------------------------------------
alter table public.tasks enable row level security;

drop policy if exists "Users can view own tasks" on public.tasks;
create policy "Users can view own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own tasks" on public.tasks;
create policy "Users can insert own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own tasks" on public.tasks;
create policy "Users can update own tasks"
  on public.tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own tasks" on public.tasks;
create policy "Users can delete own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- 7. Realtime -----------------------------------------------------------------
-- Adds the tasks table to the supabase_realtime publication so INSERT/UPDATE/
-- DELETE events are broadcast to subscribed clients. RLS still applies:
-- each user only receives change events for rows they own.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'tasks'
  ) then
    alter publication supabase_realtime add table public.tasks;
  end if;
end $$;

-- =============================================================================
-- Done. Next steps:
--   1. Project Settings > API — copy the Project URL and anon public key into
--      .env.local (see .env.local.example).
--   2. Authentication > Providers — Email provider is enabled by default.
--   3. Authentication > URL Configuration — add your site URL (and
--      http://localhost:3000 for local dev) plus the /auth/callback path to
--      the Redirect URLs allow-list.
-- =============================================================================
