# API Surface Map

Complete inventory of all API endpoints in the POSTD codebase.

**Last Updated:** 2025-01-20  
**Server Entry Point:** `server/index-v2.ts` (primary), `server/index.ts` (legacy, deprecated)  
**Framework:** Express.js with TypeScript  
**Base URL:** `/api` (development: `http://localhost:8080/api`)

**Related Documentation:**
- [System Architecture Diagrams](SYSTEM_ARCHITECTURE_DIAGRAMS.md) - Visual system flows showing how APIs integrate with the full system

---

## Table of Contents

- [Health & Diagnostics](#health--diagnostics)
- [Authentication](#authentication)
- [AI Agents](#ai-agents)
- [Brands](#brands)
- [Brand Guide](#brand-guide)
- [Onboarding](#onboarding)
- [Content Planning](#content-planning)
- [Media](#media)
- [Analytics](#analytics)
- [Approvals](#approvals)
- [Publishing](#publishing)
- [Integrations](#integrations)
- [Workflow](#workflow)
- [Notifications](#notifications)
- [Milestones](#milestones)
- [Admin](#admin)
- [Billing](#billing)
- [Trial](#trial)
- [Calendar](#calendar)
- [Search](#search)
- [Client Portal](#client-portal)
- [Client Settings](#client-settings)
- [Orchestration](#orchestration)
- [Content Packages](#content-packages)
- [Crawler](#crawler)
- [Escalations](#escalations)
- [Reviews](#reviews)
- [Webhooks](#webhooks)

---

## Health & Diagnostics

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| GET | `/health` | `health.ts` | No | Basic health check |
| GET | `/api/health` | `health.ts` | No | Health check (alias) |
| GET | `/api/health/ai` | `health.ts` | No | AI service status |
| GET | `/api/health/supabase` | `health.ts` | No | Supabase connection check |
| GET | `/api/ping` | `index-v2.ts` | No | Simple ping endpoint |
| GET | `/api/demo` | `demo.ts` | No | Demo endpoint for testing |
| GET | `/api/debug` | `debug-health.ts` | No | Comprehensive system diagnostics |
| GET | `/api/agents/health` | `agents-health.ts` | No | Agents service health check |

---

## Authentication

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| POST | `/api/auth/signup` | `auth.ts` | No | Create new user account |
| POST | `/api/auth/login` | `auth.ts` | No | Authenticate user |
| POST | `/api/auth/logout` | `auth.ts` | Yes | Logout user |
| GET | `/api/auth/me` | `auth.ts` | Yes | Get current user info |
| POST | `/api/auth/forgot-password` | `auth.ts` | No | Request password reset |
| GET | `/api/auth/diagnostics` | `auth-diagnostics.ts` | No | Auth diagnostics (dev only) |

---

## AI Agents

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| POST | `/api/agents/generate/doc` | `agents.ts` | Yes | Generate content with Doc Agent |
| POST | `/api/agents/generate/design` | `agents.ts` | Yes | Generate visuals with Design Agent |
| POST | `/api/agents/generate/advisor` | `agents.ts` | Yes | Generate insights with Advisor Agent |
| POST | `/api/agents/bfs/calculate` | `agents.ts` | Yes | Calculate Brand Fidelity Score |
| GET | `/api/agents/review/queue/:brandId` | `agents.ts` | Yes | Get review queue |
| POST | `/api/agents/review/approve/:logId` | `agents.ts` | Yes | Approve flagged content |
| POST | `/api/agents/review/reject/:logId` | `agents.ts` | Yes | Reject flagged content |
| GET | `/api/agents/` | `agents.ts` | Yes | List available agents |
| POST | `/api/ai/advisor` | `advisor.ts` | Yes | Get advisor insights (legacy) |
| POST | `/api/ai/doc` | `doc-agent.ts` | Yes | Generate doc content (legacy) |
| POST | `/api/ai/design` | `design-agent.ts` | Yes | Generate design content (legacy) |
| POST | `/api/ai/sync` | `ai-sync.ts` | Yes | Get AI sync state (legacy) |

---

## Brands

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| GET | `/api/brands` | `brands.ts` | Yes | List brands for user |
| POST | `/api/brands` | `brands.ts` | Yes | Create new brand |
| GET | `/api/brands/:brandId/posting-schedule` | `brand-posting-schedule.ts` | Yes | Get posting schedule |
| PUT | `/api/brands/:brandId/posting-schedule` | `brand-posting-schedule.ts` | Yes | Update posting schedule |
| GET | `/api/brand-intelligence/:brandId` | `brand-intelligence.ts` | Yes | Get brand intelligence |
| POST | `/api/brand-intelligence/feedback` | `brand-intelligence.ts` | Yes | Submit recommendation feedback |

---

## Brand Guide

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| GET | `/api/brand-guide/:brandId` | `brand-guide.ts` | Yes | Get brand guide |
| PUT | `/api/brand-guide/:brandId` | `brand-guide.ts` | Yes | Update brand guide |
| PATCH | `/api/brand-guide/:brandId` | `brand-guide.ts` | Yes | Partial update brand guide |
| GET | `/api/brand-guide/:brandId/versions` | `brand-guide.ts` | Yes | List version history |
| GET | `/api/brand-guide/:brandId/versions/:version` | `brand-guide.ts` | Yes | Get specific version |
| POST | `/api/brand-guide/:brandId/rollback/:version` | `brand-guide.ts` | Yes | Rollback to version |
| POST | `/api/ai/brand-guide` | `brand-guide-generate.ts` | Yes | Generate brand guide with AI |

---

## Onboarding

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| POST | `/api/onboarding/generate-week` | `onboarding.ts` | Yes | Generate onboarding content for week |
| GET | `/api/onboarding/content-package/:brandId` | `onboarding.ts` | Yes | Get onboarding content package |
| POST | `/api/onboarding/regenerate-week` | `onboarding.ts` | Yes | Regenerate onboarding week |
| GET | `/api/onboarding/brand-summary/:brandId` | `onboarding.ts` | Yes | Get brand onboarding summary |

---

## Content Planning

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| GET | `/api/content-plan/:brandId` | `content-plan.ts` | Yes | Get 7-day content plan |
| POST | `/api/content-plan/:brandId/generate` | `content-plan.ts` | Yes | Generate content plan |

---

## Media

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| GET | `/api/media` | `media-v2.ts` | Yes | List media assets (✅ Real implementation) |
| GET | `/api/media/:assetId` | `media-v2.ts` | Yes | Get asset details (✅ Real implementation) |
| GET | `/api/media/storage-usage` | `media-v2.ts` | Yes | Get storage usage (✅ Real implementation) |
| DELETE | `/api/media/:assetId` | `media-v2.ts` | Yes | Delete asset (✅ Real implementation) |
| POST | `/api/media/upload` | `media-management.ts` | Yes | Upload media files |
| GET | `/api/media/list` | `media.ts` (legacy) | Yes | List media (legacy) |
| GET | `/api/media/usage/:brandId` | `media.ts` (legacy) | Yes | Get storage usage (legacy) |
| GET | `/api/media/url/:assetId` | `media.ts` (legacy) | Yes | Get asset URL (legacy) |
| POST | `/api/media/duplicate-check` | `media.ts` (legacy) | Yes | Check for duplicates (legacy) |
| POST | `/api/media/seo-metadata` | `media.ts` (legacy) | Yes | Generate SEO metadata (legacy) |
| POST | `/api/media/track-usage` | `media.ts` (legacy) | Yes | Track asset usage (legacy) |
| GET | `/api/media/stock-images/search` | `stock-images.ts` | Yes | Search stock images |
| GET | `/api/media/stock-images/:id` | `stock-images.ts` | Yes | Get stock image details |
| GET | `/api/media/search` | `media-management.ts` | Yes | Search media assets |
| GET | `/api/media/storage/:brandId` | `media-management.ts` | Yes | Get storage usage |
| POST | `/api/media/:assetId/delete` | `media-management.ts` | Yes | Delete asset |
| POST | `/api/media/:assetId/track-usage` | `media-management.ts` | Yes | Track asset usage |
| POST | `/api/media/bulk-delete` | `media-management.ts` | Yes | Bulk delete assets |
| POST | `/api/media/organize` | `media-management.ts` | Yes | Organize assets |

---

## Analytics

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| GET | `/api/analytics/overview` | `analytics-v2.ts` | Yes | Get analytics overview (✅ Real implementation) |
| GET | `/api/analytics/engagement-trend` | `analytics-v2.ts` | Yes | Get engagement trend data (✅ Real implementation) |
| GET | `/api/analytics/content-performance` | `analytics-v2.ts` | Yes | Get content performance (✅ Real implementation) |
| GET | `/api/analytics/top-posts` | `analytics-v2.ts` | Yes | Get top performing posts (✅ Real implementation) |

---

## Approvals

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| GET | `/api/approvals/pending` | `approvals-v2.ts` | Yes | List pending approvals (✅ Real implementation) |
| GET | `/api/approvals/:approvalId` | `approvals-v2.ts` | Yes | Get approval details (✅ Real implementation) |
| POST | `/api/approvals/:approvalId/approve` | `approvals-v2.ts` | Yes | Approve content (✅ Real implementation) |
| POST | `/api/approvals/:approvalId/reject` | `approvals-v2.ts` | Yes | Reject content (✅ Real implementation) |
| GET | `/api/approvals/history` | `approvals-v2.ts` | Yes | Get approval history (✅ Real implementation) |

---

## Publishing

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| POST | `/api/publishing/oauth/initiate` | `publishing-router.ts` | Yes | Initiate OAuth flow |
| GET | `/api/publishing/oauth/callback/:platform` | `publishing-router.ts` | No | OAuth callback |
| GET | `/api/publishing/:brandId/connections` | `publishing-router.ts` | Yes | Get platform connections |
| POST | `/api/publishing/:brandId/:platform/disconnect` | `publishing-router.ts` | Yes | Disconnect platform |
| POST | `/api/publishing/:brandId/:platform/refresh` | `publishing-router.ts` | Yes | Refresh OAuth token |
| GET | `/api/publishing/:brandId/:platform/verify` | `publishing-router.ts` | Yes | Verify connection |
| POST | `/api/publishing/:brandId/publish` | `publishing-router.ts` | Yes | Publish content |
| GET | `/api/publishing/:brandId/jobs` | `publishing-router.ts` | Yes | Get publishing jobs |
| POST | `/api/publishing/jobs/:jobId/retry` | `publishing-router.ts` | Yes | Retry failed job |
| POST | `/api/publishing/jobs/:jobId/cancel` | `publishing-router.ts` | Yes | Cancel job |
| PATCH | `/api/publishing/jobs/:jobId/schedule` | `publishing-router.ts` | Yes | Update scheduled time |

---

## Integrations

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| GET | `/api/integrations` | `integrations.ts` | Yes | List integrations |
| GET | `/api/integrations/:integrationId` | `integrations.ts` | Yes | Get integration details |
| GET | `/api/integrations/templates` | `integrations.ts` | Yes | Get integration templates |
| POST | `/api/integrations` | `integrations.ts` | Yes | Create integration |
| POST | `/api/integrations/oauth/callback` | `integrations.ts` | Yes | OAuth callback |
| POST | `/api/integrations/:integrationId/sync` | `integrations.ts` | Yes | Trigger sync |
| PUT | `/api/integrations/:integrationId` | `integrations.ts` | Yes | Update integration |
| DELETE | `/api/integrations/:integrationId` | `integrations.ts` | Yes | Delete integration |
| GET | `/api/integrations/:integrationId/sync-events` | `integrations.ts` | Yes | Get sync events |
| POST | `/api/integrations/webhooks/:type` | `integrations.ts` | Yes | Handle webhook |

---

## Workflow

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| GET | `/api/workflow/templates/:brandId` | `workflow.ts` | Yes | Get workflow templates |
| POST | `/api/workflow/templates/:brandId` | `workflow.ts` | Yes | Create workflow template |
| POST | `/api/workflow/start/:brandId` | `workflow.ts` | Yes | Start workflow instance |
| POST | `/api/workflow/:workflowId/action` | `workflow.ts` | Yes | Process workflow action |
| GET | `/api/workflow/:brandId/notifications` | `workflow.ts` | Yes | Get workflow notifications |
| PUT | `/api/workflow/notifications/:notificationId/read` | `workflow.ts` | Yes | Mark notification read |
| POST | `/api/workflow/:workflowId/cancel` | `workflow.ts` | Yes | Cancel workflow |
| GET | `/api/workflow/:workflowId` | `workflow.ts` | Yes | Get workflow details |
| GET | `/api/workflow/content/:contentId` | `workflow.ts` | Yes | Get workflows for content |

---

## Notifications

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| GET | `/api/notifications` | `notifications.ts` | Yes | Get unread notifications |
| POST | `/api/notifications/:notificationId/read` | `notifications.ts` | Yes | Mark notification as read |

---

## Milestones

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| GET | `/api/milestones` | `milestones.ts` | Yes | Get user milestones |
| POST | `/api/milestones/:key/ack` | `milestones.ts` | Yes | Acknowledge milestone |

---

## Admin

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| GET | `/api/admin/overview` | `admin.ts` | Yes | Get platform overview |
| GET | `/api/admin/tenants` | `admin.ts` | Yes | List tenants |
| GET | `/api/admin/users` | `admin.ts` | Yes | List users |
| GET | `/api/admin/billing` | `admin.ts` | Yes | Get billing summary |
| GET | `/api/admin/feature-flags` | `admin.ts` | Yes | Get feature flags |
| POST | `/api/admin/feature-flags` | `admin.ts` | Yes | Update feature flag |

---

## Billing

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| GET | `/api/billing/status` | `billing.ts` | Yes | Get billing status |
| GET | `/api/billing/subscription` | `billing.ts` | Yes | Get subscription details |
| POST | `/api/billing/subscribe` | `billing.ts` | Yes | Subscribe to plan |
| POST | `/api/billing/cancel` | `billing.ts` | Yes | Cancel subscription |
| GET | `/api/billing/invoices` | `billing.ts` | Yes | List invoices |
| POST | `/api/billing/reactivate` | `billing-reactivation.ts` | Yes | Reactivate subscription |
| GET | `/api/billing/reactivation-status` | `billing-reactivation.ts` | Yes | Get reactivation status |
| POST | `/api/billing/reactivation/confirm` | `billing-reactivation.ts` | Yes | Confirm reactivation |

---

## Trial

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| GET | `/api/trial/status` | `trial.ts` | Yes | Get trial status |
| POST | `/api/trial/start` | `trial.ts` | Yes | Start trial |

---

## Calendar

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| GET | `/api/calendar/:brandId` | `calendar.ts` | Yes | Get scheduled content for calendar |

---

## Search

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| GET | `/api/search` | `search.ts` | Yes | Search content |

---

## Client Portal

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| GET | `/api/client-portal/share-links/:token` | `client-portal.ts` | No | Get share link by token |

---

## Client Settings

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| GET | `/api/client-settings` | `client-settings.ts` | Yes | Get client settings |
| PUT | `/api/client-settings` | `client-settings.ts` | Yes | Update client settings |
| POST | `/api/client-settings/email-preferences` | `client-settings.ts` | Yes | Update email preferences |
| POST | `/api/client-settings/unsubscribe-link` | `client-settings.ts` | Yes | Generate unsubscribe link |
| POST | `/api/client-settings/unsubscribe` | `client-settings.ts` | No | Unsubscribe from emails |
| POST | `/api/client-settings/resubscribe` | `client-settings.ts` | No | Resubscribe to emails |
| GET | `/api/client-settings/verify-unsubscribe/:token` | `client-settings.ts` | No | Verify unsubscribe token |

---

## Orchestration

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| POST | `/api/orchestration/pipeline/execute` | `orchestration.ts` | Yes | Execute pipeline cycle |
| GET | `/api/orchestration/cycle/:cycleId` | `orchestration.ts` | Yes | Get cycle status |
| GET | `/api/orchestration/brand/:brandId/cycles` | `orchestration.ts` | Yes | List cycles for brand |
| POST | `/api/orchestration/strategy/generate` | `orchestration.ts` | Yes | Generate strategy brief |
| POST | `/api/orchestration/collaboration-log` | `orchestration.ts` | Yes | Log collaboration event |
| POST | `/api/orchestration/brand-history/summary` | `orchestration.ts` | Yes | Get brand history summary |
| GET | `/api/orchestration/health` | `orchestration.ts` | Yes | Orchestration health check |
| POST | `/api/orchestration/pipeline/plan` | `orchestration.ts` | Yes | Plan pipeline phase |
| POST | `/api/orchestration/pipeline/learn` | `orchestration.ts` | Yes | Learn from pipeline results |

---

## Content Packages

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| POST | `/api/content-packages` | `content-packages.ts` | Yes | Save content package |
| GET | `/api/content-packages/:packageId` | `content-packages.ts` | Yes | Get content package |

---

## Crawler

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| POST | `/api/crawl/start` | `crawler.ts` | Yes | Start website crawl |
| GET | `/api/crawl/result/:jobId` | `crawler.ts` | Yes | Get crawl result |
| POST | `/api/crawl/brand-kit/apply` | `crawler.ts` | Yes | Apply brand kit from crawl |
| GET | `/api/crawl/brand-kit/history/:brandId` | `crawler.ts` | Yes | Get brand kit history |
| POST | `/api/crawl/brand-kit/revert` | `crawler.ts` | Yes | Revert brand kit change |
| POST | `/api/crawl/reconcile-images` | `crawler.ts` | Yes | Reconcile scraped images |

---

## Escalations

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| GET | `/api/escalations/rules` | `escalations.ts` | Yes | List escalation rules |
| GET | `/api/escalations/rules/:ruleId` | `escalations.ts` | Yes | Get escalation rule |
| POST | `/api/escalations/rules` | `escalations.ts` | Yes | Create escalation rule |
| PUT | `/api/escalations/rules/:ruleId` | `escalations.ts` | Yes | Update escalation rule |
| DELETE | `/api/escalations/rules/:ruleId` | `escalations.ts` | Yes | Delete escalation rule |
| GET | `/api/escalations/events` | `escalations.ts` | Yes | List escalation events |
| GET | `/api/escalations/events/:eventId` | `escalations.ts` | Yes | Get escalation event |
| POST | `/api/escalations/events` | `escalations.ts` | Yes | Create escalation event |
| PUT | `/api/escalations/events/:eventId` | `escalations.ts` | Yes | Update escalation event |

---

## Reviews

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| GET | `/api/reviews/:brandId` | `reviews.ts` | Yes | Get all reviews for a brand (✅ Audited & fixed) |

---

## Dashboard

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| POST | `/api/dashboard` | `dashboard.ts` | Yes | Get dashboard data |

---

## Webhooks

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| POST | `/api/webhooks/zapier` | `webhooks.ts` | No | Zapier webhook handler (✅ Audited & fixed) |
| POST | `/api/webhooks/make` | `webhooks.ts` | No | Make.com webhook handler (✅ Audited & fixed) |
| POST | `/api/webhooks/slack` | `webhooks.ts` | No | Slack Events API handler (✅ Audited & fixed) |
| POST | `/api/webhooks/hubspot` | `webhooks.ts` | No | HubSpot webhook handler (✅ Audited & fixed) |
| GET | `/api/webhooks/status/:eventId` | `webhooks.ts` | No | Get webhook event status (✅ Audited & fixed) |
| GET | `/api/webhooks/logs` | `webhooks.ts` | No | Get webhook event logs (✅ Audited & fixed) |
| POST | `/api/webhooks/retry/:eventId` | `webhooks.ts` | No | Retry failed webhook event (✅ Audited & fixed) |
| POST | `/api/webhooks/stripe` | `webhooks/stripe.ts` | No | Stripe webhook handler |

---

## Notes

- **Auth Required:** Most endpoints require authentication via `authenticateUser` middleware
- **Scopes:** Some endpoints require specific scopes (e.g., `ai:generate`, `content:view`, `content:manage`)
- **Validation:** Most endpoints use Zod schemas for input validation
- **Error Handling:** All endpoints use standardized error responses via `error-middleware.ts`
- **Response Format:** Success responses return direct data objects (not wrapped in `{ ok: true, data: ... }`)
- **Error Format:** Errors use `{ error: { code, message, severity, timestamp, ... } }`
- **V2 Endpoints:** All v2 endpoints (analytics-v2, approvals-v2, media-v2) are now fully implemented with real data access

---

## Endpoint Status

- ✅ **Active:** Endpoint is implemented and working
- ✅ **Real Implementation:** Endpoint uses real database/service layer (v2 endpoints)
- ⚠️ **Needs Audit:** Endpoint exists but needs validation/error handling review
- 🔧 **In Progress:** Endpoint is being developed
- ❌ **Deprecated:** Endpoint is deprecated and should not be used

---

## Next Steps

1. Audit each endpoint for proper validation, error handling, and auth
2. Ensure consistent response formats
3. Add input validation where missing
4. Document request/response schemas
5. Add smoke tests for critical endpoints
