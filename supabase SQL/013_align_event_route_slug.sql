-- Align CMS "Event" route with app primary route /event.
-- Keep /events for event archive page.

update public.cms_pages
set
  slug = '/event',
  updated_at = now()
where page_key = 'event'
  and slug <> '/event';

update public.cms_navigation_items
set
  target_url = '/event',
  updated_at = now()
where label = 'Event'
  and target_url = '/events'
  and not exists (
    select 1
    from public.cms_navigation_items x
    where x.menu_id = cms_navigation_items.menu_id
      and x.target_url = '/event'
  );
