type RateEntry = { count: number; resetAt: number };

const buckets = new Map<string, RateEntry>();

/**
 * In-memory sliding window counter. Fine for a single Node instance;
 * replace with Redis when running multiple replicas.
 */
export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterMs: number } {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now >= entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (entry.count >= max) {
    return { ok: false, retryAfterMs: Math.max(0, entry.resetAt - now) };
  }

  entry.count += 1;
  return { ok: true };
}

/** Best-effort cleanup so the map doesn't grow forever in long-lived processes. */
export function pruneRateLimitBuckets(): void {
  const now = Date.now();
  for (const [key, entry] of buckets) {
    if (now >= entry.resetAt) buckets.delete(key);
  }
}
