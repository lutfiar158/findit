-- PROPOSAL ONLY: run only to undo the matching forward policy, after separate approval.
-- Restore the previous exact operation guard; fail closed if the patched policy has changed.
begin;

do $guard$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'findit_photo_read_linked'
      and permissive = 'PERMISSIVE' and cmd = 'SELECT'
      and roles = array['anon', 'authenticated']::name[]
      and qual = $expected$((bucket_id = 'report-images'::text) AND storage.allow_any_operation(ARRAY['object.get_authenticated'::text, 'object.get_authenticated_info'::text]) AND (EXISTS ( SELECT 1
   FROM reports r
  WHERE ((r.image_path = objects.name) AND ((r.status = 'ACTIVE'::text) OR (r.user_id = ( SELECT auth.uid() AS uid)))))))$expected$
  ) then
    raise exception 'findit_photo_read_linked differs from patched policy; re-audit before rollback';
  end if;
end $guard$;

alter policy findit_photo_read_linked on storage.objects
  using (
    bucket_id = 'report-images'
    and storage.allow_only_operation('object.get_authenticated')
    and exists (
      select 1 from public.reports r
      where r.image_path = name and (r.status = 'ACTIVE' or r.user_id = (select auth.uid()))
    )
  );

commit;
