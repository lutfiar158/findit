# Rancangan Antarmuka Pengguna (UI) — FindIt

Dokumen ini disusun dari implementasi aktual `src/app/globals.css`, `layout.tsx`, dan komponen `src/components/`, dengan referensi ekspor Google Stitch di `design/stitch/`. Nilai warna, ukuran, dan komponen adalah fakta source code; alasan desain ditandai sebagai interpretasi. Tema yang dipakai adalah **Cobalt Pop light mode** (tanpa mode gelap otomatis).

## 1. Palet Warna

| Kelompok | Nama token | HEX | Fungsi |
|---|---|---|---|
| Primer | `primary` | `#0D3AE1` | Tautan, ikon aksen, hover tombol utama |
| Primer | `primary-container` / `brand-cobalt` | `#3758F9` | Tombol utama, navigasi aktif, focus ring |
| Primer | `brand-hover` | `#2945D4` | Hover tombol autentikasi |
| Primer | `primary-fixed` / `on-primary-fixed` | `#DEE0FF` / `#00105B` | Latar chip/badge; teks di atasnya |
| Sekunder | `secondary` | `#AE3115` | Status "Hilang", tanda wajib, peringatan |
| Sekunder | `secondary-container` | `#FD6A49` | Garis aksen judul hero |
| Sekunder | `secondary-fixed` / `on-secondary-fixed` | `#FFDAD2` / `#3D0600` | Badge "Hilang"; teks di atasnya |
| Sekunder | `brand-coral` | `#FF6B4A` | Tanda wajib form autentikasi |
| Tersier | `tertiary` | `#005F4A` | Status "Ditemukan", pesan sukses, panduan |
| Tersier | `tertiary-fixed` / `on-tertiary-fixed` | `#A2F2D6` / `#002118` | Badge "Ditemukan"; teks di atasnya |
| Permukaan | `surface` | `#FBF8FF` | Latar halaman |
| Permukaan | `surface-container-lowest` | `#FFFFFF` | Latar card, navbar, form, tombol sekunder |
| Permukaan | `surface-container-low` | `#F4F2FF` | Footer, navigasi, input, blok spesifikasi |
| Permukaan | `surface-container` / `-high` / `-highest` | `#EDECFF` / `#E6E6FF` / `#DFE0FF` | Area foto card, hover kategori, pembatas |
| Permukaan | `brand-bg` | `#F7F8FF` | Latar halaman masuk/daftar |
| Teks | `on-surface` / `brand-heading` | `#171A32` / `#171B39` | Teks utama dan judul |
| Teks | `on-surface-variant` / `brand-secondary` | `#444656` / `#5B6680` | Deskripsi, label bantuan |
| Teks | `outline` | `#747687` | Placeholder dan keterangan redup |
| Garis | `outline-variant` / `brand-border` | `#C4C5D8` / `#DCE2F2` | Garis input dan pembatas |
| Invers | `inverse-surface` | `#2C2F48` | Chip tanggal pada foto |
| Status | `error` | `#BA1A1A` | Teks kesalahan |
| Status | `red-50`, `red-200`, `red-800` (Tailwind) | `#FEF2F2`, `#FECACA`, `#991B1B` | Kotak peringatan kesalahan |

Warna status mengikuti makna: koral/merah untuk barang hilang dan kesalahan, hijau tersier untuk barang ditemukan dan keberhasilan. Gradasi dekoratif halaman detail juga memakai `primary-fixed-dim` (`#BAC3FF`, efek blur) dan `surface-variant` (`#DFE0FF`).

## 2. Tipografi

**Font family.** Plus Jakarta Sans adalah satu-satunya font antarmuka, dimuat lokal dari `public/fonts/jakarta.woff2` sebagai variable font bobot 400–800 melalui `next/font/local`, dengan fallback `sans-serif`. Ikon memakai **Material Symbols Outlined** (`public/fonts/symbols.woff2`). Ekspor Stitch juga menetapkan Plus Jakarta Sans untuk seluruh skala teks.

**Hierarki teks.** Skala berikut adalah token yang benar-benar didefinisikan dan dipakai:

| Peran | Ukuran / line-height | Ketebalan | Contoh pemakaian |
|---|---|---|---|
| Display hero | 40 px / 48 px | 800 (extrabold) | Judul utama beranda (30/38 px pada layar kecil) |
| Headline large | 32 px / 40 px | 700 (bold) | Judul halaman dan judul seksi |
| Headline small | 18 px / 24 px | 600–700 | Judul card, judul blok, nama merek di navbar |
| Title medium | 16 px / 22 px | 600 | Nama kategori, nilai spesifikasi barang |
| Body large | 16 px / 24 px | 400 | Subjudul halaman |
| Body medium | 14 px / 20 px | 400 | Teks dasar (ukuran `body` global 14 px) |
| Body small | 12 px / 18 px | 400 | Lokasi pada card, teks bantuan, tanggal |
| Label medium | 13 px / 16 px | 600 | Label tombol, item navigasi |
| Label small | 11 px / 14 px | 700 | Badge status, label kapital di atas field |
| Ikon | 14–96 px (default 20 px) | 400 | Ikon Material Symbols di seluruh UI |

Heading memakai `tracking-tight` agar judul besar terasa tegas; label kecil memakai kapital dengan `tracking-wider`.

**Alasan pemilihan (interpretasi).** Plus Jakarta Sans adalah sans-serif geometris-humanis dengan terminal terbuka, sehingga tetap mudah dibaca pada ukuran 11–14 px yang banyak dipakai di card dan form, sekaligus mendukung karakter huruf Latin Bahasa Indonesia. Satu keluarga font dengan variasi ukuran dan bobot menjaga hierarki konsisten, ringan dimuat, dan selaras dengan kesan kampus yang modern namun tidak kaku.

## 3. Komponen Desain Utama

- **Navbar (`SiteHeader`).** Sticky di atas, latar putih 90% dengan `backdrop-blur` dan bayangan tipis. Berisi logo 32 px, wordmark "FindIt", chip "Kampus" pill `primary-fixed`, empat menu dalam pill `surface-container-low` (aktif: `primary-container`, teks putih), serta area akun "Masuk"/"Daftar" atau nama pengguna dan tombol keluar.
- **Hero dan pencarian cepat.** Judul dua baris dengan garis koral di bawah frasa kunci. Kotak pencarian putih `rounded-2xl` (pill pada layar ≥ md) berisi field "Cari Cepat", pemisah vertikal, dropdown "Lokasi Kampus", dan tombol "Cari" setinggi 56 px. Di bawahnya tombol "Lapor Kehilangan" (primer) dan "Lapor Penemuan" (sekunder dengan ikon `secondary-fixed`).
- **Card laporan barang (`ItemCard`).** `rounded-2xl`, putih, `shadow-sm`; terangkat dan bayangan membesar saat hover. Foto tinggi 192 px berlatar `surface-container`. Badge status di kiri atas: pill 11 px tebal dengan titik 6 px — `tertiary-fixed` untuk "Ditemukan", `secondary-fixed` untuk "Hilang". Tanggal di kanan bawah sebagai chip `inverse-surface/80`. Isi berpadding 20 px: lokasi 12 px, judul 18 px bold, deskripsi dua baris, lalu pembatas berisi kategori dan tautan "Buka Detail".
- **Tombol.** `.button-primary`: tinggi minimum 48 px, `rounded-xl`, `primary-container`, teks putih 13 px semibold, padding 24 px, hover `primary`. `.button-secondary`: putih dengan hover `surface-container-low`. Varian pill dipakai di hero dan navigasi; tombol nonaktif beropasitas 40–60%.
- **Form input.** Input, select, dan textarea `rounded-xl` bergaris `outline-variant/60`; fokus menjadi `primary-container` dengan ring 4 px transparan. Label tebal di atas field, tanda wajib sekunder/koral, teks bantuan 12 px. Form laporan memakai dua kartu radio besar ("Barang Hilang"/"Barang Ditemukan") dan pratinjau foto 112×160 px; form autentikasi memakai input 48 px dengan tombol tampilkan password.
- **Search dan filter (`ItemBrowser`).** Panel putih `rounded-xl` berisi input pencarian berikon di kiri, dua dropdown berlabel kapital kecil (Kategori, Area Lokasi), tautan "Terapkan Filter"/"Reset Filter", dan segmented control pill "Semua / Hilang / Ditemukan" dengan opsi aktif `primary-container`. Jumlah hasil tampil sebagai teks status.
- **Badge status.** Pill `rounded-full` berpadding 12/4 px, teks 11 px bold, kadang bertitik: "Hilang" (`secondary-fixed`), "Ditemukan" (`tertiary-fixed`), skor kecocokan (`primary-fixed`), serta chip kategori/tanggal. Pada halaman detail badge ditulis kapital ("HILANG"/"DITEMUKAN").
- **Dialog atau modal.** **Tidak teridentifikasi** — tidak ada komponen dialog/modal. Detail barang berupa halaman penuh (`/barang/[id]`); pratinjau foto, notice, dan status laporan tampil inline.
- **Komponen pendukung.** Footer tiga kolom, notice `role="alert"`, empty state berikon `search_off`, pagination, dan breadcrumb.

**Spasi, radius, dan grid.** Kontainer maksimum 1280 px dengan padding 16/32/48 px sesuai breakpoint; jarak card 24 px, padding card 20–32 px, jarak seksi 32–64 px. Radius: 12 px (`rounded-xl`) untuk input/tombol, 16 px (`rounded-2xl`) untuk card/panel, `rounded-full` untuk pill navigasi, badge, dan kotak pencarian lebar. Grid responsif: kategori 2→3→6 kolom, card 1→2→3 kolom, footer 1→3 kolom.

---

**Catatan.** Nilai di atas bersumber dari `globals.css`, `layout.tsx`, dan komponen terkait. Alasan tipografi serta penilaian kesan visual adalah interpretasi, bukan pernyataan eksplisit source code. Tidak ada kode, konfigurasi, atau database yang diubah.
