import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Icon } from "@/components/icon";
import { ReportNotice } from "@/components/report-notice";
import { MatchRecommendations } from "@/components/match-recommendations";
import { ReportImage } from "@/components/report-image";
import { categories, locationLabel } from "@/lib/catalog";
import { getActiveReport } from "@/lib/reports-data";
import { reportDate } from "@/lib/reports";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { report, error } = await getActiveReport(id);
  return { title: report?.title ?? (error ? "Detail barang belum tersedia" : "Barang tidak ditemukan") };
}

export default function ItemDetail({ params }: Props) {
  return <><SiteHeader /><main id="main-content" tabIndex={-1} className="page-container flex-1 py-8">
    <Suspense fallback={<p role="status" className="rounded-xl bg-white p-6 text-on-surface-variant">Menyiapkan detail barang...</p>}>
      <ItemDetailContent params={params} />
    </Suspense>
  </main><SiteFooter /></>;
}

async function ItemDetailContent({ params }: Props) {
  const { id } = await params;
  const { report: item, error } = await getActiveReport(id);
  if (error) return <ReportNotice message={error} />;
  if (!item) notFound();
  const found = item.type === "FOUND";
  const category = categories.find((entry) => entry.name === item.category);

  return <>
    <nav aria-label="Jalur Navigasi" className="mb-8 flex flex-wrap items-center gap-1 text-body-sm text-on-surface-variant"><Link href="/" className="flex items-center gap-1 hover:text-primary"><Icon name="home" className="text-[16px]" />Beranda</Link><Icon name="chevron_right" className="text-[14px] text-outline" /><Link href="/jelajahi-barang" className="hover:text-primary">Jelajahi Barang</Link><Icon name="chevron_right" className="text-[14px] text-outline" /><span aria-current="page" className="font-semibold text-on-surface">{item.title}</span></nav>
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
      <section className="flex flex-col gap-6 lg:col-span-7" aria-labelledby="item-title">
        <div className="overflow-hidden rounded-xl bg-white shadow-md">
          <div className="relative flex h-80 w-full items-center justify-center overflow-hidden bg-linear-to-br from-surface-container-high via-surface-container to-surface-variant p-6 sm:h-96">
            <div className="absolute -top-12 -right-12 h-64 w-64 rounded-full bg-primary-fixed-dim/35 blur-2xl" /><div className="absolute -bottom-8 -left-8 h-56 w-56 rounded-full bg-secondary-fixed/40 blur-2xl" />
            <div className="absolute top-4 right-4 left-4 z-20 flex flex-wrap items-center justify-between gap-2"><span className={`rounded-full px-4 py-1.5 text-label-sm font-bold shadow-sm ${found ? "bg-tertiary-fixed text-on-tertiary-fixed" : "bg-secondary-fixed text-secondary"}`}>{found ? "DITEMUKAN" : "HILANG"}</span><span className="rounded-full bg-white/90 px-3 py-1.5 text-label-sm font-semibold">{item.category} · Aktif</span></div>
            <div className={`relative z-10 mt-6 flex h-full w-full max-w-md items-center justify-center overflow-hidden rounded-xl shadow-xl ${category?.tone ?? "bg-white text-primary"}`}><ReportImage id={item.id} hasImage={!!item.image_path} alt={`Foto ${item.title}`}><Icon name={category?.icon ?? "category"} className="text-[96px]" /><span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-label-sm text-on-surface-variant">Ilustrasi kategori · Tanpa foto</span></ReportImage></div>
          </div>
          <div className="flex flex-col gap-4 p-6 sm:p-8"><p className="text-label-sm tracking-wider text-outline uppercase">Laporan aktif · Terbit {reportDate(item.created_at)}</p><h1 id="item-title" className="text-2xl font-bold tracking-tight md:text-headline-lg">{item.title}</h1>
            <dl className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2">{[
              { label: "Kategori Barang", value: item.category, icon: category?.icon ?? "category", tone: "bg-primary-fixed text-on-primary-fixed" },
              { label: "Warna & Tekstur", value: item.color, icon: "palette", tone: "bg-surface-container-high text-on-surface" },
              { label: found ? "Lokasi Penemuan" : "Lokasi Terakhir", value: locationLabel(item.location), icon: "location_on", tone: "bg-secondary-fixed text-secondary" },
              { label: found ? "Tanggal Ditemukan" : "Tanggal Perkiraan Hilang", value: reportDate(item.event_date), icon: "schedule", tone: "bg-tertiary-fixed text-on-tertiary-fixed" },
            ].map((spec) => <div key={spec.label} className="flex items-start gap-4 rounded-xl bg-surface-container-low p-4"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${spec.tone}`}><Icon name={spec.icon} /></span><div><dt className="text-label-sm text-on-surface-variant">{spec.label}</dt><dd className="mt-1 text-title-md font-semibold">{spec.value}</dd></div></div>)}</dl>
            <div className="pt-2"><h2 className="mb-2 text-headline-sm font-semibold">Deskripsi Kronologi & Isi</h2><p className="whitespace-pre-wrap leading-relaxed text-on-surface-variant">{item.description}</p></div>
            <div className="rounded-xl bg-primary-fixed/25 p-6"><h2 className="mb-2 flex items-center gap-2 text-title-md font-semibold text-primary"><Icon name="verified_user" />Konfirmasi Bukti Kepemilikan</h2><p className="leading-relaxed text-on-surface-variant">Cocokkan ciri unik barang bersama pemilik sebelum serah terima. Jangan mengunggah foto identitas, nomor kartu, atau kontak pribadi di ruang publik.</p></div>
          </div>
        </div>
      </section>
      <aside className="flex flex-col gap-6 lg:sticky lg:top-32 lg:col-span-5">
        <div className="flex flex-col gap-6 rounded-xl bg-white p-6 shadow-md sm:p-8"><div className="flex items-center gap-4 rounded-xl bg-surface-container-low/50 p-4"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary"><Icon name="person" className="text-[28px]" /></span><div><h2 className="text-title-md font-bold">Laporan Komunitas Kampus</h2><p className="mt-1 text-body-sm text-on-surface-variant">Diterbitkan oleh pengguna FindIt</p></div></div>
          <Link href="/laporan-saya" className="button-primary">Kelola Laporan Saya</Link><p className="flex items-start gap-2 text-body-sm leading-relaxed text-on-surface-variant"><Icon name="shield" className="text-[18px] text-tertiary" /><span><strong>Jaga privasi:</strong> identitas akun dan kontak pribadi pelapor tidak ditampilkan pada halaman publik. Pastikan bukti kepemilikan sebelum serah terima.</span></p>
        </div>
        <section className="rounded-xl bg-tertiary-fixed/25 p-6 sm:p-8" aria-labelledby="safety-title"><h2 id="safety-title" className="mb-3 flex items-center gap-2 text-headline-sm font-bold"><Icon name="security" className="text-tertiary" />Panduan Serah Terima Aman</h2><p className="mb-4 leading-relaxed text-on-surface-variant">Pilih tempat resmi dan ramai untuk memeriksa barang bersama pemilik:</p><ul className="space-y-3">{["Posko Satpam Gerbang Utama", "Meja Sirkulasi Perpustakaan Lantai 1", "Lobi Dekanat Fakultas Terkait"].map((place) => <li key={place} className="flex items-start gap-2"><Icon name="check_circle" className="text-[18px] text-tertiary" />{place}</li>)}</ul><p className="mt-5 rounded-xl bg-white/70 p-3 text-body-sm font-medium text-secondary">Jangan pernah mentransfer imbalan tunai sebelum barang diperiksa secara fisik.</p></section>
      </aside>
    </div>
    <Suspense fallback={<p role="status" className="mt-12 rounded-xl bg-white p-6 text-on-surface-variant">Mencari laporan yang mungkin berkaitan...</p>}><MatchRecommendations item={item} /></Suspense>
  </>;
}
