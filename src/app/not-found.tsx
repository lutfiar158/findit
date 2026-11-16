import Link from "next/link";
import { Icon } from "@/components/icon";

export default function NotFound() {
  return <main id="main-content" tabIndex={-1} className="page-container flex min-h-screen flex-col items-center justify-center py-12 text-center"><Icon name="search_off" className="mb-4 text-[56px] text-primary" /><p className="mb-2 font-semibold text-primary">404</p><h1 className="mb-3 text-2xl font-bold">Halaman atau barang tidak ditemukan</h1><p className="mb-6 max-w-md text-on-surface-variant">Laporan yang Anda cari tidak tersedia atau sudah tidak aktif di katalog publik FindIt.</p><Link href="/jelajahi-barang" className="button-primary">Kembali ke Jelajahi Barang</Link></main>;
}
