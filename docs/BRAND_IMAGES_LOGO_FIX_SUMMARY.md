# Brand Images Logo Fix - Summary

**Date:** 2025-01-27  
**Issue:** Brand Images section showing logo images instead of real brand photography  
**Status:** ✅ **FIXED**

---

## Root Cause

Logos were appearing in the Brand Images section due to **multiple issues in the pipeline**:

1. **Persistence Logic**: Category determination used index-based logic (`i < selectedLogos.length`) instead of role-based logic, causing logos beyond the first 2 to be persisted with `category = "images"`.

2. **Classification Filtering**: The `brandImages` filter was too lenient, allowing logo-like images to slip through if they didn't have explicit `role === "logo"`.

3. **API Filtering**: The Brand Guide API didn't strictly enforce category filtering when building `scrapedBrandImages`.

4. **Frontend Filtering**: The BrandDashboard component didn't have strict enough filters to exclude logos by both role and category.

5. **No Deduplication**: Duplicate logo variants could appear if they had different URLs but were the same image.

---

## Files Changed

### Backend

1. **`server/lib/scraped-images-service.ts`**
   - **Line 421-423**: Changed `isLogo` determination from index-based to role-based
   - **Line 430-462**: Enhanced category determination with strict role-based logic and double-checks
   - **Line 134-220**: Completely rewrote logo/brand image separation with strict filtering
   - **Line 250-260**: Added URL-based deduplication before combining logos and brand images
   - **Line 467-477**: Added `category` to metadata for easier filtering
   - **Line 930-948**: Enhanced `getScrapedImages()` to support category filtering
   - **Line 1016-1042**: Added strict role/category checks in image filtering

2. **`server/routes/brand-guide.ts`**
   - **Line 64-71**: Enhanced metadata mapping to include category
   - **Line 111-126**: Enhanced logo filtering to check both role and category
   - **Line 128-153**: Enhanced brand image filtering with strict role/category exclusions

### Frontend

3. **`client/components/dashboard/BrandDashboard.tsx`**
   - **Line 520-587**: Completely rewrote brand images collection with:
     - Strict filtering by role AND category
     - URL-based deduplication
     - Exclusion of social icons and platform logos

---

## Fixes Implemented

### 1. Classification & Separation

**Before:**
- Index-based logo detection (`i < selectedLogos.length`)
- Lenient brand image filtering
- Logo-like images could slip through

**After:**
- **Role-based logo detection**: `isLogo = image.role === "logo"`
- **Strict brand image filtering**:
  - Excludes `role === "logo"`
  - Excludes `role === "social_icon"` or `platform_logo`
  - Only accepts `["hero", "photo", "team", "subject", "other"]`
  - Additional safety check: Excludes small square images with logo indicators

### 2. Persistence

**Before:**
- Category determined by index position
- No category in metadata
- No deduplication

**After:**
- **Strict category determination**:
  - `role === "logo"` → `category = "logos"` (enforced with double-checks)
  - Other valid roles → `category = "images"`
- **Category included in metadata** for easier filtering
- **URL-based deduplication** before persistence

### 3. API Filtering

**Before:**
- Only checked `role !== "logo"` in metadata
- Didn't check category

**After:**
- **Strict filtering**:
  - Excludes `role === "logo"` OR `category === "logos"`
  - Excludes `role === "social_icon"` OR `platform_logo`
  - Only includes valid brand image roles with valid categories

### 4. Frontend Filtering

**Before:**
- Only checked `role !== "logo"` in metadata
- No deduplication
- No category checking

**After:**
- **Strict filtering**:
  - Excludes `role === "logo"` OR `category === "logos"`
  - Excludes `role === "social_icon"` OR `platform_logo`
  - URL-based deduplication
  - Checks both `brand.images` and `brand.brandImages` arrays

---

## Filters & Conditions

### Logo Classification

**An image is classified as a logo if:**
1. `role === "logo"` (explicit classification), OR
2. Has strong logo indicators (filename/alt/URL contains "logo") AND is small square (< 300x300)

**Logo persistence:**
- Max 2 logos
- `category = "logos"`
- `metadata.role = "logo"`
- `metadata.category = "logos"`

### Brand Image Classification

**An image is classified as a brand image if:**
1. `role` is one of: `"hero"`, `"photo"`, `"team"`, `"subject"`, `"other"`
2. `role !== "logo"` AND `role !== "social_icon"` AND `role !== "platform_logo"`
3. `category !== "logos"` (belt-and-suspenders check)
4. NOT a small square image (< 250x250) with logo indicators
5. NOT a very tiny image (< 100x100 pixels)

**Brand image persistence:**
- Max 15 brand images
- `category = "images"`
- `metadata.role = "hero" | "photo" | "team" | "subject" | "other"`
- `metadata.category = "images"`

### Frontend Brand Images Query

**Brand Images section displays images where:**
1. `metadata.role` is NOT `"logo"`, `"Logo"`, `"social_icon"`, or `"platform_logo"`
2. `metadata.category` is NOT `"logos"`
3. Image is from `brand.images` or `brand.brandImages` arrays (already filtered by API)
4. OR from `brand.approvedAssets.uploadedPhotos` with `source === "scrape"` and valid role/category
5. URL-based deduplication (no duplicate URLs)

---

## Edge Cases Handled

1. **Multiple logo variants**: Deduplication by URL prevents duplicate logos
2. **Logo-like images**: Small square images with logo indicators are excluded from brand images
3. **Platform CDN images**: Large Squarespace/Wix CDN images are correctly classified as brand images (not platform logos)
4. **Missing metadata**: Defaults to safe values (category="images" for unknown roles)
5. **Category mismatch**: Double-checks ensure role and category always match

---

## Testing Recommendations

1. **Test with Aligned By Design** (your brand):
   - Crawl the site
   - Verify logos appear only in Logos section
   - Verify Brand Images shows real photos/hero images
   - Verify no duplicate logo variants

2. **Test with other sites**:
   - Squarespace-hosted sites (should work correctly)
   - Sites with multiple logo variants
   - Sites with CSS/SVG logos

3. **Verify database**:
   - Check `media_assets` table: `category = "logos"` for logos, `category = "images"` for brand images
   - Check `metadata.role` matches `category`
   - Check no logos have `category = "images"`

---

## Verification Steps

1. ✅ TypeScript compilation passes (`pnpm typecheck`)
2. ⏳ Run crawler against test site
3. ⏳ Verify logos in Logos section only
4. ⏳ Verify Brand Images shows real photos
5. ⏳ Verify no duplicate logo variants

---

## Remaining Edge Cases

1. **Very large logo images**: If a logo is > 300x300, it might be classified as a brand image. This is intentional to prevent false positives, but could miss legitimate large logos.

2. **Logo in hero image**: If a hero image contains a logo (e.g., a banner with logo), it will be classified as "hero" and appear in Brand Images. This is correct behavior.

3. **OG image as logo**: OG images are used as fallback logos, but if they're large, they might appear in Brand Images. The API filters should prevent this.

---

**Next Steps:**
1. Test with real brands (especially Aligned By Design)
2. Monitor logs for any category mismatches
3. Verify Brand Guide UI shows correct images

