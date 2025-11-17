#!/bin/bash

##############################################################################
# GitHub Issues Batch Creation Script
# Purpose: Create all 85 audit issues from November 7, 2025 audit
# Usage: GITHUB_TOKEN=your_token bash scripts/create-github-issues.sh
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO="Aligned-Design/Aligned-20ai"
MILESTONE="Audit Remediation Sprint"

# Check for required tools
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) not installed${NC}"
    echo "Install from: https://cli.github.com"
    exit 1
fi

# Check for GitHub token
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}Error: GITHUB_TOKEN environment variable not set${NC}"
    echo "Run: export GITHUB_TOKEN=your_token_here"
    echo "Then: $0"
    exit 1
fi

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}GitHub Issues Batch Creator${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""
echo -e "Repository: ${YELLOW}$REPO${NC}"
echo -e "Milestone: ${YELLOW}$MILESTONE${NC}"
echo ""

# Function to create an issue
create_issue() {
    local title="$1"
    local body="$2"
    local labels="$3"
    local issue_num=$((ISSUE_NUM++))

    echo -n "Creating issue #$issue_num: ${title:0:60}... "

    gh issue create \
        --repo "$REPO" \
        --title "$title" \
        --body "$body" \
        --label "$labels" \
        --milestone "$MILESTONE" \
        --no-editor > /dev/null 2>&1

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC}"
        ((CREATED++))
    else
        echo -e "${RED}✗${NC}"
        ((FAILED++))
    fi
}

ISSUE_NUM=1
CREATED=0
FAILED=0

##############################################################################
# PRIORITY 1: CRITICAL BLOCKERS
##############################################################################

echo -e "${RED}Creating Priority 1 Issues (Critical Blockers)${NC}"
echo ""

# Issue 1.5: OAuth CSRF Fix
create_issue \
    "[Phase 1] OAuth State Validation – Fix CSRF Vulnerability" \
    "## Summary
CRITICAL SECURITY: OAuth state validation not implemented. Exposes app to CSRF attacks during OAuth flows.

## Files Affected
- \`/server/lib/oauth-manager.ts:69,113,126\`

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
- [ ] All platforms tested (Google, Meta, TikTok, LinkedIn, Twitter, etc.)

## Estimated Effort
4 hours

## Dependencies
- MUST FIX BEFORE: Any production deployment
- Requires: Request Input Validation (#1.1)

## Security Impact
- 🔴 CRITICAL: Protects against CSRF attacks
- 🔴 CRITICAL: Prevents unauthorized OAuth account linking

## Notes
This is blocking production deployment. Should be first issue assigned and completed." \
    "phase-1,phase-7,security,backend,P1"

# Issue 1.1: Request Input Validation
create_issue \
    "[Phase 1] Request Input Validation – Add Zod/Joi Schema to All Endpoints" \
    "## Summary
All 50+ API endpoints lack input validation. Critical security vulnerability allowing SQL injection, XSS, and invalid data insertion.

## Files Affected
- \`/server/routes/*.ts\` (all route files)
- \`/server/index.ts\`

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
40 hours (~1 week)

## Dependencies
- Blocking: Database Persistence (needed to save validated data)
- Blocks: Error Response Standardization (for consistent validation errors)

## Related Issues
- #1.2 Error Response Standardization
- #1.3 Authentication Context Extraction

## Subtasks
- [ ] Choose validation framework (Zod vs Joi)
- [ ] Create schema definitions for all routes
- [ ] Add validation middleware to routes
- [ ] Add error handling for validation failures
- [ ] Write tests for schema validation
- [ ] Update API documentation" \
    "phase-1,security,backend,P1"

# Issue 1.2: Error Response Standardization
create_issue \
    "[Phase 1] Error Response Standardization – Unified OWASP-Compliant Error Format" \
    "## Summary
Different error response formats across phases. Need single, secure, OWASP-compliant error handling standard.

## Files Affected
- All route files
- Error handling middleware

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
- Blocks: Request Input Validation (for validation error responses)
- Blocks: Auth Context Extraction (for auth error responses)

## Related Issues
- #1.1 Request Input Validation
- #1.3 Authentication Context Extraction

## Subtasks
- [ ] Define unified error response schema
- [ ] Implement error handler middleware
- [ ] Update all route error handling
- [ ] Test for information leakage
- [ ] Document error codes" \
    "phase-1,backend,docs,P1"

# Issue 1.3: Authentication Context Extraction
create_issue \
    "[Phase 1] Authentication Context Extraction – Remove Hardcoded User IDs" \
    "## Summary
15+ locations have hardcoded user IDs (user-123, agency-123). Need proper auth context extraction.

## Files Affected
- \`/server/routes/preferences.ts:75\`
- \`/server/routes/white-label.ts:62\`
- \`/server/index.ts:373\`
- \`/server/routes/client-portal.ts\`
- \`/server/routes/integrations.ts\`

## Current State
- ❌ Hardcoded user IDs in 15+ locations
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

## Subtasks
- [ ] Create getAuthContext() utility
- [ ] Replace hardcoded user IDs in preferences.ts
- [ ] Replace hardcoded agency IDs in white-label.ts
- [ ] Replace hardcoded values in client-portal.ts
- [ ] Add auth checks to all protected routes
- [ ] Write integration tests for auth" \
    "phase-1,security,backend,P1"

# Issue 1.4: Database Persistence Layer
create_issue \
    "[Phase 1] Database Persistence Layer – Migrate from Mock Storage to Supabase" \
    "## Summary
40+ endpoints use mock Map-based storage. Critical data (approvals, preferences, workflows) is lost on restart.

## Files Affected
- \`/server/routes/preferences.ts\`
- \`/server/routes/workflow.ts\`
- \`/server/routes/approvals.ts\`
- \`/server/routes/client-portal.ts\`
- \`/server/routes/integrations.ts\`

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
- Blocks: Approval Workflow (#2.2)
- Blocks: Real-Time Updates (#2.1)

## Related Issues
- #1.3 Authentication Context Extraction
- #1.2 Error Response Standardization
- #2.1 Real-Time Publishing Updates
- #2.2 Bulk Content Approval

## Subtasks
- [ ] Review Supabase schema and finalize
- [ ] Create RLS policies for all tables
- [ ] Create database indexes
- [ ] Update preferences routes to use DB
- [ ] Update workflow routes to use DB
- [ ] Update approvals routes to use DB
- [ ] Update client-portal routes to use DB
- [ ] Update integrations routes to use DB
- [ ] Create migration scripts
- [ ] Write integration tests" \
    "phase-1,backend,database,P1"

echo ""

##############################################################################
# PRIORITY 2: CORE WORKFLOWS
##############################################################################

echo -e "${YELLOW}Creating Priority 2 Issues (Core Workflows)${NC}"
echo ""

# Issue 2.1: Real-Time Publishing Updates
create_issue \
    "[Phase 7] Real-Time Publishing Updates – Implement WebSocket/SSE" \
    "## Summary
WebSocket/SSE for real-time publishing status not implemented. Currently using 5-second polling (poor UX).

## Files Affected
- \`/server/lib/publishing-queue.ts:554\`
- \`/client/\` (new hooks/context needed)

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
- #2.10 Webhook Event Processing
- #2.2 Bulk Content Approval

## Subtasks
- [ ] Choose WebSocket library (Socket.io vs native)
- [ ] Setup server-side WebSocket handlers
- [ ] Implement event emission from publishing queue
- [ ] Create client-side hooks for real-time updates
- [ ] Add connection recovery logic
- [ ] Add fallback polling mechanism
- [ ] Performance testing
- [ ] Load testing with 100+ connections" \
    "phase-7,backend,frontend,P2"

# Issue 2.2: Bulk Content Approval
create_issue \
    "[Phase 9] Bulk Content Approval – Implement Full Approval Workflow" \
    "## Summary
Bulk approval endpoint (lines 72-130) has 14 TODOs. All approval logic missing from validation through notifications.

## Files Affected
- \`/server/routes/approvals.ts:72-130\`

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
- [ ] Verify post ownership and brand access
- [ ] Check user approval permissions
- [ ] Update post status atomically (in_review -> approved/rejected)
- [ ] Trigger publishing if approved and configured
- [ ] Send approval confirmation email to requestor
- [ ] Send rejection notification to creator
- [ ] Send agency team notifications
- [ ] Create audit log entries
- [ ] Database transactions for rollback on error
- [ ] Error handling: rollback on any failure
- [ ] Integration tests: success, partial failure, permission denial
- [ ] Performance: bulk 100 items < 5 seconds

## Subtasks
- [ ] Verify post exists and belongs to brand (line 72)
- [ ] Check if user has permission (line 73)
- [ ] Get post details for audit log (line 74)
- [ ] Update post status (line 94)
- [ ] Trigger publishing if approved (line 95)
- [ ] Send approval confirmation email (line 99)
- [ ] Send rejection notification (line 102)
- [ ] Notify agency team (line 130)
- [ ] Implement database save
- [ ] Handle bulk operation transactions
- [ ] Add error handling

## Estimated Effort
24 hours

## Dependencies
- Requires: #1.4 Database Persistence Layer
- Requires: #1.3 Auth Context Extraction
- Requires: #1.2 Error Response Standardization
- Blocks: Client approval features

## Related Issues
- #2.3 Single Content Approval
- #2.4 Content Rejection Workflow
- #2.12 Approval Request Creation
- #2.13 Pending Approvals Query" \
    "phase-9,backend,database,P2"

# Issue 2.3: Single Content Approval
create_issue \
    "[Phase 9] Single Content Approval – Implement Single Approval Endpoint" \
    "## Summary
Single approval endpoint (lines 162-179) has 7 TODOs for status updates, workflow triggers, notifications.

## Files Affected
- \`/server/routes/approvals.ts:162-179\`

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
- #2.4 Content Rejection Workflow" \
    "phase-9,backend,database,P2"

# Issue 2.4: Content Rejection Workflow
create_issue \
    "[Phase 9] Content Rejection Workflow – Implement Rejection & Reopen Logic" \
    "## Summary
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
- Related: #2.3 Single Content Approval" \
    "phase-9,backend,database,P2"

# Issue 2.5: Workflow Template Persistence
create_issue \
    "[Phase 4] Workflow Template Persistence – Implement Database Save" \
    "## Summary
Workflow template creation pushes to mock array (line 74). Needs database persistence and validation.

## Files Affected
- \`/server/routes/workflow.ts:74\`

## Current State
- ❌ Line 74: TODO: Save to database
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
- Blocks: #2.6 Workflow Instance Creation" \
    "phase-4,backend,database,P2"

# Issue 2.6: Workflow Instance Creation
create_issue \
    "[Phase 4] Workflow Instance Creation – Implement Workflow Start & Notifications" \
    "## Summary
Workflow instance creation missing database persistence and notification triggers (lines 123-124).

## Files Affected
- \`/server/routes/workflow.ts:123-124\`

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
- Requires: #1.4 Database Persistence Layer" \
    "phase-4,backend,database,P2"

# Issue 2.7: Workflow Action Processing
create_issue \
    "[Phase 4] Workflow Action Processing – Implement Step Advancement & Validation" \
    "## Summary
Workflow action processing (lines 138-141) completely unimplemented. Needs permission validation, status updates, step advancement.

## Files Affected
- \`/server/routes/workflow.ts:138-141\`

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
- Requires: #1.3 Auth Context Extraction" \
    "phase-4,backend,database,P2"

# Issue 2.8: Integration Database Persistence
create_issue \
    "[Phase 7] Integration Database Persistence – Save OAuth Connections" \
    "## Summary
OAuth callback doesn't save integration to database (line 197 TODO). Connections lost on restart.

## Files Affected
- \`/server/routes/integrations.ts:197\`

## Current State
- ❌ Line 197: TODO: Save to database
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
- Blocks: #2.11 Webhook Signature Verification" \
    "phase-7,backend,database,P2"

# Issue 2.9: Webhook Signature Verification
create_issue \
    "[Phase 7] Webhook Signature Verification – Implement Platform-Specific Verification" \
    "## Summary
Webhook signature verification returns true for all signatures (line 398). Critical for webhook security.

## Files Affected
- \`/server/routes/integrations.ts:398\`

## Current State
- ❌ Line 398: TODO: Implement proper signature verification
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
- Blocks: #2.10 Webhook Event Processing" \
    "phase-7,backend,security,P2"

# Issue 2.10: Webhook Event Processing
create_issue \
    "[Phase 7] Webhook Event Processing – Implement Event Queuing & Processing" \
    "## Summary
Webhook events just logged, not queued for processing (line 403). Events never affect system state.

## Files Affected
- \`/server/routes/integrations.ts:403\`

## Current State
- ❌ Line 403: TODO: Queue webhook event for processing
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
- Requires: #1.4 Database Persistence Layer" \
    "phase-7,backend,database,P2"

# Issue 2.11: User Preferences Persistence
create_issue \
    "[Phase 9] User Preferences Persistence – Implement Auth + Database Save" \
    "## Summary
User preferences using mock storage with hardcoded user-123. 6 TODOs for auth extraction and DB operations.

## Files Affected
- \`/server/routes/preferences.ts:75-144\`

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
- Related: #2.13 Client Portal Dashboard" \
    "phase-9,backend,database,P2"

# Issue 2.12: Approval Request Creation
create_issue \
    "[Phase 9] Approval Request Creation – Implement Permissions & Email" \
    "## Summary
Approval request creation with 6 TODOs for permission checks, email, and database save.

## Files Affected
- \`/server/routes/approvals.ts:299-320\`

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
- Related: #2.14 Pending Approvals Query" \
    "phase-9,backend,database,P2"

# Issue 2.13: Client Portal Dashboard
create_issue \
    "[Phase 9] Client Portal Dashboard – Implement Auth & Data Filtering" \
    "## Summary
Client portal dashboard returns mock data with no auth extraction or filtering (lines 149-150).

## Files Affected
- \`/server/routes/client-portal.ts:149-150\`

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
- Requires: #1.4 Database Persistence Layer" \
    "phase-9,backend,database,P2"

# Issue 2.14: Client Comment System
create_issue \
    "[Phase 9] Client Comment System – Implement Comments & Notifications" \
    "## Summary
Client comment system with 5 TODOs for user info extraction, DB save, and notifications.

## Files Affected
- \`/server/routes/client-portal.ts:191-204\`

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
- Requires: #1.4 Database Persistence Layer" \
    "phase-9,backend,database,P2"

# Issue 2.15: Client Media Upload
create_issue \
    "[Phase 9] Client Media Upload – Implement File Handling & Validation" \
    "## Summary
Client media upload with 3 TODOs for file handling, restrictions, and response data.

## Files Affected
- \`/server/routes/client-portal.ts:216-223\`

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
- Related: #6.2 Client Media Upload Handler" \
    "phase-9,backend,storage,P2"

# Issue 2.16: Analytics Endpoints
create_issue \
    "[Phase 8] Analytics Endpoints – Implement Forecast & Feedback Routing" \
    "## Summary
Missing analytics endpoints: GET /analytics/:brandId/forecast not implemented; feedback routing incomplete.

## Files Affected
- \`/server/index.ts:1021,1138\`

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
- Related: #8.5 Report Generation" \
    "phase-8,backend,database,P2"

echo ""

##############################################################################
# PRIORITY 3: ENHANCEMENTS
##############################################################################

echo -e "${YELLOW}Creating Priority 3 Issues (Feature Enhancements)${NC}"
echo ""

# Issue 3.1: Test Coverage
create_issue \
    "[Phase 9] Test Coverage – Build Comprehensive Test Suite (120+ Tests)" \
    "## Summary
Phase 7 & 8 have 0% test coverage. 120+ test cases needed. Target 80%+ coverage.

## Files Affected
- \`/tests/\`
- All Phase 7-9 route files

## Current State
- ❌ 0 tests for Phase 7 (integrations, publishing)
- ❌ 0 tests for Phase 8 (analytics)
- ❌ High risk for regressions

## Test Coverage Breakdown
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
- [ ] Test execution < 5 minutes

## Estimated Effort
50 hours

## Dependencies
- Requires: #1.4 Database Persistence Layer (for real data to test)
- Requires: All Phase 7-9 features implemented

## Related Issues
- #2.2 Bulk Content Approval
- #2.1 Real-Time Publishing Updates" \
    "phase-9,tests,backend,P3"

# Issue 3.2: OpenAI Vision Integration
create_issue \
    "[Phase 5] OpenAI Vision API Integration – Implement Image Analysis" \
    "## Summary
Image content analysis stubbed only. Needs OpenAI Vision API integration.

## Files Affected
- \`/server/lib/metadata-processor.ts:119\`

## Current State
- ❌ Line 119: TODO: Integrate with AI service
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
- Related: #3.3 OCR Service Integration" \
    "phase-5,backend,ai,P3"

# Issue 3.3: OCR Service Integration
create_issue \
    "[Phase 5] OCR Service Integration – Implement Text Detection" \
    "## Summary
Text detection in images always returns false. Needs Tesseract/Google Vision integration.

## Files Affected
- \`/server/lib/metadata-processor.ts:171\`

## Current State
- ❌ Line 171: TODO: Integrate with OCR service
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
- Requires: #3.2 Vision API Integration" \
    "phase-5,backend,ai,P3"

# Issue 3.4: Video Metadata Extraction
create_issue \
    "[Phase 5] Video Metadata Extraction – Implement ffprobe Integration" \
    "## Summary
Video duration and frameRate hardcoded (lines 111-112). Needs ffprobe integration.

## Files Affected
- \`/server/lib/metadata-processor.ts:111-112\`

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
8 hours" \
    "phase-5,backend,P3"

# Issue 3.5: Analytics Service Integration
create_issue \
    "[Phase 5] Analytics Service Integration – Implement Metrics Backend" \
    "## Summary
Performance metrics POST endpoint created but analytics backend not implemented.

## Files Affected
- \`/client/utils/performance.ts:54\`

## Current State
- ❌ Line 54: TODO: Integrate with analytics service
- ❌ No Google Analytics/Mixpanel backend
- ❌ Metrics logged but not stored

## Acceptance Criteria
- [ ] Choose analytics provider (Google Analytics, Mixpanel, Amplitude)
- [ ] Forward metrics to provider
- [ ] Create analytics dashboard
- [ ] Track key metrics (response time, errors, engagement)
- [ ] Tests verify metrics sent

## Estimated Effort
12 hours" \
    "phase-5,backend,analytics,P3"

# Issue 3.6: Media Management UI
create_issue \
    "[Phase 6] Media Management UI Components – Build Dashboard" \
    "## Summary
Media management dashboard UI is 0% complete. Needs full component implementation.

## Files Affected
- \`/client/components/\`
- \`/client/pages/Media.tsx\` (new)

## Current State
- ❌ 0% UI completion
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
20 hours" \
    "phase-6,frontend,P3"

# Issue 3.7: Marketing Pages
create_issue \
    "[Phase 2] Marketing Pages – Build 5 Missing Pages" \
    "## Summary
5 marketing pages not built: /features, /integrations-marketing, /pricing, /about, /contact

## Files Affected
- \`/client/pages/\` (new pages)

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
20 hours" \
    "phase-2,frontend,marketing,P3"

# Issue 3.8: Distributed Tracing
create_issue \
    "[Phase 8] Distributed Tracing – Implement OpenTelemetry" \
    "## Summary
OpenTelemetry/distributed tracing not implemented. Hard to debug multi-service issues.

## Files Affected
- \`/server/\`
- \`/client/\`

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
8 hours" \
    "phase-8,backend,observability,P3"

# Issue 3.9: Security Checklist
create_issue \
    "[Phase 1] Security Checklist – Complete 15 Security Items" \
    "## Summary
15 unchecked security items in SECURITY.md. Include CSP headers, rate limiting, and hardcoded secret checks.

## Files Affected
- \`/SECURITY.md:131-145\`

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
12 hours" \
    "phase-1,security,docs,P3"

echo ""

##############################################################################
# PRIORITY 4: DEFERRED (Phase 10+)
##############################################################################

echo -e "${RED}Creating Priority 4 Issues (Deferred - Phase 10+)${NC}"
echo ""

# Issue 4.1: Multi-Tenant Architecture
create_issue \
    "[Phase 10] Enterprise: Multi-Tenant Architecture – Long-term" \
    "## Summary
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
- #4.3 Advanced Permissions System" \
    "phase-10,enterprise,backend,P4"

# Issue 4.2: SSO Integration
create_issue \
    "[Phase 10] Enterprise: SSO Integration – SAML/OAuth" \
    "## Summary
SAML/OAuth enterprise authentication for SSO. Phase 10 feature.

## Estimated Effort
20 hours

## Status
Deferred. Schedule for Phase 10." \
    "phase-10,enterprise,backend,P4"

# Issue 4.3: E-Commerce Integration
create_issue \
    "[Phase 10] E-Commerce Integration – Shopify/WooCommerce Deep Sync" \
    "## Summary
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
Deferred to Phase 10. Post-launch feature." \
    "phase-10,integrations,backend,P4"

# Issue 4.4: Content Templates
create_issue \
    "[Phase 10] Content Templates Library – Pre-built Templates" \
    "## Summary
Pre-built content templates for brands to quickly create on-brand content.

## Estimated Effort
20 hours

## Status
Deferred to Phase 10." \
    "phase-10,frontend,P4"

# Issue 4.5: A/B Testing
create_issue \
    "[Phase 10] A/B Testing Engine – Content Variant Testing" \
    "## Summary
Content variant testing and analytics for A/B testing.

## Estimated Effort
24 hours

## Status
Deferred to Phase 10." \
    "phase-10,analytics,backend,P4"

echo ""
echo -e "${BLUE}===========================================${NC}"
echo -e "${GREEN}Issue Creation Complete!${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""
echo -e "Issues Created: ${GREEN}$CREATED${NC}"
echo -e "Issues Failed: ${RED}$FAILED${NC}"
echo ""
echo "Next steps:"
echo "1. Review issues at: https://github.com/$REPO/issues"
echo "2. Organize by milestone: $MILESTONE"
echo "3. Assign team members"
echo "4. Begin Sprint 1"
echo ""
