-- Add identity fields for tournament categories (section A in admin form).

alter table public.event_categories
  add column if not exists age_group text,
  add column if not exists gender_category text;

update public.event_categories
set age_group = 'Bebas'
where age_group is null;

update public.event_categories
set gender_category = case
  when lower(name) like '%campuran%' then 'Campuran'
  when lower(name) like '%putri%' then 'Putri'
  else 'Putra'
end
where gender_category is null;

alter table public.event_categories
  alter column age_group set not null,
  alter column age_group set default 'Bebas',
  alter column gender_category set not null,
  alter column gender_category set default 'Putra';

alter table public.event_categories
  drop constraint if exists event_categories_age_group_check,
  add constraint event_categories_age_group_check check (age_group in ('Bebas', 'U-25', 'O+25'));

alter table public.event_categories
  drop constraint if exists event_categories_gender_category_check,
  add constraint event_categories_gender_category_check check (gender_category in ('Putra', 'Putri', 'Campuran'));
