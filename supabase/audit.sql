-- READ ONLY: jalankan di Supabase SQL Editor proyek FindIt.
-- Tidak membaca isi tabel pengguna, token, email, password, atau konfigurasi secret.

select table_name, column_name, data_type, udt_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name in ('profiles', 'reports')
order by table_name, ordinal_position;

select c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('profiles', 'reports')
  and c.relkind in ('r', 'p');

select tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename in ('profiles', 'reports')
order by tablename, policyname;

select table_name, grantee, privilege_type
from information_schema.table_privileges
where table_schema = 'public' and table_name in ('profiles', 'reports')
  and grantee in ('anon', 'authenticated', 'PUBLIC')
order by table_name, grantee, privilege_type;

select table_name, column_name, grantee, privilege_type
from information_schema.column_privileges
where table_schema = 'public' and table_name in ('profiles', 'reports')
  and grantee in ('anon', 'authenticated', 'PUBLIC')
order by table_name, column_name, grantee, privilege_type;

select c.conrelid::regclass as table_name, c.conname,
       pg_get_constraintdef(c.oid) as definition
from pg_constraint c
where c.conrelid in (to_regclass('public.profiles'), to_regclass('public.reports'))
order by table_name, c.conname;

select n.nspname as table_schema, c.relname as table_name, t.tgname as trigger_name,
       pn.nspname as function_schema, p.proname as function_name
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
join pg_proc p on p.oid = t.tgfoid
join pg_namespace pn on pn.oid = p.pronamespace
where not t.tgisinternal and (
  (n.nspname = 'public' and c.relname in ('profiles', 'reports')) or
  (n.nspname = 'auth' and c.relname = 'users')
)
order by table_schema, table_name, trigger_name;
