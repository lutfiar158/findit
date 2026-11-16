import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/database.ts";
import type { ReportInput } from "./reports.ts";

export type ImageExtension = "jpg" | "png" | "webp";
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const error = "Pilih satu foto JPEG, PNG, atau WebP dengan ukuran maksimal 3 MB.";

export async function validateReportImage(form: FormData): Promise<{ file: File | null; extension?: ImageExtension; error?: string }> {
  const entries = form.getAll("image");
  if (entries.length === 0 || (entries.length === 1 && entries[0] instanceof File && !entries[0].name && entries[0].size === 0)) return { file: null };
  if (entries.length !== 1 || !(entries[0] instanceof File)) return { file: null, error };
  const file = entries[0];
  if (!file.size || file.size > MAX_IMAGE_BYTES) return { file: null, error };
  const extension = file.name.split(".").pop()?.toLowerCase();
  const formats: Record<string, ImageExtension> = { jpg: "jpg", jpeg: "jpg", png: "png", webp: "webp" };
  const ext = extension && formats[extension];
  if (!ext || file.type !== `image/${ext === "jpg" ? "jpeg" : ext}`) return { file: null, error };
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const valid = ext === "jpg" ? bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : ext === "png" ? [137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => bytes[i] === byte)
    : bytes.length >= 12 && [82, 73, 70, 70, 87, 69, 66, 80].every((byte, i) => bytes[i < 4 ? i : i + 4] === byte);
  return valid ? { file, extension: ext } : { file: null, error };
}

export function imagePath(userId: string, extension: ImageExtension) {
  return `${userId}/${randomUUID()}.${extension}`;
}

export function canReadReportImage(status: string, ownerId: string, viewerId: string | null) {
  return status === "ACTIVE" || ((status === "RESOLVED" || status === "ARCHIVED") && viewerId === ownerId && !!viewerId);
}

export function imageDownloadPath(report: { status: string; user_id: string; image_path: string | null }, viewerId: string | null) {
  const path = report.image_path;
  if (!path || !canReadReportImage(report.status, report.user_id, viewerId)) return null;
  return path.startsWith(`${report.user_id}/`) && /^[0-9a-f-]{36}\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(jpg|png|webp)$/.test(path) ? path : null;
}

export async function saveReportWithImage(client: SupabaseClient<Database>, userId: string, input: ReportInput, form: FormData): Promise<{ id?: string; error?: string }> {
  let validated: Awaited<ReturnType<typeof validateReportImage>>;
  try { validated = await validateReportImage(form); }
  catch { return { error: "Foto tidak dapat dibaca. Pilih file lain dan coba lagi." }; }
  if (validated.error) return { error: validated.error };
  const path = validated.file && validated.extension ? imagePath(userId, validated.extension) : null;
  const discard = async () => {
    if (path) try { await client.storage.from("report-images").remove([path]); }
    catch { /* A failed cleanup can leave a private orphan; never expose its path. */ }
  };
  if (path && validated.file) {
    try {
      const { error } = await client.storage.from("report-images").upload(path, validated.file, { upsert: false, contentType: validated.file.type });
      if (error) { await discard(); return { error: "Foto gagal diunggah. Periksa format atau ukuran, lalu coba lagi." }; }
    } catch { await discard(); return { error: "Koneksi upload terputus. Coba lagi nanti." }; }
  }

  try {
    const { data, error } = await client.from("reports").insert({ ...input, user_id: userId, image_path: path }).select("id").single();
    if (!error && data) return { id: data.id };
    if (path && /^[0-9A-Z]{5}$/.test(error?.code ?? "")) await discard();
    return { error: "Laporan belum tersimpan. Periksa izin Supabase dan coba lagi; jika foto terunggah, hubungi pengelola." };
  } catch { return { error: "Koneksi terputus. Periksa Laporan Saya sebelum mencoba kembali agar tidak membuat laporan ganda." }; }
}
