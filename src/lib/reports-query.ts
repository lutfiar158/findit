import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/database.ts";
import { escapeLike, PAGE_SIZE, type ReportFilters } from "./reports.ts";
import type { MatchReport } from "./matching.ts";

export const REPORT_COLUMNS = "id,user_id,type,title,category,color,location,event_date,description,status,created_at,image_path";

export function queryPublicReports(client: SupabaseClient<Database>, filters: ReportFilters, pageSize = PAGE_SIZE) {
  let query = client.from("reports").select(REPORT_COLUMNS, { count: "exact" }).eq("status", "ACTIVE");
  if (filters.query) query = query.ilike("title", `%${escapeLike(filters.query)}%`);
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.location) query = query.eq("location", filters.location);
  const start = (filters.page - 1) * pageSize;
  return query.order("created_at", { ascending: false }).order("id", { ascending: false }).range(start, start + pageSize - 1);
}

export function queryOwnReports(client: SupabaseClient<Database>, userId: string, page: number) {
  const start = (page - 1) * PAGE_SIZE;
  return client.from("reports").select(REPORT_COLUMNS, { count: "exact" }).eq("user_id", userId)
    .order("created_at", { ascending: false }).order("id", { ascending: false }).range(start, start + PAGE_SIZE - 1);
}

export function queryMatchingCandidates(client: SupabaseClient<Database>, source: MatchReport, afterId?: string) {
  let query = client.from("reports").select("id,user_id,type,status,title,category,color,location,event_date,image_path")
    .eq("status", "ACTIVE").eq("type", source.type === "LOST" ? "FOUND" : "LOST")
    .filter("category", "imatch", `^[[:space:]]*${source.category.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[[:space:]]*$`)
    .neq("id", source.id).neq("user_id", source.user_id);
  query = source.type === "LOST" ? query.gte("event_date", source.event_date) : query.lte("event_date", source.event_date);
  if (afterId) query = query.gt("id", afterId);
  return query.order("id", { ascending: true }).limit(100);
}
