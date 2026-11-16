import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Contract check only: the migration is not executed without owner approval.
const sql = readFileSync(new URL("../../supabase/pending/20261116_batch4_report_images.sql", import.meta.url), "utf8");

test("cleanup checks every report via an owner-scoped SECURITY DEFINER predicate", () => {
  assert.match(sql, /create (?:or replace )?function public\.findit_photo_unreferenced_own\([\s\S]*?security definer[\s\S]*?set search_path = ''[\s\S]*?auth\.uid\(\)[\s\S]*?public\.reports[\s\S]*?image_path/i);
  assert.match(sql, /set row_security = off/i);
  assert.match(sql, /rolsuper or rolbypassrls/i);
  assert.match(sql, /split_part\(object_path, '\/', 1\) <> \(select auth\.uid\(\)\)::text/i);
  assert.match(sql, /revoke all on function public\.findit_photo_unreferenced_own\(text\) from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.findit_photo_unreferenced_own\(text\) to authenticated/i);
  assert.equal((sql.match(/public\.findit_photo_unreferenced_own\(name\)/g) ?? []).length, 2);
});

test("SECURITY DEFINER rejects own-folder paths without a UUID filename and supported extension", () => {
  const fn = sql.match(/create function public\.findit_photo_unreferenced_own\(object_path text\)[\s\S]*?\n\$\$;/)?.[0];
  assert.ok(fn);
  assert.match(fn, /object_path !~ \('\^' \|\| \(select auth\.uid\(\)\)::text \|\| '\/\[0-9a-f\]\{8\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{12\}\[\.\]\(jpg\|png\|webp\)\$'\)/);
  const owner = "6a872e5c-8656-43f1-906d-dd080d05bd35";
  const suffix = fn.match(/object_path !~ \('\^' \|\| \(select auth\.uid\(\)\)::text \|\| '([^']+)'\)/)?.[1];
  assert.ok(suffix);
  const path = new RegExp(`^${owner}${suffix}`);
  const valid = `${owner}/ab4d5312-7f2a-42ea-8e54-6504cdf3372b`;
  for (const ext of ["jpg", "png", "webp"]) assert.equal(path.test(`${valid}.${ext}`), true);
  for (const invalid of [`${owner}/file.jpg`, `${owner}/../file.jpg`, `${valid}.svg`, `${valid}.jpeg`, `${valid}.jpg/extra`, `other/${valid.split("/")[1]}.jpg`]) assert.equal(path.test(invalid), false, invalid);
});

test("orphan read and delete both verify object owner ID and folder", () => {
  for (const name of ["findit_photo_read_orphan_for_cleanup", "findit_photo_delete_orphan_own"]) {
    const policy = sql.match(new RegExp(`create policy ${name}[^;]+;`, "i"))?.[0];
    assert.ok(policy, name);
    assert.match(policy, /owner_id\s*=\s*\(select auth\.uid\(\)::text\)/i);
    assert.match(policy, /storage\.foldername\(name\)/i);
  }
});

test("download and remove SELECT are operation-scoped; no listing or signing is granted", () => {
  assert.match(sql, /findit_photo_read_linked[^;]*storage\.allow_only_operation\('object\.get_authenticated'\)/);
  assert.match(sql, /findit_photo_read_orphan_for_cleanup[^;]*storage\.allow_only_operation\('object\.delete_many'\)/);
  assert.doesNotMatch(sql, /storage\.allow_(?:only|any)_operation\([^;]*(?:object\.list|object\.sign)/);
});
