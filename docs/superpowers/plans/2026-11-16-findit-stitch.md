# FindIt Stitch UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrasikan lima halaman FindIt dari Stitch menjadi demo Next.js yang dapat dinavigasi tanpa database.

**Architecture:** Adaptasikan markup Stitch menjadi komponen React/Tailwind, bukan iframe atau HTML dengan skrip inline. Satu modul mock data dipakai beranda, katalog, dan detail; interaksi form/filter memakai komponen client seperlunya.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Tailwind 4, ESLint 9.

**Spec:** `docs/superpowers/specs/2026-11-16-findit-stitch-design.md`

## Global Constraints

- Tidak ada perubahan database, migrasi, deployment, atau penambahan fitur backend pada tahap ini.
- Pertahankan Cobalt Pop light mode, cobalt `#3758f9`, aksen coral, permukaan terang, dan font Plus Jakarta Sans.
- Gunakan kode UI proyek Stitch `1700070109413154496`; jangan membuat ulang desain.
- Jangan menimpa atau menghapus pekerjaan pengguna; starter saat ini belum dilacak Git.
- Jangan menambahkan dependency runtime hanya untuk konversi markup atau ikon.

## Review Focus

- Pencarian kosong/spasi dan gabungan filter tidak menghasilkan jumlah yang keliru.
- ID detail tidak dikenal menghasilkan 404, bukan barang lain.
- Password tidak cocok atau kurang dari delapan karakter tidak lolos validasi register.
- Form autentikasi tidak mengirim password melalui URL, menyimpan password, atau mengaku sukses.
- Navigasi dan form tetap terjangkau pada layar mobile dan dengan keyboard.

---

### Task 1: Sumber Stitch, tema, dan halaman katalog

**Files:**
- Create: `design/stitch/README.md`, `design/stitch/{home,explore,detail,login,register}.html` (ekspor asli).
- Modify: `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`, `package.json`.
- Create: `src/components/site-header.tsx`, `src/components/site-footer.tsx`, `src/components/item-card.tsx`, `src/components/item-browser.tsx`.
- Create: `src/lib/items.ts`, `src/lib/items.test.ts`, `src/app/jelajahi-barang/page.tsx`.

**Interfaces:** `items: Item[]`; `filterItems(items: Item[], filters: {query?: string; status?: string; category?: string; location?: string}): Item[]`; `ItemCard({item}: {item: Item})` mengarah ke `/barang/${item.id}`. Item memiliki id, title, description, status, category, location, image, reporter, dan waktu tampilan.

- [x] Simpan lima ekspor HTML dari hasil MCP beserta screen ID sebagai referensi, tanpa mengeksekusi skripnya.
- [x] Tulis tes filter dengan pencarian case-insensitive/spasi, gabungan status+kategori+lokasi, tanpa hasil, dan reset; jalankan hingga gagal karena modul belum tersedia.
- [x] Implementasikan mock data dari contoh Stitch dan `filterItems`; jalankan tes hingga lulus.
- [x] Adaptasi tema Tailwind 4/font/layout serta header/footer dari sumber; tampilkan navigasi pengguna belum login dan status demo.
- [x] Adaptasi hero, kategori cepat, kartu laporan dan cara kerja beranda; hubungkan pencarian dan kategori ke katalog.
- [x] Adaptasi katalog dengan filter gabungan, jumlah hasil nyata, reset, dan empty state; gunakan `ItemCard` bersama.
- [x] Jalankan lint dan cek navigasi mobile/keyboard setelah halaman dapat dirender.

### Task 2: Detail barang dan form autentikasi

**Files:**
- Create: `src/app/barang/[id]/page.tsx`, `src/app/not-found.tsx`.
- Create: `src/components/auth-form.tsx`, `src/app/login/page.tsx`, `src/app/register/page.tsx`.
- Create: `src/lib/auth-validation.ts`, `src/lib/auth-validation.test.ts`.

**Interfaces:** Detail membaca `items` Task 1 dan memakai `notFound()` untuk ID tidak dikenal. `AuthForm({mode}: {mode: 'login' | 'register'})`; `validateAuth(values: {name?: string; email: string; password: string; confirmation?: string}, mode: 'login' | 'register'): string | null` memberi pesan kegagalan atau null.

- [x] Tulis tes untuk email kosong/tidak valid, password kosong, nama register kosong/spasi, password register kurang dari delapan karakter, konfirmasi berbeda, serta input valid; jalankan dan pastikan gagal sebelum implementasi.
- [x] Implementasikan validasi tanpa logging/penyimpanan kredensial; jalankan tes hingga lulus.
- [x] Adaptasi layout detail Stitch ke data item; tandai rekomendasi sebagai mock, pastikan kontak/claim tidak mengaku terkirim, tambahkan 404.
- [x] Adaptasi kedua kartu form Stitch, hapus toolbar preview dan prefill contoh; hubungkan tautan beranda/login/register, validasi, tampilkan password, dan umpan balik Supabase belum terhubung.
- [x] Periksa semua kartu membuka detail yang sesuai dan ID tidak dikenal menampilkan UI 404 + noindex (lihat ruling HTTP streaming di ledger); periksa form invalid dan valid tetap tidak membuat sesi.

### Task 3: Verifikasi dan laporan

**Files:** Modify `README.md` dan checklist rencana ini.

- [x] Tambahkan/perbarui perintah `typecheck` dan tes yang menggunakan tool terpasang, tanpa framework tambahan jika Node mendukung tes TypeScript yang dibutuhkan.
- [x] Jalankan `npm test`, `npm run lint`, `npm run typecheck`, dan `npm run build`; perbaiki hanya masalah dalam lingkup integrasi.
- [x] Jalankan server produksi dan smoke test `/`, `/jelajahi-barang`, detail valid/tidak valid, `/login`, `/register`; lakukan tes browser desktop/mobile bila tersedia.
- [x] Periksa perubahan akhir terhadap spesifikasi, dokumentasikan cara menjalankan, asal desain, rute, dan keterbatasan mock.
- [x] Laporkan hasil tiap pemeriksaan, halaman berhasil, blocker/risiko; berhenti tanpa menghubungkan database atau melakukan deployment.

## Execution / approval

- [x] Periksa starter, status Git, dan koneksi Stitch.
- [x] Minta pengguna memilih proyek; pengguna memilih FindIt.
- [x] Identifikasi lima layar dan ambil kode HTML melalui MCP.
- [x] Tulis spesifikasi/rencana dan periksa kesesuaian antarmuka serta cakupan.
- [x] Pengguna menyetujui dokumen dan eksekusi native yang direkomendasikan.
- [x] Task 1 selesai.
- [x] Task 2 selesai.
- [x] Task 3 selesai.
