import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ReportForm } from "@/components/report-form";
import { requireUser } from "@/lib/supabase/server";
import type { SearchParams } from "@/lib/reports";

export const metadata: Metadata = { title: "Lapor Barang", robots: { index: false, follow: false } };

async function ReportContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const type = params.type === "FOUND" ? "FOUND" : "LOST";
  await requireUser(`/lapor?type=${type}`);
  return <ReportForm initialType={type} key={type} />;
}

export default function ReportPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <><SiteHeader /><main id="main-content" tabIndex={-1} className="page-container flex-1 py-8"><div className="mx-auto max-w-3xl"><div className="mb-8"><h1 className="mb-2 text-2xl font-bold tracking-tight md:text-headline-lg">Lapor Barang Hilang & Ditemukan</h1><p className="text-body-lg text-on-surface-variant">Bantu teman kampus menemukan kembali barang mereka. Isi detail yang akurat dan jaga privasi.</p></div><Suspense fallback={<p role="status" className="rounded-xl bg-white p-6">Menyiapkan form laporan...</p>}><ReportContent searchParams={searchParams} /></Suspense></div></main><SiteFooter /></>;
}
