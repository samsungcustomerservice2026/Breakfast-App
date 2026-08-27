-- Roles (user / admin / super_admin), order collector, and super-admin control.
-- Safe to re-run. Apply after schema.sql.

alter table public.profiles
  add column if not exists role text not null default 'user';

alter table public.orders
  add column if not exists collector_id uuid references public.profiles(id) on delete set null;

create index if not exists orders_collector_idx on public.orders (collector_id);
create index if not exists orders_date_collector_idx on public.orders (order_date, collector_id);

update public.profiles
set role = case
  when role = 'super_admin' then 'super_admin'
  when is_admin then 'admin'
  else 'user'
end
where role is null or role = 'user' or (is_admin and role <> 'super_admin');

-- Fawzy is the super admin who can promote others and change media.
update public.profiles
set role = 'super_admin', is_admin = true
where lower(trim(name)) = 'fawzy';

update public.profiles
set is_admin = (role in ('admin', 'super_admin'));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select is_admin or role in ('admin', 'super_admin')
    from public.profiles
    where id = auth.uid()
  ), false);
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select role = 'super_admin'
    from public.profiles
    where id = auth.uid()
  ), false);
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_super_admin() to authenticated;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role text;
begin
  jwt_role := coalesce(auth.jwt()->>'role', '');

  -- Dashboard SQL / Table Editor / service role: owner can set any role.
  -- Super admin in the app: same, full control.
  if auth.uid() is null or jwt_role in ('service_role', 'postgres') or public.is_super_admin() then
    if tg_op = 'UPDATE'
       and new.role is not distinct from old.role
       and new.is_admin is distinct from old.is_admin then
      new.role := case
        when new.is_admin and old.role = 'super_admin' then 'super_admin'
        when new.is_admin then 'admin'
        else 'user'
      end;
    end if;
    if new.role is null or new.role not in ('user', 'admin', 'super_admin') then
      new.role := case when coalesce(new.is_admin, false) then 'admin' else 'user' end;
    end if;
    new.is_admin := new.role in ('admin', 'super_admin');
    return new;
  end if;

  -- Regular users cannot change authority.
  if tg_op = 'INSERT' then
    new.role := 'user';
    new.is_admin := false;
    return new;
  end if;
  new.role := old.role;
  new.is_admin := old.is_admin;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before insert or update on public.profiles
  for each row execute function public.protect_profile_role();

create or replace function public.orders_validate_collector()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.collector_id is null then
    raise exception 'اختار مين هياخد الأوردر';
  end if;
  if new.collector_id is not null and not exists (
    select 1 from public.profiles p
    where p.id = new.collector_id and (p.is_admin or p.role in ('admin', 'super_admin'))
  ) then
    raise exception 'المأمور ده مش موجود';
  end if;
  return new;
end;
$$;

drop trigger if exists orders_validate_collector on public.orders;
create trigger orders_validate_collector
  before insert or update on public.orders
  for each row execute function public.orders_validate_collector();

drop policy if exists "profiles collectors read" on public.profiles;
create policy "profiles collectors read"
  on public.profiles for select
  using (is_admin = true or role in ('admin', 'super_admin'));

drop policy if exists "profiles super admin update" on public.profiles;
create policy "profiles super admin update"
  on public.profiles for update
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Media / menu / settings: super admin only. Order collection stays is_admin().
drop policy if exists "menu cat write" on public.menu_categories;
create policy "menu cat write" on public.menu_categories
  for all using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists "menu item write" on public.menu_items;
create policy "menu item write" on public.menu_items
  for all using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists "settings write" on public.app_settings;
create policy "settings write" on public.app_settings
  for all using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists "meme_files_admin_all" on public.meme_files;
create policy "meme_files_admin_all"
  on public.meme_files for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "media admin insert" on storage.objects;
drop policy if exists "media admin update" on storage.objects;
drop policy if exists "media admin delete" on storage.objects;
drop policy if exists "media super admin insert" on storage.objects;
drop policy if exists "media super admin update" on storage.objects;
drop policy if exists "media super admin delete" on storage.objects;

create policy "media super admin insert"
on storage.objects for insert
to authenticated
with check (bucket_id in ('Logo', 'memes', 'menu') and public.is_super_admin());

create policy "media super admin update"
on storage.objects for update
to authenticated
using (bucket_id in ('Logo', 'memes', 'menu') and public.is_super_admin())
with check (bucket_id in ('Logo', 'memes', 'menu') and public.is_super_admin());

create policy "media super admin delete"
on storage.objects for delete
to authenticated
using (bucket_id in ('Logo', 'memes', 'menu') and public.is_super_admin());
