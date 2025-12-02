# Crawler and Brand Summary Documentation

**Status:** ✅ **CANONICAL** - Authoritative documentation for brand intake and crawler functionality  
**Last Updated:** 2025-01-20

## Overview

The crawler extracts brand assets (images, colors, content) from websites during onboarding, and the brand summary generator creates a long-form narrative summary (8-10 paragraphs) using the Doc Agent.

## Crawler Output

### Images (10-15 max)

The crawler extracts and persists up to **15 images** per brand:

1. **Image Extraction** (`server/workers/brand-crawler.ts`):
   - Extracts images from `<img>` tags and CSS background images
   - Detects role: `logo`, `hero`, or `other`
   - Filters out:
     - Images smaller than 100x100 pixels (likely icons)
     - Placeholder images (URL contains "placeholder")
     - Data URIs (usually icons)
   - Sorts by relevance: logos first, then heroes, then by size
   - Limits to 15 images max

2. **Image Persistence** (`server/lib/scraped-images-service.ts`):
   - Stores images in `media_assets` table with `source='scrape'`
   - Tags with `brand_id`, `tenant_id`, `category` (logos/images/graphics)
   - Metadata includes: `source`, `width`, `height`, `alt`, `role`, `scrapedUrl`, `scrapedAt`
   - Enforces 15-image limit at persistence layer

3. **Where Images Are Used**:
   - Brand Guide UI displays scraped images
   - Creative Studio can use scraped images for content creation
   - Brand Snapshot shows scraped images during onboarding

### Colors (6-Color Palette)

The crawler extracts a **6-color palette** (3 primary + 3 secondary/accent):

1. **Color Extraction** (`server/workers/brand-crawler.ts`):
   - Uses `node-vibrant` to extract colors from website screenshots
   - Extracts up to 6 distinct colors:
     - **Primary colors** (up to 3): Most dominant colors (Vibrant, Muted, DarkVibrant)
     - **Secondary/accent colors** (up to 3): Supporting colors (LightVibrant, LightMuted, DarkMuted)
   - Normalizes to hex format (ensures `#` prefix)
   - **No fallback**: If extraction fails, throws error (no mock colors)

2. **Color Storage** (`server/routes/crawler.ts`):
   - Stores in `brand_kit.colors` with structure:
     ```json
     {
       "primary": "#FF0000",
       "secondary": "#00FF00",
       "accent": "#0000FF",
       "confidence": 0.85,
       "primaryColors": ["#FF0000", "#00FF00", "#0000FF"],
       "secondaryColors": ["#FFFF00", "#FF00FF", "#00FFFF"],
       "allColors": ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF"]
     }
     ```
   - If fewer than 6 colors are available, returns what's real (no generic fill)

3. **Where Colors Are Used**:
   - Brand Guide displays color palette
   - Creative Studio uses colors for design generation
   - Brand Snapshot shows color palette during onboarding

## Brand Summary Generation

### Overview

After a successful crawl + brand guide sync, the system automatically generates a **long-form narrative brand summary** (8-10 paragraphs) using the Doc Agent.

### Generation Process

1. **Trigger** (`server/lib/onboarding-orchestrator.ts`):
   - Runs as Step 5 in the onboarding workflow (after crawl, brand guide, strategy, sample content)
   - Can be triggered manually via `POST /api/orchestration/workspace/:workspaceId/run-agents`

2. **Data Collection** (`server/lib/brand-summary-generator.ts`):
   - Fetches brand core info (name, website URL)
   - Loads brand guide (tone, audience, values, positioning)
   - Gets scraped content (headlines, about text, services, key sections)
   - Retrieves scraped images metadata (alt text, roles)

3. **AI Generation**:
   - Uses Doc Agent (OpenAI/Claude) with custom prompt
   - Prompt includes:
     - Brand facts (never to be contradicted)
     - Scraped text excerpts (headlines, about text, services)
     - Visual cues from images (alt text, roles)
     - Brand guide data (tone, audience, values, visual identity)
   - Instructions: Write 8-10 paragraphs covering:
     1. Who the brand is + what they do
     2. Who they serve (primary audience)
     3. Personality + tone of voice
     4. Visual identity (colors, imagery style)
     5. Key services/products and positioning
     6. Brand promises, values, and differentiators
     7. Overall customer experience / brand story
     8. Calls-to-action, offers, or funnels

4. **Storage**:
   - Stores in `brand_kit.longFormSummary` (Supabase `brands.brand_kit` JSONB field)
   - Also updates `brand_kit.summaryGeneratedAt` timestamp
   - Idempotent: Can be regenerated (overwrites existing summary)

### Summary Structure

- **Length**: 8-10 paragraphs (not bullet points)
- **Voice**: Neutral but warm and professional
- **Content**: Grounded in scraped data + brand guide (no generic boilerplate)
- **Format**: Plain text, paragraphs separated by double newlines

### Where Summary Is Used

- **Brand Snapshot** (`client/pages/onboarding/Screen5BrandSummaryReview.tsx`): Displays summary during onboarding
- **Brand Guide** (`client/app/(postd)/brand-guide/page.tsx`): Shows summary in Brand Guide UI
- **Brand Snapshot Step**: New section shows the narrative summary

## No Mocks / Fallbacks

**Critical**: The system does **not** use fallback/mock data for:
- Colors: If extraction fails, returns error (no default purple/gray)
- Images: If crawl fails, returns error (no placeholder images)
- Summary: If generation fails, returns error (no generic boilerplate)

If the crawl fails, the UI should show a clear error state instead of fake data.

## API Endpoints

### Crawler

- `POST /api/crawl/start` - Start crawl (sync or async mode)
  - Body: `{ url, brand_id, workspace_id, sync: true }`
  - Returns: `{ success: true, brandKit: {...}, status: "completed" }`

### Brand Summary

- **Automatic**: Triggered during onboarding workflow
- **Manual**: `POST /api/orchestration/workspace/:workspaceId/run-agents`
  - Body: `{ brandId: string, regenerate?: boolean }`
  - Triggers full onboarding workflow including brand summary generation

### Brand Guide

- `GET /api/brand-guide/:brandId` - Get brand guide (includes `longFormSummary` if available)
  - Returns: `{ success: true, brandGuide: {...}, hasBrandGuide: true }`

## Database Schema

### `brands` table

- `brand_kit` (JSONB): Contains:
  - `colors`: 6-color palette structure
  - `images`: Array of scraped image URLs/metadata
  - `longFormSummary`: Generated narrative summary (8-10 paragraphs)
  - `summaryGeneratedAt`: Timestamp when summary was generated

### `media_assets` table

- `source`: `'scrape'` for scraped images
- `metadata`: Contains `role` (`logo`/`hero`/`other`), `alt`, `scrapedUrl`, `scrapedAt`

## Testing

See `server/__tests__/crawler-improvements.test.ts` for:
- Image limit tests (max 15)
- 6-color palette extraction tests
- Brand summary generation tests

## Troubleshooting

### Images Not Persisting

- Check `tenantId` is provided and is a valid UUID
- Verify `media_assets` table exists and has correct schema
- Check logs for `[ScrapedImages]` messages

### Colors Not Extracting

- Verify `node-vibrant` is installed
- Check website is accessible and renders correctly
- Review error logs for color extraction failures

### Summary Not Generating

- Verify AI API keys are configured (`OPENAI_API_KEY` or `ANTHROPIC_API_KEY`)
- Check brand guide exists and has content
- Review logs for `[BrandSummary]` messages
- Ensure crawl completed successfully before summary generation

