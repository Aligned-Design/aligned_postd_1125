/**
 * AI Rewrite Endpoint Tests
 * 
 * Tests for /api/ai-rewrite endpoint functionality.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import supertest from "supertest";
import { createServer } from "../index-v2";
import type { Express } from "express";

// Mock the OpenAI client
vi.mock("../lib/openai-client", () => ({
  generateWithChatCompletions: vi.fn().mockResolvedValue("This is rewritten content optimized for Instagram. ✨"),
  DEFAULT_OPENAI_MODEL: "gpt-4-turbo-preview",
  getOpenAIClient: vi.fn(),
}));

// Mock authentication middleware
vi.mock("../middleware/security", () => ({
  authenticateUser: (req: any, res: any, next: any) => {
    req.user = {
      id: "test-user-id",
      email: "test@example.com",
    };
    next();
  },
}));

// Mock brand validation middleware
vi.mock("../middleware/validate-brand-id", () => ({
  validateBrandId: (req: any, res: any, next: any) => {
    next();
  },
  validateBrandIdFormat: (req: any, res: any, next: any) => {
    next();
  },
}));

describe("AI Rewrite Endpoint", () => {
  let app: Express;
  let request: ReturnType<typeof supertest>;

  beforeEach(() => {
    app = createServer();
    request = supertest(app);
  });

  describe("POST /api/ai-rewrite", () => {
    it("should reject request without content", async () => {
      const response = await request.post("/api/ai-rewrite").send({
        platform: "instagram",
        brandId: "550e8400-e29b-41d4-a716-446655440000",
      });

      expect(response.status).toBe(400);
      expect(response.body.error || response.body.success === false).toBeTruthy();
    });

    it("should reject request without platform", async () => {
      const response = await request.post("/api/ai-rewrite").send({
        content: "Test content",
        brandId: "550e8400-e29b-41d4-a716-446655440000",
      });

      expect(response.status).toBe(400);
      expect(response.body.error || response.body.success === false).toBeTruthy();
    });

    it("should reject request without brandId", async () => {
      const response = await request.post("/api/ai-rewrite").send({
        content: "Test content",
        platform: "instagram",
      });

      expect(response.status).toBe(400);
      expect(response.body.error || response.body.success === false).toBeTruthy();
    });

    it("should reject request with invalid platform", async () => {
      const response = await request.post("/api/ai-rewrite").send({
        content: "Test content",
        platform: "invalid-platform",
        brandId: "550e8400-e29b-41d4-a716-446655440000",
      });

      expect(response.status).toBe(400);
      expect(response.body.error || response.body.success === false).toBeTruthy();
    });

    it("should reject request with invalid brandId", async () => {
      const response = await request.post("/api/ai-rewrite").send({
        content: "Test content",
        platform: "instagram",
        brandId: "not-a-uuid",
      });

      expect(response.status).toBe(400);
      expect(response.body.error || response.body.success === false).toBeTruthy();
    });

    it("should accept valid request and return rewritten content", async () => {
      const response = await request.post("/api/ai-rewrite").send({
        content: "Check out our new product!",
        platform: "instagram",
        brandId: "550e8400-e29b-41d4-a716-446655440000",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.rewrittenContent).toBeDefined();
      expect(typeof response.body.rewrittenContent).toBe("string");
      expect(response.body.rewrittenContent.length).toBeGreaterThan(0);
    });

    it("should handle different platforms", async () => {
      const platforms = ["instagram", "facebook", "tiktok", "twitter", "linkedin"];

      for (const platform of platforms) {
        const response = await request.post("/api/ai-rewrite").send({
          content: "Test content",
          platform,
          brandId: "550e8400-e29b-41d4-a716-446655440000",
        });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });

    it("should handle optional tone parameter", async () => {
      const response = await request.post("/api/ai-rewrite").send({
        content: "Test content",
        platform: "instagram",
        brandId: "550e8400-e29b-41d4-a716-446655440000",
        tone: "casual",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should handle optional style parameter", async () => {
      const response = await request.post("/api/ai-rewrite").send({
        content: "Test content",
        platform: "instagram",
        brandId: "550e8400-e29b-41d4-a716-446655440000",
        style: "creative",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should reject content exceeding max length", async () => {
      const longContent = "a".repeat(5001);

      const response = await request.post("/api/ai-rewrite").send({
        content: longContent,
        platform: "instagram",
        brandId: "550e8400-e29b-41d4-a716-446655440000",
      });

      expect(response.status).toBe(400);
      expect(response.body.error || response.body.success === false).toBeTruthy();
    });
  });
});

