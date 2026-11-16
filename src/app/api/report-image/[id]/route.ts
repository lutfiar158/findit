import { isReportId } from "@/lib/reports";
import { imageDownloadPath } from "@/lib/report-image";
import { logImageDiagnostic } from "@/lib/report-image-diagnostic";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const headers = { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" };
const missing = () => new Response(null, { status: 404, headers });

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isReportId(id)) { logImageDiagnostic("invalid_id"); return missing(); }
  const client = await createSupabaseServerClient();
  if (!client) { logImageDiagnostic("client_unconfigured"); return missing(); }
  try {
    const { data: report, error } = await client.from("reports").select("user_id,status,image_path").eq("id", id).maybeSingle();
    if (error) { logImageDiagnostic("report_query_failed", error); return missing(); }
    if (!report) { logImageDiagnostic("report_unavailable_missing_or_rls"); return missing(); }
    if (!report.image_path) { logImageDiagnostic("image_path_empty"); return missing(); }
    const viewer = report.status === "ACTIVE" ? null : (await client.auth.getUser()).data.user?.id ?? null;
    const path = imageDownloadPath(report, viewer);
    if (!path) { logImageDiagnostic(report.status !== "ACTIVE" && viewer !== report.user_id ? "image_access_denied" : "image_path_invalid"); return missing(); }
    const { data, error: storageError } = await client.storage.from("report-images").download(path);
    if (storageError || !data) { logImageDiagnostic("storage_download_failed", storageError ?? undefined); return missing(); }
    const extension = path.split(".").pop();
    return new Response(data, { headers: { ...headers, "Content-Type": extension === "jpg" ? "image/jpeg" : `image/${extension}` } });
  } catch { logImageDiagnostic("unexpected_error"); return missing(); }
}
