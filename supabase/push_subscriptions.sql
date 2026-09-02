-- Web Push subscriptions. Private VAPID key is stored in app_push_vapid
-- (service role only) and is not kept in this repo.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (endpoint)
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push self read" on public.push_subscriptions;
drop policy if exists "push self write" on public.push_subscriptions;
drop policy if exists "push self update" on public.push_subscriptions;
drop policy if exists "push self delete" on public.push_subscriptions;

create policy "push self read"
  on public.push_subscriptions for select
  to authenticated
  using (auth.uid() = user_id);

create policy "push self write"
  on public.push_subscriptions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "push self update"
  on public.push_subscriptions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "push self delete"
  on public.push_subscriptions for delete
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.app_push_vapid (
  id int primary key default 1 check (id = 1),
  public_key text not null,
  private_key text not null,
  subject text not null default 'mailto:breakfast-app@local',
  updated_at timestamptz not null default now()
);

alter table public.app_push_vapid enable row level security;
revoke all on table public.app_push_vapid from anon, authenticated, public;
grant all on table public.app_push_vapid to service_role;
