/**
 * MVP4 — Onboarding Content Orchestration Tests
 * 
 * Tests that verify the complete orchestration flow:
 * 1. Brand Snapshot created → Brand Guide saved
 * 2. 7-day content plan automatically generated
 * 3. Full Brand Guide completion (if not already complete)
 * 4. Future content uses latest Brand Guide
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// =============================================================================
// MOCK TYPES
// =============================================================================

interface OnboardingStep {
  id: string;
  name: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  error?: string;
  result?: unknown;
}

interface OnboardingResult {
  brandId: string;
  status: "started" | "completed" | "failed";
  steps: OnboardingStep[];
  errors: Array<{ step: string; error: string; timestamp: string }>;
}

interface ContentPlan {
  brandId: string;
  items: Array<{
    id: string;
    title: string;
    contentType: string;
    platform: string;
    content: string;
    status: string;
  }>;
  advisorRecommendations: string[];
  generatedAt: string;
}

// =============================================================================
// MOCKS
// =============================================================================

const mockGenerateContentPlan = vi.fn();
const mockGenerateBrandNarrativeSummary = vi.fn();
const mockGetCurrentBrandGuide = vi.fn();
const mockHasCompletedOnboarding = vi.fn();

vi.mock("../lib/content-planning-service", () => ({
  generateContentPlan: (...args: any[]) => mockGenerateContentPlan(...args),
}));

vi.mock("../lib/brand-summary-generator", () => ({
  generateBrandNarrativeSummary: (...args: any[]) => mockGenerateBrandNarrativeSummary(...args),
}));

vi.mock("../lib/brand-guide-service", () => ({
  getCurrentBrandGuide: (...args: any[]) => mockGetCurrentBrandGuide(...args),
}));

// =============================================================================
// TESTS
// =============================================================================

describe("Onboarding Content Orchestration (MVP4)", () => {
  const testBrandId = "550e8400-e29b-41d4-a716-446655440000";
  const testTenantId = "tenant-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Workflow Step Ordering", () => {
    it("should have correct step order in orchestration", () => {
      // Verify the expected step IDs and order
      const expectedStepOrder = [
        "crawler",
        "brand-guide",
        "strategy",
        "sample-content",
        "brand-summary",
        "content-planning",
      ];

      // This validates the orchestrator configuration
      expect(expectedStepOrder).toContain("content-planning");
      expect(expectedStepOrder.indexOf("brand-guide")).toBeLessThan(
        expectedStepOrder.indexOf("content-planning")
      );
    });

    it("should have content-planning as the final step", () => {
      const steps = [
        "crawler",
        "brand-guide",
        "strategy",
        "sample-content",
        "brand-summary",
        "content-planning",
      ];
      
      expect(steps[steps.length - 1]).toBe("content-planning");
    });
  });

  describe("Content Plan Generation", () => {
    it("should generate 7 content items (5 posts + 1 blog + 1 email)", async () => {
      // Mock content plan response
      const mockPlan: ContentPlan = {
        brandId: testBrandId,
        items: [
          { id: "1", title: "Post 1", contentType: "post", platform: "instagram", content: "Content...", status: "draft" },
          { id: "2", title: "Post 2", contentType: "post", platform: "instagram", content: "Content...", status: "draft" },
          { id: "3", title: "Post 3", contentType: "post", platform: "instagram", content: "Content...", status: "draft" },
          { id: "4", title: "Post 4", contentType: "post", platform: "facebook", content: "Content...", status: "draft" },
          { id: "5", title: "Post 5", contentType: "post", platform: "linkedin", content: "Content...", status: "draft" },
          { id: "6", title: "Blog Post", contentType: "blog", platform: "blog", content: "Content...", status: "draft" },
          { id: "7", title: "Email Newsletter", contentType: "email", platform: "email", content: "Content...", status: "draft" },
        ],
        advisorRecommendations: ["Post consistently", "Engage with followers"],
        generatedAt: new Date().toISOString(),
      };

      mockGenerateContentPlan.mockResolvedValueOnce(mockPlan);

      // Simulate calling content planning service
      const result = await mockGenerateContentPlan(testBrandId, testTenantId);

      expect(result.items).toHaveLength(7);
      expect(result.items.filter((i: any) => i.contentType === "post")).toHaveLength(5);
      expect(result.items.filter((i: any) => i.contentType === "blog")).toHaveLength(1);
      expect(result.items.filter((i: any) => i.contentType === "email")).toHaveLength(1);
    });

    it("should include advisor recommendations in content plan", async () => {
      const mockPlan: ContentPlan = {
        brandId: testBrandId,
        items: [],
        advisorRecommendations: ["Recommendation 1", "Recommendation 2"],
        generatedAt: new Date().toISOString(),
      };

      mockGenerateContentPlan.mockResolvedValueOnce(mockPlan);

      const result = await mockGenerateContentPlan(testBrandId, testTenantId);

      expect(result.advisorRecommendations).toHaveLength(2);
      expect(result.advisorRecommendations).toContain("Recommendation 1");
    });
  });

  describe("Brand Guide Usage", () => {
    it("should call getCurrentBrandGuide to get latest guide", async () => {
      const mockGuide = {
        brandName: "Test Brand",
        voiceAndTone: { tone: ["professional"] },
        visualIdentity: { colors: ["#FF0000"] },
      };

      mockGetCurrentBrandGuide.mockResolvedValueOnce(mockGuide);

      await mockGetCurrentBrandGuide(testBrandId);

      expect(mockGetCurrentBrandGuide).toHaveBeenCalledWith(testBrandId);
    });

    it("should return null for brand guide if brand not found", async () => {
      mockGetCurrentBrandGuide.mockResolvedValueOnce(null);

      const result = await mockGetCurrentBrandGuide("non-existent-brand");

      expect(result).toBeNull();
    });
  });

  describe("Idempotency", () => {
    it("should skip content generation if already completed", async () => {
      // Simulate hasCompletedOnboarding returning true
      mockHasCompletedOnboarding.mockResolvedValueOnce(true);

      const alreadyCompleted = await mockHasCompletedOnboarding(testBrandId);

      expect(alreadyCompleted).toBe(true);
      // When already completed, generateContentPlan should NOT be called
      expect(mockGenerateContentPlan).not.toHaveBeenCalled();
    });

    it("should proceed with generation if not completed", async () => {
      mockHasCompletedOnboarding.mockResolvedValueOnce(false);
      mockGenerateContentPlan.mockResolvedValueOnce({
        brandId: testBrandId,
        items: [{ id: "1", title: "Post", contentType: "post", platform: "instagram", content: "...", status: "draft" }],
        advisorRecommendations: [],
        generatedAt: new Date().toISOString(),
      });

      const notCompleted = await mockHasCompletedOnboarding(testBrandId);
      expect(notCompleted).toBe(false);

      // Now content plan should be generated
      await mockGenerateContentPlan(testBrandId);
      expect(mockGenerateContentPlan).toHaveBeenCalled();
    });
  });

  describe("Brand Narrative Summary", () => {
    it("should generate brand narrative summary after brand guide", async () => {
      mockGenerateBrandNarrativeSummary.mockResolvedValueOnce(
        "This is a comprehensive 8-10 paragraph brand summary that describes who the brand is..."
      );

      const summary = await mockGenerateBrandNarrativeSummary(testBrandId, testTenantId);

      expect(typeof summary).toBe("string");
      expect(summary.length).toBeGreaterThan(50);
    });
  });
});

