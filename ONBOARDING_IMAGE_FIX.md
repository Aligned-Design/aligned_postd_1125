# 🔧 Onboarding Brand Preview Image Fix

## Problem Summary
Brand preview page during onboarding was not showing logos or images. All 15 images were being crawled but **0 were persisting** to the database.

## Root Causes Found (from logs)

### 1. ❌ Database Column Name Mismatch
**Error**: `column media_assets.file_size does not exist`

**Cause**: Production schema uses `size_bytes` but code was querying `file_size`

**Impact**: Every image persistence attempt failed during duplicate check

### 2. ❌ Missing `storage_quotas` Table
**Error**: `Failed to fetch storage quota` (PGRST205)

**Cause**: `storage_quotas` table doesn't exist in production Supabase

**Impact**: Every image creation was blocked at quota check step

### 3. ❌ AI API Keys Not Configured
**Error**: `OpenAI client not available` + `Anthropic API error: 401`

**Cause**: Both `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` are missing/invalid in Vercel

**Impact**: No brand summaries or AI-generated descriptions

---

## Fixes Applied

### Fix 1: Column Name Alignment ✅
Updated all queries in `server/lib/media-db-service.ts`:
- `file_size` → `size_bytes` in all SELECT queries
- `file_size` → `size_bytes` in INSERT statements
- Updated `MediaAssetRecord` interface to match production schema

**Files Changed**:
- `server/lib/media-db-service.ts`

### Fix 2: Graceful Storage Quota Fallback ✅
Added fallback logic when `storage_quotas` table doesn't exist:
- Returns default 5GB quota
- Allows image uploads to proceed
- Logs warning for monitoring

**Code**:
```typescript
if (quotaError && (quotaError.code === 'PGRST204' || quotaError.code === 'PGRST205')) {
  console.warn(`[MediaDB] storage_quotas table not found, using default quota`);
  return {
    brandId,
    quotaLimitBytes: 5_000_000_000, // 5GB default
    totalUsedBytes: 0,
    percentageUsed: 0,
    isWarning: false,
    isHardLimit: false,
  };
}
```

### Fix 3: AI Keys - Requires Vercel Config 🔧
**Action Required**: Set environment variables in Vercel dashboard:
```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Testing Verification

### Before Fix (from logs):
```
[Crawler] Extracted 15 images from https://aligned-bydesign.com
[ScrapedImages] ❌ Failed to persist image: Failed to fetch storage quota
[ScrapedImages] Persistence complete: 0 images saved (tried 15)
[Crawler] WARNING: Found 15 images but none were persisted
```

### Expected After Fix:
```
[Crawler] Extracted 15 images from https://aligned-bydesign.com
[ScrapedImages] ✅ Persisted image: logo%401x.png
[ScrapedImages] ✅ Persisted image: squarespace-logo-horizontal-white.jpg
...
[ScrapedImages] Persistence complete: 15 images saved (tried 15)
```

---

## Remaining Tasks

### 🔴 Critical (Blocks Image Display)
1. **Set AI API Keys in Vercel** - Required for brand summaries
   - Go to Vercel dashboard → Project Settings → Environment Variables
   - Add `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`

### 🟡 Important (Database Health)
2. **Run Media Tables Migration** - Adds proper `storage_quotas` table
   ```sql
   -- Run in Supabase SQL Editor
   -- File: server/migrations/006_media_tables.sql
   ```

### 🟢 Nice to Have (Long-term)
3. **Schema Alignment Audit** - Ensure all column names match between:
   - Migration files (`server/migrations/`)
   - Production schema (`supabase/migrations/`)
   - TypeScript interfaces (`server/lib/`)

---

## Deploy Commands
```bash
# Verify build passes
pnpm build

# Commit changes
git add server/lib/media-db-service.ts
git commit -m "fix: align media_assets column names with production schema (size_bytes)"

# Deploy to Vercel
git push origin main
```

---

## Log Evidence

**File**: `logs_result.csv` (2025-11-19 13:10)

**Key Errors**:
- Lines 67-85: `Failed to fetch storage quota` → Image persistence blocked
- Lines 86-91, 111-116, etc.: `column media_assets.file_size does not exist` → Duplicate check failed
- Lines 477-493: Both AI providers failed (401/missing keys) → No brand summary

**Crawl Success**:
- Line 442-447: ✅ Successfully found 15 images + logo
- Line 32-46: ✅ Colors (7) and typography extracted
- Line 48-56: ❌ 0 images persisted due to errors above

---

## Status
✅ **Code Fixed** - Column names aligned  
⚠️ **Deployment Pending** - Needs Vercel env vars  
📋 **Migration Pending** - `storage_quotas` table  

**Next Step**: Set API keys in Vercel → Deploy → Test onboarding flow

