-- Payment screenshot + paid flag cannot be undone.
-- Safe to re-run.

alter table public.orders add column if not exists pay_proof text;

create or replace function public.orders_lock_paid()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and old.paid is true then
    new.paid := true;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_lock_paid on public.orders;
create trigger orders_lock_paid
  before update on public.orders
  for each row execute function public.orders_lock_paid();
