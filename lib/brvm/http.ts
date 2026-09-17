type HeaderMap = Record<string, string | string[] | undefined>;

/** Reads the first string value for a case-insensitive request header. */
function headerValue(headers: HeaderMap | undefined, name: string): string {
  if (!headers) return "";
  const direct = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(direct)) return direct[0] ?? "";
  return direct ?? "";
}

/** Reduces a Vercel query parameter to one string value. */
export function queryParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/** Checks whether a request carries valid Vercel cron authorization. */
export function isCronAuthorized(req: { method?: string; headers?: HeaderMap }): boolean {
  const secret = process.env.CRON_SECRET;
  const authHeader = headerValue(req.headers, "authorization");

  if (secret && authHeader === `Bearer ${secret}`) return true;
  return false;
}
