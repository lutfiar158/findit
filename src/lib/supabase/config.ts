export function getSupabaseConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim();
  if (!url || !key || key.startsWith("sb_secret_")) return null;
  try {
    const endpoint = new URL(url);
    if (endpoint.username || endpoint.password || (endpoint.protocol !== "https:" && !(endpoint.protocol === "http:" && ["localhost", "127.0.0.1"].includes(endpoint.hostname)))) return null;
    if (key.startsWith("eyJ") && JSON.parse(atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).role !== "anon") return null;
    return { url, key };
  } catch { return null; }
}
