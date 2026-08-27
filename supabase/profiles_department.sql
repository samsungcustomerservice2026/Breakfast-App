-- Team / department on each profile. Safe to re-run.
alter table public.profiles add column if not exists department text;
