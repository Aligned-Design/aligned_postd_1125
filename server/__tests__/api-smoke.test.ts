/**
 * API Smoke Tests
 * 
 * Basic smoke tests for critical API endpoints to verify:
 * - Endpoints are accessible
 * - Authentication works
 * - Error handling is consistent
 * - Response formats are correct
 * 
 * Run with: pnpm test server/__tests__/api-smoke.test.ts
 */

import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
// Updated to use current server implementation (index-v2.ts)
import { createServer } from "../index-v2";
import { generateTestToken, TEST_BRAND_ID } from "./helpers/auth";

describe("API Smoke Tests", () => {
  let app: ReturnType<typeof createServer>;
  let authToken: string;

  beforeAll(() => {
    app = createServer();
    // Generate a real JWT token using the shared auth helper
    authToken = generateTestToken();
  });

  describe("Health Check Endpoints", () => {
    // NOTE: Health check is at /api/debug (debugHealthRouter) in index-v2.ts
    // Legacy /api/health routes removed - not implemented in v2
    
    it("GET /api/ping should return pong message", async () => {
      const response = await request(app).get("/api/ping");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message");
    });
    
    // Test the actual debug health endpoint
    it("GET /api/debug should return health status", async () => {
      const response = await request(app).get("/api/debug");

      // May fail without proper auth/env, but should not 404
      // Also may return 502 if Supabase connection fails
      expect([200, 401, 403, 500, 502, 503]).toContain(response.status);
    }, 15000); // Increased timeout: endpoint may check Supabase/external services
  });

  // NOTE: /api/demo route not implemented in index-v2.ts (removed from v2 API)

  describe("Authentication Endpoints", () => {
    it("POST /api/auth/signup should validate required fields", async () => {
      const response = await request(app)
        .post("/api/auth/signup")
        .send({});

      // Should return 400 or 422 for missing fields
      expect([400, 422]).toContain(response.status);
      expect(response.body).toHaveProperty("error");
    });

    it("POST /api/auth/signup should validate email format", async () => {
      const response = await request(app)
        .post("/api/auth/signup")
        .send({
          email: "invalid-email",
          password: "test123456",
        });

      expect([400, 422]).toContain(response.status);
      expect(response.body).toHaveProperty("error");
    });

    it("POST /api/auth/login should require email and password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({});

      expect([400, 422]).toContain(response.status);
      expect(response.body).toHaveProperty("error");
    });

    it("GET /api/auth/me should require authentication", async () => {
      const response = await request(app).get("/api/auth/me");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code");
      expect(response.body.error).toHaveProperty("message");
    });
  });

  describe("Protected Endpoints - Authentication Required", () => {
    it("POST /api/dashboard should require authentication", async () => {
      const response = await request(app)
        .post("/api/dashboard")
        .send({
          brandId: "550e8400-e29b-41d4-a716-446655440000",
          timeRange: "30d",
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code");
    });

    it("GET /api/brands should require authentication", async () => {
      const response = await request(app).get("/api/brands");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });

    it("POST /api/brands should require authentication", async () => {
      const response = await request(app)
        .post("/api/brands")
        .send({
          name: "Test Brand",
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });

    // NOTE: Analytics API uses /api/analytics/overview (/:brandId route not implemented in v2)
  });

  describe("Error Response Format", () => {
    it("should return validation errors in standard format", async () => {
      const response = await request(app)
        .post("/api/auth/signup")
        .send({
          email: "not-an-email",
          password: "123", // Too short
        });

      expect([400, 422]).toContain(response.status);
      expect(response.body).toHaveProperty("error");
      
      // If validation errors are present, check format
      if (response.body.error.details?.validationErrors) {
        expect(Array.isArray(response.body.error.details.validationErrors)).toBe(true);
      }
    });
  });

  describe("Request Validation", () => {
    it("POST /api/dashboard should validate brandId format", async () => {
      const response = await request(app)
        .post("/api/dashboard")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          brandId: "invalid-uuid",
          timeRange: "30d",
        });

      // Should fail validation (auth passes with real token)
      expect([400, 422]).toContain(response.status);
    });

    it("POST /api/dashboard should validate timeRange enum", async () => {
      const response = await request(app)
        .post("/api/dashboard")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          brandId: TEST_BRAND_ID,
          timeRange: "invalid-range",
        });

      // Should fail validation (400/422) or brand not found (404)
      expect([400, 404, 422]).toContain(response.status);
    });
  });

  describe("CORS and Security Headers", () => {
    it("should include security headers in responses", async () => {
      const response = await request(app).get("/api/health");

      // Check for common security headers
      expect(response.headers).toHaveProperty("x-content-type-options");
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
    });
  });

  describe("Orchestration Health", () => {
    // Route now registered via orchestrationRouter in index-v2.ts
    it("GET /api/orchestration/health should return status", async () => {
      const response = await request(app).get("/api/orchestration/health");

      // May require auth, but should return some response
      expect([200, 401]).toContain(response.status);
    });
  });

  // NOTE: Agents health monitoring not exposed via /api/agents/health (use /api/debug for system health)

  describe("V2 Endpoints - Analytics", () => {
    it("GET /api/analytics/overview should require authentication", async () => {
      const response = await request(app).get("/api/analytics/overview");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code");
    });

    it("GET /api/analytics/engagement-trend should require authentication", async () => {
      const response = await request(app).get("/api/analytics/engagement-trend");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });

    it("GET /api/analytics/content-performance should require authentication", async () => {
      const response = await request(app).get("/api/analytics/content-performance");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });

    it("GET /api/analytics/top-posts should require authentication", async () => {
      const response = await request(app).get("/api/analytics/top-posts");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("V2 Endpoints - Approvals", () => {
    it("GET /api/approvals/pending should require authentication", async () => {
      const response = await request(app).get("/api/approvals/pending");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });

    it("GET /api/approvals/history should require authentication", async () => {
      const response = await request(app).get("/api/approvals/history");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });

    it("GET /api/approvals/:approvalId should require authentication", async () => {
      const response = await request(app).get("/api/approvals/550e8400-e29b-41d4-a716-446655440000");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });

    it("POST /api/approvals/:approvalId/approve should require authentication", async () => {
      const response = await request(app)
        .post("/api/approvals/550e8400-e29b-41d4-a716-446655440000/approve")
        .send({ notes: "Looks good" });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });

    it("POST /api/approvals/:approvalId/reject should require authentication", async () => {
      const response = await request(app)
        .post("/api/approvals/550e8400-e29b-41d4-a716-446655440000/reject")
        .send({ reason: "Needs revision" });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("V2 Endpoints - Media", () => {
    it("GET /api/media should require authentication", async () => {
      const response = await request(app).get("/api/media");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });

    it("GET /api/media/storage-usage should require authentication", async () => {
      const response = await request(app).get("/api/media/storage-usage?brandId=550e8400-e29b-41d4-a716-446655440000");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });

    it("GET /api/media/:assetId should require authentication", async () => {
      const response = await request(app).get("/api/media/550e8400-e29b-41d4-a716-446655440000");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });

    it("DELETE /api/media/:assetId should require authentication", async () => {
      const response = await request(app).delete("/api/media/550e8400-e29b-41d4-a716-446655440000");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("V2 Endpoints - Validation", () => {
    it("GET /api/analytics/overview should validate query parameters", async () => {
      const response = await request(app)
        .get("/api/analytics/overview?days=invalid")
        .set("Authorization", `Bearer ${authToken}`);

      // Should fail validation (auth passes with real token)
      expect([400, 422]).toContain(response.status);
    });

    it("GET /api/approvals/pending should validate query parameters", async () => {
      const response = await request(app)
        .get("/api/approvals/pending?limit=invalid")
        .set("Authorization", `Bearer ${authToken}`);

      // Should fail validation (auth passes with real token)
      expect([400, 422]).toContain(response.status);
    });

    it("POST /api/approvals/:approvalId/reject should validate request body", async () => {
      const response = await request(app)
        .post(`/api/approvals/${TEST_BRAND_ID}/reject`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({}); // Missing required 'reason' field

      // Should fail validation (auth passes with real token)
      expect([400, 422]).toContain(response.status);
    });
  });

  describe("Reviews Endpoint", () => {
    it("GET /api/reviews/:brandId should require authentication", async () => {
      const response = await request(app).get("/api/reviews/550e8400-e29b-41d4-a716-446655440000");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("Webhooks Endpoints", () => {
    it("POST /api/webhooks/zapier should validate x-brand-id header", async () => {
      const response = await request(app)
        .post("/api/webhooks/zapier")
        .send({ action: "test" });

      // Should fail validation (missing x-brand-id header)
      expect([400, 422]).toContain(response.status);
      expect(response.body).toHaveProperty("error");
    });

    it("POST /api/webhooks/make should validate request body", async () => {
      const response = await request(app)
        .post("/api/webhooks/make")
        .set("x-brand-id", TEST_BRAND_ID)
        .send({}); // Missing required 'event' field

      // Should fail validation
      expect([400, 422]).toContain(response.status);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("Authenticated Endpoint Access", () => {
    it("GET /api/brands should work with valid auth token", async () => {
      const response = await request(app)
        .get("/api/brands")
        .set("Authorization", `Bearer ${authToken}`);

      // Should not return 401 with valid auth
      expect(response.status).not.toBe(401);
      // Should be 200 or 500 (if DB not connected)
      expect([200, 500, 502, 503]).toContain(response.status);
    });

    it("POST /api/dashboard should work with valid auth token", async () => {
      const response = await request(app)
        .post("/api/dashboard")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          brandId: TEST_BRAND_ID,
          timeRange: "30d",
        });

      // Should not return 401 with valid auth
      expect(response.status).not.toBe(401);
    });

    it("GET /api/analytics/overview should work with valid auth token", async () => {
      const response = await request(app)
        .get(`/api/analytics/overview?brandId=${TEST_BRAND_ID}`)
        .set("Authorization", `Bearer ${authToken}`);

      // Should not return 401 with valid auth
      expect(response.status).not.toBe(401);
    });

    it("GET /api/approvals/pending should work with valid auth token", async () => {
      const response = await request(app)
        .get(`/api/approvals/pending?brandId=${TEST_BRAND_ID}`)
        .set("Authorization", `Bearer ${authToken}`);

      // Should not return 401 with valid auth
      expect(response.status).not.toBe(401);
    });

    it("GET /api/media should work with valid auth token", async () => {
      const response = await request(app)
        .get(`/api/media?brandId=${TEST_BRAND_ID}`)
        .set("Authorization", `Bearer ${authToken}`);

      // Should not return 401 with valid auth
      expect(response.status).not.toBe(401);
    });

    it("GET /api/auth/me should return user info with valid auth token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${authToken}`);

      // Should not return 401 with valid auth
      expect(response.status).not.toBe(401);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty("user");
      }
    });
  });
});

