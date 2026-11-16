import Link from "next/link";
import type { Report } from "@/lib/reports";
import { reportDate } from "@/lib/reports";
import { categories, locationLabel } from "@/lib/catalog";
import { Icon } from "./icon";
import { ReportImage } from "./report-image";

export function ItemCard({ item, embedded = false }: { item: Report; embedded?: boolean }) {
  const found = item.type === "FOUND";
  const category = categories.find((entry) => entry.name === item.category);
  const active = item.status === "ACTIVE";
  const visual = <><ReportImage id={item.id} hasImage={!!item.image_path} alt={`Foto ${item.title}`}><div className={`flex h-full items-center justify-center ${category?.tone ?? "text-primary"}`}><Icon name={category?.icon ?? "category"} className="text-[64px]" /></div></ReportImage><span className={`absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-label-sm font-bold shadow-sm ${found ? "bg-tertiary-fixed text-on-tertiary-fixed" : "bg-secondary-fixed text-on-secondary-fixed"}`}><span className={`h-1.5 w-1.5 rounded-full ${found ? "bg-tertiary" : "bg-secondary"}`} />{found ? "Ditemukan" : "Hilang"}</span><span className="absolute right-3 bottom-3 rounded bg-inverse-surface/80 px-2 py-1 text-label-sm text-white">{reportDate(item.created_at)}</span></>;

  return <article className={`group flex h-full flex-col overflow-hidden bg-white ${embedded ? "" : "rounded-2xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"}`}>
    {active ? <Link href={`/barang/${item.id}`} aria-label={`Lihat detail ${item.title}`} className="relative block h-48 overflow-hidden bg-surface-container">{visual}</Link> : <div className="relative h-48 overflow-hidden bg-surface-container">{visual}</div>}
    <div className="flex flex-1 flex-col justify-between p-5">
      <div><p className="mb-2 flex items-center gap-1.5 text-body-sm text-on-surface-variant"><Icon name="location_on" className={`text-[16px] ${found ? "text-tertiary" : "text-secondary"}`} />{locationLabel(item.location)}</p><h3 className="mb-2 text-headline-sm font-bold group-hover:text-primary">{active ? <Link href={`/barang/${item.id}`}>{item.title}</Link> : item.title}</h3><p className={`${active ? "line-clamp-2" : "whitespace-pre-wrap"} mb-4 text-on-surface-variant`}>{item.description}</p></div>
      <div className="flex items-center justify-between gap-2 border-t border-surface-container-low pt-3"><span className="truncate text-body-sm text-on-surface-variant">{item.category}</span>{active ? <Link href={`/barang/${item.id}`} className="flex shrink-0 items-center text-label-md font-semibold text-primary">Buka Detail <Icon name="chevron_right" className="text-[16px]" /></Link> : <span className="text-label-md text-on-surface-variant">{item.status === "RESOLVED" ? "Selesai" : "Diarsipkan"}</span>}</div>
    </div>
  </article>;
}
