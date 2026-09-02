-- Return an order to the customer, or lock it closed.
-- Safe to re-run.

alter table public.orders add column if not exists returned boolean not null default false;
alter table public.orders add column if not exists closed boolean not null default false;

create or replace function public.orders_guard_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin boolean := public.is_admin();
begin
  if old.closed then
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
    new.closed := false;
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
  else
    if new.returned and (old.paid or old.closed) then
      new.returned := false;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_guard_status on public.orders;
create trigger orders_guard_status
  before update on public.orders
  for each row execute function public.orders_guard_status();
