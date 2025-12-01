# POSTD API Contract

**Version:** 1.0  
**Last Updated:** 2025-01-20  
**Status:** Authoritative API Documentation

> **Contract Note:** Any breaking change to these endpoints or schemas must be reflected in this document and treated as an API version change. This file is the authoritative API contract for POSTD.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Authorization & Scopes](#authorization--scopes)
4. [Brand Access](#brand-access)
5. [Error Responses](#error-responses)
6. [API Endpoints](#api-endpoints)
   - [Health & System](#health--system)
   - [Authentication](#authentication-endpoints)
   - [Brands](#brands)
   - [Content Management](#content-management)
   - [Publishing](#publishing)
   - [Analytics](#analytics)
   - [Approvals](#approvals)
   - [Media Management](#media-management)
   - [AI Generation](#ai-generation)
   - [Brand Intelligence](#brand-intelligence)
   - [Client Portal](#client-portal)
   - [Integrations](#integrations)
   - [Webhooks](#webhooks)
   - [Admin](#admin)
   - [Other](#other)

---

## Overview

POSTD is a **brand-driven AI content platform** that enables users to:
- Create brand workspaces
- Generate brand guides from website crawls
- Generate AI-powered content aligned to brands
- Edit visuals in Creative Studio
- Schedule and publish to connected social accounts
- Collaborate via approvals
- View performance analytics

All API endpoints are RESTful and require authentication. Most endpoints are brand-scoped and require brand access verification.

**Base URL:** `/api` (relative to deployment domain)

---

## Authentication

All API requests require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

The JWT contains:
- `userId`: User identifier
- `email`: User email
- `role`: User role (SUPERADMIN, ADMIN, AGENCY, CLIENT, VIEWER)
- `brandIds`: Array of brand IDs user has access to
- `tenantId`: Workspace/tenant identifier
- `scopes`: Array of permission scopes

**Middleware:** `authenticateUser` - Attaches `req.user` and `req.auth` with user context

---

## Authorization & Scopes

Some endpoints require specific permission scopes:

- `ai:generate` - Access to AI generation endpoints
- `content:view` - View content, analytics, search
- `content:manage` - Create, update, delete content

**Middleware:** `requireScope(scope)` - Validates user has required scope

---

## Brand Access

Most endpoints operate within a brand context. Brand access is verified using:

**Function:** `assertBrandAccess(req, brandId, allowSuperAdmin, verifyWorkspace)`

**Behavior:**
- Verifies user is a member of the brand (via `brand_members` table)
- Verifies brand belongs to user's workspace (if `verifyWorkspace=true`)
- SUPERADMIN role can bypass brand check (if `allowSuperAdmin=true`)
- Throws `FORBIDDEN` error if access denied

**Usage:** Called automatically in route handlers before accessing brand-scoped resources

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "statusCode": 400,
  "severity": "warning|error|critical",
  "requestId": "req-12345",
  "context": {},
  "userMessage": "User-friendly message"
}
```

**Common Error Codes:**
- `UNAUTHORIZED` (401) - Missing or invalid authentication
- `FORBIDDEN` (403) - User lacks required permissions
- `NOT_FOUND` (404) - Resource not found
- `MISSING_REQUIRED_FIELD` (400) - Required field missing
- `VALIDATION_ERROR` (400) - Request validation failed
- `DATABASE_ERROR` (500) - Database operation failed
- `INTERNAL_ERROR` (500) - Internal server error

---

## API Endpoints

Some areas (e.g. Authentication, Admin, Integrations) are summarized at the router level for now and may be expanded with per-route details in future revisions. Where a router is referenced (e.g. `authRouter`, `adminRouter`), the router file contains the full implementation details.

### Health & System

#### GET `/api/ping`
**Description:** Basic health check endpoint

**Auth:** None (public)

**Response:**
```json
{
  "message": "pong"
}
```

---

#### GET `/api/demo`
**Description:** Demo endpoint (development/testing)

**Auth:** None (public)

**Response:** Varies

---

#### GET `/health/*`
**Description:** Health check routes

**Auth:** None (public)

**Router:** `healthRouter`

---

#### GET `/api/agents/health`
**Description:** Agents health monitoring endpoint

**Auth:** None (public, for monitoring)

**Router:** `agentsHealthRouter`

---

### Authentication Endpoints

**Router:** `authRouter` (mounted at `/api/auth`)

Routes handled by authentication router - see `server/routes/auth.ts`

**Note:** This section currently documents authentication at the router level. Per future revisions, individual endpoints such as `POST /api/auth/login`, `POST /api/auth/signup`, and related routes may be detailed here with full request/response schemas.

---

### Brands

#### POST `/api/brands`
**Description:** Create a new brand and trigger onboarding workflow

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "name": "string",
  "website": "string (optional)",
  "description": "string (optional)",
  "tenantId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "brand": {
    "id": "uuid",
    "name": "string",
    "slug": "string",
    "tenant_id": "uuid",
    "created_at": "timestamp"
  }
}
```

**Notes:**
- Automatically generates unique slug
- Triggers onboarding workflow
- Transfers scraped images if available

**Router:** `brandsRouter`

---

#### GET `/api/brands/:brandId/posting-schedule`
**Description:** Get brand posting schedule

**Auth:** `authenticateUser`, `requireScope("content:view")`

**Brand Access:** Verified via `assertBrandAccess`

**Response:**
```json
{
  "success": true,
  "schedule": {
    "brandId": "uuid",
    "schedule": {}
  }
}
```

---

#### PUT `/api/brands/:brandId/posting-schedule`
**Description:** Update brand posting schedule

**Auth:** `authenticateUser`, `requireScope("content:manage")`

**Brand Access:** Verified via `assertBrandAccess`

**Request Body:**
```json
{
  "schedule": {}
}
```

**Response:**
```json
{
  "success": true,
  "schedule": {}
}
```

---

#### `/api/brands/*` (Brand Members)
**Description:** Brand member management routes

**Auth:** `authenticateUser`, `requireScope("content:view")`

**Brand Access:** Verified via `assertBrandAccess`

**Router:** `brandMembersRouter`

---

### Content Management

#### POST `/api/dashboard`
**Description:** Get dashboard data for a brand

**Auth:** `authenticateUser`, `requireScope("content:view")`

**Request Body:**
```json
{
  "brandId": "uuid",
  "timeRange": "7d|30d|90d|1y" // default: "30d"
}
```

**Response:**
```json
{
  "success": true,
  "dashboard": {
    "metrics": {},
    "recentContent": [],
    "upcomingContent": []
  }
}
```

---

#### GET `/api/content-plan/*`
**Description:** Content plan routes (7-day content planning)

**Auth:** Varies (see `contentPlanRouter`)

**Router:** `contentPlanRouter`

---

#### GET `/api/calendar/*`
**Description:** Calendar routes (fetch scheduled content)

**Auth:** `authenticateUser`

**Router:** `calendarRouter`

---

#### GET `/api/reviews/*`
**Description:** Content reviews routes

**Auth:** `authenticateUser`

**Brand Access:** Verified via `assertBrandAccess`

**Router:** `reviewsRouter`

---

#### GET `/api/search`
**Description:** Search across brands, content, posts

**Auth:** `authenticateUser`, `requireScope("content:view")`

**Query Parameters:**
- `query`: Search query string
- `brandIds`: Comma-separated brand IDs
- `types`: Content types to search
- `limit`: Result limit

**Response:**
```json
{
  "results": [
    {
      "id": "uuid",
      "type": "brand|content|post",
      "title": "string",
      "subtitle": "string",
      "url": "string",
      "brandId": "uuid",
      "platform": "string",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ]
}
```

**Router:** `searchRouter`

---

### Publishing

#### POST `/api/publishing/oauth/initiate`
**Description:** Initiate OAuth flow for platform connection

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "platform": "instagram|facebook|linkedin|twitter|tiktok|pinterest|youtube|google_business",
  "brandId": "uuid"
}
```

**Response:**
```json
{
  "authUrl": "string",
  "state": "string"
}
```

**Validation:** `InitiateOAuthSchema`

---

#### GET `/api/publishing/oauth/callback/:platform`
**Description:** Handle OAuth callback

**Auth:** `authenticateUser` (validated in handler)

**Query Parameters:**
- `code`: Authorization code
- `state`: CSRF state token
- `error`: OAuth error (if any)

**Response:** Redirects to `/integrations` with success/error

**Notes:**
- Validates CSRF state token from cache
- Exchanges code for access token
- Stores connection in database
- Verifies brand access

---

#### POST `/api/publishing/publish`
**Description:** Publish content to connected platforms

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "brandId": "uuid",
  "contentId": "uuid (optional)",
  "postId": "uuid (optional)",
  "platform": "string",
  "content": {
    "caption": "string",
    "mediaUrls": ["string"],
    "hashtags": ["string"],
    "cta": {}
  },
  "scheduledFor": "ISO datetime (optional)",
  "validateOnly": "boolean (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "uuid",
  "status": "queued|scheduled|published",
  "platform": "string"
}
```

**Validation:** `PublishContentSchema`

**Brand Access:** Verified via `assertBrandAccess`

---

#### GET `/api/publishing/jobs`
**Description:** Get publishing jobs

**Auth:** `authenticateUser`

**Query Parameters:**
- `brandId`: Filter by brand
- `status`: Filter by status
- `limit`: Result limit
- `offset`: Pagination offset

**Response:**
```json
{
  "jobs": [
    {
      "id": "uuid",
      "brandId": "uuid",
      "status": "queued|processing|completed|failed",
      "platform": "string",
      "scheduledFor": "ISO datetime",
      "createdAt": "timestamp"
    }
  ],
  "total": 0
}
```

**Validation:** `GetJobsQuerySchema`

---

#### POST `/api/publishing/jobs/:jobId/retry`
**Description:** Retry a failed publishing job

**Auth:** `authenticateUser`

**Response:**
```json
{
  "success": true,
  "jobId": "uuid"
}
```

---

#### POST `/api/publishing/jobs/:jobId/cancel`
**Description:** Cancel a publishing job

**Auth:** `authenticateUser`

**Response:**
```json
{
  "success": true,
  "jobId": "uuid"
}
```

---

#### GET `/api/publishing/connections`
**Description:** Get platform connections for a brand

**Auth:** `authenticateUser`

**Query Parameters:**
- `brandId`: Brand ID

**Response:**
```json
{
  "connections": [
    {
      "id": "uuid",
      "platform": "string",
      "status": "connected|disconnected|expired",
      "accountUsername": "string",
      "connectedAt": "timestamp"
    }
  ]
}
```

**Brand Access:** Verified via `assertBrandAccess`

---

#### DELETE `/api/publishing/connections/:connectionId`
**Description:** Disconnect a platform

**Auth:** `authenticateUser`

**Response:**
```json
{
  "success": true
}
```

---

#### POST `/api/publishing/connections/:connectionId/verify`
**Description:** Verify connection status

**Auth:** `authenticateUser`

**Response:**
```json
{
  "success": true,
  "status": "connected|disconnected|expired"
}
```

---

#### POST `/api/publishing/connections/:connectionId/refresh`
**Description:** Refresh OAuth token

**Auth:** `authenticateUser`

**Response:**
```json
{
  "success": true,
  "expiresAt": "ISO datetime"
}
```

---

#### POST `/api/publishing/blog`
**Description:** Publish blog post

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "brandId": "uuid",
  "title": "string",
  "content": "string",
  "tags": ["string"],
  "categories": ["string"],
  "scheduledFor": "ISO datetime (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "postId": "uuid"
}
```

**Brand Access:** Verified via `assertBrandAccess`

---

#### POST `/api/publishing/email`
**Description:** Publish email campaign

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "brandId": "uuid",
  "subject": "string",
  "content": "string",
  "recipients": ["string"],
  "scheduledFor": "ISO datetime (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "campaignId": "uuid"
}
```

**Brand Access:** Verified via `assertBrandAccess`

---

#### PUT `/api/publishing/jobs/:jobId/schedule`
**Description:** Update scheduled time for a job

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "scheduledAt": "ISO datetime"
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "uuid"
}
```

---

**Router:** `publishingRouter` (mounted at `/api/publishing`)

---

### Analytics

#### GET `/api/analytics/:brandId`
**Description:** Get analytics summary for a brand

**Auth:** `authenticateUser`

**Query Parameters:**
- `days`: Number of days (default: 30)

**Brand Access:** Verified via `assertBrandAccess`

**Response:**
```json
{
  "summary": {
    "totalEngagement": 0,
    "totalReach": 0,
    "totalImpressions": 0,
    "platformBreakdown": {}
  },
  "platformStats": {}
}
```

---

#### GET `/api/analytics/:brandId/insights`
**Description:** Get analytics insights

**Auth:** `authenticateUser`

**Brand Access:** Verified via `assertBrandAccess`

**Response:**
```json
{
  "insights": []
}
```

---

#### GET `/api/analytics/:brandId/forecast`
**Description:** Get analytics forecast

**Auth:** `authenticateUser`

**Brand Access:** Verified via `assertBrandAccess`

**Response:**
```json
{
  "forecast": {}
}
```

---

#### POST `/api/analytics/:brandId/voice-query`
**Description:** Process natural language analytics query

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "query": "string (3-500 chars)"
}
```

**Brand Access:** Verified via `assertBrandAccess`

**Response:**
```json
{
  "answer": "string",
  "data": {}
}
```

**Validation:** `voiceQuerySchema`

---

#### POST `/api/analytics/:brandId/feedback`
**Description:** Submit feedback on analytics insights

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "insightId": "string",
  "feedback": "accepted|implemented|rejected",
  "category": "string (optional)",
  "type": "string (optional)",
  "previousWeight": "number (optional)"
}
```

**Brand Access:** Verified via `assertBrandAccess`

**Response:**
```json
{
  "success": true
}
```

**Validation:** `feedbackSchema`

---

#### GET `/api/analytics/:brandId/goals`
**Description:** Get analytics goals

**Auth:** `authenticateUser`

**Brand Access:** Verified via `assertBrandAccess`

**Response:**
```json
{
  "goals": []
}
```

---

#### POST `/api/analytics/:brandId/goals`
**Description:** Create analytics goal

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "metric": "string",
  "target": 0,
  "deadline": "ISO datetime",
  "notes": "string (optional, max 500 chars)"
}
```

**Brand Access:** Verified via `assertBrandAccess`

**Response:**
```json
{
  "success": true,
  "goal": {}
}
```

**Validation:** `createGoalSchema`

---

#### POST `/api/analytics/:brandId/sync`
**Description:** Sync analytics data from platforms

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "platform": "string"
}
```

**Brand Access:** Verified via `assertBrandAccess`

**Response:**
```json
{
  "success": true,
  "synced": true
}
```

**Validation:** `syncPayloadSchema`

---

#### POST `/api/analytics/:brandId/offline-metric`
**Description:** Add offline metric data

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "metric": "string",
  "value": 0,
  "date": "ISO datetime"
}
```

**Brand Access:** Verified via `assertBrandAccess`

**Response:**
```json
{
  "success": true
}
```

**Validation:** `offlineMetricSchema`

---

#### GET `/api/analytics/:brandId/heatmap`
**Description:** Get engagement heatmap

**Auth:** `authenticateUser`

**Brand Access:** Verified via `assertBrandAccess`

**Response:**
```json
{
  "heatmap": {}
}
```

---

#### GET `/api/analytics/:brandId/alerts`
**Description:** Get analytics alerts

**Auth:** `authenticateUser`

**Brand Access:** Verified via `assertBrandAccess`

**Response:**
```json
{
  "alerts": []
}
```

---

#### POST `/api/analytics/:brandId/alerts/:alertId/acknowledge`
**Description:** Acknowledge an alert

**Auth:** `authenticateUser`

**Brand Access:** Verified via `assertBrandAccess`

**Response:**
```json
{
  "success": true
}
```

---

**Router:** `analyticsRouter` (mounted at `/api/analytics`)

---

### Approvals

**Router:** `approvalsRouter` (mounted at `/api/approvals`)

Routes handled by approvals router - see `server/routes/approvals.ts`

---

#### POST `/api/bulk-approvals/approve`
**Description:** Bulk approve content

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "contentIds": ["uuid"],
  "brandId": "uuid"
}
```

**Brand Access:** Verified via `assertBrandAccess`

**Response:**
```json
{
  "success": true,
  "approved": 0
}
```

---

#### POST `/api/bulk-approvals/reject`
**Description:** Bulk reject content

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "contentIds": ["uuid"],
  "brandId": "uuid",
  "reason": "string"
}
```

**Brand Access:** Verified via `assertBrandAccess`

**Response:**
```json
{
  "success": true,
  "rejected": 0
}
```

---

#### GET `/api/bulk-approvals/status`
**Description:** Get approval status for content

**Auth:** `authenticateUser`

**Query Parameters:**
- `contentIds`: Comma-separated content IDs

**Response:**
```json
{
  "statuses": {}
}
```

---

#### GET `/api/bulk-approvals/batch/:batchId`
**Description:** Get batch approval status

**Auth:** `authenticateUser`

**Response:**
```json
{
  "batchId": "uuid",
  "status": "pending|approved|rejected",
  "items": []
}
```

---

#### POST `/api/bulk-approvals/lock`
**Description:** Lock posts after approval

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "contentIds": ["uuid"],
  "brandId": "uuid"
}
```

**Brand Access:** Verified via `assertBrandAccess`

**Response:**
```json
{
  "success": true
}
```

---

### Media Management

#### POST `/api/media/upload`
**Description:** Upload media asset

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "brandId": "uuid",
  "tenantId": "uuid",
  "filename": "string",
  "mimeType": "string",
  "fileSize": 0,
  "hash": "string (optional)",
  "path": "string (optional)",
  "category": "images|graphics|videos|logos|ai_exports|client_uploads",
  "metadata": {}
}
```

**Response:**
```json
{
  "success": true,
  "asset": {
    "id": "uuid",
    "filename": "string",
    "originalName": "string",
    "category": "string",
    "mimeType": "string",
    "size": 0,
    "brandId": "uuid",
    "tenantId": "uuid",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  },
  "uploadId": "string"
}
```

**Error Codes:**
- `QUOTA_EXCEEDED` (429) - Storage quota exceeded
- `DUPLICATE_RESOURCE` (409) - Asset already exists

---

#### GET `/api/media/list`
**Description:** List media assets

**Auth:** `authenticateUser`

**Query Parameters:**
- `brandId`: Brand ID (required)
- `category`: Filter by category
- `limit`: Result limit (default: 50)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "assets": [
    {
      "id": "uuid",
      "filename": "string",
      "category": "string",
      "mimeType": "string",
      "size": 0,
      "brandId": "uuid",
      "createdAt": "timestamp"
    }
  ],
  "total": 0
}
```

---

#### GET `/api/media/usage/:brandId`
**Description:** Get storage usage for a brand

**Auth:** `authenticateUser`

**Brand Access:** Verified via `assertBrandAccess`

**Response:**
```json
{
  "used": 0,
  "limit": 0,
  "percentage": 0
}
```

---

#### GET `/api/media/url/:assetId`
**Description:** Get asset URL

**Auth:** `authenticateUser`

**Response:**
```json
{
  "url": "string",
  "expiresAt": "ISO datetime (optional)"
}
```

---

#### POST `/api/media/duplicate-check`
**Description:** Check for duplicate asset

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "hash": "string",
  "brandId": "uuid"
}
```

**Response:**
```json
{
  "isDuplicate": true,
  "existingAsset": {}
}
```

---

#### POST `/api/media/seo-metadata`
**Description:** Generate SEO metadata for asset

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "assetId": "uuid",
  "context": {}
}
```

**Response:**
```json
{
  "metadata": {
    "title": "string",
    "description": "string",
    "keywords": ["string"]
  }
}
```

---

#### POST `/api/media/track-usage`
**Description:** Track asset usage

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "assetId": "uuid",
  "contentId": "uuid",
  "brandId": "uuid"
}
```

**Response:**
```json
{
  "success": true
}
```

---

#### GET `/api/media/stock-images/search`
**Description:** Search stock images

**Auth:** `authenticateUser`, `requireScope("content:view")`

**Query Parameters:**
- `query`: Search query
- `limit`: Result limit

**Response:**
```json
{
  "images": [
    {
      "id": "string",
      "url": "string",
      "thumbnail": "string",
      "width": 0,
      "height": 0
    }
  ]
}
```

---

#### GET `/api/media/stock-images/:id`
**Description:** Get stock image details

**Auth:** `authenticateUser`, `requireScope("content:view")`

**Response:**
```json
{
  "id": "string",
  "url": "string",
  "width": 0,
  "height": 0,
  "metadata": {}
}
```

---

### AI Generation

All AI endpoints that accept `brandId` enforce brand access via `assertBrandAccess` before generating content. No AI endpoint should generate content without a brand context, in alignment with `POSTD_PRODUCT_DEFINITION_AND_GUARDRAILS.md`.

#### POST `/api/ai/advisor`
**Description:** Get AI advisor insights

**Auth:** `authenticateUser`, `requireScope("ai:generate")`

**Brand Access:** Verified via `assertBrandAccess`

**Request Body:**
```json
{
  "brandId": "uuid",
  "query": "string",
  "context": {}
}
```

**Response:**
```json
{
  "insights": [],
  "recommendations": []
}
```

---

#### POST `/api/ai/doc`
**Description:** Generate document content via Doc Agent

**Auth:** `authenticateUser`, `requireScope("ai:generate")`

**Brand Access:** Verified via `assertBrandAccess`

**Request Body:**
```json
{
  "brandId": "uuid",
  "input": {},
  "context": {}
}
```

**Response:**
```json
{
  "content": "string",
  "metadata": {}
}
```

---

#### POST `/api/ai/design`
**Description:** Generate design content via Design Agent

**Auth:** `authenticateUser`, `requireScope("ai:generate")`

**Brand Access:** Verified via `assertBrandAccess`

**Request Body:**
```json
{
  "brandId": "uuid",
  "input": {},
  "context": {}
}
```

**Response:**
```json
{
  "design": {},
  "metadata": {}
}
```

---

#### POST `/api/ai/sync`
**Description:** Get AI sync state (collaboration coordination)

**Auth:** `authenticateUser`, `requireScope("ai:generate")`

**Request Body:**
```json
{
  "brandId": "uuid"
}
```

**Response:**
```json
{
  "state": {},
  "agents": []
}
```

**Brand Access:** Verified via `assertBrandAccess`

---

#### POST `/api/ai/generate/content`
**Description:** Generate AI content

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "brandId": "uuid",
  "prompt": "string",
  "options": {}
}
```

**Response:**
```json
{
  "content": "string",
  "metadata": {}
}
```

---

#### POST `/api/ai/generate/design`
**Description:** Generate AI design

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "brandId": "uuid",
  "prompt": "string",
  "options": {}
}
```

**Response:**
```json
{
  "design": {},
  "metadata": {}
}
```

---

#### GET `/api/ai/providers`
**Description:** Get available AI providers

**Auth:** `authenticateUser`

**Response:**
```json
{
  "providers": [
    {
      "id": "string",
      "name": "string",
      "enabled": true
    }
  ]
}
```

---

#### POST `/api/ai/generate`
**Description:** Generate content via Builder

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "brandId": "uuid",
  "input": {}
}
```

**Response:**
```json
{
  "content": {},
  "metadata": {}
}
```

---

#### POST `/api/ai/webhook`
**Description:** Builder webhook handler

**Auth:** Varies (webhook authentication)

**Request Body:** Varies

**Response:**
```json
{
  "success": true
}
```

---

#### POST `/api/ai/brand-guide/*`
**Description:** Brand guide generation routes

**Auth:** `authenticateUser`

**Router:** `brandGuideGenerateRouter`

---

#### POST `/api/orchestration/*`
**Description:** Full AI orchestration pipeline routes

**Auth:** `authenticateUser`

**Router:** `orchestrationRouter`

---

#### POST `/api/agents/*`
**Description:** Agent routes (multi-agent collaboration)

**Auth:** `authenticateUser`, `requireScope("ai:generate")`

**Router:** `agentsRouter`

---

### Brand Intelligence

#### GET `/api/brand-intelligence/:brandId`
**Description:** Get brand intelligence insights

**Auth:** `authenticateUser`

**Brand Access:** Verified via `assertBrandAccess`

**Response:**
```json
{
  "insights": [],
  "recommendations": [],
  "metrics": {}
}
```

---

#### POST `/api/brand-intelligence/feedback`
**Description:** Submit feedback on brand intelligence recommendations

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "recommendationId": "string",
  "feedback": "accepted|rejected|implemented",
  "notes": "string (optional)"
}
```

**Response:**
```json
{
  "success": true
}
```

---

### Creative Studio

#### POST `/api/studio/*`
**Description:** Creative Studio routes

**Auth:** `authenticateUser`

**Brand Access:** Verified via `assertBrandAccess`

**Router:** `studioRouter` (also mounted at `/api/creative-studio`)

**Routes:**
- `POST /save` - Save design
- `GET /:designId` - Get design
- `PUT /:designId` - Update design
- `POST /:designId/schedule` - Schedule design for publishing
- `DELETE /:designId` - Delete design

---

### Client Portal

#### GET `/api/client-portal/share-links/:token`
**Description:** Get share link by token (public, no auth)

**Auth:** None (public)

**Response:**
```json
{
  "link": {},
  "content": {}
}
```

---

**Router:** `clientPortalRouter` (mounted at `/api/client-portal`)

Routes handled by client portal router - see `server/routes/client-portal.ts`

---

#### GET `/api/client-settings`
**Description:** Get client settings

**Auth:** `authenticateUser`

**Response:**
```json
{
  "settings": {}
}
```

---

#### PUT `/api/client-settings`
**Description:** Update client settings

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "settings": {}
}
```

**Response:**
```json
{
  "success": true,
  "settings": {}
}
```

---

#### POST `/api/client-settings/email-preferences`
**Description:** Update email preferences

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "preferences": {}
}
```

**Response:**
```json
{
  "success": true
}
```

---

#### POST `/api/client-settings/unsubscribe-link`
**Description:** Generate unsubscribe link

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "email": "string"
}
```

**Response:**
```json
{
  "link": "string"
}
```

---

#### POST `/api/client-settings/unsubscribe`
**Description:** Unsubscribe from emails

**Auth:** None (public)

**Request Body:**
```json
{
  "token": "string"
}
```

**Response:**
```json
{
  "success": true
}
```

---

#### POST `/api/client-settings/resubscribe`
**Description:** Resubscribe to emails

**Auth:** None (public)

**Request Body:**
```json
{
  "token": "string"
}
```

**Response:**
```json
{
  "success": true
}
```

---

#### GET `/api/client-settings/verify-unsubscribe/:token`
**Description:** Verify unsubscribe token

**Auth:** None (public)

**Response:**
```json
{
  "valid": true,
  "email": "string"
}
```

---

### Integrations

**Router:** `integrationsRouter` (mounted at `/api/integrations`)

Routes handled by integrations router - see `server/routes/integrations.ts`

---

### Webhooks

#### POST `/api/webhooks/zapier`
**Description:** Zapier webhook handler

**Auth:** Webhook authentication

**Request Body:** Varies

**Response:**
```json
{
  "success": true
}
```

---

#### POST `/api/webhooks/make`
**Description:** Make.com webhook handler

**Auth:** Webhook authentication

**Request Body:** Varies

**Response:**
```json
{
  "success": true
}
```

---

#### POST `/api/webhooks/slack`
**Description:** Slack webhook handler

**Auth:** Webhook authentication

**Request Body:** Varies

**Response:**
```json
{
  "success": true
}
```

---

#### POST `/api/webhooks/hubspot`
**Description:** HubSpot webhook handler

**Auth:** Webhook authentication

**Request Body:** Varies

**Response:**
```json
{
  "success": true
}
```

---

#### GET `/api/webhooks/status`
**Description:** Get webhook status

**Auth:** `authenticateUser`

**Response:**
```json
{
  "status": {}
}
```

---

#### GET `/api/webhooks/logs`
**Description:** Get webhook logs

**Auth:** `authenticateUser`

**Response:**
```json
{
  "logs": []
}
```

---

#### POST `/api/webhooks/retry/:eventId`
**Description:** Retry webhook event

**Auth:** `authenticateUser`

**Response:**
```json
{
  "success": true
}
```

---

**Router:** Webhook routes (see `server/routes/webhooks.ts`)

---

### Admin

**Router:** `adminRouter` (mounted at `/api/admin`)

Routes handled by admin router - see `server/routes/admin.ts`

---

### Other

#### GET `/api/brand-guide/*`
**Description:** Brand guide routes

**Auth:** `authenticateUser`

**Router:** `brandGuideRouter`

---

#### POST `/api/onboarding/*`
**Description:** Onboarding routes

**Auth:** `authenticateUser`

**Router:** `onboardingRouter`

---

#### POST `/api/crawl/*`
**Description:** Website crawler routes

**Auth:** `authenticateUser`

**Router:** `crawlerRouter`

---

#### GET `/api/workflow/*`
**Description:** Workflow routes

**Auth:** `authenticateUser`

**Router:** `workflowRouter`

---

#### GET `/api/notifications/*`
**Description:** Notifications routes

**Auth:** `authenticateUser`

**Router:** `notificationsRouter`

---

#### GET `/api/billing/*`
**Description:** Billing routes

**Auth:** `authenticateUser`

**Router:** `billingRouter`

---

#### GET `/api/trial/*`
**Description:** Trial routes

**Auth:** `authenticateUser`

**Router:** `trialRouter`

---

#### GET `/api/milestones/*`
**Description:** Milestones routes

**Auth:** `authenticateUser`

**Router:** `milestonesRouter`

---

#### GET `/api/preferences`
**Description:** Get user preferences

**Auth:** `authenticateUser`

**Response:**
```json
{
  "preferences": {}
}
```

---

#### PUT `/api/preferences`
**Description:** Update user preferences

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "preferences": {}
}
```

**Response:**
```json
{
  "success": true,
  "preferences": {}
}
```

---

#### GET `/api/preferences/export`
**Description:** Export user preferences

**Auth:** `authenticateUser`

**Response:**
```json
{
  "preferences": {}
}
```

---

#### GET `/api/audit/logs`
**Description:** Get audit logs

**Auth:** `authenticateUser`

**Query Parameters:**
- `brandId`: Filter by brand
- `limit`: Result limit
- `offset`: Pagination offset

**Response:**
```json
{
  "logs": [],
  "total": 0
}
```

---

#### GET `/api/audit/posts/:postId`
**Description:** Get audit log for a post

**Auth:** `authenticateUser`

**Response:**
```json
{
  "logs": []
}
```

---

#### GET `/api/audit/stats`
**Description:** Get audit statistics

**Auth:** `authenticateUser`

**Response:**
```json
{
  "stats": {}
}
```

---

#### POST `/api/audit/export`
**Description:** Export audit logs

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "filters": {},
  "format": "csv|json"
}
```

**Response:** File download or JSON

---

#### POST `/api/audit/search`
**Description:** Search audit logs

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "query": "string",
  "filters": {}
}
```

**Response:**
```json
{
  "results": []
}
```

---

#### GET `/api/audit/actions`
**Description:** Get available audit actions

**Auth:** `authenticateUser`

**Response:**
```json
{
  "actions": []
}
```

---

#### GET `/api/white-label/config`
**Description:** Get white label config

**Auth:** `authenticateUser`

**Response:**
```json
{
  "config": {}
}
```

---

#### GET `/api/white-label/domain/:domain`
**Description:** Get config by domain

**Auth:** None (public, for white-label domains)

**Response:**
```json
{
  "config": {}
}
```

---

#### PUT `/api/white-label/config`
**Description:** Update white label config

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "config": {}
}
```

**Response:**
```json
{
  "success": true,
  "config": {}
}
```

---

## Notes

### Rate Limiting
- Most endpoints have rate limiting applied
- Stricter limits for sensitive endpoints (AI generation, publishing)
- Rate limit errors return `429 Too Many Requests`

### Brand Access
- Most endpoints require brand access verification
- `assertBrandAccess()` is called automatically in route handlers
- SUPERADMIN role can bypass brand checks (where allowed)

### Validation
- Request bodies are validated using Zod schemas
- Validation errors return `400 Bad Request` with details

### Pagination
- List endpoints support `limit` and `offset` query parameters
- Default limit is usually 50
- Responses include `total` count when available

### Webhooks
- Webhook endpoints use custom authentication
- Webhook events are logged and can be retried

### Multi-Tenant
- All brand-scoped operations are isolated by `tenantId`
- Users can only access brands in their workspace

---

**Last Updated:** 2025-01-20  
**Maintained By:** Phase 5 Cleanup Engineer

