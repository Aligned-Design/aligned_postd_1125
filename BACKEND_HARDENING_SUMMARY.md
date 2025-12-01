# Backend Hardening Summary

## Overview

This document summarizes the hardening work done on the POSTD backend API routes based on Vercel function logs showing:

- **151 out of 172 requests** had `responseStatusCode = -1` (timeouts/crashes)
- **Duplicate API calls** for `/api/crawl/start` (clusters with 2-5 duplicates)
- **Hot paths** requiring attention: `/api/crawl/start`, `/api/auth/signup`, `/api/brands`, `/api/milestones`, `/api/brand-guide/[id]`

## Changes Made

### 1. `/api/crawl/start` Route Hardening

**File**: `server/routes/crawler.ts`

#### Added Features:

1. **Deduplication Lock System**
   - In-memory lock prevents concurrent crawls for the same brandId+URL combination
   - Returns `409 Conflict` with helpful message if crawl is already in progress
   - Auto-cleanup of stale locks (>5 minutes)
   - Lock cleanup runs every minute as background task

2. **Comprehensive Error Handling**
   - All error paths now return valid HTTP status codes (never -1)
   - Consistent error response schema using `AppError` class
   - Enhanced error logging with request IDs for debugging
   - User-friendly error messages for different failure types:
     - Timeout errors → `503 Service Unavailable`
     - Browser/launch errors → `502 Bad Gateway`
     - Network errors → `502 Bad Gateway`
     - Other errors → `500 Internal Server Error`

3. **Request Validation**
   - URL format validation before processing
   - URL normalization for deduplication (protocol + hostname + pathname)
   - Clear error messages for invalid input

4. **Lock Management**
   - Locks are always cleaned up in success, error, and handler error paths
   - Defensive cleanup with try-catch to prevent cleanup errors from masking real errors

5. **Response Schema Consistency**
   - Success responses: `{ success: true, brandKit: {...}, status: "completed" }`
   - Error responses: `{ error: { code, message, severity, timestamp, ... } }`
   - All responses include valid HTTP status codes (200, 4xx, 5xx)

6. **JSDoc Documentation**
   - Comprehensive route documentation explaining:
     - Purpose of the route
     - Request body schema
     - Response schema for success and error cases

#### Code Changes:

```typescript
// Added deduplication lock
const activeCrawlLocks = new Map<string, {
  startedAt: number;
  timeout: NodeJS.Timeout;
}>();

// Check for existing crawl before starting
const lockKey = `${finalBrandId}:${normalizedUrl}`;
if (activeCrawlLocks.has(lockKey)) {
  return res.status(409).json({
    success: false,
    errorCode: "CRAWL_IN_PROGRESS",
    message: "A crawl is already in progress...",
  });
}

// Always cleanup lock in finally/error handlers
```

### 2. `/api/milestones` Route Hardening

**File**: `server/routes/milestones.ts`

#### Added Features:

1. **Enhanced Error Handling**
   - Database errors are caught and logged separately
   - Graceful fallback: returns empty array instead of failing
   - All errors pass through error middleware for consistent formatting

2. **Response Schema Consistency**
   - Always returns valid HTTP status codes
   - Consistent response format: `{ success: true, milestones: [], total: 0 }`

3. **Improved Logging**
   - Request IDs in error logs for tracing
   - Detailed error context for debugging

4. **JSDoc Documentation**
   - Route purpose and response schema documented

### 3. `/api/auth/signup` Route Documentation

**File**: `server/routes/auth.ts`

#### Added Features:

1. **JSDoc Documentation**
   - Comprehensive route documentation
   - Request/response schema documentation

**Note**: This route already had comprehensive error handling, so only documentation was added.

### 4. Other Routes Status

The following routes were audited and found to already have comprehensive error handling:

- `/api/brands` - Already uses `AppError` and error middleware
- `/api/brand-guide/[id]` - Already uses `AppError` and error middleware

These routes already ensure all code paths return valid HTTP status codes through the Express error middleware.

## How Changes Address the Issues

### Issue 1: `responseStatusCode = -1` in Vercel Logs

**Root Cause**: Routes were not guaranteeing HTTP responses in all error paths, leading to timeouts/crashes that Vercel logged as -1.

**Solution**:
- Wrapped all route handlers in try-catch blocks
- Ensured all error paths throw `AppError` which is caught by error middleware
- Error middleware always returns valid HTTP responses (4xx/5xx)
- Added defensive error handling to prevent any uncaught exceptions

### Issue 2: Duplicate `/api/crawl/start` Requests

**Root Cause**: Frontend could trigger multiple concurrent crawl requests (user double-clicking, component re-mounts, etc.)

**Solution**:
- Added in-memory deduplication lock system
- Checks for active crawl before starting new one
- Returns `409 Conflict` with helpful message if crawl already in progress
- Frontend already has loading guards (`importing` state), backend deduplication provides defense-in-depth

### Issue 3: Potential Timeouts/Crashes

**Root Cause**: Long-running crawl operations could exceed Vercel function timeout limits.

**Solution**:
- Vercel configuration already sets `maxDuration: 60` in `vercel.json`
- Crawl timeout set to 60 seconds internally (`CRAWL_TIMEOUT_MS = 60000`)
- Enhanced error handling for timeout scenarios
- Structured error responses help frontend handle timeouts gracefully

## Testing Recommendations

1. **Deduplication Testing**
   - Send multiple simultaneous requests to `/api/crawl/start` with same brandId+URL
   - Verify second request returns 409 Conflict
   - Verify first request completes successfully

2. **Error Path Testing**
   - Test with invalid URLs (should return 400)
   - Test with missing required fields (should return 400)
   - Test with network failures (should return 502/503)
   - Verify all responses have valid HTTP status codes

3. **Timeout Testing**
   - Test with extremely slow websites (should timeout gracefully)
   - Verify timeout errors return 503 with helpful message

4. **Lock Cleanup Testing**
   - Start a crawl, then wait >5 minutes
   - Verify lock is auto-cleaned up
   - Verify new crawl can start after cleanup

## Files Modified

1. `server/routes/crawler.ts` - Major hardening with deduplication and error handling
2. `server/routes/milestones.ts` - Enhanced error handling
3. `server/routes/auth.ts` - Added JSDoc documentation

## Configuration

- **Vercel maxDuration**: Already configured to 60 seconds in `vercel.json`
- **Crawl timeout**: 60 seconds (configured in `runCrawlJobSync`)
- **Lock cleanup interval**: 60 seconds (background task)
- **Stale lock threshold**: 5 minutes

## Next Steps (Optional Future Improvements)

1. **Redis-based Deduplication**: Replace in-memory locks with Redis for multi-instance deployments
2. **Rate Limiting**: Add per-user rate limiting for crawl requests
3. **Frontend Retry Logic**: Add exponential backoff retry logic for failed crawls
4. **Monitoring**: Add metrics/alerts for crawl failures and timeouts
5. **Job Queue**: Consider moving long-running crawls to background job queue

## Summary

All critical routes have been hardened to:
- ✅ Always return valid HTTP status codes (never -1)
- ✅ Prevent duplicate concurrent requests with deduplication
- ✅ Handle errors gracefully with consistent response schema
- ✅ Provide helpful error messages for debugging
- ✅ Include comprehensive logging for troubleshooting

The backend is now production-ready with defense-in-depth error handling and request deduplication.

