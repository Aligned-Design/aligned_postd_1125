# Content Status Model — Canonical Reference

> **Status:** ✅ Active — Canonical source for all status enums  
> **Last Updated:** 2025-12-12  
> **Maintained By:** Engineering Team

---

## Purpose

This document defines the **canonical status values** for all content-related entities in POSTD. When documentation conflicts, **this document is the source of truth** for status enums.

**Precedence:** This doc reflects `shared/content-status.ts` (code) as the ultimate authority.

---

## Status Hierarchies

### 1. Content Items Status (`content_items.status`)

**Source:** `shared/content-status.ts` lines 22-37  
**Database Column:** `content_items.status` (TEXT)

**Allowed Values:**

| Status | Value | Description | Typical Next State |
|--------|-------|-------------|-------------------|
| **DRAFT** | `"draft"` | Initial state - content being created/edited | `pending_review` |
| **PENDING_REVIEW** | `"pending_review"` | Content submitted for review/approval | `approved` or `rejected` |
| **APPROVED** | `"approved"` | Content approved by reviewer | `scheduled` |
| **SCHEDULED** | `"scheduled"` | Content scheduled for future publication | `published` |
| **PUBLISHED** | `"published"` | Content successfully published to platform(s) | *(terminal state)* |
| **REJECTED** | `"rejected"` | Content rejected by reviewer - needs edits | `draft` (loop back) |
| **ERRORED** | `"errored"` | Publishing failed - needs attention | `draft` (retry) |

**Status Lifecycle Flow:**

```
draft → pending_review → approved → scheduled → published
           ↓                                        
        rejected (loops back to draft)
           ↓
        errored (can retry → draft)
```

**Default Value:** `"draft"` (from schema default)

**Code Reference:**
- **TypeScript Constants:** `shared/content-status.ts` (lines 22-37)
- **Type Definition:** `shared/content-status.ts` line 39 (`ContentStatusValue`)
- **Schema:** `supabase/migrations/001_bootstrap_schema.sql` (content_items table)

---

### 2. Publishing Jobs Status (`publishing_jobs.status`)

**Source:** `supabase/migrations/001_bootstrap_schema.sql` lines 199-215  
**Database Column:** `publishing_jobs.status` (TEXT)

**Allowed Values:**

| Status | Value | Description | Typical Next State |
|--------|-------|-------------|-------------------|
| **PENDING** | `"pending"` | Job queued, not yet processing | `processing` |
| **PROCESSING** | `"processing"` | Job currently being executed | `completed` or `failed` |
| **COMPLETED** | `"completed"` | Job successfully finished | *(terminal state)* |
| **FAILED** | `"failed"` | Job failed (check error_message) | `pending` (retry) or terminal |
| **CANCELLED** | `"cancelled"` | Job manually cancelled | *(terminal state)* |

**Status Lifecycle Flow:**

```
pending → processing → completed
             ↓
          failed (may retry → pending)
             ↓
        cancelled (manual)
```

**Default Value:** `"pending"`

**Code Reference:**
- **Schema:** `supabase/migrations/001_bootstrap_schema.sql` lines 199-215
- **Application Logic:** `server/routes/publishing.ts`, `server/workers/publishing-worker.ts`

**⚠️ NOTE:** A query for `status = 'draft'` was found in `POSTD_STUDIO_PUBLISHING_VERIFICATION_AUDIT.md:1082`, but `"draft"` is **NOT** a valid publishing_jobs status. This may be a documentation error or test artifact.

---

### 3. Approval Status (`post_approvals.status`)

**Source:** `supabase/migrations/001_bootstrap_schema.sql` (approvals table)  
**Database Column:** `post_approvals.status` (TEXT)

**Allowed Values:**

| Status | Value | Description | Typical Next State |
|--------|-------|-------------|-------------------|
| **DRAFT** | `"draft"` | Approval request created but not sent | `ready_for_client` |
| **READY_FOR_CLIENT** | `"ready_for_client"` | Ready to send to client | `awaiting_client` |
| **AWAITING_CLIENT** | `"awaiting_client"` | Sent to client, waiting for response | `approved` or `rejected` |
| **APPROVED** | `"approved"` | Client approved the content | *(terminal state)* |
| **REJECTED** | `"rejected"` | Client rejected the content | *(terminal state or loop to draft)* |

**Status Lifecycle Flow:**

```
draft → ready_for_client → awaiting_client → approved
                                   ↓
                               rejected
```

**Code Reference:**
- **Schema:** `supabase/migrations/001_bootstrap_schema.sql` (post_approvals table)
- **Application Logic:** `server/routes/approvals.ts`

---

## UI Status Mapping

**Problem:** Database statuses may not be user-friendly for display.

**Solution:** `shared/content-status.ts` defines `UI_STATUS` for display purposes.

**UI Statuses:**

| UI Status | Display As | Maps From DB Statuses |
|-----------|------------|----------------------|
| **draft** | "Draft" | `draft` |
| **reviewing** | "In Review" | `pending_review`, `in_review`, `reviewing` |
| **scheduled** | "Scheduled" | `approved`, `scheduled` |
| **published** | "Published" | `published` |
| **errored** | "Error" | `errored`, `failed` |

**Code Reference:** `shared/content-status.ts` lines 42-72 (`mapDbStatusToUiStatus`)

---

## Transition Rules

### Content Items

**Allowed Transitions:**

| From | To | Condition |
|------|-----|-----------|
| `draft` | `pending_review` | User submits for review |
| `pending_review` | `approved` | Reviewer approves |
| `pending_review` | `rejected` | Reviewer rejects |
| `rejected` | `draft` | User edits and resubmits |
| `approved` | `scheduled` | User sets publish date |
| `scheduled` | `published` | Publishing job succeeds |
| `scheduled` | `errored` | Publishing job fails |
| `errored` | `draft` | User retries after fixing issue |

**Invalid Transitions:**
- ❌ `published` → any other status (published is terminal)
- ❌ `draft` → `scheduled` (must go through approval)
- ❌ `pending_review` → `scheduled` (must be approved first)

**Code Reference:** `shared/content-status.ts` lines 83-104 (`canTransitionStatus`)

---

## Historical Conflicts (Resolved)

### Conflict #1: `archived` vs `errored`

**Issue:** `server/types/database.ts:97` defined `ContentItem.status` as `'draft' | 'scheduled' | 'published' | 'archived'`, but `shared/content-status.ts` does NOT include `'archived'`.

**Resolution:** `shared/content-status.ts` is correct (7 statuses including `errored`). The `database.ts` type is **outdated** and should be updated to match `ContentStatusValue` from `shared/content-status.ts`.

**Action Required:** Update `server/types/database.ts:97` to use `ContentStatusValue` type from `shared/content-status.ts`.

---

### Conflict #2: `failed` vs `errored`

**Issue:** Some docs use `"failed"` while code uses `"errored"`.

**Resolution:** For **content_items**, use `"errored"` (from `shared/content-status.ts`). For **publishing_jobs**, use `"failed"` (from schema).

**Mapping:** UI layer maps both `"failed"` and `"errored"` to display as "Error" (see `mapDbStatusToUiStatus` line 68).

---

## When to Use This Document

**Use this doc when:**
- ✅ Writing new code that handles content status
- ✅ Updating UI to display status
- ✅ Writing database queries with status filters
- ✅ Documenting workflows or user journeys
- ✅ Resolving conflicts between documentation

**Code is the source of truth:**
- For content_items: `shared/content-status.ts`
- For publishing_jobs: `supabase/migrations/001_bootstrap_schema.sql`
- For approvals: `supabase/migrations/001_bootstrap_schema.sql`

**This doc reflects code, not the other way around.**

---

## Related Documentation

- **API Contract:** `POSTD_API_CONTRACT.md` (endpoint request/response with status fields)
- **Brand Guide Lifecycle:** `docs/BRAND_GUIDE_LIFECYCLE.md` (user journey with status transitions)
- **Database Schema:** `supabase/migrations/001_bootstrap_schema.sql` (table definitions)

---

**Questions?** See [DOCS_INDEX.md](../../DOCS_INDEX.md) or open an issue.

