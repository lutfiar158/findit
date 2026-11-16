import assert from "node:assert/strict";
import test from "node:test";
import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { queryPublicReports, queryMatchingCandidates } from "../src/lib/reports-query.ts";
import { matchReports } from "../src/lib/matching.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const enabled = process.env.FINDIT_LIVE_TESTS === "1" && url && key;
const makeClient = () => createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(15000) }) },
});
function success(result, stage) {
  assert.equal(Boolean(result.error), false, `${stage} failed (API code ${result.error?.code || "unavailable"}; details withheld)`);
  return result.data;
}

// Opt-in: creates two temporary Auth users; test reports are archived, never deletes other data.
test("live Supabase Auth, LOST/FOUND and two-account RLS isolation", { skip: !enabled && "Set FINDIT_LIVE_TESTS=1 and configure Supabase first", timeout: 120000 }, async (t) => {
  const settingsResponse = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key }, signal: AbortSignal.timeout(15000) });
  assert.equal(settingsResponse.ok, true, "Auth settings must be reachable");
  const settings = await settingsResponse.json();
  if (!settings.mailer_autoconfirm) { t.skip("Confirm Email is enabled; provide verified test accounts instead of bypassing verification"); return; }
  const suffix = randomUUID().slice(0, 12);
  const password = `Aa!1${randomBytes(18).toString("base64url")}`;
  const a = makeClient();
  const b = makeClient();
  const anon = makeClient();
  const created = [];
  try {
    const signupA = success(await a.auth.signUp({ email: `findit-batch2-${suffix}-a@example.com`, password, options: { data: { display_name: "FindIt Uji A" } } }), "Register A");
    const signupB = success(await b.auth.signUp({ email: `findit-batch2-${suffix}-b@example.com`, password, options: { data: { display_name: "FindIt Uji B" } } }), "Register B");
    assert.equal(Boolean(signupA.session && signupB.session), true, "Autoconfirm must provide real sessions");
    const userA = success(await a.auth.getUser(), "Verify A").user;
    const userB = success(await b.auth.getUser(), "Verify B").user;
    assert.notEqual(userA.id, userB.id, "Accounts must differ");
    const profile = success(await a.from("profiles").select("id,display_name").eq("id", userA.id).single(), "Signup profile trigger");
    assert.equal(profile.display_name, "FindIt Uji A", "Display name must be saved in profiles");

    const base = { title: `FindIt Uji ${suffix} 100%_item`, type: "LOST", category: "Dompet", color: "Hitam", location: "perpus", event_date: new Date().toISOString().slice(0, 10), description: "Laporan pengujian otomatis FindIt; akan diarsipkan setelah pengujian." };
    const reportA = success(await a.from("reports").insert({ ...base, user_id: userA.id }).select("id,status,user_id").single(), "Create LOST");
    created.push([a, reportA.id, userA.id]);
    assert.equal(reportA.status, "ACTIVE");
    const foundA = success(await a.from("reports").insert({ ...base, title: `FindIt Uji ${suffix} FOUND A`, type: "FOUND", user_id: userA.id }).select("id,status,user_id").single(), "A creates FOUND");
    created.push([a, foundA.id, userA.id]);
    assert.equal(foundA.status, "ACTIVE");
    assert.equal(foundA.user_id, userA.id);
    const reportB = success(await b.from("reports").insert({ ...base, title: `FindIt Uji ${suffix} FOUND B`, type: "FOUND", user_id: userB.id }).select("id,status,title").single(), "Create FOUND B");
    created.push([b, reportB.id, userB.id]);
    const publicRows = success(await anon.from("reports").select("id").in("id", [reportA.id, foundA.id, reportB.id]), "Public ACTIVE reports");
    assert.equal(publicRows.length, 3);
    const filtered = success(await queryPublicReports(anon, { query: `${suffix} 100%_item`, type: "LOST", category: "Dompet", location: "perpus", page: 1 }), "Search and filters");
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, reportA.id);
    const source = success(await anon.from("reports").select("id,user_id,type,status,title,category,color,location,event_date").eq("id", reportA.id).single(), "Read active LOST for matching");
    const candidates = success(await queryMatchingCandidates(anon, source), "Fetch filtered FOUND candidates");
    assert.equal(candidates.some((candidate) => candidate.id === foundA.id), false, "A's own FOUND must not be a candidate");
    assert.equal(matchReports(source, candidates).find((match) => match.report.id === reportB.id)?.score, 100, "B's FOUND must score 100/100 for A's LOST");
    if (process.env.FINDIT_SITE_TESTS === "1") {
      const detail = await fetch(`http://localhost:3000/barang/${reportA.id}`, { signal: AbortSignal.timeout(15000) });
      assert.equal(detail.ok, true, "Public ACTIVE detail must load in production");
      const html = await detail.text();
      assert.equal(html.includes(`FindIt Uji ${suffix} FOUND B`), true, "Public detail must show B's matching report");
      assert.equal(html.includes("Skor kesamaan"), true, "Public detail must show attribute score");
      assert.equal(html.includes("bukan probabilitas kepemilikan"), true, "Public detail must explain the score");
      assert.equal(html.includes(`FindIt Uji ${suffix} FOUND A`), false, "Public detail must not suggest A's own FOUND");
    }

    const anonymousInsert = await anon.from("reports").insert({ ...base, user_id: userA.id });
    assert.equal(Boolean(anonymousInsert.error), true, "Anonymous insert must be denied");
    const spoofedInsert = await b.from("reports").insert({ ...base, user_id: userA.id });
    assert.equal(Boolean(spoofedInsert.error), true, "B cannot insert as A");
    const changeA = await b.from("reports").update({ status: "RESOLVED" }).eq("id", reportA.id).select("id");
    assert.equal(changeA.error !== null || changeA.data.length === 0, true, "B cannot update A");
    assert.equal(success(await a.from("reports").select("status").eq("id", reportA.id).single(), "Verify A unchanged").status, "ACTIVE");
    const transfer = await a.from("reports").update({ user_id: userB.id }).eq("id", reportA.id);
    assert.equal(Boolean(transfer.error), true, "Ownership column must not be writable");
    const editTitle = await a.from("reports").update({ title: "Tampered title" }).eq("id", reportA.id);
    assert.equal(Boolean(editTitle.error), true, "Only status, not report contents, may be updated");
    const initialResolved = await a.from("reports").insert({ ...base, user_id: userA.id, status: "RESOLVED" }).select("id").maybeSingle();
    if (initialResolved.data) created.push([a, initialResolved.data.id, userA.id]);
    assert.equal(Boolean(initialResolved.error), true, "New reports must start ACTIVE");

    success(await a.from("reports").update({ status: "RESOLVED" }).eq("id", reportA.id).select("id").single(), "Owner resolves report");
    assert.equal(success(await anon.from("reports").select("id").eq("id", reportA.id), "Public cannot read RESOLVED").length, 0);
    assert.equal(success(await queryMatchingCandidates(anon, { ...source, type: "FOUND" }), "Resolved LOST excluded from public candidate query").some((candidate) => candidate.id === reportA.id), false);
    assert.equal(success(await b.from("reports").select("id").eq("id", reportA.id), "B cannot read A RESOLVED").length, 0);
    assert.equal(success(await a.from("reports").select("id").eq("user_id", userA.id).eq("id", reportA.id), "Owner sees own resolved report").length, 1);
    success(await a.from("reports").update({ status: "ARCHIVED" }).eq("id", reportA.id).select("id").single(), "Owner archives report");
    assert.equal(success(await anon.from("reports").select("id").eq("id", reportA.id), "Public cannot read ARCHIVED").length, 0);
    success(await a.from("reports").update({ status: "ARCHIVED" }).eq("id", foundA.id).select("id").single(), "A archives ACTIVE FOUND directly");
    assert.equal(success(await anon.from("reports").select("id").eq("id", foundA.id), "Public cannot read archived FOUND").length, 0);
    assert.equal(success(await a.from("reports").select("id").eq("id", foundA.id), "A can read archived FOUND").length, 1);
    assert.equal(success(await b.from("reports").select("id").eq("id", foundA.id), "B cannot read archived FOUND").length, 0);
    const reactivate = await a.from("reports").update({ status: "ACTIVE" }).eq("id", reportA.id);
    assert.equal(Boolean(reactivate.error), true, "Status policy must reject reactivation");

    success(await a.auth.signOut({ scope: "local" }), "Logout A");
    const login = success(await a.auth.signInWithPassword({ email: `findit-batch2-${suffix}-a@example.com`, password }), "Login A");
    assert.equal(login.user.id, userA.id, "Login restores the correct identity");
    t.diagnostic("Auth, RLS, filtered matching (A LOST ↔ B FOUND 100/100; A's own FOUND excluded) passed; no credential output.");
  } finally {
    for (const [client, id, userId] of created) {
      const cleanup = await client.from("reports").update({ status: "ARCHIVED" }).eq("id", id).eq("user_id", userId);
      if (cleanup.error) t.diagnostic("A test report could not be archived; inspect test data manually.");
    }
    await a.auth.signOut({ scope: "local" });
    await b.auth.signOut({ scope: "local" });
  }
});
