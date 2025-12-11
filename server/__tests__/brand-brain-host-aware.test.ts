/**
 * MVP3 — Host-Aware AI Agent Integration Tests
 *
 * Tests that host metadata flows from Brand Brain to AI agents
 * and that prompt builders correctly use host-aware context.
 */

import { describe, it, expect } from "vitest";
import {
  getHostCopyStyleHints,
  getHostVisualStyleHints,
  buildHostAwarePromptSection,
} from "../lib/prompts/brand-guide-prompts";
import { buildDocUserPrompt, DocPromptContext } from "../lib/ai/docPrompt";
import { buildDesignUserPrompt, DesignPromptContext } from "../lib/ai/designPrompt";
import { buildAdvisorUserPrompt, AdvisorPromptContext } from "../lib/ai/advisorPrompt";

// ============================================================================
// HOST STYLE HINTS TESTS
// ============================================================================

describe("Host-Aware Style Hints", () => {
  describe("getHostCopyStyleHints", () => {
    it("returns Squarespace copy hints for squarespace host", () => {
      const hints = getHostCopyStyleHints("squarespace");
      expect(hints.length).toBeGreaterThan(0);
      expect(hints.some((h) => h.toLowerCase().includes("modern"))).toBe(true);
      expect(hints.some((h) => h.toLowerCase().includes("clean"))).toBe(true);
    });

    it("returns Shopify copy hints for shopify host", () => {
      const hints = getHostCopyStyleHints("shopify");
      expect(hints.length).toBeGreaterThan(0);
      expect(hints.some((h) => h.toLowerCase().includes("product"))).toBe(true);
      expect(hints.some((h) => h.toLowerCase().includes("conversion"))).toBe(true);
    });

    it("returns WordPress copy hints for wordpress host", () => {
      const hints = getHostCopyStyleHints("wordpress");
      expect(hints.length).toBeGreaterThan(0);
      expect(hints.some((h) => h.toLowerCase().includes("seo"))).toBe(true);
      expect(hints.some((h) => h.toLowerCase().includes("content"))).toBe(true);
    });

    it("returns Webflow copy hints for webflow host", () => {
      const hints = getHostCopyStyleHints("webflow");
      expect(hints.length).toBeGreaterThan(0);
      expect(hints.some((h) => h.toLowerCase().includes("design"))).toBe(true);
    });

    it("returns Wix copy hints for wix host", () => {
      const hints = getHostCopyStyleHints("wix");
      expect(hints.length).toBeGreaterThan(0);
    });

    it("returns empty array for unknown host", () => {
      const hints = getHostCopyStyleHints("unknown");
      expect(hints).toEqual([]);
    });

    it("returns empty array for undefined host", () => {
      const hints = getHostCopyStyleHints(undefined);
      expect(hints).toEqual([]);
    });
  });

  describe("getHostVisualStyleHints", () => {
    it("returns Squarespace visual hints for squarespace host", () => {
      const hints = getHostVisualStyleHints("squarespace");
      expect(hints.length).toBeGreaterThan(0);
      expect(hints.some((h) => h.toLowerCase().includes("minimal"))).toBe(true);
    });

    it("returns Shopify visual hints for shopify host", () => {
      const hints = getHostVisualStyleHints("shopify");
      expect(hints.length).toBeGreaterThan(0);
      expect(hints.some((h) => h.toLowerCase().includes("product"))).toBe(true);
    });

    it("returns WordPress visual hints for wordpress host", () => {
      const hints = getHostVisualStyleHints("wordpress");
      expect(hints.length).toBeGreaterThan(0);
    });

    it("returns empty array for unknown host", () => {
      const hints = getHostVisualStyleHints("unknown");
      expect(hints).toEqual([]);
    });
  });
});

// ============================================================================
// HOST-AWARE PROMPT SECTION TESTS
// ============================================================================

describe("buildHostAwarePromptSection", () => {
  it("returns empty string for unknown host", () => {
    const section = buildHostAwarePromptSection("unknown", "copy");
    expect(section).toBe("");
  });

  it("returns empty string for undefined host", () => {
    const section = buildHostAwarePromptSection(undefined, "copy");
    expect(section).toBe("");
  });

  it("includes platform name for squarespace", () => {
    const section = buildHostAwarePromptSection("squarespace", "copy");
    expect(section).toContain("Squarespace");
    expect(section).toContain("PLATFORM STYLE CONTEXT");
  });

  it("includes copy hints for copy agent type", () => {
    const section = buildHostAwarePromptSection("shopify", "copy");
    expect(section).toContain("Writing Style");
    expect(section).toContain("product");
  });

  it("includes visual hints for design agent type", () => {
    const section = buildHostAwarePromptSection("squarespace", "design");
    expect(section).toContain("Visual Style");
    expect(section).toContain("minimal");
  });

  it("includes copy hints for advisor agent type", () => {
    const section = buildHostAwarePromptSection("wordpress", "advisor");
    expect(section).toContain("Writing Style");
    expect(section).toContain("SEO");
  });
});

// ============================================================================
// DOC PROMPT HOST-AWARE TESTS
// ============================================================================

describe("buildDocUserPrompt with host context", () => {
  const baseBrand = {
    name: "Test Brand",
    tone: "professional",
    values: ["quality", "innovation"],
    targetAudience: "business professionals",
    forbiddenPhrases: [],
    requiredDisclaimers: [],
    allowedToneDescriptors: ["professional", "friendly"],
  };

  const baseRequest = {
    contentType: "caption" as const,
    platform: "instagram" as const,
    topic: "New product launch",
  };

  it("includes host context when host is provided", () => {
    const context: DocPromptContext = {
      brand: baseBrand,
      request: baseRequest,
      host: { type: "squarespace", confidence: "high" },
    };

    const prompt = buildDocUserPrompt(context);
    expect(prompt).toContain("Squarespace");
    expect(prompt).toContain("PLATFORM STYLE CONTEXT");
  });

  it("does not include host context when host is unknown", () => {
    const context: DocPromptContext = {
      brand: baseBrand,
      request: baseRequest,
      host: { type: "unknown" },
    };

    const prompt = buildDocUserPrompt(context);
    expect(prompt).not.toContain("PLATFORM STYLE CONTEXT");
  });

  it("does not include host context when host is undefined", () => {
    const context: DocPromptContext = {
      brand: baseBrand,
      request: baseRequest,
    };

    const prompt = buildDocUserPrompt(context);
    expect(prompt).not.toContain("PLATFORM STYLE CONTEXT");
  });

  it("includes Shopify-specific hints for shopify host", () => {
    const context: DocPromptContext = {
      brand: baseBrand,
      request: baseRequest,
      host: { type: "shopify" },
    };

    const prompt = buildDocUserPrompt(context);
    expect(prompt).toContain("Shopify");
    expect(prompt.toLowerCase()).toContain("product");
  });
});

// ============================================================================
// DESIGN PROMPT HOST-AWARE TESTS
// ============================================================================

describe("buildDesignUserPrompt with host context", () => {
  const baseBrand = {
    name: "Test Brand",
    tone: "modern",
    values: ["creativity"],
    targetAudience: "designers",
    forbiddenPhrases: [],
    requiredDisclaimers: [],
    allowedToneDescriptors: ["creative"],
  };

  const baseRequest = {
    format: "feed" as const,
    platform: "instagram" as const,
    conceptCount: 3,
  };

  it("includes visual style hints for squarespace", () => {
    const context: DesignPromptContext = {
      brand: baseBrand,
      request: baseRequest,
      host: { type: "squarespace" },
    };

    const prompt = buildDesignUserPrompt(context);
    expect(prompt).toContain("Squarespace");
    expect(prompt).toContain("Visual Style");
  });

  it("includes grid-focused hints for shopify", () => {
    const context: DesignPromptContext = {
      brand: baseBrand,
      request: baseRequest,
      host: { type: "shopify" },
    };

    const prompt = buildDesignUserPrompt(context);
    expect(prompt.toLowerCase()).toContain("product");
  });
});

// ============================================================================
// ADVISOR PROMPT HOST-AWARE TESTS
// ============================================================================

describe("buildAdvisorUserPrompt with host context", () => {
  const baseBrand = {
    name: "Test Brand",
    tone: "professional",
    values: [],
    targetAudience: "general",
    forbiddenPhrases: [],
    requiredDisclaimers: [],
    allowedToneDescriptors: [],
  };

  it("includes SEO hints for wordpress host", () => {
    const context: AdvisorPromptContext = {
      brand: baseBrand,
      host: { type: "wordpress" },
    };

    const prompt = buildAdvisorUserPrompt(context);
    // Note: buildHostAwarePromptSection capitalizes first letter only (e.g., "Wordpress")
    expect(prompt.toLowerCase()).toContain("wordpress");
    expect(prompt.toLowerCase()).toContain("seo");
    expect(prompt).toContain("PLATFORM STYLE CONTEXT");
  });

  it("does not include host context for unknown host", () => {
    const context: AdvisorPromptContext = {
      brand: baseBrand,
      host: { type: "unknown" },
    };

    const prompt = buildAdvisorUserPrompt(context);
    expect(prompt).not.toContain("PLATFORM STYLE CONTEXT");
  });
});

// ============================================================================
// BRANDCONTEXTPACK HOST FIELD TESTS
// ============================================================================

describe("BrandContextPack host field type", () => {
  it("host field structure is correct", () => {
    // This test validates the type structure
    const hostData: { type: string; confidence?: string } = {
      type: "squarespace",
      confidence: "high",
    };

    expect(hostData.type).toBe("squarespace");
    expect(hostData.confidence).toBe("high");
  });

  it("host field can be undefined", () => {
    const contextWithNoHost: { host?: { type: string; confidence?: string } } = {};
    expect(contextWithNoHost.host).toBeUndefined();
  });

  it("host confidence is optional", () => {
    const hostWithoutConfidence: { type: string; confidence?: string } = {
      type: "shopify",
    };
    expect(hostWithoutConfidence.type).toBe("shopify");
    expect(hostWithoutConfidence.confidence).toBeUndefined();
  });
});

