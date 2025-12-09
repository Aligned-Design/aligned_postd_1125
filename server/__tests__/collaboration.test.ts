/**
 * Collaboration Integration Tests
 * 
 * Tests for multi-agent collaboration endpoints:
 * - /api/orchestration/pipeline/execute
 * - /api/ai/sync
 */

import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
// TODO: Update to use index-v2.ts once test dependencies are fixed
// See docs/TEST_DEBT.md for details
import { createServer } from "../index-v2";

// SKIPPED: Routes /api/orchestration/pipeline/execute and /api/ai/sync not registered in index-v2.ts
// TODO: Register orchestration routes in server/index-v2.ts then remove skip
// Blocker: Routes return 404 - not implemented in current server
describe.skip("Collaboration Integration", () => {
  let app: ReturnType<typeof createServer>;
  let authToken: string;

  beforeEach(() => {
    app = createServer();
    // Mock auth token (in real tests, would use actual auth)
    authToken = "mock-auth-token";
  });

  describe("POST /api/orchestration/pipeline/execute", () => {
    it("should execute a full collaboration pipeline cycle", async () => {
      const response = await request(app)
        .post("/api/orchestration/pipeline/execute")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          brandId: "test-brand-id",
          context: {},
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("cycle");
      expect(response.body.cycle).toHaveProperty("cycleId");
      expect(response.body.cycle).toHaveProperty("status");
      expect(response.body.cycle).toHaveProperty("requestId");
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .post("/api/orchestration/pipeline/execute")
        .send({
          brandId: "test-brand-id",
        });

      expect(response.status).toBe(401);
    });

    it("should require brandId", async () => {
      const response = await request(app)
        .post("/api/orchestration/pipeline/execute")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("POST /api/ai/sync", () => {
    it("should return collaboration state for a brand", async () => {
      const response = await request(app)
        .post("/api/ai/sync")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          brandId: "test-brand-id",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("brandId");
      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("strategyBrief");
      expect(response.body).toHaveProperty("contentPackage");
      expect(response.body).toHaveProperty("advisorFeedback");
      expect(["planning", "creating", "reviewing", "complete"]).toContain(response.body.status);
    });

    it("should return collaboration state for a specific requestId", async () => {
      const response = await request(app)
        .post("/api/ai/sync")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          brandId: "test-brand-id",
          requestId: "test-request-id",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("requestId", "test-request-id");
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .post("/api/ai/sync")
        .send({
          brandId: "test-brand-id",
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

      expect(response.status).toBe(400);
    });
  });
});

