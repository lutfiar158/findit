import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "./supabase/server";
import { queryPublicReports, queryOwnReports, REPORT_COLUMNS } from "./reports-query";
import { queryMatchingCandidates } from "./reports-query";
import { isReportId, PAGE_SIZE, type Report, type ReportFilters } from "./reports";
import { matchReports, type Match, type MatchReport } from "./matching";

export const CONFIGURATION_ERROR = "Layanan belum dikonfigurasi. Hubungi pengelola untuk mengatur koneksi Supabase.";
export const REPORTS_ERROR = "Laporan belum dapat dimuat. Coba lagi; jika berlanjut, hubungi pengelola untuk memeriksa koneksi, schema, dan RLS Supabase.";

export async function getPublicReports(filters: ReportFilters, pageSize = PAGE_SIZE) {
  const client = await createSupabaseServerClient();
  if (!client) return { reports: [] as Report[], total: 0, error: CONFIGURATION_ERROR };
  try {
    const { data, count, error } = await queryPublicReports(client, filters, pageSize);
    if (error) return { reports: [] as Report[], total: 0, error: REPORTS_ERROR };
    return { reports: data ?? [], total: count ?? 0, error: null };
  } catch { return { reports: [] as Report[], total: 0, error: REPORTS_ERROR }; }
}

export const getActiveReport = cache(async (id: string) => {
  if (!isReportId(id)) return { report: null, error: null };
  const client = await createSupabaseServerClient();
  if (!client) return { report: null, error: CONFIGURATION_ERROR };
  try {
    const { data, error } = await client.from("reports").select(REPORT_COLUMNS).eq("id", id).eq("status", "ACTIVE").maybeSingle();
    return error ? { report: null, error: REPORTS_ERROR } : { report: data, error: null };
  } catch { return { report: null, error: REPORTS_ERROR }; }
});

export async function getOwnReports(userId: string, page: number) {
  const client = await createSupabaseServerClient();
  if (!client) return { reports: [] as Report[], total: 0, error: CONFIGURATION_ERROR };
  try {
    const { data, count, error } = await queryOwnReports(client, userId, page);
    return error ? { reports: [] as Report[], total: 0, error: REPORTS_ERROR } : { reports: data ?? [], total: count ?? 0, error: null };
  } catch { return { reports: [] as Report[], total: 0, error: REPORTS_ERROR }; }
}

export async function getMatchingReports(source: MatchReport): Promise<{ matches: Match[]; error: string | null }> {
  const client = await createSupabaseServerClient();
  if (!client) return { matches: [], error: CONFIGURATION_ERROR };
  let matches: Match[] = [];
  let afterId: string | undefined;
  try {
    while (true) {
      const { data, error } = await queryMatchingCandidates(client, source, afterId);
      if (error) return { matches: [], error: REPORTS_ERROR };
      matches = matchReports(source, [...matches.map((match) => match.report), ...(data ?? [])]);
      if (!data || data.length < 100) return { matches, error: null };
      afterId = data[data.length - 1].id;
    }
  } catch { return { matches: [], error: REPORTS_ERROR }; }
}
