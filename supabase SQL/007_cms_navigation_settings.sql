create table if not exists public.cms_navigation_menus (
  id uuid primary key default gen_random_uuid(),
  menu_key text not null unique,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cms_navigation_menus_active on public.cms_navigation_menus(is_active);

drop trigger if exists trg_cms_navigation_menus_set_updated_at on public.cms_navigation_menus;
create trigger trg_cms_navigation_menus_set_updated_at
before update on public.cms_navigation_menus
for each row
execute procedure public.set_updated_at();

create table if not exists public.cms_navigation_items (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.cms_navigation_menus(id) on delete cascade,
  parent_id uuid references public.cms_navigation_items(id) on delete cascade,
  label text not null,
  item_type text not null default 'internal_link' check (item_type in ('internal_link', 'external_link', 'anchor', 'button')),
  target_url text not null,
  open_in_new_tab boolean not null default false,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cms_navigation_items_menu on public.cms_navigation_items(menu_id);
create index if not exists idx_cms_navigation_items_parent on public.cms_navigation_items(parent_id);
create index if not exists idx_cms_navigation_items_sort on public.cms_navigation_items(menu_id, sort_order);

drop trigger if exists trg_cms_navigation_items_set_updated_at on public.cms_navigation_items;
create trigger trg_cms_navigation_items_set_updated_at
before update on public.cms_navigation_items
for each row
execute procedure public.set_updated_at();

create table if not exists public.cms_site_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_group text not null default 'general',
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  description text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cms_site_settings_group on public.cms_site_settings(setting_group);
create index if not exists idx_cms_site_settings_public on public.cms_site_settings(is_public);

drop trigger if exists trg_cms_site_settings_set_updated_at on public.cms_site_settings;
create trigger trg_cms_site_settings_set_updated_at
before update on public.cms_site_settings
for each row
execute procedure public.set_updated_at();
