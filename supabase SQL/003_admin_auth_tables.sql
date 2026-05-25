create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row
execute procedure public.set_updated_at();

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.admin_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create index if not exists idx_user_roles_user on public.user_roles(user_id);
create index if not exists idx_user_roles_role on public.user_roles(role);

create table if not exists public.admin_category_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  category_id uuid not null references public.event_categories(id) on delete cascade,
  can_verify_registration boolean not null default false,
  can_score_rr boolean not null default false,
  can_score_se boolean not null default false,
  rr_cluster_scopes text[] not null default '{}',
  se_cluster_scopes text[] not null default '{}',
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_category_access_unique unique (user_id, event_id, category_id),
  constraint admin_category_access_permission_check check (
    can_verify_registration
    or can_score_rr
    or can_score_se
  )
);

create index if not exists idx_admin_category_access_user on public.admin_category_access(user_id);
create index if not exists idx_admin_category_access_event_category on public.admin_category_access(event_id, category_id);

drop trigger if exists trg_admin_category_access_set_updated_at on public.admin_category_access;
create trigger trg_admin_category_access_set_updated_at
before update on public.admin_category_access
for each row
execute procedure public.set_updated_at();

create or replace function public.validate_admin_access_category_event()
returns trigger
language plpgsql
as $$
declare
  v_event_id uuid;
begin
  select event_id into v_event_id
  from public.event_categories
  where id = new.category_id;

  if v_event_id is null then
    raise exception 'Category not found for category_id=%', new.category_id;
  end if;

  if v_event_id <> new.event_id then
    raise exception 'event_id mismatch: category belongs to event % but received %', v_event_id, new.event_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_admin_access_validate_category_event on public.admin_category_access;
create trigger trg_admin_access_validate_category_event
before insert or update on public.admin_category_access
for each row
execute procedure public.validate_admin_access_category_event();
