/** Only server configuration may supply trusted production origins. */
function normalizeOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}

function vercelOrigin(host: string | undefined): string | null {
  // Vercel injects a hostname without protocol, port, path, or credentials.
  if (!host || !/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(host)) return null;
  return normalizeOrigin(`https://${host}`);
}

export function allowedOrigins(request: Request): string[] {
  if (process.env.APP_URL) {
    const explicit = normalizeOrigin(process.env.APP_URL);
    return explicit ? [explicit] : [];
  }
  if (process.env.VERCEL === "1") {
    const origins = [
      process.env.VERCEL_ENV === "production"
        ? vercelOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL)
        : null,
      vercelOrigin(process.env.VERCEL_URL),
    ];
    return [
      ...new Set(origins.filter((origin): origin is string => Boolean(origin))),
    ];
  }
  if (process.env.NODE_ENV !== "production") {
    const local = normalizeOrigin(
      `http://${request.headers.get("host") || new URL(request.url).host}`,
    );
    return local ? [local] : [];
  }
  return [];
}

export function appOrigin(request: Request): string | null {
  const allowed = allowedOrigins(request);
  // Preserve the originating hostname for PKCE cookies and email callbacks.
  const incoming = request.headers.get("origin") || new URL(request.url).origin;
  return allowed.includes(incoming) ? incoming : allowed[0] || null;
}
