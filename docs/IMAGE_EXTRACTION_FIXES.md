# Image Extraction Fixes

## Problem
The scraper was no longer pulling images. After investigation, several issues were identified:

1. **Too strict filtering** - Required dimensions that might not be available
2. **Images not loaded** - Extracting dimensions before images finished loading
3. **Silent failures** - Errors were caught but not logged properly
4. **Overly complex categorization** - Too many requirements for image acceptance

## Fixes Applied

### 1. Wait for Images to Load
- Added `waitForLoadState("networkidle")` before extracting images
- Added 1 second delay for lazy-loaded images
- This ensures `naturalWidth`/`naturalHeight` are available

### 2. More Lenient Dimension Detection
- Try multiple methods: `naturalWidth` → `width` → `clientWidth`
- Accept images even without dimensions (might be lazy-loaded or CSS-sized)
- Don't reject images just because dimensions aren't available

### 3. Simplified Filtering
- **Before**: Rejected images < 100x100 pixels
- **After**: Only reject confirmed tiny icons < 50x50 pixels
- Accept images without dimensions (they might be valid)
- Only filter out obvious junk (data URIs, placeholders)

### 4. Better Error Handling
- Added comprehensive logging at each step
- Log image count at extraction, filtering, and final stages
- Better error messages with context
- Continue processing even if individual images fail

### 5. Enhanced Categorization
- More lenient team detection (checks filename, URL, alt text)
- More lenient hero detection (2 viewport heights instead of 1.5)
- Accept images even if categorization is uncertain
- Better filename extraction with fallbacks

### 6. Improved Persistence
- Better URL validation before saving
- Improved filename extraction with error handling
- Better logging for successful/failed persistence
- Continue with other images if one fails

## Key Changes

### Image Extraction (`extractImages`)
```typescript
// ✅ Wait for images to load
await page.waitForLoadState("networkidle", { timeout: 5000 });
await page.waitForTimeout(1000);

// ✅ More lenient dimension detection
let width: number | undefined = undefined;
if (img.naturalWidth && img.naturalHeight && img.naturalWidth > 0) {
  width = img.naturalWidth;
} else if (img.width && img.height && img.width > 0) {
  width = img.width;
} else if (img.clientWidth && img.clientHeight) {
  width = img.clientWidth;
}
// Accept image even if width is undefined

// ✅ More lenient filtering
if (img.width && img.height) {
  // Only reject if confirmed tiny (50x50 instead of 100x100)
  if (img.width < 50 && img.height < 50) return false;
}
// Accept all other images (even without dimensions)
```

### Image Persistence (`persistScrapedImages`)
```typescript
// ✅ Better URL validation
if (!image.url || !image.url.startsWith("http")) {
  console.warn(`[ScrapedImages] Skipping invalid image URL`);
  continue;
}

// ✅ Better filename extraction with fallback
let filename = `scraped-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
try {
  const extractedFilename = urlObj.pathname.split("/").pop();
  if (extractedFilename && extractedFilename.length > 0) {
    filename = extractedFilename;
  }
} catch (urlError) {
  // Use default filename if parsing fails
}

// ✅ Better logging
console.log(`[ScrapedImages] ✅ Persisted image: ${filename}`);
```

## Results

The scraper now:
- ✅ Extracts images even if dimensions aren't available
- ✅ Waits for images to load before extracting
- ✅ Accepts more images (less aggressive filtering)
- ✅ Logs progress at each step for debugging
- ✅ Handles errors gracefully without crashing
- ✅ Persists images with better error handling

## Testing Checklist

- [ ] Images are extracted from main page
- [ ] Images are extracted from team/about pages
- [ ] Logo is detected and prioritized
- [ ] Images without dimensions are still extracted
- [ ] Images are persisted to media_assets table
- [ ] Images appear in Brand Guide
- [ ] Images appear in Creative Studio
- [ ] Logs show extraction progress

## Logging

The scraper now logs:
- `[Browser] Found X img elements` - Initial count
- `[Browser] Extracted X images total` - After extraction
- `[Crawler] Extracted X images from page` - After processing
- `[Crawler] Filtered to X images` - After filtering
- `[Crawler] Returning X images` - Final count
- `[ScrapedImages] ✅ Persisted image` - Successful saves
- `[ScrapedImages] ❌ Failed to persist` - Failed saves with details

