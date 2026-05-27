-- Add registration bank transfer fields for event categories.

alter table public.event_categories
  add column if not exists registration_bank_name_1 text,
  add column if not exists registration_bank_account_number_1 text,
  add column if not exists registration_bank_account_holder_1 text,
  add column if not exists registration_bank_name_2 text,
  add column if not exists registration_bank_account_number_2 text,
  add column if not exists registration_bank_account_holder_2 text;

