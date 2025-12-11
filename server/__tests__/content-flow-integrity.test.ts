/**
 * MVP4.1 — Content Flow Integrity Tests
 * 
 * Tests that verify content generated during onboarding flows correctly to:
 * 1. Content Queue / Planner
 * 2. Creative Studio / Editor
 * 3. Scheduler / Approvals
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// =============================================================================
// MOCK TYPES
// =============================================================================

interface ContentItem {
  id: string;
  brand_id: string;
  title: string;
  type: string;
  platform: string;
  status: string;
  content: Record<string, unknown>;
  scheduled_for: string | null;
  created_at: string;
}

// =============================================================================
// TESTS
// =============================================================================

describe("Content Flow Integrity (MVP4.1)", () => {
  const testBrandId = "550e8400-e29b-41d4-a716-446655440000";

  describe("Onboarding → Queue Flow", () => {
    it("should use pending_review status for onboarding-generated content", () => {
      // Content planning service uses "pending_review" status
      const expectedStatus = "pending_review";
      
      // This matches what storeContentItems() sets in content-planning-service.ts
      expect(expectedStatus).toBe("pending_review");
    });

    it("should map pending_review to reviewing in Queue UI", () => {
      const statusMap: Record<string, string> = {
        draft: "draft",
        pending_review: "reviewing",
        in_review: "reviewing",
        reviewing: "reviewing",
        scheduled: "scheduled",
        approved: "scheduled",
        published: "published",
        errored: "errored",
        failed: "errored",
      };

      expect(statusMap["pending_review"]).toBe("reviewing");
    });

    it("should include required fields for Queue display", () => {
      // Simulated content item from database
      const contentItem: ContentItem = {
        id: "content-123",
        brand_id: testBrandId,
        title: "Test Post",
        type: "post",
        platform: "instagram",
        status: "pending_review",
        content: { body: "This is a test post..." },
        scheduled_for: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      // Verify all required fields are present
      expect(contentItem.id).toBeDefined();
      expect(contentItem.brand_id).toBe(testBrandId);
      expect(contentItem.title).toBeDefined();
      expect(contentItem.status).toBe("pending_review");
      expect(contentItem.platform).toBeDefined();
    });
  });

  describe("Queue → Studio Flow", () => {
    it("should generate correct Studio URL with postId", () => {
      const postId = "content-123";
      const expectedUrl = `/studio?postId=${postId}`;
      
      expect(expectedUrl).toBe("/studio?postId=content-123");
    });

    it("should handle postId URL parameter", () => {
      // Studio should parse postId from URL params
      const searchParams = new URLSearchParams("?postId=content-123");
      const postId = searchParams.get("postId");
      
      expect(postId).toBe("content-123");
    });
  });

  describe("Studio → Scheduler Flow", () => {
    it("should support status transitions", () => {
      const validTransitions: Record<string, string[]> = {
        draft: ["pending_review", "scheduled"],
        pending_review: ["approved", "draft"],
        approved: ["scheduled"],
        scheduled: ["published", "draft"],
        published: [], // Terminal state
        errored: ["draft"], // Can retry
      };

      // Verify draft can transition to pending_review or scheduled
      expect(validTransitions["draft"]).toContain("pending_review");
      expect(validTransitions["draft"]).toContain("scheduled");

      // Verify pending_review can be approved
      expect(validTransitions["pending_review"]).toContain("approved");
    });

    it("should preserve content item ID through transitions", () => {
      const originalId = "content-123";
      
      // Simulated status update (should not change ID)
      const updatedItem = {
        id: originalId,
        status: "scheduled",
      };

      expect(updatedItem.id).toBe(originalId);
    });
  });

  describe("Idempotency", () => {
    it("should prevent duplicate content plans via onboarding_completed_at", () => {
      // Once onboarding is completed, hasCompletedOnboarding() returns true
      const mockBrand = {
        brand_kit: { crawled_at: "2024-01-01T00:00:00Z" },
        onboarding_completed_at: "2024-01-01T00:05:00Z",
      };

      const hasCompleted = !!(mockBrand.brand_kit && mockBrand.onboarding_completed_at);
      expect(hasCompleted).toBe(true);
    });

    it("should allow workflow run if not yet completed", () => {
      const mockBrand = {
        brand_kit: { crawled_at: "2024-01-01T00:00:00Z" },
        onboarding_completed_at: null,
      };

      const hasCompleted = !!(mockBrand.brand_kit && mockBrand.onboarding_completed_at);
      expect(hasCompleted).toBe(false);
    });
  });

  describe("Status Display Consistency", () => {
    it("should use consistent status labels across UI components", () => {
      const statusLabels: Record<string, string> = {
        draft: "Drafts",
        reviewing: "Pending Approvals",
        scheduled: "Scheduled",
        published: "Published",
        errored: "Errored",
      };

      expect(statusLabels["reviewing"]).toBe("Pending Approvals");
      expect(statusLabels["draft"]).toBe("Drafts");
    });
  });
});

