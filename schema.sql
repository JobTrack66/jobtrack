-- JobTrack Cloud Database
-- Run this entire file in Supabase SQL Editor.

create table if not exists public.jobtrack_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.jobtrack_data enable row level security;

drop policy if exists "Users can read own JobTrack data" on public.jobtrack_data;
drop policy if exists "Users can insert own JobTrack data" on public.jobtrack_data;
drop policy if exists "Users can update own JobTrack data" on public.jobtrack_data;
drop policy if exists "Users can delete own JobTrack data" on public.jobtrack_data;

create policy "Users can read own JobTrack data"
on public.jobtrack_data for select
using (auth.uid() = user_id);

create policy "Users can insert own JobTrack data"
on public.jobtrack_data for insert
with check (auth.uid() = user_id);

create policy "Users can update own JobTrack data"
on public.jobtrack_data for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own JobTrack data"
on public.jobtrack_data for delete
using (auth.uid() = user_id);

create index if not exists jobtrack_data_updated_at_idx
on public.jobtrack_data(updated_at);
