/**
 * IP-based sliding window rate limiter for Next.js Edge Middleware.
 * Works per-edge-node (Vercel PoP). Sufficient for brute-force prevention.
 */

interface RateLimitEntry {
  timestamps: number[]
  blockedUntil?: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up stale entries every 5 minutes to prevent memory leaks
let lastCleanup = Date.now()
function maybeCleanup() {
  const now = Date.now()
  if (now - lastCleanup < 5 * 60 * 1000) return
  lastCleanup = now
  for (const [key, entry] of store.entries()) {
    if (
      entry.timestamps.length === 0 &&
      (!entry.blockedUntil || entry.blockedUntil < now)
    ) {
      store.delete(key)
    }
  }
}

export interface RateLimitConfig {
  /** Max requests per window */
  limit: number
  /** Window in milliseconds */
  windowMs: number
  /** Optional: block for this many ms after limit exceeded (default: windowMs) */
  blockDurationMs?: number
}

export interface RateLimitResult {
  success: boolean
  /** Remaining requests in this window */
  remaining: number
  /** Unix timestamp (ms) when limit resets */
  resetAt: number
  /** If blocked, when the block expires */
  retryAfter?: number
}

export function rateLimit(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  maybeCleanup()

  const now = Date.now()
  const { limit, windowMs, blockDurationMs = windowMs } = config
  const windowStart = now - windowMs

  const entry = store.get(key) ?? { timestamps: [] }

  // Check if currently hard-blocked
  if (entry.blockedUntil && entry.blockedUntil > now) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.blockedUntil,
      retryAfter: entry.blockedUntil - now,
    }
  }

  // Slide the window — remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter(t => t > windowStart)

  if (entry.timestamps.length >= limit) {
    // Set a hard block
    entry.blockedUntil = now + blockDurationMs
    store.set(key, entry)
    return {
      success: false,
      remaining: 0,
      resetAt: entry.blockedUntil,
      retryAfter: blockDurationMs,
    }
  }

  entry.timestamps.push(now)
  store.set(key, entry)

  const oldestInWindow = entry.timestamps[0]
  const resetAt = oldestInWindow + windowMs

  return {
    success: true,
    remaining: limit - entry.timestamps.length,
    resetAt,
  }
}

/** Build a rate-limit key scoped to an IP and a route tier */
export function buildKey(ip: string, tier: string): string {
  return `${tier}:${ip}`
}
