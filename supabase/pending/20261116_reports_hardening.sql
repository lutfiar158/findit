-- PROPOSAL ONLY. Jangan jalankan sebelum disetujui dan schema/policy proyek FindIt diaudit.
-- Tabel reports sudah ada; ini tidak membuat ulang tabel atau menghapus data/policy existing.
-- Temuan uji live: pemilik masih dapat UPDATE title melalui API.
begin;

alter table public.reports enable row level security;

-- Cabut privilege tingkat tabel DAN kolom agar grant lama tidak melewati batas kolom.
revoke insert, update on public.reports from public, anon, authenticated;
revoke insert (id, user_id, type, title, category, color, location, event_date, description, status, created_at)
  on public.reports from public, anon, authenticated;
revoke update (id, user_id, type, title, category, color, location, event_date, description, status, created_at)
  on public.reports from public, anon, authenticated;
revoke delete, truncate on public.reports from public, anon, authenticated;

grant select on public.reports to anon, authenticated;
grant insert (user_id, type, title, category, color, location, event_date, description)
  on public.reports to authenticated;
grant update (status) on public.reports to authenticated;

-- Restrictive guards membatasi policy permisif lama tanpa menghapusnya.
create policy findit_batch2_select_guard on public.reports as restrictive for select to anon, authenticated
  using (status = 'ACTIVE' or (select auth.uid()) = user_id);
create policy findit_batch2_insert_guard on public.reports as restrictive for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'ACTIVE');
create policy findit_batch2_update_guard on public.reports as restrictive for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and status in ('RESOLVED', 'ARCHIVED'));

-- Minimal allow policies; restrictive guards di atas tetap berlaku bila ada policy lain.
create policy findit_batch2_read_active on public.reports for select to anon, authenticated
  using (status = 'ACTIVE');
create policy findit_batch2_read_own on public.reports for select to authenticated
  using ((select auth.uid()) = user_id);
create policy findit_batch2_insert_own on public.reports for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'ACTIVE');
create policy findit_batch2_update_own on public.reports for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and status in ('RESOLVED', 'ARCHIVED'));

commit;
