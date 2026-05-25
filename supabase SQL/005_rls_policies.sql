create or replace function public.is_super_admin(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = p_user_id
      and ur.role = 'super_admin'
  );
$$;

create or replace function public.has_category_access(
  p_user_id uuid,
  p_category_id uuid,
  p_permission text,
  p_cluster_code text default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_category_access aca
    where aca.user_id = p_user_id
      and aca.category_id = p_category_id
      and aca.is_active = true
      and (
        (p_permission = 'verify_registration' and aca.can_verify_registration = true)
        or (
          p_permission = 'score_rr'
          and aca.can_score_rr = true
          and (
            coalesce(array_length(aca.rr_cluster_scopes, 1), 0) = 0
            or p_cluster_code is null
            or p_cluster_code = any(aca.rr_cluster_scopes)
          )
        )
        or (
          p_permission = 'score_se'
          and aca.can_score_se = true
          and (
            coalesce(array_length(aca.se_cluster_scopes, 1), 0) = 0
            or p_cluster_code is null
            or p_cluster_code = any(aca.se_cluster_scopes)
          )
        )
      )
  );
$$;

grant execute on function public.is_super_admin(uuid) to anon, authenticated;
grant execute on function public.has_category_access(uuid, uuid, text, text) to anon, authenticated;

alter table public.events enable row level security;
alter table public.event_categories enable row level security;
alter table public.technical_documents enable row level security;
alter table public.news_updates enable row level security;
alter table public.partners enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.admin_category_access enable row level security;
alter table public.registrations enable row level security;
alter table public.registration_logs enable row level security;
alter table public.category_pairings enable row level security;
alter table public.category_match_results enable row level security;

drop policy if exists events_public_read on public.events;
create policy events_public_read
on public.events
for select
using (status = 'published');

drop policy if exists events_admin_read on public.events;
create policy events_admin_read
on public.events
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or exists (
    select 1
    from public.admin_category_access aca
    where aca.event_id = events.id
      and aca.user_id = auth.uid()
      and aca.is_active = true
  )
);

drop policy if exists events_super_admin_manage on public.events;
create policy events_super_admin_manage
on public.events
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists categories_public_read on public.event_categories;
create policy categories_public_read
on public.event_categories
for select
using (
  is_published = true
  and exists (
    select 1
    from public.events e
    where e.id = event_categories.event_id
      and e.status = 'published'
  )
);

drop policy if exists categories_admin_read on public.event_categories;
create policy categories_admin_read
on public.event_categories
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or exists (
    select 1
    from public.admin_category_access aca
    where aca.category_id = event_categories.id
      and aca.user_id = auth.uid()
      and aca.is_active = true
  )
);

drop policy if exists categories_super_admin_manage on public.event_categories;
create policy categories_super_admin_manage
on public.event_categories
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists technical_documents_public_read on public.technical_documents;
create policy technical_documents_public_read
on public.technical_documents
for select
using (is_published = true);

drop policy if exists technical_documents_super_admin_manage on public.technical_documents;
create policy technical_documents_super_admin_manage
on public.technical_documents
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists news_updates_public_read on public.news_updates;
create policy news_updates_public_read
on public.news_updates
for select
using (is_published = true);

drop policy if exists news_updates_super_admin_manage on public.news_updates;
create policy news_updates_super_admin_manage
on public.news_updates
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists partners_public_read on public.partners;
create policy partners_public_read
on public.partners
for select
using (is_active = true);

drop policy if exists partners_super_admin_manage on public.partners;
create policy partners_super_admin_manage
on public.partners
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists profiles_own_read on public.profiles;
create policy profiles_own_read
on public.profiles
for select
to authenticated
using (auth.uid() = user_id or public.is_super_admin(auth.uid()));

drop policy if exists profiles_own_insert on public.profiles;
create policy profiles_own_insert
on public.profiles
for insert
to authenticated
with check (auth.uid() = user_id or public.is_super_admin(auth.uid()));

drop policy if exists profiles_own_update on public.profiles;
create policy profiles_own_update
on public.profiles
for update
to authenticated
using (auth.uid() = user_id or public.is_super_admin(auth.uid()))
with check (auth.uid() = user_id or public.is_super_admin(auth.uid()));

drop policy if exists user_roles_super_admin_manage on public.user_roles;
create policy user_roles_super_admin_manage
on public.user_roles
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists admin_category_access_super_admin_manage on public.admin_category_access;
create policy admin_category_access_super_admin_manage
on public.admin_category_access
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists admin_category_access_own_read on public.admin_category_access;
create policy admin_category_access_own_read
on public.admin_category_access
for select
to authenticated
using (user_id = auth.uid() or public.is_super_admin(auth.uid()));

drop policy if exists registrations_public_insert on public.registrations;
create policy registrations_public_insert
on public.registrations
for insert
to anon, authenticated
with check (true);

drop policy if exists registrations_admin_read on public.registrations;
create policy registrations_admin_read
on public.registrations
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_category_access(auth.uid(), category_id, 'verify_registration', null)
  or public.has_category_access(auth.uid(), category_id, 'score_rr', null)
  or public.has_category_access(auth.uid(), category_id, 'score_se', null)
);

drop policy if exists registrations_admin_update on public.registrations;
create policy registrations_admin_update
on public.registrations
for update
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_category_access(auth.uid(), category_id, 'verify_registration', null)
)
with check (
  public.is_super_admin(auth.uid())
  or public.has_category_access(auth.uid(), category_id, 'verify_registration', null)
);

drop policy if exists registrations_super_admin_delete on public.registrations;
create policy registrations_super_admin_delete
on public.registrations
for delete
to authenticated
using (public.is_super_admin(auth.uid()));

drop policy if exists registration_logs_admin_read on public.registration_logs;
create policy registration_logs_admin_read
on public.registration_logs
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or exists (
    select 1
    from public.registrations r
    where r.id = registration_logs.registration_id
      and (
        public.has_category_access(auth.uid(), r.category_id, 'verify_registration', null)
        or public.has_category_access(auth.uid(), r.category_id, 'score_rr', null)
        or public.has_category_access(auth.uid(), r.category_id, 'score_se', null)
      )
  )
);

drop policy if exists registration_logs_admin_insert on public.registration_logs;
create policy registration_logs_admin_insert
on public.registration_logs
for insert
to authenticated
with check (
  public.is_super_admin(auth.uid())
  or exists (
    select 1
    from public.registrations r
    where r.id = registration_logs.registration_id
      and public.has_category_access(auth.uid(), r.category_id, 'verify_registration', null)
  )
);

drop policy if exists category_pairings_admin_read on public.category_pairings;
create policy category_pairings_admin_read
on public.category_pairings
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or (
    stage = 'RR'
    and public.has_category_access(auth.uid(), category_id, 'score_rr', cluster_code)
  )
  or (
    stage = 'SE'
    and public.has_category_access(auth.uid(), category_id, 'score_se', cluster_code)
  )
);

drop policy if exists category_pairings_super_admin_manage on public.category_pairings;
create policy category_pairings_super_admin_manage
on public.category_pairings
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists category_match_results_admin_read on public.category_match_results;
create policy category_match_results_admin_read
on public.category_match_results
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or (
    stage = 'RR'
    and public.has_category_access(auth.uid(), category_id, 'score_rr', cluster_code)
  )
  or (
    stage = 'SE'
    and public.has_category_access(auth.uid(), category_id, 'score_se', cluster_code)
  )
);

drop policy if exists category_match_results_admin_upsert on public.category_match_results;
create policy category_match_results_admin_upsert
on public.category_match_results
for insert
to authenticated
with check (
  public.is_super_admin(auth.uid())
  or (
    stage = 'RR'
    and public.has_category_access(auth.uid(), category_id, 'score_rr', cluster_code)
  )
  or (
    stage = 'SE'
    and public.has_category_access(auth.uid(), category_id, 'score_se', cluster_code)
  )
);

drop policy if exists category_match_results_admin_update on public.category_match_results;
create policy category_match_results_admin_update
on public.category_match_results
for update
to authenticated
using (
  public.is_super_admin(auth.uid())
  or (
    stage = 'RR'
    and public.has_category_access(auth.uid(), category_id, 'score_rr', cluster_code)
  )
  or (
    stage = 'SE'
    and public.has_category_access(auth.uid(), category_id, 'score_se', cluster_code)
  )
)
with check (
  public.is_super_admin(auth.uid())
  or (
    stage = 'RR'
    and public.has_category_access(auth.uid(), category_id, 'score_rr', cluster_code)
  )
  or (
    stage = 'SE'
    and public.has_category_access(auth.uid(), category_id, 'score_se', cluster_code)
  )
);

drop policy if exists category_match_results_super_admin_delete on public.category_match_results;
create policy category_match_results_super_admin_delete
on public.category_match_results
for delete
to authenticated
using (public.is_super_admin(auth.uid()));
