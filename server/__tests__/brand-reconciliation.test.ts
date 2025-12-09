/**
 * Tests for brand reconciliation (temporary brand ID → final UUID)
 * 
 * Verifies that reconcileTemporaryBrandAssets correctly transfers media_assets
 * from temporary brand IDs to final UUID-based brand IDs.
 * 
 * Tests the validation logic and helper functions without requiring DB access.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { isTemporaryBrandId } from "../lib/brand-reconciliation";

// Mock the dependencies to test validation logic without DB
vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));

vi.mock("../lib/scraped-images-service", () => ({
  transferScrapedImages: vi.fn(() => Promise.resolve(0)),
}));

vi.mock("../lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Brand Reconciliation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isTemporaryBrandId", () => {
    it("should identify temp brand IDs starting with 'brand_'", () => {
      expect(isTemporaryBrandId("brand_1234567890")).toBe(true);
      expect(isTemporaryBrandId("brand_abc123")).toBe(true);
      expect(isTemporaryBrandId("brand_")).toBe(true);
    });

    it("should NOT identify UUIDs as temporary", () => {
      expect(isTemporaryBrandId("550e8400-e29b-41d4-a716-446655440000")).toBe(false);
      expect(isTemporaryBrandId("e1e20953-f0ea-4bc5-b467-4d94ae4e753c")).toBe(false);
    });

    it("should NOT identify random strings as temporary", () => {
      expect(isTemporaryBrandId("random_string")).toBe(false);
      expect(isTemporaryBrandId("my-brand")).toBe(false);
      expect(isTemporaryBrandId("123456")).toBe(false);
    });

    it("should handle null/undefined safely", () => {
      expect(isTemporaryBrandId(null)).toBe(false);
      expect(isTemporaryBrandId(undefined)).toBe(false);
      expect(isTemporaryBrandId("")).toBe(false);
    });
  });

  describe("reconcileTemporaryBrandAssets", () => {
    // Import dynamically to get fresh mocks
    let reconcileTemporaryBrandAssets: typeof import("../lib/brand-reconciliation").reconcileTemporaryBrandAssets;

    beforeEach(async () => {
      vi.resetModules();
      const module = await import("../lib/brand-reconciliation");
      reconcileTemporaryBrandAssets = module.reconcileTemporaryBrandAssets;
    });

    it("should skip reconciliation when IDs are the same", async () => {
      const result = await reconcileTemporaryBrandAssets("brand_123", "brand_123");
      
      expect(result.success).toBe(true);
      expect(result.transferredImages).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it("should skip reconciliation when tempBrandId is empty", async () => {
      const result = await reconcileTemporaryBrandAssets("", "550e8400-e29b-41d4-a716-446655440000");
      
      expect(result.success).toBe(true);
      expect(result.transferredImages).toBe(0);
    });

    it("should skip when tempBrandId doesn't start with 'brand_'", async () => {
      const result = await reconcileTemporaryBrandAssets(
        "random_123",
        "550e8400-e29b-41d4-a716-446655440000"
      );
      
      expect(result.success).toBe(true);
      expect(result.errors).toContain("tempBrandId doesn't match expected format (should start with 'brand_')");
    });

    it("should reject invalid finalBrandId (not UUID)", async () => {
      const result = await reconcileTemporaryBrandAssets("brand_123", "not-a-uuid");
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain("finalBrandId is not a valid UUID");
    });

    it("should accept valid UUID finalBrandId", async () => {
      const result = await reconcileTemporaryBrandAssets(
        "brand_123",
        "550e8400-e29b-41d4-a716-446655440000"
      );
      
      // With mocked transferScrapedImages returning 0, should succeed
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
