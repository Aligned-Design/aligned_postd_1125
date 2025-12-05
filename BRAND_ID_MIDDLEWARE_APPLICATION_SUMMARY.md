# Brand ID Middleware Application Summary

**Date**: 2025-01-20  
**Status**: ✅ **CORE ROUTES COMPLETE** - Remaining routes pending

---

## Overview

Applied the `validateBrandId` middleware consistently across brand-aware routes to ensure:
- Consistent brand ID validation (UUID or temporary format)
- Proper access control
- Removal of duplicate validation logic

---

## Middleware Details

### Files Created
- ✅ `server/middleware/validate-brand-id.ts` - Main middleware implementation

### Exports
1. **`validateBrandId`** - Validates format AND asserts brand access (for UUID format)
   - Validates UUID format or temporary format (`brand_<timestamp>`)
   - Verifies user has access to brand (for UUID format)
   - Skips access check for temporary IDs (onboarding flow)

2. **`validateBrandIdFormat`** - Validates format only (no access check)
   - Used for routes that handle their own access logic
   - Used for onboarding routes that accept temporary IDs

---

## Routes Updated

### ✅ Core Routes Completed

#### 1. Brand Guide Routes (`server/routes/brand-guide.ts`)
- ✅ `GET /api/brand-guide/:brandId` - Uses `validateBrandId`
- ✅ `PUT /api/brand-guide/:brandId` - Uses `validateBrandId`
- ✅ `PATCH /api/brand-guide/:brandId` - Uses `validateBrandId`
- ✅ `GET /api/brand-guide/:brandId/versions` - Uses `validateBrandId`
- ✅ `GET /api/brand-guide/:brandId/versions/:version` - Uses `validateBrandId`
- ✅ `POST /api/brand-guide/:brandId/rollback/:version` - Uses `validateBrandId`

**Changes**:
- Removed manual UUID regex validation
- Removed manual `assertBrandAccess` calls
- Now uses `(req as any).validatedBrandId` from middleware

#### 2. Content Items Routes (`server/routes/content-items.ts`)
- ✅ `GET /api/content-items?brandId=...` - Uses `validateBrandId`

**Changes**:
- Removed manual brandId validation
- Removed manual `assertBrandAccess` call
- Now uses validated brandId from middleware

#### 3. Creative Studio Routes (`server/routes/creative-studio.ts`)
- ✅ `POST /api/studio/save` - Uses `validateBrandIdFormat` (allows temp IDs in body)
- ✅ `GET /api/studio?brandId=...` - Uses `validateBrandId` (validates query param)

**Changes**:
- POST /save uses `validateBrandIdFormat` to allow temporary IDs during onboarding
- GET / uses `validateBrandId` to validate query param
- Updated to use validated brandId from middleware

#### 4. Crawler Routes (`server/routes/crawler.ts`)
- ✅ `POST /api/crawl/start` - Uses `validateBrandIdFormat` (allows temp IDs)

**Changes**:
- Uses `validateBrandIdFormat` to allow temporary brand IDs during onboarding
- Updated to use validated brandId from middleware
- Maintains support for temporary IDs (`brand_<timestamp>`)

#### 5. Analytics Routes (`server/routes/analytics-v2.ts`)
- ✅ `GET /api/analytics/overview` - Uses `validateBrandId`
- ✅ `GET /api/analytics/engagement-trend` - Uses `validateBrandId`
- ✅ `GET /api/analytics/content-performance` - Uses `validateBrandId`
- ✅ `GET /api/analytics/top-posts` - Uses `validateBrandId`

**Changes**:
- Removed Zod UUID validation for brandId (middleware handles it)
- Removed manual `assertBrandAccess` calls
- Now uses validated brandId from middleware

#### 6. Approvals Routes (`server/routes/approvals-v2.ts`)
- ✅ `GET /api/approvals/pending` - Uses `validateBrandId`
- ✅ `GET /api/approvals/history` - Uses `validateBrandId`
- ⚠️ `GET /api/approvals/:approvalId` - Gets brandId from DB record (kept `assertBrandAccess` with comment)
- ⚠️ `POST /api/approvals/approve/:approvalId` - Gets brandId from DB record (kept `assertBrandAccess` with comment)
- ⚠️ `POST /api/approvals/reject/:approvalId` - Gets brandId from DB record (kept `assertBrandAccess` with comment)

**Changes**:
- Routes with brandId in query use `validateBrandId`
- Routes that get brandId from approval records keep `assertBrandAccess` (can't use middleware since brandId not in request)

#### 7. Media Routes (`server/routes/media-v2.ts`)
- ✅ `GET /api/media` - Uses `validateBrandId`
- ✅ `GET /api/media/storage-usage` - Uses `validateBrandId`
- ⚠️ `GET /api/media/:assetId` - Gets brandId from asset record (kept `assertBrandAccess` with comment)
- ⚠️ `DELETE /api/media/:assetId` - Gets brandId from asset record (kept `assertBrandAccess` with comment)

**Changes**:
- Routes with brandId in query use `validateBrandId`
- Routes that get brandId from asset records keep `assertBrandAccess` (can't use middleware since brandId not in request)

#### 8. Brand Intelligence Routes (`server/routes/brand-intelligence.ts`)
- ✅ `GET /api/brand-intelligence/:brandId` - Uses `validateBrandId` (applied in `server/index.ts` route registration)

**Changes**:
- Removed manual brandId validation
- Removed manual `assertBrandAccess` call
- Middleware applied in route registration (`server/index.ts`)
- Handler updated to use validated brandId

---

## Routes Still Needing Updates (Lower Priority)

### Medium Priority (Routes that may have brandId but need verification)

1. **Agent Routes** (`server/routes/agents.ts`, `doc-agent.ts`, `design-agent.ts`)
   - Check if routes accept brandId in body/query
   - Should use `validateBrandId` if brandId is provided

2. **Dashboard Routes** (`server/routes/dashboard.ts`)
   - Check if routes use brandId
   - Should use `validateBrandId` if brandId is provided

3. **Calendar Routes** (`server/routes/calendar.ts`)
   - Check if routes use brandId
   - Should use `validateBrandId` if brandId is provided

4. **Publishing Routes** (`server/routes/publishing.ts`)
   - Check if routes use brandId
   - Should use `validateBrandId` if brandId is provided

### Medium Priority

6. **Other Routes**:
   - `server/routes/dashboard.ts`
   - `server/routes/calendar.ts`
   - `server/routes/workflow.ts`
   - `server/routes/publishing.ts`
   - `server/routes/orchestration.ts`
   - Any other routes with `brandId` parameter

---

## Testing

### Test Script Created
- ✅ `scripts/test-brand-id-middleware.ts` - Test script for middleware

### Test Cases
1. Valid UUID format
2. Temporary brand ID format (`brand_<timestamp>`)
3. Invalid format (should return 400)
4. Empty string (should return 400)

### Running Tests
```bash
# Set test token (optional)
export TEST_ACCESS_TOKEN="your-token"

# Run tests
pnpm tsx scripts/test-brand-id-middleware.ts
```

---

## Pattern for Remaining Routes

### For Routes with `:brandId` in URL
```typescript
import { validateBrandId } from "../middleware/validate-brand-id";

router.get("/:brandId", authenticateUser, validateBrandId, async (req, res, next) => {
  const brandId = (req as any).validatedBrandId ?? req.params.brandId;
  // ... handler logic
});
```

### For Routes with `brandId` in Query/Body
```typescript
import { validateBrandId } from "../middleware/validate-brand-id";

router.get("/", authenticateUser, validateBrandId, async (req, res, next) => {
  const brandId = (req as any).validatedBrandId ?? req.query.brandId;
  // ... handler logic
});
```

### For Routes that Accept Temporary IDs (Onboarding)
```typescript
import { validateBrandIdFormat } from "../middleware/validate-brand-id";

router.post("/start", authenticateUser, validateBrandIdFormat, async (req, res, next) => {
  const brandId = (req as any).validatedBrandId ?? req.body.brand_id;
  // ... handler logic
});
```

---

## Benefits

1. **Consistency**: All routes use the same validation logic
2. **Security**: Access control is enforced consistently
3. **Maintainability**: Single source of truth for brand ID validation
4. **Flexibility**: Supports both UUID and temporary ID formats
5. **Error Handling**: Consistent error responses across routes

---

## Next Steps

1. **Apply middleware to remaining routes** (see list above)
2. **Run test script** to verify middleware works correctly
3. **Update integration tests** to use validated brandId
4. **Document any special cases** that need different handling

---

## Notes

- The middleware checks `params`, `query`, and `body` for `brandId`/`brand_id`
- Temporary IDs (`brand_<timestamp>`) are allowed for onboarding flows
- UUID format triggers access verification via `assertBrandAccess`
- All validated brand IDs are available via `(req as any).validatedBrandId`

---

**End of Summary**

