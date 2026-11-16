import assert from "node:assert/strict";
import test from "node:test";
import { canReadReportImage, imageDownloadPath, imagePath, saveReportWithImage, validateReportImage } from "./report-image.ts";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/database.ts";

const jpeg = [0xff, 0xd8, 0xff, 0xe0];
const png = [137, 80, 78, 71, 13, 10, 26, 10];
const webp = [82, 73, 70, 70, 4, 0, 0, 0, 87, 69, 66, 80];
const form = (...files: File[]) => { const data = new FormData(); for (const file of files) data.append("image", file); return data; };
const file = (bytes: number[], name: string, type: string) => new File([new Uint8Array(bytes)], name, { type });

test("missing and empty browser file inputs are optional", async () => {
  assert.equal((await validateReportImage(form())).file, null);
  assert.equal((await validateReportImage(form(file([], "", "application/octet-stream")))).file, null);
});

test("valid JPEG, PNG and WebP require matching extension MIME and signature", async () => {
  for (const [bytes, name, mime, ext] of [[jpeg, "camera.JPEG", "image/jpeg", "jpg"], [png, "photo.png", "image/png", "png"], [webp, "photo.webp", "image/webp", "webp"]] as const) {
    const result = await validateReportImage(form(file(bytes as number[], name, mime)));
    assert.equal(result.error, undefined, name);
    assert.equal(result.extension, ext, name);
  }
});

test("rejects oversized and empty named photos", async () => {
  const atLimit = new Uint8Array(3 * 1024 * 1024);
  atLimit.set(jpeg);
  assert.equal((await validateReportImage(form(new File([atLimit], "limit.jpg", { type: "image/jpeg" })))).error, undefined);
  assert.ok((await validateReportImage(form(new File([new Uint8Array(3 * 1024 * 1024 + 1)], "big.jpg", { type: "image/jpeg" })))).error);
  assert.ok((await validateReportImage(form(file([], "empty.png", "image/png")))).error);
});

test("rejects mismatched MIME extension, spoofed magic, SVG and multiple photos", async () => {
  for (const invalid of [file(jpeg, "bad.png", "image/jpeg"), file(png, "bad.jpg", "image/jpeg"), file(jpeg, "bad.jpg", "image/png"), file([60, 115, 118, 103], "icon.svg", "image/svg+xml"), file([82, 73, 70, 70, 4, 0, 0, 0, 88, 69, 66, 80], "bad.webp", "image/webp")]) {
    assert.ok((await validateReportImage(form(invalid))).error, invalid.name);
  }
  assert.ok((await validateReportImage(form(file(jpeg, "a.jpg", "image/jpeg"), file(jpeg, "b.jpg", "image/jpeg")))).error);
  const data = new FormData(); data.set("image", "user-supplied-path");
  assert.ok((await validateReportImage(data)).error);
});

test("generated paths never use original names and use a fresh owner UUID", () => {
  const owner = "6a872e5c-8656-43f1-906d-dd080d05bd35";
  const first = imagePath(owner, "jpg");
  const second = imagePath(owner, "jpg");
  assert.match(first, /^6a872e5c-8656-43f1-906d-dd080d05bd35\/[0-9a-f-]{36}\.jpg$/);
  assert.notEqual(first, second);
});

test("archived or resolved image is visible only to its owner; active is public", () => {
  assert.equal(canReadReportImage("ACTIVE", "owner", null), true);
  assert.equal(canReadReportImage("RESOLVED", "owner", "owner"), true);
  assert.equal(canReadReportImage("ARCHIVED", "owner", "owner"), true);
  assert.equal(canReadReportImage("ARCHIVED", "owner", "stranger"), false);
  assert.equal(canReadReportImage("RESOLVED", "owner", null), false);
  assert.equal(canReadReportImage("SUSPENDED", "owner", "owner"), false);
});

test("image lookup rejects foreign, malformed and arbitrary Storage paths", () => {
  const owner = "6a872e5c-8656-43f1-906d-dd080d05bd35";
  const valid = `${owner}/ab4d5312-7f2a-42ea-8e54-6504cdf3372b.webp`;
  assert.equal(imageDownloadPath({ status: "ACTIVE", user_id: owner, image_path: valid }, null), valid);
  assert.equal(imageDownloadPath({ status: "ARCHIVED", user_id: owner, image_path: valid }, owner), valid);
  for (const path of [null, `other/${valid.split("/")[1]}`, `${owner}/../secret.webp`, `${owner}/file.svg`, `${owner}/file.png`]) {
    assert.equal(imageDownloadPath({ status: "ACTIVE", user_id: owner, image_path: path }, null), null);
  }
  assert.equal(imageDownloadPath({ status: "ARCHIVED", user_id: owner, image_path: valid }, "stranger"), null);
});

const input = { type: "LOST" as const, title: "Dompet hitam", category: "Dompet", color: "Hitam", location: "perpus", event_date: "2026-11-16", description: "Dompet ditemukan di kampus." };
function fakeClient(insertError: { code: string } | null = null, uploadError = false, throws = false, throwUpload = false) {
  const events: string[] = [];
  let savedPath = "";
  const client = {
    storage: { from(bucket: string) { assert.equal(bucket, "report-images"); return {
      async upload(path: string, _file: File, options: { upsert: boolean; contentType: string }) {
        savedPath = path; events.push("upload"); assert.equal(options.upsert, false); assert.equal(options.contentType, "image/jpeg"); if (throwUpload) throw new Error("connection lost"); return { error: uploadError ? { code: "StorageError" } : null };
      },
      async remove(paths: string[]) { assert.deepEqual(paths, [savedPath]); events.push("remove"); return { error: null }; },
    }; } },
    from(table: string) { assert.equal(table, "reports"); return { insert(data: { image_path?: string | null; user_id: string }) {
      assert.equal(data.user_id, "owner"); assert.equal(data.image_path, savedPath || null); events.push("insert");
      return { select(column: string) { assert.equal(column, "id"); return { single: async () => {
        if (throws) throw new Error("connection lost");
        return { data: insertError ? null : { id: "new-report" }, error: insertError };
      } }; } };
    } }; },
  } as unknown as SupabaseClient<Database>;
  return { client, events };
}

test("photo upload precedes report insert and saves only new owner path", async () => {
  const { client, events } = fakeClient();
  const result = await saveReportWithImage(client, "owner", input, form(file(jpeg, "original.jpg", "image/jpeg")));
  assert.deepEqual(events, ["upload", "insert"]);
  assert.equal(result.id, "new-report");
});

test("report without photo inserts nullable path and never touches Storage", async () => {
  const { client, events } = fakeClient();
  assert.equal((await saveReportWithImage(client, "owner", input, form())).id, "new-report");
  assert.deepEqual(events, ["insert"]);
});

test("upload error prevents report insert and cleans up a possible orphan", async () => {
  const { client, events } = fakeClient(null, true);
  assert.ok((await saveReportWithImage(client, "owner", input, form(file(jpeg, "a.jpg", "image/jpeg")))).error);
  assert.deepEqual(events, ["upload", "remove"]);
});

test("upload connection failure attempts cleanup without creating a report", async () => {
  const { client, events } = fakeClient(null, false, false, true);
  assert.ok((await saveReportWithImage(client, "owner", input, form(file(jpeg, "a.jpg", "image/jpeg")))).error);
  assert.deepEqual(events, ["upload", "remove"]);
});

test("invalid photo never reaches either Storage or the reports table", async () => {
  const { client, events } = fakeClient();
  assert.ok((await saveReportWithImage(client, "owner", input, form(file([1, 2, 3], "spoof.jpg", "image/jpeg")))).error);
  assert.deepEqual(events, []);
});

test("definite database rejection removes only the newly uploaded orphan", async () => {
  const { client, events } = fakeClient({ code: "42501" });
  assert.ok((await saveReportWithImage(client, "owner", input, form(file(jpeg, "a.jpg", "image/jpeg")))).error);
  assert.deepEqual(events, ["upload", "insert", "remove"]);
});

test("unknown insert outcome retains upload to avoid deleting a linked photo", async () => {
  const { client, events } = fakeClient(null, false, true);
  assert.ok((await saveReportWithImage(client, "owner", input, form(file(jpeg, "a.jpg", "image/jpeg")))).error);
  assert.deepEqual(events, ["upload", "insert"]);
});

test("ambiguous PostgREST response never deletes an image that may have been linked", async () => {
  const { client, events } = fakeClient({ code: "PGRST116" });
  assert.ok((await saveReportWithImage(client, "owner", input, form(file(jpeg, "a.jpg", "image/jpeg")))).error);
  assert.deepEqual(events, ["upload", "insert"]);
});
