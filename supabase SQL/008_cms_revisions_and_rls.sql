create table if not exists public.cms_page_revisions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.cms_pages(id) on delete cascade,
  revision_no integer not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  snapshot jsonb not null,
  change_note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint cms_page_revisions_unique unique (page_id, revision_no)
);

create index if not exists idx_cms_page_revisions_page on public.cms_page_revisions(page_id);
create index if not exists idx_cms_page_revisions_status on public.cms_page_revisions(status);

create or replace function public.generate_cms_page_snapshot(p_page_id uuid)
returns jsonb
language sql
stable
set search_path = public
as $$
  with page_data as (
    select to_jsonb(p.*) as page_json
    from public.cms_pages p
    where p.id = p_page_id
  ),
  section_data as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'section', to_jsonb(s),
          'blocks', (
            select coalesce(jsonb_agg(to_jsonb(b) order by b.sort_order, b.created_at), '[]'::jsonb)
            from public.cms_page_blocks b
            where b.section_id = s.id
          )
        )
        order by s.sort_order, s.created_at
      ),
      '[]'::jsonb
    ) as sections_json
    from public.cms_page_sections s
    where s.page_id = p_page_id
  )
  select jsonb_build_object(
    'page', (select page_json from page_data),
    'sections', (select sections_json from section_data)
  );
$$;

grant execute on function public.generate_cms_page_snapshot(uuid) to authenticated;

alter table public.cms_pages enable row level security;
alter table public.cms_page_sections enable row level security;
alter table public.cms_page_blocks enable row level security;
alter table public.cms_navigation_menus enable row level security;
alter table public.cms_navigation_items enable row level security;
alter table public.cms_site_settings enable row level security;
alter table public.cms_page_revisions enable row level security;

drop policy if exists cms_pages_public_read on public.cms_pages;
create policy cms_pages_public_read
on public.cms_pages
for select
using (is_published = true);

drop policy if exists cms_pages_super_admin_manage on public.cms_pages;
create policy cms_pages_super_admin_manage
on public.cms_pages
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists cms_page_sections_public_read on public.cms_page_sections;
create policy cms_page_sections_public_read
on public.cms_page_sections
for select
using (
  is_visible = true
  and exists (
    select 1
    from public.cms_pages p
    where p.id = cms_page_sections.page_id
      and p.is_published = true
  )
);

drop policy if exists cms_page_sections_super_admin_manage on public.cms_page_sections;
create policy cms_page_sections_super_admin_manage
on public.cms_page_sections
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists cms_page_blocks_public_read on public.cms_page_blocks;
create policy cms_page_blocks_public_read
on public.cms_page_blocks
for select
using (
  is_visible = true
  and exists (
    select 1
    from public.cms_page_sections s
    join public.cms_pages p on p.id = s.page_id
    where s.id = cms_page_blocks.section_id
      and s.is_visible = true
      and p.is_published = true
  )
);

drop policy if exists cms_page_blocks_super_admin_manage on public.cms_page_blocks;
create policy cms_page_blocks_super_admin_manage
on public.cms_page_blocks
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists cms_navigation_menus_public_read on public.cms_navigation_menus;
create policy cms_navigation_menus_public_read
on public.cms_navigation_menus
for select
using (is_active = true);

drop policy if exists cms_navigation_menus_super_admin_manage on public.cms_navigation_menus;
create policy cms_navigation_menus_super_admin_manage
on public.cms_navigation_menus
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists cms_navigation_items_public_read on public.cms_navigation_items;
create policy cms_navigation_items_public_read
on public.cms_navigation_items
for select
using (
  is_visible = true
  and exists (
    select 1
    from public.cms_navigation_menus m
    where m.id = cms_navigation_items.menu_id
      and m.is_active = true
  )
);

drop policy if exists cms_navigation_items_super_admin_manage on public.cms_navigation_items;
create policy cms_navigation_items_super_admin_manage
on public.cms_navigation_items
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists cms_site_settings_public_read on public.cms_site_settings;
create policy cms_site_settings_public_read
on public.cms_site_settings
for select
using (is_public = true);

drop policy if exists cms_site_settings_super_admin_manage on public.cms_site_settings;
create policy cms_site_settings_super_admin_manage
on public.cms_site_settings
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists cms_page_revisions_super_admin_manage on public.cms_page_revisions;
create policy cms_page_revisions_super_admin_manage
on public.cms_page_revisions
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));
