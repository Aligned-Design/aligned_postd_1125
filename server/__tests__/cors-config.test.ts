import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getCorsConfig, getAllowedOrigins, validateCorsConfig } from "../lib/cors-config";

describe("CORS Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getCorsConfig", () => {
    it("should return CORS config with proper structure in development", () => {
      process.env.NODE_ENV = "development";
      const config = getCorsConfig();

      expect(config).toBeDefined();
      expect(config.credentials).toBe(true);
      expect(config.methods).toContain("GET");
      expect(config.methods).toContain("POST");
      expect(config.methods).toContain("PUT");
      expect(config.methods).toContain("DELETE");
      expect(config.methods).toContain("PATCH");
      expect(config.methods).toContain("OPTIONS");
      expect(config.maxAge).toBe(86400);
    });

    it("should allow localhost in development", () => {
      return new Promise<void>((resolve) => {
        process.env.NODE_ENV = "development";
        const config = getCorsConfig();

        if (typeof config.origin === "function") {
          config.origin("http://localhost:3000", (err, allow) => {
            expect(err).toBeNull();
            expect(allow).toBe(true);
            resolve();
          });
        }
      });
    });

    it("should allow 127.0.0.1 in development", () => {
      return new Promise<void>((resolve) => {
        process.env.NODE_ENV = "development";
        const config = getCorsConfig();

        if (typeof config.origin === "function") {
          config.origin("http://127.0.0.1:3000", (err, allow) => {
            expect(err).toBeNull();
            expect(allow).toBe(true);
            resolve();
          });
        }
      });
    });

    it("should allow requests with no origin in development", () => {
      return new Promise<void>((resolve) => {
        process.env.NODE_ENV = "development";
        const config = getCorsConfig();

        if (typeof config.origin === "function") {
          config.origin(undefined, (err, allow) => {
            expect(err).toBeNull();
            expect(allow).toBe(true);
            resolve();
          });
        }
      });
    });

    it("should allow configured origins in development", () => {
      return new Promise<void>((resolve) => {
        process.env.NODE_ENV = "development";
        process.env.ALLOWED_ORIGINS = "https://example.com,https://app.example.com";
        const config = getCorsConfig();

        if (typeof config.origin === "function") {
          config.origin("https://example.com", (err, allow) => {
            expect(err).toBeNull();
            expect(allow).toBe(true);
            resolve();
          });
        }
      });
    });

    it("should include proper allowed headers", () => {
      process.env.NODE_ENV = "development";
      const config = getCorsConfig();

      expect(config.allowedHeaders).toContain("Authorization");
      expect(config.allowedHeaders).toContain("Content-Type");
      expect(config.allowedHeaders).toContain("X-CSRF-Token");
      expect(config.allowedHeaders).toContain("X-API-Key");
    });

    it("should include exposed headers", () => {
      process.env.NODE_ENV = "development";
      const config = getCorsConfig();

      expect(config.exposedHeaders).toContain("Content-Length");
      expect(config.exposedHeaders).toContain("X-Request-ID");
    });

    it("should reject disallowed origins in production", () => {
      return new Promise<void>((resolve) => {
        process.env.NODE_ENV = "production";
        process.env.ALLOWED_ORIGINS = "https://allowed.com";
        const config = getCorsConfig();

        if (typeof config.origin === "function") {
          config.origin("https://malicious.com", (err, allow) => {
            expect(err).toBeDefined();
            expect(err?.message).toBe("Not allowed by CORS");
            resolve();
          });
        }
      });
    });

    it("should allow configured origins in production", () => {
      return new Promise<void>((resolve) => {
        process.env.NODE_ENV = "production";
        process.env.ALLOWED_ORIGINS = "https://allowed.com";
        const config = getCorsConfig();

        if (typeof config.origin === "function") {
          config.origin("https://allowed.com", (err, allow) => {
            expect(err).toBeNull();
            expect(allow).toBe(true);
            resolve();
          });
        }
      });
    });
  });

  describe("getAllowedOrigins", () => {
    it("should return default localhost origins in development", () => {
      process.env.NODE_ENV = "development";
      const origins = getAllowedOrigins();

      expect(origins).toContain("http://localhost:3000");
      expect(origins).toContain("http://localhost:5173");
      expect(origins).toContain("http://localhost:8080");
    });

    it("should include configured origins in development", () => {
      process.env.NODE_ENV = "development";
      process.env.ALLOWED_ORIGINS = "https://example.com";
      const origins = getAllowedOrigins();

      expect(origins).toContain("https://example.com");
    });

    it("should return configured origins in production", () => {
      process.env.NODE_ENV = "production";
      process.env.ALLOWED_ORIGINS = "https://app.com,https://admin.app.com";
      const origins = getAllowedOrigins();

      expect(origins).toContain("https://app.com");
      expect(origins).toContain("https://admin.app.com");
    });

    it("should use FRONTEND_URL if ALLOWED_ORIGINS is not set in production", () => {
      process.env.NODE_ENV = "production";
      delete process.env.ALLOWED_ORIGINS;
      process.env.FRONTEND_URL = "https://frontend.com";
      const origins = getAllowedOrigins();

      expect(origins).toContain("https://frontend.com");
    });

    it("should handle comma-separated origins with whitespace", () => {
      process.env.NODE_ENV = "development";
      process.env.ALLOWED_ORIGINS = "https://example.com , https://another.com , https://third.com";
      const origins = getAllowedOrigins();

      expect(origins).toContain("https://example.com");
      expect(origins).toContain("https://another.com");
      expect(origins).toContain("https://third.com");
    });
  });

  describe("validateCorsConfig", () => {
    it("should return true in development", () => {
      process.env.NODE_ENV = "development";
      const isValid = validateCorsConfig();

      expect(isValid).toBe(true);
    });

    it("should return true in production with origins configured", () => {
      process.env.NODE_ENV = "production";
      process.env.ALLOWED_ORIGINS = "https://example.com";
      const isValid = validateCorsConfig();

      expect(isValid).toBe(true);
    });

    it("should return false in production without origins", () => {
      process.env.NODE_ENV = "production";
      delete process.env.ALLOWED_ORIGINS;
      delete process.env.FRONTEND_URL;

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const isValid = validateCorsConfig();

      expect(isValid).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
