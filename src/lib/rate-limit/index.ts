const windowMs = 60_000;
const store = new Map<string, { count: number; resetAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 60_000);

export function checkRateLimit(
  identifier: string,
  maxRequests: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const existing = store.get(identifier);

  if (!existing || existing.resetAt < now) {
    const resetAt = now + windowMs;
    store.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  existing.count++;
  const remaining = Math.max(0, maxRequests - existing.count);

  return {
    allowed: existing.count <= maxRequests,
    remaining,
    resetAt: existing.resetAt,
  };
}
