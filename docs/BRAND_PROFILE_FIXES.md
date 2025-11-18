# Brand Profile Screen Fixes

## Issues Identified

1. **Brand Story showing "0"**: The brand story was displaying the number `0` instead of a generated story
2. **No logos found**: Logos were not being displayed even though they were being scraped

## Root Causes

### Brand Story Issue
- The brand story was being saved as the number `0` in some cases
- The UI was not fetching the story from the brand guide API (only from local snapshot)
- No validation to filter out invalid values like `"0"` or empty strings

### Logo Display Issue
- Images are being scraped and saved with role metadata
- The UI correctly filters by `metadata.role === "logo"`
- Issue may be that images don't have role set correctly, or they're not being persisted

## Fixes Applied

### 1. Brand Story Fix (`Screen5BrandSummaryReview.tsx`)

**Added:**
- `brandGuideStory` state to fetch story from brand guide API
- Priority order: `brandGuideStory` → `brandSnapshot.extractedMetadata?.brandIdentity` → fallback
- Validation: Minimum 10 characters, not `"0"`, must be a string
- Updates local `brandSnapshot` when story is found from API

**Code Changes:**
```typescript
// Fetch brand story from brand guide API
if (brandGuide?.purpose || brandGuide?.longFormSummary) {
  const story = brandGuide.purpose || brandGuide.longFormSummary || "";
  if (story && typeof story === "string" && story.length > 10 && story !== "0") {
    setBrandGuideStory(story);
    // Update brandSnapshot locally
    if (brandSnapshot) {
      setBrandSnapshot({
        ...brandSnapshot,
        extractedMetadata: {
          ...brandSnapshot.extractedMetadata,
          brandIdentity: story,
        },
      });
    }
  }
}

// Use brandGuideStory first, then snapshot, then fallback
const rawBrandIdentity = brandGuideStory || brandSnapshot.extractedMetadata?.brandIdentity;
const brandIdentity = (rawBrandIdentity && typeof rawBrandIdentity === "string" && rawBrandIdentity.length > 10 && rawBrandIdentity !== "0")
  ? rawBrandIdentity
  : `${brandSnapshot.name || "Your brand"} is a ${brandSnapshot.industry || "business"} that ${brandSnapshot.voice || "connects with customers"} through ${brandSnapshot.tone?.join(" and ") || "authentic communication"}.`;
```

### 2. Brand Guide Sync Fix (`onboarding-brand-sync.ts`)

**Added:**
- Validation to ensure `purpose` is always a valid string
- Filters out invalid values like `"0"` or empty strings
- Minimum length check (10 characters)

**Code Changes:**
```typescript
// ✅ FIX: Ensure purpose is always a valid string (not 0, not empty)
purpose: (brandSnapshot.extractedMetadata?.brandIdentity && 
          typeof brandSnapshot.extractedMetadata.brandIdentity === "string" && 
          brandSnapshot.extractedMetadata.brandIdentity.length > 10 &&
          brandSnapshot.extractedMetadata.brandIdentity !== "0")
  ? brandSnapshot.extractedMetadata.brandIdentity
  : brandSnapshot.goal || "",
```

## Testing Checklist

- [ ] Brand story displays correctly (not "0")
- [ ] Brand story is fetched from brand guide API
- [ ] Brand story falls back to generated story if API doesn't have one
- [ ] Logos are displayed in "Logos" section
- [ ] Other images are displayed in "Brand Images" section
- [ ] Images are separated correctly by role (logo vs other)
- [ ] Brand story can be edited and saved
- [ ] Changes persist after page refresh

## Debugging

If issues persist, check:

1. **Brand Story:**
   - Check browser console for `[BrandSnapshot] ✅ Found brand story from brand guide`
   - Verify `brandGuide.purpose` or `brandGuide.longFormSummary` exists in API response
   - Check that `brandSnapshot.extractedMetadata.brandIdentity` is a valid string

2. **Images:**
   - Check browser console for `[BrandSnapshot] Separated images: X logos, Y other images`
   - Verify `metadata.role` exists in image objects from API
   - Check that images have `source === "scrape"` and valid URLs

## Next Steps

1. Monitor logs to ensure brand story is being generated correctly
2. Verify images are being saved with correct role metadata
3. Test with various websites to ensure robustness

