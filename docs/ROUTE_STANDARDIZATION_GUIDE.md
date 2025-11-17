# API Route Standardization Guide

## Overview

This document outlines the standardized patterns for Express route handlers in the Aligned platform, addressing **Issue #3 (Error Standardization)** and **Issue #6 (Schema Validation)**.

## Current Status

### ✅ Infrastructure In Place
- **Error Responses**: `server/lib/error-responses.ts` - Standardized error format with ErrorCode enum
- **Error Middleware**: `server/lib/error-middleware.ts` - AppError class, central error handler, asyncHandler wrapper
- **Validation Schemas**: `server/lib/validation-schemas.ts` - Zod schemas for all major endpoints

### ✅ Implementation Coverage
- **24 routes** total in `server/routes/`
- **21/24 routes** using AppError for error handling (88%)
- **19/24 routes** using validation schemas (79%)
- **1/24 routes** (escalations.ts) using asyncHandler wrapper (4%)

### 🔧 Fixed in This Commit
- **ai.ts**: Migrated from custom error format to standardized AppError + asyncHandler

---

## Pattern 1: Modern Pattern (Recommended)

### Using asyncHandler + Zod Validation

```typescript
import { RequestHandler } from "express";
import { asyncHandler, AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { PublishContentSchema } from "@shared/validation-schemas";

/**
 * POST /api/publishing/create
 * Create a new publishing job with content
 */
export const publishContent: RequestHandler = asyncHandler(async (req, res) => {
  // Validate request body against Zod schema
  // Throws ZodError automatically caught by central error handler
  const validated = PublishContentSchema.parse(req.body);

  // Validation passed, proceed with business logic
  const result = await someService.process(validated);

  res.status(HTTP_STATUS.CREATED).json(result);
});

/**
 * GET /api/publishing/jobs/:brandId
 * List publishing jobs with optional filtering
 */
export const getPublishingJobs: RequestHandler = asyncHandler(async (req, res) => {
  const { brandId } = req.params;

  if (!brandId) {
    throw new AppError(
      ErrorCode.MISSING_REQUIRED_FIELD,
      "Brand ID is required",
      HTTP_STATUS.BAD_REQUEST,
      "warning",
      { requiredField: "brandId" },
      "Please provide brandId in the URL path"
    );
  }

  const jobs = await publishingService.getJobs(brandId);
  res.json(jobs);
});

/**
 * POST /api/publishing/jobs/:jobId/cancel
 * Cancel a publishing job
 */
export const cancelJob: RequestHandler = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  if (!jobId) {
    throw new AppError(
      ErrorCode.MISSING_REQUIRED_FIELD,
      "Job ID is required",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // Any errors thrown here are caught and formatted by error handler
  const result = await publishingService.cancelJob(jobId);

  res.json({ success: true, job: result });
});
```

### How It Works
1. **asyncHandler wrapper** catches all errors (synchronous and async)
2. **Zod.parse()** validates input and throws ZodError on validation failure
3. **AppError** is thrown for business logic errors
4. **Central error handler** catches all errors and formats response
5. **No try-catch blocks** needed in route handlers

### Benefits
- ✅ Clean, readable code
- ✅ Automatic error handling
- ✅ Type-safe validation
- ✅ Consistent error responses
- ✅ Input sanitization via Zod

---

## Pattern 2: Current Pattern (Compatible)

### Using Manual Try-Catch + AppError

Many routes currently use this pattern, which is also valid:

```typescript
import { RequestHandler } from "express";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { PublishContentSchema } from "@shared/validation-schemas";

export const publishContent: RequestHandler = async (req, res) => {
  try {
    const validated = PublishContentSchema.parse(req.body);

    const result = await someService.process(validated);

    res.status(HTTP_STATUS.CREATED).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      throw error; // Will be caught by error middleware
    }
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Failed to publish content",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined
    );
  }
};
```

### Still Valid, But Not Recommended
- ⚠️ More verbose
- ⚠️ Easy to forget error wrapping
- ⚠️ Manual error handling required

---

## Error Response Format

All errors use this standardized format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "severity": "warning",
    "timestamp": "2025-11-08T10:00:00Z",
    "requestId": "uuid-here",
    "details": {
      "validationErrors": [
        {
          "field": "platforms",
          "message": "At least one platform is required",
          "code": "invalid_type"
        }
      ]
    },
    "suggestion": "Please review the validation errors and retry your request"
  }
}
```

### ErrorCode Enum Values

```typescript
// Validation errors (4xx)
VALIDATION_ERROR
MISSING_REQUIRED_FIELD
INVALID_FORMAT
OUT_OF_RANGE

// Authentication errors (4xx)
UNAUTHORIZED
INVALID_CREDENTIALS
TOKEN_EXPIRED
TOKEN_INVALID

// Authorization errors (4xx)
FORBIDDEN
INSUFFICIENT_PERMISSIONS

// Resource errors (4xx)
NOT_FOUND
RESOURCE_DELETED
CONFLICT
DUPLICATE_RESOURCE
RATE_LIMIT_EXCEEDED
QUOTA_EXCEEDED

// Server errors (5xx)
INTERNAL_ERROR
SERVICE_UNAVAILABLE
DATABASE_ERROR
EXTERNAL_SERVICE_ERROR
```

---

## Validation Schemas

Use Zod schemas from `server/lib/validation-schemas.ts`:

```typescript
import {
  UUIDSchema,
  BrandIdSchema,
  PlatformSchema,
  PublishContentBodySchema,
  GetJobsQuerySchema,
} from "@shared/validation-schemas";

// Validate body
const validated = PublishContentBodySchema.parse(req.body);
// {
//   contentId: string,
//   platforms: ["instagram", "facebook"],
//   scheduledAt?: string,
//   ...
// }

// Validate query parameters
const query = GetJobsQuerySchema.parse(req.query);
// {
//   brandId: string,
//   status?: "draft" | "published" | "failed",
//   page: number,
//   limit: number,
//   ...
// }
```

---

## Migration Checklist

To migrate a route from Pattern 2 to Pattern 1:

### Step 1: Add Imports
```typescript
import { asyncHandler } from "../lib/error-middleware";
```

### Step 2: Wrap Handler
```typescript
// Before
export const myRoute: RequestHandler = async (req, res) => {
  try {
    // ...
  } catch (error) {
    // ...
  }
};

// After
export const myRoute: RequestHandler = asyncHandler(async (req, res) => {
  // No try-catch needed!
  // ...
});
```

### Step 3: Add Validation
```typescript
// At top of handler
const validated = MySchema.parse(req.body);
// If validation fails, ZodError is caught and formatted automatically
```

### Step 4: Throw AppError Instead of Returning
```typescript
// Before
if (!someValue) {
  return res.status(400).json({ error: "Missing field" });
}

// After
if (!someValue) {
  throw new AppError(
    ErrorCode.MISSING_REQUIRED_FIELD,
    "someValue is required",
    HTTP_STATUS.BAD_REQUEST
  );
}
```

### Step 5: Remove Try-Catch Blocks
Delete all top-level try-catch blocks since asyncHandler handles them.

---

## Routes Status

### Fully Implemented (Pattern 1) ✅
- `escalations.ts` - Uses asyncHandler and validation
- `ai.ts` - FIXED: Now uses asyncHandler and AppError

### Partially Implemented (Pattern 2) ⚠️
- `publishing.ts` - Uses AppError + Zod, needs asyncHandler
- `media.ts` - Uses AppError, missing some validation
- `analytics.ts` - Uses AppError, missing some validation
- `integrations.ts` - Uses AppError, missing some validation
- `approvals.ts` - Uses AppError, missing validation
- `audit.ts` - Uses AppError, missing validation
- ... and 16 more routes

### Not Yet Migrated 🔴
- None - all routes have error handling

---

## Best Practices

### 1. Always Validate Input
```typescript
const validated = SomeSchema.parse(req.body);
// Throws ZodError if invalid, automatically handled
```

### 2. Use Appropriate Error Codes
```typescript
// Don't do this
throw new AppError("ERROR", "Something went wrong");

// Do this - use specific error codes
throw new AppError(
  ErrorCode.NOT_FOUND,
  "The requested resource was not found",
  HTTP_STATUS.NOT_FOUND
);
```

### 3. Provide Context for Debugging
```typescript
throw new AppError(
  ErrorCode.DATABASE_ERROR,
  "Failed to update user",
  HTTP_STATUS.INTERNAL_SERVER_ERROR,
  "error",
  { userId: req.params.userId, originalError: error.message }
);
```

### 4. Include Recovery Suggestions
```typescript
throw new AppError(
  ErrorCode.RATE_LIMIT_EXCEEDED,
  "Too many requests",
  HTTP_STATUS.TOO_MANY_REQUESTS,
  "warning",
  { retryAfter: 60 },
  "Please wait 60 seconds before making another request"
);
```

### 5. Never Return Sensitive Information
```typescript
// DON'T
throw new AppError(
  ErrorCode.DATABASE_ERROR,
  "Connection string: postgres://user:pass@host",
  HTTP_STATUS.INTERNAL_SERVER_ERROR
);

// DO
throw new AppError(
  ErrorCode.DATABASE_ERROR,
  "Database connection failed",
  HTTP_STATUS.INTERNAL_SERVER_ERROR,
  "error",
  undefined,
  "Please contact support if the problem persists"
);
```

---

## Testing Routes

### Test with Valid Input
```bash
curl -X POST http://localhost:3000/api/publishing/create \
  -H "Content-Type: application/json" \
  -d '{
    "contentId": "123e4567-e89b-12d3-a456-426614174000",
    "platforms": ["instagram", "facebook"],
    "scheduledAt": "2025-11-15T10:00:00Z"
  }'
```

### Test with Invalid Input (Validation Error)
```bash
curl -X POST http://localhost:3000/api/publishing/create \
  -H "Content-Type: application/json" \
  -d '{
    "contentId": "not-a-uuid",
    "platforms": []
  }'

# Response:
# {
#   "error": {
#     "code": "VALIDATION_ERROR",
#     "message": "Request validation failed",
#     "severity": "warning",
#     "validationErrors": [
#       {
#         "field": "contentId",
#         "message": "Invalid UUID format",
#         "code": "invalid_string"
#       },
#       {
#         "field": "platforms",
#         "message": "At least one platform is required",
#         "code": "too_small"
#       }
#     ]
#   }
# }
```

### Test with Missing Required Field
```bash
curl -X GET http://localhost:3000/api/publishing/jobs

# Response:
# {
#   "error": {
#     "code": "MISSING_REQUIRED_FIELD",
#     "message": "Brand ID is required",
#     "severity": "warning",
#     "details": {
#       "requiredField": "brandId"
#     },
#     "suggestion": "Please provide brandId in the URL path or query parameters"
#   }
# }
```

---

## Future Work

### Immediate (High Priority)
1. [x] Fix routes with non-standard error formats (ai.ts) ✅
2. [ ] Add asyncHandler to all critical routes (publishing, media, analytics, integrations)
3. [ ] Add missing validation schemas to all routes
4. [ ] Create comprehensive test suite for all routes

### Medium Term
1. [ ] Migrate all 24 routes to Pattern 1 (asyncHandler)
2. [ ] Add request ID tracking to all responses
3. [ ] Implement structured logging with context
4. [ ] Add rate limiting to all routes

### Long Term
1. [ ] Automatic OpenAPI/Swagger generation from Zod schemas
2. [ ] Client SDK generation
3. [ ] Response caching strategy
4. [ ] API versioning strategy

---

## References

- [error-responses.ts](../server/lib/error-responses.ts) - Standardized error format
- [error-middleware.ts](../server/lib/error-middleware.ts) - Error handling middleware
- [validation-schemas.ts](../server/lib/validation-schemas.ts) - Zod validation schemas
- [Zod Documentation](https://zod.dev/)
- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html)
