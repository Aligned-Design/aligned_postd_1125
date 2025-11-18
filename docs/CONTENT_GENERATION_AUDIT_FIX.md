# Content Generation Audit & Fix

## Problem
Users were seeing "Content Not Found" error on the 7-day calendar preview (Step 8 of onboarding). No content was appearing in the calendar or queue.

## Root Causes Identified

### 1. **Schema Mismatch** (CRITICAL)
- **Issue**: Code was trying to insert `approval_required` column which doesn't exist
- **Issue**: Code was using `type` column but production uses `content_type` (migration 009 schema)
- **Issue**: Code was trying to add `tenant_id` which doesn't exist in `content_items` table
- **Impact**: All content inserts were failing silently

### 2. **Silent Error Handling**
- **Issue**: Errors in `storeContentItems` were being swallowed with `continue`
- **Impact**: No visibility into why content wasn't being saved

### 3. **Column Name Mismatch in GET Endpoint**
- **Issue**: GET endpoint expected `content_type` but code might have been using `type`
- **Issue**: GET endpoint expected `body` but code might have been using `content` JSONB
- **Impact**: Content might be saved but not retrieved correctly

### 4. **Missing Error Logging**
- **Issue**: No detailed logging for content generation failures
- **Impact**: Difficult to debug why content generation was failing

## Fixes Applied

### 1. Fixed `storeContentItems` Function
**File**: `server/lib/content-planning-service.ts`

**Changes**:
- ✅ Removed `approval_required` column (doesn't exist)
- ✅ Use `content_type` instead of `type` (migration 009 schema)
- ✅ Use `body` instead of `content` JSONB (migration 009 schema)
- ✅ Removed `tenant_id` (doesn't exist in content_items)
- ✅ Added comprehensive error logging with full error details
- ✅ Added success logging for each stored item

### 2. Fixed GET Endpoint
**File**: `server/routes/content-plan.ts`

**Changes**:
- ✅ Handle both `content_type` and `type` column names (resilient to schema variations)
- ✅ Handle both `body` and `content` fields (resilient to schema variations)
- ✅ Added query result logging for debugging

### 3. Enhanced Error Handling
**File**: `server/routes/content-plan.ts`

**Changes**:
- ✅ Added try-catch around `generateContentPlan` call
- ✅ Added validation to ensure items were generated
- ✅ Added comprehensive error logging
- ✅ Return proper error responses to client

### 4. Enhanced Logging Throughout
**Files**: `server/lib/content-planning-service.ts`, `server/routes/content-plan.ts`

**Changes**:
- ✅ Log generation start
- ✅ Log successful generation with item counts
- ✅ Log generation failures with full error details
- ✅ Log successful storage of each item
- ✅ Log storage failures with full error details

## Schema Compatibility

The code now works with **migration 009 schema** (production):
- `content_type` (not `type`)
- `body` (not `content` JSONB)
- `scheduled_for` (timestamp)
- `title`, `platform`, `media_urls`, `status`, `generated_by_agent`

But is also resilient to **migration 012 schema** if it exists:
- Handles both `content_type` and `type`
- Handles both `body` and `content` JSONB

## Testing Checklist

After deployment, verify:

1. **Content Generation**:
   - [ ] POST `/api/content-plan/:brandId/generate` succeeds
   - [ ] Check logs for "[ContentPlan] Content generation successful"
   - [ ] Check logs for "[ContentPlan] Successfully stored content item" (should see multiple)

2. **Content Retrieval**:
   - [ ] GET `/api/content-plan/:brandId` returns items
   - [ ] Check logs for "[ContentPlan] GET query results" with `itemsFound > 0`
   - [ ] Items have `content`, `contentType`, `platform`, `scheduledDate`, `scheduledTime`

3. **UI Display**:
   - [ ] Screen8CalendarPreview loads content
   - [ ] Calendar shows 7 days of content
   - [ ] Content queue shows items with status "pending_review"

4. **Error Cases**:
   - [ ] If generation fails, user sees error message (not silent failure)
   - [ ] Logs show detailed error information

## Expected Log Output

### Successful Generation:
```
[ContentPlan] Starting content generation { brandId: "...", tenantId: "..." }
[ContentPlan] Content generation successful { brandId: "...", itemsCount: 8, items: [...] }
[ContentPlan] Successfully stored content item { brandId: "...", itemId: "...", title: "...", ... }
[ContentPlan] Returning content plan { brandId: "...", itemsCount: 8 }
```

### Successful Retrieval:
```
[ContentPlan] GET query results { brandId: "...", itemsFound: 8, ... }
```

### Failure Cases:
```
[ContentPlan] Content generation failed { brandId: "...", error: "...", stack: "..." }
[ContentPlan] Failed to store content item { brandId: "...", errorCode: "...", errorMessage: "...", ... }
```

## Next Steps

1. Deploy fixes
2. Test onboarding flow end-to-end
3. Monitor logs for any remaining issues
4. If content_items table schema differs, may need to add migration to align schemas

