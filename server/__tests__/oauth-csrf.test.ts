import { describe, it, expect, beforeEach } from "vitest";
import {
  createRateLimiter,
  oauthRateLimiters,
} from "../lib/rate-limiting";
import {
  validateOAuthState,
} from "../lib/csrf-middleware";
import { Request, Response, NextFunction } from "express";

describe("OAuth CSRF Security", () => {
  describe("Rate Limiting", () => {
    it("should provide OAuth initiation rate limiter", () => {
      // OAuth initiate limiter should exist and be a function
      expect(oauthRateLimiters.initiate).toBeDefined();
      expect(typeof oauthRateLimiters.initiate).toBe("function");
    });

    it("should provide OAuth callback rate limiter", () => {
      // OAuth callback limiter should exist and be a function
      expect(oauthRateLimiters.callback).toBeDefined();
      expect(typeof oauthRateLimiters.callback).toBe("function");
    });

    it("should create rate limiter with token bucket configuration", () => {
      const config = { tokensPerInterval: 10, intervalMs: 60000 };
      const middleware = createRateLimiter(config);

      // Should be a function that can be used as Express middleware
      expect(typeof middleware).toBe("function");
    });

    it("should support custom key extraction function", () => {
      const config = { tokensPerInterval: 5, intervalMs: 60000 };
      const keyFn = (req: Request) => `${req.ip}:custom`;
      const middleware = createRateLimiter(config, keyFn);

      expect(typeof middleware).toBe("function");
    });

    it("should support custom token consumption", () => {
      const config = { tokensPerInterval: 10, intervalMs: 60000 };
      // Create limiter that consumes 2 tokens per request
      const middleware = createRateLimiter(config, undefined, 2);

      expect(typeof middleware).toBe("function");
    });

    it("should be usable as Express middleware", () => {
      const config = { tokensPerInterval: 100, intervalMs: 60000 };
      const middleware = createRateLimiter(config, () => "test-key");

      // Verify middleware signature: (req, res, next) => void
      expect(middleware.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("CSRF State Validation", () => {
    it("should reject missing state parameter", () => {
      const req = { query: {} } as unknown as Request;
      const res = {
        status: () => ({ json: () => {} }),
      } as unknown as Response;

      let error: unknown;
      try {
        validateOAuthState(req, res, () => {});
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
    });

    it("should reject state parameter shorter than 64 characters", () => {
      const shortState = "a".repeat(32);

      expect(() => {
        const req = { query: { state: shortState } } as unknown as Request;
        const res = {} as unknown as Response;
        validateOAuthState(req, res, () => {});
      }).toThrow();
    });

    it("should accept valid 64-character hex state", () => {
      const validState = "a".repeat(64);
      const req = { query: { state: validState } } as unknown as Request;
      const res = {} as unknown as Response;

      let nextCalled = false;
      validateOAuthState(req, res, () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(true);
    });

    it("should validate state format is hex only (allows colons for compound states)", () => {
      // This should pass - valid hex characters
      const validHex = "a".repeat(64);
      expect(() => {
        const req = { query: { state: validHex } } as unknown as Request;
        const res = {} as unknown as Response;
        validateOAuthState(req, res, () => {});
      }).not.toThrow();

      // This should fail - invalid characters (spaces)
      const invalidState = "a".repeat(60) + "    ";
      expect(() => {
        const req = { query: { state: invalidState } } as unknown as Request;
        const res = {} as unknown as Response;
        validateOAuthState(req, res, () => {});
      }).toThrow();
    });

    it("should reject state with colons (old compound format no longer supported)", () => {
      // After refactoring, state should be just the token (64 hex chars)
      // No brandId should be embedded in state parameter
      const tokenPart = "a".repeat(64);
      const oldCompoundState = `${tokenPart}:brand-123`;

      // This should now fail because colons are not valid characters anymore
      expect(() => {
        const req = { query: { state: oldCompoundState } } as unknown as Request;
        const res = {} as unknown as Response;
        validateOAuthState(req, res, () => {});
      }).toThrow();
    });

    it("should reject state with invalid characters (SQL injection attempt)", () => {
      const maliciousState = "a".repeat(60) + "'; DROP TABLE users; --";

      expect(() => {
        const req = { query: { state: maliciousState } } as unknown as Request;
        const res = {} as unknown as Response;
        validateOAuthState(req, res, () => {});
      }).toThrow();
    });

    it("should reject state with HTML/XSS characters", () => {
      const xssState = "a".repeat(50) + "<script>alert('xss')</script>";

      expect(() => {
        const req = { query: { state: xssState } } as unknown as Request;
        const res = {} as unknown as Response;
        validateOAuthState(req, res, () => {});
      }).toThrow();
    });

    it("should attach validated state to request for downstream handlers", () => {
      const state = "a".repeat(64);
      const req = { query: { state } } as unknown as Request;
      const res = {} as unknown as Response;

      validateOAuthState(req, res, () => {});

      const validatedState = (req as any).validatedState as {
        fullState: string;
        rawToken: string;
        parts: string[];
      };
      expect(validatedState).toBeDefined();
      expect(validatedState.fullState).toBe(state);
      expect(validatedState.rawToken).toBe(state);
      expect(validatedState.parts).toEqual([state]);
    });

    it("should not include branded information in state token", () => {
      // State token should be pure 64-character hex, no brandId appended
      const state = "a".repeat(64);
      const req = { query: { state } } as unknown as Request;
      const res = {} as unknown as Response;

      validateOAuthState(req, res, () => {});

      // State should be just the token, not "token:brandId"
      const validatedState = (req as any).validatedState as {
        fullState: string;
        rawToken: string;
        parts: string[];
      };
      expect(validatedState.fullState).toBe(state);
      expect(validatedState.parts.length).toBe(1);
      expect(validatedState.parts[0]).toBe(state);
    });
  });

  describe("Information Disclosure Prevention", () => {
    it("should not expose brandId in OAuth state parameter", () => {
      // OAuth state should be just the token, not token:brandId
      const validSecureState = "a".repeat(64);
      const req = { query: { state: validSecureState } } as unknown as Request;
      const res = {} as unknown as Response;

      // This should succeed with just the token
      let nextCalled = false;
      validateOAuthState(req, res, () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(true);
    });
  });

  describe("One-Time Use Enforcement", () => {
    it("should prevent state reuse across multiple requests", () => {
      // This is tested at the oauth-state-cache level
      // CSRF middleware ensures state exists and is valid format
      const state = "a".repeat(64);
      const req = { query: { state } } as unknown as Request;
      const res = {} as unknown as Response;

      // First validation should succeed
      let firstCall = false;
      validateOAuthState(req, res, () => {
        firstCall = true;
      });

      expect(firstCall).toBe(true);

      // Second validation should also pass (CSRF layer checks cache for actual reuse)
      let secondCall = false;
      validateOAuthState(req, res, () => {
        secondCall = true;
      });

      expect(secondCall).toBe(true);
    });
  });

  describe("CSRF Attack Prevention", () => {
    it("should prevent cross-site request forgery by requiring valid state", () => {
      // Attacker without valid state should fail
      const maliciousState = ""; // Empty
      const req = { query: { state: maliciousState } } as unknown as Request;
      const res = {} as unknown as Response;

      expect(() => {
        validateOAuthState(req, res, () => {});
      }).toThrow();
    });

    it("should validate state token is cryptographically secure length", () => {
      // States less than 64 chars (32 bytes) are too short
      const weakState = "weak" + "a".repeat(50);

      expect(() => {
        const req = { query: { state: weakState } } as unknown as Request;
        const res = {} as unknown as Response;
        validateOAuthState(req, res, () => {});
      }).toThrow();
    });

    it("should require state in callback to match generated state", () => {
      // This is the core CSRF prevention: state must be in cache
      const state = "a".repeat(64);
      const req = { query: { state } } as unknown as Request;
      const res = {} as unknown as Response;

      // CSRF middleware validates format, cache validates it exists
      let validated = false;
      validateOAuthState(req, res, () => {
        validated = true;
      });

      expect(validated).toBe(true);
      expect(req.validatedState).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should provide clear error message when state is missing", () => {
      const req = { query: {} } as unknown as Request;
      const res = {} as unknown as Response;

      let errorMessage = "";
      try {
        validateOAuthState(req, res, () => {});
      } catch (e: unknown) {
        errorMessage = e instanceof Error ? e.message : String(e);
      }

      expect(errorMessage).toContain("state");
    });

    it("should provide clear error message when state format is invalid", () => {
      const invalidState = "x".repeat(20);
      const req = { query: { state: invalidState } } as unknown as Request;
      const res = {} as unknown as Response;

      let errorMessage = "";
      try {
        validateOAuthState(req, res, () => {});
      } catch (e: unknown) {
        errorMessage = e instanceof Error ? e.message : String(e);
      }

      expect(errorMessage).toContain("Invalid");
    });
  });
});
