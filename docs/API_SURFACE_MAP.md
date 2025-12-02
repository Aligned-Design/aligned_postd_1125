# API Surface Map

Complete inventory of all API endpoints in the Aligned AI platform.

**Last Updated:** 2025-01-XX  
**Framework:** Express.js  
**Base Path:** `/api` (except health checks)

---

## Table of Contents

- [Health & Diagnostics](#health--diagnostics)
- [Authentication](#authentication)
- [Brands](#brands)
- [Brand Guide](#brand-guide)
- [AI Agents & Generation](#ai-agents--generation)
- [Content & Publishing](#content--publishing)
- [Media Management](#media-management)
- [Workflows & Approvals](#workflows--approvals)
- [Analytics](#analytics)
- [Integrations](#integrations)
- [Client Portal](#client-portal)
- [Billing & Trial](#billing--trial)
- [Admin](#admin)
- [Other](#other)

---

## Health & Diagnostics

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| GET | `/health` | `healthRouter` | No | Basic health check with AI and integration status |
| GET | `/api/health` | `healthRouter` | No | Same as `/health` (client-accessible) |
| GET | `/api/health/ai` | `healthRouter` | No | Check AI service availability |
| GET | `/api/health/supabase` | `healthRouter` | No | Check Supabase database connection |
| GET | `/api/agents/health` | `agentsHealthRouter` | No | Agents health check endpoint |
| GET | `/api/ping` | Direct handler | No | Simple ping endpoint |

---

## Authentication

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| POST | `/api/auth/signup` | `authRouter` | No | User registration |
| POST | `/api/auth/login` | `authRouter` | No | User login |
| POST | `/api/auth/logout` | `authRouter` | Yes | User logout |
| GET | `/api/auth/me` | `authRouter` | Yes | Get current user profile |
| POST | `/api/auth/forgot-password` | `authRouter` | No | Request password reset |

---

## Brands

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| GET | `/api/brands` | `brandsRouter` | Yes | List all brands for user |
| POST | `/api/brands` | `brandsRouter` | Yes | Create new brand (triggers onboarding) |
| GET | `/api/brands/:brandId/posting-schedule` | Direct handler | Yes | Get brand posting schedule |
| PUT | `/api/brands/:brandId/posting-schedule` | Direct handler | Yes | Update brand posting schedule |
| GET | `/api/brands/:brandId/members` | `brandMembersRouter` | Yes | Get brand members |

---

## Brand Guide

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| GET | `/api/brand-guide/:brandId` | `brandGuideRouter` | Yes | Get brand guide |
| PUT | `/api/brand-guide/:brandId` | `brandGuideRouter` | Yes | Update brand guide |
| PATCH | `/api/brand-guide/:brandId` | `brandGuideRouter` | Yes | Partial update brand guide |
| GET | `/api/brand-guide/:brandId/versions` | `brandGuideRouter` | Yes | Get version history |
| GET | `/api/brand-guide/:brandId/versions/:version` | `brandGuideRouter` | Yes | Get specific version |
| POST | `/api/brand-guide/:brandId/rollback/:version` | `brandGuideRouter` | Yes | Rollback to version |
| POST | `/api/ai/brand-guide` | `brandGuideGenerateRouter` | Yes | Generate brand guide with AI |
| GET | `/api/brand-intelligence/:brandId` | Direct handler | Yes | Get brand intelligence insights |
| POST | `/api/brand-intelligence/feedback` | Direct handler | Yes | Submit recommendation feedback |

---

## AI Agents & Generation

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| POST | `/api/agents/generate/doc` | `agentsRouter` | Yes | Generate content with Doc Agent |
| POST | `/api/agents/generate/design` | `agentsRouter` | Yes | Generate visuals with Design Agent |
| POST | `/api/agents/generate/advisor` | `agentsRouter` | Yes | Generate insights with Advisor Agent |
| POST | `/api/agents/bfs/calculate` | `agentsRouter` | Yes | Calculate Brand Fidelity Score |
| GET | `/api/agents/review/queue/:brandId` | `agentsRouter` | Yes | Get review queue |
| POST | `/api/agents/review/approve/:logId` | `agentsRouter` | Yes | Approve flagged content |
| POST | `/api/agents/review/reject/:logId` | `agentsRouter` | Yes | Reject flagged content |
| GET | `/api/agents` | `agentsRouter` | Yes | List agents |
| POST | `/api/ai/advisor` | Direct handler | Yes | Get advisor insights |
| POST | `/api/ai/doc` | Direct handler | Yes | Generate doc content |
| POST | `/api/ai/design` | Direct handler | Yes | Generate design content |
| POST | `/api/ai/sync` | Direct handler | Yes | Get AI sync state (collaboration) |
| POST | `/api/ai/generate/content` | `ai-generation` | Yes | Generate AI content |
| POST | `/api/ai/generate/design` | `ai-generation` | Yes | Generate AI design |
| GET | `/api/ai/providers` | `ai-generation` | Yes | Get available AI providers |
| GET | `/api/ai-metrics/ai/snapshot` | `ai-metrics` | Yes | Get AI metrics snapshot |
| GET | `/api/ai-metrics/ai/alerts` | `ai-metrics` | Yes | Get AI alerts |
| GET | `/api/ai-metrics/ai/detailed` | `ai-metrics` | Yes | Get detailed AI metrics |
| GET | `/api/ai-metrics/ai/summary` | `ai-metrics` | Yes | Get AI metrics summary |

---

## Content & Publishing

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| POST | `/api/publishing/oauth/initiate` | `publishingRouter` | No | Initiate OAuth flow |
| GET | `/api/publishing/oauth/callback/:platform` | `publishingRouter` | No | OAuth callback handler |
| GET | `/api/publishing/:brandId/connections` | `publishingRouter` | Yes | Get platform connections |
| POST | `/api/publishing/:brandId/:platform/disconnect` | `publishingRouter` | Yes | Disconnect platform |
| POST | `/api/publishing/:brandId/:platform/refresh` | `publishingRouter` | Yes | Refresh OAuth token |
| GET | `/api/publishing/:brandId/:platform/verify` | `publishingRouter` | Yes | Verify connection |
| POST | `/api/publishing/:brandId/publish` | `publishingRouter` | Yes | Publish content |
| GET | `/api/publishing/:brandId/jobs` | `publishingRouter` | Yes | Get publishing jobs |
| POST | `/api/publishing/jobs/:jobId/retry` | `publishingRouter` | Yes | Retry failed job |
| POST | `/api/publishing/jobs/:jobId/cancel` | `publishingRouter` | Yes | Cancel job |
| PATCH | `/api/publishing/jobs/:jobId/schedule` | `publishingRouter` | Yes | Update scheduled time |
| POST | `/api/orchestration/pipeline/execute` | `orchestrationRouter` | Yes | Execute full pipeline cycle |
| GET | `/api/orchestration/cycle/:cycleId` | `orchestrationRouter` | Yes | Get cycle status |
| GET | `/api/orchestration/brand/:brandId/cycles` | `orchestrationRouter` | Yes | Get brand cycles |
| POST | `/api/orchestration/strategy/generate` | `orchestrationRouter` | Yes | Generate strategy |
| POST | `/api/orchestration/collaboration-log` | `orchestrationRouter` | Yes | Log collaboration event |
| POST | `/api/orchestration/brand-history/summary` | `orchestrationRouter` | Yes | Get brand history summary |
| GET | `/api/orchestration/health` | `orchestrationRouter` | No | Orchestration health check |
| POST | `/api/content-packages` | `contentPackagesRouter` | Yes | Save content package |
| GET | `/api/content-packages/:packageId` | `contentPackagesRouter` | Yes | Get content package |
| GET | `/api/content-plan` | `contentPlanRouter` | Yes | Get 7-day content plan |
| POST | `/api/content-plan` | `contentPlanRouter` | Yes | Generate content plan |

---

## Media Management

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| POST | `/api/media/upload` | Direct handler | Yes | Upload media asset |
| GET | `/api/media/list` | Direct handler | Yes | List media assets |
| GET | `/api/media/usage/:brandId` | Direct handler | Yes | Get storage usage |
| GET | `/api/media/url/:assetId` | Direct handler | Yes | Get asset URL |
| POST | `/api/media/duplicate-check` | Direct handler | Yes | Check for duplicate asset |
| POST | `/api/media/seo-metadata` | Direct handler | Yes | Generate SEO metadata |
| POST | `/api/media/track-usage` | Direct handler | Yes | Track asset usage |
| GET | `/api/media/stock-images/search` | Direct handler | Yes | Search stock images |
| GET | `/api/media/stock-images/:id` | Direct handler | Yes | Get stock image details |
| POST | `/api/media-management/upload` | `mediaManagementRouter` | Yes | Upload multiple files |
| GET | `/api/media-management/list` | `mediaManagementRouter` | Yes | List media with filters |
| GET | `/api/media-management/search` | `mediaManagementRouter` | Yes | Search media |
| GET | `/api/media-management/storage/:brandId` | `mediaManagementRouter` | Yes | Get storage stats |
| GET | `/api/media-management/:assetId` | `mediaManagementRouter` | Yes | Get asset details |
| POST | `/api/media-management/:assetId/delete` | `mediaManagementRouter` | Yes | Delete asset |
| POST | `/api/media-management/:assetId/track-usage` | `mediaManagementRouter` | Yes | Track usage |
| POST | `/api/media-management/bulk-delete` | `mediaManagementRouter` | Yes | Bulk delete assets |
| POST | `/api/media-management/organize` | `mediaManagementRouter` | Yes | Organize assets |

---

## Workflows & Approvals

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| GET | `/api/workflow/templates` | `workflowRouter` | Yes | Get workflow templates |
| POST | `/api/workflow/templates` | `workflowRouter` | Yes | Create workflow template |
| POST | `/api/workflow/start` | `workflowRouter` | Yes | Start workflow |
| POST | `/api/workflow/:workflowId/action` | `workflowRouter` | Yes | Process workflow action |
| GET | `/api/workflow/notifications` | `workflowRouter` | Yes | Get workflow notifications |
| PUT | `/api/workflow/notifications/:notificationId/read` | `workflowRouter` | Yes | Mark notification read |
| POST | `/api/workflow/:workflowId/cancel` | `workflowRouter` | Yes | Cancel workflow |
| GET | `/api/workflow/:workflowId` | `workflowRouter` | Yes | Get workflow details |
| GET | `/api/workflow/content/:contentId` | `workflowRouter` | Yes | Get workflows for content |
| POST | `/api/approvals/bulk` | `approvalsRouter` | Yes | Bulk approve content |
| POST | `/api/approvals/:postId/approve` | `approvalsRouter` | Yes | Approve single content |
| POST | `/api/approvals/:postId/reject` | `approvalsRouter` | Yes | Reject content |
| POST | `/api/approvals/:postId/request` | `approvalsRouter` | Yes | Request approval |
| GET | `/api/approvals/pending` | `approvalsRouter` | Yes | Get pending approvals |
| GET | `/api/approvals/:postId/history` | `approvalsRouter` | Yes | Get approval history |
| POST | `/api/approvals/send-reminder` | `approvalsRouter` | Yes | Send approval reminder |
| POST | `/api/approvals/:postId/approve-for-client` | `approvalsRouter` | Yes | Approve for client |
| POST | `/api/approvals/:postId/send-to-draft` | `approvalsRouter` | Yes | Send back to draft |
| POST | `/api/approvals/:postId/mark-ready-schedule` | `approvalsRouter` | Yes | Mark ready for scheduling |
| POST | `/api/bulk-approvals` | Direct handler | Yes | Bulk approve or reject |
| GET | `/api/bulk-approvals/status` | Direct handler | Yes | Get batch approval status |
| POST | `/api/bulk-approvals/lock` | Direct handler | Yes | Lock posts after approval |

---

## Analytics

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| POST | `/api/analytics/performance` | `analyticsRouter` | Yes | Log performance metric |
| GET | `/api/analytics/status/:brandId` | `analyticsRouter` | Yes | Get analytics status |
| GET | `/api/analytics/:brandId` | `analyticsRouter` | Yes | Get analytics data |
| GET | `/api/analytics/:brandId/insights` | `analyticsRouter` | Yes | Get insights |
| GET | `/api/analytics/:brandId/forecast` | `analyticsRouter` | Yes | Get forecast |
| POST | `/api/analytics/:brandId/voice-query` | `analyticsRouter` | Yes | Process voice query |
| POST | `/api/analytics/:brandId/feedback` | `analyticsRouter` | Yes | Provide feedback |
| GET | `/api/analytics/:brandId/goals` | `analyticsRouter` | Yes | Get goals |
| POST | `/api/analytics/:brandId/goals` | `analyticsRouter` | Yes | Create goal |
| POST | `/api/analytics/:brandId/sync` | `analyticsRouter` | Yes | Sync platform data |
| POST | `/api/analytics/:brandId/offline-metric` | `analyticsRouter` | Yes | Add offline metric |
| GET | `/api/analytics/:brandId/heatmap` | `analyticsRouter` | Yes | Get engagement heatmap |
| GET | `/api/analytics/:brandId/alerts` | `analyticsRouter` | Yes | Get alerts |
| POST | `/api/analytics/:brandId/alerts/:alertId/acknowledge` | `analyticsRouter` | Yes | Acknowledge alert |

---

## Integrations

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| GET | `/api/integrations` | `integrationsRouter` | Yes | Get integrations for brand |
| GET | `/api/integrations/status` | `integrationsRouter` | Yes | Get connection status |
| GET | `/api/integrations/templates` | `integrationsRouter` | Yes | Get integration templates |
| POST | `/api/integrations` | `integrationsRouter` | Yes | Create integration |
| POST | `/api/integrations/oauth/callback` | `integrationsRouter` | Yes | OAuth callback |
| POST | `/api/integrations/:integrationId/sync` | `integrationsRouter` | Yes | Trigger sync |
| PUT | `/api/integrations/:integrationId` | `integrationsRouter` | Yes | Update integration |
| DELETE | `/api/integrations/:integrationId` | `integrationsRouter` | Yes | Delete integration |
| GET | `/api/integrations/:integrationId/sync-events` | `integrationsRouter` | Yes | Get sync events |
| POST | `/api/integrations/webhooks/:type` | `integrationsRouter` | Yes | Handle webhook |

---

## Client Portal

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| GET | `/api/client-portal/dashboard` | `clientPortalRouter` | Yes | Get client dashboard |
| POST | `/api/client-portal/content/:contentId/approve` | `clientPortalRouter` | Yes | Approve content |
| POST | `/api/client-portal/content/:contentId/reject` | `clientPortalRouter` | Yes | Reject content |
| POST | `/api/client-portal/content/:contentId/comments` | `clientPortalRouter` | Yes | Add comment |
| GET | `/api/client-portal/content/:contentId/comments` | `clientPortalRouter` | Yes | Get comments |
| POST | `/api/client-portal/media/upload` | `clientPortalRouter` | Yes | Upload media |
| GET | `/api/client-portal/media` | `clientPortalRouter` | Yes | Get client media |
| GET | `/api/client-portal/content` | `clientPortalRouter` | Yes | Get portal content |
| GET | `/api/client-portal/content/:contentId` | `clientPortalRouter` | Yes | Get content with comments |
| POST | `/api/client-portal/share-links` | `clientPortalRouter` | Yes | Create share link |
| GET | `/api/client-portal/share-links` | `clientPortalRouter` | Yes | Get share links |
| DELETE | `/api/client-portal/share-links/:linkId` | `clientPortalRouter` | Yes | Revoke share link |
| POST | `/api/client-portal/workflow/action` | `clientPortalRouter` | Yes | Process workflow action |
| GET | `/api/client-portal/share-links/:token` | Direct handler | No | Get share link by token (public) |

---

## Billing & Trial

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| GET | `/api/billing/status` | `billingRouter` | Yes | Get billing status |
| GET | `/api/billing/history` | `billingRouter` | Yes | Get billing history |
| POST | `/api/billing/subscribe` | `billingRouter` | Yes | Subscribe to plan |
| POST | `/api/billing/cancel` | `billingRouter` | Yes | Cancel subscription |
| GET | `/api/billing/invoices/:invoiceId` | `billingRouter` | Yes | Get invoice |
| GET | `/api/trial/status` | `trialRouter` | Yes | Get trial status |
| POST | `/api/trial/start` | `trialRouter` | Yes | Start trial |

---

## Admin

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| GET | `/api/admin/overview` | `adminRouter` | Yes | Get admin overview |
| GET | `/api/admin/tenants` | `adminRouter` | Yes | List tenants |
| GET | `/api/admin/users` | `adminRouter` | Yes | List users |
| GET | `/api/admin/billing` | `adminRouter` | Yes | Get billing stats |
| GET | `/api/admin/feature-flags` | `adminRouter` | Yes | Get feature flags |
| POST | `/api/admin/feature-flags` | `adminRouter` | Yes | Update feature flag |

---

## Other

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| GET | `/api/demo` | Direct handler | No | Demo endpoint |
| POST | `/api/dashboard` | Direct handler | Yes | Get dashboard data |
| POST | `/api/onboarding/generate-week` | `onboardingRouter` | Yes | Generate onboarding week |
| GET | `/api/onboarding/content-package/:brandId` | `onboardingRouter` | Yes | Get content package |
| POST | `/api/onboarding/regenerate-week` | `onboardingRouter` | Yes | Regenerate week |
| GET | `/api/onboarding/brand-summary/:brandId` | `onboardingRouter` | Yes | Get brand summary |
| POST | `/api/crawl/start` | `crawlerRouter` | Yes | Start website crawl |
| GET | `/api/crawl/result/:jobId` | `crawlerRouter` | Yes | Get crawl result |
| POST | `/api/crawl/brand-kit/apply` | `crawlerRouter` | Yes | Apply brand kit |
| GET | `/api/crawl/brand-kit/history/:brandId` | `crawlerRouter` | Yes | Get brand kit history |
| POST | `/api/crawl/brand-kit/revert` | `crawlerRouter` | Yes | Revert brand kit |
| POST | `/api/crawl/reconcile-images` | `crawlerRouter` | Yes | Reconcile scraped images |
| GET | `/api/search` | `searchRouter` | Yes | Search content |
| GET | `/api/notifications` | `notificationsRouter` | Yes | Get notifications |
| POST | `/api/notifications/:notificationId/read` | `notificationsRouter` | Yes | Mark notification read |
| GET | `/api/milestones` | `milestonesRouter` | Yes | Get milestones |
| POST | `/api/milestones/:key/ack` | `milestonesRouter` | Yes | Acknowledge milestone |
| GET | `/api/calendar` | `calendarRouter` | Yes | Get calendar data |
| GET | `/api/reviews` | `reviewsRouter` | Yes | Get reviews |
| GET | `/api/studio` | `studioRouter` | Yes | Creative studio endpoints (alias) |
| GET | `/api/creative-studio` | `studioRouter` | Yes | Creative studio endpoints |
| POST | `/api/studio` | `studioRouter` | Yes | Create creative |
| PUT | `/api/studio/:id` | `studioRouter` | Yes | Update creative |
| GET | `/api/studio/:id` | `studioRouter` | Yes | Get creative |
| POST | `/api/studio/:id/export` | `studioRouter` | Yes | Export creative |
| GET | `/api/audit/logs` | Direct handler | Yes | Get audit logs |
| GET | `/api/audit/posts/:postId` | Direct handler | Yes | Get post audit log |
| GET | `/api/audit/stats` | Direct handler | Yes | Get audit stats |
| POST | `/api/audit/export` | Direct handler | Yes | Export audit logs |
| GET | `/api/audit/search` | Direct handler | Yes | Search audit logs |
| GET | `/api/audit/actions` | Direct handler | Yes | Get audit actions |
| GET | `/api/client-settings` | Direct handler | Yes | Get client settings |
| PUT | `/api/client-settings` | Direct handler | Yes | Update client settings |
| POST | `/api/client-settings/email-preferences` | Direct handler | Yes | Update email preferences |
| POST | `/api/client-settings/unsubscribe-link` | Direct handler | Yes | Generate unsubscribe link |
| POST | `/api/client-settings/unsubscribe` | Direct handler | No | Unsubscribe from emails |
| POST | `/api/client-settings/resubscribe` | Direct handler | No | Resubscribe to emails |
| GET | `/api/client-settings/verify-unsubscribe/:token` | Direct handler | No | Verify unsubscribe token |
| GET | `/api/white-label/config` | Direct handler | Yes | Get white label config |
| GET | `/api/white-label/config/:domain` | Direct handler | No | Get config by domain |
| PUT | `/api/white-label/config` | Direct handler | Yes | Update white label config |
| POST | `/api/webhooks/zapier` | Direct handler | No | Zapier webhook |
| POST | `/api/webhooks/make` | Direct handler | No | Make webhook |
| POST | `/api/webhooks/slack` | Direct handler | No | Slack webhook |
| POST | `/api/webhooks/hubspot` | Direct handler | No | HubSpot webhook |
| GET | `/api/webhooks/status` | Direct handler | Yes | Get webhook status |
| GET | `/api/webhooks/logs` | Direct handler | Yes | Get webhook logs |
| POST | `/api/webhooks/retry/:eventId` | Direct handler | Yes | Retry webhook event |
| GET | `/api/escalations/rules` | `escalationsRouter` | Yes | Get escalation rules |
| GET | `/api/escalations/rules/:ruleId` | `escalationsRouter` | Yes | Get escalation rule |
| POST | `/api/escalations/rules` | `escalationsRouter` | Yes | Create escalation rule |
| PUT | `/api/escalations/rules/:ruleId` | `escalationsRouter` | Yes | Update escalation rule |
| DELETE | `/api/escalations/rules/:ruleId` | `escalationsRouter` | Yes | Delete escalation rule |
| GET | `/api/escalations/events` | `escalationsRouter` | Yes | Get escalation events |
| GET | `/api/escalations/events/:eventId` | `escalationsRouter` | Yes | Get escalation event |
| POST | `/api/escalations/events` | `escalationsRouter` | Yes | Create escalation event |
| PUT | `/api/escalations/events/:eventId` | `escalationsRouter` | Yes | Update escalation event |

---

## Notes

### Authentication
- **Yes**: Requires `authenticateUser` middleware
- **No**: Public endpoint (no auth required)
- Some endpoints use `optionalAuthForOnboarding` for onboarding flows

### Authorization
Most authenticated endpoints also require scopes via `requireScope` middleware:
- `ai:generate` - AI content generation
- `content:view` - View content
- `content:manage` - Manage content
- `content:publish` - Publish content
- `content:approve` - Approve content
- `integrations:view` - View integrations
- `integrations:manage` - Manage integrations
- `analytics:read` - Read analytics
- `analytics:manage` - Manage analytics
- `workflow:manage` - Manage workflows
- `platform:admin` - Platform administration

### Response Format
- Success responses typically use: `{ success: true, data: ... }` or `{ ok: true, data: ... }`
- Error responses use: `{ error: { code, message, severity, timestamp, ... } }`
- See `server/lib/error-middleware.ts` for error handling details

### Validation
- Most endpoints use Zod schemas for validation
- Validation middleware: `validateBody`, `validateQuery`, `validateParams`
- See `server/lib/validation-middleware.ts` and `server/lib/validation-schemas.ts`

