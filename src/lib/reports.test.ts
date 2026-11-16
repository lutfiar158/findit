import assert from "node:assert/strict";
import test from "node:test";
import { validateReport, parseReportFilters, escapeLike, isReportId } from "./reports.ts";

function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ type: "LOST", title: "  Dompet kulit  ", category: "Dompet", color: "Hitam", location: "perpus", event_date: "2024-02-29", description: "Tertinggal di meja belajar perpustakaan.", ...overrides })) data.set(key, value);
  return data;
}

test("report validation trims fields and never accepts ownership or status from a form", () => {
  const result = validateReport(form({ user_id: "another-user", status: "ARCHIVED", id: "spoofed" }));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.data.title, "Dompet kulit");
  assert.equal(Object.hasOwn(result.data, "user_id"), false);
  assert.equal(Object.hasOwn(result.data, "status"), false);
  assert.equal(Object.hasOwn(result.data, "id"), false);
});

test("both LOST and FOUND are accepted", () => {
  assert.equal(validateReport(form({ type: "LOST" })).ok, true);
  assert.equal(validateReport(form({ type: "FOUND" })).ok, true);
});

test("reports reject invalid enums, missing strings, oversized fields and impossible dates", () => {
  const invalidCases: Record<string, string>[] = [{ type: "OTHER" }, { category: "Invalid" }, { location: "other-campus" }, { title: "  " }, { title: "x".repeat(121) }, { color: "" }, { color: "x".repeat(61) }, { description: "short" }, { description: "x".repeat(3001) }, { event_date: "2025-02-29" }, { event_date: "2024-04-31" }, { event_date: "not-a-date" }, { event_date: "0000-01-01" }];
  for (const override of invalidCases) {
    assert.equal(validateReport(form(override)).ok, false);
  }
  const data = form();
  data.set("title", new Blob(["not a title"]), "file.txt");
  assert.equal(validateReport(data).ok, false);
});

test("filter parsing validates enums, repeated params and pagination", () => {
  assert.deepEqual(parseReportFilters({ q: "  dompet  ", type: "FOUND", category: "Dompet", location: "perpus", page: "2" }), { query: "dompet", type: "FOUND", category: "Dompet", location: "perpus", page: 2 });
  assert.deepEqual(parseReportFilters({ q: ["a", "b"], type: "BOGUS", category: "Bogus", location: "Bogus", page: "-1" }), { query: "", type: "", category: "", location: "", page: 1 });
  for (const page of ["NaN", "1.5", "1e100", "0"]) assert.equal(parseReportFilters({ page }).page, 1);
});

test("title search treats SQL LIKE wildcards as literal input", () => {
  assert.equal(escapeLike("100%_a\\b"), "100\\%\\_a\\\\b");
});

test("report IDs reject arbitrary paths and malformed UUIDs", () => {
  assert.equal(isReportId("23b594b8-a26a-4a45-bac7-4d32575ab56b"), true);
  assert.equal(isReportId("dompet-hitam"), false);
  assert.equal(isReportId("../login"), false);
});
