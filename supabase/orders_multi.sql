-- Allow more than one order per person per day.
-- Run once in Supabase SQL Editor.

alter table public.orders drop constraint if exists orders_user_id_order_date_key;

alter table public.orders add column if not exists created_at timestamptz not null default now();

create index if not exists orders_user_date_idx on public.orders (user_id, order_date);
create index if not exists orders_created_idx on public.orders (created_at);
