-- Dedicated storage and metadata table for event banners.
-- This keeps event assets separated from CMS public-page media assets.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-banners',
  'event-banners',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.event_banner_path_allowed(p_name text)
returns boolean
language sql
stable
as $$
  select
    split_part(p_name, '/', 1) = 'events'
    and position('/' in p_name) > 1;
$$;

create table if not exists public.event_banners (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  bucket_id text not null default 'event-banners',
  object_path text not null unique,
  public_url text,
  file_name text,
  mime_type text,
  file_size bigint,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_event_banners_event_id on public.event_banners(event_id);
create index if not exists idx_event_banners_is_active on public.event_banners(is_active);
create index if not exists idx_event_banners_sort_order on public.event_banners(event_id, sort_order);

drop trigger if exists trg_event_banners_set_updated_at on public.event_banners;
create trigger trg_event_banners_set_updated_at
before update on public.event_banners
for each row
execute procedure public.set_updated_at();

alter table public.event_banners enable row level security;

drop policy if exists event_banners_public_read on public.event_banners;
create policy event_banners_public_read
on public.event_banners
for select
using (
  is_active = true
);

drop policy if exists event_banners_super_admin_manage on public.event_banners;
create policy event_banners_super_admin_manage
on public.event_banners
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists storage_event_banners_public_read on storage.objects;
create policy storage_event_banners_public_read
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'event-banners'
  and public.event_banner_path_allowed(name)
);

drop policy if exists storage_event_banners_super_admin_insert on storage.objects;
create policy storage_event_banners_super_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'event-banners'
  and public.event_banner_path_allowed(name)
  and public.is_super_admin(auth.uid())
);

drop policy if exists storage_event_banners_super_admin_update on storage.objects;
create policy storage_event_banners_super_admin_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'event-banners'
  and public.event_banner_path_allowed(name)
  and public.is_super_admin(auth.uid())
)
with check (
  bucket_id = 'event-banners'
  and public.event_banner_path_allowed(name)
  and public.is_super_admin(auth.uid())
);

drop policy if exists storage_event_banners_super_admin_delete on storage.objects;
create policy storage_event_banners_super_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'event-banners'
  and public.event_banner_path_allowed(name)
  and public.is_super_admin(auth.uid())
);

drop policy if exists storage_event_banners_bucket_read on storage.buckets;
create policy storage_event_banners_bucket_read
on storage.buckets
for select
to anon, authenticated
using (id = 'event-banners');

grant select, insert, update, delete on table public.event_banners to authenticated;
grant select on table public.event_banners to anon;
