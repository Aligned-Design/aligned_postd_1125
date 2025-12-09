# Brand Crawler - Complete Breakdown

**Last Updated:** 2025-01-27  
**Purpose:** Comprehensive explanation of how the POSTD brand crawler/scraper works

---

## 🎯 Overview

The brand crawler is a **Playwright-based web scraper** that extracts brand identity information from websites. It's used during onboarding when a user enters a website URL, and it automatically populates the Brand Guide with:

- **Logos** (from multiple sources: HTML, CSS, SVG, favicon, OG)
- **Brand images** (hero banners, photos, lifestyle images)
- **Color palette** (extracted from screenshots)
- **Typography** (fonts used on the site)
- **Voice/tone** (AI-generated from content)
- **Keywords & themes** (extracted from headings and content)
- **Open Graph metadata** (og:image, og:title, etc.)

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Entry Point & API](#entry-point--api)
3. [Crawling Process](#crawling-process)
4. [Content Extraction](#content-extraction)
5. [Logo Detection](#logo-detection)
6. [Image Classification](#image-classification)
7. [Color Extraction](#color-extraction)
8. [AI Generation](#ai-generation)
9. [Data Persistence](#data-persistence)
10. [Error Handling](#error-handling)

---

## 🏗️ Architecture Overview

### High-Level Flow

```
User enters URL
    ↓
POST /api/crawl/start
    ↓
crawlWebsite() - Playwright browser crawls site
    ↓
extractPageContent() - For each page:
    ├─ extractImages() - Multi-source logo/image extraction
    ├─ extractTypography() - Font detection
    ├─ extractOpenGraphMetadata() - OG tags
    └─ Extract text content (H1, H2, H3, body)
    ↓
extractColors() - Color palette from screenshots
    ↓
generateBrandKit() - AI generates voice/tone/keywords
    ↓
persistScrapedImages() - Save to media_assets table
    ↓
Return BrandKitData to client
```

### Key Files

- **`server/workers/brand-crawler.ts`** - Main crawler logic (2,849 lines)
- **`server/routes/crawler.ts`** - API endpoints (`/api/crawl/start`)
- **`server/lib/scraped-images-service.ts`** - Image persistence
- **`server/lib/media-db-service.ts`** - Database operations

---

## 🚀 Entry Point & API

### API Endpoint

**POST `/api/crawl/start`**

**Request:**
```typescript
{
  url: string,           // Website URL to crawl
  brand_id: string,      // Brand ID (can be temporary during onboarding)
  workspaceId: string,   // Workspace/tenant ID (required)
  sync?: boolean         // If true, wait for completion (default: true)
}
```

**Response:**
```typescript
{
  success: true,
  jobId: string,
  result: {
    brandKit: BrandKitData,
    crawlResults: CrawlResult[],
    colors: ColorPalette,
    images: CrawledImage[]
  }
}
```

### Route Handler Flow

```typescript
// server/routes/crawler.ts

1. Validate request (url, brand_id, workspaceId)
2. Check for duplicate concurrent crawls (in-memory lock)
3. Call runCrawlJobSync():
   a. crawlWebsite(url) → Returns CrawlResult[]
   b. extractColors(url) → Returns ColorPalette
   c. generateBrandKit(crawlResults, colors) → Returns BrandKitData
   d. persistScrapedImages(brandId, tenantId, images) → Saves to DB
4. Return result to client
```

---

## 🕷️ Crawling Process

### `crawlWebsite(startUrl: string)`

**Purpose:** Crawls a website using Playwright, respecting robots.txt and same-domain constraints.

**Configuration:**
- **Max pages:** 50 (configurable via `CRAWL_MAX_PAGES`)
- **Max depth:** 3 levels
- **Delay:** 1 second between requests
- **Timeout:** 60 seconds per page
- **User agent:** `POSTDBot/1.0`

**Algorithm:**
```typescript
1. Parse startUrl to get base domain
2. Fetch robots.txt and parse with robots-parser
3. Launch headless Chromium browser (Vercel-compatible)
4. Initialize queue: [{ url: startUrl, depth: 0 }]
5. While queue not empty AND pages < 50:
   a. Pop URL from queue
   b. Skip if already visited OR depth > 3
   c. Check robots.txt - skip if blocked
   d. Create new page, navigate with retry logic
   e. Extract content via extractPageContent()
   f. Find same-domain links, add to queue (depth + 1)
   g. Close page, wait 1 second
6. Close browser, return all CrawlResult[]
```

**Key Features:**
- ✅ Respects `robots.txt`
- ✅ Same-domain only (prevents crawling external sites)
- ✅ Breadth-first search with depth limit
- ✅ Retry logic with exponential backoff
- ✅ Graceful error handling (one page failure doesn't stop crawl)

---

## 📄 Content Extraction

### `extractPageContent(page: Page, url: string)`

**Extracts from each page:**

1. **Title** - `<title>` tag
2. **Meta description** - `<meta name="description">`
3. **Headings** - All H1, H2, H3 tags
4. **Body text** - Main content (excludes nav, footer, script, style)
5. **Images** - Via `extractImages()` (see below)
6. **Typography** - Via `extractTypography()` (computed font styles)
7. **Open Graph** - Via `extractOpenGraphMetadata()` (og: tags)

**Returns:**
```typescript
interface CrawlResult {
  url: string;
  title: string;
  metaDescription: string;
  h1: string[];
  h2: string[];
  h3: string[];
  bodyText: string;
  hash: string;              // MD5 hash for deduplication
  images?: CrawledImage[];
  headlines?: string[];
  typography?: TypographyData;
  openGraph?: OpenGraphMetadata;
}
```

---

## 🖼️ Logo Detection

### Multi-Source Logo Extraction

The crawler extracts logos from **5 different sources** (in priority order):

#### 1. **Inline SVG Logos** (Highest Priority)
- **Function:** `extractSvgLogos()`
- **Detects:** SVG elements in header/nav with logo indicators
- **Selectors:** `svg.logo`, `header svg`, `.site-title svg`, `use[href*='logo']`
- **Output:** Converts SVG to data URL for display
- **Why:** Modern sites (Squarespace, Webflow) often use inline SVG logos

#### 2. **CSS Background-Image Logos**
- **Function:** `extractCssLogos()`
- **Detects:** Logos rendered via CSS `background-image` or `mask-image`
- **Selectors:** `.header-logo`, `.site-logo`, `.logo-image`, `header [class*='logo']`
- **Method:** Checks computed styles from header/nav elements
- **Why:** Many platforms (Squarespace, Wix) use CSS for logos

#### 3. **HTML `<img>` Logos**
- **Function:** `extractImages()` (HTML extraction)
- **Detects:** Traditional `<img>` tags with logo indicators
- **Heuristics:** Filename/URL/alt text contains "logo", in header/nav, small size
- **Why:** Standard HTML logo implementation

#### 4. **OpenGraph Image** (Fallback)
- **Function:** `extractOgLogo()`
- **Detects:** `<meta property="og:image">` or `<meta name="twitter:image">`
- **When:** Only used if no other logos found
- **Why:** Some sites only have OG image, not explicit logo

#### 5. **Favicon** (Last Resort)
- **Function:** `extractFaviconLogos()`
- **Detects:** `<link rel="icon">`, `<link rel="mask-icon">`
- **When:** Only used if no other logos found
- **Why:** Fallback when no explicit logo exists

### Logo Merging

**Function:** `mergeLogoCandidates()`

**Priority Order:**
1. Inline SVG
2. CSS background-image
3. HTML `<img>` tags
4. OG image (only if no others)
5. Favicon (only if no others)

**Deduplication:** Removes duplicates by URL

---

## 🎨 Image Classification

### `categorizeImage()`

**Purpose:** Classifies each image into a role for filtering and prioritization.

**Roles:**
- `logo` - Brand logos (max 2 persisted)
- `hero` - Large banner/hero images
- `photo` - Real photos (brand, people, products)
- `team` - Team member photos
- `subject` - Product/service images
- `social_icon` - Social media icons (filtered out)
- `platform_logo` - Platform badges (filtered out)
- `other` - Everything else

### Classification Logic

**1. Social Icons (Filtered Out)**
```typescript
Patterns: "facebook", "instagram", "linkedin", "twitter", "tiktok", etc.
Check: filename, URL, alt text, pathname
Result: Returns "social_icon" → filtered out before persistence
```

**2. Platform Logos (Filtered Out)**
```typescript
Requires BOTH:
  - Vendor name: "squarespace", "wix", "godaddy", "canva", etc.
  - Logoish pattern: "logo", "badge", "icon", "powered-by", etc.
  
Exception: Large images (> 300x300) are NOT classified as platform_logo
  → Prevents legitimate brand images from Squarespace CDN from being filtered

Result: Returns "platform_logo" → filtered out before persistence
```

**3. Logo Detection**
```typescript
Checks:
  - Filename contains "logo" or brand name
  - URL path contains "/logo" or brand name
  - Alt text contains "logo" or brand name
  - Parent element has logo-related classes/IDs
  - In header/nav AND small size (< 400x400)

Result: Returns "logo"
```

**4. Hero Images**
```typescript
Checks:
  - Large size (> 600x400 OR > 400x600)
  - Near top of page (offsetTop < 2 * viewport height)
  - OR already marked as "hero" role

Result: Returns "hero"
```

**5. Team Images**
```typescript
Checks:
  - Page type is "team" or "about"
  - Alt text/URL contains: "team", "staff", "member", "founder", "ceo", etc.

Result: Returns "team"
```

**6. Photo/Content**
```typescript
Checks:
  - Large (> 300x300) or medium (> 200x200)
  - Not an icon or graphic
  - If very large (> 800x600) → "hero"
  - Otherwise → "photo"

Result: Returns "hero" or "photo"
```

**7. Default**
```typescript
Result: Returns "other"
```

---

## 🎨 Color Extraction

### `extractColors(url: string)`

**Purpose:** Extracts dominant colors from website screenshots.

**Method:**
1. Launch browser, navigate to URL
2. Take full-page screenshot
3. Use `node-vibrant` library to extract color palette
4. Returns up to 6 colors (3 primary, 3 secondary/accent)

**Returns:**
```typescript
interface ColorPalette {
  primary?: string;           // Hex color
  secondary?: string;         // Hex color
  accent?: string;            // Hex color
  confidence: number;          // 0-1 confidence score
  primaryColors?: string[];   // Up to 3 primary colors
  secondaryColors?: string[]; // Up to 3 secondary/accent colors
  allColors?: string[];       // All 6 colors combined
}
```

---

## 🤖 AI Generation

### `generateBrandKit(crawlResults, colors, url, brandName, industry)`

**Purpose:** Uses AI (OpenAI/Claude) to generate brand voice, tone, and keywords from scraped content.

**Input:**
- All `CrawlResult[]` (text content from all pages)
- `ColorPalette` (extracted colors)
- Website URL
- Brand name (extracted from URL)
- Industry (inferred from content)

**AI Prompts:**
- Analyzes all text content (headings, body, meta descriptions)
- Identifies tone keywords (professional, friendly, bold, etc.)
- Generates writing style summary
- Extracts keyword themes
- Creates "about blurb" summary

**Returns:**
```typescript
interface BrandKitData {
  voice_summary: {
    tone: string[];        // ["professional", "friendly"]
    style: string;         // "conversational"
    avoid: string[];       // ["jargon", "slang"]
    audience: string;      // "small business owners"
    personality: string[];  // ["trustworthy", "innovative"]
  };
  keyword_themes: string[]; // ["sustainability", "innovation"]
  about_blurb: string;      // AI-generated brand description
  colors: ColorPalette;
  typography?: TypographyData;
  source_urls: string[];    // URLs crawled
  metadata?: {
    openGraph?: OpenGraphMetadata;
  };
}
```

---

## 💾 Data Persistence

### Image Persistence

**Function:** `persistScrapedImages(brandId, tenantId, images)`

**Process:**
1. **Filter** - Remove `social_icon` and `platform_logo` images
2. **Separate** - Split into logos (max 2) and brand images (max 15)
3. **Sort** - Prioritize by:
   - Logos: PNG preferred, larger resolution, brand name in filename
   - Brand images: Hero first, then larger photos
4. **Persist** - Save to `media_assets` table:
   ```sql
   INSERT INTO media_assets (
     brand_id, tenant_id, path, filename, category,
     size_bytes, mimetype, metadata, status
   ) VALUES (
     brandId, tenantId, imageUrl, filename, 'logos' | 'images',
     0, 'image/jpeg', { source: 'scrape', role: 'logo' }, 'active'
   )
   ```

**Special Handling:**
- **Scraped images** (`fileSize === 0 && path.startsWith("http")`) skip storage quota checks
- **Error handling:** Individual image failures don't abort the batch
- **Deduplication:** Checks for existing assets by URL hash

### Brand Kit Persistence

**Function:** `saveBrandGuideFromOnboarding()`

**Process:**
1. Saves `BrandKitData` to `brands.brand_kit` JSONB field
2. Updates color palette in `brands.brand_kit.colors`
3. Stores typography in `brands.brand_kit.typography`
4. Links to scraped images via `media_assets` table

---

## ⚠️ Error Handling

### Retry Logic

**Function:** `retryWithBackoff(fn, maxRetries, delayMs)`

- **Max retries:** 3 attempts
- **Delay:** Exponential backoff (1s, 2s, 4s)
- **Used for:** Browser launch, page navigation, AI generation

### Graceful Degradation

- **Page load failure:** Logs warning, continues to next page
- **Image extraction failure:** Returns empty array, continues crawl
- **Color extraction failure:** Returns default palette, continues
- **AI generation failure:** Returns fallback brand kit, continues
- **Storage quota error:** Logs warning, continues (scraped images bypass quota)

### Logging

**Debug Flags:**
- `DEBUG_LOGO_DETECT=true` - Logs logo detection details
- `DEBUG_SQUARESPACE_IMAGES=true` - Logs Squarespace CDN image classification
- `DEBUG_IMAGE_CLASSIFICATION=true` - Logs image categorization

**Log Levels:**
- `console.log()` - Normal flow (crawl progress, extraction summary)
- `console.warn()` - Non-critical errors (page load failure, quota warnings)
- `console.error()` - Critical errors (browser launch failure, fatal errors)

---

## 🔧 Configuration

### Environment Variables

```bash
# Crawler limits
CRAWL_MAX_PAGES=50              # Max pages to crawl
CRAWL_TIMEOUT_MS=60000          # Page load timeout (ms)
CRAWL_USER_AGENT=POSTDBot/1.0   # User agent string

# Browser
VERCEL=true                      # Auto-detected if on Vercel
AWS_LAMBDA_FUNCTION_NAME=...     # Auto-detected if on Lambda

# AI
OPENAI_API_KEY=...               # For AI generation (optional)
ANTHROPIC_API_KEY=...            # Alternative AI provider

# Debug
DEBUG_LOGO_DETECT=true           # Enable logo detection logging
DEBUG_SQUARESPACE_IMAGES=true    # Enable Squarespace image logging
DEBUG_IMAGE_CLASSIFICATION=true  # Enable image classification logging
```

### Constants

```typescript
MAX_DEPTH = 3                    // Max crawl depth
CRAWL_DELAY_MS = 1000            // Delay between requests (1s)
MAX_RETRIES = 3                  // Max retry attempts
RETRY_DELAY_MS = 1000            // Initial retry delay
```

---

## 📊 Data Flow Example

### Example: Crawling `https://806marketing.com`

```
1. POST /api/crawl/start
   {
     url: "https://806marketing.com",
     brand_id: "brand_1234567890",
     workspaceId: "uuid-here"
   }

2. crawlWebsite() starts:
   - Fetches robots.txt
   - Launches browser
   - Queue: [{ url: "https://806marketing.com", depth: 0 }]

3. Page 1: Homepage
   - Navigate to URL
   - extractPageContent():
     * Title: "806 Marketing | Digital Marketing Agency"
     * H1: ["We Help Brands Grow"]
     * Images: 15 found
       - 2 logos (HTML <img>)
       - 3 hero images
       - 10 photos
   - Find links: /about, /services, /contact
   - Add to queue: [{ url: "/about", depth: 1 }, ...]

4. Page 2: /about
   - Navigate to /about
   - extractPageContent():
     * H1: ["About Us"]
     * Images: 8 found (team photos)
   - Continue...

5. After all pages crawled:
   - extractColors() → Extracts color palette
   - generateBrandKit() → AI generates voice/tone
   - persistScrapedImages() → Saves 2 logos + 10 brand images

6. Return result:
   {
     brandKit: { ... },
     images: [...],
     colors: { ... }
   }
```

---

## 🎯 Key Features

### ✅ What It Does Well

1. **Multi-source logo detection** - Finds logos from CSS, SVG, HTML, OG, favicon
2. **Smart filtering** - Filters out social icons and platform logos
3. **Platform-aware** - Handles Squarespace, Webflow, Wix, Shopify correctly
4. **Respectful crawling** - Honors robots.txt, same-domain only, rate-limited
5. **Robust error handling** - One failure doesn't break entire crawl
6. **AI-powered** - Generates voice/tone from content automatically

### ⚠️ Limitations

1. **Same-domain only** - Won't crawl external links
2. **Max 50 pages** - Large sites may not be fully crawled
3. **Depth limit 3** - Deep site structures may be incomplete
4. **No JavaScript execution** - Some dynamic content may be missed
5. **In-memory deduplication** - Not shared across serverless instances

---

## 🔍 Debugging

### Enable Debug Logging

```bash
DEBUG_LOGO_DETECT=true \
DEBUG_SQUARESPACE_IMAGES=true \
DEBUG_IMAGE_CLASSIFICATION=true \
pnpm dev
```

### Common Issues

**Issue:** "No logos found"
- **Check:** Are logos rendered via CSS/SVG? Enable `DEBUG_LOGO_DETECT`
- **Check:** Are images being filtered as `platform_logo`? Check classification logs

**Issue:** "All images filtered out"
- **Check:** Are images from platform CDN being misclassified? Check `DEBUG_SQUARESPACE_IMAGES`
- **Check:** Are social icons being detected? Check role breakdown in logs

**Issue:** "Crawl times out"
- **Check:** Is site slow? Increase `CRAWL_TIMEOUT_MS`
- **Check:** Too many pages? Reduce `CRAWL_MAX_PAGES`

---

## 📚 Related Documentation

- `docs/MVP_BRAND_CRAWLER_LOGOS_AND_IMAGES_AUDIT.md` - Logo/image pipeline audit
- `docs/API_SURFACE_MAP.md` - API endpoints documentation
- `server/routes/crawler.ts` - API route implementation
- `server/lib/scraped-images-service.ts` - Image persistence logic

---

**Questions?** Check the code comments in `server/workers/brand-crawler.ts` for detailed implementation notes.

