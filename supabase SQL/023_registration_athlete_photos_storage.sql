-- Storage bucket and policies for athlete photos uploaded from public registration form.
-- Path convention:
-- events/<event_id>/categories/<category_id>/athletes/<filename>

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'registration-athlete-photos',
  'registration-athlete-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.registration_athlete_photo_path_allowed(p_name text)
returns boolean
language sql
stable
as $$
  select
    split_part(p_name, '/', 1) = 'events'
    and split_part(p_name, '/', 3) = 'categories'
    and split_part(p_name, '/', 5) = 'athletes'
    and array_length(string_to_array(p_name, '/'), 1) >= 6;
$$;

create or replace function public.registration_athlete_photo_category_id_from_path(p_name text)
returns uuid
language plpgsql
stable
as $$
declare
  v_raw text;
begin
  v_raw := split_part(p_name, '/', 4);

  if split_part(p_name, '/', 3) <> 'categories' then
    return null;
  end if;

  if v_raw ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return v_raw::uuid;
  end if;

  return null;
end;
$$;

drop policy if exists storage_registration_athlete_photos_bucket_read on storage.buckets;
create policy storage_registration_athlete_photos_bucket_read
on storage.buckets
for select
to anon, authenticated
using (id = 'registration-athlete-photos');

drop policy if exists storage_registration_athlete_photos_upload on storage.objects;
create policy storage_registration_athlete_photos_upload
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'registration-athlete-photos'
  and public.registration_athlete_photo_path_allowed(name)
);

drop policy if exists storage_registration_athlete_photos_read_admin on storage.objects;
create policy storage_registration_athlete_photos_read_admin
on storage.objects
for select
to authenticated
using (
  bucket_id = 'registration-athlete-photos'
  and public.registration_athlete_photo_path_allowed(name)
  and (
    public.is_super_admin(auth.uid())
    or exists (
      select 1
      from public.admin_category_access aca
      where aca.user_id = auth.uid()
        and aca.category_id = public.registration_athlete_photo_category_id_from_path(name)
        and aca.is_active = true
    )
  )
);

drop policy if exists storage_registration_athlete_photos_delete_super_admin on storage.objects;
create policy storage_registration_athlete_photos_delete_super_admin
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'registration-athlete-photos'
  and public.is_super_admin(auth.uid())
);

drop policy if exists storage_registration_athlete_photos_update_super_admin on storage.objects;
create policy storage_registration_athlete_photos_update_super_admin
on storage.objects
for update
to authenticated
using (
  bucket_id = 'registration-athlete-photos'
  and public.is_super_admin(auth.uid())
)
with check (
  bucket_id = 'registration-athlete-photos'
  and public.is_super_admin(auth.uid())
);

