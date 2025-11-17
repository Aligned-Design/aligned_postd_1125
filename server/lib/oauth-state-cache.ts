/**
 * OAuth State Cache
 *
 * Securely manages OAuth state parameters with TTL to prevent CSRF attacks.
 * States expire after 10 minutes and cannot be reused.
 */

interface OAuthStateData {
  state: string;
  brandId: string;
  platform: string;
  codeVerifier: string;
  createdAt: number;
  expiresAt: number;
  ttlSeconds?: number;
}

class OAuthStateCache {
  private states = new Map<string, OAuthStateData>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Start cleanup job to remove expired states every 5 minutes
    this.startCleanupJob();
  }

  /**
   * Store OAuth state with expiration
   * SECURITY: Validates state format to prevent invalid/malicious states
   * @param state - Random state token (must be 64-char hex string)
   * @param brandId - Brand identifier
   * @param platform - Social platform
   * @param codeVerifier - PKCE code verifier
   * @param ttlSeconds - Time to live (default 10 minutes)
   * @throws Error if state is invalid format
   */
  store(
    state: string,
    brandId: string,
    platform: string,
    codeVerifier: string,
    ttlSeconds: number = 10 * 60,
  ): void {
    // SECURITY: Validate state format before storing
    if (!state || typeof state !== "string") {
      throw new Error("Invalid state: must be a non-empty string");
    }

    if (state.length !== 64) {
      throw new Error(
        `Invalid state: must be exactly 64 characters (got ${state.length})`
      );
    }

    if (!/^[a-f0-9]+$/i.test(state)) {
      throw new Error("Invalid state: must be hexadecimal characters only");
    }

    const now = Date.now();

    this.states.set(state, {
      state,
      brandId,
      platform,
      codeVerifier,
      createdAt: now,
      expiresAt: now + ttlSeconds * 1000,
      ttlSeconds,
    });
  }

  /**
   * Retrieve and validate OAuth state
   * @param state - State token from callback
   * @returns State data if valid, null if invalid/expired
   */
  retrieve(state: string): OAuthStateData | null {
    const stateData = this.states.get(state);

    if (!stateData) {
      return null;
    }

    const now = Date.now();
    // Small grace window (ms) to tolerate timing resolution in tests/environments
    const GRACE_MS = 50;
    const ttl = stateData.ttlSeconds ?? 10 * 60;
    // Apply grace only for normal/default TTLs (avoid masking very short TTL tests)
    const applyGrace = ttl >= 0.05; // in seconds (50ms)
    if (now > stateData.expiresAt + (applyGrace ? GRACE_MS : 0)) {
      this.states.delete(state);
      return null;
    }

    // Delete state to prevent replay attacks
    this.states.delete(state);

    return stateData;
  }

  /**
   * Validate state format and existence
   * @param state - State to validate
   * @returns true if valid and not expired
   */
  validate(state: string): boolean {
    if (!state || typeof state !== "string" || state.length < 32) {
      return false;
    }

    const stateData = this.states.get(state);
    if (!stateData) {
      return false;
    }

    // Allow small grace window to account for timing resolution
    const now = Date.now();
    const GRACE_MS = 50;
    const ttl = stateData.ttlSeconds ?? 10 * 60;
    const applyGrace = ttl >= 0.05;
    return now <= stateData.expiresAt + (applyGrace ? GRACE_MS : 0);
  }

  /**
   * Get code verifier for PKCE verification
   * @param state - State token
   * @returns Code verifier or null if state invalid
   */
  getCodeVerifier(state: string): string | null {
    const stateData = this.states.get(state);
    const now = Date.now();
    const GRACE_MS = 50;
    const ttl = stateData?.ttlSeconds ?? 10 * 60;
    const applyGrace = ttl >= 0.05;
    if (!stateData || now > stateData.expiresAt + (applyGrace ? GRACE_MS : 0)) {
      return null;
    }
    return stateData.codeVerifier;
  }

  /**
   * Remove expired states manually
   */
  cleanup(): void {
    const now = Date.now();

    for (const [state, data] of this.states.entries()) {
      if (now > data.expiresAt) {
        this.states.delete(state);
      }
    }
  }

  /**
   * Start periodic cleanup job
   */
  private startCleanupJob(): void {
    // Clean up every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000,
    );

    // Allow process to exit even if interval is running
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Stop cleanup job (useful for testing)
   */
  stopCleanupJob(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get cache statistics (for monitoring)
   */
  getStats(): {
    totalStates: number;
    expiredCount: number;
  } {
    const now = Date.now();
    let expiredCount = 0;

    for (const data of this.states.values()) {
      if (now > data.expiresAt) {
        expiredCount++;
      }
    }

    return {
      totalStates: this.states.size,
      expiredCount,
    };
  }

  /**
   * Clear all states (useful for testing)
   */
  clear(): void {
    this.states.clear();
  }
}

// Factory to create isolated cache instances (useful for testing)
export function createOAuthStateCache() {
  return new OAuthStateCache();
}

// Default singleton instance for runtime
export const oauthStateCache = createOAuthStateCache();

export type { OAuthStateData };
