# Backend Routes Summary

**Last Updated:** January 2025  
**Purpose:** API contract documentation for frontend integration

This document describes all core API endpoints, their authentication requirements, request/response formats, and example payloads.

---

## Table of Contents

- [Search Routes](#search-routes)
- [Media Routes](#media-routes)
- [Brand Intelligence Routes](#brand-intelligence-routes)
- [Client Settings Routes](#client-settings-routes)
- [Client Portal Routes](#client-portal-routes)
- [Billing Routes](#billing-routes)
- [Trial Routes](#trial-routes)
- [Milestones Routes](#milestones-routes)
- [Integrations Routes](#integrations-routes)
- [Admin Routes](#admin-routes)

---

## Search Routes

### GET /api/search

**Auth:** `authenticateUser` + `requireScope("content:view")`

**Query Parameters:**
- `q` (required): Search query string (1-120 chars)
- `limit` (optional): Results limit (1-100, default: 20)
- `brand` (optional): Filter by brand UUID
- `platform` (optional): Filter by platform
- `types` (optional): Comma-separated entity types (e.g., "brand,content,post")

**Response:**
```json
{
  "results": [
    {
      "id": "result-id",
      "type": "content",
      "title": "Result Title",
      "snippet": "Result snippet...",
      "metadata": {}
    }
  ],
  "query": "search term",
  "filters": {
    "brand": "brand-id",
    "platform": "instagram",
    "types": ["content", "post"]
  },
  "total": 10
}
```

---

## Media Routes

### POST /api/media/upload

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "brandId": "uuid",
  "tenantId": "uuid",
  "filename": "image.jpg",
  "mimeType": "image/jpeg",
  "fileSize": 1024000,
  "hash": "sha256-hash",
  "path": "tenant/brand/filename.jpg",
  "category": "images",
  "metadata": {},
  "thumbnailUrl": "https://..."
}
```

**Response:**
```json
{
  "success": true,
  "asset": {
    "id": "asset-uuid",
    "filename": "image.jpg",
    "url": "https://...",
    "size": 1024000,
    "mimeType": "image/jpeg",
    "uploadedAt": "2025-01-15T10:00:00Z"
  },
  "uploadId": "asset-uuid"
}
```

### GET /api/media/list

**Auth:** `authenticateUser`

**Query Parameters:**
- `brandId` (required): Brand UUID
- `category` (optional): Filter by category
- `limit` (optional): Pagination limit (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "assets": [
    {
      "id": "asset-uuid",
      "filename": "image.jpg",
      "category": "images",
      "mimeType": "image/jpeg",
      "size": 1024000,
      "brandId": "brand-uuid",
      "createdAt": "2025-01-15T10:00:00Z",
      "usageCount": 5,
      "lastUsed": "2025-01-15T12:00:00Z"
    }
  ],
  "total": 100,
  "hasMore": true,
  "categories": {
    "images": 50,
    "graphics": 30,
    "videos": 20
  }
}
```

### GET /api/media/usage/:brandId

**Auth:** `authenticateUser`

**Response:**
```json
{
  "brandId": "brand-uuid",
  "totalSize": 5242880000,
  "assetCount": 150,
  "bucketName": "tenant-storage",
  "categoryBreakdown": {
    "images": { "count": 100, "size": 3000000000 },
    "graphics": { "count": 30, "size": 1500000000 }
  },
  "lastUpdated": "2025-01-15T10:00:00Z"
}
```

### POST /api/media/track-usage

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "assetId": "asset-uuid",
  "usedIn": "content-item-id" // or array of IDs
}
```

**Response:**
```json
{
  "success": true,
  "asset": {
    "id": "asset-uuid",
    "usageCount": 6,
    "lastUsed": "2025-01-15T12:00:00Z",
    "usedIn": ["content-item-id"]
  }
}
```

---

## Brand Intelligence Routes

### GET /api/brand-intelligence/:brandId

**Auth:** `authenticateUser`

**Response:**
```json
{
  "id": "intel-brand-id",
  "brandId": "brand-uuid",
  "brandProfile": {
    "usp": ["Unique selling point 1"],
    "differentiators": ["Differentiator 1"],
    "coreValues": ["value1", "value2"],
    "targetAudience": {
      "demographics": {},
      "psychographics": []
    }
  },
  "recommendations": {
    "strategic": [
      {
        "id": "strat_1",
        "type": "differentiation",
        "title": "Recommendation Title",
        "description": "Description...",
        "impact": "high",
        "effort": "medium"
      }
    ],
    "tactical": [],
    "contentSuggestions": []
  },
  "lastAnalyzed": "2025-01-15T10:00:00Z",
  "confidenceScore": 0.87
}
```

### POST /api/brand-intelligence/feedback

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "recommendationId": "strat_1",
  "action": "accepted" // or "rejected"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feedback recorded successfully",
  "feedbackId": "feedback-uuid",
  "timestamp": "2025-01-15T10:00:00Z"
}
```

**Persistence:** Feedback is stored in `advisor_feedback` table with:
- `brand_id`, `tenant_id`, `insight_id`
- `category`, `type`, `feedback` (accepted/rejected)
- `previous_weight`, `new_weight` (for learning system)

---

## Client Settings Routes

### GET /api/client-settings

**Auth:** `authenticateUser`

**Headers:**
- `x-client-id` (required)
- `x-brand-id` (required)

**Response:**
```json
{
  "success": true,
  "settings": {
    "id": "settings-uuid",
    "clientId": "client-uuid",
    "brandId": "brand-uuid",
    "emailPreferences": {
      "approvals_needed": true,
      "approval_reminders": true,
      "publish_failures": true,
      "weekly_digest": true
    },
    "timezone": "America/New_York",
    "language": "en",
    "unsubscribedFromAll": false,
    "unsubscribedTypes": []
  }
}
```

### PUT /api/client-settings

**Auth:** `authenticateUser`

**Headers:**
- `x-client-id` (required)
- `x-brand-id` (required)
- `x-user-id` (optional)
- `x-user-email` (optional)

**Request Body:**
```json
{
  "emailPreferences": {
    "approvals_needed": false
  },
  "timezone": "America/Los_Angeles",
  "language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "settings": { /* updated settings */ },
  "message": "Settings updated successfully"
}
```

### POST /api/client-settings/unsubscribe

**Auth:** None (public endpoint for email links)

**Request Body:**
```json
{
  "unsubscribeToken": "token-from-email",
  "fromType": "approvals_needed" // optional, omit to unsubscribe from all
}
```

**Response:**
```json
{
  "success": true,
  "message": "Unsubscribed from approvals_needed",
  "unsubscribedFromAll": false,
  "unsubscribedTypes": ["approvals_needed"]
}
```

---

## Client Portal Routes

### GET /api/client-portal/:clientId/dashboard

**Auth:** `authenticateUser` + `requireScope("content:view")`

**Response:**
```json
{
  "totalContent": 50,
  "approvedContent": 30,
  "pendingApprovals": 5,
  "recentActivity": [
    {
      "id": "activity-id",
      "type": "approval",
      "title": "Content approved",
      "timestamp": "2025-01-15T10:00:00Z"
    }
  ]
}
```

### POST /api/client-portal/approve/:contentId

**Auth:** `authenticateUser` + `requireScope("content:approve")`

**Response:**
```json
{
  "success": true,
  "contentId": "content-uuid",
  "status": "approved",
  "approvedAt": "2025-01-15T10:00:00Z"
}
```

### POST /api/client-portal/media/upload

**Auth:** `authenticateUser` + `requireScope("content:view")`

**Request:** Multipart form data with file

**Response:**
```json
{
  "success": true,
  "media": {
    "id": "media-uuid",
    "filename": "upload.jpg",
    "url": "https://...",
    "uploadedAt": "2025-01-15T10:00:00Z"
  }
}
```

---

## Billing Routes

### GET /api/billing/status

**Auth:** `authenticateUser`

**Response:**
```json
{
  "subscription": {
    "plan": "agency",
    "status": "active",
    "currentPeriodEnd": "2025-02-15T00:00:00Z",
    "price": 99.00,
    "brands": 5
  },
  "usage": {
    "postsPublished": 150,
    "brandsManaged": 5,
    "limits": {
      "postsPublished": null,
      "brandsManaged": 10
    }
  },
  "paymentMethod": {
    "last4": "4242",
    "expiry": "12/25",
    "brand": "visa"
  }
}
```

---

## Trial Routes

### GET /api/trial/status

**Auth:** `authenticateUser`

**Response:**
```json
{
  "success": true,
  "data": {
    "isTrial": true,
    "trialDaysRemaining": 7,
    "trialStartedAt": "2025-01-08T10:00:00Z",
    "trialEndsAt": "2025-01-15T10:00:00Z"
  }
}
```

### POST /api/trial/start

**Auth:** `authenticateUser`

**Response:**
```json
{
  "success": true,
  "message": "Trial started",
  "trialEndsAt": "2025-01-22T10:00:00Z"
}
```

---

## Milestones Routes

### GET /api/milestones

**Auth:** `authenticateUser`

**Query Parameters:**
- `workspaceId` (optional): Workspace ID (from header or query)

**Response:**
```json
[
  {
    "key": "first_post",
    "title": "First Post Published",
    "description": "You've published your first piece of content!",
    "achieved": true,
    "achievedAt": "2025-01-10T10:00:00Z"
  },
  {
    "key": "ten_posts",
    "title": "10 Posts Published",
    "description": "You're building momentum!",
    "achieved": false,
    "achievedAt": null
  }
]
```

---

## Integrations Routes

### GET /api/integrations

**Auth:** `authenticateUser`

**Query Parameters:**
- `brandId` (required): Brand UUID

**Response:**
```json
{
  "integrations": [
    {
      "id": "integration-uuid",
      "type": "instagram",
      "name": "My Instagram Account",
      "brandId": "brand-uuid",
      "status": "connected",
      "credentials": {
        "accessToken": "...",
        "expiresAt": "2025-02-15T10:00:00Z"
      },
      "lastSyncAt": "2025-01-15T10:00:00Z"
    }
  ]
}
```

### POST /api/integrations

**Auth:** `authenticateUser`

**Request Body:**
```json
{
  "type": "instagram",
  "brandId": "brand-uuid",
  "credentials": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "integration": { /* created integration */ }
}
```

---

## Admin Routes

**Auth:** `authenticateUser` + `requireScope("platform:admin")`

### GET /api/admin/overview

**Response:**
```json
{
  "totals": {
    "tenants": 10,
    "brands": 50,
    "users": 200
  },
  "billing": {
    "mrr": 5000.00,
    "churnRate": 0.05,
    "planDistribution": {
      "solo": 5,
      "agency": 3,
      "enterprise": 2
    },
    "trialCount": 2
  }
}
```

### GET /api/admin/tenants

**Response:**
```json
{
  "tenants": [
    {
      "id": "tenant-uuid",
      "name": "Tenant Name",
      "plan": "agency",
      "status": "active",
      "brandCount": 5,
      "userCount": 20
    }
  ]
}
```

### GET /api/admin/users

**Response:**
```json
{
  "users": [
    {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "User Name",
      "role": "BRAND_MANAGER",
      "brands": ["brand-uuid"],
      "status": "active",
      "lastLoginAt": "2025-01-15T10:00:00Z"
    }
  ]
}
```

### GET /api/admin/billing

**Response:**
```json
{
  "mrr": 5000.00,
  "churnRate": 0.05,
  "planDistribution": {
    "solo": 5,
    "agency": 3,
    "enterprise": 2
  },
  "trialCount": 2
}
```

### GET /api/admin/feature-flags

**Response:**
```json
{
  "flags": {
    "client_portal_enabled": true,
    "approvals_v2_enabled": true,
    "ai_agents_enabled": true
  }
}
```

### POST /api/admin/feature-flags

**Request Body:**
```json
{
  "flag": "client_portal_enabled",
  "enabled": false
}
```

**Response:**
```json
{
  "success": true,
  "flags": { /* updated flags */ }
}
```

---

## Error Responses

All endpoints return consistent error format:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "statusCode": 400,
  "details": {
    "field": "additional context"
  }
}
```

**Common Error Codes:**
- `UNAUTHORIZED` (401): Authentication required
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `MISSING_REQUIRED_FIELD` (400): Required parameter missing
- `VALIDATION_ERROR` (422): Request validation failed
- `INTERNAL_ERROR` (500): Server error

---

## Authentication

Most routes require:
1. **JWT Token** in `Authorization: Bearer <token>` header
2. **User Context** attached to request via `authenticateUser` middleware
3. **Scope Requirements** enforced via `requireScope` middleware

**Available Scopes:**
- `content:view` - View content
- `content:manage` - Create/update content
- `content:approve` - Approve/reject content
- `ai:generate` - Use AI agents
- `analytics:read` - View analytics
- `analytics:manage` - Manage analytics
- `workflow:manage` - Manage workflows
- `platform:admin` - Platform administration

---

## Notes

- All timestamps are ISO 8601 format (UTC)
- UUIDs are standard UUID v4 format
- Pagination uses `limit`/`offset` pattern
- File uploads use multipart/form-data
- JSON request bodies use `Content-Type: application/json`

