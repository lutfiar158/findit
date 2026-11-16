import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ItemCard } from "@/components/item-card";
import { ReportStatusForm } from "@/components/report-status-form";
import { ReportNotice } from "@/components/report-notice";
import { ReportPagination } from "@/components/report-pagination";
import { requireUser } from "@/lib/supabase/server";
import { getOwnReports } from "@/lib/reports-data";
import { parseReportFilters, type SearchParams } from "@/lib/reports";

export const metadata: Metadata = { title: "Laporan Saya", robots: { index: false, follow: false } };

async function OwnReports({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { user } = await requireUser("/laporan-saya");
  const { page } = parseReportFilters(await searchParams);
  const { reports, total, error } = await getOwnReports(user.id, page);
  if (error) return <ReportNotice message={error} />;
  return <><p className="mb-6 text-on-surface-variant">{total} laporan milik Anda. Laporan selesai/diarsipkan tidak ditampilkan di katalog publik.</p><div className="grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3">{reports.map((report) => <div key={report.id} data-report-id={report.id} className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"><ItemCard item={report} embedded /><ReportStatusForm report={report} /></div>)}</div>{reports.length === 0 && <div role="status" className="rounded-2xl bg-white px-6 py-16 text-center"><h2 className="mb-2 text-headline-sm font-bold">Belum ada laporan di halaman ini</h2><p className="mb-6 text-on-surface-variant">Buat laporan kehilangan atau penemuan pertama Anda.</p><Link href="/lapor" className="button-primary">Buat Laporan</Link></div>}<ReportPagination page={page} total={total} own /></>;
}

export default function MyReportsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <><SiteHeader /><main id="main-content" tabIndex={-1} className="page-container flex-1 py-8"><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><h1 className="mb-2 text-2xl font-bold tracking-tight md:text-headline-lg">Laporan Saya</h1><p className="text-body-lg text-on-surface-variant">Kelola laporan barang yang Anda terbitkan.</p></div><Link href="/lapor" className="button-primary">Buat Laporan</Link></div><Suspense fallback={<p role="status" className="rounded-xl bg-white p-6">Memuat laporan Anda...</p>}><OwnReports searchParams={searchParams} /></Suspense></main><SiteFooter /></>;
}
