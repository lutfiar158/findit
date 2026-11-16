import Link from "next/link";
import { PAGE_SIZE, type ReportFilters } from "@/lib/reports";

export function ReportPagination({ page, total, filters, own = false }: { page: number; total: number; filters?: ReportFilters; own?: boolean }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1 && page === 1) return null;
  function href(next: number) {
    const params = new URLSearchParams({ page: String(next) });
    if (filters) {
      params.set("q", filters.query);
      params.set("type", filters.type);
      params.set("category", filters.category);
      params.set("location", filters.location);
    }
    return `${own ? "/laporan-saya" : "/jelajahi-barang"}?${params}`;
  }
  return <nav aria-label="Halaman laporan" className="mt-8 flex flex-wrap items-center justify-center gap-4"><span className="text-body-sm text-on-surface-variant">Halaman {page} dari {Math.max(pages, 1)}</span>{page > 1 && <Link href={href(page - 1)} className="button-secondary">Sebelumnya</Link>}{page < pages && <Link href={href(page + 1)} className="button-primary">Berikutnya</Link>}</nav>;
}
