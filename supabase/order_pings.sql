-- Admin/super-admin can ping a customer: in-app alert + delivered meme.

create table if not exists public.order_pings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  kind text not null default 'delivered',
  meme_path text,
  message text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists order_pings_user_unread_idx
  on public.order_pings (user_id, created_at desc)
  where read_at is null;

alter table public.order_pings enable row level security;

drop policy if exists "order_pings self read" on public.order_pings;
drop policy if exists "order_pings self seen" on public.order_pings;
drop policy if exists "order_pings admin insert" on public.order_pings;
drop policy if exists "order_pings admin read" on public.order_pings;

create policy "order_pings self read"
  on public.order_pings for select
  to authenticated
  using (auth.uid() = user_id);

create policy "order_pings self seen"
  on public.order_pings for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "order_pings admin insert"
  on public.order_pings for insert
  to authenticated
  with check (public.is_admin());

create policy "order_pings admin read"
  on public.order_pings for select
  to authenticated
  using (public.is_admin());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'order_pings'
  ) then
    alter publication supabase_realtime add table public.order_pings;
  end if;
end $$;
