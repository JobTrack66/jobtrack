-- JobTrack Pro subscriptions for Pesapal payments.
-- Run after schema.sql in Supabase SQL Editor.

create table if not exists public.jobtrack_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro')),
  billing_cycle text check (billing_cycle in ('monthly','yearly')),
  status text not null default 'inactive' check (status in ('active','inactive','cancelled')),
  provider text,
  provider_merchant_reference text,
  provider_tracking_id text,
  amount numeric,
  currency text default 'UGX',
  started_at timestamptz,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.jobtrack_subscriptions enable row level security;

drop policy if exists "Users can read own subscription" on public.jobtrack_subscriptions;
create policy "Users can read own subscription"
on public.jobtrack_subscriptions for select
using (auth.uid() = user_id);

-- Writes are performed by the secure server using the Supabase service role.

create table if not exists public.jobtrack_payment_intents (
  merchant_reference text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('monthly','yearly')),
  amount numeric not null,
  currency text not null default 'UGX',
  status text not null default 'created',
  tracking_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.jobtrack_payment_intents enable row level security;
drop policy if exists "Users can read own payment intents" on public.jobtrack_payment_intents;
create policy "Users can read own payment intents"
on public.jobtrack_payment_intents for select
using (auth.uid() = user_id);
