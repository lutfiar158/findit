-- PROPOSAL ONLY: belum disetujui atau dijalankan.
-- Untuk schema baru saja; jika profiles/reports sudah ada, audit dahulu dan siapkan ALTER terpisah.
-- Jangan menjalankan ini pada proyek yang belum diverifikasi milik FindIt.
begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 80),
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type text not null check (type in ('LOST', 'FOUND')),
  title text not null check (char_length(btrim(title)) between 3 and 120),
  category text not null check (category in ('Elektronik', 'Dompet', 'Kunci', 'Kartu Identitas', 'Tas', 'Lainnya')),
  color text not null check (char_length(btrim(color)) between 1 and 60),
  location text not null check (location in ('perpus', 'gedung-kuliah', 'kantin', 'parkir', 'lab', 'lainnya')),
  event_date date not null,
  description text not null check (char_length(btrim(description)) between 10 and 3000),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'RESOLVED', 'ARCHIVED')),
  created_at timestamptz not null default now()
);

create index reports_active_created_idx on public.reports (created_at desc, id) where status = 'ACTIVE';
create index reports_owner_created_idx on public.reports (user_id, created_at desc, id);

alter table public.profiles enable row level security;
alter table public.reports enable row level security;

revoke all on public.profiles from anon, authenticated;
revoke all on public.reports from anon, authenticated;
grant select on public.profiles to authenticated;
grant select on public.reports to anon, authenticated;
grant insert (user_id, type, title, category, color, location, event_date, description)
  on public.reports to authenticated;
-- Status adalah satu-satunya kolom yang boleh diubah. RLS saja tidak membatasi kolom UPDATE.
grant update (status) on public.reports to authenticated;

create policy profiles_read_own on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy reports_public_active on public.reports for select to anon, authenticated
  using (status = 'ACTIVE');
create policy reports_read_own on public.reports for select to authenticated
  using ((select auth.uid()) = user_id);
create policy reports_insert_own on public.reports for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'ACTIVE');
create policy reports_update_own_status on public.reports for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and status in ('RESOLVED', 'ARCHIVED'));

create function public.findit_create_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''), 'Mahasiswa'), 80));
  return new;
end;
$$;
revoke all on function public.findit_create_profile() from public, anon, authenticated;

create trigger findit_auth_user_created
  after insert on auth.users
  for each row execute function public.findit_create_profile();

-- Backfill profil akun Auth yang sudah ada, tanpa mengubah akun/password.
insert into public.profiles (id, display_name)
select id, left(coalesce(nullif(btrim(raw_user_meta_data ->> 'display_name'), ''), 'Mahasiswa'), 80)
from auth.users;

commit;
