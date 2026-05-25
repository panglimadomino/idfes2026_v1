create table if not exists public.cms_pages (
  id uuid primary key default gen_random_uuid(),
  page_key text not null unique,
  title text not null,
  slug text not null unique,
  description text,
  event_id uuid references public.events(id) on delete set null,
  is_homepage boolean not null default false,
  is_published boolean not null default false,
  published_at timestamptz,
  seo_title text,
  seo_description text,
  seo_keywords text[],
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cms_pages_slug on public.cms_pages(slug);
create index if not exists idx_cms_pages_event on public.cms_pages(event_id);
create index if not exists idx_cms_pages_published on public.cms_pages(is_published);

drop trigger if exists trg_cms_pages_set_updated_at on public.cms_pages;
create trigger trg_cms_pages_set_updated_at
before update on public.cms_pages
for each row
execute procedure public.set_updated_at();

create table if not exists public.cms_page_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.cms_pages(id) on delete cascade,
  section_key text not null,
  section_type text not null,
  title text,
  subtitle text,
  content jsonb not null default '{}'::jsonb,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cms_page_sections_unique_key unique (page_id, section_key)
);

create index if not exists idx_cms_page_sections_page on public.cms_page_sections(page_id);
create index if not exists idx_cms_page_sections_sort on public.cms_page_sections(page_id, sort_order);

drop trigger if exists trg_cms_page_sections_set_updated_at on public.cms_page_sections;
create trigger trg_cms_page_sections_set_updated_at
before update on public.cms_page_sections
for each row
execute procedure public.set_updated_at();

create table if not exists public.cms_page_blocks (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.cms_page_sections(id) on delete cascade,
  block_key text not null,
  block_type text not null,
  payload jsonb not null default '{}'::jsonb,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cms_page_blocks_unique_key unique (section_id, block_key)
);

create index if not exists idx_cms_page_blocks_section on public.cms_page_blocks(section_id);
create index if not exists idx_cms_page_blocks_sort on public.cms_page_blocks(section_id, sort_order);

drop trigger if exists trg_cms_page_blocks_set_updated_at on public.cms_page_blocks;
create trigger trg_cms_page_blocks_set_updated_at
before update on public.cms_page_blocks
for each row
execute procedure public.set_updated_at();
