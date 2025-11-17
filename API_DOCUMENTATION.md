# Aligned AI - API Documentation

## Overview

This document describes the REST API endpoints for the Aligned AI content management and approval platform. All endpoints require authentication and support multi-tenant isolation via brand_id.

## Authentication

All API requests require authentication via:
- **Authorization Header**: `Bearer {token}` or `{token}`
- **Custom Headers**:
  - `X-User-ID`: User identifier
  - `X-Brand-ID`: Brand/tenant identifier
  - `X-User-Email`: User email address
  - `X-User-Role`: User role (admin, agency, client, viewer)

## Base URL

```
https://api.alignedai.com/api
```

## Error Responses

All error responses follow this format:

```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "statusCode": 400,
  "severity": "warning",
  "requestId": "req-12345"
}
```

## Media Management API

### Upload Media Asset

**POST** `/media/upload`

Upload a new media asset to the platform.

**Request Body:**
```json
{
  "brandId": "string",
  "tenantId": "string",
  "filename": "string",
  "mimeType": "string",
  "fileSize": 0,
  "hash": "string (optional)",
  "path": "string (optional)",
  "category": "images|graphics|videos|logos|ai_exports|client_uploads",
  "metadata": {}
}
```

**Response (201):**
```json
{
  "success": true,
  "asset": {
    "id": "string",
    "filename": "string",
    "originalName": "string",
    "category": "string",
    "mimeType": "string",
    "size": 0,
    "brandId": "string",
    "tenantId": "string",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  },
  "uploadId": "string"
}
```

**Error Codes:**
- `MISSING_REQUIRED_FIELD` (400): Required fields missing
- `QUOTA_EXCEEDED` (429): Storage quota exceeded
- `DUPLICATE_RESOURCE` (409): Asset already exists

---

### List Media Assets

**GET** `/media?brandId={brandId}&category={category}&limit={limit}&offset={offset}`

List media assets for a brand with optional filtering.

**Query Parameters:**
- `brandId` (required): Brand identifier
- `category` (optional): Filter by category
- `limit` (default: 50): Number of results
- `offset` (default: 0): Result offset for pagination

**Response (200):**
```json
{
  "assets": [
    {
      "id": "string",
      "filename": "string",
      "category": "string",
      "mimeType": "string",
      "size": 0,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 0,
  "hasMore": false,
  "categories": {
    "images": 10,
    "videos": 5
  }
}
```

---

### Get Storage Usage

**GET** `/media/{brandId}/usage`

Get storage usage statistics for a brand.

**Response (200):**
```json
{
  "brandId": "string",
  "totalSize": 0,
  "assetCount": 0,
  "bucketName": "string",
  "categoryBreakdown": {
    "images": {
      "count": 0,
      "size": 0
    }
  },
  "lastUpdated": "2024-01-15T10:00:00Z"
}
```

---

### Generate Signed URL

**GET** `/media/{assetId}/url?expirationSeconds={seconds}`

Generate a signed URL for asset access.

**Query Parameters:**
- `expirationSeconds` (default: 3600): URL expiration time in seconds

**Response (200):**
```json
{
  "url": "https://storage.example.com/file?signature=xyz&expires=1234567890"
}
```

---

### Check Duplicate Asset

**GET** `/media/duplicate?hash={hash}&brandId={brandId}`

Check if an asset already exists by hash.

**Response (200):**
```json
{
  "isDuplicate": false,
  "existingAsset": null,
  "similarity": 0.0
}
```

---

## Integrations API

### Get Brand Integrations

**GET** `/integrations?brandId={brandId}`

List all integrations for a brand.

**Response (200):**
```json
[
  {
    "id": "string",
    "type": "slack|hubspot|meta|google_business|zapier",
    "name": "string",
    "brandId": "string",
    "status": "active|inactive",
    "credentials": {
      "accessToken": "string",
      "refreshToken": "string",
      "expiresAt": "2024-01-15T10:00:00Z"
    },
    "settings": {},
    "permissions": ["string"],
    "lastSyncAt": "2024-01-15T10:00:00Z",
    "createdAt": "2024-01-15T10:00:00Z"
  }
]
```

---

### Start OAuth Flow

**POST** `/integrations/oauth/start`

Initiate OAuth authentication for a platform.

**Request Body:**
```json
{
  "type": "string",
  "brandId": "string"
}
```

**Response (200):**
```json
{
  "authUrl": "https://auth.provider.com/oauth/authorize?..."
}
```

---

### Complete OAuth Callback

**POST** `/integrations/oauth/callback`

Complete OAuth authentication flow.

**Request Body:**
```json
{
  "type": "string",
  "code": "string",
  "state": "string",
  "brandId": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "integration": {
    "id": "string",
    "type": "string",
    "name": "string"
  }
}
```

---

## Preferences API

### Get User Preferences

**GET** `/preferences?brandId={brandId}`

Get user preferences for a brand.

**Response (200):**
```json
{
  "success": true,
  "preferences": {
    "notifications": {
      "emailNotifications": true,
      "pushNotifications": false,
      "slackNotifications": false
    },
    "ui": {
      "theme": "light",
      "language": "en",
      "timezone": "UTC"
    },
    "publishing": {
      "autoSaveDrafts": true,
      "draftAutoSaveInterval": 30000
    }
  }
}
```

---

### Update User Preferences

**POST** `/preferences`

Update user preferences.

**Request Body:**
```json
{
  "brandId": "string",
  "notifications": {
    "emailNotifications": true
  },
  "ui": {
    "theme": "dark"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "preferences": {}
}
```

---

### Export Preferences

**GET** `/preferences/export?brandId={brandId}`

Export preferences as JSON file.

**Response (200):**
```json
{
  "format": "json",
  "timestamp": "2024-01-15T10:00:00Z",
  "userId": "string",
  "brandId": "string",
  "preferences": {}
}
```

---

## Approvals API

### Bulk Approve/Reject

**POST** `/approvals/bulk`

Approve or reject multiple posts.

**Request Body:**
```json
{
  "postIds": ["string"],
  "action": "approve|reject",
  "note": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "totalRequested": 0,
  "approved": 0,
  "rejected": 0,
  "skipped": 0,
  "errors": []
}
```

---

### Approve Single Content

**POST** `/approvals/{postId}/approve`

Approve a single post.

**Request Body:**
```json
{
  "note": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "postId": "string",
  "status": "approved",
  "approvedBy": "user@example.com",
  "approvedAt": "2024-01-15T10:00:00Z"
}
```

---

### Reject Content

**POST** `/approvals/{postId}/reject`

Reject a post with feedback.

**Request Body:**
```json
{
  "reason": "string",
  "note": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "postId": "string",
  "status": "rejected",
  "rejectedBy": "user@example.com",
  "reason": "string",
  "rejectedAt": "2024-01-15T10:00:00Z"
}
```

---

### Get Approval History

**GET** `/approvals/{postId}/history`

Get full audit trail for a post.

**Response (200):**
```json
{
  "postId": "string",
  "history": [
    {
      "id": "string",
      "action": "APPROVED|REJECTED|APPROVAL_REQUESTED",
      "userId": "string",
      "userEmail": "string",
      "timestamp": "2024-01-15T10:00:00Z",
      "details": {}
    }
  ],
  "totalActions": 0
}
```

---

### Get Pending Approvals

**GET** `/approvals/pending?limit={limit}&offset={offset}`

Get pending approvals for current user.

**Response (200):**
```json
{
  "pending": [
    {
      "id": "string",
      "postId": "string",
      "requestedBy": "string",
      "deadline": "2024-01-15T10:00:00Z",
      "priority": "low|normal|high",
      "status": "pending",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 0,
  "hasMore": false
}
```

---

## Workflow API

### Get Workflow Templates

**GET** `/workflow/templates?brandId={brandId}`

Get workflow templates for a brand.

**Response (200):**
```json
[
  {
    "id": "string",
    "brand_id": "string",
    "name": "string",
    "description": "string",
    "is_default": true,
    "steps": [
      {
        "id": "string",
        "stage": "string",
        "name": "string",
        "required_role": "string",
        "order": 0
      }
    ],
    "created_at": "2024-01-15T10:00:00Z"
  }
]
```

---

### Start Workflow

**POST** `/workflow/start`

Start a workflow for content.

**Request Body:**
```json
{
  "contentId": "string",
  "templateId": "string",
  "assignedUsers": {
    "step_1": "user_1"
  },
  "priority": "low|medium|high",
  "deadline": "2024-01-15T10:00:00Z"
}
```

**Response (200):**
```json
{
  "success": true,
  "workflow": {
    "id": "string",
    "status": "active",
    "currentStage": "string"
  }
}
```

---

### Process Workflow Action

**POST** `/workflow/{workflowId}/action`

Process action on a workflow step.

**Request Body:**
```json
{
  "type": "approve|reject|comment|reassign",
  "stepId": "string",
  "details": {}
}
```

**Response (200):**
```json
{
  "success": true,
  "workflow": {
    "id": "string",
    "status": "active",
    "currentStage": "string"
  }
}
```

---

## Client Portal API

### Get Client Dashboard

**GET** `/client-portal/dashboard`

Get aggregated dashboard for client.

**Response (200):**
```json
{
  "brandInfo": {
    "name": "string",
    "logo": "string",
    "colors": {}
  },
  "metrics": {
    "totalReach": 0,
    "totalEngagement": 0,
    "followers": 0,
    "pendingApprovals": 0
  },
  "recentContent": [],
  "upcomingPosts": [],
  "pendingApprovals": [],
  "quickActions": {
    "approvalsNeeded": 0,
    "reviewsAvailable": 0
  }
}
```

---

### Approve Content

**POST** `/client-portal/content/{contentId}/approve`

Approve content as client.

**Request Body:**
```json
{
  "feedback": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "contentId": "string",
  "approved": true,
  "approvedAt": "2024-01-15T10:00:00Z"
}
```

---

### Add Content Comment

**POST** `/client-portal/content/{contentId}/comments`

Add comment to content.

**Request Body:**
```json
{
  "message": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "comment": {
    "id": "string",
    "contentId": "string",
    "message": "string",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### Upload Client Media

**POST** `/client-portal/media/upload`

Upload media from client portal.

**Request Body:**
```json
{
  "filename": "string",
  "mimeType": "string",
  "fileSize": 0,
  "path": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "uploads": [
    {
      "id": "string",
      "filename": "string",
      "path": "string",
      "uploadedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

## White-Label API

### Get White-Label Config

**GET** `/white-label/config/{agencyId}`

Get branding configuration for an agency.

**Response (200):**
```json
{
  "success": true,
  "config": {
    "id": "string",
    "agencyId": "string",
    "isActive": true,
    "branding": {
      "companyName": "string",
      "logoText": "string"
    },
    "colors": {
      "primary": "#2563eb",
      "secondary": "#64748b"
    },
    "domain": {
      "custom": "custom.brand.com",
      "isPrimary": true
    }
  }
}
```

---

### Get Config by Domain

**GET** `/white-label/config/domain/{domain}`

Lookup configuration by custom domain.

**Response (200):**
```json
{
  "success": true,
  "config": {}
}
```

---

### Update White-Label Config

**POST** `/white-label/config/{agencyId}`

Update branding configuration.

**Request Body:**
```json
{
  "config": {
    "branding": {
      "companyName": "string"
    },
    "colors": {
      "primary": "#2563eb"
    }
  },
  "previewMode": false
}
```

**Response (200):**
```json
{
  "success": true,
  "config": {},
  "previewUrl": "https://preview.alignedai.com/agency_1"
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |

## Rate Limiting

API requests are rate limited:
- **General endpoints**: 100 requests per minute
- **OAuth endpoints**: 10 requests per minute per state
- **Bulk operations**: 10 requests per minute

Rate limit headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp of reset time

## Pagination

List endpoints support pagination via query parameters:
- `limit`: Results per page (default: 50, max: 100)
- `offset`: Number of results to skip (default: 0)

Response includes:
- `total`: Total number of results
- `hasMore`: Whether more results exist

## Timestamps

All timestamps are in ISO 8601 format with UTC timezone:
```
2024-01-15T10:00:00Z
```

## Versioning

Current API version: **v1**

Version is specified in base URL path. Breaking changes will increment the major version.
