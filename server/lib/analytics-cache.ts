/**
 * Analytics Cache Service
 * 
 * Provides in-memory caching for expensive analytics queries to improve performance.
 * Cache TTL: 5 minutes for summary metrics, 15 minutes for insights/forecasts
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class AnalyticsCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly INSIGHTS_TTL_MS = 15 * 60 * 1000; // 15 minutes

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache entry with TTL
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    const ttl = ttlMs || this.DEFAULT_TTL_MS;
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Set cache entry for insights/forecasts (longer TTL)
   */
  setInsights<T>(key: string, data: T): void {
    this.set(key, data, this.INSIGHTS_TTL_MS);
  }

  /**
   * Get cached insights (same as get, but for clarity)
   */
  getInsights<T>(key: string): T | null {
    return this.get<T>(key);
  }

  /**
   * Invalidate cache for a brand (clear all related keys)
   */
  invalidateBrand(brandId: string): void {
    const keysToDelete: string[] = [];
    Array.from(this.cache.keys()).forEach((key) => {
      if (key.includes(brandId)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired entries (should be called periodically)
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Generate cache key for analytics queries
   */
  static key(prefix: string, brandId: string, ...params: (string | number)[]): string {
    return `${prefix}:${brandId}:${params.join(":")}`;
  }
}

// Export the class for static method access
export { AnalyticsCache };

export const analyticsCache = new AnalyticsCache();

// Cleanup expired entries every 10 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    analyticsCache.cleanup();
  }, 10 * 60 * 1000);
}

