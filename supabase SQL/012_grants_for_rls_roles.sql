-- Fix table-level privileges so RLS policies can be evaluated for anon/authenticated roles.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on table public.events to authenticated;
grant select, insert, update, delete on table public.event_categories to authenticated;
grant select, insert, update, delete on table public.technical_documents to authenticated;
grant select, insert, update, delete on table public.news_updates to authenticated;
grant select, insert, update, delete on table public.partners to authenticated;
grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.user_roles to authenticated;
grant select, insert, update, delete on table public.admin_category_access to authenticated;
grant select, insert, update, delete on table public.registrations to authenticated;
grant select, insert, update, delete on table public.registration_logs to authenticated;
grant select, insert, update, delete on table public.category_pairings to authenticated;
grant select, insert, update, delete on table public.category_match_results to authenticated;
grant select, insert, update, delete on table public.cms_pages to authenticated;
grant select, insert, update, delete on table public.cms_page_sections to authenticated;
grant select, insert, update, delete on table public.cms_page_blocks to authenticated;
grant select, insert, update, delete on table public.cms_navigation_menus to authenticated;
grant select, insert, update, delete on table public.cms_navigation_items to authenticated;
grant select, insert, update, delete on table public.cms_site_settings to authenticated;
grant select, insert, update, delete on table public.cms_page_revisions to authenticated;
grant select, insert, update, delete on table public.cms_media_assets to authenticated;
grant select, insert, update, delete on table public.cms_branding_assets to authenticated;

grant select on table public.events to anon;
grant select on table public.event_categories to anon;
grant select on table public.technical_documents to anon;
grant select on table public.news_updates to anon;
grant select on table public.partners to anon;
grant select on table public.cms_pages to anon;
grant select on table public.cms_page_sections to anon;
grant select on table public.cms_page_blocks to anon;
grant select on table public.cms_navigation_menus to anon;
grant select on table public.cms_navigation_items to anon;
grant select on table public.cms_site_settings to anon;
grant select on table public.cms_media_assets to anon;
grant select on table public.cms_branding_assets to anon;
grant insert on table public.registrations to anon;

grant usage on schema storage to anon, authenticated;
grant select on table storage.buckets to anon, authenticated;
grant select, insert, update, delete on table storage.objects to anon, authenticated;

