/**
 * MVP2 — Host-Aware Brand Guide Integration Tests
 * 
 * Tests that host-aware scraped data (heroHeadline, aboutText, services, host metadata)
 * correctly flows into the Brand Guide Builder.
 */

import { describe, it, expect } from "vitest";
import { brandSnapshotToBrandGuide } from "../lib/brand-guide-sync";

describe("Host-Aware Brand Guide Integration", () => {
  describe("Hero Headline Mapping", () => {
    it("should prepend heroHeadline as first sample headline", () => {
      const snapshot = {
        extractedMetadata: {
          heroHeadline: "Transform Your Business Today",
          headlines: ["About Us", "Our Services"]
        }
      };

      const result = brandSnapshotToBrandGuide(snapshot, "brand-123", "Test Brand");

      expect(result.identity?.sampleHeadlines).toEqual([
        "Transform Your Business Today",
        "About Us",
        "Our Services"
      ]);
    });

    it("should skip empty heroHeadline", () => {
      const snapshot = {
        extractedMetadata: {
          heroHeadline: "",
          headlines: ["About Us"]
        }
      };

      const result = brandSnapshotToBrandGuide(snapshot, "brand-123", "Test Brand");

      expect(result.identity?.sampleHeadlines).toEqual(["About Us"]);
    });

    it("should handle missing headlines array", () => {
      const snapshot = {
        extractedMetadata: {
          heroHeadline: "Only Hero Headline"
        }
      };

      const result = brandSnapshotToBrandGuide(snapshot, "brand-123", "Test Brand");

      expect(result.identity?.sampleHeadlines).toEqual(["Only Hero Headline"]);
    });
  });

  describe("Services → Content Pillars Mapping", () => {
    it("should use services as content pillars when no pillars exist", () => {
      const snapshot = {
        extractedMetadata: {
          services: ["Web Design", "Branding", "Marketing Strategy"]
        }
      };

      const result = brandSnapshotToBrandGuide(snapshot, "brand-123", "Test Brand");

      expect(result.contentRules?.contentPillars).toEqual([
        "Web Design",
        "Branding",
        "Marketing Strategy"
      ]);
    });

    it("should limit services to 5 content pillars", () => {
      const snapshot = {
        extractedMetadata: {
          services: ["Svc 1", "Svc 2", "Svc 3", "Svc 4", "Svc 5", "Svc 6", "Svc 7"]
        }
      };

      const result = brandSnapshotToBrandGuide(snapshot, "brand-123", "Test Brand");

      expect(result.contentRules?.contentPillars).toHaveLength(5);
      expect(result.contentRules?.contentPillars).toEqual([
        "Svc 1", "Svc 2", "Svc 3", "Svc 4", "Svc 5"
      ]);
    });

    it("should prefer existing contentPillars over services", () => {
      const snapshot = {
        contentPillars: ["Existing Pillar 1", "Existing Pillar 2"],
        extractedMetadata: {
          services: ["Service 1", "Service 2"]
        }
      };

      const result = brandSnapshotToBrandGuide(snapshot, "brand-123", "Test Brand");

      expect(result.contentRules?.contentPillars).toEqual([
        "Existing Pillar 1",
        "Existing Pillar 2"
      ]);
    });
  });

  describe("Services → Products/Services Mapping", () => {
    it("should populate productsServices from scraped services", () => {
      const snapshot = {
        extractedMetadata: {
          services: ["Consulting", "Development", "Design"]
        }
      };

      const result = brandSnapshotToBrandGuide(snapshot, "brand-123", "Test Brand");

      expect(result.approvedAssets?.productsServices).toHaveLength(3);
      expect(result.approvedAssets?.productsServices?.[0]).toEqual({
        id: "svc-0",
        name: "Consulting",
        description: ""
      });
    });

    it("should handle empty services array", () => {
      const snapshot = {
        extractedMetadata: {
          services: []
        }
      };

      const result = brandSnapshotToBrandGuide(snapshot, "brand-123", "Test Brand");

      expect(result.approvedAssets?.productsServices).toEqual([]);
    });
  });

  describe("About Text → Purpose Fallback", () => {
    it("should prefer brandIdentity over aboutText for purpose", () => {
      const snapshot = {
        extractedMetadata: {
          brandIdentity: "We are a leading consulting firm helping businesses grow.",
          aboutText: "Raw extracted about text that is long enough to qualify."
        }
      };

      const result = brandSnapshotToBrandGuide(snapshot, "brand-123", "Test Brand");

      expect(result.purpose).toBe("We are a leading consulting firm helping businesses grow.");
    });

    it("should fall back to aboutText when brandIdentity is empty", () => {
      const snapshot = {
        extractedMetadata: {
          brandIdentity: "",
          aboutText: "This is our raw about text that describes who we are and what we do in detail."
        }
      };

      const result = brandSnapshotToBrandGuide(snapshot, "brand-123", "Test Brand");

      expect(result.purpose).toBe("This is our raw about text that describes who we are and what we do in detail.");
    });

    it("should fall back to aboutText when brandIdentity is too short", () => {
      const snapshot = {
        extractedMetadata: {
          brandIdentity: "Short",
          aboutText: "This is a much longer about text that provides meaningful context about the brand."
        }
      };

      const result = brandSnapshotToBrandGuide(snapshot, "brand-123", "Test Brand");

      expect(result.purpose).toBe("This is a much longer about text that provides meaningful context about the brand.");
    });

    it("should require aboutText to be at least 50 chars to be used as fallback", () => {
      const snapshot = {
        extractedMetadata: {
          brandIdentity: "",
          aboutText: "Too short"
        },
        goal: "Default goal"
      };

      const result = brandSnapshotToBrandGuide(snapshot, "brand-123", "Test Brand");

      expect(result.purpose).toBe("Default goal");
    });
  });

  describe("No Regressions for Generic Snapshots", () => {
    it("should handle snapshot with no extractedMetadata", () => {
      const snapshot = {
        voice: "Professional",
        tone: ["Confident"],
        colors: ["#FF0000"],
        industry: "Technology"
      };

      const result = brandSnapshotToBrandGuide(snapshot, "brand-123", "Test Brand");

      expect(result.identity?.sampleHeadlines).toEqual([]);
      expect(result.contentRules?.contentPillars).toEqual([]);
      expect(result.approvedAssets?.productsServices).toEqual([]);
    });

    it("should preserve all existing fields when host-aware fields are missing", () => {
      const snapshot = {
        voice: "Friendly and approachable",
        tone: ["Casual", "Warm"],
        colors: ["#00FF00", "#0000FF"],
        industry: "Retail",
        audience: "Young professionals",
        extractedMetadata: {
          keywords: ["shopping", "fashion"],
          donts: ["Use jargon"]
        }
      };

      const result = brandSnapshotToBrandGuide(snapshot, "brand-123", "Test Brand");

      expect(result.voiceAndTone?.voiceDescription).toBe("Friendly and approachable");
      expect(result.voiceAndTone?.tone).toEqual(["Casual", "Warm"]);
      expect(result.visualIdentity?.colors).toEqual(["#00FF00", "#0000FF"]);
      expect(result.identity?.industry).toBe("Retail");
      expect(result.identity?.targetAudience).toBe("Young professionals");
      expect(result.identity?.industryKeywords).toEqual(["shopping", "fashion"]);
      expect(result.voiceAndTone?.avoidPhrases).toEqual(["Use jargon"]);
    });
  });

  describe("Full Integration Scenario", () => {
    it("should correctly map all host-aware fields from a complete snapshot", () => {
      const snapshot = {
        voice: "Modern and innovative",
        tone: ["Innovative", "Cutting-edge"],
        colors: ["#1E40AF", "#60A5FA"],
        industry: "SaaS",
        audience: "Enterprise businesses",
        extractedMetadata: {
          heroHeadline: "Revolutionize Your Workflow",
          aboutText: "We build enterprise-grade software that helps teams collaborate more effectively and efficiently.",
          services: ["Project Management", "Team Collaboration", "Analytics Dashboard"],
          keywords: ["productivity", "enterprise", "SaaS"],
          headlines: ["Features", "Pricing", "Contact"],
          brandIdentity: "AI-generated brand story that is compelling and engaging.",
          host: {
            name: "squarespace",
            confidence: "high"
          }
        }
      };

      const result = brandSnapshotToBrandGuide(snapshot, "brand-123", "WorkflowPro");

      // Hero headline is first sample headline
      expect(result.identity?.sampleHeadlines?.[0]).toBe("Revolutionize Your Workflow");
      
      // Services populate content pillars
      expect(result.contentRules?.contentPillars).toEqual([
        "Project Management",
        "Team Collaboration",
        "Analytics Dashboard"
      ]);
      
      // Services also populate productsServices
      expect(result.approvedAssets?.productsServices).toHaveLength(3);
      expect(result.approvedAssets?.productsServices?.[0]?.name).toBe("Project Management");
      
      // AI-generated brandIdentity is used for purpose (preferred over aboutText)
      expect(result.purpose).toBe("AI-generated brand story that is compelling and engaging.");
      
      // All other fields preserved
      expect(result.voiceAndTone?.voiceDescription).toBe("Modern and innovative");
      expect(result.identity?.industryKeywords).toEqual(["productivity", "enterprise", "SaaS"]);
    });
  });
});

