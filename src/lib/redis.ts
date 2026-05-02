import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    lazyConnect: true,
  });

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

// ─── Cache helpers ────────────────────────────────────────────────────────────

const DEFAULT_TTL = 300; // 5 minutes

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttl = DEFAULT_TTL
): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttl);
  } catch {
    // fail silently — cache is best-effort
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  try {
    if (keys.length) await redis.del(...keys);
  } catch {
    // fail silently
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  } catch {
    // fail silently
  }
}
