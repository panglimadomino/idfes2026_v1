update public.cms_navigation_items
set
  label = 'Form Pendaftaran',
  updated_at = now()
where target_url = '/form-pendaftaran'
  and label = 'Kontrak';

with ranked as (
  select
    ctid,
    row_number() over (
      partition by menu_id, target_url
      order by updated_at desc nulls last, created_at desc, id desc
    ) as rn
  from public.cms_navigation_items
)
delete from public.cms_navigation_items n
using ranked r
where n.ctid = r.ctid
  and r.rn > 1;

create unique index if not exists uq_cms_navigation_items_menu_target
on public.cms_navigation_items(menu_id, target_url);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cms_pages_slug_format_check'
      and conrelid = 'public.cms_pages'::regclass
  ) then
    alter table public.cms_pages
    add constraint cms_pages_slug_format_check
    check (left(slug, 1) = '/');
  end if;
end
$$;

create unique index if not exists uq_cms_pages_single_homepage_global
on public.cms_pages ((1))
where is_homepage = true and event_id is null;

create or replace function public.assign_super_admin_by_email(p_email text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
begin
  select u.id
  into v_user_id
  from auth.users u
  where lower(u.email) = lower(trim(p_email))
  limit 1;

  if v_user_id is null then
    raise exception 'User with email % not found in auth.users', p_email;
  end if;

  insert into public.profiles (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  insert into public.user_roles (user_id, role)
  values (v_user_id, 'super_admin')
  on conflict (user_id, role) do nothing;

  return v_user_id;
end;
$$;

comment on function public.assign_super_admin_by_email(text)
is 'Run once in SQL Editor: select public.assign_super_admin_by_email(''your-email@domain.com'');';
