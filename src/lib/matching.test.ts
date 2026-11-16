import assert from "node:assert/strict";
import test from "node:test";
import { matchReports, type MatchReport } from "./matching.ts";

const lost: MatchReport = { id: "lost", user_id: "A", type: "LOST", status: "ACTIVE", category: "Dompet", color: "Hitam", location: "perpus", event_date: "2025-12-31", title: "Dompet hitam" };
const found: MatchReport = { ...lost, id: "found", user_id: "B", type: "FOUND", event_date: "2026-01-01", title: "Dompet ditemukan" };

test("matching rejects different categories, even if every other attribute agrees", () => {
  assert.deepEqual(matchReports(lost, [{ ...found, category: "Kunci" }]), []);
});

test("matching rejects same type and same report", () => {
  assert.deepEqual(matchReports(lost, [{ ...found, type: "LOST" }, { ...found, id: "lost" }]), []);
});

test("matching rejects the same owner", () => {
  assert.deepEqual(matchReports(lost, [{ ...found, user_id: "A" }]), []);
});

test("matching rejects non-ACTIVE candidate or source", () => {
  assert.deepEqual(matchReports(lost, [{ ...found, status: "RESOLVED" }, { ...found, status: "ARCHIVED" }]), []);
  assert.deepEqual(matchReports({ ...lost, status: "ARCHIVED" }, [found]), []);
});

test("matching rejects FOUND before LOST in either direction", () => {
  assert.deepEqual(matchReports(lost, [{ ...found, event_date: "2025-12-30" }]), []);
  assert.deepEqual(matchReports(found, [{ ...lost, event_date: "2026-01-02" }]), []);
  assert.deepEqual(matchReports(lost, [{ ...found, event_date: "not-a-date" }]), []);
});

test("normalized category, color and location matches have 100 points and clear reasons", () => {
  const [match] = matchReports(lost, [{ ...found, category: "  dOmPeT  ", color: " hitam ", location: " PERPUS " }]);
  assert.equal(match.score, 100);
  assert.deepEqual(match.reasons, ["Kategori sama (+35)", "Warna sama (+25)", "Lokasi sama (+25)", "Tanggal berjarak 1 hari (+15)"]);
});

test("different color and location each cost 25 points", () => {
  assert.equal(matchReports(lost, [{ ...found, color: "Biru" }])[0].score, 75);
  assert.equal(matchReports(lost, [{ ...found, location: "parkir" }])[0].score, 75);
  const [match] = matchReports(lost, [{ ...found, color: "Biru", location: "parkir" }]);
  assert.equal(match.score, 50);
  assert.deepEqual(match.reasons, ["Kategori sama (+35)", "Warna berbeda", "Lokasi berbeda", "Tanggal berjarak 1 hari (+15)"]);
});

test("date score covers 0, 1, 2, 3, 4, 7 and 8 days across a year boundary", () => {
  for (const [date, score] of [["2025-12-31", 100], ["2026-01-01", 100], ["2026-01-02", 95], ["2026-01-03", 95], ["2026-01-04", 90], ["2026-01-07", 90], ["2026-01-08", 85]] as const) {
    assert.equal(matchReports(lost, [{ ...found, event_date: date }])[0].score, score, date);
  }
});

test("sorting uses highest score, then shortest date gap, then ID, with a maximum of three", () => {
  const candidates = [
    { ...found, id: "z", event_date: "2026-01-01" },
    { ...found, id: "a", event_date: "2025-12-31" },
    { ...found, id: "b", event_date: "2025-12-31" },
    { ...found, id: "low", color: "Biru", event_date: "2025-12-31" },
    { ...found, id: "late", event_date: "2026-01-02" },
  ];
  assert.deepEqual(matchReports(lost, candidates).map((match) => match.report.id), ["a", "b", "z"]);
  assert.deepEqual(matchReports(lost, []).map((match) => match.report.id), []);
  assert.deepEqual(matchReports(lost, candidates.slice(0, 2)).map((match) => match.report.id), ["a", "z"]);
});

test("FOUND source recommends earlier LOST with the correct forward date difference", () => {
  assert.equal(matchReports(found, [lost])[0].score, 100);
  assert.equal(matchReports(found, [lost])[0].daysApart, 1);
});

test("a better candidate on a later page displaces an earlier page's top three", () => {
  const early = matchReports(lost, ["a", "b", "c"].map((id) => ({ ...found, id, color: "Biru", location: "parkir" })));
  const combined = matchReports(lost, [...early.map((match) => match.report), { ...found, id: "late-best" }]);
  assert.deepEqual(combined.map((match) => match.report.id), ["late-best", "a", "b"]);
});
