-- Extend registrations table to match current public registration form fields.
-- This migration adds explicit athlete 1/2 data and photo URL fields.

alter table public.registrations
  add column if not exists athlete_1_name text,
  add column if not exists athlete_1_whatsapp text,
  add column if not exists athlete_1_photo_url text,
  add column if not exists athlete_2_name text,
  add column if not exists athlete_2_whatsapp text,
  add column if not exists athlete_2_photo_url text;

-- Backfill athlete_1 columns from legacy single-participant columns.
update public.registrations
set
  athlete_1_name = coalesce(athlete_1_name, full_name),
  athlete_1_whatsapp = coalesce(athlete_1_whatsapp, whatsapp)
where athlete_1_name is null
   or athlete_1_whatsapp is null;

-- Keep athlete pair data consistent:
-- if athlete_2_name is filled, athlete_2_whatsapp must also be filled, and vice versa.
alter table public.registrations
  drop constraint if exists registrations_athlete_2_pair_check,
  add constraint registrations_athlete_2_pair_check check (
    (athlete_2_name is null and athlete_2_whatsapp is null)
    or (athlete_2_name is not null and athlete_2_whatsapp is not null)
  );

