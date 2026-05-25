create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  city text,
  venue text,
  description text,
  hero_title text,
  hero_subtitle text,
  hero_cta_label text default 'Daftar Sekarang',
  hero_cta_url text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status public.event_status not null default 'draft',
  is_featured boolean not null default false,
  manual_active_override boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_date_check check (end_at >= start_at)
);

create index if not exists idx_events_status_start_at on public.events(status, start_at);

drop trigger if exists trg_events_set_updated_at on public.events;
create trigger trg_events_set_updated_at
before update on public.events
for each row
execute procedure public.set_updated_at();

create table if not exists public.event_categories (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  registration_open_at timestamptz,
  registration_close_at timestamptz,
  competition_start_at timestamptz,
  competition_end_at timestamptz,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_categories_unique_slug unique (event_id, slug),
  constraint event_categories_registration_window_check check (
    registration_open_at is null
    or registration_close_at is null
    or registration_close_at >= registration_open_at
  ),
  constraint event_categories_competition_window_check check (
    competition_start_at is null
    or competition_end_at is null
    or competition_end_at >= competition_start_at
  )
);

create index if not exists idx_event_categories_event_id on public.event_categories(event_id);
create index if not exists idx_event_categories_is_published on public.event_categories(is_published);

drop trigger if exists trg_event_categories_set_updated_at on public.event_categories;
create trigger trg_event_categories_set_updated_at
before update on public.event_categories
for each row
execute procedure public.set_updated_at();

create table if not exists public.technical_documents (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  category_id uuid references public.event_categories(id) on delete cascade,
  title text not null,
  document_type text not null default 'technical_handbook',
  file_url text not null,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint technical_documents_ref_check check (
    event_id is not null or category_id is not null
  )
);

create index if not exists idx_technical_documents_event on public.technical_documents(event_id);
create index if not exists idx_technical_documents_category on public.technical_documents(category_id);

drop trigger if exists trg_technical_documents_set_updated_at on public.technical_documents;
create trigger trg_technical_documents_set_updated_at
before update on public.technical_documents
for each row
execute procedure public.set_updated_at();

create table if not exists public.news_updates (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete set null,
  title text not null,
  summary text,
  body text,
  cover_image_url text,
  published_at timestamptz,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_news_updates_event_id on public.news_updates(event_id);
create index if not exists idx_news_updates_is_published on public.news_updates(is_published);

drop trigger if exists trg_news_updates_set_updated_at on public.news_updates;
create trigger trg_news_updates_set_updated_at
before update on public.news_updates
for each row
execute procedure public.set_updated_at();

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tier text default 'partner',
  logo_url text not null,
  website_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_partners_is_active on public.partners(is_active);

drop trigger if exists trg_partners_set_updated_at on public.partners;
create trigger trg_partners_set_updated_at
before update on public.partners
for each row
execute procedure public.set_updated_at();
