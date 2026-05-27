-- Extend event categories with tournament configuration fields used by admin form.

alter table public.event_categories
  add column if not exists participant_count integer,
  add column if not exists participant_unit text,
  add column if not exists pairing_zone_count integer not null default 0,
  add column if not exists pairing_cluster_count integer not null default 0,
  add column if not exists pairing_group_count integer not null default 0,
  add column if not exists pairing_table_count integer not null default 0,
  add column if not exists prize_breakdown jsonb not null default '[]'::jsonb;

update public.event_categories
set participant_unit = case
  when lower(name) like '%ganda%' then 'pasang'
  when lower(name) like '%tunggal%' then 'athlet'
  else 'peserta'
end
where participant_unit is null;

update public.event_categories
set participant_count = 1
where participant_count is null;

update public.event_categories
set prize_breakdown = '[]'::jsonb
where prize_breakdown is null;

alter table public.event_categories
  alter column participant_count set not null,
  alter column participant_count set default 1,
  alter column participant_unit set not null,
  alter column participant_unit set default 'peserta';

alter table public.event_categories
  drop constraint if exists event_categories_participant_count_check,
  add constraint event_categories_participant_count_check check (participant_count > 0);

alter table public.event_categories
  drop constraint if exists event_categories_participant_unit_check,
  add constraint event_categories_participant_unit_check check (participant_unit in ('pasang', 'athlet', 'peserta'));

alter table public.event_categories
  drop constraint if exists event_categories_pairing_zone_count_check,
  add constraint event_categories_pairing_zone_count_check check (pairing_zone_count >= 0);

alter table public.event_categories
  drop constraint if exists event_categories_pairing_cluster_count_check,
  add constraint event_categories_pairing_cluster_count_check check (pairing_cluster_count >= 0);

alter table public.event_categories
  drop constraint if exists event_categories_pairing_group_count_check,
  add constraint event_categories_pairing_group_count_check check (pairing_group_count >= 0);

alter table public.event_categories
  drop constraint if exists event_categories_pairing_table_count_check,
  add constraint event_categories_pairing_table_count_check check (pairing_table_count >= 0);

alter table public.event_categories
  drop constraint if exists event_categories_registration_window_check,
  add constraint event_categories_registration_window_check check (
    registration_open_at is null
    or registration_close_at is null
    or registration_close_at >= registration_open_at
  );

alter table public.event_categories
  drop constraint if exists event_categories_competition_window_check,
  add constraint event_categories_competition_window_check check (
    competition_start_at is null
    or competition_end_at is null
    or competition_end_at >= competition_start_at
  );
