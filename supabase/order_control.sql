-- Super admin may cancel any order and edit items even after close.
-- Safe to re-run.

alter table public.orders add column if not exists cancelled boolean not null default false;

drop policy if exists "orders super admin delete" on public.orders;
create policy "orders super admin delete" on public.orders for delete using (public.is_super_admin());

create or replace function public.orders_guard_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin boolean := public.is_admin();
  super boolean := public.is_super_admin();
begin
  if old.cancelled then
    new.cancelled := true;
    new.returned := false;
    new.closed := old.closed;
    new.items := old.items;
    new.total := old.total;
    new.collector_id := old.collector_id;
    new.paid := old.paid;
    return new;
  end if;

  if new.cancelled then
    if not super then
      new.cancelled := false;
    else
      new.returned := false;
    end if;
  end if;

  if old.closed and not super then
    new.closed := true;
    new.returned := false;
    new.items := old.items;
    new.total := old.total;
    new.collector_id := old.collector_id;
    return new;
  end if;

  if new.closed then
    new.returned := false;
  end if;

  if not admin then
    new.closed := coalesce(old.closed, false);
    new.cancelled := false;
    new.paid := old.paid;
    if old.returned then
      null;
    else
      new.returned := false;
      if new.items is distinct from old.items or new.total is distinct from old.total then
        raise exception 'الأوردر مش راجع ليك. استنى المأمور.';
      end if;
      new.collector_id := old.collector_id;
    end if;
  elsif new.returned and (old.paid or old.closed or old.cancelled) then
    new.returned := false;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_guard_status on public.orders;
create trigger orders_guard_status
  before update on public.orders
  for each row execute function public.orders_guard_status();
