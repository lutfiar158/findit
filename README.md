# FindIt — Smart Campus Lost & Found

FindIt memakai Next.js App Router, Supabase Auth/PostgreSQL dengan RLS, dan UI Cobalt Pop light mode yang diadaptasi dari [desain Stitch](design/stitch/README.md). Pengguna dapat membuat laporan LOST/FOUND, menelusuri laporan ACTIVE, dan mengelola status laporan sendiri.

## Menjalankan lokal

Gunakan Node.js 22.18+ (tes TypeScript native). Salin `.env.example` ke `.env.local`, lalu isi **public** Supabase URL dan publishable key dari proyek Anda; jangan pakai service-role/secret key. Konfigurasikan Auth serta tabel dan RLS melalui proses review terpisah; file `supabase/pending/` **bukan** migrasi otomatis. Untuk MVP, proyek pengujian memakai Confirm Email OFF.

```bash
npm ci
npm run dev
```

Rute utama: `/`, `/jelajahi-barang`, `/barang/[id]`, `/login`, `/register`, `/lapor`, dan `/laporan-saya`. Katalog dan detail publik hanya menampilkan ACTIVE. Form laporan dan status membutuhkan sesi; owner check juga ditegakkan oleh RLS database.

## Smart Matching

Detail barang ACTIVE menampilkan maksimal tiga laporan berjenis kebalikan dari **pengguna lain**, berstatus ACTIVE, berkategori sama (trim/case-insensitive), dengan tanggal FOUND tidak lebih awal dari LOST. Skor deterministik: kategori 35, warna sama 25, lokasi sama 25, dan kedekatan tanggal 15 (0–1 hari), 10 (2–3), 5 (4–7), atau 0 (>7). Hasil diurutkan menurut skor, selisih tanggal, lalu ID. Skor adalah **kesamaan atribut, bukan probabilitas kepemilikan**. Tidak ada AI, kontak, atau tabel matching.

Kandidat diambil dengan query Supabase yang menyaring ACTIVE, tipe berlawanan, kategori, owner, dan tanggal, dalam halaman 100 baris dengan cursor ID. Scoring TypeScript murni ada di `src/lib/matching.ts`.

## Foto laporan (Batch 4)

Satu foto **opsional** JPEG/PNG/WebP hingga 3 MiB dapat dilampirkan saat membuat laporan. Form menampilkan preview dan tombol untuk membatalkan pilihan. Server memeriksa ukuran, MIME, ekstensi, dan signature bytes, lalu mengunggah file dengan nama UUID acak di `{user_id}/{uuid}.{ext}`. Bucket `report-images` **private** membatasi ukuran/MIME dan Storage RLS mengizinkan unggah ke folder sendiri, baca foto laporan ACTIVE untuk umum atau laporan non-ACTIVE oleh pemilik, dan hapus hanya foto sendiri yang belum ditautkan. Tidak ada izin UPDATE foto atau kolom laporan lainnya. Foto dibaca lewat `/api/report-image/{reportId}` yang memeriksa akses **setiap request**, mengirim `private, no-store`, dan tidak menerima Storage path dari URL; placeholder ditampilkan bila foto tidak ada/tidak tersedia. Foto disajikan tanpa cache image optimizer Next.js.

**Prasyarat wajib:** tinjau dan jalankan sendiri `supabase/pending/20261116_batch4_report_images.sql` di proyek Supabase yang sudah diaudit **sebelum** menjalankan aplikasi dengan kode Batch 4. SQL tidak dijalankan otomatis; rerun migration mentah dapat gagal pada constraint/bucket/policy yang sudah ada. `reports` diberi hanya `INSERT(image_path)` tambahan, `UPDATE(status)` tetap satu-satunya UPDATE. Karena tabel `reports` sudah memiliki `SELECT` tingkat tabel untuk anon, `image_path` laporan ACTIVE dapat terlihat melalui REST meskipun tidak dirender pada UI; **path bukan credential**. Endpoint berbasis ID adalah satu-satunya **jalur aplikasi**, bukan jalur jaringan eksklusif: siapa pun yang mengetahui path laporan ACTIVE dapat mengunduh langsung lewat Storage API dengan public key. RLS Storage tetap memeriksa status/owner pada download; listing dan signed URL tidak diberi policy. Menutup jalur direct download sepenuhnya membutuhkan kredensial server privat atau perubahan arsitektur tambahan, bukan sekadar endpoint dengan publishable key yang sama. Cleanup mengecek seluruh laporan melalui fungsi `SECURITY DEFINER` yang hanya menerima path folder pemanggil, plus `owner_id` objek; fungsi ini memerlukan owner SQL dengan akses penuh ke `reports` dan gagal tertutup jika kehilangan kemampuan melewati RLS. Pada kegagalan INSERT yang pasti, server mencoba menghapus upload baru; jika koneksi putus sebelum hasil diketahui, file tidak dihapus demi menghindari terhapusnya foto laporan yang mungkin sudah tersimpan. Orphan private yang tersisa mungkin perlu ditinjau pengelola.

Tes live foto dan policy (tiga format, >3 MiB, pengguna lain, arsip) **belum** boleh dijalankan sebelum SQL ditinjau dan diterapkan pada proyek uji. Tes unit dan build dapat dijalankan tanpa migrasi.

## Pemeriksaan

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Dengan Supabase pengujian yang sudah siap dan **izin membuat akun/laporan uji**, jalankan:

```bash
FINDIT_LIVE_TESTS=1 node --env-file=.env.local --test tests/supabase-integration.test.mjs
```

Untuk juga menguji output detail dari server produksi lokal, jalankan `npm run start` di terminal lain dan tambahkan `FINDIT_SITE_TESTS=1`. Tes live membuat dua akun Auth sementara yang **tetap ada**; laporan biasanya diarsipkan saat selesai. Jika proses terhenti paksa, cek dan arsipkan laporan uji yang tersisa melalui prosedur yang disetujui pengelola. Jangan jalankan tes ini di proyek produksi tanpa persetujuan.

## Deployment

Sebelum deployment Vercel:

1. Arsipkan enam fixture Batch 3 **hanya setelah ditinjau** dengan SQL terbatas di `supabase/pending/20261116_archive_batch3_test_reports.sql`. Jalankan sendiri di SQL Editor proyek Supabase yang benar; statement akan gagal seluruhnya bila jumlah/atribut fixture berubah. Pastikan keenam status menjadi `ARCHIVED`, lalu cek dengan public/anon key bahwa ID tidak muncul di katalog, halaman detail, ataupun kandidat Smart Matching. Jangan menghapus laporan/akun, memakai service-role key pada aplikasi, atau mengubah RLS/schema.
2. Atur `NEXT_PUBLIC_SUPABASE_URL` (HTTPS proyek target) dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (publishable/anon, **bukan** secret/service-role) untuk environment **Production** Vercel. Pastikan build yang akan dideploy memakai nilai target yang benar; nilai di `.env.local` hanya untuk lokal dan tidak otomatis masuk Vercel. `NEXT_PUBLIC_SITE_URL` di `.env.example` belum digunakan runtime.
3. Periksa tabel `reports` dan `profiles`, privilege dan policy RLS pada Supabase target; cek Auth Site URL serta allowed redirect URLs untuk domain produksi. Aplikasi memakai email/password (tanpa callback OAuth), mengarahkan pengguna tanpa sesi ke `/login?next=...`, dan memvalidasi tujuan redirect lokal. Jika Confirm Email diaktifkan, pastikan email verifikasi bekerja dan pengguna dapat masuk setelah konfirmasi; tes integrasi otomatis hanya berjalan pada proyek uji dengan autoconfirm.
4. Terapkan migration Batch 4 setelah review, audit kembali policy Storage/privilege kolom, lalu jalankan `npm test`, `npm run lint`, `npm run typecheck`, dan `npm run build`. Setelah konfigurasi target siap, verifikasi foto pada `/`, `/jelajahi-barang`, `/barang/[id]` dan rekomendasi, login/daftar, serta redirect `/lapor` dan `/laporan-saya` pada domain produksi. Periksa ulang tidak ada data uji ACTIVE sebelum membuka akses publik.

**Belum ada commit, migrasi otomatis, atau deployment yang dilakukan oleh agent.**
