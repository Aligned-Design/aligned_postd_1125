# API Usage and Testing Guide

Complete guide for running, testing, and using the Aligned-20ai.posted API endpoints.

**Last Updated:** 2025-01-XX  
**Server Entry Point:** `server/index-v2.ts`  
**Framework:** Express.js with TypeScript  
**Base URL:** `http://localhost:8080/api` (development)

---

## Table of Contents

- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Running the API Locally](#running-the-api-locally)
- [Testing Endpoints](#testing-endpoints)
- [Authentication](#authentication)
- [Example Requests](#example-requests)
- [Error Handling](#error-handling)
- [Smoke Tests](#smoke-tests)
- [Troubleshooting](#troubleshooting)

---

## Local Development Setup

### Prerequisites

- Node.js >= 24.0.0
- pnpm (package manager)
- Supabase account and project
- Environment variables configured (see below)

### Installation

```bash
# Install dependencies
pnpm install

# Verify environment variables
pnpm run validate:env

# Verify Supabase connection
pnpm run verify:supabase
```

---

## Environment Variables

### Required Variables

Create a `.env` file in the project root with the following variables:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_SUPABASE_URL=https://your-project.supabase.co

# JWT Secret (for token generation)
JWT_SECRET=your-jwt-secret-key

# AI Provider (OpenAI or Anthropic)
AI_PROVIDER=openai
OPENAI_API_KEY=your-openai-api-key
# OR
ANTHROPIC_API_KEY=your-anthropic-api-key

# Application URL
VITE_APP_URL=http://localhost:5173

# Optional: Ping message
PING_MESSAGE=pong
```

### Optional Variables

```bash
# OAuth Configuration (for integrations)
META_APP_ID=your-meta-app-id
LINKEDIN_CLIENT_ID=your-linkedin-client-id
TIKTOK_CLIENT_KEY=your-tiktok-client-key

# Email Service (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key

# Node Environment
NODE_ENV=development
```

---

## Running the API Locally

### Development Mode

```bash
# Start both client and server (recommended)
pnpm dev

# Start only the server
pnpm dev:server

# Server will run on http://localhost:8080
# API endpoints available at http://localhost:8080/api
```

### Production Mode

```bash
# Build the application
pnpm build

# Start production server
pnpm start

# Server will run on port 3000 (or PORT env var)
```

### Verify Server is Running

```bash
# Health check
curl http://localhost:8080/health

# Ping endpoint
curl http://localhost:8080/api/ping

# Expected response:
# { "message": "pong" }
```

---

## Testing Endpoints

### Health Check Endpoints

#### Basic Health Check

```bash
curl http://localhost:8080/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-XXT00:00:00.000Z"
}
```

#### Comprehensive Health Check

```bash
curl http://localhost:8080/api/debug
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-XXT00:00:00.000Z",
  "checks": {
    "supabase": "ok",
    "auth": "ok",
    "tenant": "ok",
    "brand_create": "ok",
    "media_assets": "ok",
    "crawler": "ok",
    "brand_guide": "ok"
  }
}
```

#### AI Service Health

```bash
curl http://localhost:8080/api/health/ai
```

**Response:**
```json
{
  "status": "ok",
  "provider": "openai",
  "configured": true,
  "timestamp": "2025-01-XXT00:00:00.000Z"
}
```

#### Supabase Connection Check

```bash
curl http://localhost:8080/api/health/supabase
```

**Response:**
```json
{
  "status": "ok",
  "connected": true,
  "timestamp": "2025-01-XXT00:00:00.000Z"
}
```

---

## Authentication

### Sign Up

```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "name": "John Doe"
  }'
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "tenantId": "tenant-uuid"
  },
  "tokens": {
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

### Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "tenantId": "tenant-uuid"
  },
  "tokens": {
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

### Using Authentication Token

For authenticated endpoints, include the token in the Authorization header:

```bash
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Example Requests

### Create Brand

```bash
curl -X POST http://localhost:8080/api/brands \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Brand",
    "website_url": "https://example.com",
    "industry": "Technology",
    "description": "A tech company"
  }'
```

**Response:**
```json
{
  "id": "brand-uuid",
  "name": "My Brand",
  "slug": "my-brand",
  "website_url": "https://example.com",
  "tenant_id": "tenant-uuid",
  "created_at": "2025-01-XXT00:00:00.000Z"
}
```

### Get Dashboard Data

```bash
curl -X POST http://localhost:8080/api/dashboard \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brandId": "brand-uuid",
    "timeRange": "30d"
  }'
```

**Response:**
```json
{
  "kpis": [
    {
      "id": "total-posts",
      "label": "Total Posts",
      "value": "42",
      "change": "+12%",
      "trend": "up"
    }
  ],
  "chartData": [
    { "date": "Jan", "value": 100 },
    { "date": "Feb", "value": 120 }
  ],
  "topContent": [],
  "recentActivity": []
}
```

### Generate Content with Doc Agent

**Endpoint:** `POST /api/agents/generate/doc`

**Canonical Request Format:**
```bash
curl -X POST http://localhost:8080/api/agents/generate/doc \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "YOUR_BRAND_ID",
    "input": {
      "topic": "Write a launch announcement with steps for my new product",
      "platform": "linkedin",
      "tone": "professional",
      "format": "post",
      "max_length": 2200,
      "include_cta": true,
      "cta_type": "link"
    }
  }'
```

**Request Contract:**
- **`brand_id`** (string, UUID, required): The brand ID for content generation. Must be a valid UUID.
- **`input`** (object, required): Generation parameters object containing:
  - **`topic`** (string, required): The content topic/prompt (min 1 char, max 5000 chars)
  - **`platform`** (enum, required): Target platform - one of: `"instagram"`, `"facebook"`, `"linkedin"`, `"twitter"`, `"tiktok"`, `"email"`
  - **`tone`** (string, optional): Content tone (default: `"professional"`)
  - **`format`** (enum, optional): Content format - one of: `"post"`, `"carousel"`, `"reel"`, `"story"`, `"image"`, `"email"` (default: `"post"`)
  - **`max_length`** (number, optional): Maximum content length in characters (min 50, max 10000)
  - **`include_cta`** (boolean, optional): Whether to include a call-to-action (default: `true`)
  - **`cta_type`** (enum, optional): CTA type - one of: `"link"`, `"comment"`, `"dm"`, `"bio"`, `"email"`
  - **`additional_context`** (string, optional): Additional context for generation
- **`safety_mode`** (enum, optional): Safety mode - one of: `"safe"`, `"bold"`, `"edgy_opt_in"` (default: `"safe"`)
- **`__idempotency_key`** (string, optional): Request ID for idempotency

**Backwards Compatibility:**
The endpoint accepts legacy formats for backwards compatibility:
- `brandId` (camelCase) → automatically normalized to `brand_id`
- Top-level `prompt`/`platform`/`tone`/`format` fields → automatically normalized into `input` object

**Note:** While legacy formats are supported, `brand_id` + `input` is the canonical contract going forward. All new integrations should use the canonical format.

**Response:**
```json
{
  "success": true,
  "output": {
    "headline": "Generated headline...",
    "body": "Generated content body...",
    "cta": "Learn more",
    "hashtags": ["#YourBrand"],
    "post_theme": "post",
    "tone_used": "professional",
    "aspect_ratio": "1200x630",
    "char_count": 150,
    "bfs": {
      "overall": 0.85,
      "passed": true
    },
    "linter": {
      "passed": true
    }
  },
  "metadata": {
    "tokens_in": 500,
    "tokens_out": 200,
    "provider": "openai",
    "model": "gpt-5-mini"
  }
}
```

### Get Brand Guide

```bash
curl -X GET http://localhost:8080/api/brand-guide/brand-uuid \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "id": "brand-uuid",
  "brand_kit": {
    "colors": {
      "primary": "#000000",
      "secondary": "#FFFFFF"
    },
    "typography": {
      "headings": "Arial",
      "body": "Helvetica"
    }
  },
  "updated_at": "2025-01-XXT00:00:00.000Z"
}
```

### Upload Media

```bash
curl -X POST http://localhost:8080/api/media/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "files=@/path/to/image.jpg" \
  -F "brandId=brand-uuid" \
  -F "category=product"
```

**Response:**
```json
{
  "assets": [
    {
      "id": "asset-uuid",
      "url": "https://...",
      "filename": "image.jpg",
      "size": 123456,
      "mimeType": "image/jpeg"
    }
  ]
}
```

### List Media Assets (v2)

```bash
curl -X GET "http://localhost:8080/api/media?brandId=brand-uuid&limit=20&offset=0" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "items": [
    {
      "id": "asset-uuid",
      "brandId": "brand-uuid",
      "type": "image",
      "url": "https://...",
      "filename": "image.jpg",
      "size": 123456,
      "uploadedAt": "2025-01-XXT00:00:00.000Z"
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0,
  "hasMore": true
}
```

### Get Analytics Overview (v2)

```bash
curl -X GET "http://localhost:8080/api/analytics/overview?brandId=brand-uuid&days=30" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "period": "last_30_days",
  "totals": {
    "impressions": 128430,
    "clicks": 7421,
    "ctr": 0.0578,
    "followers": 324,
    "postsPublished": 28
  }
}
```

### Get Engagement Trend (v2)

```bash
curl -X GET "http://localhost:8080/api/analytics/engagement-trend?brandId=brand-uuid&days=30" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "periodDays": 30,
  "series": [
    {
      "date": "2025-01-01",
      "likes": 45,
      "comments": 12,
      "shares": 8
    }
  ]
}
```

### Get Pending Approvals (v2)

```bash
curl -X GET "http://localhost:8080/api/approvals/pending?brandId=brand-uuid&limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "items": [
    {
      "id": "approval-uuid",
      "brandId": "brand-uuid",
      "contentId": "post-uuid",
      "title": "LinkedIn Post Review",
      "platform": "linkedin",
      "status": "pending",
      "requestedBy": "user-uuid",
      "requestedAt": "2025-01-XXT00:00:00.000Z",
      "dueDate": "2025-01-XXT00:00:00.000Z",
      "content": {
        "headline": "Post Title",
        "body": "Post content..."
      }
    }
  ],
  "total": 5,
  "limit": 10,
  "offset": 0,
  "hasMore": false
}
```

### Approve Content (v2)

```bash
curl -X POST "http://localhost:8080/api/approvals/approval-uuid/approve" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Looks good!"
  }'
```

**Response:**
```json
{
  "approvalId": "approval-uuid",
  "status": "approved",
  "approvedAt": "2025-01-XXT00:00:00.000Z",
  "notes": "Looks good!"
}
```

### Reject Content (v2)

```bash
curl -X POST "http://localhost:8080/api/approvals/approval-uuid/reject" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Needs revision"
  }'
```

**Response:**
```json
{
  "approvalId": "approval-uuid",
  "status": "rejected",
  "rejectedAt": "2025-01-XXT00:00:00.000Z",
  "reason": "Needs revision"
}
```

### Get Media Storage Usage (v2)

```bash
curl -X GET "http://localhost:8080/api/media/storage-usage?brandId=brand-uuid" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "brandId": "brand-uuid",
  "totalSize": 52428800,
  "totalCount": 42,
  "byType": {
    "image": 35,
    "video": 5,
    "document": 2
  },
  "limit": 10737418240,
  "used": 52428800,
  "percentUsed": 0.49
}
```

### Get Reviews

```bash
curl -X GET "http://localhost:8080/api/reviews/brand-uuid" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "reviews": [],
  "total": 0,
  "stats": {
    "total": 0,
    "positive": 0,
    "neutral": 0,
    "negative": 0,
    "needsReply": 0,
    "avgRating": 0
  }
}
```

### Webhook Handler (Zapier)

```bash
curl -X POST "http://localhost:8080/api/webhooks/zapier" \
  -H "x-brand-id: brand-uuid" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "content.published",
    "data": {
      "postId": "post-uuid",
      "platform": "linkedin"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "eventId": "event-uuid",
  "processed": true
}
```

---

## Response Format

### Success Responses

All success responses return data directly (not wrapped in `{ ok: true, data: ... }`):

```json
{
  "items": [...],
  "total": 42
}
```

Some endpoints may return simple objects:

```json
{
  "id": "uuid",
  "name": "Example"
}
```

### Error Responses

All errors follow this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "severity": "error",
    "timestamp": "2025-01-XXT00:00:00.000Z",
    "requestId": "request-uuid",
    "details": {},
    "suggestion": "Optional suggestion for fixing the error"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` (400) - Request validation failed
- `UNAUTHORIZED` (401) - Authentication required
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT` (409) - Resource conflict
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests
- `INTERNAL_ERROR` (500) - Server error

### Validation Error Example

```bash
curl -X POST http://localhost:8080/api/brands \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": ""
  }'
```

**Response (400):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "severity": "warning",
    "timestamp": "2025-01-XXT00:00:00.000Z",
    "validationErrors": [
      {
        "field": "name",
        "message": "Brand name is required",
        "code": "too_small"
      }
    ],
    "suggestion": "Please review the validation errors and retry your request"
  }
}
```

### Unauthorized Error Example

```bash
curl -X GET http://localhost:8080/api/brands
```

**Response (401):**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "severity": "warning",
    "timestamp": "2025-01-XXT00:00:00.000Z",
    "suggestion": "Please provide a valid authentication token"
  }
}
```

---

## Smoke Tests

### Running Smoke Tests

```bash
# Run all smoke tests
pnpm test

# Run specific test file
pnpm test server/__tests__/api-smoke.test.ts
```

### Manual Smoke Test Checklist

1. **Health Check**
   ```bash
   curl http://localhost:8080/health
   ```
   Expected: `{ "status": "ok" }`

2. **Ping**
   ```bash
   curl http://localhost:8080/api/ping
   ```
   Expected: `{ "message": "pong" }`

3. **Authentication**
   ```bash
   # Sign up
   curl -X POST http://localhost:8080/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123456"}'
   
   # Login
   curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123456"}'
   ```
   Expected: Success response with tokens

4. **Authenticated Endpoint**
   ```bash
   # Get current user
   curl -X GET http://localhost:8080/api/auth/me \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   Expected: User object

5. **Brand Creation**
   ```bash
   curl -X POST http://localhost:8080/api/brands \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Brand"}'
   ```
   Expected: Brand object

---

## API V2 Smoke Test

A quick sanity check script is available to verify that critical v2 endpoints are wired and responding correctly.

### Running the Smoke Test

```bash
API_BASE_URL=http://localhost:8080 API_TOKEN=your-token TEST_BRAND_ID=your-brand-id pnpm tsx scripts/api-v2-smoke.ts
```

**Environment Variables:**
- `API_BASE_URL` (optional): Base URL of the API server (default: `http://localhost:8080`)
- `API_TOKEN` (required): Valid JWT Bearer token for authenticated endpoints
- `TEST_BRAND_ID` (optional): Brand ID to use for testing (default: test UUID)

### What It Tests

The script tests the following endpoints:

**Authenticated Endpoints:**
- `GET /api/analytics/overview` - Analytics overview
- `GET /api/analytics/engagement-trend` - Engagement trend data
- `GET /api/media?limit=1` - Media list
- `GET /api/media/storage-usage?brandId=...` - Storage usage
- `GET /api/approvals/pending` - Pending approvals
- `GET /api/reviews/:brandId` - Reviews for a brand

**Webhook Endpoints:**
- `POST /api/webhooks/zapier` - Zapier webhook handler
- `GET /api/webhooks/status/:eventId` - Webhook status (expects 404 for non-existent ID)

### Expected Output

The script logs each endpoint test with:
- `[OK]` - Endpoint responded with expected status (200-299)
- `[WARN]` - Endpoint responded with expected non-success status (e.g., 404 for fake ID)
- `[FAIL]` - Endpoint failed or returned unexpected status

At the end, it prints a summary:
- Total endpoints tested
- Count of OK, WARN, and FAIL results

### Example Output

```
🧪 API V2 Smoke Test

Base URL: http://localhost:8080
Brand ID: 550e8400-e29b-41d4-a716-446655440000
Token: ✅ Provided

============================================================

📊 Testing Analytics v2 endpoints...
[OK] GET /api/analytics/overview → 200 ✅
[OK] GET /api/analytics/engagement-trend → 200 ✅

📁 Testing Media v2 endpoints...
[OK] GET /api/media?limit=1 → 200 ✅
[OK] GET /api/media/storage-usage?brandId=... → 200 ✅

...

============================================================
📊 SUMMARY
============================================================

Total endpoints tested: 8
✅ OK:   6
⚠️  WARN: 1
❌ FAIL: 1
```

### Notes

- This is a **sanity check**, not a full test suite
- It verifies endpoints are accessible and responding (200 or expected auth errors)
- It does not validate response data structure or business logic
- For full test coverage, see `server/__tests__/api-smoke.test.ts`

---

## Troubleshooting

### Server Won't Start

1. **Check environment variables:**
   ```bash
   pnpm run validate:env
   ```

2. **Verify Supabase connection:**
   ```bash
   pnpm run verify:supabase
   ```

3. **Check port availability:**
   ```bash
   lsof -i :8080  # macOS/Linux
   netstat -ano | findstr :8080  # Windows
   ```

### Authentication Issues

1. **Token expired:** Request a new token via `/api/auth/login`
2. **Invalid token format:** Ensure token is in `Bearer <token>` format
3. **Missing tenant:** User may not have a tenant assigned

### Database Connection Issues

1. **Check Supabase URL and keys:**
   ```bash
   echo $SUPABASE_URL
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

2. **Test connection:**
   ```bash
   curl http://localhost:8080/api/health/supabase
   ```

3. **Check Supabase dashboard:** Verify project is active

### Validation Errors

1. **Check request format:** Ensure JSON is valid
2. **Verify required fields:** Check API documentation for required fields
3. **Check data types:** Ensure UUIDs, dates, etc. are in correct format

### Rate Limiting

Some endpoints have rate limiting. If you hit rate limits:

1. Wait for the rate limit window to reset
2. Use exponential backoff in your client
3. Contact admin if limits are too restrictive

---

## Client Integration

### Required Headers

For authenticated requests:

```
Authorization: Bearer <access-token>
Content-Type: application/json
```

### Response Handling

Always check the response status:

- `200-299`: Success
- `400-499`: Client error (validation, auth, etc.)
- `500-599`: Server error

### Error Handling in Client

```typescript
try {
  const response = await fetch('/api/brands', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    // Handle error.error.code, error.error.message, etc.
    throw new Error(error.error.message);
  }
  
  const data = await response.json();
  return data;
} catch (error) {
  // Handle error
}
```

---

## Additional Resources

- [API Surface Map](./API_SURFACE_MAP.md) - Complete endpoint reference
- [Error Codes Reference](../server/lib/error-responses.ts) - All error codes
- [Validation Schemas](../server/lib/validation-schemas.ts) - Request validation schemas
- [Supabase Documentation](https://supabase.com/docs) - Database and auth docs

---

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review error messages and suggestions
3. Check server logs for detailed error information
4. Verify environment variables are set correctly
