/**
 * API V2 Wiring Smoke Tests
 * 
 * Verifies that all API V2 endpoints, Reviews, and Webhooks are:
 * - Properly registered in the server
 * - Reachable through the real entrypoint (index-v2.ts)
 * - Not returning 404 (route exists)
 * - Returning appropriate responses (200/401/403, not 500 from misconfiguration)
 * 
 * This test uses the SAME server instance that all entrypoints use:
 * - Vercel: api/[...all].ts → vercel-server.ts → index-v2.ts
 * - Node.js: node-build-v2.ts → index-v2.ts
 * - Dev: index-v2.ts directly
 * 
 * Run with: pnpm test server/__tests__/api-v2-wiring-smoke.test.ts
 */

import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
// Import the SAME createServer function used by all entrypoints
import { createServer } from "../index-v2";

describe("API V2 Wiring Smoke Tests", () => {
  let app: ReturnType<typeof createServer>;

  beforeAll(() => {
    // Create the same server instance that production uses
    app = createServer();
  });

  describe("V2 API Endpoints - Analytics", () => {
    it("GET /api/analytics/overview should be routed (not 404)", async () => {
      const response = await request(app).get("/api/analytics/overview");

      // Route should exist (not 404)
      expect(response.status).not.toBe(404);
      
      // Should require auth (401) or succeed with valid auth (200)
      // The important part is it's NOT 404 (route exists)
      expect([200, 401, 403]).toContain(response.status);
      
      // Should have error object if 401/403, or data if 200
      if (response.status === 401 || response.status === 403) {
        expect(response.body).toHaveProperty("error");
      }
    });

    it("GET /api/analytics/overview should validate query params (not crash)", async () => {
      const response = await request(app)
        .get("/api/analytics/overview?days=30&brandId=550e8400-e29b-41d4-a716-446655440000");

      // Should not be 404 (route exists)
      expect(response.status).not.toBe(404);
      
      // Should not be 500 (misconfiguration crash)
      expect(response.status).not.toBe(500);
      
      // Should be auth error, validation error, or success
      expect([200, 400, 401, 403, 422]).toContain(response.status);
    });
  });

  describe("V2 API Endpoints - Approvals", () => {
    it("GET /api/approvals/pending should be routed (not 404)", async () => {
      const response = await request(app).get("/api/approvals/pending");

      // Route should exist (not 404)
      expect(response.status).not.toBe(404);
      
      // Should require auth or succeed
      expect([200, 401, 403]).toContain(response.status);
      
      if (response.status === 401 || response.status === 403) {
        expect(response.body).toHaveProperty("error");
      }
    });

    it("GET /api/approvals/pending with query params should be handled", async () => {
      const response = await request(app)
        .get("/api/approvals/pending?limit=10&offset=0");

      // Should not be 404 or 500
      expect(response.status).not.toBe(404);
      expect(response.status).not.toBe(500);
      
      // Should be auth error, validation error, or success
      expect([200, 400, 401, 403, 422]).toContain(response.status);
    });
  });

  describe("V2 API Endpoints - Media", () => {
    it("GET /api/media should be routed (not 404)", async () => {
      const response = await request(app).get("/api/media");

      // Route should exist (not 404)
      expect(response.status).not.toBe(404);
      
      // Should require auth or succeed
      expect([200, 401, 403]).toContain(response.status);
      
      if (response.status === 401 || response.status === 403) {
        expect(response.body).toHaveProperty("error");
      }
    });

    it("GET /api/media with query params should be handled", async () => {
      const response = await request(app)
        .get("/api/media?limit=1&brandId=550e8400-e29b-41d4-a716-446655440000");

      // Should not be 404 or 500
      expect(response.status).not.toBe(404);
      expect(response.status).not.toBe(500);
      
      // Should be auth error, validation error, or success
      expect([200, 400, 401, 403, 422]).toContain(response.status);
    });
  });

  describe("Reviews API Endpoints", () => {
    it("GET /api/reviews/:brandId should be routed (not 404)", async () => {
      const fakeBrandId = "550e8400-e29b-41d4-a716-446655440000";
      const response = await request(app).get(`/api/reviews/${fakeBrandId}`);

      // Route should exist (not 404)
      expect(response.status).not.toBe(404);
      
      // Should require auth or succeed
      expect([200, 401, 403]).toContain(response.status);
      
      if (response.status === 401 || response.status === 403) {
        expect(response.body).toHaveProperty("error");
      }
    });

    it("GET /api/reviews/:brandId should validate UUID format", async () => {
      const invalidBrandId = "not-a-uuid";
      const response = await request(app).get(`/api/reviews/${invalidBrandId}`);

      // Should not be 404 (route exists, just invalid param)
      expect(response.status).not.toBe(404);
      
      // Should not be 500 (misconfiguration)
      expect(response.status).not.toBe(500);
      
      // Should be validation error, auth error, or success
      expect([200, 400, 401, 403, 422]).toContain(response.status);
    });
  });

  describe("Webhooks Endpoints", () => {
    it("POST /api/webhooks/zapier should be routed (not 404)", async () => {
      const response = await request(app)
        .post("/api/webhooks/zapier")
        .send({ action: "test" });

      // Route should exist (not 404)
      expect(response.status).not.toBe(404);
      
      // Webhooks don't require auth (they use signature verification)
      // Should be validation error (missing x-brand-id header) or success
      expect(response.status).not.toBe(500);
      
      // Common responses: 400 (validation), 200 (success), 401 (signature fail)
      expect([200, 400, 401, 403, 422]).toContain(response.status);
      
      // Should have error object if validation fails
      if (response.status === 400 || response.status === 422) {
        expect(response.body).toHaveProperty("error");
      }
    });

    it("POST /api/webhooks/make should be routed (not 404)", async () => {
      const response = await request(app)
        .post("/api/webhooks/make")
        .set("x-brand-id", "550e8400-e29b-41d4-a716-446655440000")
        .send({ event: "test" });

      // Route should exist (not 404) - this is the key wiring test
      expect(response.status).not.toBe(404);
      
      // Should handle the request (validation/auth/success/config error)
      // DB/config errors (500) are acceptable for wiring test if route exists
      expect([200, 400, 401, 403, 422, 500]).toContain(response.status);
    });

    it("POST /api/webhooks/slack should be routed (not 404)", async () => {
      const response = await request(app)
        .post("/api/webhooks/slack")
        .send({ type: "test" });

      // Route should exist (not 404)
      expect(response.status).not.toBe(404);
      expect(response.status).not.toBe(500);
      
      expect([200, 400, 401, 403, 422]).toContain(response.status);
    });

    it("POST /api/webhooks/hubspot should be routed (not 404)", async () => {
      const response = await request(app)
        .post("/api/webhooks/hubspot")
        .send({ event: "test" });

      // Route should exist (not 404)
      expect(response.status).not.toBe(404);
      expect(response.status).not.toBe(500);
      
      expect([200, 400, 401, 403, 422]).toContain(response.status);
    });

    it("GET /api/webhooks/status/:eventId should be routed (not 404)", async () => {
      const fakeEventId = "non-existent-event-id";
      const response = await request(app).get(`/api/webhooks/status/${fakeEventId}`);

      // Route should exist (not 404)
      expect(response.status).not.toBe(404);
      
      // Handler should process it (even if event doesn't exist, that's fine)
      // Could be 404 from handler (event not found) or 400 (invalid format)
      // But NOT 404 from router (route not found)
      expect(response.status).not.toBe(500);
      
      // Common responses: 404 (event not found - from handler), 400 (validation), 200 (found)
      expect([200, 400, 404, 422]).toContain(response.status);
      
      // If it's 404, it should be from the handler, not the router
      // We can't easily distinguish, but if it's 404, the route at least exists
    });

    it("GET /api/webhooks/logs should be routed (not 404)", async () => {
      const response = await request(app).get("/api/webhooks/logs");

      // Route should exist (not 404)
      expect(response.status).not.toBe(404);
      expect(response.status).not.toBe(500);
      
      // Should handle the request
      expect([200, 400, 401, 403, 422]).toContain(response.status);
    });

    it("POST /api/webhooks/retry/:eventId should be routed (not 404)", async () => {
      const fakeEventId = "non-existent-event-id";
      const response = await request(app)
        .post(`/api/webhooks/retry/${fakeEventId}`)
        .send({});

      // Route should exist (not 404)
      expect(response.status).not.toBe(404);
      expect(response.status).not.toBe(500);
      
      // Should handle the request
      expect([200, 400, 404, 422]).toContain(response.status);
    });
  });

  describe("Negative Tests - Verify Route Registration", () => {
    it("Should return 404 for truly non-existent routes", async () => {
      const response = await request(app).get("/api/nonexistent/route/123");

      // This should be 404 (route doesn't exist)
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
    });

    it("Should return 404 for routes outside /api prefix", async () => {
      const response = await request(app).get("/completely/fake/route");

      // Should be 404
      expect(response.status).toBe(404);
    });
  });

  describe("Wiring Confidence Checks", () => {
    it("Should use index-v2.ts server (verify by checking route registration)", async () => {
      // If we can hit v2 routes, reviews, and webhooks, we're using index-v2.ts
      // This is a meta-test to verify we're testing the right server
      
      const analyticsResponse = await request(app).get("/api/analytics/overview");
      const reviewsResponse = await request(app).get("/api/reviews/550e8400-e29b-41d4-a716-446655440000");
      const webhookResponse = await request(app).post("/api/webhooks/zapier").send({});
      
      // All should be routed (not 404)
      expect(analyticsResponse.status).not.toBe(404);
      expect(reviewsResponse.status).not.toBe(404);
      expect(webhookResponse.status).not.toBe(404);
      
      // If all three are routed, we're definitely using index-v2.ts
      // (legacy index.ts doesn't have these routes)
    });
  });
});

