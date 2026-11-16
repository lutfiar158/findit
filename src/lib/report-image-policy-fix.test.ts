import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const pending = new URL("../../supabase/pending/", import.meta.url);

function migration(name: string) {
  const path = new URL(name, pending);
  assert.ok(existsSync(path), `${name} must be proposed before approval`);
  return readFileSync(path, "utf8");
}

function usingPredicate(sql: string) {
  const policy = sql.match(/alter policy findit_photo_read_linked on storage\.objects\s+using\s*(\([\s\S]*\));\s*commit;/i)?.[1];
  assert.ok(policy, "only the linked read policy should change");
  return policy;
}

test("read fix adds only the metadata lookup operation while retaining bucket and report access", () => {
  const sql = migration("20261116_batch4_storage_read_info.sql");
  const predicate = usingPredicate(sql);
  assert.match(predicate, /storage\.allow_any_operation\(array\['object\.get_authenticated',\s*'object\.get_authenticated_info'\]\)/i);
  assert.match(predicate, /bucket_id\s*=\s*'report-images'/i);
  assert.match(predicate, /r\.image_path\s*=\s*name\s+and\s*\(r\.status\s*=\s*'ACTIVE'\s+or\s+r\.user_id\s*=\s*\(select auth\.uid\(\)\)\)/i);
  assert.match(sql, /pg_policies[\s\S]*?policyname\s*=\s*'findit_photo_read_linked'[\s\S]*?roles\s*=[\s\S]*?and qual = \$expected\$/i);
  assert.equal((sql.match(/alter policy/gi) ?? []).length, 1);
  assert.doesNotMatch(sql, /object\.(?:list|sign)|create policy|drop policy|alter table|grant\s|revoke\s/i);
});

test("rollback restores the original exact GET guard and retains the access predicates", () => {
  const sql = migration("20261116_batch4_storage_read_info_rollback.sql");
  const predicate = usingPredicate(sql);
  assert.match(predicate, /storage\.allow_only_operation\('object\.get_authenticated'\)/i);
  assert.match(predicate, /bucket_id\s*=\s*'report-images'/i);
  assert.match(predicate, /r\.image_path\s*=\s*name\s+and\s*\(r\.status\s*=\s*'ACTIVE'\s+or\s+r\.user_id\s*=\s*\(select auth\.uid\(\)\)\)/i);
  assert.match(sql, /pg_policies[\s\S]*?policyname\s*=\s*'findit_photo_read_linked'[\s\S]*?roles\s*=[\s\S]*?and qual = \$expected\$/i);
  assert.equal((sql.match(/alter policy/gi) ?? []).length, 1);
  assert.doesNotMatch(sql, /object\.(?:list|sign)|create policy|drop policy|alter table|grant\s|revoke\s/i);
});
