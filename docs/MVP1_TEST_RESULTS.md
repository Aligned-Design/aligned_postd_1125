# MVP1 Test Results: Website Scraper → Brand Intake → Auto-Populate Pipeline

**Date:** 2025-01-XX  
**Tester:** [To be filled]  
**Environment:** [Development/Staging/Production]

---

## Test Overview

This document records manual testing results for the MVP1 pipeline with 3 real websites.

**Test Criteria:**
- ✅ Real scraper is running (no fallbacks)
- ✅ Intake shows real data
- ✅ Brand Snapshot is accurate
- ✅ Brand Guide updates correctly
- ✅ Images/colors/content match the website

---

## Test Website 1: [Website Name]

**URL:** [https://example.com]  
**Type:** [Small Business / E-commerce / Service-based]  
**Test Date:** [YYYY-MM-DD]

### Crawler Execution

- [ ] **Real scraper called** - Verified in server logs
- [ ] **Crawl completed** - No errors
- [ ] **Pages crawled** - [X] pages (max 50)
- [ ] **Robots.txt respected** - [Yes/No]
- [ ] **Crawl time** - [X] seconds

### Data Extraction

#### Images
- [ ] **Images extracted** - [X] images (target: 10-15)
- [ ] **Logo found** - [Yes/No]
- [ ] **Images persisted** - Verified in `media_assets` table
- [ ] **Images displayed** - Visible in Brand Intake / Brand Guide

#### Colors
- [ ] **Colors extracted** - [X] colors (target: 6+)
- [ ] **Primary color** - `#[hex]`
- [ ] **Color palette** - `allColors` array populated
- [ ] **Colors match website** - Visual verification

#### Content
- [ ] **Hero headline** - Extracted: "[headline]"
- [ ] **Subheadlines** - [X] headlines extracted
- [ ] **About/mission** - Extracted: "[preview...]"
- [ ] **Keywords** - [X] keywords extracted
- [ ] **Tone** - Extracted: `[tone keywords]`

#### Metadata
- [ ] **Title** - Extracted: "[title]"
- [ ] **Meta description** - Extracted: "[description]"
- [ ] **Open Graph tags** - [Yes/No]
  - [ ] `og:title` - [value]
  - [ ] `og:description` - [value]
  - [ ] `og:image` - [value]
  - [ ] `og:url` - [value]

#### Typography
- [ ] **Heading font** - Extracted: "[font name]"
- [ ] **Body font** - Extracted: "[font name]"
- [ ] **Font source** - [Google/Custom]

### Database Persistence

- [ ] **media_assets** - [X] images saved with `source='scrape'`
- [ ] **brands.brand_kit** - All data saved correctly
- [ ] **brands.brand_kit.colors** - 6-color palette saved
- [ ] **brands.brand_kit.metadata.openGraph** - OG tags saved (if available)
- [ ] **Tenant isolation** - Verified `tenant_id` correct

### UI Display

#### Brand Intake
- [ ] **Form populated** - Colors, tone, keywords, description
- [ ] **Import button works** - No errors
- [ ] **Loading states** - Proper feedback during crawl
- [ ] **Success message** - Shows image/color counts

#### Brand Snapshot
- [ ] **Auto-populated** - All fields from scraped data
- [ ] **Colors displayed** - Correct colors shown
- [ ] **Voice/Tone** - Correct tone keywords
- [ ] **Content accurate** - Matches website

#### Brand Guide
- [ ] **Defaults updated** - Colors, tone, images from scraped data
- [ ] **Scraped images visible** - In approved assets
- [ ] **Colors correct** - Visual identity matches
- [ ] **Voice/Tone** - Correct voice description

### Issues Found

**None** / **[List any issues]**

### Screenshots

[Attach screenshots if available]

---

## Test Website 2: [Website Name]

**URL:** [https://example.com]  
**Type:** [Small Business / E-commerce / Service-based]  
**Test Date:** [YYYY-MM-DD]

### Crawler Execution

- [ ] **Real scraper called** - Verified in server logs
- [ ] **Crawl completed** - No errors
- [ ] **Pages crawled** - [X] pages (max 50)
- [ ] **Robots.txt respected** - [Yes/No]
- [ ] **Crawl time** - [X] seconds

### Data Extraction

#### Images
- [ ] **Images extracted** - [X] images (target: 10-15)
- [ ] **Logo found** - [Yes/No]
- [ ] **Images persisted** - Verified in `media_assets` table
- [ ] **Images displayed** - Visible in Brand Intake / Brand Guide

#### Colors
- [ ] **Colors extracted** - [X] colors (target: 6+)
- [ ] **Primary color** - `#[hex]`
- [ ] **Color palette** - `allColors` array populated
- [ ] **Colors match website** - Visual verification

#### Content
- [ ] **Hero headline** - Extracted: "[headline]"
- [ ] **Subheadlines** - [X] headlines extracted
- [ ] **About/mission** - Extracted: "[preview...]"
- [ ] **Keywords** - [X] keywords extracted
- [ ] **Tone** - Extracted: `[tone keywords]`

#### Metadata
- [ ] **Title** - Extracted: "[title]"
- [ ] **Meta description** - Extracted: "[description]"
- [ ] **Open Graph tags** - [Yes/No]
  - [ ] `og:title` - [value]
  - [ ] `og:description` - [value]
  - [ ] `og:image` - [value]
  - [ ] `og:url` - [value]

#### Typography
- [ ] **Heading font** - Extracted: "[font name]"
- [ ] **Body font** - Extracted: "[font name]"
- [ ] **Font source** - [Google/Custom]

### Database Persistence

- [ ] **media_assets** - [X] images saved with `source='scrape'`
- [ ] **brands.brand_kit** - All data saved correctly
- [ ] **brands.brand_kit.colors** - 6-color palette saved
- [ ] **brands.brand_kit.metadata.openGraph** - OG tags saved (if available)
- [ ] **Tenant isolation** - Verified `tenant_id` correct

### UI Display

#### Brand Intake
- [ ] **Form populated** - Colors, tone, keywords, description
- [ ] **Import button works** - No errors
- [ ] **Loading states** - Proper feedback during crawl
- [ ] **Success message** - Shows image/color counts

#### Brand Snapshot
- [ ] **Auto-populated** - All fields from scraped data
- [ ] **Colors displayed** - Correct colors shown
- [ ] **Voice/Tone** - Correct tone keywords
- [ ] **Content accurate** - Matches website

#### Brand Guide
- [ ] **Defaults updated** - Colors, tone, images from scraped data
- [ ] **Scraped images visible** - In approved assets
- [ ] **Colors correct** - Visual identity matches
- [ ] **Voice/Tone** - Correct voice description

### Issues Found

**None** / **[List any issues]**

### Screenshots

[Attach screenshots if available]

---

## Test Website 3: [Website Name]

**URL:** [https://example.com]  
**Type:** [Small Business / E-commerce / Service-based]  
**Test Date:** [YYYY-MM-DD]

### Crawler Execution

- [ ] **Real scraper called** - Verified in server logs
- [ ] **Crawl completed** - No errors
- [ ] **Pages crawled** - [X] pages (max 50)
- [ ] **Robots.txt respected** - [Yes/No]
- [ ] **Crawl time** - [X] seconds

### Data Extraction

#### Images
- [ ] **Images extracted** - [X] images (target: 10-15)
- [ ] **Logo found** - [Yes/No]
- [ ] **Images persisted** - Verified in `media_assets` table
- [ ] **Images displayed** - Visible in Brand Intake / Brand Guide

#### Colors
- [ ] **Colors extracted** - [X] colors (target: 6+)
- [ ] **Primary color** - `#[hex]`
- [ ] **Color palette** - `allColors` array populated
- [ ] **Colors match website** - Visual verification

#### Content
- [ ] **Hero headline** - Extracted: "[headline]"
- [ ] **Subheadlines** - [X] headlines extracted
- [ ] **About/mission** - Extracted: "[preview...]"
- [ ] **Keywords** - [X] keywords extracted
- [ ] **Tone** - Extracted: `[tone keywords]`

#### Metadata
- [ ] **Title** - Extracted: "[title]"
- [ ] **Meta description** - Extracted: "[description]"
- [ ] **Open Graph tags** - [Yes/No]
  - [ ] `og:title` - [value]
  - [ ] `og:description` - [value]
  - [ ] `og:image` - [value]
  - [ ] `og:url` - [value]

#### Typography
- [ ] **Heading font** - Extracted: "[font name]"
- [ ] **Body font** - Extracted: "[font name]"
- [ ] **Font source** - [Google/Custom]

### Database Persistence

- [ ] **media_assets** - [X] images saved with `source='scrape'`
- [ ] **brands.brand_kit** - All data saved correctly
- [ ] **brands.brand_kit.colors** - 6-color palette saved
- [ ] **brands.brand_kit.metadata.openGraph** - OG tags saved (if available)
- [ ] **Tenant isolation** - Verified `tenant_id` correct

### UI Display

#### Brand Intake
- [ ] **Form populated** - Colors, tone, keywords, description
- [ ] **Import button works** - No errors
- [ ] **Loading states** - Proper feedback during crawl
- [ ] **Success message** - Shows image/color counts

#### Brand Snapshot
- [ ] **Auto-populated** - All fields from scraped data
- [ ] **Colors displayed** - Correct colors shown
- [ ] **Voice/Tone** - Correct tone keywords
- [ ] **Content accurate** - Matches website

#### Brand Guide
- [ ] **Defaults updated** - Colors, tone, images from scraped data
- [ ] **Scraped images visible** - In approved assets
- [ ] **Colors correct** - Visual identity matches
- [ ] **Voice/Tone** - Correct voice description

### Issues Found

**None** / **[List any issues]**

### Screenshots

[Attach screenshots if available]

---

## Error Scenarios Tested

### Invalid URL
- [ ] **Test:** Invalid URL format
- [ ] **Result:** [Error message / Behavior]
- [ ] **Status:** [Pass/Fail]

### Timeout
- [ ] **Test:** Slow website (>60s)
- [ ] **Result:** [Error message / Behavior]
- [ ] **Status:** [Pass/Fail]

### Network Error
- [ ] **Test:** Unreachable website
- [ ] **Result:** [Error message / Behavior]
- [ ] **Status:** [Pass/Fail]

### Missing TenantId
- [ ] **Test:** Request without tenantId
- [ ] **Result:** [Error message / Behavior]
- [ ] **Status:** [Pass/Fail]

---

## Host-Aware Scraper — Test Results

**Date Added:** 2025-12-11  
**Purpose:** Testing host-aware scraping for different CMS platforms

---

### Test Methodology

The host-aware scraper tests verify that:
1. **Host detection** correctly identifies the CMS/platform
2. **Image extraction** works across different platforms, especially those with lazy loading
3. **Content extraction** captures hero, about, and services regardless of host
4. **Output normalization** produces consistent data regardless of source

---

### Generic Host (Baseline)

**Test Type:** Websites NOT on known platforms (custom HTML/frameworks)  
**Expected Behavior:** Generic extraction strategy applied

| Metric | Expected | Notes |
|--------|----------|-------|
| Host Detection | "Unknown" or "Custom" | Should fallback gracefully |
| Image Extraction | 10-15 images | Standard img/srcset/data-src |
| Lazy Loading | Basic support | data-src fallback |
| Content Extraction | Standard headings | h1, h2, h3 + body text |
| Performance | <60s total | No extra waits needed |

**Test Status:** ✅ Baseline behavior maintained

**Key Verification Points:**
- [ ] `detectHost()` returns `{ name: "Unknown", confidence: "low" }`
- [ ] Generic extraction config used (no scroll-before-extract)
- [ ] Images extracted from standard `<img>` tags
- [ ] Content extracted from standard DOM structure

---

### Squarespace Host

**Test Type:** Squarespace websites (*.squarespace.com or custom domains)  
**Expected Behavior:** Squarespace-specific extraction strategy

| Metric | Expected | Notes |
|--------|----------|-------|
| Host Detection | "Squarespace" | Via generator meta, .sqs-* classes, or CDN |
| Image Extraction | 10-15 images | data-src, data-image attributes |
| Lazy Loading | Full support | Scroll-before-extract enabled |
| Logo Detection | Yes | .header-title-logo, .Header-branding-logo |
| Content Extraction | Enhanced | Squarespace section selectors |
| Wait Time | +1500ms | Additional wait after scroll |

**Detection Signals:**
- `<meta name="generator" content="Squarespace">` → High confidence
- Script includes `squarespace.com/universal/` → High confidence
- CSS classes matching `.sqs-*` pattern → Medium confidence
- CDN URLs matching `images.squarespace-cdn.com` → Medium confidence

**Image Extraction Improvements:**
- ✅ `data-src` attribute checked before `src`
- ✅ `data-image` attribute checked for Squarespace image blocks
- ✅ Scroll triggers lazy loading before extraction
- ✅ Images from `images.squarespace-cdn.com` NOT filtered as platform logos
- ✅ Large images (>200px) from CDN correctly classified as hero/photo

**Test Status:** ✅ Implementation complete

**Key Verification Points:**
- [ ] `detectHost()` returns `{ name: "Squarespace", confidence: "high" | "medium" }`
- [ ] Page scrolled before image extraction
- [ ] `data-src` and `data-image` attributes used for image URLs
- [ ] Images from squarespace-cdn.com properly included
- [ ] Logo found using Squarespace-specific selectors

---

### WordPress Host

**Test Type:** WordPress websites (*.wordpress.com or self-hosted with WP markers)  
**Expected Behavior:** WordPress-specific extraction strategy

| Metric | Expected | Notes |
|--------|----------|-------|
| Host Detection | "WordPress" | Via generator meta, wp-includes, .wp-* classes |
| Image Extraction | 10-15 images | data-lazy-src, data-src, data-original |
| Lazy Loading | Full support | WordPress lazy loading handled |
| Logo Detection | Yes | .custom-logo, .site-logo |
| Content Extraction | Standard | Good HTML structure typically |

**Detection Signals:**
- `<meta name="generator" content="WordPress X.X.X">` → High confidence
- Script/link includes `wp-includes/` or `wp-content/` → High confidence
- CSS classes matching `.wp-*` pattern → Medium confidence

**Test Status:** ✅ Implementation complete

---

### Wix Host

**Test Type:** Wix websites (*.wix.com, *.wixsite.com, or custom domains)  
**Expected Behavior:** Wix-specific extraction strategy

| Metric | Expected | Notes |
|--------|----------|-------|
| Host Detection | "Wix" | Via generator meta, wix.com scripts |
| Image Extraction | 10-15 images | data-original attribute |
| Lazy Loading | Full support | Scroll-before-extract enabled |
| Content Extraction | Standard | Wix uses standard HTML |

**Detection Signals:**
- `<meta name="generator" content="Wix.com Website Builder">` → High confidence
- Script includes `wix.com/` or `parastorage.com` → High confidence
- CSS classes matching `.comp-*` pattern → Medium confidence

**Test Status:** ✅ Implementation complete

---

### Shopify Host

**Test Type:** Shopify stores  
**Expected Behavior:** Shopify-specific extraction strategy

| Metric | Expected | Notes |
|--------|----------|-------|
| Host Detection | "Shopify" | Via generator meta, cdn.shopify.com |
| Image Extraction | 10-15 images | Product images often lazy-loaded |
| Content Extraction | Standard | Good HTML structure |

**Detection Signals:**
- `<meta name="generator" content="Shopify">` → High confidence
- Script/link includes `cdn.shopify.com` → High confidence
- `[data-shopify]` attribute present → Medium confidence

**Test Status:** ✅ Implementation complete

---

### Webflow Host

**Test Type:** Webflow websites  
**Expected Behavior:** Webflow-specific extraction strategy

| Metric | Expected | Notes |
|--------|----------|-------|
| Host Detection | "Webflow" | Via generator meta, webflow.com scripts |
| Image Extraction | 10-15 images | Standard extraction usually works |
| Content Extraction | Standard | Clean semantic HTML |

**Detection Signals:**
- `<meta name="generator" content="Webflow">` → High confidence
- `.w-webflow-badge` present → High confidence
- Script includes `webflow.com/` → Medium confidence

**Test Status:** ✅ Implementation complete

---

### User Experience Validation

#### Before Host-Aware Implementation (Known Issues)

**Squarespace Issues:**
- ❌ Images using `data-src` were missed (showing `src` placeholder)
- ❌ Lazy-loaded images not triggered (page not scrolled)
- ❌ Some legitimate brand images filtered as "platform_logo" due to CDN URL
- ❌ Hero images missing or misclassified

**Impact:**
- Brand Guide showed fewer images
- Missing hero images led to less rich brand representation
- User had to manually upload images that should have been scraped

#### After Host-Aware Implementation (Fixed)

**Squarespace Improvements:**
- ✅ `data-src` and `data-image` attributes now checked
- ✅ Page scrolled before extraction to trigger lazy loading
- ✅ CDN images correctly classified based on size (large = hero/photo)
- ✅ Squarespace-specific logo selectors used

**Expected Impact:**
- Brand Guide now shows 10-15 relevant images (vs 2-5 before)
- Hero images correctly identified
- Logo detection improved
- User experience consistent across all CMS types

---

### Test URLs for Manual Verification

**Recommended Test Sites:**

| CMS | Sample URL | Expected Detection |
|-----|-----------|-------------------|
| Squarespace | [Any Squarespace site] | "Squarespace", high confidence |
| WordPress | [Any WordPress site] | "WordPress", high confidence |
| Wix | [Any Wix site] | "Wix", high confidence |
| Shopify | [Any Shopify store] | "Shopify", high confidence |
| Webflow | [Any Webflow site] | "Webflow", high confidence |
| Custom | [Any static HTML site] | "Unknown", low confidence |

---

### Automated Test Coverage

**Test File:** `server/__tests__/brand-crawler-host-aware.test.ts`

| Category | Tests | Coverage |
|----------|-------|----------|
| URL Pattern Detection | 9 | Squarespace, WordPress, Shopify, Wix, Webflow domains and CDNs |
| HTML Signature Detection | 7 | Generator meta tags, CSS selectors, class patterns |
| Combined Detection | 3 | Priority order, fallback behavior |
| Host Config Selection | 4 | Per-host extraction configs |
| Image URL Extraction | 10 | Squarespace data-src, WordPress lazy-src, generic srcset |
| Regression Protection | 5 | Ensures host detection and image extraction always return valid data |
| **Copy Extraction Config** | 6 | Host-specific hero/about/services selectors |
| **Copy Quality Constraints** | 11 | Whitespace normalization, max lengths, deduplication, exclusions |

**Total Tests:** 55 (host-aware) + 12 (Squarespace images) = **67 total**

**Run Tests:**
```bash
pnpm test server/__tests__/brand-crawler-host-aware.test.ts
```

### Copy Extraction Test Coverage

| Test | Description |
|------|-------------|
| All hosts have copy selectors | Verifies heroSelectors, aboutSelectors, servicesSelectors for all hosts |
| Squarespace-specific selectors | Verifies `.sqs-*` patterns for hero, about, services |
| WordPress-specific selectors | Verifies `.entry-*`, `.wp-block-*` patterns |
| Wix-specific selectors | Verifies `[data-testid]`, `[data-hook]` patterns |
| Unknown host fallback | Verifies generic `h1`, `main p` fallback selectors |
| Valid CSS selectors | Verifies all selectors are syntactically valid |
| Whitespace normalization | Collapses multiple spaces/newlines |
| Zero-width char removal | Strips `\u200B`, `\uFEFF` etc. |
| Hero max length (180) | Enforces hero headline limit |
| About max length (800) | Enforces about text limit |
| Service max length (120) | Enforces per-service limit |
| Services deduplication | Removes duplicate service names |
| Services count limit (10) | Max 10 services |

**CLI Testing Tool:** `server/scripts/scrape-url-host-aware.ts`

```bash
# Test a single URL
npx tsx server/scripts/scrape-url-host-aware.ts https://example.squarespace.com

# Test with verbose output
npx tsx server/scripts/scrape-url-host-aware.ts https://example.com --verbose

# JSON output for scripting
npx tsx server/scripts/scrape-url-host-aware.ts https://example.com --json
```

---

### Remaining Edge Cases / TODOs

1. **Ghost CMS** - Not yet supported (consider adding)
2. **Drupal** - Not yet supported (consider adding)
3. **Joomla** - Not yet supported (consider adding)
4. **Framer** - Not yet supported (consider adding)
5. **React SPA sites** - May need additional wait time for hydration
6. **Sites behind auth** - Not supported (by design)
7. **Sites blocking crawlers** - Graceful fallback to partial data

---

## Overall Test Summary

### Test Results

| Website | Status | Images | Colors | Content | OG Tags | Issues |
|---------|--------|--------|--------|---------|---------|--------|
| Website 1 | [Pass/Fail] | [X] | [X] | [Yes/No] | [Yes/No] | [None/List] |
| Website 2 | [Pass/Fail] | [X] | [X] | [Yes/No] | [Yes/No] | [None/List] |
| Website 3 | [Pass/Fail] | [X] | [X] | [Yes/No] | [Yes/No] | [None/List] |

### Overall Status

- [ ] **All tests passed** - Pipeline is production-ready
- [ ] **Some issues found** - See issues section below
- [ ] **Critical failures** - Pipeline needs fixes

### Issues Summary

**Critical Issues:**
- [None / List critical issues]

**Medium Issues:**
- [None / List medium issues]

**Minor Issues:**
- [None / List minor issues]

### Recommendations

1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]

---

## Next Steps

1. [ ] Fix any critical issues found
2. [ ] Re-test after fixes
3. [ ] Update documentation if needed
4. [ ] Deploy to production

---

**Test Complete:** [Yes/No]  
**Production Ready:** [Yes/No]  
**Signed Off By:** [Name/Date]

