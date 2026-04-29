create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lemon_customer_id text,
  lemon_subscription_id text not null unique,
  lemon_variant_id text,
  plan text not null default 'free' check (plan in ('free', 'plus', 'pro')),
  status text not null default 'free',
  renews_at timestamptz,
  ends_at timestamptz,
  trial_ends_at timestamptz,
  customer_portal_url text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'plus', 'pro')),
  monthly_credits integer not null default 5,
  used_credits integer not null default 0,
  period_start timestamptz not null,
  period_end timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, period_start)
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature_type text not null,
  credits_used integer not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.credit_balances enable row level security;
alter table public.usage_events enable row level security;

create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can read own subscriptions" on public.subscriptions
  for select using (auth.uid() = user_id);

create policy "Users can read own credit balances" on public.credit_balances
  for select using (auth.uid() = user_id);

create policy "Users can read own usage events" on public.usage_events
  for select using (auth.uid() = user_id);
