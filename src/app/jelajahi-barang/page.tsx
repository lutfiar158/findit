import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ItemBrowser } from "@/components/item-browser";
import { parseReportFilters, type SearchParams } from "@/lib/reports";

export const metadata: Metadata = { title: "Jelajahi Barang Kampus" };

type Props = { searchParams: Promise<SearchParams> };

async function FilteredCatalog({ searchParams }: Props) {
  const filters = parseReportFilters(await searchParams);
  return <ItemBrowser key={JSON.stringify(filters)} filters={filters} />;
}

export default function Explore({ searchParams }: Props) {
  return <><SiteHeader /><main id="main-content" tabIndex={-1} className="page-container flex-1 py-8"><div className="mb-8 max-w-2xl"><h1 className="mb-2 text-2xl font-bold tracking-tight md:text-headline-lg">Jelajahi Semua Barang Kampus</h1><p className="text-body-lg text-on-surface-variant">Telusuri laporan barang hilang dan temuan yang masih aktif di seluruh area kampus.</p></div><Suspense fallback={<p role="status" className="rounded-xl bg-white p-6">Menyiapkan katalog barang...</p>}><FilteredCatalog searchParams={searchParams} /></Suspense></main><SiteFooter /></>;
}
