/**
 * ContentPackage API Route Tests
 * 
 * Tests for ContentPackage CRUD operations:
 * - POST /api/content-packages
 * - GET /api/content-packages/:packageId
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { createServer } from "../../index";
import { ContentPackageStorage } from "../../lib/collaboration-storage";
import type { ContentPackage } from "@shared/collaboration-artifacts";
import { createContentPackage } from "@shared/collaboration-artifacts";

describe("ContentPackage Routes", () => {
  let app: ReturnType<typeof createServer>;
  let authToken: string;
  let testBrandId: string;
  let testContentPackage: ContentPackage;

  beforeEach(() => {
    app = createServer();
    // Mock auth token (in real tests, would use actual auth)
    authToken = "mock-auth-token";
    testBrandId = "550e8400-e29b-41d4-a716-446655440000";
    
    // Create test ContentPackage
    testContentPackage = createContentPackage({
      brandId: testBrandId,
      contentId: "test-content-123",
      requestId: "test-request-123",
      platform: "instagram",
      copy: {
        headline: "Test Headline",
        body: "Test body content",
        callToAction: "Learn More",
        tone: "professional",
        keywords: [],
        estimatedReadTime: 30,
      },
    });
  });

  afterEach(async () => {
    // Cleanup test data
    if (testContentPackage?.id) {
      try {
        await ContentPackageStorage.delete(testContentPackage.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe("POST /api/content-packages", () => {
    it("should create a ContentPackage with valid data", async () => {
      const response = await request(app)
        .post("/api/content-packages")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          brandId: testBrandId,
          contentPackage: testContentPackage,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("contentPackageId");
      expect(response.body).toHaveProperty("contentPackage");
      expect(response.body.contentPackage.brandId).toBe(testBrandId);
    });

    it("should require brandId in request body", async () => {
      const response = await request(app)
        .post("/api/content-packages")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          contentPackage: testContentPackage,
        });

      expect(response.status).toBe(400);
    });

    it("should require contentPackage in request body", async () => {
      const response = await request(app)
        .post("/api/content-packages")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          brandId: testBrandId,
        });

      expect(response.status).toBe(400);
    });

    it("should validate ContentPackage structure", async () => {
      const invalidPackage = {
        ...testContentPackage,
        id: undefined, // Missing required field
      };

      const response = await request(app)
        .post("/api/content-packages")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          brandId: testBrandId,
          contentPackage: invalidPackage,
        });

      expect(response.status).toBe(400);
    });

    it("should enforce brandId match between request and ContentPackage", async () => {
      const mismatchedPackage = {
        ...testContentPackage,
        brandId: "different-brand-id",
      };

      const response = await request(app)
        .post("/api/content-packages")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          brandId: testBrandId,
          contentPackage: mismatchedPackage,
        });

      expect(response.status).toBe(403);
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .post("/api/content-packages")
        .send({
          brandId: testBrandId,
          contentPackage: testContentPackage,
        });

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/content-packages/:packageId", () => {
    let savedPackageId: string;

    beforeEach(async () => {
      // Save a ContentPackage for testing
      const saved = await ContentPackageStorage.save(testContentPackage);
      savedPackageId = saved.id;
    });

    it("should get ContentPackage by ID", async () => {
      const response = await request(app)
        .get(`/api/content-packages/${savedPackageId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .query({ brandId: testBrandId });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("contentPackage");
      expect(response.body.contentPackage.id).toBe(savedPackageId);
      expect(response.body.contentPackage.brandId).toBe(testBrandId);
    });

    it("should return 404 for non-existent ContentPackage", async () => {
      const response = await request(app)
        .get("/api/content-packages/non-existent-id")
        .set("Authorization", `Bearer ${authToken}`)
        .query({ brandId: testBrandId });

      expect(response.status).toBe(404);
    });

    it("should validate packageId parameter", async () => {
      const response = await request(app)
        .get("/api/content-packages/")
        .set("Authorization", `Bearer ${authToken}`)
        .query({ brandId: testBrandId });

      expect(response.status).toBe(404); // Express route not found
    });

    it("should enforce brand access when brandId provided", async () => {
      const response = await request(app)
        .get(`/api/content-packages/${savedPackageId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .query({ brandId: "different-brand-id" });

      expect(response.status).toBe(403);
    });

    it("should work without brandId query param (no access check)", async () => {
      const response = await request(app)
        .get(`/api/content-packages/${savedPackageId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("contentPackage");
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .get(`/api/content-packages/${savedPackageId}`)
        .query({ brandId: testBrandId });

      expect(response.status).toBe(401);
    });
  });
});

