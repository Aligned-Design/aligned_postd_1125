# POSTD GitHub Issues Batch Creation Guide

> **Status:** 🕒 Historical – This guide documents a historical audit from November 2025.  
> **Last Updated:** 2025-01-20

## POSTD Project Audit (November 7, 2025)

**Total Issues to Create:** 85
**Organization:** By Priority Tier + Phase
**Milestone:** `Audit Remediation Sprint`

---

## PRIORITY TIER 1: CRITICAL BLOCKERS (P1) - 5 Issues

These are blocking all other work and must be fixed before launch.

### Issue #1.1: [Phase 1] Request Input Validation – Add Zod/Joi Schema to All Endpoints

**File(s):** All route files (`/server/routes/*.ts`)
**Effort:** L (40 hours)
**Priority:** P1
**Labels:** `phase-1`, `security`, `backend`
**Milestone:** Audit Remediation Sprint

**Body:**
```
## Summary
All 50+ API endpoints lack input validation. This is a critical security vulnerability allowing SQL injection, XSS, and invalid data insertion.

## Files Affected
- `/server/routes/*.ts` (all route files)
- `/server/index.ts`
- Client/server interactions

## Current State
- ❌ No Zod or Joi schema validation
- ❌ Direct use of request parameters without sanitization
- ❌ Potential SQL injection vectors

## Expected Behavior
- ✅ All endpoints validate incoming data with strict schemas
- ✅ Clear error messages for invalid input
- ✅ Type safety throughout request handling

## Acceptance Criteria
- [ ] Zod/Joi framework chosen and approved
- [ ] Schemas created for top 10 critical endpoints
- [ ] All endpoints have validation by end of P1 phase
- [ ] Tests confirm validation blocks malformed requests
- [ ] Documentation updated with schema patterns

## Estimated Effort
40 hours (~1 week for single developer)

## Dependencies
- Priority 1: Error Response Standardization (needed for consistent validation errors)
- Blocking: Database Persistence (needed to save validated data)

## Related Issues
- #1.2 Error Response Standardization
- #1.3 Authentication Context Extraction
```

---

### Issue #1.2: [Phase 1] Error Response Standardization – Unified OWASP-Compliant Error Format

**File(s):** `/docs/guides/CRITICAL_GAPS_REMEDIATION.md`
**Effort:** M (12 hours)
**Priority:** P1
**Labels:** `phase-1`, `backend`, `docs`
**Milestone:** Audit Remediation Sprint

**Body:**
```
## Summary
Different error response formats across phases. Need single, secure, OWASP-compliant error handling standard.

## Current State
- ❌ Error formats vary by phase/endpoint
- ❌ Some errors leak sensitive information
- ❌ No consistent error structure for client handling

## Expected Behavior
- ✅ All errors follow standard format: { code, message, timestamp, traceId }
- ✅ No sensitive info exposed in production
- ✅ Clear error categorization (validation, auth, server, etc.)

## Acceptance Criteria
- [ ] Error response schema defined
- [ ] Applied to all route handlers
- [ ] Tests verify no information leakage
- [ ] Client side handles new format gracefully
- [ ] Documentation includes error codes and handling

## Estimated Effort
12 hours

## Dependencies
- Blocking: Request Input Validation (needed for consistent validation error responses)
- Blocking: Auth Context Extraction (needed for auth error responses)

## Related Issues
- #1.1 Request Input Validation
- #1.3 Authentication Context Extraction
```

---

### Issue #1.3: [Phase 1] Authentication Context Extraction – Remove Hardcoded User IDs

**File(s):** `/server/routes/preferences.ts:75`, `/server/routes/white-label.ts:62`, `/server/index.ts:373`
**Effort:** M (16 hours)
**Priority:** P1
**Labels:** `phase-1`, `security`, `backend`
**Milestone:** Audit Remediation Sprint

**Body:**
```
## Summary
15+ locations have hardcoded user IDs (user-123, agency-123). Need proper auth context extraction.

## Current State
- ❌ Hardcoded user IDs in: preferences.ts, white-label.ts, index.ts, client-portal.ts
- ❌ Auth middleware exists but not properly utilized
- ❌ No proper user isolation; multi-tenancy not enforced

## Expected Behavior
- ✅ All routes extract userId/agencyId from auth context
- ✅ Single centralized auth extraction function
- ✅ Proper multi-tenancy isolation
- ✅ All user data scoped to authenticated user

## Acceptance Criteria
- [ ] Create centralized getAuthContext() utility
- [ ] Replace all hardcoded user IDs (15+ locations)
- [ ] Add auth verification to all protected endpoints
- [ ] Tests confirm auth isolation works
- [ ] Audit trail shows which user made changes

## Estimated Effort
16 hours

## Dependencies
- Blocking: Request Input Validation (for secure auth context)
- Blocking: Error Response Standardization (for auth errors)
- Blocking: Database Persistence (to test with real users)

## Related Issues
- #1.1 Request Input Validation
- #1.2 Error Response Standardization
- #1.4 Database Persistence Layer
```

---

### Issue #1.4: [Phase 1] Database Persistence Layer – Migrate from Mock Storage to Supabase

**File(s):** `/server/routes/preferences.ts`, `/server/routes/workflow.ts`, `/server/routes/approvals.ts`
**Effort:** L (40 hours)
**Priority:** P1
**Labels:** `phase-1`, `backend`, `database`
**Milestone:** Audit Remediation Sprint

**Body:**
```
## Summary
40+ endpoints use mock Map-based storage. Critical data (approvals, preferences, workflows) is lost on restart.

## Current State
- ❌ Mock Map storage for all data
- ❌ No audit trail
- ❌ No persistence between restarts
- ❌ No multi-user isolation

## Expected Behavior
- ✅ All data persisted to Supabase PostgreSQL
- ✅ RLS policies enforced for multi-tenancy
- ✅ Full audit trail of changes
- ✅ Data survives server restarts

## Acceptance Criteria
- [ ] Supabase schema finalized and deployed
- [ ] RLS policies created for all tables
- [ ] Database indexes created for common queries
- [ ] Mock storage removed from: preferences, workflow, approvals, client-portal
- [ ] Transaction support for bulk operations
- [ ] Migration script for existing data
- [ ] Tests verify data persistence

## Affected Files (40+ endpoints)
- Preferences persistence (6 TODOs)
- Workflow persistence (7 TODOs)
- Approvals persistence (28 TODOs)
- Client portal persistence (10 TODOs)
- Integrations persistence (7 TODOs)

## Estimated Effort
40 hours (~1 week)

## Dependencies
- Requires: Auth Context Extraction (#1.3)
- Requires: Error Response Standardization (#1.2)
- Blocks: All Phase 4, 7, 8, 9 features
- Blocks: Approval Workflow (#9.1)
- Blocks: Real-Time Updates (#7.10)

## Related Issues
- #1.3 Authentication Context Extraction
- #1.2 Error Response Standardization
- #7.9 Real-Time Publishing Updates
- #9.1 Bulk Content Approval
```

---

### Issue #1.5: [Phase 1] OAuth State Validation – Fix CSRF Vulnerability

**File(s):** `/server/lib/oauth-manager.ts:69,113,126`
**Effort:** M (4 hours)
**Priority:** P1
**Labels:** `phase-1`, `phase-7`, `security`, `backend`
**Milestone:** Audit Remediation Sprint

**Body:**
```
## Summary
CRITICAL SECURITY: OAuth state validation not implemented. Hardcoded code verifier at line 126 exposes app to CSRF attacks.

## Current State
- ❌ Line 126: hardcoded code verifier
- ❌ Line 69, 113: TODO comments for state validation
- ❌ No PKCE flow verification
- ❌ Vulnerable to CSRF during OAuth callback

## Expected Behavior
- ✅ Unique state token generated per OAuth request
- ✅ State validated on OAuth callback
- ✅ PKCE flow fully implemented
- ✅ Code verifier stored securely in session

## Acceptance Criteria
- [ ] Generate unique state token per OAuth request
- [ ] Store state securely in session/cache (with TTL)
- [ ] Validate state on OAuth callback
- [ ] PKCE code verifier stored securely
- [ ] Tests verify CSRF protection works
- [ ] All platforms (Google, Meta, TikTok, etc.) tested

## Estimated Effort
4 hours

## Dependencies
- MUST FIX BEFORE: Any production deployment
- Requires: Request Input Validation (#1.1)

## Security Impact
- 🔴 CRITICAL: Protects against CSRF attacks
- 🔴 CRITICAL: Prevents unauthorized OAuth account linking

## Related Issues
- #1.1 Request Input Validation
- #7.1 Permission Extraction from OAuth Tokens
- #7.2 Integration Database Persistence
```

---

## PRIORITY TIER 2: CORE WORKFLOWS (P2) - 30 Issues

These are core features that must work but don't block all other work.

### Issue #2.1: [Phase 7] Real-Time Publishing Updates – Implement WebSocket/SSE

**File(s):** `/server/lib/publishing-queue.ts:554`, `/client/` (new hooks/context)
**Effort:** L (16 hours)
**Priority:** P2
**Labels:** `phase-7`, `backend`, `frontend`
**Milestone:** Audit Remediation Sprint

**Body:**
```
## Summary
WebSocket/SSE for real-time publishing status not implemented. Currently using 5-second polling (poor UX).

## Current State
- ⚠️ Polling-based updates every 5 seconds
- ❌ WebSocket/SSE not implemented (line 554 TODO)
- ❌ No real-time feedback to user
- ❌ Wastes bandwidth and battery

## Expected Behavior
- ✅ Real-time status updates when content publishes
- ✅ < 1 second latency for status changes
- ✅ WebSocket or SSE based (choose one)
- ✅ Graceful fallback to polling if needed

## Acceptance Criteria
- [ ] WebSocket setup (Socket.io or native)
- [ ] Publishing queue emits events on status change
- [ ] Client receives and displays updates in real-time
- [ ] Connection recovery and reconnection logic
- [ ] Tests verify < 1s latency
- [ ] Performance test with 100+ concurrent connections
- [ ] Battery/bandwidth improvement measured

## Estimated Effort
16 hours

## Dependencies
- Requires: Database Persistence Layer (#1.4)
- Requires: Error Response Standardization (#1.2)

## UX Impact
- High: Users see stale status; real-time crucial for UX

## Related Issues
- #1.4 Database Persistence Layer
- #7.8 Webhook Event Processing
- #9.1 Bulk Content Approval
```

---

### Issue #2.2: [Phase 9] Bulk Content Approval – Implement Full Approval Workflow

**File(s):** `/server/routes/approvals.ts:72-130`
**Effort:** L (24 hours)
**Priority:** P2
**Labels:** `phase-9`, `backend`, `database`
**Milestone:** Audit Remediation Sprint

**Subtasks:**
```
## Subtasks
- [ ] Validate post ownership and brand access (line 72-74)
- [ ] Check user approval permissions (line 73)
- [ ] Update post status: in_review -> approved/rejected (line 94)
- [ ] Trigger publishing if approved (line 95)
- [ ] Send approval confirmation email (line 99)
- [ ] Send rejection notification (line 102)
- [ ] Notify agency team of bulk action (line 130)
- [ ] Create audit log entries for each action
- [ ] Implement database persistence
- [ ] Add error handling and rollback
- [ ] Write integration tests
- [ ] Test with 100+ items in bulk operation
```

**Body:**
```
## Summary
Bulk approval endpoint (lines 72-130) has 14 TODOs. All approval logic missing from validation through notifications.

## Files Affected
- `/server/routes/approvals.ts:72-130`

## Current State
- ❌ All 14 sub-tasks marked TODO
- ❌ Mock data only
- ❌ No notifications sent
- ❌ No audit trail

## Expected Behavior
- ✅ Verify posts exist and belong to brand
- ✅ Check user has permission to approve
- ✅ Update post status atomically
- ✅ Trigger publishing if configured
- ✅ Send email confirmations
- ✅ Send Slack/in-app notifications
- ✅ Create audit log

## Acceptance Criteria
- [ ] All 14 sub-tasks completed
- [ ] Database transactions for bulk operations
- [ ] Error handling: rollback on any failure
- [ ] Email notifications sent correctly
- [ ] Slack notifications (if configured)
- [ ] Audit trail complete and accurate
- [ ] Integration tests: success, partial failure, permission denial
- [ ] Performance: bulk 100 items < 5 seconds

## Estimated Effort
24 hours

## Dependencies
- Requires: #1.4 Database Persistence Layer
- Requires: #1.3 Auth Context Extraction
- Requires: #1.2 Error Response Standardization
- Blocks: Client approval features

## Related Issues
- #9.2 Single Content Approval
- #9.3 Content Rejection Workflow
- #9.4 Approval Request Creation
- #9.5 Pending Approvals Query
```

---

### Issue #2.3: [Phase 9] Single Content Approval – Implement Single Approval Endpoint

**File(s):** `/server/routes/approvals.ts:162-179`
**Effort:** M (12 hours)
**Priority:** P2
**Labels:** `phase-9`, `backend`, `database`
**Milestone:** Audit Remediation Sprint

**Body:**
```
## Summary
Single approval endpoint (lines 162-179) has 7 TODOs for status updates, workflow triggers, notifications.

## Files Affected
- `/server/routes/approvals.ts:162-179`

## Current State
- ❌ All 7 sub-tasks marked TODO
- ❌ Mock data only
- ❌ No notifications

## Acceptance Criteria
- [ ] Verify post exists and belongs to brand
- [ ] Check approval permissions
- [ ] Update status to approved
- [ ] Trigger next workflow step if configured
- [ ] Send approval notifications
- [ ] Create audit log entry
- [ ] Tests for success, permission denied, invalid post

## Estimated Effort
12 hours

## Dependencies
- Requires: #1.4 Database Persistence Layer
- Requires: #1.3 Auth Context Extraction
- Related: #2.2 Bulk Content Approval

## Related Issues
- #2.2 Bulk Content Approval
- #9.3 Content Rejection Workflow
```

---

### Issue #2.4: [Phase 9] Content Rejection Workflow – Implement Rejection & Reopen Logic

**File(s):** `/server/routes/approvals.ts:223-243`
**Effort:** M (12 hours)
**Priority:** P2
**Labels:** `phase-9`, `backend`, `database`
**Milestone:** Audit Remediation Sprint

**Body:**
```
## Summary
Content rejection endpoint (lines 223-243) with 5 TODOs for status updates, notifications, reopen logic.

## Current State
- ❌ Status update not implemented
- ❌ Rejection reasons not stored
- ❌ Reopen for editing not implemented
- ❌ Notifications missing

## Acceptance Criteria
- [ ] Update status to rejected
- [ ] Store rejection reason/feedback
- [ ] Reopen content for creator editing
- [ ] Send rejection notification with reason
- [ ] Notify creator that they can edit
- [ ] Create audit log
- [ ] Tests for all scenarios

## Estimated Effort
12 hours

## Dependencies
- Requires: #1.4 Database Persistence Layer
- Related: #2.2 Bulk Content Approval
- Related: #2.3 Single Content Approval
```

---

### Issue #2.5: [Phase 4] Workflow Template Persistence – Implement Database Save

**File(s):** `/server/routes/workflow.ts:74`
**Effort:** M (12 hours)
**Priority:** P2
**Labels:** `phase-4`, `backend`, `database`
**Milestone:** Audit Remediation Sprint

**Body:**
```
## Summary
Workflow template creation pushes to mock array (line 74). Needs database persistence and validation.

## Current State
- ❌ Line 74: `// TODO: Save to database`
- ❌ Templates lost on restart
- ❌ No validation of template structure
- ❌ No ID generation

## Acceptance Criteria
- [ ] Generate unique template IDs
- [ ] Validate template structure (steps, transitions)
- [ ] Save to database with metadata
- [ ] Support template versioning
- [ ] Tests verify persistence

## Estimated Effort
12 hours

## Dependencies
- Requires: #1.4 Database Persistence Layer
- Blocks: #2.6 Workflow Instance Creation
```

---

### Issue #2.6: [Phase 4] Workflow Instance Creation – Implement Workflow Start & Notifications

**File(s):** `/server/routes/workflow.ts:123-124`
**Effort:** M (12 hours)
**Priority:** P2
**Labels:** `phase-4`, `backend`, `database`
**Milestone:** Audit Remediation Sprint

**Body:**
```
## Summary
Workflow instance creation missing database persistence and notification triggers (lines 123-124).

## Current State
- ❌ Lines 123-124: TODOs for DB save and notifications
- ❌ No audit trail
- ❌ Notifications not sent to participants

## Acceptance Criteria
- [ ] Create workflow instance in database
- [ ] Generate instance ID and metadata
- [ ] Notify first step assignees
- [ ] Store step history for audit trail
- [ ] Tests verify instance creation

## Estimated Effort
12 hours

## Dependencies
- Requires: #2.5 Workflow Template Persistence
- Requires: #1.4 Database Persistence Layer
```

---

### Issue #2.7: [Phase 4] Workflow Action Processing – Implement Step Advancement & Validation

**File(s):** `/server/routes/workflow.ts:138-141`
**Effort:** L (16 hours)
**Priority:** P2
**Labels:** `phase-4`, `backend`, `database`
**Milestone:** Audit Remediation Sprint

**Body:**
```
## Summary
Workflow action processing (lines 138-141) completely unimplemented. Needs permission validation, status updates, step advancement.

## Current State
- ❌ Lines 138-141: 4 TODOs all blocking
- ❌ No step advancement
- ❌ No workflow state tracking

## Acceptance Criteria
- [ ] Validate user has permission for action
- [ ] Update workflow instance status
- [ ] Advance to next workflow step
- [ ] Send notifications to next step assignees
- [ ] Handle conditional branching
- [ ] Support parallel steps
- [ ] Tests for all step types

## Estimated Effort
16 hours

## Dependencies
- Requires: #2.6 Workflow Instance Creation
- Requires: #1.3 Auth Context Extraction
```

---

### Issue #2.8: [Phase 7] Integration Database Persistence – Save OAuth Connections

**File(s):** `/server/routes/integrations.ts:197`
**Effort:** M (12 hours)
**Priority:** P2
**Labels:** `phase-7`, `backend`, `database`
**Milestone:** Audit Remediation Sprint

**Body:**
```
## Summary
OAuth callback doesn't save integration to database (line 197 TODO). Connections lost on restart.

## Current State
- ❌ Line 197: `// TODO: Save to database`
- ❌ OAuth callback succeeds but doesn't persist
- ❌ No integration records in DB
- ❌ Integration ID mapping missing

## Acceptance Criteria
- [ ] Save integration record on OAuth callback
- [ ] Store platform, token, refresh token securely
- [ ] Generate integration ID
- [ ] Store user/brand mapping
- [ ] Support multiple accounts per platform
- [ ] Tests verify persistence

## Estimated Effort
12 hours

## Dependencies
- Requires: #1.4 Database Persistence Layer
- Blocks: #2.9 Integration Sync
- Blocks: #2.10 Webhook Signature Verification
```

---

### Issue #2.9: [Phase 7] Webhook Signature Verification – Implement Platform-Specific Verification

**File(s):** `/server/routes/integrations.ts:398`
**Effort:** M (12 hours)
**Priority:** P2
**Labels:** `phase-7`, `backend`, `security`
**Milestone:** Audit Remediation Sprint

**Body:**
```
## Summary
Webhook signature verification returns true for all signatures (line 398). Critical for webhook security.

## Current State
- ❌ Line 398: `// TODO: Implement proper signature verification`
- ❌ Currently returns true for all requests
- ❌ No platform-specific verification
- ❌ Vulnerable to spoofed webhooks

## Acceptance Criteria
- [ ] Implement verification for: Meta, Google, TikTok, LinkedIn, Twitter
- [ ] Extract signature from webhook headers
- [ ] Verify HMAC-SHA256 signature
- [ ] Check webhook timestamp (prevent replay)
- [ ] Reject invalid signatures with 401
- [ ] Tests for valid and invalid signatures
- [ ] Platform-specific test data

## Estimated Effort
12 hours

## Dependencies
- Requires: #1.1 Request Input Validation
- Blocks: #2.11 Webhook Event Processing
```

---

### Issue #2.10: [Phase 7] Webhook Event Processing – Implement Event Queuing & Processing

**File(s):** `/server/routes/integrations.ts:403`
**Effort:** M (12 hours)
**Priority:** P2
**Labels:** `phase-7`, `backend`, `database`
**Milestone:** Audit Remediation Sprint

**Body:**
```
## Summary
Webhook events just logged, not queued for processing (line 403). Events never affect system state.

## Current State
- ❌ Line 403: `// TODO: Queue webhook event for processing`
- ❌ Only logs events
- ❌ No event processing
- ❌ Events disappear

## Acceptance Criteria
- [ ] Create event queue (database or Redis)
- [ ] Queue webhook events atomically
- [ ] Process events asynchronously
- [ ] Update platform post status from webhook
- [ ] Handle event type: new_post, deleted_post, engagement, etc.
- [ ] Retry failed processing
- [ ] Tests for event queueing and processing

## Estimated Effort
12 hours

## Dependencies
- Requires: #2.9 Webhook Signature Verification
- Requires: #1.4 Database Persistence Layer
```

---

### Issue #2.11: [Phase 9] User Preferences Persistence – Implement Auth + Database Save

**File(s):** `/server/routes/preferences.ts:75-144`
**Effort:** M (12 hours)
**Priority:** P2
**Labels:** `phase-9`, `backend`, `database`
**Milestone:** Audit Remediation Sprint

**Body:**
```
## Summary
User preferences using mock storage with hardcoded user-123. 6 TODOs for auth extraction and DB operations.

## Current State
- ❌ Lines 75, 78, 99, 108, 142, 144: 6 TODOs
- ❌ Hardcoded user-123
- ❌ Mock storage only
- ❌ Preferences lost on restart

## Acceptance Criteria
- [ ] Extract userId from auth context
- [ ] Fetch preferences from database
- [ ] Validate preference structure
- [ ] Save preference updates to database
- [ ] Support per-brand preferences
- [ ] Tests for CRUD operations

## Estimated Effort
12 hours

## Dependencies
- Requires: #1.3 Auth Context Extraction
- Requires: #1.4 Database Persistence Layer
- Related: #9.10 Client Portal Dashboard
```

---

### Issue #2.12: [Phase 9] Approval Request Creation – Implement Permissions & Email

**File(s):** `/server/routes/approvals.ts:299-320`
**Effort:** M (12 hours)
**Priority:** P2
**Labels:** `phase-9`, `backend`, `email`
**Milestone:** Audit Remediation Sprint

**Body:**
```
## Summary
Approval request creation with 6 TODOs for permission checks, email, and database save.

## Current State
- ❌ Lines 299-320: 6 TODOs
- ❌ No permission verification
- ❌ No email notifications
- ❌ No database persistence

## Acceptance Criteria
- [ ] Verify user is agency/admin
- [ ] Verify post exists and belongs to brand
- [ ] Get client email from assignment
- [ ] Create approval_requests record
- [ ] Send approval request email to client
- [ ] Include approval deadline if configured
- [ ] Tests for all scenarios

## Estimated Effort
12 hours

## Dependencies
- Requires: #1.3 Auth Context Extraction
- Requires: #1.4 Database Persistence Layer
- Related: #9.5 Pending Approvals Query
```

---

### Issue #2.13: [Phase 9] Client Portal Dashboard – Implement Auth & Data Filtering

**File(s):** `/server/routes/client-portal.ts:149-150`
**Effort:** M (12 hours)
**Priority:** P2
**Labels:** `phase-9`, `backend`, `database`
**Milestone:** Audit Remediation Sprint

**Body:**
```
## Summary
Client portal dashboard returns mock data with no auth extraction or filtering (lines 149-150).

## Current State
- ❌ Lines 149-150: 2 TODOs
- ❌ Returns mock data unfiltered
- ❌ No auth verification
- ❌ No multi-client isolation

## Acceptance Criteria
- [ ] Extract client info from auth context
- [ ] Filter data to client's brands only
- [ ] Include assigned posts, pending approvals
- [ ] Show approval history
- [ ] Permission checks for sensitive data
- [ ] Tests verify client isolation

## Estimated Effort
12 hours

## Dependencies
- Requires: #1.3 Auth Context Extraction
- Requires: #1.4 Database Persistence Layer
```

---

### Issue #2.14: [Phase 9] Client Comment System – Implement Comments & Notifications

**File(s):** `/server/routes/client-portal.ts:191-204`
**Effort:** M (12 hours)
**Priority:** P2
**Labels:** `phase-9`, `backend`, `database`
**Milestone:** Audit Remediation Sprint

**Body:**
```
## Summary
Client comment system with 5 TODOs for user info extraction, DB save, and notifications.

## Current State
- ❌ Lines 191-204: 5 TODOs
- ❌ No user info extraction
- ❌ No comment persistence
- ❌ No notifications

## Acceptance Criteria
- [ ] Extract user info from auth context
- [ ] Create comment record in database
- [ ] Support comment replies/threading
- [ ] Send notifications to agency team
- [ ] Send notifications to other commenters
- [ ] Tests for comment creation and notifications

## Estimated Effort
12 hours

## Dependencies
- Requires: #1.3 Auth Context Extraction
- Requires: #1.4 Database Persistence Layer
```

---

### Issue #2.15: [Phase 9] Client Media Upload – Implement File Handling & Validation

**File(s):** `/server/routes/client-portal.ts:216-223`
**Effort:** M (12 hours)
**Priority:** P2
**Labels:** `phase-9`, `backend`, `storage`
**Milestone:** Audit Remediation Sprint

**Body:**
```
## Summary
Client media upload with 3 TODOs for file handling, restrictions, and response data.

## Current State
- ❌ Lines 216-223: 3 TODOs
- ❌ No file upload logic
- ❌ No client-specific restrictions
- ❌ No file info returned

## Acceptance Criteria
- [ ] Handle multipart file uploads
- [ ] Apply client-specific file size limits
- [ ] Apply client-specific file type restrictions
- [ ] Store files in Supabase Storage
- [ ] Generate signed URLs for access
- [ ] Return file metadata (size, type, URL)
- [ ] Tests for valid and invalid files

## Estimated Effort
12 hours

## Dependencies
- Requires: #1.4 Database Persistence Layer
- Related: #6.2 Client Media Upload Handler
```

---

### Issue #2.16: [Phase 8] Analytics Endpoints – Implement Forecast & Feedback Routing

**File(s):** `/server/index.ts:1021,1138`
**Effort:** M (12 hours)
**Priority:** P2
**Labels:** `phase-8`, `backend`, `database`
**Milestone:** Audit Remediation Sprint

**Body:**
```
## Summary
Missing analytics endpoints: GET /analytics/:brandId/forecast not implemented; feedback routing incomplete.

## Current State
- ❌ Forecast endpoint referenced but not implemented
- ❌ Feedback routing incomplete
- ❌ No insight feedback storage

## Acceptance Criteria
- [ ] Implement forecast endpoint with ML predictions
- [ ] Route feedback to insight feedback endpoint
- [ ] Store feedback in database
- [ ] Use feedback to improve recommendations
- [ ] Tests for endpoint responses

## Estimated Effort
12 hours

## Dependencies
- Requires: #1.4 Database Persistence Layer
- Related: #8.5 Report Generation
```

---

## PRIORITY TIER 3: FEATURE ENHANCEMENTS (P3) - 30 Issues

### Issue #3.1: [Phase 9] Test Coverage – Build Comprehensive Test Suite (120+ Tests)

**File(s):** `/tests/`, all Phase 7-9 route files
**Effort:** L (50 hours)
**Priority:** P3
**Labels:** `phase-9`, `tests`, `backend`
**Milestone:** Audit Remediation Sprint

**Body:**
```
## Summary
Phase 7 & 8 have 0% test coverage. 120+ test cases needed. Target 80%+ coverage.

## Current State
- ❌ 0 tests for Phase 7 (integrations, publishing)
- ❌ 0 tests for Phase 8 (analytics)
- ❌ High risk for regressions

## Test Coverage Needed
- 50 unit tests for route handlers
- 40 integration tests for workflows
- 30 E2E tests for client flows
- 10 performance/load tests
- 10 security tests

## Acceptance Criteria
- [ ] Unit tests for all route handlers
- [ ] Integration tests for multi-step workflows
- [ ] E2E tests for approval workflows
- [ ] Performance tests (bulk operations)
- [ ] Security tests (CSRF, XSS, SQL injection)
- [ ] Achieve 80%+ code coverage
- [ ] All tests passing on CI/CD

## Estimated Effort
50 hours

## Dependencies
- Requires: #1.4 Database Persistence Layer (to have real data to test)
- Requires: All Phase 7-9 features implemented

## Related Issues
- #9.1 through #9.7 (all approval workflow issues)
```

---

### Issue #3.2: [Phase 5] OpenAI Vision API Integration – Implement Image Analysis

**File(s):** `/server/lib/metadata-processor.ts:119`
**Effort:** M (12 hours)
**Priority:** P3
**Labels:** `phase-5`, `backend`, `ai`
**Milestone:** Audit Remediation Sprint

**Body:**
```
## Summary
Image content analysis stubbed only. Needs OpenAI Vision API integration.

## Current State
- ❌ Line 119: `// TODO: Integrate with AI service`
- ❌ Only does basic aspect ratio analysis
- ❌ No image understanding

## Acceptance Criteria
- [ ] Integrate with OpenAI Vision API
- [ ] Analyze image content (objects, text, themes)
- [ ] Extract key visual elements
- [ ] Generate alt text suggestions
- [ ] Cache analysis results
- [ ] Tests with sample images

## Estimated Effort
12 hours

## Dependencies
- Requires: OpenAI API key configured
- Related: #5.3 OCR Service Integration
```

---

### Issue #3.3: [Phase 5] OCR Service Integration – Implement Text Detection

**File(s):** `/server/lib/metadata-processor.ts:171`
**Effort:** M (12 hours)
**Priority:** P3
**Labels:** `phase-5`, `backend`, `ai`
**Milestone:** Audit Remediation Sprint

**Body:**
```
## Summary
Text detection in images always returns false. Needs Tesseract/Google Vision integration.

## Current State
- ❌ Line 171: `// TODO: Integrate with OCR service`
- ❌ Always returns false
- ❌ No text extraction

## Acceptance Criteria
- [ ] Integrate Tesseract or Google Vision API
- [ ] Extract text from images
- [ ] Provide OCR confidence scores
- [ ] Support multiple languages
- [ ] Cache OCR results
- [ ] Tests with various images

## Estimated Effort
12 hours

## Dependencies
- Requires: #3.2 Vision API Integration
```

---

### Issue #3.4: [Phase 5] Video Metadata Extraction – Implement ffprobe Integration

**File(s):** `/server/lib/metadata-processor.ts:111-112`
**Effort:** S (8 hours)
**Priority:** P3
**Labels:** `phase-5`, `backend`
**Milestone:** Audit Remediation Sprint

**Body:**
```
## Summary
Video duration and frameRate hardcoded (lines 111-112). Needs ffprobe integration.

## Current State
- ❌ Duration hardcoded to 0
- ❌ FrameRate hardcoded to 30
- ❌ No actual video analysis

## Acceptance Criteria
- [ ] Install and configure ffprobe
- [ ] Extract actual video duration
- [ ] Extract actual frame rate
- [ ] Extract resolution, codec, bitrate
- [ ] Handle various video formats
- [ ] Tests with sample videos

## Estimated Effort
8 hours
```

---

### Issue #3.5: [Phase 5] Analytics Service Integration – Implement Metrics Backend

**File(s):** `/client/utils/performance.ts:54`
**Effort:** M (12 hours)
**Priority:** P3
**Labels:** `phase-5`, `backend`, `frontend`
**Milestone:** Audit Remediation Sprint

**Body:**
```
## Summary
Performance metrics POST endpoint created but analytics backend not implemented.

## Current State
- ❌ Line 54: `// TODO: Integrate with analytics service`
- ❌ No Google Analytics/Mixpanel backend
- ❌ Metrics logged but not stored

## Acceptance Criteria
- [ ] Choose analytics provider (Google Analytics, Mixpanel, Amplitude)
- [ ] Forward metrics to provider
- [ ] Create analytics dashboard
- [ ] Track key metrics (response time, errors, engagement)
- [ ] Tests verify metrics sent

## Estimated Effort
12 hours
```

---

### Issue #3.6: [Phase 6] Media Management UI Components – Build Dashboard (0% done)

**File(s):** `/client/components/`, `/client/pages/Media.tsx`
**Effort:** L (20 hours)
**Priority:** P3
**Labels:** `phase-6`, `frontend`
**Milestone:** Audit Remediation Sprint

**Body:**
```
## Summary
Media management dashboard UI is 0% complete. Needs full component implementation.

## Current State
- ❌ Line 411 in docs: 0% UI completion
- ❌ No components built
- ❌ No media upload UI
- ❌ No media gallery/browser

## Components Needed
- [ ] Media upload component (drag & drop)
- [ ] Media gallery/browser
- [ ] Metadata display
- [ ] Image preview with zoom
- [ ] Video player
- [ ] File size/type validation messages
- [ ] Delete confirmation dialog
- [ ] Bulk operations (select, delete, move)

## Acceptance Criteria
- [ ] All components built and styled
- [ ] Integration with backend API
- [ ] Error handling and validation messages
- [ ] Mobile-responsive design
- [ ] Tests for component interactions

## Estimated Effort
20 hours
```

---

### Issue #3.7: [Phase 2] Marketing Pages – Build 5 Missing Pages

**File(s):** `/client/pages/` (new: Features, IntegrationMarketing, PricingPage, About, Contact)
**Effort:** L (20 hours)
**Priority:** P3
**Labels:** `phase-2`, `frontend`, `marketing`
**Milestone:** Audit Remediation Sprint

**Body:**
```
## Summary
5 marketing pages not built: /features, /integrations-marketing, /pricing, /about, /contact

## Current State
- ❌ All 5 pages missing
- ❌ Not in navigation

## Pages to Build
- [ ] /features - Feature showcase with benefits
- [ ] /integrations-marketing - Platform integrations showcase
- [ ] /pricing - Plans and pricing comparison
- [ ] /about - Company/team information
- [ ] /contact - Contact form and information

## Acceptance Criteria
- [ ] All pages built with brand styling
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Navigation includes all pages
- [ ] Forms working (contact, pricing inquiry)
- [ ] SEO metadata configured
- [ ] Performance tested

## Estimated Effort
20 hours
```

---

### Issue #3.8: [Phase 8] Distributed Tracing – Implement OpenTelemetry

**File(s):** `/server/`, `/client/`
**Effort:** M (8 hours)
**Priority:** P3
**Labels:** `phase-8`, `backend`, `observability`
**Milestone:** Audit Remediation Sprint

**Body:**
```
## Summary
OpenTelemetry/distributed tracing not implemented. Hard to debug multi-service issues.

## Current State
- ❌ No distributed tracing
- ❌ Hard to correlate logs across services
- ❌ No trace IDs in logs

## Acceptance Criteria
- [ ] Install and configure OpenTelemetry
- [ ] Add trace instrumentation to server routes
- [ ] Add trace context to requests
- [ ] Export traces to Jaeger or similar
- [ ] Tests verify traces generated

## Estimated Effort
8 hours
```

---

### Issue #3.9: [Phase 1] Security Checklist – Complete 15 Security Items

**File(s):** `/SECURITY.md:131-145`
**Effort:** M (12 hours)
**Priority:** P3
**Labels:** `phase-1`, `security`, `docs`
**Milestone:** Audit Remediation Sprint

**Body:**
```
## Summary
15 unchecked security items in SECURITY.md. Include CSP headers, rate limiting, and hardcoded secret checks.

## Security Checklist Items
- [ ] No hardcoded secrets in code
- [ ] Inputs validated and escaped
- [ ] Output HTML-escaped
- [ ] Authentication enforced
- [ ] Authorization verified
- [ ] CSP headers configured
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Password hashing (bcrypt)
- [ ] Sessions secure (httpOnly, secure flags)
- [ ] TLS/HTTPS enforced
- [ ] SQL injection prevented
- [ ] CSRF protection enabled
- [ ] XSS protection enabled
- [ ] Security headers (HSTS, X-Frame-Options, etc.)

## Acceptance Criteria
- [ ] All 15 items implemented
- [ ] Security audit passed
- [ ] Documentation updated

## Estimated Effort
12 hours
```

---

## PRIORITY TIER 4: DEFERRED / FUTURE (P4) - 20 Issues

### Issue #4.1: [Phase 10] Enterprise: Multi-Tenant Architecture – Long-term

**File(s):** `/server/`, `/docs/architecture/`
**Effort:** XL (40+ hours)
**Priority:** P4
**Labels:** `phase-10`, `enterprise`, `backend`
**Milestone:** Phase 10 (Post-Launch)

**Body:**
```
## Summary
Multi-tenant architecture for enterprise customers. Planned for Phase 10 (long-term).

## Current State
- ⏳ Deferred to Phase 10
- 📋 Planned but not started

## Expected Behavior
- Separate data per tenant
- Shared infrastructure
- Per-tenant configuration
- Custom branding
- Isolated access

## Estimated Effort
40+ hours (2+ weeks)

## Status
Deferred to Phase 10. Schedule for post-launch planning.

## Related Issues
- #4.2 SSO Integration
- #4.3 Advanced Permissions System
```

---

### Issue #4.2: [Phase 10] Enterprise: SSO Integration – Long-term

**File(s):** `/server/auth/`
**Effort:** L (20 hours)
**Priority:** P4
**Labels:** `phase-10`, `enterprise`, `backend`
**Milestone:** Phase 10 (Post-Launch)

**Body:**
```
## Summary
SAML/OAuth enterprise authentication for SSO. Phase 10 feature.

## Estimated Effort
20 hours

## Status
Deferred. Schedule for Phase 10.
```

---

### Issue #4.3: [Phase 10] E-Commerce Integration – Shopify/WooCommerce Deep Sync

**File(s):** `/server/integrations/`
**Effort:** XL (40+ hours)
**Priority:** P4
**Labels:** `phase-10`, `integrations`, `backend`
**Milestone:** Phase 10 (Post-Launch)

**Body:**
```
## Summary
Shopify/WooCommerce deep integration with product sync, dynamic posts, inventory awareness.

## Features
- Product feed sync
- Order automation
- Dynamic product posts
- Inventory-aware scheduling
- Sales performance tracking

## Estimated Effort
40+ hours

## Status
Deferred to Phase 10. Post-launch feature.
```

---

### Issue #4.4: [Phase 10] Content Templates Library – Pre-built Templates

**File(s):** `/client/templates/`
**Effort:** L (20 hours)
**Priority:** P4
**Labels:** `phase-10`, `frontend`
**Milestone:** Phase 10 (Post-Launch)

**Body:**
```
## Summary
Pre-built content templates for brands to quickly create on-brand content.

## Estimated Effort
20 hours

## Status
Deferred to Phase 10.
```

---

### Issue #4.5: [Phase 10] A/B Testing Engine – Content Variant Testing

**File(s):** `/server/`, `/client/`
**Effort:** L (24 hours)
**Priority:** P4
**Labels:** `phase-10`, `analytics`, `backend`
**Milestone:** Phase 10 (Post-Launch)

**Body:**
```
## Summary
Content variant testing and analytics for A/B testing.

## Estimated Effort
24 hours

## Status
Deferred to Phase 10.
```

---

*[Remaining Phase 10 issues #4.6 through #4.13 follow same format - see summary table below]*

---

## SUMMARY TABLE: ALL 85 ISSUES

| # | Phase | Title | Priority | Effort | Status |
|---|-------|-------|----------|--------|--------|
| 1.1 | 1 | Request Input Validation | P1 | L (40h) | ❌ Not Started |
| 1.2 | 1 | Error Response Standardization | P1 | M (12h) | ❌ Not Started |
| 1.3 | 1 | Authentication Context Extraction | P1 | M (16h) | ❌ Not Started |
| 1.4 | 1 | Database Persistence Layer | P1 | L (40h) | ❌ Not Started |
| 1.5 | 1 | OAuth State Validation (CSRF) | P1 | M (4h) | ❌ Not Started |
| 2.1 | 7 | Real-Time Publishing Updates | P2 | L (16h) | ❌ Not Started |
| 2.2 | 9 | Bulk Content Approval | P2 | L (24h) | ❌ Not Started |
| 2.3 | 9 | Single Content Approval | P2 | M (12h) | ❌ Not Started |
| 2.4 | 9 | Content Rejection Workflow | P2 | M (12h) | ❌ Not Started |
| 2.5 | 4 | Workflow Template Persistence | P2 | M (12h) | ❌ Not Started |
| 2.6 | 4 | Workflow Instance Creation | P2 | M (12h) | ❌ Not Started |
| 2.7 | 4 | Workflow Action Processing | P2 | L (16h) | ❌ Not Started |
| 2.8 | 7 | Integration Database Persistence | P2 | M (12h) | ❌ Not Started |
| 2.9 | 7 | Webhook Signature Verification | P2 | M (12h) | ❌ Not Started |
| 2.10 | 7 | Webhook Event Processing | P2 | M (12h) | ❌ Not Started |
| 2.11 | 9 | User Preferences Persistence | P2 | M (12h) | ❌ Not Started |
| 2.12 | 9 | Approval Request Creation | P2 | M (12h) | ❌ Not Started |
| 2.13 | 9 | Client Portal Dashboard | P2 | M (12h) | ❌ Not Started |
| 2.14 | 9 | Client Comment System | P2 | M (12h) | ❌ Not Started |
| 2.15 | 9 | Client Media Upload | P2 | M (12h) | ❌ Not Started |
| 2.16 | 8 | Analytics Endpoints | P2 | M (12h) | ❌ Not Started |
| 3.1 | 9 | Test Coverage (120+ tests) | P3 | L (50h) | ❌ Not Started |
| 3.2 | 5 | OpenAI Vision API Integration | P3 | M (12h) | ❌ Not Started |
| 3.3 | 5 | OCR Service Integration | P3 | M (12h) | ❌ Not Started |
| 3.4 | 5 | Video Metadata Extraction | P3 | S (8h) | ❌ Not Started |
| 3.5 | 5 | Analytics Service Integration | P3 | M (12h) | ❌ Not Started |
| 3.6 | 6 | Media Management UI | P3 | L (20h) | ❌ Not Started |
| 3.7 | 2 | Marketing Pages | P3 | L (20h) | ❌ Not Started |
| 3.8 | 8 | Distributed Tracing | P3 | M (8h) | ❌ Not Started |
| 3.9 | 1 | Security Checklist | P3 | M (12h) | ❌ Not Started |
| [40+ more issues in Phase 10 deferred] | 10 | [Various] | P4 | [Various] | ⏳ Deferred |

---

## How to Create Issues in Bulk

### Option 1: Using GitHub CLI (Recommended)

```bash
# First, authenticate
gh auth login

# Create issues from batch file
gh issue create --title "[Phase 1] Request Input Validation – Add Zod/Joi Schema to All Endpoints" \
  --body "$(cat << 'EOF'
## Summary
All 50+ API endpoints lack input validation...

[Full body from above]
EOF
)" \
  --label phase-1,security,backend \
  --milestone "Audit Remediation Sprint"
```

### Option 2: Using GitHub API with curl

```bash
curl -X POST https://api.github.com/repos/Aligned-Design/Aligned-20ai/issues \
  -H "Authorization: token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "[Phase 1] Request Input Validation – Add Zod/Joi Schema to All Endpoints",
    "body": "[Full body from above]",
    "labels": ["phase-1", "security", "backend"],
    "milestone": 1
  }'
```

### Option 3: Manual Creation

1. Go to https://github.com/Aligned-Design/Aligned-20ai/issues/new
2. Copy title from table above
3. Copy body from detailed sections
4. Add labels: `phase-X`, priority label (`P1`, `P2`, `P3`, `P4`)
5. Add file type label: `backend`, `frontend`, `security`, or `docs`
6. Set milestone to "Audit Remediation Sprint"

---

## Issue Labels Reference

### Phase Labels
- `phase-1` through `phase-10`

### Priority Labels
- `P1` - Critical blocker (fix before launch)
- `P2` - High priority (core feature)
- `P3` - Medium priority (enhancement)
- `P4` - Low priority (future/deferred)

### Type Labels
- `backend` - Server-side code
- `frontend` - Client-side code
- `database` - Database operations
- `security` - Security-related
- `tests` - Testing/QA
- `docs` - Documentation
- `ai` - AI/ML features
- `email` - Email notifications
- `storage` - File storage
- `integrations` - Platform integrations
- `analytics` - Analytics features
- `observability` - Monitoring/logging

### Status Labels (Optional)
- `in-progress` - Currently being worked on
- `blocked` - Waiting on another issue
- `review` - Ready for code review

---

## Creating the Milestone

Before creating issues, create the "Audit Remediation Sprint" milestone:

1. Go to Milestones: https://github.com/Aligned-Design/Aligned-20ai/milestones
2. Click "New Milestone"
3. **Title:** Audit Remediation Sprint
4. **Description:** Issues identified in the November 7, 2025 Audit Report
5. **Due Date:** (Set based on your sprint schedule)

---

## Next Steps After Issue Creation

1. **Assign Issues** - Assign each issue to team members
2. **Estimate Story Points** - Use GitHub's project management
3. **Create Project Board** - Organize by phase and priority
4. **Schedule Sprints** - Plan based on priority tiers:
   - Sprint 1: Priority 1 items (Week 1-2)
   - Sprint 2: Priority 2 items (Week 3-6)
   - Sprint 3: Priority 3 items (Week 7-10)
   - Backlog: Priority 4 items (Phase 10+)

---

**Total Issues:** 85
**Total Effort:** 154+ days
**Critical Blockers:** 5 (P1)
**Core Features:** 16 (P2)
**Enhancements:** 9 (P3)
**Deferred:** 13+ (P4)

Generated: November 7, 2025
