import assert from "node:assert/strict";
import test from "node:test";
import { getSupabaseConfig } from "./supabase/config.ts";

test("Supabase config rejects missing URL and secret/service-role keys", () => {
  const saved = { ...process.env };
  try {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
    assert.equal(getSupabaseConfig(), null);
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_secret_test";
    assert.equal(getSupabaseConfig(), null);
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.signature`;
    assert.equal(getSupabaseConfig(), null);
  } finally {
    process.env = saved;
  }
});

test("Supabase config accepts public publishable key and HTTPS endpoint", () => {
  const saved = { ...process.env };
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
    assert.equal(getSupabaseConfig()?.url, "https://example.supabase.co");
  } finally {
    process.env = saved;
  }
});
