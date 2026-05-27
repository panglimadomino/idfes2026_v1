-- Add registration fee field for event categories.
-- Stored as integer Rupiah (without punctuation).

alter table public.event_categories
  add column if not exists registration_fee bigint;

alter table public.event_categories
  drop constraint if exists event_categories_registration_fee_check,
  add constraint event_categories_registration_fee_check check (
    registration_fee is null or registration_fee >= 0
  );

