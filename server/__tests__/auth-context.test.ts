import { describe, it, expect } from "vitest";
import {
  extractAuthContext,
  validateAuthContext,
  canAccessBrand,
  hasPermission,
  getSafeAuthContext,
  requireAuthContext,
  UserRole,
  AuthContext,
} from "../lib/auth-context";
import { Request } from "express";

describe("Auth Context", () => {
  describe("extractAuthContext", () => {
    it("should extract user ID from Authorization header with Bearer", () => {
      const req = {
        get: (header: string) => {
          if (header === "Authorization") return "Bearer user_123";
          return null;
        },
        params: {},
        query: {},
      } as unknown as Request;

      const context = extractAuthContext(req);

      expect(context).toBeDefined();
      expect(context?.userId).toBe("user_123");
    });

    it("should extract user ID from Authorization header without Bearer", () => {
      const req = {
        get: (header: string) => {
          if (header === "Authorization") return "user_123";
          return null;
        },
        params: {},
        query: {},
      } as unknown as Request;

      const context = extractAuthContext(req);

      expect(context?.userId).toBe("user_123");
    });

    it("should extract brand ID from params", () => {
      const req = {
        get: (header: string) => {
          if (header === "Authorization") return "Bearer user_123";
          return null;
        },
        params: { brandId: "brand_456" },
        query: {},
      } as unknown as Request;

      const context = extractAuthContext(req);

      expect(context?.brandId).toBe("brand_456");
    });

    it("should extract brand ID from query when not in params", () => {
      const req = {
        get: (header: string) => {
          if (header === "Authorization") return "Bearer user_123";
          return null;
        },
        params: {},
        query: { brandId: "brand_456" },
      } as unknown as Request;

      const context = extractAuthContext(req);

      expect(context?.brandId).toBe("brand_456");
    });

    it("should extract brand ID from X-Brand-ID header", () => {
      const req = {
        get: (header: string) => {
          if (header === "Authorization") return "Bearer user_123";
          if (header === "X-Brand-ID") return "brand_456";
          return null;
        },
        params: {},
        query: {},
      } as unknown as Request;

      const context = extractAuthContext(req);

      expect(context?.brandId).toBe("brand_456");
    });

    it("should extract email from X-User-Email header", () => {
      const req = {
        get: (header: string) => {
          if (header === "Authorization") return "Bearer user_123";
          if (header === "X-User-Email") return "user@example.com";
          return null;
        },
        params: {},
        query: {},
      } as unknown as Request;

      const context = extractAuthContext(req);

      expect(context?.email).toBe("user@example.com");
    });

    it("should extract role from X-User-Role header", () => {
      const req = {
        get: (header: string) => {
          if (header === "Authorization") return "Bearer user_123";
          if (header === "X-User-Role") return UserRole.ADMIN;
          return null;
        },
        params: {},
        query: {},
      } as unknown as Request;

      const context = extractAuthContext(req);

      expect(context?.role).toBe(UserRole.ADMIN);
    });

    it("should return null if no Authorization header", () => {
      const req = {
        get: () => null,
        params: {},
        query: {},
      } as unknown as Request;

      const context = extractAuthContext(req);

      expect(context).toBeNull();
    });

    it("should default to VIEWER role if not specified", () => {
      const req = {
        get: (header: string) => {
          if (header === "Authorization") return "Bearer user_123";
          return null;
        },
        params: {},
        query: {},
      } as unknown as Request;

      const context = extractAuthContext(req);

      expect(context?.role).toBe(UserRole.VIEWER);
    });
  });

  describe("validateAuthContext", () => {
    const context: AuthContext = {
      userId: "user_123",
      email: "user@example.com",
      brandId: "brand_456",
      role: UserRole.EDITOR,
    };

    it("should validate valid context", () => {
      const result = validateAuthContext(context);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should return error if context is null", () => {
      const result = validateAuthContext(null);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should require brand ID when specified", () => {
      const contextNoBrand = { ...context, brandId: undefined };

      const result = validateAuthContext(contextNoBrand, {
        requireBrandId: true,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Brand ID");
    });

    it("should require email when specified", () => {
      const contextNoEmail = { ...context, email: undefined };

      const result = validateAuthContext(contextNoEmail, {
        requireEmail: true,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Email");
    });

    it("should enforce minimum role", () => {
      const result = validateAuthContext(context, {
        minRole: UserRole.ADMIN,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Insufficient permissions");
    });
  });

  describe("canAccessBrand", () => {
    it("should allow owner to access any brand", () => {
      const context: AuthContext = {
        userId: "user_123",
        brandId: "brand_1",
        role: UserRole.OWNER,
      };

      expect(canAccessBrand(context, "brand_2")).toBe(true);
      expect(canAccessBrand(context, "brand_1")).toBe(true);
    });

    it("should allow admin to access any brand", () => {
      const context: AuthContext = {
        userId: "user_123",
        brandId: "brand_1",
        role: UserRole.ADMIN,
      };

      expect(canAccessBrand(context, "brand_2")).toBe(true);
    });

    it("should allow editor to access only their brand", () => {
      const context: AuthContext = {
        userId: "user_123",
        brandId: "brand_1",
        role: UserRole.EDITOR,
      };

      expect(canAccessBrand(context, "brand_1")).toBe(true);
      expect(canAccessBrand(context, "brand_2")).toBe(false);
    });

    it("should deny access when context is null", () => {
      expect(canAccessBrand(null, "brand_1")).toBe(false);
    });
  });

  describe("hasPermission", () => {
    it("should allow role to access with equal or higher permission", () => {
      const adminContext: AuthContext = {
        userId: "user_123",
        role: UserRole.ADMIN,
      };

      expect(hasPermission(adminContext, UserRole.VIEWER)).toBe(true);
      expect(hasPermission(adminContext, UserRole.ADMIN)).toBe(true);
      expect(hasPermission(adminContext, UserRole.OWNER)).toBe(false);
    });

    it("should deny insufficient permissions", () => {
      const viewerContext: AuthContext = {
        userId: "user_123",
        role: UserRole.VIEWER,
      };

      expect(hasPermission(viewerContext, UserRole.EDITOR)).toBe(false);
      expect(hasPermission(viewerContext, UserRole.ADMIN)).toBe(false);
    });

    it("should deny permission when context is null", () => {
      expect(hasPermission(null, UserRole.VIEWER)).toBe(false);
    });
  });

  describe("getSafeAuthContext", () => {
    it("should return safe context without sensitive data", () => {
      const context: AuthContext = {
        userId: "user_123",
        email: "user@example.com",
        brandId: "brand_456",
        role: UserRole.EDITOR,
        sessionId: "session_789",
      };

      const safeContext = getSafeAuthContext(context);

      expect(safeContext?.userId).toBe("user_123");
      expect(safeContext?.brandId).toBe("brand_456");
      expect(safeContext?.role).toBe(UserRole.EDITOR);
      expect(safeContext?.sessionId).toBeUndefined();
    });

    it("should return null when context is null", () => {
      const safeContext = getSafeAuthContext(null);

      expect(safeContext).toBeNull();
    });
  });

  describe("requireAuthContext", () => {
    const context: AuthContext = {
      userId: "user_123",
      brandId: "brand_456",
      role: UserRole.EDITOR,
    };

    it("should succeed with valid context", () => {
      const result = requireAuthContext(context);

      expect(result.success).toBe(true);
      expect(result.context).toEqual(context);
    });

    it("should fail with null context", () => {
      const result = requireAuthContext(null);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should fail when brand ID is required but missing", () => {
      const contextNoBrand = { ...context, brandId: undefined };

      const result = requireAuthContext(contextNoBrand, {
        requireBrandId: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should succeed with brand ID when required", () => {
      const result = requireAuthContext(context, {
        requireBrandId: true,
      });

      expect(result.success).toBe(true);
      expect(result.context?.brandId).toBe("brand_456");
    });
  });
});
