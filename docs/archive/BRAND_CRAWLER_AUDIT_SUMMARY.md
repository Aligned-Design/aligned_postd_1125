# Brand Crawler Logos & Images Pipeline - Executive Summary

**Date:** 2025-01-27  
**Status:** ✅ **CODE COMPLETE**  
**TL;DR:** Code audit complete. Implementation matches spec. Minor logging improvement made. Production verification pending.

---

## Quick Status

| Component | Code Status | Production Status |
|-----------|-------------|------------------|
| Storage Quota | ✅ Fixed | ⏳ Pending deployment |
| Scraped Image Detection | ✅ Fixed | ⏳ Pending deployment |
| Image Classification | ✅ Enhanced | ⏳ Pending deployment |
| Image Limits | ✅ Implemented | ⏳ Pending deployment |
| Brand Guide Arrays | ✅ Added | ⏳ Pending deployment |
| Step 5 UI | ✅ Fixed | ⏳ Pending deployment |

> **⚠️ Environment Note:** This audit was performed against the codebase on 2025-01-27. Production behavior may differ until:
> - Code is deployed to production
> - Environment variables (SUPABASE_SERVICE_ROLE_KEY, etc.) are verified
> - Database migrations are applied
> 
> **If real logs still show `AppError: Failed to fetch storage quota` or `persistedCount: 0`, verify:**
> - The deployed commit includes these fixes
> - Environment variables are correctly configured
> - Database schema matches expectations

---

## What Was Fixed

### Root Cause
Scraped images were failing to persist due to `AppError: Failed to fetch storage quota` blocking all image persistence, resulting in empty logos/images in onboarding Step 5.

### Solution
1. **Storage quota soft-fail** - `getStorageUsage()` never throws, returns unlimited quota on error
2. **Scraped image bypass** - `createMediaAsset()` skips quota for external URLs (`fileSize === 0 && path.startsWith("http")`)
3. **Image filtering** - Filters out social icons and platform logos
4. **✅ FIXED: Platform logo detection** - Uses specific heuristics (vendor + logoish patterns) to avoid over-filtering Squarespace-hosted brand images
5. **✅ ENHANCED: Multi-source logo detection** - Extracts logos from CSS, SVG, favicon, and OG metadata (not just `<img>` tags)
6. **Image limits** - Max 2 logos, max 15 brand images
7. **Brand Guide arrays** - Exposes `logos` and `images`/`brandImages` arrays
8. **Fallback logic** - Uses `logoUrl` if persistence fails

### Changes Made

**File Modified:** `server/lib/scraped-images-service.ts`

**Change:** Improved logo/brand image persistence counting accuracy
- **Before:** Index-based counting (could be inaccurate if some images fail)
- **After:** Tracks `persistedLogoIds` and `persistedBrandImageIds` separately
- **Impact:** More accurate logging only (functionality unchanged)
- **Lines Modified:** 169-170, 172-175, 233-238, 243-250, 291-292

**No SQL schemas or migrations were modified as part of this work.**

**Note:** Only a minor logging/counting improvement was made; no functional behavior changes were required. The implementation already matched the specification.

---

## Verification Steps

### ⚠️ CRITICAL: Verify `media_assets` Table First

**This table is 100x more critical than `storage_quotas`. If it's missing or wrong, nothing will work.**

```sql
-- Verify table exists with correct structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'media_assets'
ORDER BY ordinal_position;
```

**Required columns:** `id`, `brand_id`, `tenant_id`, `path`, `filename`, `category`, `size_bytes`, `metadata`, `status`

**If table is missing or wrong:**
- Apply migrations: `001_bootstrap_schema.sql` and `007_add_media_assets_status_and_rls.sql`
- **DO NOT PROCEED** until table structure is correct

### Then Test Crawler

1. **Crawl a brand** (e.g., https://806marketing.com)
2. **Check logs** - Should see `persistedCount > 0`, no quota errors
3. **Query database** - Should see 2 logos + 10-15 brand images in `media_assets` table
4. **Call Brand Guide API** - Should return `logos` and `images` arrays
5. **Open Step 5** - Should display logos and images

**If real logs still show errors:**
- **First:** Verify `media_assets` table exists and has correct structure (see above)
- **Second:** Verify deployed commit includes fixes
- **Third:** Check environment variables (SUPABASE_SERVICE_ROLE_KEY, etc.)
- **Fourth:** Verify database schema matches expectations

---

## Next Steps

1. **Deploy to staging/production environment**
2. **Verify on 1-2 additional real brands** (not just 806marketing.com) to confirm:
   - Image persistence works correctly
   - Logos and images display in Step 5
   - No quota errors in logs
3. **Monitor logs** for any quota errors or persistence failures
4. **User acceptance testing** - Verify Step 5 shows logos/images correctly for end users

**Before enabling this for all tenants, verify on at least 1-2 additional real brands to confirm image persistence and display.**

---

**For detailed implementation and testing information, see:**  
`docs/MVP_BRAND_CRAWLER_LOGOS_AND_IMAGES_AUDIT.md`

---

## Squarespace CDN Image Classification Fix

**Issue:** All images from Squarespace-hosted sites (e.g., `https://sdirawealth.com`) were being classified as `platform_logo` and filtered out, resulting in `filteredOut: 15`, `totalToPersist: 0`.

**Root Cause:** Previous logic checked if "squarespace" appeared anywhere in the URL, which matched ALL images from `images.squarespace-cdn.com`, even legitimate brand images like hero banners and photos.

**Fix:** Platform logo detection now requires BOTH:
1. Vendor name appears in URL/alt/filename (squarespace, wix, godaddy, etc.) AND
2. Logoish pattern appears (logo, badge, icon, powered-by, etc.)
3. Large images (> 300x300) are explicitly NOT classified as platform_logo even with vendor+logoish

**Result:**
- **Squarespace-hosted sites:** Large images (hero banners, photos) are correctly classified as `hero`/`photo`/`other` and persisted
- **Non-Squarespace sites:** Behavior unchanged - still correctly filters out true platform logos
- **True platform logos:** Small icons/badges with platform branding are still correctly filtered out

**Expected Behavior:**
- **SDIRA Wealth (Squarespace):** Should see `filteredOut < 15`, `brandImagesFound > 0`, `brandImagesSelected > 0`
- **806 Marketing (non-Squarespace):** Should continue working as before

---

## Enhanced Logo Detection (CSS, SVG, Favicon, OG)

**Issue:** Modern websites (especially Squarespace, Webflow, Canva, Wix, Shopify) often render logos via CSS `background-image`, inline SVG, or other non-`<img>` methods, causing logos to be missed.

**Solution:** Added comprehensive logo extraction from multiple sources:
1. **CSS Logos** - Detects logos from `background-image` and `mask-image` in computed styles
2. **SVG Logos** - Detects inline SVG logos in header/nav elements
3. **Favicon Fallback** - Uses favicon/mask-icon if no other logos found
4. **OG Image Fallback** - Uses `og:image` if no other logos found

**Priority Order:** Inline SVG > CSS background-image > HTML `<img>` > OG image > Favicon

**Result:**
- **Squarespace sites:** Can now detect logos rendered via CSS (common on Squarespace)
- **Modern sites:** Can detect inline SVG logos in headers
- **All sites:** Has fallback to favicon/OG image if no explicit logo found

**Expected Behavior:**
- **SDIRA Wealth:** Should detect at least 1-2 logos via CSS/SVG/header detection
- **All sites:** Should have better logo detection coverage
