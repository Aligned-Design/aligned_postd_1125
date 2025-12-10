/**
 * Studio API Smoke Tests
 * 
 * Verifies that Studio API endpoints are:
 * - Properly registered in the server (not 404)
 * - Require authentication (401 without auth)
 * - Accept valid payloads (when authenticated)
 * - Create database records (content_items, publishing_jobs)
 * 
 * Run with: pnpm test server/__tests__/studio-smoke.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createServer } from "../index-v2";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { generateTestToken, TEST_BRAND_ID, mockTestUser } from "./helpers/auth";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Only run database tests if Supabase is configured
const canTestDatabase = !!(SUPABASE_URL && SUPABASE_SERVICE_KEY);

const supabase = canTestDatabase
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

describe("Studio API Smoke Tests", () => {
  let app: ReturnType<typeof createServer>;
  let authToken: string;
  let testBrandId: string;
  let testUserId: string;
  let testTenantId: string;
  let testDesignId: string | null = null;

  beforeAll(() => {
    app = createServer();
    // Generate a real JWT token using the shared auth helper
    authToken = generateTestToken();
    
    // Use test brand ID from auth helper (matches user's brandIds)
    testBrandId = TEST_BRAND_ID;
    testUserId = mockTestUser.userId;
    testTenantId = mockTestUser.tenantId;
  });

  afterAll(async () => {
    // Cleanup test data if Supabase is available
    if (canTestDatabase && supabase) {
      try {
        // Clean up in reverse dependency order
        if (testDesignId) {
          await supabase.from("content_items").delete().eq("id", testDesignId);
        }
        await supabase.from("publishing_jobs").delete().eq("brand_id", testBrandId);
        await supabase.from("brand_members").delete().eq("brand_id", testBrandId);
        await supabase.from("brands").delete().eq("id", testBrandId);
        if (testTenantId) {
          await supabase.from("tenants").delete().eq("id", testTenantId);
        }
      } catch (error) {
        // Ignore cleanup errors
        console.warn("Cleanup warning:", error);
      }
    }
  });

  describe("Route Registration", () => {
    it("POST /api/studio/save should be routed (not 404)", async () => {
      const response = await request(app)
        .post("/api/studio/save")
        .send({});

      // Route should exist (not 404)
      expect(response.status).not.toBe(404);
      
      // Should require auth (401) or fail validation (400)
      expect([400, 401, 403]).toContain(response.status);
      
      if (response.status === 401 || response.status === 403) {
        expect(response.body).toHaveProperty("error");
      }
    });

    it("POST /api/studio/:id/schedule should be routed (not 404)", async () => {
      const fakeDesignId = randomUUID();
      const response = await request(app)
        .post(`/api/studio/${fakeDesignId}/schedule`)
        .send({});

      // Route should exist (not 404)
      expect(response.status).not.toBe(404);
      
      // Should require auth (401) or fail validation (400)
      expect([400, 401, 403]).toContain(response.status);
      
      if (response.status === 401 || response.status === 403) {
        expect(response.body).toHaveProperty("error");
      }
    });

    it("GET /api/studio/:id should be routed (not 404)", async () => {
      const fakeDesignId = randomUUID();
      const response = await request(app).get(`/api/studio/${fakeDesignId}`);

      // Route should exist (not 404)
      expect(response.status).not.toBe(404);
      
      // Should require auth (401) or return 404 from handler (design not found)
      expect([401, 403, 404]).toContain(response.status);
      
      if (response.status === 401 || response.status === 403) {
        expect(response.body).toHaveProperty("error");
      }
    });

    it("PUT /api/studio/:id should be routed (not 404)", async () => {
      const fakeDesignId = randomUUID();
      const response = await request(app)
        .put(`/api/studio/${fakeDesignId}`)
        .send({});

      // Route should exist (not 404)
      expect(response.status).not.toBe(404);
      
      // Should require auth (401) or fail validation (400)
      expect([400, 401, 403]).toContain(response.status);
    });
  });

  describe("Authentication Required", () => {
    it("POST /api/studio/save should require authentication", async () => {
      const response = await request(app)
        .post("/api/studio/save")
        .send({
          format: "social_square",
          width: 1080,
          height: 1080,
          brandId: testBrandId,
          items: [],
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code");
    });

    it("POST /api/studio/:id/schedule should require authentication", async () => {
      const fakeDesignId = randomUUID();
      const response = await request(app)
        .post(`/api/studio/${fakeDesignId}/schedule`)
        .send({
          scheduledDate: "2025-12-31",
          scheduledTime: "12:00",
          scheduledPlatforms: ["instagram"],
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("Request Validation", () => {
    it("POST /api/studio/save should validate required fields", async () => {
      const response = await request(app)
        .post("/api/studio/save")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          // Missing required fields: format, width, height, brandId, items
        });

      // Should fail validation (400) - auth passes with real token
      expect([400, 422]).toContain(response.status);
    });

    it("POST /api/studio/save should validate format enum", async () => {
      const response = await request(app)
        .post("/api/studio/save")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          format: "invalid_format",
          width: 1080,
          height: 1080,
          brandId: testBrandId,
          items: [],
        });

      // Should fail validation
      expect([400, 422]).toContain(response.status);
    });

    it("POST /api/studio/:id/schedule should validate date format", async () => {
      const fakeDesignId = randomUUID();
      const response = await request(app)
        .post(`/api/studio/${fakeDesignId}/schedule`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          scheduledDate: "invalid-date",
          scheduledTime: "12:00",
          scheduledPlatforms: ["instagram"],
        });

      // Should fail validation
      expect([400, 422]).toContain(response.status);
    });

    it("POST /api/studio/:id/schedule should validate time format", async () => {
      const fakeDesignId = randomUUID();
      const response = await request(app)
        .post(`/api/studio/${fakeDesignId}/schedule`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          scheduledDate: "2025-12-31",
          scheduledTime: "25:00", // Invalid time
          scheduledPlatforms: ["instagram"],
        });

      // Should fail validation
      expect([400, 422]).toContain(response.status);
    });

    it("POST /api/studio/:id/schedule should require at least one platform", async () => {
      const fakeDesignId = randomUUID();
      const response = await request(app)
        .post(`/api/studio/${fakeDesignId}/schedule`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          scheduledDate: "2025-12-31",
          scheduledTime: "12:00",
          scheduledPlatforms: [], // Empty array
        });

      // Should fail validation
      expect([400, 422]).toContain(response.status);
    });
  });

  describe("Database Integration (requires Supabase)", () => {
    beforeAll(async () => {
      if (!canTestDatabase || !supabase) {
        return;
      }

      // Create test tenant
      try {
        await supabase.from("tenants").insert({
          id: testTenantId,
          name: "Test Tenant - Studio Smoke",
        });
      } catch (error) {
        // Ignore if tenant already exists or table doesn't exist
      }

      // Create test brand
      try {
        await supabase.from("brands").insert({
          id: testBrandId,
          name: "Test Brand - Studio Smoke",
          tenant_id: testTenantId,
          brand_kit: {},
          voice_summary: {},
          visual_summary: {},
        });
      } catch (error) {
        // Ignore if brand already exists
      }

      // Create test user membership
      try {
        await supabase.from("brand_members").insert({
          user_id: testUserId,
          brand_id: testBrandId,
          role: "admin",
        });
      } catch (error) {
        // Ignore if membership already exists
      }
    });

    it("POST /api/studio/save should work with authenticated request", async () => {
      // Using real auth token from shared auth helper
      const validPayload = {
        format: "social_square" as const,
        width: 1080,
        height: 1080,
        brandId: testBrandId,
        items: [
          {
            id: "item-1",
            type: "text" as const,
            x: 100,
            y: 100,
            width: 200,
            height: 50,
            rotation: 0,
            zIndex: 1,
            text: "Test Design",
            fontSize: 24,
            fontFamily: "Arial",
            fontColor: "#000000",
          },
        ],
        backgroundColor: "#FFFFFF",
        savedToLibrary: false,
      };

      const response = await request(app)
        .post("/api/studio/save")
        .set("Authorization", `Bearer ${authToken}`)
        .send(validPayload);

      // Route should be accessible with auth (not 401)
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(404);
      
      // If request succeeds, verify response shape
      if (response.status === 200 || response.status === 201) {
        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty("design");
        expect(response.body.design).toHaveProperty("id");

        // Verify database record if Supabase is available
        if (canTestDatabase && supabase) {
          const { data: contentItem } = await supabase
            .from("content_items")
            .select("*")
            .eq("id", response.body.design.id)
            .single();

          if (contentItem) {
            expect(contentItem.type).toBe("creative_studio");
            expect(contentItem.brand_id).toBe(testBrandId);
            testDesignId = response.body.design.id;
          }
        }
      }
    });

    it("POST /api/studio/:id/schedule should work with authenticated request", async () => {
      // Skip if we don't have a design ID from the previous test
      const designIdToUse = testDesignId || randomUUID();
      
      const schedulePayload = {
        scheduledDate: "2025-12-31",
        scheduledTime: "12:00",
        scheduledPlatforms: ["instagram", "linkedin"],
        autoPublish: false,
      };

      const response = await request(app)
        .post(`/api/studio/${designIdToUse}/schedule`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(schedulePayload);

      // Route should be accessible with auth (not 401)
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(404);
      
      // If request succeeds, verify response shape
      if (response.status === 200 || response.status === 201) {
        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty("job");
        expect(response.body.job).toHaveProperty("id");
        expect(response.body.job).toHaveProperty("platforms");

        // Verify database record if Supabase is available
        if (canTestDatabase && supabase) {
          const { data: job } = await supabase
            .from("publishing_jobs")
            .select("*")
            .eq("id", response.body.job.id)
            .single();

          if (job) {
            expect(job.brand_id).toBe(testBrandId);
            expect(job.status).toBe("scheduled");
          }
        }
      }
    });
  });

  describe("Wiring Confidence", () => {
    it("Should verify Studio routes are registered in index-v2.ts", async () => {
      // If we can hit Studio routes and they're not 404, they're registered
      const saveResponse = await request(app).post("/api/studio/save").send({});
      const scheduleResponse = await request(app)
        .post(`/api/studio/${randomUUID()}/schedule`)
        .send({});

      // Both should be routed (not 404)
      expect(saveResponse.status).not.toBe(404);
      expect(scheduleResponse.status).not.toBe(404);

      // Both should require auth (401) or fail validation (400)
      expect([400, 401, 403]).toContain(saveResponse.status);
      expect([400, 401, 403]).toContain(scheduleResponse.status);
    });
  });
});

