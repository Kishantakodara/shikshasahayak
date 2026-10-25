export function jsonResponse(data: unknown, init?: ResponseInit | number): Response {
  let status = 200;
  let headers: Record<string, string> = { 
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
  };

  if (typeof init === "number") {
    status = init;
  } else if (init) {
    status = init.status ?? 200;
    if (init.headers) {
      const initHeaders = init.headers as Record<string, string>;
      headers = { ...headers, ...initHeaders };
    }
  }

  // Prevent caching for errors
  if (status >= 400) {
    headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
  }

  return new Response(JSON.stringify(data), {
    status,
    headers,
  });
}

export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

export function materialDownloadUrl(storageKey: string, requestUrl?: string): string {
  const encodedKey = encodeURI(storageKey);
  if (requestUrl) {
    try {
      const url = new URL(requestUrl);
      return `${url.origin}/api/storage/${encodedKey}`;
    } catch {
      return `/api/storage/${encodedKey}`;
    }
  }
  return `/api/storage/${encodedKey}`;
}

export function sessionCode(year: number, session: string): string {
  const prefix = session?.toLowerCase().startsWith("w") ? "W" : "S";
  return `${prefix}${year}`;
}

export function parseSessionCode(code: string): { year: number; session: string } | null {
  const match = /^([SW])(\d{4})$/i.exec(code.trim());
  if (!match) return null;
  return {
    session: match[1].toUpperCase() === "W" ? "winter" : "summer",
    year: Number(match[2]),
  };
}
