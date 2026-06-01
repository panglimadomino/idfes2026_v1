-- Align public.registrations with GAS registration form fields.
-- This migration is additive and safe to run multiple times.

alter table public.registrations
  add column if not exists order_id text,
  add column if not exists registration_no text,
  add column if not exists team_name text,
  add column if not exists athlete_1_gender text,
  add column if not exists athlete_1_date_of_birth date,
  add column if not exists athlete_1_age integer,
  add column if not exists athlete_2_gender text,
  add column if not exists athlete_2_date_of_birth date,
  add column if not exists athlete_2_age integer,
  add column if not exists kabupaten_kota text,
  add column if not exists gardu_input text,
  add column if not exists gardu_final text,
  add column if not exists gardu_status text,
  add column if not exists social_media text,
  add column if not exists payment_time timestamptz,
  add column if not exists upload_time timestamptz,
  add column if not exists submit_finalized_time timestamptz,
  add column if not exists verified_time timestamptz,
  add column if not exists gardu_approved_time timestamptz,
  add column if not exists gardu_review_note text,
  add column if not exists gardu_similar_candidate text;

-- Backfill from legacy columns so old data remains usable.
update public.registrations
set
  team_name = coalesce(team_name, club_name, full_name)
where team_name is null;

update public.registrations
set
  athlete_1_name = coalesce(athlete_1_name, full_name),
  athlete_1_whatsapp = coalesce(athlete_1_whatsapp, whatsapp)
where athlete_1_name is null
   or athlete_1_whatsapp is null;

update public.registrations
set
  kabupaten_kota = coalesce(kabupaten_kota, city)
where kabupaten_kota is null;

update public.registrations
set
  registration_no = coalesce(registration_no, registration_code)
where registration_no is null;

update public.registrations
set
  order_id = coalesce(order_id, registration_code)
where order_id is null;

update public.registrations
set
  verified_time = coalesce(verified_time, verified_at)
where verified_time is null
  and verified_at is not null;

update public.registrations
set
  payment_time = coalesce(payment_time, verified_at)
where payment_time is null
  and verified_at is not null
  and lower(payment_status::text) = 'verified';

update public.registrations
set
  gardu_status = upper(trim(coalesce(gardu_status, 'PENDING')))
where gardu_status is null
   or trim(gardu_status) = ''
   or gardu_status <> upper(trim(gardu_status));

alter table public.registrations
  alter column gardu_status set default 'PENDING';

alter table public.registrations
  drop constraint if exists registrations_athlete_1_age_check,
  add constraint registrations_athlete_1_age_check check (
    athlete_1_age is null or athlete_1_age >= 0
  );

alter table public.registrations
  drop constraint if exists registrations_athlete_2_age_check,
  add constraint registrations_athlete_2_age_check check (
    athlete_2_age is null or athlete_2_age >= 0
  );

alter table public.registrations
  drop constraint if exists registrations_athlete_1_gender_check,
  add constraint registrations_athlete_1_gender_check check (
    athlete_1_gender is null or athlete_1_gender in ('Putra', 'Putri', 'Campuran')
  );

alter table public.registrations
  drop constraint if exists registrations_athlete_2_gender_check,
  add constraint registrations_athlete_2_gender_check check (
    athlete_2_gender is null or athlete_2_gender in ('Putra', 'Putri', 'Campuran')
  );

alter table public.registrations
  drop constraint if exists registrations_gardu_status_check,
  add constraint registrations_gardu_status_check check (
    gardu_status is null or upper(gardu_status) in ('PENDING', 'ACTIVE', 'REJECT', 'REJECTED')
  );

-- If athlete-2 supporting fields are filled, athlete-2 identity must exist.
alter table public.registrations
  drop constraint if exists registrations_athlete_2_details_requires_identity_check,
  add constraint registrations_athlete_2_details_requires_identity_check check (
    (
      athlete_2_gender is null
      and athlete_2_date_of_birth is null
      and athlete_2_age is null
      and athlete_2_photo_url is null
    )
    or (
      athlete_2_name is not null
      and athlete_2_whatsapp is not null
    )
  );

create unique index if not exists idx_registrations_registration_no_unique
  on public.registrations (registration_no)
  where registration_no is not null;

create index if not exists idx_registrations_order_id on public.registrations(order_id);
create index if not exists idx_registrations_kabupaten_kota on public.registrations(kabupaten_kota);
create index if not exists idx_registrations_gardu_status on public.registrations(gardu_status);
