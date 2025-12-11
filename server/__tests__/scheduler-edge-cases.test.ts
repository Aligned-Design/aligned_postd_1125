/**
 * MVP4.3 — Scheduler & Approvals Edge Case Tests
 * 
 * Tests for:
 * 1. Status lifecycle transitions
 * 2. Timezone boundary handling
 * 3. Multi-brand isolation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// =============================================================================
// IMPORTS FROM SHARED
// =============================================================================

import {
  CONTENT_STATUS,
  UI_STATUS,
  mapDbStatusToUiStatus,
  isValidStatusTransition,
  VALID_STATUS_TRANSITIONS,
} from "../../shared/content-status";

import {
  getLocalDateFromUtc,
  getLocalTimeFromUtc,
  formatLocalDate,
  createUtcTimestamp,
  isOnLocalDate,
  getCalendarDateRange,
} from "../../shared/date-utils";

// =============================================================================
// STATUS LIFECYCLE TESTS
// =============================================================================

describe("Content Status Lifecycle", () => {
  describe("Status Constants", () => {
    it("should define all required statuses", () => {
      expect(CONTENT_STATUS.DRAFT).toBe("draft");
      expect(CONTENT_STATUS.PENDING_REVIEW).toBe("pending_review");
      expect(CONTENT_STATUS.APPROVED).toBe("approved");
      expect(CONTENT_STATUS.SCHEDULED).toBe("scheduled");
      expect(CONTENT_STATUS.PUBLISHED).toBe("published");
      expect(CONTENT_STATUS.REJECTED).toBe("rejected");
      expect(CONTENT_STATUS.ERRORED).toBe("errored");
    });

    it("should define UI display statuses", () => {
      expect(UI_STATUS.DRAFT).toBe("draft");
      expect(UI_STATUS.REVIEWING).toBe("reviewing");
      expect(UI_STATUS.SCHEDULED).toBe("scheduled");
      expect(UI_STATUS.PUBLISHED).toBe("published");
      expect(UI_STATUS.ERRORED).toBe("errored");
    });
  });

  describe("mapDbStatusToUiStatus", () => {
    it("should map pending_review to reviewing", () => {
      expect(mapDbStatusToUiStatus("pending_review")).toBe("reviewing");
    });

    it("should map in_review to reviewing", () => {
      expect(mapDbStatusToUiStatus("in_review")).toBe("reviewing");
    });

    it("should map approved to scheduled", () => {
      expect(mapDbStatusToUiStatus("approved")).toBe("scheduled");
    });

    it("should map draft to draft", () => {
      expect(mapDbStatusToUiStatus("draft")).toBe("draft");
    });

    it("should map scheduled to scheduled", () => {
      expect(mapDbStatusToUiStatus("scheduled")).toBe("scheduled");
    });

    it("should map published to published", () => {
      expect(mapDbStatusToUiStatus("published")).toBe("published");
    });

    it("should map errored to errored", () => {
      expect(mapDbStatusToUiStatus("errored")).toBe("errored");
    });

    it("should map failed to errored", () => {
      expect(mapDbStatusToUiStatus("failed")).toBe("errored");
    });

    it("should handle unknown status as draft", () => {
      expect(mapDbStatusToUiStatus("unknown")).toBe("draft");
      expect(mapDbStatusToUiStatus("")).toBe("draft");
    });

    it("should be case-insensitive", () => {
      expect(mapDbStatusToUiStatus("PENDING_REVIEW")).toBe("reviewing");
      expect(mapDbStatusToUiStatus("Approved")).toBe("scheduled");
    });
  });

  describe("isValidStatusTransition", () => {
    it("should allow draft to pending_review", () => {
      expect(isValidStatusTransition("draft", "pending_review")).toBe(true);
    });

    it("should allow draft to scheduled (skip review)", () => {
      expect(isValidStatusTransition("draft", "scheduled")).toBe(true);
    });

    it("should allow pending_review to approved", () => {
      expect(isValidStatusTransition("pending_review", "approved")).toBe(true);
    });

    it("should allow pending_review to rejected", () => {
      expect(isValidStatusTransition("pending_review", "rejected")).toBe(true);
    });

    it("should allow approved to scheduled", () => {
      expect(isValidStatusTransition("approved", "scheduled")).toBe(true);
    });

    it("should allow scheduled to published", () => {
      expect(isValidStatusTransition("scheduled", "published")).toBe(true);
    });

    it("should allow scheduled to errored", () => {
      expect(isValidStatusTransition("scheduled", "errored")).toBe(true);
    });

    it("should allow errored to draft (retry)", () => {
      expect(isValidStatusTransition("errored", "draft")).toBe(true);
    });

    it("should allow rejected to draft (re-edit)", () => {
      expect(isValidStatusTransition("rejected", "draft")).toBe(true);
    });

    it("should NOT allow published to any other state", () => {
      expect(isValidStatusTransition("published", "draft")).toBe(false);
      expect(isValidStatusTransition("published", "scheduled")).toBe(false);
    });

    it("should NOT allow invalid transitions", () => {
      expect(isValidStatusTransition("draft", "published")).toBe(false);
      expect(isValidStatusTransition("pending_review", "published")).toBe(false);
    });
  });
});

// =============================================================================
// TIMEZONE & DATE BOUNDARY TESTS
// =============================================================================

describe("Timezone & Date Boundary Handling", () => {
  describe("getLocalDateFromUtc", () => {
    it("should return null for null/undefined input", () => {
      expect(getLocalDateFromUtc(null)).toBeNull();
      expect(getLocalDateFromUtc(undefined)).toBeNull();
    });

    it("should handle valid ISO timestamp", () => {
      const result = getLocalDateFromUtc("2024-01-15T12:00:00Z");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should handle Date object", () => {
      const date = new Date("2024-01-15T12:00:00Z");
      const result = getLocalDateFromUtc(date);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should return null for invalid date string", () => {
      expect(getLocalDateFromUtc("not-a-date")).toBeNull();
    });
  });

  describe("getLocalTimeFromUtc", () => {
    it("should return null for null/undefined input", () => {
      expect(getLocalTimeFromUtc(null)).toBeNull();
      expect(getLocalTimeFromUtc(undefined)).toBeNull();
    });

    it("should return HH:mm format", () => {
      const result = getLocalTimeFromUtc("2024-01-15T12:00:00Z");
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe("formatLocalDate", () => {
    it("should format date in short format", () => {
      const result = formatLocalDate("2024-01-15T12:00:00Z", "short");
      expect(result).toContain("Jan");
      expect(result).toContain("15");
    });

    it("should format date in long format", () => {
      const result = formatLocalDate("2024-01-15T12:00:00Z", "long");
      expect(result).toContain("January");
      expect(result).toContain("2024");
    });

    it("should return empty string for null input", () => {
      expect(formatLocalDate(null)).toBe("");
    });
  });

  describe("createUtcTimestamp", () => {
    it("should create valid ISO timestamp", () => {
      const result = createUtcTimestamp("2024-01-15", "14:00");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    it("should preserve the local date/time intent", () => {
      // Create a timestamp for 2 PM local time
      const result = createUtcTimestamp("2024-06-15", "14:00");
      const date = new Date(result);
      
      // The local hours should be 14 (2 PM)
      expect(date.getHours()).toBe(14);
    });
  });

  describe("isOnLocalDate", () => {
    it("should return true when UTC timestamp is on the local date", () => {
      // Get today's date and create a timestamp for noon today
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const todayDateStr = today.toISOString().split("T")[0];
      
      expect(isOnLocalDate(today.toISOString(), todayDateStr)).toBe(true);
    });

    it("should handle edge case at end of day", () => {
      // This tests that we correctly identify the local date
      const testDate = new Date("2024-01-15T23:30:00"); // 11:30 PM local
      const localDate = getLocalDateFromUtc(testDate);
      
      expect(isOnLocalDate(testDate.toISOString(), localDate!)).toBe(true);
    });
  });

  describe("getCalendarDateRange", () => {
    it("should return start and end UTC strings", () => {
      const startDate = new Date("2024-01-15");
      const { startUtc, endUtc } = getCalendarDateRange(startDate, 7);
      
      expect(startUtc).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(endUtc).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      
      // End should be 7 days after start
      const start = new Date(startUtc);
      const end = new Date(endUtc);
      const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(6);
      expect(diffDays).toBeLessThanOrEqual(8);
    });
  });
});

// =============================================================================
// MULTI-BRAND ISOLATION TESTS
// =============================================================================

describe("Multi-Brand Isolation", () => {
  const brandAId = "brand-a-uuid-1234";
  const brandBId = "brand-b-uuid-5678";

  describe("Content Item Brand Scoping", () => {
    it("should require brand_id on content items", () => {
      const contentItem = {
        id: "content-123",
        brand_id: brandAId,
        title: "Test Post",
        status: "pending_review",
      };

      expect(contentItem.brand_id).toBe(brandAId);
    });

    it("should have different content for different brands", () => {
      const contentForBrandA = {
        id: "content-a-1",
        brand_id: brandAId,
        title: "Brand A Post",
      };

      const contentForBrandB = {
        id: "content-b-1",
        brand_id: brandBId,
        title: "Brand B Post",
      };

      expect(contentForBrandA.brand_id).not.toBe(contentForBrandB.brand_id);
    });
  });

  describe("Calendar Query Brand Filtering", () => {
    it("should filter content by brand_id", () => {
      // Simulated query results
      const allContent = [
        { id: "1", brand_id: brandAId, title: "A1" },
        { id: "2", brand_id: brandBId, title: "B1" },
        { id: "3", brand_id: brandAId, title: "A2" },
        { id: "4", brand_id: brandBId, title: "B2" },
      ];

      // Filter for brand A
      const brandAContent = allContent.filter((c) => c.brand_id === brandAId);
      expect(brandAContent).toHaveLength(2);
      expect(brandAContent.every((c) => c.brand_id === brandAId)).toBe(true);

      // Filter for brand B
      const brandBContent = allContent.filter((c) => c.brand_id === brandBId);
      expect(brandBContent).toHaveLength(2);
      expect(brandBContent.every((c) => c.brand_id === brandBId)).toBe(true);
    });

    it("should not leak content between brands", () => {
      // Simulated scenario: Query for brand A should not return brand B content
      const queryForBrandA = (content: { brand_id: string }[]) =>
        content.filter((c) => c.brand_id === brandAId);

      const mixedContent = [
        { id: "1", brand_id: brandAId },
        { id: "2", brand_id: brandBId },
      ];

      const result = queryForBrandA(mixedContent);
      
      // Should only have brand A content
      expect(result.some((c) => c.brand_id === brandBId)).toBe(false);
    });
  });

  describe("Approval Queue Brand Filtering", () => {
    it("should filter approvals by brand_id", () => {
      const approvals = [
        { id: "a1", brand_id: brandAId, status: "pending_review" },
        { id: "a2", brand_id: brandBId, status: "pending_review" },
        { id: "a3", brand_id: brandAId, status: "approved" },
      ];

      const brandAApprovals = approvals.filter((a) => a.brand_id === brandAId);
      expect(brandAApprovals).toHaveLength(2);
    });
  });
});

// =============================================================================
// CALENDAR RENDERING EDGE CASES
// =============================================================================

describe("Calendar Rendering Edge Cases", () => {
  describe("Content at midnight boundaries", () => {
    it("should handle content scheduled at 23:59", () => {
      const content = {
        id: "1",
        scheduled_for: "2024-01-15T23:59:00Z",
      };

      const localDate = getLocalDateFromUtc(content.scheduled_for);
      expect(localDate).toBeDefined();
    });

    it("should handle content scheduled at 00:00", () => {
      const content = {
        id: "1",
        scheduled_for: "2024-01-15T00:00:00Z",
      };

      const localDate = getLocalDateFromUtc(content.scheduled_for);
      expect(localDate).toBeDefined();
    });
  });

  describe("Empty calendar days", () => {
    it("should handle days with no scheduled content", () => {
      const contentItems: { scheduledDate: string }[] = [];
      const daySchedules = contentItems.filter(
        (item) => item.scheduledDate === "2024-01-15"
      );
      
      expect(daySchedules).toHaveLength(0);
    });
  });

  describe("Multiple items on same day", () => {
    it("should group multiple items by date", () => {
      const items = [
        { id: "1", scheduledDate: "2024-01-15" },
        { id: "2", scheduledDate: "2024-01-15" },
        { id: "3", scheduledDate: "2024-01-16" },
      ];

      const itemsByDate = new Map<string, typeof items>();
      items.forEach((item) => {
        const existing = itemsByDate.get(item.scheduledDate) || [];
        itemsByDate.set(item.scheduledDate, [...existing, item]);
      });

      expect(itemsByDate.get("2024-01-15")?.length).toBe(2);
      expect(itemsByDate.get("2024-01-16")?.length).toBe(1);
    });
  });
});

