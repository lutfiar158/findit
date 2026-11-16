# FindIt Batch 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans inline; pengguna meminta implementasi setelah audit, tanpa commit/deploy/migration otomatis. Track progress here.

**Goal:** Hubungkan UI FindIt dengan Supabase Auth dan laporan barang inti secara aman.
**Architecture:** SDK SSR resmi, cookie/session refresh via Proxy, Server Actions, query server tunduk RLS, Suspense untuk request-bound UI.
**Tech Stack:** Next.js 16.4.6, React 19.3, TypeScript, Tailwind 4, @supabase/ssr, @supabase/supabase-js.
**Spec:** `docs/superpowers/specs/2026-11-16-findit-batch2-design.md`

## Global Constraints

- Tidak mencetak environment/credential; tidak commit/deploy.
- SQL baru hanya proposal pending approval; jangan migrasi atau mengubah pengaturan Supabase tanpa persetujuan.
- Tidak mengulang Stitch/redesign; pertahankan light Cobalt Pop dan active state detail.
- Tidak menggunakan service role atau getSession sebagai bukti identitas; tidak menyimpan password.
- Tidak menambah fitur Batch 3 atau upload.

## Review Focus

- SQL UPDATE harus mencegah kepemilikan/isi/status awal palsu; dua akun harus tetap terisolasi.
- Redirect next eksternal/berbahaya tidak boleh dipakai.
- Shared cache/token refresh tidak boleh membocorkan sesi atau data owner.
- Missing config/schema/network bukan hasil kosong palsu atau auth sukses palsu.
- Semua caller/test yang mengasumsikan sembilan mock harus dimigrasikan, bukan dibiarkan lulus palsu.

## Task 1 — Schema proposal dan fondasi

**Files:** `supabase/pending/20261116_batch2.sql`, `.env.example`, `src/lib/supabase/{config,server,database}.ts`, `src/proxy.ts`, `src/lib/{reports,auth-validation}.ts`, tes terkait di `src/lib/*.test.ts`, package.json/lock.
**Interfaces:** Report mengikuti 12 field spesifikasi; createSupabaseServerClient per request; getSupabaseConfig returns config/null tanpa nilai tercetak; safeNextPath hanya path internal yang dikenal; validateReport memberi error atau nilai tervalidasi tanpa user_id input.

- [x] Audit dependency, struktur, env-name/status, tooling remote/schema.
- [x] Siapkan SQL baru dengan RLS publik ACTIVE, owner SELECT, INSERT own+ACTIVE, UPDATE status-only dan trigger profil; minta approval sebelum eksekusi. SQL belum dijalankan; tabel remote sudah ada.
- [x] Tulis/run tes RED untuk safeNextPath, payload report, tanggal/enum/string/UUID; implementasikan sampai GREEN.
- [x] Install hanya dua SDK resmi; implementasikan cookie clients/proxy/cache headers dan tipe database.

## Task 2 — Auth nyata, proteksi, navbar

**Files:** `src/app/auth/actions.ts`, `src/components/{auth-form,site-header,site-navigation,logout-button}.tsx`, login/register pages, validasi/tests.
**Interfaces:** Auth actions memakai state `{error?: string; message?: string}`, getUser untuk identitas; redirect next sanitised; session/profil bukan input client; submit pending lewat useActionState.

- [ ] Tambahkan tes auth batas input dan redirect; implementasikan signup/login/logout dengan hasil Supabase nyata dan error aman.
- [ ] Reuse form Stitch, hapus simulasi/notice demo, tambahkan pending/hasil verifikasi inline sesuai konfigurasi.
- [ ] Proteksi SSR + Server Actions; refresh cookie; navbar akun/logout dan link Lapor/Laporan Saya, activeHref tetap.

## Task 3 — Reports end-to-end

**Files:** `src/app/reports/actions.ts`, `src/lib/reports-data.ts`, `src/components/{report-form,report-status-form,item-browser,item-card}.tsx`, `/lapor`, `/laporan-saya`, home/explore/detail, metadata kategori/lokasi, error/loading states.
**Interfaces:** Data helper query ACTIVE untuk publik, query owner seluruh status, getActiveReport(id) hanya UUID ACTIVE. Insert mengambil verified user.id; updateStatus hanya id/status tervalidasi + owner .eq; revalidate routes setelah mutasi.

- [ ] Tes query kontrak, literal title search + gabungan filter + pagination, mutation ownership/payload melalui batas request.
- [ ] Implementasikan query, insert, status action, form, serta halaman milik sendiri dengan validasi server/error.
- [ ] Ganti semua mock caller menjadi data Supabase; pertahankan Suspense detail; keluarkan Smart Matching/kontak dari halaman inti Batch 2.
- [ ] Pertahankan aset, kartu/tema; kosong/tidak configured/fetch gagal dibedakan. Hapus data mock dan tes ketergantungannya setelah seluruh caller dimigrasi.

## Task 4 — Verifikasi, dokumentasi, review

**Files:** `tests/*` yang terkait, tes integrasi dua akun opt-in, `README.md`, `docs/supabase-setup.md`.

- [ ] Perbarui tes lama agar tidak mengklaim mock/auth palsu sebagai keberhasilan; tambahkan tes missing-config/proteksi dan live dua akun dengan skip eksplisit tanpa konfigurasi.
- [ ] Jalankan npm test, lint, typecheck, build; browser desktop/mobile sesuai konfigurasi tersedia.
- [ ] Live register/login/logout/LOST/FOUND/public/filter/detail/mine/status/akun B tidak bisa ubah A: jalankan hanya jika schema/credential tersedia; selain itu laporkan belum diuji.
- [ ] Review independen keamanan dan kelengkapan; fix temuan penting, run suite ulang.
- [ ] Laporkan fitur/file/hasil/blocker/setup/Vercel; jangan commit/deploy atau jalankan SQL tanpa approval.

## Ledger

- Ruling: eksekusi in-place pada branch fitur yang sudah ada, tanpa commit/worktree baru — repo masih tanpa HEAD dan semua starter untracked; pengguna melarang commit tanpa approval.
- Ruling: ikuti instruksi pengguna melanjutkan implementasi langsung, bukan berhenti untuk approval rencana. Approval SQL/config tetap terpisah dan wajib.
- Ruling: pemblokir saat audit adalah konfigurasi/live schema, bukan implementasi kode; siapkan SQL pending serta tes live yang eksplisit skipped.
- Pre-flight: Tasks 1→2→3 memakai server client/database types/validasi yang sama; Task 4 mengganti tes mock sesuai kontrak baru. Tidak ada schema existing terverifikasi, jangan diasumsikan kosong.
- User memilih "Saya siapkan Supabase dulu" pada permintaan approval SQL. Migration belum disetujui. Tahan implementasi koneksi/live sampai konfigurasi dan hasil audit tersedia; `supabase/audit.sql` disediakan sebagai audit read-only tanpa isi data/secret.
- Resume: pengguna mengisi .env.local. Probe read-only Auth settings dan kedua tabel berhasil; semua kolom yang diperlukan diterima API; autoconfirm aktif. OpenAPI schema endpoint 401, sehingga policy/grant belum terverifikasi. Tidak ada migration/config remote dijalankan. Implementasi dilanjutkan; pemeriksaan keamanan live tetap wajib sebelum readiness.
- Task 1 RED: tes safe redirect/reports/config gagal karena modul belum ada; batas nama 80 karakter gagal pada validasi lama. Ditambahkan implementasi murni, SDK SSR resmi dan Proxy tanpa service role. Aset/mock lama belum dihapus sebelum caller dipindahkan.
- Task 1: complete — 22 tes unit (termasuk tes mock lama sebelum dihapus) GREEN. Query SDK diuji lewat stub batas HTTP, bukan mengklaim RLS live. npm audit --omit=dev: 0 vulnerability production; npm install melaporkan 7 moderate pada tooling development, tidak menjalankan audit fix otomatis.
- Task 2: signup/login/logout Server Actions + cookie SSR/getUser/proxy/private cache headers terpasang. UI Auth Stitch dipertahankan; usePathname dipindahkan ke komponen nav client untuk slot akun SSR. Belum diverifikasi browser/live.
- Task 3: form LOST/FOUND dan status, katalog server-side/pagination, detail ACTIVE dan daftar owner terpasang. Semua caller mock sudah dipindahkan; src/lib/items.ts dan tes mock dihapus, aset tidak dihapus. Perbaikan TypeScript fixture hanya memberi tipe eksplisit pada array invalidCases.
- Build pertama Reports gagal karena usePathname di nav pada route UUID dinamis tanpa static params. Nav diberi Suspense dengan link statis nonaktif sebagai fallback; build berikutnya lulus, tanpa instant=false atau mematikan caching.
- Live test pertama: register A/B, profil trigger, LOST/FOUND, query publik, search/filter, penolakan anon insert/spoofed owner, B update A dan transfer ownership lulus. Gagal pada owner UPDATE title yang masih diizinkan database. Laporan uji diarsipkan pada finally; dua akun uji tetap ada karena tidak ada admin key/deletion.
- Pending approval: supabase/pending/20261116_reports_hardening.sql mencabut grant INSERT/UPDATE table+column, hanya grant payload insert/status update, dan menambah restrictive ownership/status/select guards. Tidak dijalankan oleh agent; perlu review dan persetujuan pengguna. Fitur kode dapat diuji, deployment belum aman sampai izin database diperketat.
- Ruling: pengguna telah menjalankan hardening SQL sendiri dan mengizinkan akun/laporan sementara untuk tes live (bukan migrasi oleh agent). Akun uji tetap ada; laporan uji diarsipkan. Tidak ada commit/deploy.
- Verifikasi live ulang: 1 tes integrasi lulus; A membuat LOST+FOUND, B membuat FOUND, anon melihat ACTIVE, A RESOLVED→ARCHIVED serta ACTIVE→ARCHIVED, anon/B tidak melihat laporan nonaktif, owner melihatnya, UPDATE title/user_id oleh A dan UPDATE laporan A oleh B ditolak. Browser produksi: register/login/logout+proteksi route, buat FOUND via form, owner lihat laporan arsip dan publik tidak melihatnya lulus.
- Runtime PPR: request login memicu `Date.now()` di Supabase selama prerender (8 log), sedangkan request anon tidak. `await connection()` sebelum inisialisasi server client menghilangkan gejala pada kunjungan login ulang (0 log). Tes runtime anon yang selalu hijau dihapus karena tidak menangkap bug. Setelah perubahan: lint, 18 unit tests, typecheck, build, dan tes integrasi live lulus.
