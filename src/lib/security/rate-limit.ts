/**
 * Rate Limiting Utility
 *
 * Provides in-memory rate limiting for API routes.
 * In production, this should be replaced with Redis-based rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000,
    );
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Check if a request should be rate limited
   *
   * @param identifier - Unique identifier (IP, user ID, etc.)
   * @param limit - Maximum requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns Object with allowed status and remaining requests
   */
  check(
    identifier: string,
    limit: number,
    windowMs: number,
  ): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      const resetTime = now + windowMs;
      this.store.set(identifier, { count: 1, resetTime });
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime,
      };
    }

    if (entry.count >= limit) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment count
    entry.count++;
    this.store.set(identifier, entry);

    return {
      allowed: true,
      remaining: limit - entry.count,
      resetTime: entry.resetTime,
    };
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

export { rateLimiter };

/**
 * Rate limiting configurations for different endpoints
 */
export const RATE_LIMITS = {
  AUTH_SYNC: { limit: 10, windowMs: 60 * 1000 }, // 10 requests per minute
  AUTH_ACTIVITY: { limit: 30, windowMs: 60 * 1000 }, // 30 requests per minute
  USER_API: { limit: 100, windowMs: 60 * 1000 }, // 100 requests per minute
  GENERAL: { limit: 1000, windowMs: 60 * 1000 }, // 1000 requests per minute
} as const;

/**
 * Helper function to apply rate limiting to API routes
 */
export function applyRateLimit(
  identifier: string,
  config: { limit: number; windowMs: number },
) {
  return rateLimiter.check(identifier, config.limit, config.windowMs);
}
