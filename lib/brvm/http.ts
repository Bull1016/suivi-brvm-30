import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type HeaderMap = Record<string, string | string[] | undefined>;

let ratelimitInstance: Ratelimit | null | undefined = undefined;
const memoryRateLimitMap = new Map<string, { count: number; resetAt: number }>();
let memoryRateLimitCleanupTimer: ReturnType<typeof setInterval> | null = null;

function startMemoryRateLimitCleanup(): void {
  if (memoryRateLimitCleanupTimer) return;

  memoryRateLimitCleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryRateLimitMap) {
      if (now >= record.resetAt) memoryRateLimitMap.delete(key);
    }
  }, 60000);
  memoryRateLimitCleanupTimer.unref?.();
}

function getRateLimiter(): Ratelimit | null {
  if (ratelimitInstance !== undefined) return ratelimitInstance;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (url && token) {
    const redis = new Redis({ url, token });
    ratelimitInstance = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: true,
    });
    return ratelimitInstance;
  }
  ratelimitInstance = null;
  return null;
}

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

/** Checks rate limits for sensitive endpoints (10 requests / minute per caller key). */
export async function checkRateLimit(callerKey?: string, maxRequests = 10, windowMs = 60000): Promise<boolean> {
  const limiterKey = callerKey || "127.0.0.1";

  const limiter = getRateLimiter();
  if (limiter) {
    try {
      const { success } = await limiter.limit(limiterKey);
      return success;
    } catch (e) {
      console.error("Upstash ratelimit error, falling back to memory:", e);
    }
  }

  const now = Date.now();
  startMemoryRateLimitCleanup();
  const record = memoryRateLimitMap.get(limiterKey);
  if (!record || now >= record.resetAt) {
    memoryRateLimitMap.set(limiterKey, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count += 1;
  return true;
}
