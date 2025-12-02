# Onboarding Image Classification Strategy

## Executive Summary

POSTD's onboarding should feel **magical and automatic** - the AI does the heavy lifting, the customer reviews and refines. Image classification is a critical part of this experience.

**Recommendation**: Keep automatic classification, but make it smarter. Don't ask clients to manually sort images - that breaks the magic.

---

## Current Approach: Automatic Classification ✅

### What We Do Now
1. **Automatic Classification**: POSTD automatically classifies images as:
   - **Logos** (max 2): Small images in header/nav, typically < 400px
   - **Hero Images**: Large banner images near top of page
   - **Brand Images** (max 15): Photos, lifestyle images, product shots, brand graphics
   - **Team/Subject Images**: People, products, services
   - **Filtered Out**: Social icons, platform logos, partner logos, very small icons

2. **Smart Filtering**: 
   - Excludes logo-style images from brand images (even if not classified as logos)
   - Prioritizes high-quality, larger images
   - Filters out duplicates and low-quality images

### Why This Approach Works
- ✅ **Magical Experience**: Customer sees Brand Guide fill in automatically
- ✅ **No Manual Work**: Client doesn't need to sort through 20+ images
- ✅ **Immediate Value**: Brand Guide is ready in 20-30 seconds
- ✅ **Professional**: Shows POSTD understands their brand automatically

---

## Why NOT "Import All and Let Client Sort" ❌

### Problems with Manual Sorting
1. **Breaks the Magic**: Forces customers to do manual work
2. **Decision Fatigue**: Sorting through 15-30 images is tedious
3. **Delayed Value**: Brand Guide isn't usable until client completes sorting
4. **Poor UX**: Doesn't showcase POSTD's AI intelligence
5. **Abandonment Risk**: More steps = more drop-off

### When Manual Sorting Makes Sense
- **Only** as an optional refinement step AFTER automatic classification
- Customer can review and reclassify if needed (already in Brand Guide editor)

---

## What Information Makes Onboarding Work Best

### 1. Website Structure & Content

**Critical Information:**
- ✅ **Homepage URL**: Main entry point for scraping
- ✅ **About Page**: Mission, values, brand story
- ✅ **Services/Products Pages**: What they offer
- ✅ **Blog/Resources**: Voice, tone, expertise areas
- ✅ **Contact/Team Pages**: Audience, personas

**Why It Matters:**
- More pages = better brand understanding
- About pages reveal voice/tone
- Services pages show offerings and pain points
- Blog content demonstrates writing style

**Current Status**: ✅ We scrape homepage + can expand to other pages

---

### 2. Image Classification Signals

**Logo Detection:**
- ✅ **Location**: Header/nav = high confidence logo
- ✅ **Size**: < 400px = likely logo
- ✅ **Filename**: Contains "logo" = logo indicator
- ✅ **Alt Text**: Mentions "logo" or brand name
- ✅ **Context**: In `<header>` or `.logo` class

**Brand Image Detection:**
- ✅ **Size**: > 400px = likely brand image
- ✅ **Location**: Hero sections, main content area
- ✅ **Content**: Lifestyle, product, team photos
- ✅ **Aspect Ratio**: Landscape or portrait (not square icons)

**Logo-Style Filtering:**
- ✅ **Exclude**: Small square images with "logo" in filename
- ✅ **Exclude**: Images < 400px in header/nav (unless already logos)
- ✅ **Exclude**: Very small square images (< 50k pixels)

**Current Status**: ✅ Implemented with recent improvements

---

### 3. Brand Visual Identity

**Colors:**
- ✅ **Extraction Method**: CSS analysis, computed styles
- ✅ **Quantity**: Primary (3) + Secondary (3) = 6 colors max
- ✅ **Format**: HEX codes for consistency

**Typography:**
- ✅ **Detection**: CSS font-family analysis
- ✅ **Hierarchy**: Heading font + Body font
- ✅ **Fallbacks**: Google Fonts matching

**Current Status**: ✅ Implemented in crawler

---

### 4. Brand Voice & Tone

**Extraction Sources:**
- ✅ **Homepage Copy**: Main messaging
- ✅ **About Page**: Brand story, mission, values
- ✅ **Blog Posts**: Writing style, topics
- ✅ **Meta Descriptions**: Brand positioning

**AI Analysis:**
- ✅ **Voice Characteristics**: Professional, playful, warm, etc.
- ✅ **Tone Indicators**: Formality level, confidence, friendliness
- ✅ **Keyword Themes**: Recurring topics and phrases
- ✅ **Audience Signals**: Pain points, motivations, objections

**Current Status**: ✅ Implemented via AI brand kit generation

---

### 5. Content Structure & Messaging

**Key Elements:**
- ✅ **Headlines (H1, H2, H3)**: Content hierarchy
- ✅ **CTAs**: Call-to-action language patterns
- ✅ **Service Descriptions**: What they offer
- ✅ **Value Propositions**: Key differentiators
- ✅ **FAQs**: Common questions/objections

**Current Status**: ✅ Extracted during crawl

---

## Image Classification Improvements Made

### Recent Enhancements

1. **Stricter Logo Detection** ✅
   - Only small images (< 400px) in header/nav are logos
   - Large images automatically classified as hero/brand images

2. **Logo-Style Filtering** ✅
   - Excludes logo-style images from brand images collection
   - Filters small square images with "logo" indicators
   - Prevents logo variants from cluttering brand images

3. **Size-Based Classification** ✅
   - Large images (> 600px) = hero images
   - Medium images (400-600px) = brand images
   - Small images (< 400px) = logos (if in header/nav)

4. **Enhanced Logging** ✅
   - Shows role breakdown (logos, heroes, photos, etc.)
   - Tracks filtered logo-style images
   - Helps debug classification accuracy

---

## Recommended Workflow

### Step 1: Automatic Classification (Current)
```
Website Scrape → AI Analysis → Automatic Classification
├── Logos (2 max)
├── Hero Images
├── Brand Images (15 max)
└── Filtered Out (icons, platform logos, etc.)
```

### Step 2: Brand Guide Review (Current)
```
Customer sees Brand Guide automatically populated
├── Can edit/reclassify images
├── Can add/remove images
└── Can confirm classifications
```

### Step 3: Refinement (Optional)
```
If customer wants to adjust:
├── Click image in Brand Guide
├── Change classification
└── Upload additional images
```

---

## What We Need for Optimal Classification

### Website Quality Signals

**High Quality Site (Easy Classification):**
- ✅ Clear homepage with hero image
- ✅ Logo in header (standard placement)
- ✅ About page with brand story
- ✅ High-quality images (not pixelated)
- ✅ Consistent color scheme
- ✅ Clear typography hierarchy

**Low Quality Site (Harder Classification):**
- ⚠️ No clear hero image
- ⚠️ Multiple logo variations
- ⚠️ Poor image quality
- ⚠️ Inconsistent branding
- ⚠️ Generic templates

**Our Approach:**
- Still classify automatically
- Use conservative thresholds (prefer false negatives)
- Customer can refine in Brand Guide editor

---

## Future Enhancements

### Potential Improvements

1. **Multi-Page Crawling** (Future)
   - Currently: Homepage only
   - Future: Crawl About, Services, Blog pages
   - Benefit: More brand context, better images

2. **AI Image Analysis** (Future)
   - Vision API to analyze image content
   - Detect: People, products, lifestyle, abstract
   - Better classification accuracy

3. **Customer Preferences** (Future)
   - Learn from customer edits
   - Improve classification over time
   - Personalized thresholds

4. **Batch Reclassification** (Future)
   - Customer can select multiple images
   - Bulk change classification
   - Faster refinement

---

## Key Metrics to Track

### Classification Accuracy

**Success Metrics:**
- ✅ **Logo Detection**: 90%+ accuracy (correct logo identified)
- ✅ **Brand Image Selection**: 80%+ useful images (customer keeps most)
- ✅ **Filter Rate**: < 20% false positives (logo-style in brand images)

**Current Status:**
- Logo detection: Good (recently improved)
- Brand image selection: Good (recently improved filtering)
- Filter rate: Improved (logo-style filtering added)

---

## Conclusion

**Keep Automatic Classification** ✅

The automatic approach aligns with POSTD's value proposition:
- **Magical onboarding experience**
- **Immediate value** (Brand Guide ready in seconds)
- **AI intelligence** (POSTD understands the brand)
- **Professional** (no manual work required)

**Current Status**: 
- ✅ Automatic classification is working well
- ✅ Recent improvements filter logo-style images
- ✅ Classification is accurate enough for production
- ✅ Customer can refine in Brand Guide editor

**Next Steps:**
1. Monitor classification accuracy in production
2. Collect customer feedback on image quality
3. Optionally add multi-page crawling for richer context
4. Consider AI vision analysis for better content detection

---

## Appendix: Classification Rules Reference

### Logo Classification
- ✅ Location: Header/nav
- ✅ Size: < 400px width AND height
- ✅ Indicators: "logo" in filename/alt, brand name match
- ✅ Max: 2 logos (primary + alternate)

### Brand Image Classification
- ✅ Size: > 400px in at least one dimension
- ✅ Location: Hero sections, main content
- ✅ Content: Lifestyle, products, team, services
- ✅ Max: 15 brand images
- ❌ Exclude: Logo-style images (see filtering rules)

### Logo-Style Filtering (Exclude from Brand Images)
- ❌ Small square images (< 400px) with "logo" indicators
- ❌ Images in header/nav that aren't primary logos
- ❌ Very small square images (< 50k pixels total)
- ❌ Images with logo-like patterns but not classified as logos

---

**Last Updated**: December 2025
**Status**: ✅ Production Ready

