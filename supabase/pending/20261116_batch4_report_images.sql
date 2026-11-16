-- PROPOSAL ONLY: review and execute yourself in the audited FindIt Supabase SQL Editor.
-- Existing reports SELECT/INSERT/UPDATE policies remain unchanged. No service-role key.
begin;

-- Fail closed if the audited RLS/column-grant baseline changed before review.
do $$
begin
  if not (select relrowsecurity from pg_class where oid = 'public.reports'::regclass)
     or not (select relrowsecurity from pg_class where oid = 'storage.objects'::regclass)
     or exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects')
     or exists (select 1 from information_schema.table_privileges
                where table_schema = 'public' and table_name = 'reports'
                  and grantee in ('anon', 'authenticated', 'PUBLIC') and privilege_type in ('INSERT', 'UPDATE'))
     or exists (select 1 from information_schema.column_privileges
                where table_schema = 'public' and table_name = 'reports' and grantee = 'authenticated'
                  and privilege_type = 'UPDATE' and column_name <> 'status')
     or (select relforcerowsecurity from pg_class where oid = 'public.reports'::regclass)
     or not (select rolsuper or rolbypassrls
                   or oid = (select relowner from pg_class where oid = 'public.reports'::regclass)
             from pg_roles where rolname = current_user)
     or to_regprocedure('storage.allow_only_operation(text)') is null
  then
    raise exception 'FindIt RLS/grant/Storage helper baseline changed; re-audit before applying Batch 4';
  end if;
end $$;

alter table public.reports add column if not exists image_path text;
alter table public.reports add constraint reports_image_path_owner_check check (
  image_path is null or (
    split_part(image_path, '/', 1) = user_id::text
    and image_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](jpg|png|webp)$'
  )
);
grant insert (image_path) on public.reports to authenticated;

-- SQL Editor owns this function as a role that sees every reports row.
-- row_security=off makes a future loss of that privilege fail, never
-- silently treat a hidden linked report as an orphan. The callable result
-- reveals only whether the caller's OWN path is unreferenced.
create function public.findit_photo_unreferenced_own(object_path text)
returns boolean language plpgsql stable security definer
set search_path = ''
set row_security = off
as $$
begin
  if object_path is null or (select auth.uid()) is null
     or split_part(object_path, '/', 1) <> (select auth.uid())::text
     or object_path !~ ('^' || (select auth.uid())::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](jpg|png|webp)$') then
    return false;
  end if;
  return not exists (select 1 from public.reports r where r.image_path = object_path);
end;
$$;
revoke all on function public.findit_photo_unreferenced_own(text) from public, anon, authenticated;
grant execute on function public.findit_photo_unreferenced_own(text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('report-images', 'report-images', false, 3145728, array['image/jpeg', 'image/png', 'image/webp']);

-- The bucket is private. This SELECT also allows direct authenticated Storage
-- downloads when a path is known; the server endpoint is the only app URL,
-- not an exclusive network route. No listing or signed URLs are permitted.
-- A linked ACTIVE report is public; only owners can read non-ACTIVE photos.
create policy findit_photo_upload_own on storage.objects for insert to authenticated
  with check (
    bucket_id = 'report-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and name ~ ('^' || (select auth.uid()::text) || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](jpg|png|webp)$')
  );

create policy findit_photo_read_linked on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'report-images'
    and storage.allow_only_operation('object.get_authenticated')
    and exists (
      select 1 from public.reports r
      where r.image_path = name and (r.status = 'ACTIVE' or r.user_id = (select auth.uid()))
    )
  );

-- storage-js remove([path]) calls DELETE /object/{bucket} (delete_many);
-- Storage requires SELECT + DELETE. Do not allow list or single-path reads.
create policy findit_photo_read_orphan_for_cleanup on storage.objects for select to authenticated
  using (
    bucket_id = 'report-images'
    and storage.allow_only_operation('object.delete_many')
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and owner_id = (select auth.uid()::text)
    and public.findit_photo_unreferenced_own(name)
  );

create policy findit_photo_delete_orphan_own on storage.objects for delete to authenticated
  using (
    bucket_id = 'report-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and owner_id = (select auth.uid()::text)
    and public.findit_photo_unreferenced_own(name)
  );

commit;
