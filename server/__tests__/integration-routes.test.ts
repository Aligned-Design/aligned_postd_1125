/**
 * Minimal Integration Tests for Key Routes
 * Tests actual route handlers with mocked dependencies
 * 
 * These tests verify that routes are properly registered and return expected structures.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { getBrandIntelligence } from "../routes/brand-intelligence";
import { listMedia } from "../routes/media";
import { getClientSettings } from "../routes/client-settings";
import type { Request, Response } from "express";

// Mock Supabase
vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  },
}));

// Mock media-db-service
vi.mock("../lib/media-db-service", () => ({
  mediaDB: {
    listMediaAssets: vi.fn(() =>
      Promise.resolve({
        assets: [],
        total: 0,
      })
    ),
  },
}));

// Mock client-settings db
vi.mock("../lib/dbClient", () => ({
  clientSettings: {
    get: vi.fn(() =>
      Promise.resolve({
        id: "settings-id",
        client_id: "client-id",
        brand_id: "brand-id",
        email_preferences: {},
        timezone: "America/New_York",
        language: "en",
      })
    ),
  },
}));

describe("Integration Tests - Key Routes", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockReq = {
      params: {},
      query: {},
      body: {},
      headers: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
  });

  describe("GET /api/media/list", () => {
    it("should return 200 with assets array when brandId provided", async () => {
      (mockReq as any).query = { brandId: "test-brand-id" };
      (mockReq as any).user = { id: "user-id", brandIds: ["test-brand-id"] };

      await listMedia(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
      const jsonCall = (mockRes.json as any).mock.calls[0][0];
      expect(jsonCall).toHaveProperty("assets");
      expect(Array.isArray(jsonCall.assets)).toBe(true);
    });
  });

  describe("GET /api/brand-intelligence/:brandId", () => {
    it("should return 200 with intelligence data", async () => {
      (mockReq as any).params = { brandId: "test-brand-id" };

      await getBrandIntelligence(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
      const jsonCall = (mockRes.json as any).mock.calls[0][0];
      expect(jsonCall).toHaveProperty("brandId");
      expect(jsonCall).toHaveProperty("brandProfile");
      expect(jsonCall).toHaveProperty("recommendations");
    });
  });

  describe("GET /api/client-settings", () => {
    it("should return 200 with settings when headers provided", async () => {
      (mockReq as any).headers = {
        "x-client-id": "test-client-id",
        "x-brand-id": "test-brand-id",
      };

      await getClientSettings(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalled();
      const jsonCall = (mockRes.json as any).mock.calls[0][0];
      expect(jsonCall).toHaveProperty("success", true);
      expect(jsonCall).toHaveProperty("settings");
    });
  });
});

