import assert from "node:assert/strict";
import test from "node:test";
import { safeNextPath } from "./navigation.ts";

test("login redirect preserves known internal destinations and filters", () => {
  assert.equal(safeNextPath("/lapor?type=FOUND"), "/lapor?type=FOUND");
  assert.equal(safeNextPath("/jelajahi-barang?q=dompet"), "/jelajahi-barang?q=dompet");
  assert.equal(safeNextPath("/barang/23b594b8-a26a-4a45-bac7-4d32575ab56b"), "/barang/23b594b8-a26a-4a45-bac7-4d32575ab56b");
});

test("login redirect rejects external, ambiguous, auth-loop and malformed destinations", () => {
  for (const value of [undefined, ["/lapor"], "https://evil.example", "//evil.example", "/\\evil.example", "/%2f%2fevil.example", "/login", "/register", "/lapor\n", "/unknown", "javascript:alert(1)"]) {
    assert.equal(safeNextPath(value), "/laporan-saya");
  }
});
