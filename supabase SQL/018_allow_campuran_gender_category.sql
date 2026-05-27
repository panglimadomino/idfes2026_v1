-- Allow "Campuran" gender category for event categories.

update public.event_categories
set gender_category = 'Campuran'
where lower(name) like '%campuran%'
  and gender_category not in ('Campuran');

alter table public.event_categories
  drop constraint if exists event_categories_gender_category_check,
  add constraint event_categories_gender_category_check check (gender_category in ('Putra', 'Putri', 'Campuran'));
