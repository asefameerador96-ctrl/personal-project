import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }
  return redis;
}

export async function enqueueJob(queue: string, payload: Record<string, unknown>) {
  const redis = getRedis();
  await redis.lpush(`nexus:queue:${queue}`, JSON.stringify(payload));
}

export async function dequeueJob(queue: string): Promise<Record<string, unknown> | null> {
  const redis = getRedis();
  const raw = await redis.rpop(`nexus:queue:${queue}`);
  return raw ? JSON.parse(raw) : null;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  const raw = await redis.get(`nexus:cache:${key}`);
  return raw ? JSON.parse(raw) : null;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300) {
  const redis = getRedis();
  await redis.set(`nexus:cache:${key}`, JSON.stringify(value), "EX", ttlSeconds);
}
