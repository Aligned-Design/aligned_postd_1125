# MVP Onboarding Fixes - Scraped Images + Content Plan Endpoints

**Date**: 2025-01-20  
**Last Verified**: 2025-12-02
**Status**: ✅ Completed & Verified

## Summary

Fixed two critical issues blocking MVP onboarding:

1. **Scraped images not persisting to `media_assets`** - Fixed missing `filename` requirement
2. **Content plan API returning 404** - Registered missing content-plan router

---

## Task 1: Fix Scraped Image Persistence

### Problem
- Crawler was finding and classifying images correctly
- Database inserts were failing with "Failed to create media asset"
- Root cause: `filename` column is required (NOT NULL) but was sometimes empty or malformed

### Solution

#### 1.1. Added Robust Filename Derivation Helper

**File**: `server/lib/scraped-images-service.ts`

Added `deriveFilenameFromUrl()` function that:
- Extracts last path segment from URL
- Strips query parameters
- Falls back to "scraped-image" if extraction fails
- Ensures non-empty, reasonable length filename

```typescript
function deriveFilenameFromUrl(imageUrl: string): string {
  try {
    const url = new URL(imageUrl);
    const pathname = url.pathname;
    const lastSegment = pathname.split("/").filter(Boolean).pop() ?? "";
    const base = lastSegment.split("?")[0] || "scraped-image";
    
    if (base && base.length > 0 && base.length < 255) {
      return base;
    }
    
    return "scraped-image";
  } catch {
    return "scraped-image";
  }
}
```

#### 1.2. Updated Filename Extraction

**File**: `server/lib/scraped-images-service.ts` (line ~317)

Replaced complex filename extraction logic with simple call to helper:
```typescript
const filename = deriveFilenameFromUrl(image.url);
```

#### 1.3. Fixed createMediaAsset Signature

**File**: `server/lib/media-db-service.ts` (line ~79)

Updated `createMediaAsset` to accept `null` tenantId (schema allows nullable):
```typescript
async createMediaAsset(
  brandId: string,
  tenantId: string | null,  // ✅ Changed from string to string | null
  filename: string,
  // ... rest of params
)
```

This matches the actual schema where `tenant_id` is nullable.

### Verification

- ✅ `filename` is now always non-empty
- ✅ `createMediaAsset` accepts `null` tenantId (matches schema)
- ✅ No TypeScript errors
- ✅ Existing error logging already captures detailed failure info

---

## Task 2: Fix Content Plan 404s

### Problem
- Frontend calls:
  - `POST /api/content-plan/:brandId/generate`
  - `GET /api/content-plan/:brandId`
- Server returned 404
- Root cause: Content-plan router exists but wasn't registered in `server/index-v2.ts`

### Solution

#### 2.1. Registered Content Plan Router

**File**: `server/index-v2.ts`

**Added import** (line ~96):
```typescript
import contentPlanRouter from "./routes/content-plan";
```

**Registered route** (line ~186):
```typescript
app.use("/api/content-plan", contentPlanRouter);
```

### Routes Available

The content-plan router (`server/routes/content-plan.ts`) already implements:

- **GET `/api/content-plan/:brandId`**
  - Returns 7-day content plan for brand
  - Requires authentication
  - Queries `content_items` table

- **POST `/api/content-plan/:brandId/generate`**
  - Generates new content plan
  - Requires authentication
  - Calls `generateContentPlan()` service
  - Stores advisor recommendations in `brand_kit`

### Verification

- ✅ Router imported and registered
- ✅ Routes match frontend expectations
- ✅ Authentication middleware applied
- ✅ No TypeScript errors

---

## Files Modified

1. `server/lib/scraped-images-service.ts`
   - Added `deriveFilenameFromUrl()` helper
   - Simplified filename extraction

2. `server/lib/media-db-service.ts`
   - Updated `createMediaAsset` signature to accept `string | null` for tenantId

3. `server/index-v2.ts`
   - Imported `contentPlanRouter`
   - Registered `/api/content-plan` route

---

## Verification Status (2025-12-02)

### Implementation Verification

✅ **Scraped Images Fix**:
- `deriveFilenameFromUrl()` function exists in `server/lib/scraped-images-service.ts` (line 32)
- Function is called at line 341 before `createMediaAsset` call
- `createMediaAsset` accepts `tenantId: string | null` (verified in `server/lib/media-db-service.ts` line 79)
- Schema verified: `filename TEXT NOT NULL`, `tenant_id UUID` (nullable) in `001_bootstrap_schema.sql`
- Code path: `persistScrapedImages()` → `deriveFilenameFromUrl()` → `createMediaAsset()`

✅ **Content Plan Router Fix**:
- Router file exists: `server/routes/content-plan.ts` exports `contentPlanRouter`
- Router registered in `server/index-v2.ts` at line 187: `app.use("/api/content-plan", contentPlanRouter)`
- Router also registered in `server/index.ts` at line 371 (for legacy builds)
- Routes defined:
  - `GET /api/content-plan/:brandId` (line 31-136)
  - `POST /api/content-plan/:brandId/generate` (line 142-260)
- Frontend calls match router paths (verified in `client/pages/onboarding/Screen7ContentGeneration.tsx` and `Screen8CalendarPreview.tsx`)
- **Entrypoint usage**:
  - Dev: `server/index-v2.ts` (via `npm run dev:server` → `tsx server/index-v2.ts`)
  - Prod: `server/vercel-server.ts` → imports `index-v2.ts` (Vercel deployment)
  - Both entrypoints have router registered ✅

### Testing Checklist

### Scraped Images
- [ ] Run onboarding flow for test brand (e.g., `aligned-bydesign.com`)
- [ ] Verify logs show no `[ScrapedImages] ❌ Database error persisting image`
- [ ] Query Supabase: `SELECT * FROM media_assets WHERE brand_id = '<test-brand-id>' ORDER BY created_at DESC LIMIT 10`
- [ ] Confirm rows have:
  - `brand_id` filled
  - `path` filled with external URL
  - `filename` non-empty and sensible (e.g., `Aligned-by-design-main-logo.png`)
  - `status = 'active'`
- [ ] Verify logos/images appear in onboarding UI

### Content Plan
- [ ] Load onboarding flow in browser
- [ ] Watch network tab for:
  - `POST /api/content-plan/:brandId/generate` → should return 200/201 (not 404)
  - `GET /api/content-plan/:brandId` → should return 200 with JSON (not 404)
- [ ] Verify onboarding can proceed past content-plan step without errors

### Verification Commands

```bash
# Verify router is registered
grep -n "content-plan" server/index-v2.ts server/index.ts

# Verify filename derivation is used
grep -n "deriveFilenameFromUrl" server/lib/scraped-images-service.ts

# Check router routes match frontend calls
grep -n "/api/content-plan" client/pages/onboarding/*.tsx
```

---

## Notes

- **Filename derivation**: The helper is conservative - it extracts from URL pathname and falls back to "scraped-image" if anything goes wrong. This ensures we never have empty filenames.

- **TenantId nullability**: The schema allows `tenant_id` to be null, so the signature change matches reality. This is especially important during onboarding when tenantId might not be available yet.

- **Content plan routes**: The routes were already implemented correctly in `server/routes/content-plan.ts` - they just needed to be registered. The routes use `authenticateUser` middleware but don't require scopes (commented out) to allow onboarding flow.

---

**Status**: ✅ Completed & Verified (2025-12-02)

### Code Verification Summary

All fixes have been verified in the codebase:

1. **Scraped Images Persistence** ✅
   - `deriveFilenameFromUrl()` implemented correctly (line 32)
   - Used in `persistScrapedImages()` at line 341
   - `createMediaAsset()` accepts `tenantId: string | null` (line 79)
   - Database schema confirmed: `filename TEXT NOT NULL`, `tenant_id UUID` (nullable)

2. **Content Plan Router Registration** ✅
   - Router registered in `index-v2.ts` (line 187) - primary entrypoint
   - Router registered in `index.ts` (line 371) - legacy entrypoint
   - Both dev and prod entrypoints covered
   - Routes match frontend expectations

**Next Steps**: Manual testing recommended to confirm end-to-end functionality

