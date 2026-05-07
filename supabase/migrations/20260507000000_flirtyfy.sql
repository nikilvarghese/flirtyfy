create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  persona text default 'Charmer',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.generations (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  type text not null check (type in ('reply', 'opener', 'bio', 'ocr')),
  input_text text not null,
  persona text not null,
  tone text not null,
  output jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  generation_id text references public.generations(id) on delete cascade,
  reply text not null,
  created_at timestamptz default now()
);

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revenuecat_customer_id text,
  entitlement text default 'free',
  status text default 'inactive',
  current_period_end timestamptz,
  updated_at timestamptz default now()
);

create table if not exists public.usage_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  generations_count int not null default 0,
  created_at timestamptz default now(),
  unique (user_id, usage_date)
);

alter table public.profiles enable row level security;
alter table public.generations enable row level security;
alter table public.favorites enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_tracking enable row level security;

create policy "profiles are user owned" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "generations are user owned" on public.generations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "favorites are user owned" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "subscriptions are user owned" on public.subscriptions
  for select using (auth.uid() = user_id);

create policy "usage is user owned" on public.usage_tracking
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into public.generations (id, user_id, type, input_text, persona, tone, output)
select
  'demo-reply-seed',
  id,
  'reply',
  'Them: so am I boring?',
  'Charmer',
  'Flirty',
  '[{"tone":"flirty","reply":"Not yet. You still have time to surprise me.","reason":"Playful challenge without being harsh."}]'::jsonb
from auth.users
on conflict do nothing;
