# FindIt — Sambungan kartu Laporan Saya

## Tujuan

Saat hover, foto/judul dan status membentuk satu kartu visual; tetap nyaman di desktop/mobile. Screenshot pengguna menunjukkan bagian ItemCard terangkat dengan sudut/bayangan sendiri sedangkan form status tidak bergerak.

## Pendekatan

- Dipilih pengguna: perbaiki kartu saja; jangan tambahkan modal. Komponen ItemCard tetap punya hover saat dipakai di katalog publik, tetapi pada Laporan Saya gaya permukaan/hover dipindah ke pembungkus yang juga mencakup status.
- Jangan mendesain ulang, mengubah tombol, server action, status, foto, RLS, atau database.

## Verifikasi

Tes regresi struktur hover katalog vs kartu sendiri; npm test, lint, typecheck, build. Browser langsung membutuhkan sesi login, sehingga tidak boleh mengklaim pengujian tombol/status berhasil bila tidak tersedia.
