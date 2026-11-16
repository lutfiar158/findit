import assert from "node:assert/strict";
import test from "node:test";
import { logImageDiagnostic, logImageStorageRequest } from "./report-image-diagnostic.ts";

test("local image diagnostics retain Storage status/code but redact unexpected messages", () => {
  const previous = { nodeEnv: process.env.NODE_ENV, flag: process.env.FINDIT_IMAGE_DEBUG };
  const original = console.warn;
  const entries: unknown[][] = [];
  try {
    Object.assign(process.env, { NODE_ENV: "development" });
    process.env.FINDIT_IMAGE_DEBUG = "1";
    console.warn = (...args: unknown[]) => { entries.push(args); };
    logImageDiagnostic("storage_download_failed", { status: 400, code: "NoSuchKey", message: "Object not found" });
    logImageDiagnostic("storage_download_failed", { status: 400, code: "Bad\nAuthorization: Bearer secret", message: "Bearer secret, cookie secret, /private/path" });
    logImageDiagnostic("storage_download_failed", { status: 400, code: "sb_publishable_SecretKey", message: "Object not found" });
    assert.deepEqual(entries, [
      ["[report-image]", "storage_download_failed", { status: 400, code: "NoSuchKey", message: "Object not found" }],
      ["[report-image]", "storage_download_failed", { status: 400, code: "redacted", message: "redacted" }],
      ["[report-image]", "storage_download_failed", { status: 400, code: "redacted", message: "Object not found" }],
    ]);
  } finally {
    console.warn = original;
    if (previous.nodeEnv === undefined) Reflect.deleteProperty(process.env, "NODE_ENV"); else Object.assign(process.env, { NODE_ENV: previous.nodeEnv });
    if (previous.flag === undefined) delete process.env.FINDIT_IMAGE_DEBUG; else process.env.FINDIT_IMAGE_DEBUG = previous.flag;
  }
});

test("image diagnostics never log without local opt-in", () => {
  const previous = { nodeEnv: process.env.NODE_ENV, flag: process.env.FINDIT_IMAGE_DEBUG };
  const original = console.warn;
  const entries: unknown[][] = [];
  try {
    console.warn = (...args: unknown[]) => { entries.push(args); };
    Object.assign(process.env, { NODE_ENV: "production" });
    process.env.FINDIT_IMAGE_DEBUG = "1";
    logImageDiagnostic("storage_download_failed", { status: 400, code: "NoSuchKey", message: "Object not found" });
    Object.assign(process.env, { NODE_ENV: "development" });
    delete process.env.FINDIT_IMAGE_DEBUG;
    logImageDiagnostic("report_unavailable");
    assert.deepEqual(entries, []);
  } finally {
    console.warn = original;
    if (previous.nodeEnv === undefined) Reflect.deleteProperty(process.env, "NODE_ENV"); else Object.assign(process.env, { NODE_ENV: previous.nodeEnv });
    if (previous.flag === undefined) delete process.env.FINDIT_IMAGE_DEBUG; else process.env.FINDIT_IMAGE_DEBUG = previous.flag;
  }
});

test("Storage HTTP diagnostics show method and auth kind without exposing path or credentials", () => {
  const previous = { nodeEnv: process.env.NODE_ENV, flag: process.env.FINDIT_IMAGE_DEBUG };
  const original = console.warn;
  const entries: unknown[][] = [];
  try {
    Object.assign(process.env, { NODE_ENV: "development" });
    process.env.FINDIT_IMAGE_DEBUG = "1";
    console.warn = (...args: unknown[]) => { entries.push(args); };
    const url = "https://example.test/storage/v1/object/report-images/private-path/secret.jpg";
    logImageStorageRequest(url, { method: "GET", headers: { Authorization: "Bearer sb_publishable_secret" } }, 400, "sb_publishable_secret");
    logImageStorageRequest(url, { method: "GET", headers: { Authorization: "Bearer user-secret" } }, 200, "sb_publishable_secret");
    logImageStorageRequest(url.replace("/object/", "/object/info/"), undefined, 400, "sb_publishable_secret");
    assert.deepEqual(entries, [
      ["[report-image]", "storage_http", { method: "GET", endpoint: "object.download", authorization: "publishable-key", status: 400 }],
      ["[report-image]", "storage_http", { method: "GET", endpoint: "object.download", authorization: "other-bearer", status: 200 }],
    ]);
    assert.doesNotMatch(JSON.stringify(entries), /secret|private-path/);
  } finally {
    console.warn = original;
    if (previous.nodeEnv === undefined) Reflect.deleteProperty(process.env, "NODE_ENV"); else Object.assign(process.env, { NODE_ENV: previous.nodeEnv });
    if (previous.flag === undefined) delete process.env.FINDIT_IMAGE_DEBUG; else process.env.FINDIT_IMAGE_DEBUG = previous.flag;
  }
});
