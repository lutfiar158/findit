import type { Report } from "./reports.ts";

export type MatchReport = Pick<Report, "id" | "user_id" | "type" | "status" | "title" | "category" | "color" | "location" | "event_date"> & Partial<Pick<Report, "image_path">>;
export type Match = { report: MatchReport; score: number; daysApart: number; reasons: string[] };

const normalize = (value: string) => value.trim().toLowerCase();

function day(value: string) {
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value ? timestamp : NaN;
}

export function matchReports(source: MatchReport, candidates: MatchReport[]): Match[] {
  if (source.status !== "ACTIVE") return [];
  const sourceDay = day(source.event_date);
  return candidates.flatMap((report) => {
    if (report.status !== "ACTIVE" || report.type === source.type || report.id === source.id || report.user_id === source.user_id || normalize(report.category) !== normalize(source.category)) return [];
    const foundDay = day((source.type === "FOUND" ? source : report).event_date);
    const lostDay = day((source.type === "LOST" ? source : report).event_date);
    if (!Number.isFinite(sourceDay) || !Number.isFinite(foundDay) || !Number.isFinite(lostDay) || foundDay < lostDay) return [];

    const daysApart = (foundDay - lostDay) / 86_400_000;
    const datePoints = daysApart <= 1 ? 15 : daysApart <= 3 ? 10 : daysApart <= 7 ? 5 : 0;
    const sameColor = normalize(report.color) === normalize(source.color);
    const sameLocation = normalize(report.location) === normalize(source.location);
    return [{ report, daysApart, score: 35 + (sameColor ? 25 : 0) + (sameLocation ? 25 : 0) + datePoints,
      reasons: ["Kategori sama (+35)", sameColor ? "Warna sama (+25)" : "Warna berbeda", sameLocation ? "Lokasi sama (+25)" : "Lokasi berbeda", daysApart > 7 ? "Tanggal berjarak lebih dari 7 hari (+0)" : `Tanggal berjarak ${daysApart} hari (+${datePoints})`] }];
  }).sort((a, b) => b.score - a.score || a.daysApart - b.daysApart || (a.report.id < b.report.id ? -1 : a.report.id > b.report.id ? 1 : 0)).slice(0, 3);
}
