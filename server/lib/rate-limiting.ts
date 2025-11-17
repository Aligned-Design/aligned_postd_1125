/**
 * Rate Limiting Middleware
 * Implements token-bucket rate limiting for API endpoints
 * Prevents brute force and DOS attacks
 */

import { Request, Response, NextFunction } from "express";

/**
 * Token bucket for rate limiting
 */
interface TokenBucket {
  tokens: number;
  lastRefilled: number;
}

/**
 * Rate limiter configuration
 */
export interface RateLimiterConfig {
  tokensPerInterval: number;
  intervalMs: number;
  maxTokens?: number;
}

/**
 * In-memory rate limit store
 * Maps key -> token bucket
 */
class RateLimitStore {
  private buckets: Map<string, TokenBucket> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    // Clean up old entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    const maxAge = 1 * 60 * 60 * 1000; // 1 hour

    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefilled > maxAge) {
        this.buckets.delete(key);
      }
    }
  }

  /**
   * Get or create bucket for key
   */
  getBucket(key: string): TokenBucket {
    if (!this.buckets.has(key)) {
      this.buckets.set(key, {
        tokens: 0,
        lastRefilled: Date.now(),
      });
    }
    return this.buckets.get(key)!;
  }

  /**
   * Refill tokens based on elapsed time
   */
  refillTokens(bucket: TokenBucket, config: RateLimiterConfig): void {
    const now = Date.now();
    const timePassed = now - bucket.lastRefilled;
    const tokensToAdd =
      (timePassed / config.intervalMs) * config.tokensPerInterval;

    bucket.tokens = Math.min(
      tokensToAdd + bucket.tokens,
      config.maxTokens ?? config.tokensPerInterval * 10
    );
    bucket.lastRefilled = now;
  }

  /**
   * Try to consume tokens
   */
  tryConsume(key: string, tokens: number, config: RateLimiterConfig): boolean {
    const bucket = this.getBucket(key);
    this.refillTokens(bucket, config);

    if (bucket.tokens >= tokens) {
      bucket.tokens -= tokens;
      return true;
    }

    return false;
  }

  /**
   * Destroy cleanup interval
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

const rateLimitStore = new RateLimitStore();

/**
 * Create rate limit middleware
 * @param config Rate limiter configuration
 * @param keyFn Function to extract key from request (default: IP address)
 * @param tokensPerRequest Tokens to consume per request (default: 1)
 */
export function createRateLimiter(
  config: RateLimiterConfig,
  keyFn?: (req: Request) => string,
  tokensPerRequest: number = 1
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyFn ? keyFn(req) : req.ip || "unknown";

    if (rateLimitStore.tryConsume(key, tokensPerRequest, config)) {
      // Add rate limit headers
      (res as any).set("X-RateLimit-Limit", config.tokensPerInterval.toString());
      (res as any).set(
        "X-RateLimit-Remaining",
        Math.floor(rateLimitStore.getBucket(key).tokens).toString()
      );
      next();
    } else {
      // Rate limit exceeded
      const retryAfter = Math.ceil(
        config.intervalMs / config.tokensPerInterval / 1000
      );
      (res as any).set("Retry-After", retryAfter.toString());
      (res as any).status(429).json({
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Rate limit exceeded. Please try again later",
          severity: "warning",
          timestamp: new Date().toISOString(),
          details: {
            retryAfter,
          },
          suggestion: `Please wait ${retryAfter} seconds before trying again`,
        },
      });
    }
  };
}

/**
 * OAuth endpoint rate limiters
 */
export const oauthRateLimiters = {
  /**
   * Rate limiter for OAuth initiation (10 requests per minute per IP)
   */
  initiate: createRateLimiter({
    tokensPerInterval: 10,
    intervalMs: 60 * 1000,
    maxTokens: 10,
  }),

  /**
   * Rate limiter for OAuth callback (5 attempts per minute per state)
   */
  callback: (req: Request, res: Response, next: NextFunction): void => {
    const state = ((req as any).query.state as string) || "unknown";
    const key = `oauth-callback:${state}`;

    const config: RateLimiterConfig = {
      tokensPerInterval: 5,
      intervalMs: 60 * 1000,
      maxTokens: 5,
    };

    if (rateLimitStore.tryConsume(key, 1, config)) {
      (res as any).set("X-RateLimit-Limit", "5");
      (res as any).set(
        "X-RateLimit-Remaining",
        Math.floor(rateLimitStore.getBucket(key).tokens).toString()
      );
      next();
    } else {
      const retryAfter = 12; // 60s / 5 requests
      (res as any).set("Retry-After", retryAfter.toString());
      (res as any).status(429).json({
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many callback attempts. Please try again later",
          severity: "warning",
          timestamp: new Date().toISOString(),
          details: {
            retryAfter,
          },
          suggestion: `Please wait ${retryAfter} seconds before retrying`,
        },
      });
    }
  },
};

/**
 * Cleanup rate limiter on shutdown
 */
export function cleanupRateLimiter(): void {
  rateLimitStore.destroy();
}
