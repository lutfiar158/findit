import "server-only";
import { createServerClient } from "@supabase/ssr";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getSupabaseConfig } from "./config";
import { logImageStorageRequest } from "../report-image-diagnostic";
import type { Database } from "./database";

export const createSupabaseServerClient = cache(async () => {
  await connection();
  const config = getSupabaseConfig();
  if (!config) return null;
  const store = await cookies();
  return createServerClient<Database>(config.url, config.key, {
    global: process.env.NODE_ENV === "development" && process.env.FINDIT_IMAGE_DEBUG === "1" ? {
      fetch: async (input, init) => {
        const response = await fetch(input, init);
        logImageStorageRequest(input, init, response.status, config.key);
        return response;
      },
    } : undefined,
    cookieOptions: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" },
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        try { values.forEach(({ name, value, options }) => store.set(name, value, options)); }
        catch { /* Server Components are read-only; Proxy refreshes cookies before rendering. */ }
      },
    },
  });
});

export const getCurrentUser = cache(async () => {
  const client = await createSupabaseServerClient();
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  return error ? null : data.user;
});

export async function requireUser(next: string) {
  const client = await createSupabaseServerClient();
  const user = await getCurrentUser();
  if (!client || !user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return { client, user };
}
