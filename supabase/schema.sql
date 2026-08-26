-- ============================================================
-- El Shabrawy office breakfast — Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where possible.
-- ============================================================

-- ---------- profiles: one row per auth user ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  phone       text not null,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ---------- menu: categories + items (admin-managed, world-readable) ----------
create table if not exists public.menu_categories (
  id        text primary key,          -- e.g. 'foul'
  name      text not null,             -- English label
  name_ar   text,                      -- Arabic label
  tiered    boolean not null default false, -- true = S/M/L, false = Shami/Balady
  sort      int not null default 0
);

create table if not exists public.menu_items (
  id           text primary key,       -- e.g. 'foul-special'
  category_id  text not null references public.menu_categories(id) on delete cascade,
  name         text not null,
  name_ar      text,
  -- prices in EGP; only the columns relevant to the category's tier are filled
  price_shami  numeric,
  price_balady numeric,
  price_sm     numeric,
  price_md     numeric,
  price_lg     numeric,
  sort         int not null default 0
);

-- ---------- orders: one row per person per day ----------
create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  order_date  date not null,
  -- items: [{ itemId, categoryId, categoryName, name, nameAr, tier, tierLabel, price, qty }]
  items       jsonb not null default '[]'::jsonb,
  total       numeric not null default 0,
  paid        boolean not null default false,
  updated_at  timestamptz not null default now(),
  unique (user_id, order_date)   -- enforces "one order per person per day" (upsert target)
);

create index if not exists orders_date_idx on public.orders (order_date);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles        enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items      enable row level security;
alter table public.orders          enable row level security;

-- helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ---- profiles ----
drop policy if exists "profiles self read"      on public.profiles;
drop policy if exists "profiles admin read"     on public.profiles;
drop policy if exists "profiles self upsert"    on public.profiles;
drop policy if exists "profiles self update"    on public.profiles;

create policy "profiles self read"   on public.profiles for select using (auth.uid() = id);
create policy "profiles admin read"  on public.profiles for select using (public.is_admin());
create policy "profiles self upsert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles self update" on public.profiles for update using (auth.uid() = id);

-- ---- menu: everyone signed in can read; only admins can write ----
drop policy if exists "menu cat read"  on public.menu_categories;
drop policy if exists "menu cat write" on public.menu_categories;
drop policy if exists "menu item read"  on public.menu_items;
drop policy if exists "menu item write" on public.menu_items;

create policy "menu cat read"  on public.menu_categories for select using (auth.role() = 'authenticated');
create policy "menu cat write" on public.menu_categories for all using (public.is_admin()) with check (public.is_admin());
create policy "menu item read"  on public.menu_items for select using (auth.role() = 'authenticated');
create policy "menu item write" on public.menu_items for all using (public.is_admin()) with check (public.is_admin());

-- ---- orders: a user manages their own; admins can read/update all ----
drop policy if exists "orders self read"   on public.orders;
drop policy if exists "orders self write"  on public.orders;
drop policy if exists "orders self update" on public.orders;
drop policy if exists "orders self delete" on public.orders;
drop policy if exists "orders admin read"  on public.orders;
drop policy if exists "orders admin update" on public.orders;

create policy "orders self read"   on public.orders for select using (auth.uid() = user_id);
create policy "orders self write"  on public.orders for insert with check (auth.uid() = user_id);
create policy "orders self update" on public.orders for update using (auth.uid() = user_id);
create policy "orders self delete" on public.orders for delete using (auth.uid() = user_id);
create policy "orders admin read"  on public.orders for select using (public.is_admin());
create policy "orders admin update" on public.orders for update using (public.is_admin()); -- lets admin toggle "paid"

-- ---------- app_settings: InstaPay QR (admin can replace) ----------
create table if not exists public.app_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
drop policy if exists "settings read"  on public.app_settings;
drop policy if exists "settings write" on public.app_settings;
create policy "settings read"  on public.app_settings for select using (auth.role() = 'authenticated');
create policy "settings write" on public.app_settings for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- Make yourself an admin (run AFTER you sign up once in the app):
--   update public.profiles set is_admin = true where id =
--     (select id from auth.users where email = 'you@example.com');
-- ============================================================
