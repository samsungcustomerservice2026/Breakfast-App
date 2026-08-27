-- Per-admin InstaPay QR + link. Users see the QR of the collector they picked.

alter table public.profiles add column if not exists pay_qr text;
alter table public.profiles add column if not exists pay_link text;

-- Seed Fawzy with the old global QR/link so existing pay still works.
update public.profiles p
set pay_qr = coalesce(nullif(p.pay_qr, ''), s.value)
from public.app_settings s
where s.key = 'pay_qr' and lower(trim(p.name)) = 'fawzy';

update public.profiles p
set pay_link = coalesce(nullif(p.pay_link, ''), s.value)
from public.app_settings s
where s.key = 'pay_link' and lower(trim(p.name)) = 'fawzy';
