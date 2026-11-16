import Link from "next/link";
import { categories, locations } from "@/lib/catalog";
import { getPublicReports } from "@/lib/reports-data";
import { parseReportFilters, type ReportFilters } from "@/lib/reports";
import { Icon } from "./icon";
import { ItemCard } from "./item-card";
import { ReportNotice } from "./report-notice";
import { ReportPagination } from "./report-pagination";

export async function ItemBrowser({ home = false, filters = parseReportFilters({}) }: { home?: boolean; filters?: ReportFilters }) {
  const { reports, total, error } = await getPublicReports(filters, home ? 6 : undefined);
  return <div>
    {home && <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="mb-1 flex items-center gap-1.5 text-label-md font-semibold tracking-wider text-primary uppercase"><Icon name="schedule" className="text-[16px]" />Laporan terbaru</p><h2 className="text-2xl font-bold tracking-tight md:text-headline-lg">Barang yang Lagi Dicari & Ditemukan</h2><p className="mt-1 text-on-surface-variant">Laporan aktif dari komunitas kampus.</p></div><Link href="/jelajahi-barang" className="inline-flex shrink-0 items-center gap-1 text-label-md font-semibold text-primary">Lihat Semua <Icon name="arrow_forward" className="text-[16px]" /></Link></div>}
    {!home && <div className="mb-6 rounded-xl bg-white p-4 shadow-sm md:p-6">
      <form action="/jelajahi-barang" className="space-y-4">
        <input type="hidden" name="type" value={filters.type} />
        <div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><label htmlFor="catalog-query" className="sr-only">Cari barang</label><Icon name="search" className="absolute top-4 left-4 text-[20px] text-on-surface-variant" /><input id="catalog-query" name="q" defaultValue={filters.query} maxLength={120} placeholder="Cari berdasarkan judul laporan..." className="h-12 w-full rounded-xl bg-surface-container-low pr-4 pl-12 outline-none focus:ring-2 focus:ring-primary-container" /></div><button type="submit" className="button-primary">Cari</button></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex h-14 items-center gap-3 rounded-xl bg-surface-container-low px-4"><Icon name="category" className="text-on-surface-variant" /><span className="min-w-0 flex-1"><span className="block text-[10px] font-bold tracking-wider text-on-surface-variant uppercase">Kategori</span><select name="category" aria-label="Kategori" defaultValue={filters.category} className="w-full bg-transparent font-semibold"><option value="">Semua Kategori</option>{categories.map((category) => <option key={category.name}>{category.name}</option>)}</select></span></label>
          <label className="flex h-14 items-center gap-3 rounded-xl bg-surface-container-low px-4"><Icon name="location_on" className="text-on-surface-variant" /><span className="min-w-0 flex-1"><span className="block text-[10px] font-bold tracking-wider text-on-surface-variant uppercase">Area Lokasi</span><select name="location" aria-label="Area Lokasi" defaultValue={filters.location} className="w-full bg-transparent font-semibold"><option value="">Seluruh Kampus</option>{locations.map((location) => <option key={location.value} value={location.value}>{location.label}</option>)}</select></span></label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-container pt-3"><p className="text-body-sm text-on-surface-variant">Filter jenis, kategori, dan lokasi digabungkan dengan pencarian judul.</p><button type="submit" className="min-h-10 rounded-xl px-3 text-label-md font-semibold text-primary">Terapkan Filter</button><Link href="/jelajahi-barang" className="min-h-10 py-3 text-label-md font-semibold text-primary hover:underline">Reset Filter</Link></div>
      </form>
      <div className="mt-4 inline-flex max-w-full flex-wrap rounded-full bg-surface-container-low p-1" role="group" aria-label="Jenis barang">
        {[["", "Semua"], ["LOST", "Hilang"], ["FOUND", "Ditemukan"]].map(([value, label]) => {
          const params = new URLSearchParams({ q: filters.query, type: value, category: filters.category, location: filters.location });
          return <Link key={value} href={`/jelajahi-barang?${params}`} aria-current={filters.type === value ? "true" : undefined} className={`min-h-10 rounded-full px-4 py-2 text-label-md font-semibold transition ${filters.type === value ? "bg-primary-container text-white shadow-sm" : "text-on-surface-variant hover:text-primary"}`}>{label}</Link>;
        })}
      </div>
    </div>}
    {error ? <ReportNotice message={error} /> : <>
      {!home && <p role="status" className="mb-6 text-on-surface-variant">Menampilkan <strong className="text-primary">{reports.length}</strong> dari <strong>{total}</strong> laporan aktif · Urutan terbaru</p>}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">{reports.map((item) => <ItemCard key={item.id} item={item} />)}</div>
      {reports.length === 0 && <div role="status" className="rounded-2xl bg-white px-6 py-16 text-center"><Icon name="search_off" className="mb-4 text-[48px] text-outline" /><h2 className="mb-2 text-headline-sm font-bold">Belum ada laporan yang sesuai</h2><p className="mb-6 text-on-surface-variant">Coba kata kunci/filter lain atau buat laporan barangmu.</p><div className="flex flex-wrap justify-center gap-3"><Link href="/jelajahi-barang" className="button-secondary">Reset Filter</Link><Link href="/lapor" className="button-primary">Buat Laporan</Link></div></div>}
      {!home && <ReportPagination page={filters.page} total={total} filters={filters} />}
    </>}
  </div>;
}
