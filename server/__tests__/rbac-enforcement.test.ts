/**
 * Integration tests for RBAC enforcement via requireScope middleware
 * Tests that permission checks work correctly at the API layer
 */

import { describe, it, expect, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import {
  requireScope,
  requireAllScopes,
  roleHasScope,
} from "../middleware/requireScope";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";

describe("requireScope Middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;
  let error: any;

  beforeEach(() => {
    next = jest.fn();
    res = {};
    error = null;

    // Setup standard request with user
    req = {
      user: {
        id: "user-123",
        role: "BRAND_MANAGER",
      },
    } as any;
  });

  describe("Single Scope Checks", () => {
    it("should allow user with required scope", (done) => {
      const middleware = requireScope("content:create");

      middleware(req as Request, res as Response, (err) => {
        expect(err).toBeUndefined();
        expect(next).not.toHaveBeenCalled();
        done();
      });

      if (next.mock.calls.length === 0) {
        // If next was called in middleware, exit test
        expect(next).toHaveBeenCalled();
        done();
      }
    });

    it("should deny user without required scope", (done) => {
      req.user = { id: "user-123", role: "VIEWER" };
      const middleware = requireScope("content:create");

      middleware(req as Request, res as Response, (err) => {
        if (err) {
          expect(err).toBeInstanceOf(AppError);
          expect(err.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
          expect(err.code).toBe(ErrorCode.FORBIDDEN);
          done();
        }
      });
    });

    it("should allow SUPERADMIN regardless of scope", (done) => {
      req.user = { id: "user-123", role: "SUPERADMIN" };
      const middleware = requireScope("billing:manage"); // SUPERADMIN doesn't have this explicitly

      middleware(req as Request, res as Response, (err) => {
        expect(err).toBeUndefined();
        done();
      });
    });

    it("should deny unauthenticated user", (done) => {
      req.user = null;
      const middleware = requireScope("content:view");

      middleware(req as Request, res as Response, (err) => {
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
        done();
      });
    });

    it("should allow multiple scopes (user needs at least one)", (done) => {
      // BRAND_MANAGER has both content:create and content:edit
      const middleware = requireScope(["content:create", "content:manage"]);

      middleware(req as Request, res as Response, (err) => {
        expect(err).toBeUndefined();
        done();
      });
    });
  });

  describe("All Scopes Check", () => {
    it("should allow user with all required scopes", (done) => {
      req.user = { id: "user-123", role: "AGENCY_ADMIN" };
      const middleware = requireAllScopes([
        "content:create",
        "user:invite",
        "billing:manage",
      ]);

      middleware(req as Request, res as Response, (err) => {
        expect(err).toBeUndefined();
        done();
      });
    });

    it("should deny user missing any required scope", (done) => {
      req.user = { id: "user-123", role: "BRAND_MANAGER" };
      const middleware = requireAllScopes(["content:create", "billing:manage"]); // BRAND_MANAGER doesn't have billing:manage

      middleware(req as Request, res as Response, (err) => {
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
        done();
      });
    });

    it("should allow SUPERADMIN for all scope combinations", (done) => {
      req.user = { id: "user-123", role: "SUPERADMIN" };
      const middleware = requireAllScopes(["anything:here", "any:scope"]);

      middleware(req as Request, res as Response, (err) => {
        expect(err).toBeUndefined();
        done();
      });
    });
  });

  describe("Role-Based Scenarios", () => {
    it("CREATOR should be able to create and edit content but not approve", (done) => {
      req.user = { id: "user-123", role: "CREATOR" };

      // Check each scope
      const checks = [
        { scope: "content:create", shouldPass: true },
        { scope: "content:edit", shouldPass: true },
        { scope: "content:approve", shouldPass: false },
        { scope: "publish:now", shouldPass: false },
      ];

      let completed = 0;

      checks.forEach((check) => {
        const middleware = requireScope(check.scope);
        const testNext = jest.fn();

        middleware(req as Request, res as Response, (err) => {
          if (check.shouldPass) {
            expect(err).toBeUndefined();
          } else {
            expect(err).toBeInstanceOf(AppError);
            expect(err.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
          }

          completed++;
          if (completed === checks.length) {
            done();
          }
        });
      });
    });

    it("CLIENT_APPROVER should approve content but not create", (done) => {
      req.user = { id: "user-123", role: "CLIENT_APPROVER" };

      const createMiddleware = requireScope("content:create");
      const approveMiddleware = requireScope("content:approve");

      let testsPassed = 0;

      // Should NOT have create
      createMiddleware(req as Request, res as Response, (err) => {
        expect(err).toBeInstanceOf(AppError);
        testsPassed++;
        if (testsPassed === 2) done();
      });

      // Should have approve
      approveMiddleware(req as Request, res as Response, (err) => {
        expect(err).toBeUndefined();
        testsPassed++;
        if (testsPassed === 2) done();
      });
    });

    it("ANALYST should view analytics but not create content", (done) => {
      req.user = { id: "user-123", role: "ANALYST" };

      const analyticsMiddleware = requireScope("analytics:read");
      const createMiddleware = requireScope("content:create");

      let testsPassed = 0;

      // Should have analytics:read
      analyticsMiddleware(req as Request, res as Response, (err) => {
        expect(err).toBeUndefined();
        testsPassed++;
        if (testsPassed === 2) done();
      });

      // Should NOT have content:create
      createMiddleware(req as Request, res as Response, (err) => {
        expect(err).toBeInstanceOf(AppError);
        testsPassed++;
        if (testsPassed === 2) done();
      });
    });
  });

  describe("Error Messages", () => {
    it("should include helpful error details", (done) => {
      req.user = { id: "user-123", role: "VIEWER" };
      const middleware = requireScope("content:approve");

      middleware(req as Request, res as Response, (err) => {
        expect(err).toBeInstanceOf(AppError);
        expect(err.message).toContain("Insufficient permissions");
        expect(err.details.userRole).toBe("VIEWER");
        expect(err.details.requiredScopes).toContain("content:approve");
        done();
      });
    });
  });
});

describe("roleHasScope Helper", () => {
  it("should correctly identify scopes for roles", () => {
    expect(roleHasScope("BRAND_MANAGER", "content:create")).toBe(true);
    expect(roleHasScope("BRAND_MANAGER", "billing:manage")).toBe(false);
    expect(roleHasScope("AGENCY_ADMIN", "billing:manage")).toBe(true);
    expect(roleHasScope("SUPERADMIN", "anything:here")).toBe(true);
  });

  it("should return false for unknown roles", () => {
    expect(roleHasScope("UNKNOWN_ROLE", "content:view")).toBe(false);
  });
});
