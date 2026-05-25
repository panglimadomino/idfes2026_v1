create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  registration_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 10)),
  event_id uuid not null references public.events(id) on delete cascade,
  category_id uuid not null references public.event_categories(id) on delete cascade,
  full_name text not null,
  nickname text,
  whatsapp text not null,
  email text,
  city text,
  province text,
  club_name text,
  date_of_birth date,
  emergency_contact_name text,
  emergency_contact_phone text,
  payment_method text not null default 'manual_transfer',
  payment_proof_url text,
  payment_status public.registration_payment_status not null default 'pending',
  verification_status public.registration_verification_status not null default 'pending',
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  admin_notes text,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_registrations_event_category on public.registrations(event_id, category_id);
create index if not exists idx_registrations_whatsapp on public.registrations(whatsapp);
create index if not exists idx_registrations_status on public.registrations(payment_status, verification_status);

drop trigger if exists trg_registrations_set_updated_at on public.registrations;
create trigger trg_registrations_set_updated_at
before update on public.registrations
for each row
execute procedure public.set_updated_at();

create or replace function public.validate_registration_category_event()
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

drop trigger if exists trg_registrations_validate_category_event on public.registrations;
create trigger trg_registrations_validate_category_event
before insert or update on public.registrations
for each row
execute procedure public.validate_registration_category_event();

create table if not exists public.registration_logs (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id) on delete cascade,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  acted_by uuid references auth.users(id) on delete set null,
  note text,
  acted_at timestamptz not null default now()
);

create index if not exists idx_registration_logs_registration_id on public.registration_logs(registration_id);

create table if not exists public.category_pairings (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.event_categories(id) on delete cascade,
  stage text not null check (stage in ('RR', 'SE')),
  cluster_code text not null,
  round_no integer not null default 1,
  pair_label text,
  participant_a_registration_id uuid references public.registrations(id) on delete set null,
  participant_b_registration_id uuid references public.registrations(id) on delete set null,
  table_no text,
  scheduled_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'completed', 'walkover', 'cancelled')),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_category_pairings_category_stage_cluster on public.category_pairings(category_id, stage, cluster_code);

drop trigger if exists trg_category_pairings_set_updated_at on public.category_pairings;
create trigger trg_category_pairings_set_updated_at
before update on public.category_pairings
for each row
execute procedure public.set_updated_at();

create table if not exists public.category_match_results (
  id uuid primary key default gen_random_uuid(),
  pairing_id uuid not null unique references public.category_pairings(id) on delete cascade,
  category_id uuid not null references public.event_categories(id) on delete cascade,
  stage text not null check (stage in ('RR', 'SE')),
  cluster_code text not null,
  score_a integer not null default 0 check (score_a >= 0),
  score_b integer not null default 0 check (score_b >= 0),
  winner_registration_id uuid references public.registrations(id) on delete set null,
  input_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_category_match_results_category_stage_cluster on public.category_match_results(category_id, stage, cluster_code);

drop trigger if exists trg_category_match_results_set_updated_at on public.category_match_results;
create trigger trg_category_match_results_set_updated_at
before update on public.category_match_results
for each row
execute procedure public.set_updated_at();
