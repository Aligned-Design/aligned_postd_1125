/**
 * Content Status Constants
 * 
 * Single source of truth for content item status values used across:
 * - Database (content_items.status)
 * - Queue UI
 * - Calendar UI
 * - Scheduler/Approvals
 * - Content Planning Service
 * 
 * Status Lifecycle:
 *   draft → pending_review → approved → scheduled → published
 *                ↓
 *            rejected (loops back to draft)
 *                ↓
 *            errored (can retry → draft)
 */

/**
 * Database status values (stored in content_items.status)
 */
export const CONTENT_STATUS = {
  /** Initial state - content is being created/edited */
  DRAFT: "draft",
  /** Content submitted for review/approval */
  PENDING_REVIEW: "pending_review",
  /** Content approved by reviewer */
  APPROVED: "approved",
  /** Content scheduled for future publication */
  SCHEDULED: "scheduled",
  /** Content successfully published to platform(s) */
  PUBLISHED: "published",
  /** Content rejected by reviewer - needs edits */
  REJECTED: "rejected",
  /** Publishing failed - needs attention */
  ERRORED: "errored",
} as const;

export type ContentStatusValue = (typeof CONTENT_STATUS)[keyof typeof CONTENT_STATUS];

/**
 * UI display status values (used in Queue, Calendar)
 * Maps DB status to user-friendly display
 */
export const UI_STATUS = {
  DRAFT: "draft",
  REVIEWING: "reviewing",
  SCHEDULED: "scheduled",
  PUBLISHED: "published",
  ERRORED: "errored",
} as const;

export type UIStatusValue = (typeof UI_STATUS)[keyof typeof UI_STATUS];

/**
 * Map database status to UI display status
 */
export function mapDbStatusToUiStatus(dbStatus: string): UIStatusValue {
  const statusMap: Record<string, UIStatusValue> = {
    [CONTENT_STATUS.DRAFT]: UI_STATUS.DRAFT,
    [CONTENT_STATUS.PENDING_REVIEW]: UI_STATUS.REVIEWING,
    "in_review": UI_STATUS.REVIEWING,
    "reviewing": UI_STATUS.REVIEWING,
    [CONTENT_STATUS.APPROVED]: UI_STATUS.SCHEDULED,
    [CONTENT_STATUS.SCHEDULED]: UI_STATUS.SCHEDULED,
    [CONTENT_STATUS.PUBLISHED]: UI_STATUS.PUBLISHED,
    [CONTENT_STATUS.ERRORED]: UI_STATUS.ERRORED,
    "failed": UI_STATUS.ERRORED,
  };

  return statusMap[dbStatus?.toLowerCase()] || UI_STATUS.DRAFT;
}

/**
 * Statuses that should appear in the Queue "Pending Approvals" section
 */
export const PENDING_APPROVAL_STATUSES = [
  CONTENT_STATUS.PENDING_REVIEW,
] as const;

/**
 * Statuses that should appear in the Calendar
 */
export const CALENDAR_VISIBLE_STATUSES = [
  CONTENT_STATUS.SCHEDULED,
  CONTENT_STATUS.APPROVED,
  CONTENT_STATUS.PUBLISHED,
] as const;

/**
 * Statuses that are considered "active" (not archived/deleted)
 */
export const ACTIVE_STATUSES = [
  CONTENT_STATUS.DRAFT,
  CONTENT_STATUS.PENDING_REVIEW,
  CONTENT_STATUS.APPROVED,
  CONTENT_STATUS.SCHEDULED,
  CONTENT_STATUS.PUBLISHED,
] as const;

/**
 * Valid status transitions
 */
export const VALID_STATUS_TRANSITIONS: Record<ContentStatusValue, ContentStatusValue[]> = {
  [CONTENT_STATUS.DRAFT]: [CONTENT_STATUS.PENDING_REVIEW, CONTENT_STATUS.SCHEDULED],
  [CONTENT_STATUS.PENDING_REVIEW]: [CONTENT_STATUS.APPROVED, CONTENT_STATUS.REJECTED, CONTENT_STATUS.DRAFT],
  [CONTENT_STATUS.APPROVED]: [CONTENT_STATUS.SCHEDULED, CONTENT_STATUS.DRAFT],
  [CONTENT_STATUS.SCHEDULED]: [CONTENT_STATUS.PUBLISHED, CONTENT_STATUS.DRAFT, CONTENT_STATUS.ERRORED],
  [CONTENT_STATUS.PUBLISHED]: [], // Terminal state
  [CONTENT_STATUS.REJECTED]: [CONTENT_STATUS.DRAFT],
  [CONTENT_STATUS.ERRORED]: [CONTENT_STATUS.DRAFT, CONTENT_STATUS.SCHEDULED],
};

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(
  fromStatus: ContentStatusValue,
  toStatus: ContentStatusValue
): boolean {
  const validTargets = VALID_STATUS_TRANSITIONS[fromStatus] || [];
  return validTargets.includes(toStatus);
}

/**
 * UI Status labels for display
 */
export const STATUS_LABELS: Record<UIStatusValue, string> = {
  [UI_STATUS.DRAFT]: "Drafts",
  [UI_STATUS.REVIEWING]: "Pending Approvals",
  [UI_STATUS.SCHEDULED]: "Scheduled",
  [UI_STATUS.PUBLISHED]: "Published",
  [UI_STATUS.ERRORED]: "Errored",
};

