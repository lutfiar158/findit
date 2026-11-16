"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/server";
import { validateReport, formString, isReportId, type ActionState } from "@/lib/reports";
import { saveReportWithImage } from "@/lib/report-image";

export async function createReport(_state: ActionState, form: FormData): Promise<ActionState> {
  const validation = validateReport(form);
  if (!validation.ok) return { error: validation.error };
  const { client, user } = await requireUser(`/lapor?type=${validation.data.type}`);
  const result = await saveReportWithImage(client, user.id, validation.data, form);
  if (!result.id) return { error: result.error ?? "Laporan belum tersimpan." };
  revalidatePath("/");
  revalidatePath("/jelajahi-barang");
  revalidatePath("/laporan-saya");
  redirect(`/barang/${result.id}`);
}

export async function updateReportStatus(_state: ActionState, form: FormData): Promise<ActionState> {
  const { client, user } = await requireUser("/laporan-saya");
  const id = formString(form, "id");
  const status = formString(form, "status");
  if (!isReportId(id) || (status !== "RESOLVED" && status !== "ARCHIVED")) return { error: "ID atau status laporan tidak valid." };
  try {
    const { data, error } = await client.from("reports").update({ status }).eq("id", id).eq("user_id", user.id).select("id").maybeSingle();
    if (error || !data) return { error: "Status tidak berubah. Laporan tidak tersedia, bukan milik Anda, atau izin Supabase menolak perubahan." };
  } catch { return { error: "Perubahan belum dapat dikonfirmasi. Muat ulang sebelum mencoba kembali." }; }
  revalidatePath("/");
  revalidatePath("/jelajahi-barang");
  revalidatePath("/laporan-saya");
  revalidatePath(`/barang/${id}`);
  return { message: status === "RESOLVED" ? "Laporan ditandai selesai." : "Laporan diarsipkan." };
}
