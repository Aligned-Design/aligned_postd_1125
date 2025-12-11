# Brand Guide Visuals Upgrade - Implementation Summary

**Date:** December 10, 2025  
**Status:** ✅ Implemented

## Overview

This upgrade improves the Brand Guide visuals by implementing a clear image role taxonomy, tightening classification heuristics, improving color extraction resilience, and adding manual override capabilities.

## Goals Achieved

1. **Separate logos from brand images from icons** - Images are now classified into distinct roles for proper display
2. **Reduce generic icon pack pollution** - Small UI icons are detected and excluded from primary brand imagery
3. **Improve color extraction reliability** - DOM-based extraction with screenshot fallback prevents bad palettes
4. **Enable user corrections** - API endpoints allow manual role changes and exclusions

---

## Files Changed

### New Files Created

| File | Purpose |
|------|---------|
| `shared/image-classification.ts` | Image role taxonomy types, constants, and helper functions |
| `server/lib/image-classifier.ts` | Unified classification module with signal-based heuristics |
| `server/lib/color-extraction-service.ts` | DOM-first color extraction with fallback logic |
| `server/__tests__/image-classifier.test.ts` | Tests for image classification behavior |

### Files Modified

| File | Changes |
|------|---------|
| `server/routes/media-v2.ts` | Added `PATCH /:assetId/role` endpoint for role changes |
| `server/lib/scraped-images-service.ts` | Added `updateAssetRole()` function for manual overrides |

---

## Image Role Taxonomy

### Roles Defined in `shared/image-classification.ts`

| Role | Description | Displayed in Brand Guide? | Category |
|------|-------------|--------------------------|----------|
| `logo` | Primary brand logo (max 2) | ✅ Yes | `logos` |
| `brand_image` | Rich brand photos, lifestyle, product shots | ✅ Yes | `images` |
| `hero` | Large hero/banner images | ✅ Yes | `images` |
| `team` | Team/staff photos | ✅ Yes | `images` |
| `product` | Product/service images | ✅ Yes | `images` |
| `background` | Background textures/patterns | ✅ Yes | `images` |
| `icon` | Small UI icons (excluded) | ❌ No | `icons` |
| `social_icon` | Social media icons (excluded) | ❌ No | `icons` |
| `platform_logo` | Platform badges like "Powered by" (excluded) | ❌ No | `icons` |
| `partner_logo` | Partner/affiliate badges (excluded) | ❌ No | `icons` |
| `other` | Unclassified images | ✅ Yes | `images` |

---

## Classification Logic

### Location in Code

All classification logic now lives in `server/lib/image-classifier.ts`.

### Classification Signals Used

1. **Size-based signals**
   - `width`, `height`, `area`, `aspectRatio`
   - Icons: < 150px max dimension
   - Logos: 40-400px max dimension
   - Heroes: > 600px max dimension or > 800px width

2. **Location-based signals**
   - `inHeaderOrNav`: Strong logo indicator (+0.3 confidence)
   - `inFooter`: Lower priority
   - `inHeroOrAboveFold`: Hero image indicator
   - `inAffiliateOrPartnerSection`: Partner logo indicator

3. **Content-based signals**
   - `alt`: Alt text analysis
   - `filename`: Filename pattern matching
   - `url`: URL path analysis
   - `brandMatchScore`: How well image matches brand name (0-2)

4. **Source signals**
   - `sourceType`: SVG sources get logo bonus
   - `parentClasses`, `parentIds`: Context from DOM

### Classification Order

1. **Exclusions first** (fast fail):
   - Social icons (facebook, instagram, etc.)
   - Platform logos (squarespace + logo pattern)
   - Partner logos (in affiliate section or small + partner pattern)
   - UI icons (icon pack paths or generic icon patterns + small size)

2. **Positive classification**:
   - Logo detection (filename, alt, header location, brand match)
   - Hero detection (large size or above fold)
   - Team photos (team/about page + team context)
   - Product images (product/service patterns)
   - Default: brand_image or other based on size

---

## Color Extraction Improvements

### Location in Code

`server/lib/color-extraction-service.ts`

### Strategy (Priority Order)

1. **DOM-based extraction** (primary, fast, reliable)
   - CSS variables: `--primary`, `--secondary`, `--accent`, `--brand-*`
   - Header/nav background and text colors
   - Button/CTA colors
   - Hero section colors
   - Accent elements (badges, tags)
   - Footer colors
   - Link colors

2. **Screenshot-based extraction** (fallback)
   - Uses `node-vibrant` on viewport screenshot
   - Only used if DOM yields < 3 colors
   - Timeout: 10 seconds (configurable)

3. **Smart fallback** (last resort)
   - Returns POSTD brand colors if both fail
   - Confidence: 0 (indicates fallback)

### Color Filtering

- **Near-black** (brightness < 15): Excluded
- **Near-white** (brightness > 245): Excluded
- **Grays** (saturation < 0.1): Excluded
- **Photo colors** (skin tones): Excluded
- **Near-duplicates** (distance < 20): Deduplicated

### Output Structure

```typescript
interface ColorPalette {
  primary?: string;       // First brand color
  secondary?: string;     // Second brand color
  accent?: string;        // Third brand color
  confidence: number;     // 0-100 extraction confidence
  primaryColors: string[];   // Up to 3 primary colors
  secondaryColors: string[]; // Up to 3 secondary colors
  allColors: string[];       // All 6 colors combined
  source: "dom" | "screenshot" | "hybrid" | "fallback";
}
```

---

## API Endpoints for Manual Overrides

### Change Asset Role

```
PATCH /api/media/:assetId/role
```

**Request Body:**
```json
{
  "role": "logo" | "brand_image" | "icon" | "hero" | "team" | "product" | "partner_logo" | "social_icon" | "platform_logo" | "background" | "other"
}
```

**Response:**
```json
{
  "assetId": "uuid",
  "role": "logo",
  "category": "logos",
  "updatedAt": "2025-12-10T..."
}
```

**Effects:**
- Updates `media_assets.metadata.role`
- Updates `media_assets.category` column
- Sets `metadata.userOverridden = true`
- Preserves `metadata.originalRole` for audit

### Exclude Asset (Existing)

```
POST /api/media/:assetId/exclude
```

### Restore Asset (Existing)

```
POST /api/media/:assetId/restore
```

---

## Database Schema Alignment

### `media_assets` Table

| Column | Type | Usage |
|--------|------|-------|
| `category` | TEXT | `logos`, `images`, `graphics`, `icons` |
| `metadata` | JSONB | Contains `role`, `source`, `width`, `height`, `alt`, `userOverridden`, `originalRole` |
| `excluded` | BOOLEAN | Soft delete for user removal |

### Metadata Structure

```json
{
  "source": "scrape",
  "role": "logo",
  "category": "logos",
  "width": 200,
  "height": 100,
  "alt": "Company Logo",
  "scrapedUrl": "https://example.com/logo.png",
  "scrapedAt": "2025-12-10T...",
  "userOverridden": false,
  "originalRole": null
}
```

---

## Follow-Up UI Work Unblocked

With these backend changes, the following UI features can now be built:

1. **Manual Recategorization UI**
   - Use `PATCH /api/media/:assetId/role` to let users drag images between logo/brand sections
   - Show "Restore original" option using `metadata.originalRole`

2. **Excluded Images Panel**
   - Use `GET /api/media/excluded?brandId=X` to show hidden images
   - Allow restore via `POST /api/media/:assetId/restore`

3. **Improved Onboarding Step 5**
   - Use `brandGuide.logos` and `brandGuide.images` arrays
   - Icons are already filtered out by classification

4. **Color Palette Editor**
   - Use `brand_kit.colors.source` to show extraction confidence
   - Allow manual color additions that persist in `brand_kit.colors`

---

## Testing

### Test File

`server/__tests__/image-classifier.test.ts`

### Test Coverage

- Logo detection (filename, alt, header location)
- Icon detection (icon paths, generic patterns, small squares)
- Social icon detection (platform names)
- Platform logo detection (vendor + logoish patterns)
- Partner logo detection (affiliate sections)
- Hero image detection (size, above fold)
- Team photo detection (page type, context)
- Priority scoring (logos > heroes > brand images)
- Edge cases (missing dimensions, data URIs, platform CDN images)

---

## Debug Flags

| Flag | Purpose |
|------|---------|
| `DEBUG_IMAGE_CLASSIFICATION=true` | Log classification decisions |
| `DEBUG_COLOR_EXTRACT=true` | Log color extraction steps |
| `DEBUG_LOGO_DETECT=true` | Log logo detection heuristics |
| `DEBUG_SQUARESPACE_IMAGES=true` | Log platform CDN image handling |

---

## Backwards Compatibility

- **Existing data preserved**: No data migration required
- **Legacy roles mapped**: `photo` → `brand_image`, `ui_icon` → `icon`, etc.
- **API responses unchanged**: Brand Guide API still returns `logos` and `images` arrays
- **RLS policies respected**: All queries filter by brand_id and respect existing permissions

---

## Summary

This upgrade transforms POSTD's brand guide visuals from "generic icon pack" to "real designer" quality by:

1. ✅ Classifying images into meaningful roles (logo, brand_image, icon, hero, etc.)
2. ✅ Excluding UI icons and platform badges from primary brand imagery
3. ✅ Extracting color palettes reliably with DOM-first approach
4. ✅ Enabling user corrections without requiring full UI redesign
5. ✅ Providing tests to validate classification behavior

The system now distinguishes between **logos**, **brand images**, and **icons** instead of lumping everything into "images."

