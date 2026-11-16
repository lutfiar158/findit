import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { queryPublicReports, queryOwnReports, queryMatchingCandidates } from "./reports-query.ts";
import type { Database } from "./supabase/database.ts";
import type { MatchReport } from "./matching.ts";

test("public query enforces ACTIVE and combines literal title filters with pagination", async () => {
  let url: URL | undefined;
  const client = createClient<Database>("https://example.supabase.co", "sb_publishable_test", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (input) => {
      url = new URL(String(input));
      return new Response("[]", { headers: { "content-type": "application/json", "content-range": "0-0/0" } });
    } },
  });
  await queryPublicReports(client, { query: "100%_", type: "FOUND", category: "Dompet", location: "perpus", page: 2 });
  assert.equal(url?.searchParams.get("status"), "eq.ACTIVE");
  assert.equal(url?.searchParams.get("type"), "eq.FOUND");
  assert.equal(url?.searchParams.get("title"), "ilike.%100\\%\\_%");
  assert.equal(url?.searchParams.get("category"), "eq.Dompet");
  assert.equal(url?.searchParams.get("location"), "eq.perpus");
  assert.equal(url?.searchParams.get("offset"), "12");
  assert.equal(url?.searchParams.get("limit"), "12");
  assert.match(url?.searchParams.get("select") ?? "", /image_path/);
  assert.equal(url?.searchParams.has("description"), false);
});

test("own query is scoped to verified owner and includes all statuses", async () => {
  let url: URL | undefined;
  const client = createClient<Database>("https://example.supabase.co", "sb_publishable_test", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (input) => {
      url = new URL(String(input));
      return new Response("[]", { headers: { "content-type": "application/json", "content-range": "0-0/0" } });
    } },
  });
  await queryOwnReports(client, "23b594b8-a26a-4a45-bac7-4d32575ab56b", 1);
  assert.equal(url?.searchParams.get("user_id"), "eq.23b594b8-a26a-4a45-bac7-4d32575ab56b");
  assert.equal(url?.searchParams.has("status"), false);
});

test("LOST query requests only opposite ACTIVE, same category, other owner/id and later dates in pages", async () => {
  let url: URL | undefined;
  const client = createClient<Database>("https://example.supabase.co", "sb_publishable_test", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (input) => {
      url = new URL(String(input));
      return new Response("[]", { headers: { "content-type": "application/json" } });
    } },
  });
  const source: MatchReport = { id: "source-id", user_id: "owner-a", type: "LOST", title: "Dompet", status: "ACTIVE", category: " Dompet ", color: "Hitam", location: "perpus", event_date: "2025-12-31" };
  await queryMatchingCandidates(client, source, "last-id");
  assert.equal(url?.searchParams.get("status"), "eq.ACTIVE");
  assert.equal(url?.searchParams.get("type"), "eq.FOUND");
  assert.equal(url?.searchParams.get("category"), "imatch.^[[:space:]]*Dompet[[:space:]]*$");
  assert.deepEqual(url?.searchParams.getAll("id"), ["neq.source-id", "gt.last-id"]);
  assert.equal(url?.searchParams.get("user_id"), "neq.owner-a");
  assert.equal(url?.searchParams.get("event_date"), "gte.2025-12-31");
  assert.equal(url?.searchParams.get("limit"), "100");
  assert.equal(url?.searchParams.has("offset"), false);
  assert.equal(url?.searchParams.get("select"), "id,user_id,type,status,title,category,color,location,event_date,image_path");
});

test("FOUND query includes only LOST dates on or before its occurrence and escapes regex patterns", async () => {
  let url: URL | undefined;
  const client = createClient<Database>("https://example.supabase.co", "sb_publishable_test", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (input) => {
      url = new URL(String(input));
      return new Response("[]", { headers: { "content-type": "application/json" } });
    } },
  });
  const source: MatchReport = { id: "source-id", user_id: "owner-a", type: "FOUND", title: "Example", status: "ACTIVE", category: " 100%_. ", color: "Hitam", location: "perpus", event_date: "2026-01-01" };
  await queryMatchingCandidates(client, source);
  assert.equal(url?.searchParams.get("type"), "eq.LOST");
  assert.equal(url?.searchParams.get("event_date"), "lte.2026-01-01");
  assert.equal(url?.searchParams.get("category"), "imatch.^[[:space:]]*100%_\\.[[:space:]]*$");
  assert.deepEqual(url?.searchParams.getAll("id"), ["neq.source-id"]);
  assert.equal(url?.searchParams.get("limit"), "100");
});
