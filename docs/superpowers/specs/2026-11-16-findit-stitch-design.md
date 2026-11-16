# FindIt — integrasi UI Stitch

## Tujuan dan batasan

Menyiapkan lima halaman demo kompetisi hari ini pada starter Next.js App Router yang sudah ada. Gunakan TypeScript dan Tailwind yang terpasang. Tidak ada perubahan database, migrasi, deployment, atau penambahan fitur backend pada tahap ini.

## Pendekatan

Pengguna memilih proyek Stitch `1700070109413154496` (FindIt Campus Lost & Found) setelah ditawarkan integrasi ulang kode UI yang tersedia ke Next.js. Adaptasi markup menjadi komponen React adalah pendekatan yang dipilih: mempertahankan desain, tetapi memungkinkan navigasi dan mock data yang konsisten. Iframe/HTML mentah tidak dipilih karena menyulitkan routing dan interaksi; desain baru tidak dipilih karena desain Stitch sudah tersedia.

## Halaman dan tampilan

- `/`: hero pencarian, kategori cepat, kartu laporan, dan cara kerja dari desain beranda.
- `/jelajahi-barang`: pencarian, filter status/kategori/lokasi, daftar laporan dan keadaan tanpa hasil.
- `/barang/[id]`: detail sesuai barang mock yang dipilih, panduan serah terima, dan contoh rekomendasi bertanda mock; ID tidak dikenal menghasilkan 404.
- `/login`: kartu login Stitch, validasi email/password, tombol tampilkan password dan tautan register.
- `/register`: kartu register Stitch, nama/email/password/konfirmasi, validasi password minimal delapan karakter dan konfirmasi cocok.

Pertahankan Cobalt Pop light mode, cobalt `#3758f9`, aksen coral, permukaan terang, dan font Plus Jakarta Sans. Gunakan layout responsif dari sumber Stitch. Hilangkan toolbar preview, skrip CDN Tailwind, akun contoh yang tampak login, serta simulasi sukses autentikasi. Sumber desain bukan kode backend yang dapat dipercaya.

## Data dan perilaku

Satu kumpulan mock laporan untuk beranda, katalog, dan detail. Pencarian/filter digabungkan, jumlah hasil mengikuti data, dan reset mengembalikan semua data. Tidak ada permintaan database atau penyimpanan password. Login/register secara eksplisit memberi tahu bahwa Supabase belum terhubung, bukan menciptakan sesi palsu. Kontak, lapor barang, smart matching, dan klaim hanya tampilan demo dengan batasan jelas; tidak mengaku mengirim/memproses data.

## Verifikasi

Jalankan lint, TypeScript, build produksi, serta tes kecil untuk logika filter dan validasi. Periksa lima rute, navigasi kartu ke detail, 404, form, dan layout mobile bila browser tersedia. Laporkan pemeriksaan yang gagal/tidak dijalankan tanpa menyatakan sukses palsu.
