import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";
import { NavigationLinks, SiteNavigation } from "./site-navigation";
import { Icon } from "./icon";

async function AccountMenu() {
  const user = await getCurrentUser();
  if (!user) return <><Link href="/login" className="text-label-md font-semibold text-primary hover:underline">Masuk</Link><Link href="/register" className="button-primary min-h-10! px-4!">Daftar</Link></>;
  const name = typeof user.user_metadata.display_name === "string" ? user.user_metadata.display_name.slice(0, 80) : "Mahasiswa";
  return <><Link href="/laporan-saya" className="max-w-28 truncate text-label-md font-semibold text-primary sm:max-w-40" title={name}>{name}</Link><LogoutButton /></>;
}

export function SiteHeader() {
  return <header className="sticky top-0 z-50 bg-white/90 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
    <div className="page-container flex min-h-20 flex-wrap items-center justify-between gap-3 py-3">
      <Link href="/" className="group flex shrink-0 items-center gap-2" aria-label="FindIt Kampus — Beranda"><Image src="/images/logo.png" alt="" width={32} height={32} className="h-8 w-auto object-contain" /><span className="text-headline-sm font-bold tracking-tight group-hover:text-primary">FindIt</span><span className="rounded-full bg-primary-fixed px-2 py-0.5 text-label-sm font-bold text-on-primary-fixed">Kampus</span></Link>
      <Suspense fallback={<NavigationLinks />}><SiteNavigation /></Suspense>
      <div className="flex items-center gap-3"><span title="Cobalt Pop light mode" className="hidden text-on-surface-variant xl:flex"><Icon name="light_mode" /></span><Suspense fallback={<span role="status" className="text-label-sm text-outline">Memuat akun...</span>}><AccountMenu /></Suspense></div>
    </div>
  </header>;
}
