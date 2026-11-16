-- PROPOSAL ONLY. Review project/fixture IDs, then run yourself in Supabase SQL Editor.
-- Administrative SQL Editor access is required; do not run in browser/client code.
-- Only status changes; if any row no longer matches this fixture, the whole transaction rolls back.
begin;

do $$
declare
  archived_count integer;
begin
  with expected(id, title, report_type) as (
    values
      ('037da6a4-da0c-42bf-bfa0-5f19cd1e6630'::uuid, 'FindIt Uji 5de722df-775 FOUND B', 'FOUND'),
      ('1b92cf68-9d34-4698-95d0-c8d3980eb027'::uuid, 'FindIt Uji 5de722df-775 100%_item', 'LOST'),
      ('28eb4b9c-80f7-47df-9b6b-3d377869b87c'::uuid, 'FindIt Uji c42c1754-eae 100%_item', 'LOST'),
      ('479d85de-eeb8-41f3-bce9-677c22272a86'::uuid, 'FindIt Uji 5de722df-775 FOUND A', 'FOUND'),
      ('863fb5b6-4e47-49ba-a176-0345f10ae35f'::uuid, 'FindIt Uji c42c1754-eae FOUND A', 'FOUND'),
      ('fcca2831-b396-482a-876f-90937d409fa5'::uuid, 'FindIt Uji c42c1754-eae FOUND B', 'FOUND')
  )
  update public.reports as r
     set status = 'ARCHIVED'
    from expected as e
   where r.id = e.id
     and r.title = e.title
     and r.type::text = e.report_type
     and r.status = 'ACTIVE'
     and r.category = 'Dompet'
     and r.color = 'Hitam'
     and r.location = 'perpus'
     and r.event_date = date '2026-11-16'
     and r.description = 'Laporan pengujian otomatis FindIt; akan diarsipkan setelah pengujian.';

  get diagnostics archived_count = row_count;
  if archived_count <> 6 then
    raise exception 'Expected exactly 6 ACTIVE Batch 3 fixtures, found %. No reports archived.', archived_count;
  end if;
end $$;

commit;

-- Administrative post-check (read-only): expect six ARCHIVED rows.
select id, status from public.reports
where id in (
  '037da6a4-da0c-42bf-bfa0-5f19cd1e6630',
  '1b92cf68-9d34-4698-95d0-c8d3980eb027',
  '28eb4b9c-80f7-47df-9b6b-3d377869b87c',
  '479d85de-eeb8-41f3-bce9-677c22272a86',
  '863fb5b6-4e47-49ba-a176-0345f10ae35f',
  'fcca2831-b396-482a-876f-90937d409fa5'
)
order by id;
