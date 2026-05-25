create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'event_status') then
    create type public.event_status as enum ('draft', 'published', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'registration_payment_status') then
    create type public.registration_payment_status as enum ('pending', 'paid', 'rejected');
  end if;

  if not exists (select 1 from pg_type where typname = 'registration_verification_status') then
    create type public.registration_verification_status as enum ('pending', 'verified', 'rejected');
  end if;

  if not exists (select 1 from pg_type where typname = 'admin_role') then
    create type public.admin_role as enum ('super_admin', 'admin_category');
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
