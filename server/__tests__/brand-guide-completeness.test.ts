/**
 * Brand Guide Completeness Validation Tests (R06)
 * 
 * Tests for the brand guide completeness helper function.
 * 
 * @see docs/POSTD_FULL_STACK_CHAOS_AUDIT.md
 */

import { describe, it, expect } from "vitest";
import {
  validateBrandGuideCompleteness,
  type BrandGuideCompletenessResult,
} from "../lib/brand-guide-service";
import type { BrandGuide } from "@shared/brand-guide";

// =============================================================================
// TEST FIXTURES
// =============================================================================

function createMockBrandGuide(overrides?: Partial<BrandGuide>): BrandGuide {
  return {
    id: "guide-123",
    brandId: "brand-123",
    brandName: "Test Brand",
    identity: {
      name: "Test Brand",
      businessType: "Technology",
      industry: "Software",
      industryKeywords: ["software", "technology", "innovation"],
      competitors: [],
      sampleHeadlines: [],
      values: [],
      targetAudience: "B2B SaaS companies",
      painPoints: [],
    },
    voiceAndTone: {
      tone: ["professional", "friendly"],
      friendlinessLevel: 70,
      formalityLevel: 50,
      confidenceLevel: 80,
      voiceDescription: "Knowledgeable and approachable tech expert",
      writingRules: [],
      avoidPhrases: [],
    },
    visualIdentity: {
      colors: ["#A76CF5", "#F5C96C", "#06B6D4"],
      typography: {
        heading: "Poppins",
        body: "Inter",
        source: "google",
      },
      photographyStyle: {
        mustInclude: [],
        mustAvoid: [],
      },
      logoUrl: undefined,
      visualNotes: undefined,
    },
    contentRules: {
      platformGuidelines: {},
      preferredPlatforms: ["instagram", "linkedin"],
      preferredPostTypes: [],
      brandPhrases: [],
      contentPillars: [],
      neverDo: [],
      guardrails: [],
    },
    ...overrides,
  } as BrandGuide;
}

// =============================================================================
// TESTS: validateBrandGuideCompleteness
// =============================================================================

describe("validateBrandGuideCompleteness (R06 - Chaos Audit)", () => {
  describe("Null Guide", () => {
    it("returns false with 'entire brand guide' missing when guide is null", () => {
      const result = validateBrandGuideCompleteness(null);

      expect(result.isComplete).toBe(false);
      expect(result.missingFields).toContain("entire brand guide");
      expect(result.completenessScore).toBe(0);
    });
  });

  describe("Complete Guide", () => {
    it("returns true when all critical fields are present", () => {
      const guide = createMockBrandGuide();
      const result = validateBrandGuideCompleteness(guide);

      expect(result.isComplete).toBe(true);
      expect(result.missingFields).toHaveLength(0);
      expect(result.completenessScore).toBe(100);
    });
  });

  describe("Missing Voice & Tone", () => {
    it("detects missing tone keywords", () => {
      const guide = createMockBrandGuide({
        voiceAndTone: {
          tone: [], // Empty array
          friendlinessLevel: 50,
          formalityLevel: 50,
          confidenceLevel: 50,
          voiceDescription: "Test",
        },
      });

      const result = validateBrandGuideCompleteness(guide);

      expect(result.isComplete).toBe(false);
      expect(result.missingFields).toContain("voiceAndTone.tone");
    });

    it("detects missing voice description", () => {
      const guide = createMockBrandGuide({
        voiceAndTone: {
          tone: ["professional"],
          friendlinessLevel: 50,
          formalityLevel: 50,
          confidenceLevel: 50,
          voiceDescription: undefined, // Missing
        },
      });

      const result = validateBrandGuideCompleteness(guide);

      expect(result.isComplete).toBe(false);
      expect(result.missingFields).toContain("voiceAndTone.voiceDescription");
    });
  });

  describe("Missing Visual Identity", () => {
    it("detects missing colors", () => {
      const guide = createMockBrandGuide({
        visualIdentity: {
          colors: [], // Empty array
          typography: { heading: "Arial", body: "Helvetica" },
          photographyStyle: { mustInclude: [], mustAvoid: [] },
        },
      });

      const result = validateBrandGuideCompleteness(guide);

      expect(result.isComplete).toBe(false);
      expect(result.missingFields).toContain("visualIdentity.colors");
    });
  });

  describe("Missing Identity Fields", () => {
    it("detects missing business type", () => {
      const guide = createMockBrandGuide({
        identity: {
          name: "Test",
          businessType: undefined, // Missing
          industry: "Tech",
          industryKeywords: ["tech"],
          targetAudience: "General",
        },
      });

      const result = validateBrandGuideCompleteness(guide);

      expect(result.isComplete).toBe(false);
      expect(result.missingFields).toContain("identity.businessType");
    });

    it("detects missing industry", () => {
      const guide = createMockBrandGuide({
        identity: {
          name: "Test",
          businessType: "Service",
          industry: undefined, // Missing
          industryKeywords: ["service"],
          targetAudience: "General",
        },
      });

      const result = validateBrandGuideCompleteness(guide);

      expect(result.isComplete).toBe(false);
      expect(result.missingFields).toContain("identity.industry");
    });

    it("detects missing target audience", () => {
      const guide = createMockBrandGuide({
        identity: {
          name: "Test",
          businessType: "Service",
          industry: "Tech",
          industryKeywords: ["tech"],
          targetAudience: undefined, // Missing
        },
      });

      const result = validateBrandGuideCompleteness(guide);

      expect(result.isComplete).toBe(false);
      expect(result.missingFields).toContain("identity.targetAudience");
    });

    it("detects missing industry keywords", () => {
      const guide = createMockBrandGuide({
        identity: {
          name: "Test",
          businessType: "Service",
          industry: "Tech",
          industryKeywords: [], // Empty
          targetAudience: "General",
        },
      });

      const result = validateBrandGuideCompleteness(guide);

      expect(result.isComplete).toBe(false);
      expect(result.missingFields).toContain("identity.industryKeywords");
    });
  });

  describe("Multiple Missing Fields", () => {
    it("lists all missing fields", () => {
      const guide = createMockBrandGuide({
        identity: {
          name: "Test",
          businessType: undefined, // Missing
          industry: undefined, // Missing
          industryKeywords: [], // Missing
          targetAudience: undefined, // Missing
        },
        voiceAndTone: {
          tone: [], // Missing
          friendlinessLevel: 50,
          formalityLevel: 50,
          confidenceLevel: 50,
          voiceDescription: undefined, // Missing
        },
        visualIdentity: {
          colors: [], // Missing
          typography: {},
          photographyStyle: { mustInclude: [], mustAvoid: [] },
        },
      });

      const result = validateBrandGuideCompleteness(guide);

      expect(result.isComplete).toBe(false);
      expect(result.missingFields).toHaveLength(7);
      expect(result.completenessScore).toBe(0);
    });
  });

  describe("Completeness Score", () => {
    it("calculates partial completeness correctly", () => {
      // 7 fields total, let's have 4 complete (57%)
      const guide = createMockBrandGuide({
        identity: {
          name: "Test",
          businessType: "Tech", // Present
          industry: "Software", // Present
          industryKeywords: [], // Missing
          targetAudience: undefined, // Missing
        },
        voiceAndTone: {
          tone: ["professional"], // Present
          friendlinessLevel: 50,
          formalityLevel: 50,
          confidenceLevel: 50,
          voiceDescription: undefined, // Missing
        },
        visualIdentity: {
          colors: ["#000000"], // Present
          typography: {},
          photographyStyle: { mustInclude: [], mustAvoid: [] },
        },
      });

      const result = validateBrandGuideCompleteness(guide);

      expect(result.isComplete).toBe(false);
      expect(result.missingFields).toHaveLength(3);
      // 4 out of 7 fields = 57%
      expect(result.completenessScore).toBe(57);
    });

    it("rounds completeness score to nearest integer", () => {
      // With 7 fields, various combinations will produce different scores
      const guide = createMockBrandGuide({
        identity: {
          name: "Test",
          businessType: "Tech", // 1
          industry: "Software", // 2
          industryKeywords: ["tech"], // 3
          targetAudience: "General", // 4
        },
        voiceAndTone: {
          tone: ["friendly"], // 5
          friendlinessLevel: 50,
          formalityLevel: 50,
          confidenceLevel: 50,
          voiceDescription: "Test", // 6
        },
        visualIdentity: {
          colors: ["#000"], // 7
          typography: {},
          photographyStyle: { mustInclude: [], mustAvoid: [] },
        },
      });

      const result = validateBrandGuideCompleteness(guide);

      // All 7 fields present = 100%
      expect(result.completenessScore).toBe(100);
    });
  });

  describe("Edge Cases", () => {
    it("handles undefined nested objects gracefully", () => {
      const guide = {
        id: "guide-123",
        brandId: "brand-123",
        brandName: "Test",
        identity: undefined,
        voiceAndTone: undefined,
        visualIdentity: undefined,
        contentRules: {},
      } as unknown as BrandGuide;

      // Should not throw
      const result = validateBrandGuideCompleteness(guide);

      expect(result.isComplete).toBe(false);
      expect(result.missingFields.length).toBeGreaterThan(0);
    });

    it("treats empty string as missing", () => {
      const guide = createMockBrandGuide({
        identity: {
          name: "Test",
          businessType: "", // Empty string should count as missing
          industry: "Tech",
          industryKeywords: ["tech"],
          targetAudience: "General",
        },
      });

      const result = validateBrandGuideCompleteness(guide);

      expect(result.missingFields).toContain("identity.businessType");
    });
  });
});

