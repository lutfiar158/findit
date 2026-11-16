import Image from "next/image";
import Link from "next/link";
import { Icon } from "./icon";

export function SiteFooter() {
  return (
    <footer className="mt-12 w-full bg-surface-container-low shadow-[0_-1px_6px_rgba(0,0,0,0.02)]">
      <div className="page-container py-12">
        <div className="mb-10 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div><div className="mb-4 flex items-center gap-2"><Image src="/images/logo.png" alt="" width={28} height={28} className="h-7 w-auto" /><span className="text-headline-sm font-bold">FindIt</span></div><p className="max-w-xs leading-relaxed text-on-surface-variant">Platform pencarian barang hilang pintar khusus mahasiswa kampus Indonesia.</p></div>
          <div><h2 className="mb-4 text-title-md font-semibold">Navigasi</h2><ul className="space-y-2 text-on-surface-variant"><li><Link href="/" className="hover:text-primary">Beranda</Link></li><li><Link href="/jelajahi-barang" className="hover:text-primary">Jelajahi Semua</Link></li><li><Link href="/login" className="hover:text-primary">Masuk</Link></li><li><Link href="/register" className="hover:text-primary">Daftar Akun</Link></li></ul></div>
          <div id="panduan-keamanan"><h2 className="mb-4 text-title-md font-semibold">Bantuan & Panduan</h2><p className="leading-relaxed text-on-surface-variant">Periksa bukti kepemilikan dan lakukan serah terima di pos satpam atau meja sirkulasi perpustakaan. Jangan transfer uang sebelum memeriksa barang.</p><p className="mt-3 text-body-sm text-outline">FindIt tidak meminta pembayaran untuk klaim barang.</p></div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-outline-variant/30 pt-6 text-body-sm text-on-surface-variant sm:flex-row"><p>© 2026 FindIt Indonesia. Dibuat dengan kepedulian untuk mahasiswa kampus.</p><span className="flex items-center gap-1"><Icon name="language" className="text-[18px]" /> Bahasa Indonesia (ID)</span></div>
      </div>
    </footer>
  );
}
