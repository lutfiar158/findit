-- PROPOSAL ONLY: do not execute without explicit approval of this final SQL.
-- Fail closed if the audited SELECT policy has changed since 2026-11-16.
begin;

do $guard$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'findit_photo_read_linked'
      and permissive = 'PERMISSIVE' and cmd = 'SELECT'
      and roles = array['anon', 'authenticated']::name[]
      and qual = $expected$((bucket_id = 'report-images'::text) AND storage.allow_only_operation('object.get_authenticated'::text) AND (EXISTS ( SELECT 1
   FROM reports r
  WHERE ((r.image_path = objects.name) AND ((r.status = 'ACTIVE'::text) OR (r.user_id = ( SELECT auth.uid() AS uid)))))))$expected$
  ) then
    raise exception 'findit_photo_read_linked differs from audited baseline; re-audit before changing';
  end if;
end $guard$;

alter policy findit_photo_read_linked on storage.objects
  using (
    bucket_id = 'report-images'
    and storage.allow_any_operation(array['object.get_authenticated', 'object.get_authenticated_info'])
    and exists (
      select 1 from public.reports r
      where r.image_path = name and (r.status = 'ACTIVE' or r.user_id = (select auth.uid()))
    )
  );

commit;
