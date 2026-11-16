# FindIt Batch 2 — Auth & Reports

Permintaan pengguna menjadi spesifikasi: lanjut implementasi setelah audit, tanpa berhenti untuk diskusi/rencana jika kode dapat dikerjakan. Tidak ada commit/deploy atau eksekusi migration tanpa persetujuan.

## Audit dan batasan

Repo memakai Next.js 16.4.6/React 19.3/TS/Tailwind 4, belum memiliki SDK/client/schema Supabase. `.env.local` tidak menyediakan konfigurasi Supabase yang dapat dipakai; Supabase MCP tidak tersedia. Schema/RLS dan pengaturan email remote belum dapat diperiksa. Ini memblokir verifikasi live, bukan penulisan kode. Credential tidak dicetak atau diubah.

## Pendekatan

Gunakan SDK resmi `@supabase/supabase-js` dan `@supabase/ssr`, client per request pada server, session cookie dan Proxy Next.js 16 untuk refresh; Server Actions untuk mutasi. Dibanding SPA/localStorage, pendekatan ini melindungi route SSR dan tidak membuat auth/session buatan. Tidak perlu browser SDK, custom JWT, service role, atau backend tambahan.

## Kontrak data dan keamanan

- `profiles`: id sama dengan auth.users.id, display_name, created_at. Profil dibuat oleh trigger signup; hanya dapat dibaca pemilik. Nama/email pribadi tidak perlu diekspos pada daftar publik.
- `reports`: field persis permintaan; UUID; LOST/FOUND; ACTIVE/RESOLVED/ARCHIVED; kategori dan lokasi kampus memakai pilihan UI yang ada. Tidak ada foto/upload: kanvas kategori menggantikan foto contoh, aset Stitch tetap disimpan.
- Publik membaca ACTIVE saja; `/laporan-saya` dapat membaca seluruh status milik user. Detail publik selalu ACTIVE, termasuk ketika pemilik sedang login.
- Insert mengikat user_id dari user yang diverifikasi Supabase, bukan input. Database juga memeriksa uid dan status awal ACTIVE.
- UPDATE hanya diberi privilege kolom `status`; RLS USING dan WITH CHECK memeriksa pemilik, tujuan hanya RESOLVED/ARCHIVED. Tidak ada update identitas/pemilik/isi/waktu atau delete via client.
- SQL hanya proposal fresh schema, berhenti jika tabel sudah ada. Wajib audit schema/policy existing sebelum adaptasi. Tidak dijalankan otomatis.

## Auth dan route

Login/register mempertahankan kartu Stitch dan validasi server; nama disimpan di metadata dan profil trigger, password hanya diserahkan ke Supabase Auth. Signup langsung redirect hanya jika Supabase benar-benar mengembalikan sesi. Jika Confirm Email diaktifkan kelak, tampilkan instruksi inline tanpa check-email page dan tanpa bypass. Logout hanya sesi perangkat ini.

`/lapor` dan `/laporan-saya` terlindungi; semua Server Action memverifikasi identitas ulang. `next` dibatasi ke path internal yang dikenal (bukan URL eksternal). Proxy menyalurkan cookie refresh dan cache headers; data user dan respons dengan sesi tidak disimpan pada shared cache. Request-bound reads tetap di dalam Suspense.

## Reports dan UI

Form LOST/FOUND pada `/lapor`, insert, katalog ACTIVE server-side dengan pencarian judul literal dan filter jenis/kategori/lokasi, detail UUID, daftar sendiri dan perubahan status. Pagination sederhana agar pencarian tidak dibatasi subset mock/1000 baris. Loading, empty, error, pending state dan validasi wajib. Konfigurasi belum ada/database gagal menampilkan pesan jelas, bukan mock atau hasil kosong palsu.

UI Cobalt Pop light dipertahankan: hero, kartu, form Auth, warna #3758F9, navbar usePathname termasuk detail → Jelajahi Barang. Tambahkan Lapor/Laporan Saya dan sesi/logout tanpa merombak identitas visual. Tidak ada Smart Matching, kontak, gambar upload, QR, CV, admin, dark mode, notifikasi atau peta.

## Verifikasi

Tes unit validasi/redirect/filter/query; lint, typecheck, build; tes browser konfigurasi kosong dan proteksi. Siapkan tes integrasi dua akun berbasis credential environment untuk Auth/Reports/RLS; tidak mengklaim live pass tanpa URL/key, schema diterapkan dan dua akun uji. Tinjau SQL status-only UPDATE dan isolasi cookie sebelum handoff. Dokumen setup menjelaskan approval SQL, Confirm Email OFF untuk MVP, URL/redirect deployment, dan environment Vercel.
