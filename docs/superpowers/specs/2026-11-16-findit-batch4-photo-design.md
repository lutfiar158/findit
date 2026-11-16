# FindIt Batch 4 — Foto laporan

## Tujuan dan batas

Satu foto opsional per laporan LOST/FOUND, maksimal 3 MB, JPEG/PNG/WebP; preview dan hapus pilihan sebelum submit. Foto tampil di jelajah, detail, dan kartu rekomendasi, dengan placeholder jika tidak ada/tidak tersedia. Pertahankan Cobalt Pop, RLS laporan, dan scoring Batch 3. Tidak ada penghapusan akun/laporan, service role key, commit, deploy, atau eksekusi migrasi tanpa izin.

## Pendekatan

- **Dipilih pengguna:** bucket `report-images` **private** + endpoint server berbasis ID laporan. Endpoint tidak menerima path Storage. Laporan ACTIVE bisa dibaca publik; RESOLVED/ARCHIVED hanya oleh pemilik terverifikasi. Tidak ada cache publik untuk hasil gambar maupun respons 404. Endpoint adalah satu-satunya URL yang dipakai aplikasi; Storage API tetap mengizinkan direct download bila path aktif diketahui, karena server dan publik sama-sama menggunakan publishable key tanpa kredensial privat. RLS membatasi download itu ke foto aktif atau pemilik; listing/signed URL ditolak. Endpoint eksklusif pada tingkat jaringan memerlukan kredensial server terpisah dan keputusan arsitektur baru.
- Public bucket ditolak karena URL tetap bisa dibaca setelah laporan diarsipkan. Signed URL private ditolak karena URL yang sudah diterbitkan tetap bisa dipakai sampai kedaluwarsa. Endpoint yang membaca akses pada setiap request memberi pencabutan akses lebih cepat, dengan biaya bandwidth server.

## Alur

1. Form memilih satu file; browser menampilkan preview sementara dari object URL, ukuran/format yang diizinkan, tombol menghapus pilihan; object URL dicabut saat diganti/unmount. Form tanpa foto tetap berjalan.
2. Server action memvalidasi laporan, lalu memverifikasi user dengan client SSR yang sudah ada. Jika ada foto, validasi `File`, ukuran, ekstensi nama asli, MIME, dan signature bytes. Buat path `{user.id}/{crypto.randomUUID()}.{ext}` (tidak memakai nama asli); upload `upsert: false` ke Storage melalui client SSR yang sama. Pengaturan Server Actions harus mengizinkan sedikit lebih dari 3 MB multipart tetapi batas file tetap ditegakkan di action dan bucket.
3. INSERT laporan beserta `image_path` (nullable). Bila upload gagal, jangan INSERT. Bila INSERT ditolak secara pasti, coba hapus hanya path baru milik user melalui Storage. Jika hasil INSERT tidak pasti karena koneksi putus, jangan hapus foto yang mungkin sudah tertaut; jelaskan pemeriksaan manual. Jika cleanup gagal, laporkan tanpa mengekspos path di UI; orphan tetap private.
4. Kueri laporan/kandidat hanya mengambil `image_path` untuk mengetahui ada foto; UI memakai URL `/api/report-image/{report.id}`, tidak menerbitkan path Storage. Endpoint memvalidasi UUID, membaca report lewat RLS, mengecek status ACTIVE atau owner yang diverifikasi dengan `auth.getUser()`, lalu mengunduh path dari baris tersebut; status lain → 404. Gunakan `Cache-Control: private, no-store`, `X-Content-Type-Options: nosniff`, MIME terbatas. Gambar lokal dirender tanpa cache optimisasi Next.js yang dapat bertahan setelah status berubah; tampilkan placeholder bila tidak ada atau request gambar gagal.

## SQL (disiapkan, tidak dieksekusi)

Audit aktual dari pengguna: `public.reports` tidak memiliki `image_path`, RLS aktif, privilege tabel authenticated/anon tidak mencakup INSERT/UPDATE; INSERT kolom authenticated hanya delapan kolom laporan dan UPDATE hanya `status`. Policy permissive dan restrictive owner/ACTIVE Batch 2 sudah ada, tidak diganti. `user_id` references `profiles(id)`. `storage.objects` RLS aktif; anon/authenticated punya privilege SQL INSERT/SELECT/UPDATE/DELETE tetapi tanpa policy (akses objek tetap tertolak); bucket `report-images` belum ada. Migrasi minimal: tambah `image_path` nullable dan CHECK path satu UUID milik `user_id`, bucket private dengan `file_size_limit=3145728` dan MIME `image/jpeg`, `image/png`, `image/webp`; grant **hanya INSERT(image_path)** tambahan untuk authenticated, tidak membuka UPDATE laporan. Storage policy INSERT autentikasi ke folder sendiri, SELECT objek yang ditautkan ke laporan ACTIVE secara publik atau milik sendiri, DELETE **hanya objek milik sendiri yang belum ditautkan ke laporan** untuk cleanup; tidak ada policy UPDATE/upsert. Cleanup memeriksa `owner_id` dan folder milik pemanggil, serta referensi `image_path` dari semua laporan via helper `SECURITY DEFINER` owner-scoped yang gagal tertutup bila akses penuh hilang. SELECT cleanup hanya untuk operasi `object.delete_many` yang dipakai `storage-js.remove()`. Pastikan policy dibatasi ke bucket dan tidak melemahkan policy existing. Migrasi idempotent bila aman terhadap keadaan aktual; bila ada konflik, gagal tertutup daripada mengganti policy/bucket yang belum diaudit.

## Pengujian

Unit: tipe/ekstensi/signature sesuai, file >3 MB, MIME/ekstensi tidak didukung, kosong/lebih dari satu, path acak; query dan akses endpoint (anon ACTIVE, owner non-ACTIVE, user lain/invalid ID/404, tidak ada path), preview/hapus, fallback. Kontrak SQL grant/policy, batas bucket, no-cache, tanpa perubahan algoritma. Lint, typecheck, unit, build; live dua akun dan tiga format hanya sesudah migrasi disetujui dan diterapkan oleh pengguna pada proyek uji.

## Persetujuan

Pengguna menyetujui arsitektur private + server endpoint dan meminta kode/migration untuk review tanpa menjalankan SQL, commit atau deploy. Metadata laporan dan Storage telah diberikan. Penerapan runtime live memerlukan migrasi yang akan dijalankan pengguna setelah review.
