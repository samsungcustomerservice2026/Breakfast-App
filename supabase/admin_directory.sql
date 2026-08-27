-- Super-admin directory: names, phones, teams, emails.
-- Phone lives on profiles (not auth.users.phone, which is for SMS login).

create or replace function public.admin_directory()
returns table (
  id uuid,
  name text,
  phone text,
  department text,
  role text,
  is_admin boolean,
  email text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.name,
    p.phone,
    p.department,
    p.role,
    p.is_admin,
    u.email::text
  from public.profiles p
  left join auth.users u on u.id = p.id
  where public.is_super_admin()
  order by p.name;
$$;

revoke all on function public.admin_directory() from public, anon;
grant execute on function public.admin_directory() to authenticated;
