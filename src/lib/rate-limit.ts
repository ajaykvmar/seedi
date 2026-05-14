// src/lib/rate-limit.ts
/**
 * In-memory rate limiter.
 *
 * PRODUCTION NOTE: On Cloudflare Pages, each request runs in a v8 isolate.
 * In-memory state resets between requests. For production, migrate to:
 *   Cloudflare KV with key pattern "rate_limit:<ip>"
 *   Write: KV.put(key, JSON.stringify({ count, resetAt }), { expirationTtl: 3600 })
 *   Read: KV.get(key) -> parse -> check
 *
 * Cloudflare KV is free for 100K reads/day, 1K writes/day, 1K deletes/day.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  key: string,
  limit = 50,
  windowMs = 3_600_000
): RateLimitResult {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  record.count++;
  const remaining = Math.max(limit - record.count, 0);
  return {
    allowed: record.count < limit,
    remaining,
    resetAt: record.resetAt,
  };
}
