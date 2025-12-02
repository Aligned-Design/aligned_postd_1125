# API Usage and Testing Guide

Complete guide for running, testing, and using the Aligned AI API endpoints.

**Last Updated:** 2025-01-XX  
**Base URL (Local):** `http://localhost:8080`  
**Base URL (Production):** `https://your-domain.vercel.app`

---

## Table of Contents

- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Running the API Server](#running-the-api-server)
- [Health Check Endpoints](#health-check-endpoints)
- [Authentication](#authentication)
- [Example Requests](#example-requests)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Client Integration](#client-integration)

---

## Local Development Setup

### Prerequisites

- Node.js 18+ and pnpm installed
- Supabase project configured
- API keys for AI providers (OpenAI or Anthropic)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment template (if not exists)
cp .env.example .env
```

---

## Environment Variables

### Required Variables

```bash
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_URL=https://your-project-id.supabase.co

# AI Provider (at least one required)
OPENAI_API_KEY=sk-...
# OR
ANTHROPIC_API_KEY=sk-ant-...
AI_PROVIDER=openai  # or "anthropic" or "auto"

# Application URLs
VITE_APP_URL=http://localhost:8080
NODE_ENV=development
```

### Optional Variables

```bash
# OAuth Integrations
META_APP_ID=your-meta-app-id
LINKEDIN_CLIENT_ID=your-linkedin-client-id
TIKTOK_CLIENT_KEY=your-tiktok-key

# Email Service
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM_ADDRESS=noreply@yourdomain.com

# Monitoring
SENTRY_DSN=your-sentry-dsn
ENABLE_SENTRY=false
```

**See `VERCEL_ENV_CHECKLIST.md` for complete list.**

---

## Running the API Server

### Development Mode

```bash
# Start both client and server (recommended)
pnpm dev

# Or start server only
pnpm dev:server
# Server runs on http://localhost:8080
```

### Production Mode

```bash
# Build
pnpm build

# Start production server
pnpm start
# Server runs on port 3000 (or PORT env var)
```

### Verify Server is Running

```bash
# Health check
curl http://localhost:8080/api/health

# Ping endpoint
curl http://localhost:8080/api/ping
```

---

## Health Check Endpoints

### Basic Health Check

```bash
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-XXT10:00:00.000Z",
  "service": "postd-backend",
  "aiConfigured": true,
  "aiProvider": "openai",
  "integrationsConfigured": true
}
```

### AI Service Health

```bash
GET /api/health/ai
```

**Response:**
```json
{
  "status": "ok",
  "provider": "openai",
  "configured": true,
  "timestamp": "2025-01-XXT10:00:00.000Z"
}
```

### Database Health

```bash
GET /api/health/supabase
```

**Response:**
```json
{
  "status": "ok",
  "connected": true,
  "timestamp": "2025-01-XXT10:00:00.000Z"
}
```

**Error Response (503):**
```json
{
  "status": "error",
  "error": "Connection failed",
  "timestamp": "2025-01-XXT10:00:00.000Z"
}
```

---

## Authentication

Most endpoints require authentication via JWT token in the `Authorization` header.

### Getting an Auth Token

```bash
# Sign up
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "name": "John Doe"
  }'

# Login
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
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Using the Token

```bash
# Include in Authorization header
curl http://localhost:8080/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "brandId": "uuid-here",
    "timeRange": "30d"
  }'
```

---

## Example Requests

### 1. Create a Brand

```bash
POST /api/brands
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Brand",
  "website_url": "https://example.com",
  "industry": "Technology",
  "description": "A tech company",
  "autoRunOnboarding": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "name": "My Brand",
    "slug": "my-brand",
    "created_at": "2025-01-XXT10:00:00.000Z"
  }
}
```

### 2. Get Brand Guide

```bash
GET /api/brand-guide/:brandId
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "uuid-here",
  "brandId": "brand-uuid",
  "brandName": "My Brand",
  "voice": { ... },
  "visuals": { ... },
  "content": { ... }
}
```

### 3. Generate AI Content

```bash
POST /api/agents/generate/doc
Authorization: Bearer <token>
Content-Type: application/json

{
  "brand_id": "uuid-here",
  "input": {
    "topic": "Product launch",
    "platform": "linkedin",
    "tone": "professional"
  },
  "safety_mode": "safe"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "content": "Generated content here...",
    "brandFidelityScore": 0.95,
    "metadata": { ... }
  }
}
```

### 4. Publish Content

```bash
POST /api/publishing/:brandId/publish
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Post content here",
  "platforms": ["linkedin", "twitter"],
  "scheduledAt": "2025-01-XXT14:00:00.000Z"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "jobId": "job-uuid",
    "status": "pending",
    "platforms": ["linkedin", "twitter"]
  }
}
```

### 5. Get Analytics

```bash
GET /api/analytics/:brandId?timeRange=30d
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "metrics": { ... },
    "insights": [ ... ],
    "timeRange": "30d"
  }
}
```

### 6. Upload Media

```bash
POST /api/media/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary>
brandId: uuid-here
category: images
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "assetId": "uuid-here",
    "url": "https://...",
    "size": 1024000,
    "mimeType": "image/jpeg"
  }
}
```

---

## Error Handling

All errors follow a standardized format:

### Error Response Structure

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "severity": "warning",
    "timestamp": "2025-01-XXT10:00:00.000Z",
    "requestId": "uuid-here",
    "details": {
      "validationErrors": [
        {
          "field": "brandId",
          "message": "Invalid UUID format",
          "code": "invalid_string"
        }
      ]
    },
    "suggestion": "Please review the validation errors and retry your request"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 422 | Request validation failed |
| `MISSING_REQUIRED_FIELD` | 400 | Required field missing |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `INTERNAL_ERROR` | 500 | Server error |

### Example Error Responses

**Validation Error (422):**
```bash
curl -X POST http://localhost:8080/api/brands \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": ""}'
```

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "severity": "warning",
    "validationErrors": [
      {
        "field": "name",
        "message": "String must contain at least 1 character(s)",
        "code": "too_small"
      }
    ]
  }
}
```

**Unauthorized (401):**
```bash
curl http://localhost:8080/api/dashboard
```

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "severity": "warning",
    "timestamp": "2025-01-XXT10:00:00.000Z"
  }
}
```

---

## Testing

### Run Test Suite

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run specific test file
pnpm test server/__tests__/routes/content-packages.test.ts
```

### Manual Testing with cURL

#### Health Check

```bash
# Basic health
curl http://localhost:8080/api/health

# Database health
curl http://localhost:8080/api/health/supabase

# AI health
curl http://localhost:8080/api/health/ai
```

#### Authentication Flow

```bash
# 1. Sign up
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456","name":"Test User"}'

# 2. Login (save token)
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456"}' \
  | jq -r '.data.token')

# 3. Use token
curl http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

#### Brand Operations

```bash
# Create brand
curl -X POST http://localhost:8080/api/brands \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Brand",
    "website_url": "https://example.com"
  }'

# List brands (if endpoint exists)
curl http://localhost:8080/api/brands \
  -H "Authorization: Bearer $TOKEN"
```

### Smoke Tests

See `server/__tests__/` directory for automated tests.

**Run smoke tests:**
```bash
pnpm test server/__tests__/routes/
```

---

## Client Integration

### React/TypeScript Client

```typescript
import { DashboardResponse } from '@shared/api';

async function getDashboard(brandId: string, token: string) {
  const response = await fetch('/api/dashboard', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      brandId,
      timeRange: '30d',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  const data: DashboardResponse = await response.json();
  return data;
}
```

### Error Handling in Client

```typescript
try {
  const data = await getDashboard(brandId, token);
  // Handle success
} catch (error) {
  if (error.response?.status === 401) {
    // Redirect to login
  } else if (error.response?.status === 422) {
    // Show validation errors
    const validationErrors = error.response.data.error.details?.validationErrors;
  } else {
    // Show generic error
  }
}
```

---

## Troubleshooting

### Server Won't Start

1. **Check environment variables:**
   ```bash
   # Verify required vars are set
   echo $SUPABASE_URL
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

2. **Check port availability:**
   ```bash
   # Check if port 8080 is in use
   lsof -i :8080
   ```

3. **Check logs:**
   ```bash
   # Server logs will show startup errors
   pnpm dev:server
   ```

### Database Connection Issues

1. **Verify Supabase credentials:**
   ```bash
   curl http://localhost:8080/api/health/supabase
   ```

2. **Check network connectivity:**
   ```bash
   # Test Supabase URL
   curl https://your-project-id.supabase.co/rest/v1/
   ```

### Authentication Issues

1. **Verify token format:**
   - Token should start with `eyJ...`
   - Include `Bearer ` prefix in header

2. **Check token expiration:**
   - Tokens expire after configured time
   - Re-authenticate if expired

### Validation Errors

1. **Check request body format:**
   - Ensure JSON is valid
   - Check required fields are present
   - Verify UUID formats

2. **Review error details:**
   - Error response includes `validationErrors` array
   - Each error shows `field`, `message`, and `code`

---

## Additional Resources

- **API Surface Map:** See `docs/API_SURFACE_MAP.md` for complete endpoint list
- **Error Codes:** See `server/lib/error-responses.ts` for all error codes
- **Validation Schemas:** See `server/lib/validation-schemas.ts` for request schemas
- **Environment Setup:** See `docs/ENVIRONMENT_SETUP.md` for detailed env var guide

---

## Support

For issues or questions:
1. Check error response `suggestion` field
2. Review server logs
3. Verify environment variables
4. Check API documentation in `docs/API_SURFACE_MAP.md`

