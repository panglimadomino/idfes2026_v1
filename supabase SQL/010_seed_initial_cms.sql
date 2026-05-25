insert into public.cms_pages (
  page_key,
  title,
  slug,
  description,
  is_homepage,
  is_published,
  published_at,
  seo_title,
  seo_description
)
values
  (
    'home',
    'Home',
    '/',
    'Halaman utama IDFES 2026',
    true,
    true,
    now(),
    'IDFES 2026',
    'Portal resmi Indonesia Domino Festival 2026'
  ),
  (
    'event',
    'Event',
    '/events',
    'Daftar event IDFES',
    false,
    true,
    now(),
    'Event IDFES 2026',
    'Informasi event dan kategori pertandingan'
  ),
  (
    'peraturan',
    'Peraturan',
    '/peraturan',
    'Halaman peraturan dan technical handbook',
    false,
    true,
    now(),
    'Peraturan IDFES 2026',
    'Peraturan teknis dan dokumen pertandingan IDFES'
  ),
  (
    'form_pendaftaran',
    'Form Pendaftaran',
    '/form-pendaftaran',
    'Form pendaftaran peserta',
    false,
    true,
    now(),
    'Pendaftaran IDFES 2026',
    'Form pendaftaran event Indonesia Domino Festival 2026'
  ),
  (
    'login_admin',
    'Login Admin',
    '/login',
    'Halaman login admin',
    false,
    true,
    now(),
    'Login Admin IDFES',
    'Masuk ke dashboard admin IDFES'
  )
on conflict (page_key) do update
set
  title = excluded.title,
  slug = excluded.slug,
  description = excluded.description,
  is_homepage = excluded.is_homepage,
  is_published = excluded.is_published,
  published_at = excluded.published_at,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  updated_at = now();

insert into public.cms_page_sections (
  page_id,
  section_key,
  section_type,
  title,
  subtitle,
  content,
  is_visible,
  sort_order
)
select
  p.id,
  s.section_key,
  s.section_type,
  s.title,
  s.subtitle,
  s.content::jsonb,
  true,
  s.sort_order
from public.cms_pages p
join (
  values
    (
      'home',
      'hero',
      'hero',
      'Indonesia Domino Festival 2026',
      'Roadshow event multi-kategori',
      '{"cta_label":"Daftar Sekarang","cta_target":"active_event","background_asset_slot":"hero_background"}',
      10
    ),
    (
      'home',
      'category_cards',
      'cards',
      'Kategori Pertandingan',
      'Ringkasan kategori event aktif',
      '{"source":"active_event_categories","layout":"grid"}',
      20
    ),
    (
      'home',
      'news_updates',
      'news',
      'Berita Update',
      'Informasi terbaru IDFES 2026',
      '{"source":"news_updates","limit":6}',
      30
    ),
    (
      'home',
      'partner_banner',
      'partners',
      'Sponsor & Partner',
      null,
      '{"source":"partners","layout":"logo_marquee"}',
      40
    ),
    (
      'peraturan',
      'technical_docs',
      'documents',
      'Peraturan Teknis',
      'Dokumen PDF per event dan kategori',
      '{"source":"technical_documents"}',
      10
    ),
    (
      'form_pendaftaran',
      'registration_intro',
      'text',
      'Form Pendaftaran Peserta',
      'Isi data peserta dengan benar',
      '{"show_steps":true,"payment_mode":"manual_transfer"}',
      10
    )
) as s(page_key, section_key, section_type, title, subtitle, content, sort_order)
  on s.page_key = p.page_key
on conflict (page_id, section_key) do update
set
  section_type = excluded.section_type,
  title = excluded.title,
  subtitle = excluded.subtitle,
  content = excluded.content,
  is_visible = excluded.is_visible,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.cms_navigation_menus (
  menu_key,
  name,
  description,
  is_active
)
values
  ('header_main', 'Header Main Menu', 'Menu utama navbar', true),
  ('footer_main', 'Footer Main Menu', 'Menu utama footer', true)
on conflict (menu_key) do update
set
  name = excluded.name,
  description = excluded.description,
  is_active = excluded.is_active,
  updated_at = now();

with menu_items_seed as (
  select
    m.id as menu_id,
    i.label,
    i.target_url,
    i.sort_order
  from public.cms_navigation_menus m
  join (
    values
      ('header_main', 'Home', '/', 10),
      ('header_main', 'Event', '/events', 20),
      ('header_main', 'Peraturan', '/peraturan', 30),
      ('header_main', 'Form Pendaftaran', '/form-pendaftaran', 40),
      ('header_main', 'Login', '/login', 50),
      ('footer_main', 'Home', '/', 10),
      ('footer_main', 'Event', '/events', 20),
      ('footer_main', 'Peraturan', '/peraturan', 30),
      ('footer_main', 'Form Pendaftaran', '/form-pendaftaran', 40)
  ) as i(menu_key, label, target_url, sort_order)
    on i.menu_key = m.menu_key
),
updated_rows as (
  update public.cms_navigation_items ni
  set
    label = s.label,
    item_type = 'internal_link',
    open_in_new_tab = false,
    is_visible = true,
    sort_order = s.sort_order,
    updated_at = now()
  from menu_items_seed s
  where ni.menu_id = s.menu_id
    and ni.target_url = s.target_url
  returning ni.menu_id, ni.target_url
)
insert into public.cms_navigation_items (
  menu_id,
  parent_id,
  label,
  item_type,
  target_url,
  open_in_new_tab,
  is_visible,
  sort_order
)
select
  s.menu_id,
  null,
  s.label,
  'internal_link',
  s.target_url,
  false,
  true,
  s.sort_order
from menu_items_seed s
where not exists (
  select 1
  from updated_rows u
  where u.menu_id = s.menu_id
    and u.target_url = s.target_url
);

insert into public.cms_site_settings (
  setting_key,
  setting_group,
  value,
  is_public,
  description
)
values
  (
    'branding.header_logo_asset_id',
    'branding',
    '{"asset_id": null}'::jsonb,
    true,
    'Asset ID logo header dari cms_media_assets'
  ),
  (
    'branding.footer_logo_asset_id',
    'branding',
    '{"asset_id": null}'::jsonb,
    true,
    'Asset ID logo footer dari cms_media_assets'
  ),
  (
    'branding.hero_background_asset_id',
    'branding',
    '{"asset_id": null}'::jsonb,
    true,
    'Asset ID background hero dari cms_media_assets'
  ),
  (
    'contact.email',
    'contact',
    '{"email":"help@idfes2026.id"}'::jsonb,
    true,
    'Email kontak yang tampil di website'
  ),
  (
    'social.links',
    'social',
    '{"instagram":"","youtube":"","tiktok":""}'::jsonb,
    true,
    'Link media sosial website'
  )
on conflict (setting_key) do update
set
  setting_group = excluded.setting_group,
  value = excluded.value,
  is_public = excluded.is_public,
  description = excluded.description,
  updated_at = now();
