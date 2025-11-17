# API Documentation

This directory contains comprehensive API documentation including endpoint specifications, integration guides, and response handling patterns.

## Contents

- **INTEGRATIONS_QUICK_START.md** - Quick start guide for external API integrations
- **JSON_RESPONSE_HANDLING.md** - Detailed guide on defensive JSON parsing and error handling
- **BRAND_INTELLIGENCE_MARKETING.md** - Brand Intelligence API specifications and usage

## Core API Routes

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Brand Management
- `GET /api/brands` - List user's brands
- `GET /api/brands/:id` - Get brand details
- `POST /api/brands` - Create new brand
- `PUT /api/brands/:id` - Update brand

### Content Management
- `GET /api/content` - List content items
- `POST /api/content/generate` - Generate content with AI
- `POST /api/content/approve` - Approve content
- `POST /api/content/publish` - Publish content

### Assets & Media
- `POST /api/upload` - Upload file
- `GET /api/assets` - List assets
- `DELETE /api/assets/:id` - Delete asset

### Brand Intelligence
- `GET /api/brand-intelligence/:brandId` - Get brand insights
- `POST /api/brand-intelligence/feedback` - Submit feedback on recommendations

### Webhooks
- `POST /api/webhooks` - Register webhook
- `POST /api/webhooks/events` - Webhook events
- `GET /api/webhooks/:id` - Get webhook details

### Audit & Approvals
- `GET /api/audit` - List audit logs
- `POST /api/approvals/bulk` - Bulk approval operations

## Response Format

All successful API responses follow this pattern:
```json
{
  "data": {},
  "success": true,
  "timestamp": "2025-11-05T12:00:00Z"
}
```

Error responses:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-11-05T12:00:00Z"
}
```

## Authentication

All protected endpoints require:
- `Authorization: Bearer <jwt_token>` header
- Valid Supabase JWT token from login

## Error Handling

The API uses standard HTTP status codes:
- `200` - Success
- `400` - Bad request (validation error)
- `401` - Unauthorized (missing/invalid auth)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `500` - Server error

## Rate Limiting

API rate limits:
- Free tier: 100 requests/hour
- Pro tier: 1000 requests/hour
- Enterprise: Custom limits

---

For integration examples, see [Integration Quick Start](./INTEGRATIONS_QUICK_START.md).
For JSON handling details, see [JSON Response Handling](./JSON_RESPONSE_HANDLING.md).
