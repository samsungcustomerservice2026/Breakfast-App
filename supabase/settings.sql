-- Run once in Supabase SQL Editor so admin can change the InstaPay QR and payment link.
-- Same table stores: pay_qr (image) and pay_link (URL).
create table if not exists public.app_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

drop policy if exists "settings read"  on public.app_settings;
drop policy if exists "settings write" on public.app_settings;

create policy "settings read"  on public.app_settings for select using (
  auth.role() = 'authenticated' or key in ('media_rev', 'logo_file')
);
create policy "settings write" on public.app_settings for all using (public.is_super_admin()) with check (public.is_super_admin());
