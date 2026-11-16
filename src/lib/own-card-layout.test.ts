import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Layout contract only; the authenticated page cannot be rendered by this unit suite.
const own = readFileSync(new URL("../app/laporan-saya/page.tsx", import.meta.url), "utf8");
const card = readFileSync(new URL("../components/item-card.tsx", import.meta.url), "utf8");

test("own cards hover as one surface while public cards retain their hover", () => {
  assert.match(own, /className="[^"]*rounded-2xl[^"]*shadow-sm[^"]*hover:-translate-y-1[^"]*hover:shadow-xl[^"]*"\s*>\s*<ItemCard item=\{report\} embedded\s*\/>\s*<ReportStatusForm report=\{report\}/);
  assert.match(card, /embedded\s*\?\s*""\s*:\s*"[^"]*rounded-2xl[^"]*shadow-sm[^"]*hover:-translate-y-1[^"]*hover:shadow-xl/);
});
