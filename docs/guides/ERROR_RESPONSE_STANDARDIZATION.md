# Error Response Standardization - Complete Migration Guide
**Issue #1.2: Error Response Standardization – Unified OWASP-Compliant Error Format**

**Status:** In Progress
**Created:** November 8, 2025
**Effort Estimate:** 12 hours (distributed across 3 developers)
**Last Updated:** November 8, 2025

---

## Problem Statement

**Current State:** Inconsistent error handling across 24 routes with 100+ error responses
- 13 files (54%) use non-standardized formats
- 3 files (13%) partially standardized
- 8 files (33%) fully standardized
- Multiple error format patterns causing confusion and information disclosure vulnerabilities

**Issues Identified:**
1. Redundant error fields (`error` + `message`)
2. No standard error codes (each endpoint invents its own)
3. Inconsistent HTTP status codes for same error types
4. No request ID tracking for debugging
5. Information disclosure in error details
6. Validation errors not following unified structure

---

## Solution Architecture

### Standardized Error Response Format

**All errors must follow this structure:**

```typescript
{
  error: {
    code: string;              // ErrorCode enum from error-responses.ts
    message: string;           // User-friendly message
    severity: "info" | "warning" | "error" | "critical";
    timestamp: string;         // ISO 8601 timestamp
    requestId?: string;        // For distributed tracing
    details?: Record<string, unknown>;  // Additional context
    suggestion?: string;       // How to fix the issue
  }
}
```

### Implementation Pattern

**Replace direct res.status().json() calls with AppError throws:**

```typescript
// ❌ BEFORE (Non-standard):
res.status(500).json({
  error: "Failed to fetch escalation rules",
  message: error instanceof Error ? error.message : "Unknown error"
});

// ✅ AFTER (Standardized):
throw new AppError(
  ErrorCode.INTERNAL_ERROR,
  "Failed to fetch escalation rules",
  HTTP_STATUS.INTERNAL_SERVER_ERROR,
  "error",
  error instanceof Error ? { originalError: error.message } : undefined,
  "Please try again later or contact support"
);
```

### Key Components

1. **ErrorCode Enum** (`server/lib/error-responses.ts`)
   - Standardized error codes for programmatic handling
   - Examples: VALIDATION_ERROR, NOT_FOUND, UNAUTHORIZED, INTERNAL_ERROR

2. **AppError Class** (`server/lib/error-middleware.ts`)
   - Custom error class with structured properties
   - Extends Error with code, statusCode, severity, details, suggestion

3. **Error Handler Middleware** (`server/lib/error-middleware.ts`)
   - Central error processing and response formatting
   - Handles AppError, ZodError, native errors
   - Adds request ID to all responses

4. **AsyncHandler Wrapper** (`server/lib/error-middleware.ts`)
   - Wraps async route handlers
   - Catches errors and passes to error handler middleware

---

## Migration Path

### Phase 1: Reference Implementation (COMPLETED)
✅ **escalations.ts** - Fully migrated to AppError pattern
- All 20+ error responses standardized
- Validation errors properly formatted
- 404, 400, 500 errors all use AppError

### Phase 2: High-Impact Routes (NEXT - 13 files)

**Files with most errors (prioritized):**

| File | Errors | Severity | Priority |
|------|--------|----------|----------|
| escalations.ts | 10 (500 errors) | HIGH | ✅ Done |
| analytics.ts | 9 | HIGH | 1 |
| media-management.ts | 7 | MEDIUM | 2 |
| agents.ts | 7 | MEDIUM | 3 |
| client-settings.ts | 8 | MEDIUM | 4 |
| crawler.ts | 6 | MEDIUM | 5 |
| webhooks.ts | 6 | MEDIUM | 6 |
| audit.ts | 5 | MEDIUM | 7 |
| ai-generation.ts | 3 | LOW | 8 |
| ai-metrics.ts | 4 | LOW | 9 |
| bulk-approvals.ts | 4 | LOW | 10 |
| builder.ts | 2 | LOW | 11 |
| **Subtotal** | **74 errors** | | |

### Phase 3: Partial Standardization (6 files)

**Files already using AppError or custom patterns:**

| File | Status | Action |
|------|--------|--------|
| integrations.ts | Mixed | Complete AppError migration |
| publishing.ts | Custom formatter | Adopt error-middleware |
| brand-intelligence.ts | Custom helper | Adopt error-middleware |
| approvals.ts | ✅ Done | No changes needed |
| client-portal.ts | ✅ Done | No changes needed |
| media.ts | ✅ Done | No changes needed |
| preferences.ts | ✅ Done | No changes needed |
| white-label.ts | ✅ Done | No changes needed |
| workflow.ts | ✅ Done | No changes needed |

---

## Migration Checklist - Per File

### For Each Route File:

- [ ] **Import standard error utilities**
  ```typescript
  import { AppError, asyncHandler } from "../lib/error-middleware";
  import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
  ```

- [ ] **Replace middleware error responses**
  - Example: auth validation, brand ID extraction
  - Change from: `res.status(400).json({ error: "..." })`
  - Change to: `throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, ...)`

- [ ] **Replace 400 validation errors**
  ```typescript
  if (error instanceof z.ZodError) {
    const validationErrors = error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
      code: e.code,
    }));
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Request validation failed",
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      "warning",
      { validationErrors },
      "Please review the validation errors and retry"
    );
  }
  ```

- [ ] **Replace 404 not found errors**
  ```typescript
  if (!resource) {
    throw new AppError(
      ErrorCode.NOT_FOUND,
      "Resource not found",
      HTTP_STATUS.NOT_FOUND,
      "info"
    );
  }
  ```

- [ ] **Replace 401/403 auth errors**
  ```typescript
  throw new AppError(
    ErrorCode.UNAUTHORIZED,
    "Authentication required",
    HTTP_STATUS.UNAUTHORIZED,
    "warning",
    undefined,
    "Please provide valid credentials"
  );
  ```

- [ ] **Replace 500 server errors**
  ```typescript
  catch (error) {
    console.error("[Routes] Error:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Operation failed",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later"
    );
  }
  ```

- [ ] **Wrap async handlers** (optional but recommended)
  ```typescript
  router.get("/endpoint", asyncHandler(async (req, res) => {
    // No need for try/catch - errors automatically caught
  }));
  ```

- [ ] **Verify no direct res.status().json() calls**
  - Search for: `res.status.*json`
  - All should be replaced with AppError throws

- [ ] **Run typecheck**
  ```bash
  pnpm typecheck
  ```

- [ ] **Run tests**
  ```bash
  pnpm test server/__tests__/<file>.test.ts
  ```

---

## Error Code Mapping Guide

### Common Error Scenarios

| Scenario | HTTP Status | ErrorCode | Severity |
|----------|------------|-----------|----------|
| Missing required field | 400 | MISSING_REQUIRED_FIELD | warning |
| Invalid format/validation | 422 | VALIDATION_ERROR | warning |
| Invalid credentials | 401 | INVALID_CREDENTIALS | warning |
| Not authenticated | 401 | UNAUTHORIZED | warning |
| Token expired | 401 | TOKEN_EXPIRED | warning |
| Not authorized | 403 | FORBIDDEN | warning |
| Insufficient permissions | 403 | INSUFFICIENT_PERMISSIONS | warning |
| Resource not found | 404 | NOT_FOUND | info |
| Duplicate resource | 409 | DUPLICATE_RESOURCE | warning |
| Rate limit exceeded | 429 | RATE_LIMIT_EXCEEDED | warning |
| Quota exceeded | 429 | QUOTA_EXCEEDED | warning |
| Internal server error | 500 | INTERNAL_ERROR | critical |
| Database error | 500 | DATABASE_ERROR | critical |
| Service unavailable | 503 | SERVICE_UNAVAILABLE | critical |
| External service error | 503 | EXTERNAL_SERVICE_ERROR | error |

---

## Before & After Examples

### Example 1: Multiple Errors (escalations.ts - COMPLETED)

**BEFORE:**
```typescript
router.get("/rules", async (req, res) => {
  try {
    const rules = await escalationRules.getByBrand(brandId, true);
    res.json({ success: true, data: rules });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch escalation rules",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
```

**AFTER:**
```typescript
router.get("/rules", async (req, res) => {
  try {
    const rules = await escalationRules.getByBrand(brandId, true);
    res.json({ success: true, data: rules });
  } catch (error) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Failed to fetch escalation rules",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
});
```

### Example 2: Validation Errors

**BEFORE:**
```typescript
catch (error) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      error: "Invalid request",
      details: error.errors
    });
  }
}
```

**AFTER:**
```typescript
catch (error) {
  if (error instanceof z.ZodError) {
    const validationErrors = error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
      code: e.code,
    }));
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Request validation failed",
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      "warning",
      { validationErrors },
      "Please review the validation errors and retry"
    );
  }
}
```

---

## Automated Migration Tools

### Bash Script for Bulk 404 Fixes

```bash
#!/bin/bash
FILE=$1

# Fix simple 404 errors
sed -i '' 's/return res.status(404).json({ error: "\(.*\)" });/throw new AppError(ErrorCode.NOT_FOUND, "\1", HTTP_STATUS.NOT_FOUND, "info");/g' "$FILE"
```

### Pattern-Based Replacements

**500 errors with error+message:**
```bash
# Find pattern and list contexts
grep -n "res.status(500).json({" "$FILE" | grep "message:"
```

**Validation errors with ZodError:**
```bash
# Find pattern
grep -n "z.ZodError" "$FILE"
```

---

## Testing & Verification

### 1. TypeCheck Verification
```bash
pnpm typecheck
# Ensure no new errors introduced
```

### 2. Error Response Tests
Each file should have tests covering:
- 400/422 validation errors
- 401 unauthorized errors
- 403 forbidden errors
- 404 not found errors
- 500 server errors

### 3. Integration Tests
```bash
pnpm test server/__tests__/error-responses.test.ts
```

### 4. Manual Testing
- Test invalid input (validation error)
- Test unauthorized access (auth error)
- Test missing resource (404 error)
- Verify error response structure
- Verify no sensitive data in details field

---

## Implementation Timeline

**Week 1 (Days 1-2):** Escalations (DONE) + Analytics (Priority 1)
**Week 1 (Days 3-5):** Media-management, Agents, Client-settings (Priority 2-4)
**Week 2 (Days 1-2):** Crawler, Webhooks, Audit (Priority 5-7)
**Week 2 (Days 3-5):** AI-generation, AI-metrics, Bulk-approvals, Builder (Priority 8-11)
**Week 3:** Integrations, Publishing, Brand-intelligence (Phase 3) + Testing

---

## Success Criteria

- [ ] All 100+ error responses follow standardized format
- [ ] No direct res.status().json() calls for errors (all use AppError)
- [ ] All error responses include: code, message, severity, timestamp, suggestion
- [ ] No information disclosure in error details
- [ ] All validation errors follow unified structure
- [ ] All tests pass
- [ ] TypeCheck passes with no errors
- [ ] Request ID tracking on all error responses
- [ ] Consistent HTTP status codes across all endpoints
- [ ] Documentation complete and team trained

---

## Reference Files

- **Error Responses:** `server/lib/error-responses.ts`
- **Error Middleware:** `server/lib/error-middleware.ts`
- **Reference Implementation:** `server/routes/escalations.ts`
- **Test Coverage:** `server/__tests__/error-responses.test.ts`

---

## Common Pitfalls to Avoid

1. ❌ Exposing stack traces in error details
   - ✅ Only include `error.message`, not full stack

2. ❌ Mixing `error` and `message` fields
   - ✅ Use single `message` field via AppError

3. ❌ Inconsistent error codes for same situation
   - ✅ Use ErrorCode enum values consistently

4. ❌ Missing `suggestion` field on critical errors
   - ✅ Always guide user how to resolve

5. ❌ Forgetting to throw errors from middleware
   - ✅ Middleware must `throw` not `res.status().json()`

---

## Support & Questions

- Check escalations.ts for reference implementation
- Review error-responses.ts for available error codes
- Ask team lead for questions about specific routes

---

**Last Updated:** November 8, 2025
**Next Review:** After Phase 2 completion
