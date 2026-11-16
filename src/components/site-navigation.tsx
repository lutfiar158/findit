"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteNavigation() {
  const pathname = usePathname();
  const activeHref = pathname.startsWith("/barang/") ? "/jelajahi-barang" : pathname;
  return <NavigationLinks activeHref={activeHref} />;
}

export function NavigationLinks({ activeHref = null }: { activeHref?: string | null }) {
  return <nav aria-label="Navigasi utama" className="order-3 flex w-full flex-wrap justify-center rounded-2xl bg-surface-container-low p-1.5 lg:order-none lg:w-auto lg:rounded-full">
    {[["/", "Beranda"], ["/jelajahi-barang", "Jelajahi Barang"], ["/lapor", "Lapor Barang"], ["/laporan-saya", "Laporan Saya"]].map(([href, label]) => <Link key={href} href={href} aria-current={activeHref === href ? "page" : undefined} className={`rounded-full px-4 py-2 text-label-md font-semibold transition ${activeHref === href ? "bg-primary-container text-white shadow-sm" : "text-on-surface-variant hover:text-primary"}`}>{label}</Link>)}
  </nav>;
}
