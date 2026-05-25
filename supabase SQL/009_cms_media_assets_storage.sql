insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cms-assets',
  'cms-assets',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.cms_asset_path_allowed(p_name text)
returns boolean
language sql
stable
as $$
  select
    position('/' in p_name) > 1
    and split_part(p_name, '/', 1) in ('branding', 'pages', 'sections');
$$;

create table if not exists public.cms_media_assets (
  id uuid primary key default gen_random_uuid(),
  asset_key text unique,
  usage_type text not null default 'generic' check (
    usage_type in (
      'header_logo',
      'footer_logo',
      'hero_background',
      'section_background',
      'generic'
    )
  ),
  bucket_id text not null default 'cms-assets',
  object_path text not null unique,
  public_url text,
  file_name text,
  mime_type text,
  file_size bigint,
  width integer,
  height integer,
  alt_text text,
  event_id uuid references public.events(id) on delete set null,
  page_id uuid references public.cms_pages(id) on delete set null,
  section_id uuid references public.cms_page_sections(id) on delete set null,
  is_active boolean not null default true,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cms_media_assets_usage_type on public.cms_media_assets(usage_type);
create index if not exists idx_cms_media_assets_event_id on public.cms_media_assets(event_id);
create index if not exists idx_cms_media_assets_page_id on public.cms_media_assets(page_id);
create index if not exists idx_cms_media_assets_section_id on public.cms_media_assets(section_id);
create index if not exists idx_cms_media_assets_active on public.cms_media_assets(is_active);

drop trigger if exists trg_cms_media_assets_set_updated_at on public.cms_media_assets;
create trigger trg_cms_media_assets_set_updated_at
before update on public.cms_media_assets
for each row
execute procedure public.set_updated_at();

create table if not exists public.cms_branding_assets (
  id uuid primary key default gen_random_uuid(),
  slot_key text not null check (
    slot_key in ('header_logo', 'footer_logo', 'hero_background')
  ),
  event_id uuid references public.events(id) on delete cascade,
  media_asset_id uuid not null references public.cms_media_assets(id) on delete cascade,
  is_active boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_cms_branding_assets_global_slot
on public.cms_branding_assets(slot_key)
where event_id is null;

create unique index if not exists uq_cms_branding_assets_event_slot
on public.cms_branding_assets(slot_key, event_id)
where event_id is not null;

drop trigger if exists trg_cms_branding_assets_set_updated_at on public.cms_branding_assets;
create trigger trg_cms_branding_assets_set_updated_at
before update on public.cms_branding_assets
for each row
execute procedure public.set_updated_at();

alter table public.cms_media_assets enable row level security;
alter table public.cms_branding_assets enable row level security;

drop policy if exists cms_media_assets_public_read on public.cms_media_assets;
create policy cms_media_assets_public_read
on public.cms_media_assets
for select
using (is_active = true);

drop policy if exists cms_media_assets_super_admin_manage on public.cms_media_assets;
create policy cms_media_assets_super_admin_manage
on public.cms_media_assets
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists cms_branding_assets_public_read on public.cms_branding_assets;
create policy cms_branding_assets_public_read
on public.cms_branding_assets
for select
using (is_active = true);

drop policy if exists cms_branding_assets_super_admin_manage on public.cms_branding_assets;
create policy cms_branding_assets_super_admin_manage
on public.cms_branding_assets
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists storage_cms_assets_public_read on storage.objects;
create policy storage_cms_assets_public_read
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'cms-assets'
  and public.cms_asset_path_allowed(name)
);

drop policy if exists storage_cms_assets_super_admin_insert on storage.objects;
create policy storage_cms_assets_super_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'cms-assets'
  and public.cms_asset_path_allowed(name)
  and public.is_super_admin(auth.uid())
);

drop policy if exists storage_cms_assets_super_admin_update on storage.objects;
create policy storage_cms_assets_super_admin_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'cms-assets'
  and public.cms_asset_path_allowed(name)
  and public.is_super_admin(auth.uid())
)
with check (
  bucket_id = 'cms-assets'
  and public.cms_asset_path_allowed(name)
  and public.is_super_admin(auth.uid())
);

drop policy if exists storage_cms_assets_super_admin_delete on storage.objects;
create policy storage_cms_assets_super_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'cms-assets'
  and public.cms_asset_path_allowed(name)
  and public.is_super_admin(auth.uid())
);

drop policy if exists storage_cms_assets_bucket_read on storage.buckets;
create policy storage_cms_assets_bucket_read
on storage.buckets
for select
to anon, authenticated
using (id = 'cms-assets');
