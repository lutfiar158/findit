// Local-only diagnostics: Storage messages may contain paths or credentials, so only known text is logged.
export function logImageDiagnostic(stage: string, error?: { status?: number; code?: string; message?: string }) {
  if (process.env.NODE_ENV !== "development" || process.env.FINDIT_IMAGE_DEBUG !== "1") return;
  console.warn("[report-image]", stage, error && {
    status: typeof error.status === "number" && error.status >= 100 && error.status <= 599 ? error.status : null,
    code: error.code === "NoSuchKey" || error.code === "AccessDenied" ? error.code : "redacted",
    message: error.message === "Object not found" ? error.message : "redacted",
  });
}

export function logImageStorageRequest(input: RequestInfo | URL, init: RequestInit | undefined, status: number, key: string) {
  if (process.env.NODE_ENV !== "development" || process.env.FINDIT_IMAGE_DEBUG !== "1") return;
  try {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (!url.pathname.startsWith("/storage/v1/object/report-images/")) return;
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    const authorization = headers.get("Authorization");
    console.warn("[report-image]", "storage_http", {
      method: (init?.method ?? (input instanceof Request ? input.method : "GET")) === "GET" ? "GET" : "other",
      endpoint: "object.download",
      authorization: authorization === `Bearer ${key}` ? "publishable-key" : authorization?.startsWith("Bearer ") ? "other-bearer" : "missing-or-other",
      status,
    });
  } catch { /* Diagnostics must never break the request. */ }
}
