import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

// ─── In-memory fallback (used when REDIS_URL is not set) ─────────────────────

type CacheDriver = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  del(...keys: string[]): Promise<void>;
  keys(pattern: string): Promise<string[]>;
};

function createMemoryDriver(): CacheDriver {
  const store = new Map<string, { value: string; expiresAt: number }>();

  return {
    async get(key) {
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expiresAt < Date.now()) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    async set(key, value, ttlSeconds) {
      store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    },
    async del(...keys) {
      for (const key of keys) store.delete(key);
    },
    async keys(pattern) {
      const regex = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`);
      return [...store.keys()].filter((key) => regex.test(key));
    },
  };
}

const redisUrl = process.env.REDIS_URL;

function createRedisDriver(url: string): CacheDriver {
  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    lazyConnect: true,
  });
  client.on("error", () => {
    // Cache is best-effort — connection failures are swallowed
  });
  if (process.env.NODE_ENV !== "production") globalForRedis.redis = client;
  return {
    get: (key) => client.get(key),
    set: (key, value, ttlSeconds) =>
      client.set(key, value, "EX", ttlSeconds).then(() => undefined),
    del: (...keys) => client.del(...keys).then(() => undefined),
    keys: (pattern) => client.keys(pattern),
  };
}

const driver: CacheDriver = redisUrl
  ? createRedisDriver(redisUrl)
  : createMemoryDriver();

export const redis: CacheDriver = driver;

// ─── Cache helpers ────────────────────────────────────────────────────────────

const DEFAULT_TTL = 300; // 5 minutes

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await driver.get(key);
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
    await driver.set(key, JSON.stringify(value), ttl);
  } catch {
    // fail silently — cache is best-effort
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  try {
    if (keys.length) await driver.del(...keys);
  } catch {
    // fail silently
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    const keys = await driver.keys(pattern);
    if (keys.length) await driver.del(...keys);
  } catch {
    // fail silently
  }
}
