/**
 * Tests for Restored Endpoints
 * 
 * Verifies that endpoints identified in reality check are:
 * 1. Registered in the server
 * 2. Respond with non-404 status
 * 3. Have proper authentication requirements
 * 
 * These tests prevent regression to broken state.
 */

import { describe, it, expect, beforeAll } from "vitest";
import supertest from "supertest";
import { createServer } from "../index-v2";
import type { Express } from "express";

describe("Restored Endpoints - Reality Check Fixes", () => {
  let app: Express;
  let request: ReturnType<typeof supertest>;

  beforeAll(() => {
    app = createServer();
    request = supertest(app);
  });

  describe("Route Registration", () => {
    it("should have /api/metrics registered (not 404)", async () => {
      const response = await request.get("/api/metrics/ai/snapshot");
      // Should require auth (401) or succeed, but NOT 404
      expect(response.status).not.toBe(404);
    });

    it("should have /api/reports registered (not 404)", async () => {
      const response = await request.get("/api/reports");
      // Should require auth (401) or succeed, but NOT 404
      expect(response.status).not.toBe(404);
    });

    it("should have /api/white-label registered (not 404)", async () => {
      const response = await request.get("/api/white-label/config");
      // Should require auth (401) or succeed, but NOT 404
      expect(response.status).not.toBe(404);
    });

    it("should have /api/trial registered (not 404)", async () => {
      const response = await request.get("/api/trial/status");
      // Should require auth (401) or succeed, but NOT 404
      expect(response.status).not.toBe(404);
    });

    it("should have /api/client-portal registered (not 404)", async () => {
      const response = await request.get("/api/client-portal/dashboard");
      // Should require auth (401) or succeed, but NOT 404
      expect(response.status).not.toBe(404);
    });

    it("should have /api/publishing registered (not 404)", async () => {
      const response = await request.get("/api/publishing/jobs");
      // Should require auth (401) or succeed, but NOT 404
      expect(response.status).not.toBe(404);
    });

    it("should have /api/integrations registered (not 404)", async () => {
      const response = await request.get("/api/integrations");
      // Should require auth (401) or succeed, but NOT 404
      expect(response.status).not.toBe(404);
    });

    it("should have /api/ai-rewrite registered (not 404)", async () => {
      const response = await request.post("/api/ai-rewrite").send({});
      // Should require auth (401) or validation error (400), but NOT 404
      expect(response.status).not.toBe(404);
    });
  });

  describe("Authentication Requirements", () => {
    it("/api/metrics should require authentication", async () => {
      const response = await request.get("/api/metrics/ai/snapshot");
      // Without auth, should get 401 (not 404 or 200)
      expect([401, 403]).toContain(response.status);
    });

    it("/api/reports should require authentication", async () => {
      const response = await request.get("/api/reports");
      expect([401, 403]).toContain(response.status);
    });

    it("/api/white-label should require authentication", async () => {
      const response = await request.get("/api/white-label/config");
      expect([401, 403]).toContain(response.status);
    });

    it("/api/ai-rewrite should require authentication", async () => {
      const response = await request.post("/api/ai-rewrite").send({
        content: "Test content",
        platform: "instagram",
        brandId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect([401, 403]).toContain(response.status);
    });
  });
});

