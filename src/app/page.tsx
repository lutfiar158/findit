import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ItemBrowser } from "@/components/item-browser";
import { Icon } from "@/components/icon";
import { categories, locations } from "@/lib/catalog";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex-1">
        <section className="page-container flex flex-col items-center pt-10 pb-12 text-center lg:pt-12 lg:pb-16">
          <h1 className="mb-4 max-w-3xl text-[30px] leading-[38px] font-extrabold tracking-tight text-on-surface md:text-display-hero">Barangmu hilang?<br /><span className="relative inline-block text-primary-container">Yuk, cari bareng!<svg aria-hidden="true" className="absolute -bottom-2 left-0 h-2.5 w-full text-secondary-container" preserveAspectRatio="none" viewBox="0 0 100 12"><path d="M0,7 Q50,14 100,7" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="4" /></svg></span></h1>
          <p className="mt-3 mb-10 max-w-xl text-body-lg leading-relaxed text-on-surface-variant">Temukan barang hilang dan bantu teman kampus menemukan kembali barang mereka dengan mudah, cepat, dan aman.</p>
          <div className="mb-8 w-full max-w-4xl rounded-2xl bg-white p-2.5 shadow-xl md:rounded-full">
            <form action="/jelajahi-barang" className="flex flex-col items-center justify-between gap-2 md:flex-row">
              <label className="flex w-full items-center gap-3 rounded-xl bg-surface-container-low/60 px-4 py-3 text-left md:flex-1 md:rounded-full"><Icon name="search" className="text-[24px] text-primary" /><span className="min-w-0 flex-1"><span className="block text-label-sm font-bold tracking-wider text-on-surface-variant uppercase">Cari Cepat</span><input name="q" placeholder="Cari dompet, kunci, kartu mahasiswa..." className="w-full bg-transparent py-1 outline-none" aria-label="Cari barang" /></span></label>
              <div className="hidden h-8 w-px bg-surface-container-highest md:block" />
              <label className="flex w-full items-center gap-3 rounded-xl bg-surface-container-low/60 px-4 py-3 text-left md:w-[35%] md:rounded-full"><Icon name="location_on" className="text-[22px] text-tertiary" /><span className="min-w-0 flex-1"><span className="block text-label-sm font-bold tracking-wider text-on-surface-variant uppercase">Lokasi Kampus</span><select name="location" aria-label="Lokasi Kampus" className="w-full bg-transparent py-1 font-semibold"><option value="">Semua Lokasi Kampus</option>{locations.map((loc) => <option key={loc.value} value={loc.value}>{loc.label}</option>)}</select></span></label>
              <button type="submit" className="button-primary h-14 w-full px-8! text-headline-sm! md:w-auto md:rounded-full"><Icon name="search" />Cari</button>
            </form>
          </div>
          <div className="flex w-full flex-wrap justify-center gap-4"><Link href="/lapor?type=LOST" className="button-primary bg-primary!"><Icon name="add_circle" />Lapor Kehilangan</Link><Link href="/lapor?type=FOUND" className="button-secondary"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary-fixed text-secondary"><Icon name="volunteer_activism" className="text-[18px]" /></span>Lapor Penemuan</Link></div>
        </section>
        <section className="page-container py-8" aria-labelledby="categories-title"><div className="mb-6 flex items-center justify-between gap-3"><h2 id="categories-title" className="text-headline-sm font-bold">Kategori Cepat</h2><span className="text-label-sm font-bold tracking-wider text-on-surface-variant uppercase">Pilih Kategori</span></div><div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">{categories.map((cat) => <Link key={cat.name} href={`/jelajahi-barang?category=${encodeURIComponent(cat.name)}`} className="group flex flex-col items-center rounded-2xl bg-white p-4 text-center shadow-sm transition-all hover:-translate-y-1 hover:bg-surface-container-high"><span className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${cat.tone}`}><Icon name={cat.icon} className="text-[26px]" /></span><span className="mb-0.5 text-title-md font-semibold">{cat.name}</span><span className="text-body-sm text-on-surface-variant">{cat.hint}</span></Link>)}</div></section>
        <section className="page-container py-12"><Suspense fallback={<p role="status" className="rounded-xl bg-white p-6">Memuat laporan terbaru...</p>}><ItemBrowser home /></Suspense></section>
        <section className="page-container py-12 lg:py-16" id="cara-kerja"><div className="mx-auto mb-12 max-w-2xl text-center"><h2 className="mb-3 text-2xl font-bold tracking-tight md:text-headline-lg">Gimana cara FindIt bantu temukan barangmu?</h2><p className="text-on-surface-variant">Dirancang agar mahasiswa bisa saling bantu secara transparan dan tanpa ribet.</p></div>
          <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">{[
            { title: "Cari atau Laporkan Barang", description: "Cari barangmu di katalog atau unggah deskripsi barang hilang/ditemukan lewat form terstruktur yang ramah mobile.", icon: "bolt", note: "Proses lapor kilat", tone: "bg-primary-fixed text-on-primary-fixed" },
            { title: "Pantau Laporan Kampus", description: "Telusuri laporan aktif berdasarkan judul, jenis, kategori, dan area kampus. Periksa ciri barang dengan teliti.", icon: "search", note: "Pencarian terarah", tone: "bg-tertiary-fixed text-on-tertiary-fixed" },
            { title: "Tandai Selesai atau Arsipkan", description: "Setelah urusan barang selesai, perbarui status di Laporan Saya agar katalog kampus tetap relevan.", icon: "verified_user", note: "Kelola laporan milik sendiri", tone: "bg-secondary-fixed text-on-secondary-fixed" },
          ].map((step, i) => <div key={step.title} className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white p-6 shadow-sm lg:p-8"><div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-surface-container opacity-40" /><div><span className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl text-headline-sm font-extrabold ${step.tone}`}>{i + 1}</span><h3 className="mb-3 text-headline-sm font-bold">{step.title}</h3><p className="leading-relaxed text-on-surface-variant">{step.description}</p></div><p className="mt-8 flex items-center gap-2 border-t border-surface-container-low pt-4 text-label-sm font-semibold text-primary"><Icon name={step.icon} className="text-[18px]" />{step.note}</p></div>)}</div>
          <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-linear-to-r from-surface-container to-surface-container-high p-6 shadow-sm md:flex-row lg:p-8"><div className="flex items-center gap-4"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-sm"><Icon name="shield" className="text-[32px]" /></span><div><h3 className="mb-1 text-headline-sm font-bold">Gotong Royong & Keamanan Terjaga</h3><p className="max-w-xl text-on-surface-variant">Konfirmasi bukti kepemilikan dan gunakan titik temu resmi seperti Pos Satpam atau Ruang Kemahasiswaan.</p></div></div><Link href="#panduan-keamanan" className="button-secondary shrink-0">Panduan Klaim</Link></div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
