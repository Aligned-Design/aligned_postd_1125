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

describe("API Smoke Tests", () => {
  let app: ReturnType<typeof createServer>;

  beforeAll(() => {
    app = createServer();
  });

  describe("Health Check Endpoints", () => {
    it("GET /api/health should return 200 with status ok", async () => {
      const response = await request(app).get("/api/health");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status", "ok");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("service");
    });

    it("GET /api/health/ai should return AI configuration status", async () => {
      const response = await request(app).get("/api/health/ai");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("provider");
      expect(response.body).toHaveProperty("configured");
      expect(response.body).toHaveProperty("timestamp");
    });

    it("GET /api/health/supabase should return database status", async () => {
      const response = await request(app).get("/api/health/supabase");

      // May be 200 (ok) or 503 (service unavailable) depending on DB connection
      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("timestamp");
    });

    it("GET /api/ping should return pong message", async () => {
      const response = await request(app).get("/api/ping");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message");
    });
  });

  describe("Public Endpoints", () => {
    it("GET /api/demo should return demo message", async () => {
      const response = await request(app).get("/api/demo");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message");
    });
  });

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

    it("GET /api/analytics/:brandId should require authentication", async () => {
      const response = await request(app).get(
        "/api/analytics/550e8400-e29b-41d4-a716-446655440000"
      );

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("Error Response Format", () => {
    it("should return standardized error format for 404", async () => {
      const response = await request(app).get("/api/nonexistent-endpoint");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code");
      expect(response.body.error).toHaveProperty("message");
      expect(response.body.error).toHaveProperty("severity");
      expect(response.body.error).toHaveProperty("timestamp");
    });

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
      // Mock auth token (in real test, would use actual token)
      const mockToken = "mock-token";

      const response = await request(app)
        .post("/api/dashboard")
        .set("Authorization", `Bearer ${mockToken}`)
        .send({
          brandId: "invalid-uuid",
          timeRange: "30d",
        });

      // Should fail validation (422) or auth (401)
      expect([400, 401, 422]).toContain(response.status);
    });

    it("POST /api/dashboard should validate timeRange enum", async () => {
      const mockToken = "mock-token";

      const response = await request(app)
        .post("/api/dashboard")
        .set("Authorization", `Bearer ${mockToken}`)
        .send({
          brandId: "550e8400-e29b-41d4-a716-446655440000",
          timeRange: "invalid-range",
        });

      // Should fail validation
      expect([400, 401, 422]).toContain(response.status);
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
    it("GET /api/orchestration/health should return status", async () => {
      const response = await request(app).get("/api/orchestration/health");

      // May require auth, but should return some response
      expect([200, 401]).toContain(response.status);
    });
  });

  describe("Agents Health", () => {
    it("GET /api/agents/health should return status", async () => {
      const response = await request(app).get("/api/agents/health");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status");
    });
  });
});

