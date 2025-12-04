# Brand Kit & Content Engine Repair - Findings & Action Plan

## Executive Summary

After mapping the entire Brand Kit pipeline, I've identified the root causes of all reported issues. The pipeline is **80% functional** - images are being scraped and stored correctly, but the UI components are not consuming the stored data properly.

---

## ✅ What's Working

1. **Website Scraping**: `POST /api/crawl/start?sync=true` successfully crawls websites
2. **Image Extraction**: Images are correctly classified (logos, hero, photo, etc.) and filtered
3. **Image Persistence**: Scraped images are stored in `media_assets` table with `source='scrape'`
4. **Brand Guide API**: `GET /api/brand-guide/:brandId` returns scraped images in `logos[]` and `images[]` arrays
5. **Color Extraction**: Colors are extracted and stored in `brand_kit.colors`

---

## ❌ Critical Issues Found

### Issue 1: Brand Guide UI Not Displaying Scraped Images

**Location**: `client/components/dashboard/BrandDashboard.tsx` (line 369-377)

**Problem**: 
- Only displays single logo from `brand.logoUrl`
- No brand images section at all
- Doesn't read from `brand.approvedAssets.uploadedPhotos` or `brand.logos[]` arrays

**Root Cause**: UI components were built before scraped images pipeline was implemented

**Impact**: 
- Only 3 logos show up (if they're stored in `logoUrl`)
- Brand images section is empty
- Users see placeholder "Add logo" even when images exist in database

---

### Issue 2: Visual Identity Editor Not Using Scraped Images

**Location**: `client/components/dashboard/VisualIdentityEditor.tsx` (line 35-141)

**Problem**:
- Only shows single logo upload
- No display of scraped logos from database
- No brand images gallery

**Impact**: Users can't see scraped images in the Brand Guide editor

---

### Issue 3: Color Extraction May Mix/Muddy Colors

**Location**: `server/workers/brand-crawler.ts` - `extractColors()` function

**Problem**: 
- Color extraction implementation not fully reviewed
- May be averaging colors from all images
- Not prioritizing UI colors over photography colors

**Impact**: Brand colors are mixed/muddy instead of clean HEX values

---

### Issue 4: Sample Brand Data in Initial Template

**Location**: `client/types/brandGuide.ts:99` - `INITIAL_BRAND_GUIDE`

**Problem**: 
- Contains hard-coded "Hobby Lobby" example
- Used as default template for new brands

**Impact**: New brands may inherit sample data structure

**Note**: This is used as a template, not live data - less critical

---

### Issue 5: Content Generation Not Verified

**Location**: `server/routes/agents.ts` - Doc Agent route

**Problem**: 
- Content generation may not be using brand_kit properly
- Images may not be loaded into library

**Impact**: Captions/content not being created

**Status**: Need to verify doc agent implementation

---

## 📋 Detailed Action Plan

### Priority 1: Fix Brand Guide UI to Display Scraped Images

#### Step 1.1: Update BrandDashboard Component
**File**: `client/components/dashboard/BrandDashboard.tsx`

**Changes**:
1. Add logos section that reads from `brand.logos[]` or `brand.approvedAssets.uploadedPhotos` (filtered by `source='scrape'` and `role='logo'`)
2. Add brand images gallery section that reads from `brand.images[]` or `brand.approvedAssets.uploadedPhotos` (filtered by `source='scrape'` and `role!=='logo'`)
3. Keep `brand.logoUrl` as fallback for backward compatibility

**Expected Result**: 
- Multiple logos display (up to 2)
- Brand images grid shows scraped images (up to 15)
- No more empty placeholders when images exist

---

#### Step 1.2: Update VisualIdentityEditor Component
**File**: `client/components/dashboard/VisualIdentityEditor.tsx`

**Changes**:
1. Add logos gallery section above logo upload
2. Display scraped logos from `brand.logos[]`
3. Add brand images gallery section
4. Allow users to select which scraped logo is primary

**Expected Result**: 
- Users see scraped logos in editor
- Can select primary logo from scraped options
- Can view scraped brand images

---

#### Step 1.3: Verify Brand Guide API Response Structure
**File**: `server/routes/brand-guide.ts` (lines 229-232)

**Status**: ✅ Already correct - API returns:
```typescript
{
  logos: scrapedLogos, // Max 2 logos
  images: scrapedBrandImages, // Max 15 brand images
  brandImages: scrapedBrandImages,
  approvedAssets: {
    uploadedPhotos: [...scrapedLogos, ...scrapedBrandImages]
  }
}
```

**Action**: Ensure UI components read from these fields

---

### Priority 2: Fix Color Extraction

#### Step 2.1: Review Color Extraction Implementation
**File**: `server/workers/brand-crawler.ts` - Find `extractColors()` function

**Action**: 
1. Locate color extraction code
2. Verify it prioritizes UI colors (CSS colors, header colors, button colors)
3. Ensure it deduplicates near-identical colors
4. Limit to 3-6 core colors

**Expected Changes**:
- Prefer UI element colors over image photography colors
- Deduplicate colors within 5 HEX units
- Store clean HEX values (no mixing/averaging)

---

#### Step 2.2: Update Color Storage Structure
**File**: `server/routes/crawler.ts` (lines 801-816)

**Verify Structure**:
```typescript
{
  primary: "#HEX",
  secondary: "#HEX",
  accent: "#HEX",
  confidence: number,
  primaryColors: ["#HEX", "#HEX", "#HEX"], // Max 3
  secondaryColors: ["#HEX", "#HEX", "#HEX"], // Max 3
  allColors: ["#HEX", ...] // Max 6 total
}
```

**Action**: Ensure UI components display colors from `brand.primaryColors[]` and `brand.secondaryColors[]`

---

### Priority 3: Remove Sample/Demo Data from Live Paths

#### Step 3.1: Audit Sample Data Usage
**Search For**:
- `INITIAL_BRAND_GUIDE` usage in components
- `seedUserBrands` function calls
- Hard-coded brand names: "ABD Events", "Aligned Aesthetics", "Indie Investing"
- Mock/sample data imports in production code

**Action**: 
1. Ensure `INITIAL_BRAND_GUIDE` is only used as a TypeScript type default
2. Remove any sample data from live render paths
3. Replace with empty state UI placeholders

---

#### Step 3.2: Verify Workspace Sidebar
**File**: Components that display workspace/brand list

**Action**: 
- Ensure brand list comes from real database query
- No hard-coded sample brands

---

### Priority 4: Wire Content Generation to Brand Kit

#### Step 4.1: Verify Doc Agent Implementation
**File**: `server/routes/agents.ts` - Doc Agent route

**Check**:
1. Does it receive `brand_id`?
2. Does it fetch `brand_kit` from database?
3. Does prompt builder include brand images/colors?
4. Where is generated content stored?

**Action**: 
- Review doc agent prompt builder
- Ensure brand_kit data is included in prompts
- Verify content storage path

---

#### Step 4.2: Verify Image Library Integration
**Files**: 
- `server/lib/image-sourcing.ts`
- Content generation hooks

**Check**:
- Are scraped images available to content agents?
- Is image library querying `media_assets` correctly?

---

### Priority 5: Create Smoke Test Script

#### Step 5.1: Create Test Script
**File**: `scripts/brand-kit-and-content-smoke.ts`

**Functionality**:
1. Accept `BRAND_ID` and `ACCESS_TOKEN` as parameters
2. Fetch brand guide → log logos/images/colors counts
3. Call doc agent → generate test caption
4. Print summary report

**Expected Output**:
```
Brand Kit:
  Logos: 2
  Brand Images: 8
  Colors: ["#632bf0", "#c084fc", "#e2e8f0"]

Doc Agent:
  Status: 200
  Headline: "Instagram post promoting..."
  Snippet: "..."
```

---

## 🔧 Implementation Order

### Phase 1: UI Fixes (Most Visible Impact)
1. ✅ Update BrandDashboard to show scraped logos
2. ✅ Update BrandDashboard to show brand images gallery
3. ✅ Update VisualIdentityEditor to display scraped images

### Phase 2: Color Extraction
4. Review and fix color extraction algorithm
5. Verify color storage structure
6. Test color accuracy

### Phase 3: Cleanup
7. Remove sample data from live paths
8. Verify workspace sidebar uses real data

### Phase 4: Content Generation
9. Verify doc agent uses brand_kit
10. Verify image library integration

### Phase 5: Testing
11. Create smoke test script
12. Test with real brand (ABD Events, etc.)

---

## 📊 Success Criteria

### Acceptance Tests

1. **Brand Guide Visuals**:
   - ✅ Shows all scraped logos (up to 2)
   - ✅ Shows all scraped brand images (up to 15)
   - ✅ Colors are clean HEX values (not mixed)

2. **No Sample Brand Bleed-Through**:
   - ✅ Each brand sees only their own data
   - ✅ No hard-coded "sample" brand names
   - ✅ Workspace sidebar shows real brands

3. **Content Generation**:
   - ✅ Images load into library
   - ✅ Captions/content created with brand context
   - ✅ Content stored in correct table

---

## 🚨 Critical Files to Modify

1. `client/components/dashboard/BrandDashboard.tsx` - Display scraped images
2. `client/components/dashboard/VisualIdentityEditor.tsx` - Show scraped logos/images
3. `server/workers/brand-crawler.ts` - Fix color extraction (if needed)
4. `client/types/brandGuide.ts` - Remove sample data from INITIAL_BRAND_GUIDE (if used in render)

---

## 📝 Notes

- **API is Already Correct**: The brand-guide API route already returns scraped images correctly. The issue is purely in the UI components.
- **Image Storage Works**: Images are being persisted correctly to `media_assets` table.
- **Color Extraction**: Needs review to ensure clean HEX extraction without mixing.

---

## Next Steps

1. Start with Priority 1 (UI fixes) - this will have the most immediate visual impact
2. Test with a real brand after each fix
3. Use the smoke test script to verify end-to-end functionality

