import { Icon } from "./icon";

export function ReportNotice({ message }: { message: string }) {
  return <div role="alert" className="rounded-2xl border border-outline-variant/40 bg-white p-6 shadow-sm"><h2 className="mb-2 flex items-center gap-2 text-headline-sm font-semibold"><Icon name="info" className="text-primary" />Layanan laporan belum tersedia</h2><p className="leading-relaxed text-on-surface-variant">{message}</p></div>;
}
