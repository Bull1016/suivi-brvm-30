type HeaderMap = Record<string, string | string[] | undefined>;

function headerValue(headers: HeaderMap | undefined, name: string): string {
  if (!headers) return "";
  const direct = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(direct)) return direct[0] ?? "";
  return direct ?? "";
}

export function queryParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function isCronAuthorized(req: { method?: string; headers?: HeaderMap }): boolean {
  const secret = process.env.CRON_SECRET;
  const authHeader = headerValue(req.headers, "authorization");
  const vercelCron = headerValue(req.headers, "x-vercel-cron");

  if (secret && authHeader === `Bearer ${secret}`) return true;
  if (!secret && vercelCron === "1") return true;
  return false;
}
