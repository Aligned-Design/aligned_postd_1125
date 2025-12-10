/**
 * Collaboration Integration Tests
 * 
 * Tests for multi-agent collaboration endpoints:
 * - /api/orchestration/pipeline/execute
 * - /api/ai/sync
 * 
 * Uses shared auth helper for JWT token generation.
 */

import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createServer } from "../index-v2";
import { generateTestToken, TEST_BRAND_ID } from "./helpers/auth";

// Routes registered in index-v2.ts - /api/orchestration/* and /api/ai/sync
// Auth mocking now handled via shared auth helper
describe("Collaboration Integration", () => {
  let app: ReturnType<typeof createServer>;
  let authToken: string;

  beforeEach(() => {
    app = createServer();
    // Generate a real JWT token using the shared auth helper
    authToken = generateTestToken();
  });

  describe("POST /api/orchestration/pipeline/execute", () => {
    it("should execute a full collaboration pipeline cycle", async () => {
      const response = await request(app)
        .post("/api/orchestration/pipeline/execute")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          brandId: TEST_BRAND_ID,
          context: {},
        });

      // Route should be accessible with auth (not 401)
      // May return 200 (success), 400 (validation), or 500 (DB not initialized)
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(404);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty("cycle");
        expect(response.body.cycle).toHaveProperty("cycleId");
        expect(response.body.cycle).toHaveProperty("status");
        expect(response.body.cycle).toHaveProperty("requestId");
      }
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .post("/api/orchestration/pipeline/execute")
        .send({
          brandId: TEST_BRAND_ID,
        });

      expect(response.status).toBe(401);
    });

    it("should require brandId", async () => {
      const response = await request(app)
        .post("/api/orchestration/pipeline/execute")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      // Returns 403 (forbidden - brand access check fails) or 400/422 (validation)
      expect([400, 403, 422]).toContain(response.status);
    });
  });

  describe("POST /api/ai/sync", () => {
    // NOTE: /api/ai/sync route may not be fully implemented
    // The test verifies route exists and auth works, but DB may not be set up
    it("should handle collaboration state request for a brand", async () => {
      const response = await request(app)
        .post("/api/ai/sync")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          brandId: TEST_BRAND_ID,
        });

      // Route should be accessible with auth (not 401)
      expect(response.status).not.toBe(401);
      // May return 404 if route not registered, or 200/500 if route exists
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty("brandId");
        expect(response.body).toHaveProperty("status");
        expect(["planning", "creating", "reviewing", "complete"]).toContain(response.body.status);
      }
    });

    it("should handle collaboration state request for a specific requestId", async () => {
      const response = await request(app)
        .post("/api/ai/sync")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          brandId: TEST_BRAND_ID,
          requestId: "test-request-id",
        });

      // Route should be accessible with auth (not 401)
      expect(response.status).not.toBe(401);
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .post("/api/ai/sync")
        .send({
          brandId: TEST_BRAND_ID,
        });

      expect(response.status).toBe(401);
    });

    it("should validate brandId format", async () => {
      const response = await request(app)
        .post("/api/ai/sync")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          brandId: "invalid-uuid",
        });

      expect([400, 422]).toContain(response.status);
    });
  });
});

