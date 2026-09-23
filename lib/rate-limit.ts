import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type LimitResult = { ok: true; remaining: number } | { ok: false; retryAfter: number };

const limiters = new Map<string, Ratelimit>();

/** Upstash sliding window when configured (shared across serverless instances), else in-memory. */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<LimitResult> {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const id = `${limit}:${windowMs}`;
    let rl = limiters.get(id);
    if (!rl) {
      rl = new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(limit, `${Math.round(windowMs / 1000)} s`),
        prefix: "tripyyy",
      });
      limiters.set(id, rl);
    }
    try {
      const r = await rl.limit(key);
      return r.success ? { ok: true, remaining: r.remaining } : { ok: false, retryAfter: Math.max(1, Math.ceil((r.reset - Date.now()) / 1000)) };
    } catch (err) {
      // A Redis outage or bad token must not take planning down with it.
      console.error(`[rate-limit] Upstash unavailable, using in-memory limit: ${(err as Error).message}`);
    }
  }
  return memoryLimit(key, limit, windowMs);
}

// Per-instance fallback: fine locally, too weak for multi-instance production.
const hits = new Map<string, number[]>();

function memoryLimit(key: string, limit: number, windowMs: number): LimitResult {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return { ok: false, retryAfter: Math.ceil((recent[0] + windowMs - now) / 1000) };
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
  }
  return { ok: true, remaining: limit - recent.length };
}

export const clientIp = (headers: Headers) =>
  headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "local";
