import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database";

export async function proxy(request: NextRequest) {
  const config = getSupabaseConfig();
  let response = NextResponse.next({ request });
  // Personalized shells and auth cookies must never enter a shared CDN cache.
  const cacheHeaders = new Headers({ "Cache-Control": "private, no-store, max-age=0", "Pragma": "no-cache", "Expires": "0" });
  if (config) {
    const client = createServerClient<Database>(config.url, config.key, {
      cookieOptions: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values, headers) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          const previousCookies = response.cookies.getAll();
          response = NextResponse.next({ request });
          previousCookies.forEach((cookie) => response.cookies.set(cookie));
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers).forEach(([name, value]) => cacheHeaders.set(name, value));
        },
      },
    });
    await client.auth.getUser();
  }
  cacheHeaders.forEach((value, name) => response.headers.set(name, value));
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2)$).*)"],
};
