export function safeNextPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\x00-\x20\x7f]/.test(value)) return "/laporan-saya";
  try {
    const url = new URL(value, "https://findit.internal");
    if (["/", "/lapor", "/laporan-saya", "/jelajahi-barang"].includes(url.pathname) || /^\/barang\/[0-9a-f-]{36}$/i.test(url.pathname)) {
      return `${url.pathname}${url.search}`;
    }
  } catch { /* Invalid return paths fall back to the owner's report list. */ }
  return "/laporan-saya";
}
