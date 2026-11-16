import { categories, locations } from "./catalog.ts";

export type Report = {
  id: string;
  user_id: string;
  type: "LOST" | "FOUND";
  title: string;
  category: string;
  color: string;
  location: string;
  event_date: string;
  description: string;
  image_path: string | null;
  status: "ACTIVE" | "RESOLVED" | "ARCHIVED";
  created_at: string;
};

export type ReportInput = Pick<Report, "type" | "title" | "category" | "color" | "location" | "event_date" | "description">;
export type ReportFilters = { query: string; type: "" | "LOST" | "FOUND"; category: string; location: string; page: number };
export type SearchParams = Record<string, string | string[] | undefined>;
export type ActionState = { error?: string; message?: string };
export const PAGE_SIZE = 12;

export function formString(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
}

export function validateReport(form: FormData): { ok: true; data: ReportInput } | { ok: false; error: string } {
  const type = formString(form, "type");
  const title = formString(form, "title").trim();
  const category = formString(form, "category");
  const color = formString(form, "color").trim();
  const location = formString(form, "location");
  const event_date = formString(form, "event_date");
  const description = formString(form, "description").trim();
  if (type !== "LOST" && type !== "FOUND") return { ok: false, error: "Pilih jenis laporan Hilang atau Ditemukan." };
  if (title.length < 3 || title.length > 120) return { ok: false, error: "Judul harus 3–120 karakter." };
  if (!categories.some((item) => item.name === category)) return { ok: false, error: "Pilih kategori yang tersedia." };
  if (!color || color.length > 60) return { ok: false, error: "Warna harus 1–60 karakter." };
  if (!locations.some((item) => item.value === location)) return { ok: false, error: "Pilih lokasi kampus yang tersedia." };
  const date = new Date(`${event_date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(event_date) || Number(event_date.slice(0, 4)) < 1 || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== event_date) {
    return { ok: false, error: "Masukkan tanggal kejadian yang valid." };
  }
  if (description.length < 10 || description.length > 3000) return { ok: false, error: "Deskripsi harus 10–3000 karakter." };
  return { ok: true, data: { type, title, category, color, location, event_date, description } };
}

export function parseReportFilters(params: SearchParams): ReportFilters {
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 120) : "";
  const type = params.type === "LOST" || params.type === "FOUND" ? params.type : "";
  const category = typeof params.category === "string" && categories.some((item) => item.name === params.category) ? params.category : "";
  const location = typeof params.location === "string" && locations.some((item) => item.value === params.location) ? params.location : "";
  const page = typeof params.page === "string" && /^\d+$/.test(params.page) ? Number(params.page) : 1;
  return { query, type, category, location, page: Number.isSafeInteger(page) && page > 0 && page <= 10000 ? page : 1 };
}

export function escapeLike(value: string) { return value.replace(/[\\%_]/g, "\\$&"); }
export function isReportId(value: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value); }
export function reportDate(value: string) { return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(new Date(value)); }
