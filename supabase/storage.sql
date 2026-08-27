-- Public image buckets used by the app:
--   Logo   → app logo (any filename; app picks the first image)
--   memes  → cart memes (any filenames)
--   menu   → food photos named like the item id: foul-plain.jpg
--
-- Safe to re-run.

update storage.buckets
set public = true, file_size_limit = 5242880
where id in ('Logo', 'memes');

insert into storage.buckets (id, name, public, file_size_limit)
values ('menu', 'menu', true, 5242880)
on conflict (id) do update
set public = true, file_size_limit = excluded.file_size_limit;

drop policy if exists "media public read" on storage.objects;
drop policy if exists "media admin insert" on storage.objects;
drop policy if exists "media admin update" on storage.objects;
drop policy if exists "media admin delete" on storage.objects;
drop policy if exists "media super admin insert" on storage.objects;
drop policy if exists "media super admin update" on storage.objects;
drop policy if exists "media super admin delete" on storage.objects;

create policy "media public read"
on storage.objects for select
using (bucket_id in ('Logo', 'memes', 'menu'));

create policy "media admin insert"
on storage.objects for insert
to authenticated
with check (bucket_id in ('Logo', 'memes', 'menu') and public.is_super_admin());

create policy "media admin update"
on storage.objects for update
to authenticated
using (bucket_id in ('Logo', 'memes', 'menu') and public.is_super_admin())
with check (bucket_id in ('Logo', 'memes', 'menu') and public.is_super_admin());

create policy "media admin delete"
on storage.objects for delete
to authenticated
using (bucket_id in ('Logo', 'memes', 'menu') and public.is_super_admin());
