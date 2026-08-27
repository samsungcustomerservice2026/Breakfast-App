-- Standalone meme pools per app situation.
-- Seed rows: supabase/memes_seed.sql  (paths are ASCII — Storage rejects Arabic names)

create table if not exists public.meme_files (
  id uuid primary key default gen_random_uuid(),
  situation text not null,
  path text not null,
  original_name text,
  sort integer not null default 0,
  unique (situation, path)
);

alter table public.meme_files enable row level security;

drop policy if exists "meme_files_select_auth" on public.meme_files;
create policy "meme_files_select_auth"
  on public.meme_files for select
  to authenticated
  using (true);

drop policy if exists "meme_files_admin_all" on public.meme_files;
create policy "meme_files_admin_all"
  on public.meme_files for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());
