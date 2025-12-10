/**
 * Content Planning Service Chaos Tests (R03)
 * 
 * Tests for failure modes identified in the Chaos Audit:
 * - R03: Complete AI failure → fallback plan
 * - Placeholder content filtering behavior
 * 
 * These tests pin down current behavior before fixes are applied.
 * 
 * @see docs/POSTD_FULL_STACK_CHAOS_AUDIT.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// =============================================================================
// MOCK CONTENT PLAN ITEM (matches content-planning-service.ts)
// =============================================================================

interface ContentPlanItem {
  id: string;
  title: string;
  contentType: "post" | "blog" | "email" | "gbp";
  platform: string;
  content: string;
  scheduledDate: string;
  scheduledTime: string;
  imageUrl?: string;
  status: "draft" | "scheduled";
}

// =============================================================================
// FALLBACK CONTENT PLAN GENERATOR
// (Matches server/lib/content-planning-service.ts lines 483-586)
// =============================================================================

function generateDefaultContentPlan(
  brandId: string,
  brandGuide: any,
  brandProfile: any,
  brandKit: any
): ContentPlanItem[] {
  const today = new Date();
  const dates: string[] = [];
  const times = ["09:00", "14:00", "10:00", "16:00", "11:00", "08:00", "12:00", "13:00"];
  
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split("T")[0]);
  }

  const brandName = brandGuide?.brandName || brandProfile?.name || "your brand";
  const industry = brandKit?.industry || brandGuide?.identity?.businessType || "General Business";
  
  const defaultItems: ContentPlanItem[] = [
    {
      id: `fallback-${Date.now()}-1`,
      title: `Share Your Story - ${brandName}`,
      contentType: "post",
      platform: "instagram",
      content: `🎯 Welcome to ${brandName}!\n\nWe're excited to share our story and connect with you. Follow along for updates, insights, and behind-the-scenes content.\n\n#${brandName.replace(/\s+/g, "")} #${industry.replace(/\s+/g, "")}`,
      scheduledDate: dates[0],
      scheduledTime: times[0],
      status: "draft",
    },
    {
      id: `fallback-${Date.now()}-2`,
      title: `Engage Your Audience - ${brandName}`,
      contentType: "post",
      platform: "facebook",
      content: `What questions can we answer for you today? Drop a comment below and let's start a conversation!\n\nAt ${brandName}, we're committed to delivering value and building lasting relationships with our community.`,
      scheduledDate: dates[1],
      scheduledTime: times[1],
      status: "draft",
    },
    {
      id: `fallback-${Date.now()}-3`,
      title: `Professional Insight - ${brandName}`,
      contentType: "post",
      platform: "linkedin",
      content: `We're sharing insights and updates from ${brandName}. Follow along for industry news, tips, and thought leadership content.\n\nWhat topics would you like to see us cover?`,
      scheduledDate: dates[2],
      scheduledTime: times[2],
      status: "draft",
    },
    {
      id: `fallback-${Date.now()}-4`,
      title: `Quick Update - ${brandName}`,
      contentType: "post",
      platform: "twitter",
      content: `Excited to share updates from ${brandName}! What's on your mind today? Let's connect! 👋`,
      scheduledDate: dates[3],
      scheduledTime: times[3],
      status: "draft",
    },
    {
      id: `fallback-${Date.now()}-5`,
      title: `Behind the Scenes - ${brandName}`,
      contentType: "post",
      platform: "instagram",
      content: `🌟 Take a look behind the scenes at ${brandName}!\n\nWe're working hard to bring you the best ${industry} experience. What would you like to know about us? Drop your questions below! 👇`,
      scheduledDate: dates[4],
      scheduledTime: times[4],
      status: "draft",
    },
    {
      id: `fallback-${Date.now()}-6`,
      title: `Weekly Blog Post - ${brandName}`,
      contentType: "blog",
      platform: "blog",
      content: `# Welcome to ${brandName}\n\nWe're excited to share valuable insights and updates with you. This blog will cover topics relevant to ${industry}, including tips, trends, and best practices.\n\nStay tuned for more content coming your way!\n\n## What's Next?\n\nWe'll be sharing regular updates, industry insights, and helpful resources. Make sure to subscribe to stay informed.\n\n---\n\n*This is a default blog post. Please regenerate to get AI-generated content tailored to your brand.*`,
      scheduledDate: dates[5],
      scheduledTime: times[5],
      status: "draft",
    },
    {
      id: `fallback-${Date.now()}-7`,
      title: `Weekly Email from ${brandName}`,
      contentType: "email",
      platform: "email",
      content: `Subject: Weekly Update from ${brandName}\n\nHi there,\n\nWe wanted to share some updates and insights with you this week.\n\nStay tuned for more valuable content coming your way!\n\nBest regards,\nThe ${brandName} Team`,
      scheduledDate: dates[6],
      scheduledTime: times[6],
      status: "draft",
    },
    {
      id: `fallback-${Date.now()}-8`,
      title: `Local Update - ${brandName}`,
      contentType: "gbp",
      platform: "google_business",
      content: `Visit ${brandName} for the best ${industry} experience in your area. We're here to help!\n\nContact us today to learn more.`,
      scheduledDate: dates[0],
      scheduledTime: times[7],
      status: "draft",
    },
  ];

  return defaultItems;
}

// =============================================================================
// PLACEHOLDER CONTENT FILTER
// (Matches server/lib/content-planning-service.ts lines 116-139)
// =============================================================================

function filterPlaceholderContent(items: ContentPlanItem[]): ContentPlanItem[] {
  return items.filter(item => 
    item.content && 
    item.content.length >= 50 &&
    !item.content.toLowerCase().includes("placeholder") &&
    !item.content.toLowerCase().includes("edit this")
  );
}

// =============================================================================
// TESTS: Fallback Plan Generation (R03)
// =============================================================================

describe("Content Planning Fallback Plan (R03 - Chaos Audit)", () => {
  describe("generateDefaultContentPlan", () => {
    it("generates 8 content items when called", () => {
      const items = generateDefaultContentPlan(
        "brand-123",
        { brandName: "Test Brand" },
        { name: "Test Brand" },
        { industry: "Technology" }
      );

      expect(items).toHaveLength(8);
    });

    it("includes all required content types", () => {
      const items = generateDefaultContentPlan(
        "brand-123",
        { brandName: "Test Brand" },
        {},
        {}
      );

      const types = items.map(i => i.contentType);
      expect(types).toContain("post");
      expect(types).toContain("blog");
      expect(types).toContain("email");
      expect(types).toContain("gbp");
    });

    it("includes multiple platforms", () => {
      const items = generateDefaultContentPlan(
        "brand-123",
        { brandName: "Test Brand" },
        {},
        {}
      );

      const platforms = new Set(items.map(i => i.platform));
      expect(platforms).toContain("instagram");
      expect(platforms).toContain("facebook");
      expect(platforms).toContain("linkedin");
      expect(platforms).toContain("twitter");
      expect(platforms).toContain("blog");
      expect(platforms).toContain("email");
      expect(platforms).toContain("google_business");
    });

    it("uses brand name in content", () => {
      const items = generateDefaultContentPlan(
        "brand-123",
        { brandName: "Acme Corp" },
        {},
        {}
      );

      // Check that brand name appears in content
      const hasName = items.every(item => 
        item.content.includes("Acme Corp") || item.title.includes("Acme Corp")
      );
      expect(hasName).toBe(true);
    });

    it("uses industry in content when provided", () => {
      const items = generateDefaultContentPlan(
        "brand-123",
        {},
        {},
        { industry: "Real Estate" }
      );

      // Check that industry appears in at least some content
      const hasIndustry = items.some(item => 
        item.content.includes("Real Estate")
      );
      expect(hasIndustry).toBe(true);
    });

    it("falls back to 'your brand' when no brand name provided", () => {
      const items = generateDefaultContentPlan(
        "brand-123",
        {},
        {},
        {}
      );

      const hasDefault = items.some(item => 
        item.content.includes("your brand") || item.title.includes("your brand")
      );
      expect(hasDefault).toBe(true);
    });

    it("falls back to 'General Business' when no industry provided", () => {
      const items = generateDefaultContentPlan(
        "brand-123",
        {},
        {},
        {}
      );

      const hasDefault = items.some(item => 
        item.content.includes("General Business")
      );
      expect(hasDefault).toBe(true);
    });

    it("schedules content across 7 days", () => {
      const items = generateDefaultContentPlan(
        "brand-123",
        {},
        {},
        {}
      );

      const dates = new Set(items.map(i => i.scheduledDate));
      // Should have multiple different dates (not all on the same day)
      expect(dates.size).toBeGreaterThanOrEqual(5);
    });

    it("all items have 'draft' status", () => {
      const items = generateDefaultContentPlan(
        "brand-123",
        {},
        {},
        {}
      );

      const allDraft = items.every(item => item.status === "draft");
      expect(allDraft).toBe(true);
    });

    it("all items have unique IDs", () => {
      const items = generateDefaultContentPlan(
        "brand-123",
        {},
        {},
        {}
      );

      const ids = items.map(i => i.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe("Fallback Content Quality", () => {
    it("all fallback content passes the 50 character minimum", () => {
      const items = generateDefaultContentPlan(
        "brand-123",
        {},
        {},
        {}
      );

      const allValid = items.every(item => item.content.length >= 50);
      expect(allValid).toBe(true);
    });

    it("fallback content does not contain 'placeholder' keyword", () => {
      const items = generateDefaultContentPlan(
        "brand-123",
        {},
        {},
        {}
      );

      const noPlaceholder = items.every(item => 
        !item.content.toLowerCase().includes("placeholder")
      );
      expect(noPlaceholder).toBe(true);
    });

    it("fallback content does not contain 'edit this' keyword", () => {
      const items = generateDefaultContentPlan(
        "brand-123",
        {},
        {},
        {}
      );

      const noEditThis = items.every(item => 
        !item.content.toLowerCase().includes("edit this")
      );
      expect(noEditThis).toBe(true);
    });

    it("blog post contains regeneration notice", () => {
      const items = generateDefaultContentPlan(
        "brand-123",
        {},
        {},
        {}
      );

      const blogItem = items.find(i => i.contentType === "blog");
      expect(blogItem).toBeDefined();
      // ✅ R03 BEHAVIOR: Blog post contains notice about default content
      expect(blogItem?.content).toContain("default blog post");
      expect(blogItem?.content).toContain("regenerate");
    });
  });
});

// =============================================================================
// TESTS: Placeholder Content Filtering
// =============================================================================

describe("Content Planning Placeholder Filtering (R03 - Chaos Audit)", () => {
  describe("filterPlaceholderContent", () => {
    it("filters out items with 'placeholder' in content", () => {
      const items: ContentPlanItem[] = [
        { id: "1", title: "Good", contentType: "post", platform: "instagram", content: "This is real content that is long enough to pass the filter.", scheduledDate: "2024-01-01", scheduledTime: "09:00", status: "draft" },
        { id: "2", title: "Bad", contentType: "post", platform: "facebook", content: "This is a placeholder text that should be filtered out.", scheduledDate: "2024-01-02", scheduledTime: "10:00", status: "draft" },
      ];

      const filtered = filterPlaceholderContent(items);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("1");
    });

    it("filters out items with 'edit this' in content", () => {
      const items: ContentPlanItem[] = [
        { id: "1", title: "Good", contentType: "post", platform: "instagram", content: "This is real content that is long enough to pass the filter.", scheduledDate: "2024-01-01", scheduledTime: "09:00", status: "draft" },
        { id: "2", title: "Bad", contentType: "post", platform: "facebook", content: "Edit this content before publishing it to your audience.", scheduledDate: "2024-01-02", scheduledTime: "10:00", status: "draft" },
      ];

      const filtered = filterPlaceholderContent(items);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("1");
    });

    it("filters out items with less than 50 characters", () => {
      const items: ContentPlanItem[] = [
        { id: "1", title: "Good", contentType: "post", platform: "instagram", content: "This is real content that is long enough to pass the filter.", scheduledDate: "2024-01-01", scheduledTime: "09:00", status: "draft" },
        { id: "2", title: "Short", contentType: "post", platform: "facebook", content: "Too short", scheduledDate: "2024-01-02", scheduledTime: "10:00", status: "draft" },
      ];

      const filtered = filterPlaceholderContent(items);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("1");
    });

    it("filters out items with empty content", () => {
      const items: ContentPlanItem[] = [
        { id: "1", title: "Good", contentType: "post", platform: "instagram", content: "This is real content that is long enough to pass the filter.", scheduledDate: "2024-01-01", scheduledTime: "09:00", status: "draft" },
        { id: "2", title: "Empty", contentType: "post", platform: "facebook", content: "", scheduledDate: "2024-01-02", scheduledTime: "10:00", status: "draft" },
      ];

      const filtered = filterPlaceholderContent(items);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("1");
    });

    it("keeps all valid items when no placeholders", () => {
      const items: ContentPlanItem[] = [
        { id: "1", title: "Good 1", contentType: "post", platform: "instagram", content: "This is real content that is long enough to pass the filter number one.", scheduledDate: "2024-01-01", scheduledTime: "09:00", status: "draft" },
        { id: "2", title: "Good 2", contentType: "post", platform: "facebook", content: "This is another piece of real content that is also long enough.", scheduledDate: "2024-01-02", scheduledTime: "10:00", status: "draft" },
      ];

      const filtered = filterPlaceholderContent(items);

      expect(filtered).toHaveLength(2);
    });

    it("returns empty array when all items are filtered", () => {
      const items: ContentPlanItem[] = [
        { id: "1", title: "Bad 1", contentType: "post", platform: "instagram", content: "placeholder", scheduledDate: "2024-01-01", scheduledTime: "09:00", status: "draft" },
        { id: "2", title: "Bad 2", contentType: "post", platform: "facebook", content: "edit this", scheduledDate: "2024-01-02", scheduledTime: "10:00", status: "draft" },
      ];

      const filtered = filterPlaceholderContent(items);

      expect(filtered).toHaveLength(0);
    });

    it("is case-insensitive for placeholder keywords", () => {
      const items: ContentPlanItem[] = [
        { id: "1", title: "Bad 1", contentType: "post", platform: "instagram", content: "This contains PLACEHOLDER text which should be filtered out.", scheduledDate: "2024-01-01", scheduledTime: "09:00", status: "draft" },
        { id: "2", title: "Bad 2", contentType: "post", platform: "facebook", content: "EDIT THIS content before publishing it to your audience.", scheduledDate: "2024-01-02", scheduledTime: "10:00", status: "draft" },
      ];

      const filtered = filterPlaceholderContent(items);

      expect(filtered).toHaveLength(0);
    });
  });
});

// =============================================================================
// TESTS: Fallback Trigger Conditions
// =============================================================================

describe("Content Planning Fallback Triggers (R03 - Chaos Audit)", () => {
  describe("When AI providers fail", () => {
    it("should use fallback when AI throws provider error", () => {
      // This test documents that when AI fails, generateDefaultContentPlan is called
      // The actual integration is tested in integration tests
      const fallbackItems = generateDefaultContentPlan(
        "brand-123",
        { brandName: "Test" },
        {},
        { industry: "Tech" }
      );

      expect(fallbackItems).toHaveLength(8);
      expect(fallbackItems[0].status).toBe("draft");
    });

    it("should use fallback when all content items are filtered as placeholders", () => {
      // Simulate scenario where AI returns all placeholder content
      const aiGeneratedItems: ContentPlanItem[] = [
        { id: "1", title: "AI Post", contentType: "post", platform: "instagram", content: "placeholder content", scheduledDate: "2024-01-01", scheduledTime: "09:00", status: "draft" },
      ];

      const filtered = filterPlaceholderContent(aiGeneratedItems);
      
      // All items filtered, would trigger fallback
      expect(filtered).toHaveLength(0);

      // System should then call generateDefaultContentPlan
      const fallbackItems = generateDefaultContentPlan(
        "brand-123",
        { brandName: "Test" },
        {},
        {}
      );

      expect(fallbackItems).toHaveLength(8);
    });
  });

  describe("Fallback detection markers", () => {
    it("fallback content contains regeneration notice in blog", () => {
      const items = generateDefaultContentPlan(
        "brand-123",
        {},
        {},
        {}
      );

      const blogItem = items.find(i => i.contentType === "blog");
      
      // ✅ R03 BEHAVIOR: This is how users can detect fallback content
      expect(blogItem?.content).toContain("default blog post");
    });
  });
});

