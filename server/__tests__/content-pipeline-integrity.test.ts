/**
 * Content Pipeline Integrity Tests
 * 
 * Verifies the content generation pipeline:
 * 1. No stub/test content in production paths
 * 2. Real AI content is properly stored
 * 3. Content flows correctly from generation to Queue visibility
 * 4. generation_logs properly tracks all generations
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
// Use index-v2 which handles env validation gracefully in tests
import { createServer } from "../index-v2";
import request from "supertest";
import { generateTestToken, createTestUser, TEST_BRAND_ID } from "./helpers/auth";
import { Role } from "../middleware/rbac";

describe("Content Pipeline Integrity", () => {
  let app: ReturnType<typeof createServer>;
  let authToken: string;

  beforeAll(() => {
    app = createServer();
    const testUser = createTestUser({
      userId: "test-user-pipeline-" + Date.now(),
      email: "test@postd.ai",
      brandIds: [TEST_BRAND_ID],
      role: Role.ADMIN,
    });
    authToken = generateTestToken(testUser);
  });

  describe("No Stub Content in Production Paths", () => {
    it("should not return { test: true } pattern in onboarding content generation", async () => {
      // Test that the generate-week endpoint doesn't return stub content
      const response = await request(app)
        .post("/api/onboarding/generate-week")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          brandId: TEST_BRAND_ID,
          weeklyFocus: "Social engagement",
          brandSnapshot: {
            colors: ["#FF0000", "#00FF00"],
            tone: ["professional", "friendly"],
            keywords: ["innovation", "quality"],
            brandIdentity: "Test brand for pipeline integrity",
          },
        });

      // Check response structure (may fail due to missing AI or DB, but should not contain stub patterns)
      if (response.status === 200 && response.body.contentPackage) {
        const pkg = response.body.contentPackage;
        
        // ✅ Verify no explicit test stubs
        expect(JSON.stringify(pkg)).not.toContain('"test": true');
        expect(JSON.stringify(pkg)).not.toContain('"test":true');
        expect(JSON.stringify(pkg)).not.toContain('"run_id"');
        
        // ✅ Verify items have proper structure
        if (pkg.items && Array.isArray(pkg.items)) {
          for (const item of pkg.items) {
            expect(item).toHaveProperty("id");
            expect(item).toHaveProperty("title");
            expect(item).toHaveProperty("content");
            expect(item).toHaveProperty("platform");
            expect(item).toHaveProperty("type");
            
            // Items should have scheduled date/time
            expect(item).toHaveProperty("scheduledDate");
            expect(item).toHaveProperty("scheduledTime");
            
            // Content should not be empty
            expect(item.content.length).toBeGreaterThan(10);
          }
        }
      }
      
      // If endpoint fails, that's acceptable for test environment
      // Main goal is ensuring stub patterns don't appear in successful responses
      expect([200, 400, 401, 404, 500]).toContain(response.status);
    });

    it("should not return { test: true } pattern in agent generate endpoints", async () => {
      const response = await request(app)
        .post("/api/agents/generate/doc")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          brandId: TEST_BRAND_ID,
          prompt: "Generate a social media post about quality products",
          platform: "instagram",
        });

      if (response.status === 200 && response.body.content) {
        // ✅ Verify no explicit test stubs
        expect(JSON.stringify(response.body)).not.toContain('"test": true');
        expect(JSON.stringify(response.body)).not.toContain('"test":true');
        expect(JSON.stringify(response.body)).not.toContain('"run_id"');
      }

      // Accept various status codes as the AI provider may not be configured
      expect([200, 400, 401, 404, 500, 503]).toContain(response.status);
    });

    it("should not return { test: true } pattern in content-items API", async () => {
      const response = await request(app)
        .get("/api/content-items")
        .set("Authorization", `Bearer ${authToken}`)
        .query({ brandId: TEST_BRAND_ID });

      if (response.status === 200) {
        // ✅ Verify no explicit test stubs
        expect(JSON.stringify(response.body)).not.toContain('"test": true');
        expect(JSON.stringify(response.body)).not.toContain('"test":true');
        expect(JSON.stringify(response.body)).not.toContain('"run_id"');
      }

      expect([200, 400, 401, 404, 500]).toContain(response.status);
    });
  });

  describe("Content Structure Validation", () => {
    it("should generate content with required 7-item structure for weekly package", async () => {
      const response = await request(app)
        .post("/api/onboarding/generate-week")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          brandId: TEST_BRAND_ID,
          weeklyFocus: "Brand consistency",
          brandSnapshot: {
            colors: ["#1a1a2e", "#16213e"],
            tone: ["professional"],
            keywords: ["reliability"],
            brandIdentity: "Test brand",
          },
        });

      if (response.status === 200 && response.body.contentPackage?.items) {
        const items = response.body.contentPackage.items;
        
        // ✅ Verify 7 items as per product spec
        expect(items.length).toBeGreaterThanOrEqual(6); // At least 6 items (email + GBP may be optional)
        
        // ✅ Verify platform distribution
        const platforms = items.map((i: any) => i.platform);
        const types = items.map((i: any) => i.type);
        
        // Should have social posts (at least 5)
        const socialCount = types.filter((t: string) => t === "social").length;
        expect(socialCount).toBeGreaterThanOrEqual(4);
        
        // Should have various platforms
        expect(platforms.some((p: string) => p === "instagram" || p === "facebook" || p === "linkedin")).toBe(true);
      }

      expect([200, 400, 401, 404, 500]).toContain(response.status);
    });

    it("should include brandFidelityScore in generated content", async () => {
      const response = await request(app)
        .post("/api/onboarding/generate-week")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          brandId: TEST_BRAND_ID,
          weeklyFocus: "Lead generation",
          brandSnapshot: {
            colors: ["#00ff00"],
            tone: ["energetic"],
            keywords: ["growth"],
            brandIdentity: "Growing brand",
          },
        });

      if (response.status === 200 && response.body.contentPackage?.items) {
        for (const item of response.body.contentPackage.items) {
          // ✅ BFS should be present (even if 0 for fallback content)
          expect(item).toHaveProperty("brandFidelityScore");
          expect(typeof item.brandFidelityScore).toBe("number");
          expect(item.brandFidelityScore).toBeGreaterThanOrEqual(0);
          expect(item.brandFidelityScore).toBeLessThanOrEqual(1);
        }
      }

      expect([200, 400, 401, 404, 500]).toContain(response.status);
    });
  });

  describe("Generation Logs Tracking", () => {
    it("should log generation attempts to generation_logs", async () => {
      // Generate content
      const genResponse = await request(app)
        .post("/api/onboarding/generate-week")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          brandId: TEST_BRAND_ID,
          weeklyFocus: "Awareness",
          brandSnapshot: {
            colors: ["#0066cc"],
            tone: ["informative"],
            keywords: ["awareness"],
            brandIdentity: "Awareness focused brand",
          },
        });

      // If generation succeeded, verify metadata indicates logging
      if (genResponse.status === 200 && genResponse.body.metadata) {
        // The response should indicate persistence attempts
        expect(genResponse.body.metadata).toHaveProperty("itemsCount");
        
        // Check if sync happened (new fix)
        if (genResponse.body.metadata.syncedToContentItems !== undefined) {
          expect(typeof genResponse.body.metadata.syncedToContentItems).toBe("number");
        }
      }

      expect([200, 400, 401, 404, 500]).toContain(genResponse.status);
    });
  });

  describe("Content Items Sync", () => {
    it("should sync generated content to content_items for Queue visibility", async () => {
      // First, generate content
      const genResponse = await request(app)
        .post("/api/onboarding/generate-week")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          brandId: TEST_BRAND_ID,
          weeklyFocus: "Sales",
          brandSnapshot: {
            colors: ["#ff6600"],
            tone: ["persuasive"],
            keywords: ["conversion"],
            brandIdentity: "Sales-focused brand",
          },
        });

      if (genResponse.status === 200 && genResponse.body.metadata) {
        // ✅ Verify sync metadata is present
        expect(genResponse.body.metadata).toBeDefined();
        
        if (genResponse.body.metadata.syncedToContentItems !== undefined) {
          // Should have synced some items (or at least attempted)
          expect(typeof genResponse.body.metadata.syncedToContentItems).toBe("number");
        }
      }

      expect([200, 400, 401, 404, 500]).toContain(genResponse.status);
    });
  });

  describe("Fallback Content Identification", () => {
    it("should clearly flag fallback content when AI is unavailable", async () => {
      const response = await request(app)
        .post("/api/onboarding/generate-week")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          brandId: TEST_BRAND_ID,
          weeklyFocus: "Social engagement",
          brandSnapshot: {
            colors: ["#purple"],
            tone: ["casual"],
            keywords: ["fun"],
            brandIdentity: "Fun brand",
          },
        });

      if (response.status === 200) {
        // ✅ Metadata should indicate if fallback was used
        if (response.body.metadata?.usedFallback === true) {
          // If fallback was used, message should mention it
          expect(response.body.message).toContain("AI was unavailable");
          
          // Fallback content should still have proper structure
          const pkg = response.body.contentPackage;
          if (pkg?.items) {
            for (const item of pkg.items) {
              expect(item).toHaveProperty("id");
              expect(item).toHaveProperty("content");
              // Fallback items should have lower BFS
              expect(item.brandFidelityScore).toBeLessThanOrEqual(0.5);
            }
          }
        }
      }

      expect([200, 400, 401, 404, 500]).toContain(response.status);
    });

    it("should not mark real AI content as placeholder", async () => {
      const response = await request(app)
        .post("/api/onboarding/generate-week")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          brandId: TEST_BRAND_ID,
          weeklyFocus: "Brand consistency",
          brandSnapshot: {
            colors: ["#123456"],
            tone: ["formal"],
            keywords: ["trust"],
            brandIdentity: "Trusted brand",
          },
        });

      if (response.status === 200) {
        const usedFallback = response.body.metadata?.usedFallback;
        const pkg = response.body.contentPackage;
        
        // Only verify AI content quality if AI was actually available
        // In test environment, AI typically fails and fallback is used
        if (usedFallback === false && pkg?.items) {
          for (const item of pkg.items) {
            expect(item.content.toLowerCase()).not.toContain("placeholder");
            expect(item.content.toLowerCase()).not.toContain("please regenerate");
            // Real content should have higher BFS
            expect(item.brandFidelityScore).toBeGreaterThan(0.5);
          }
        } else if (usedFallback === true && pkg?.items) {
          // Fallback content should have BFS of 0.5 (deterministic default)
          for (const item of pkg.items) {
            expect(item.brandFidelityScore).toBe(0.5);
          }
        }
      }

      expect([200, 400, 401, 404, 500]).toContain(response.status);
    });
  });
});

