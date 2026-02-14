/**
 * Simple in-memory rate limiter using a sliding window approach.
 *
 * NOTE: This is per-process / per-serverless-instance. For production
 * scale across multiple instances, replace with a Redis-backed store.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // timestamp in ms
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  retryAfter: number; // seconds until window resets (0 if not limited)
}

const store = new Map<string, RateLimitEntry>();

// Periodically clean up expired entries every 60 seconds
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  }
}

/**
 * Check rate limit for a given key (typically client IP).
 *
 * @param key       Unique identifier (e.g. IP address)
 * @param limit     Maximum number of requests allowed in the window
 * @param windowMs  Window duration in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number = 100,
  windowMs: number = 60_000
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  // No existing entry or window has expired — start a new window
  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, limit, remaining: limit - 1, retryAfter: 0 };
  }

  // Within the current window
  entry.count += 1;

  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { success: false, limit, remaining: 0, retryAfter };
  }

  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    retryAfter: 0,
  };
}
