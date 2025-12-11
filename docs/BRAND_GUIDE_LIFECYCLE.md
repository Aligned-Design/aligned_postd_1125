# Brand Guide Lifecycle

> **Status:** ✅ Active  
> **Audience:** Engineering, Product, Success Team  
> **Last Updated:** December 2025

This document describes how the Brand Guide is created, structured, updated, and maintained throughout a client's lifecycle with POSTD.

---

## Terminology Alignment

The brand profile is referred to differently depending on context. All of these terms refer to **the same concept**:

| Context | Term to Use | Example |
|---------|-------------|---------|
| **User-Facing UI** | Brand Guide | "Review your Brand Guide" |
| **Marketing/Conceptual** | Brand Brain | "The AI-powered Brand Brain" |
| **Database/Technical** | `brand_kit` | `brands.brand_kit` JSONB column |
| **Code Variables** | `brandGuide` | `const { brandGuide } = useBrandGuide()` |

**Deprecated Terms (do not use):**
- ❌ "Brand Profile" — Ambiguous, could mean user profile
- ❌ "Brand Kit" in user-facing UI — Sounds like a downloadable asset pack

**Rule of Thumb:**
- Talking to clients → "Brand Guide"
- Writing marketing copy → "Brand Brain" (conceptual)
- Writing code → `brand_kit` or `brandGuide`

---

## Brand Guide Creation

### When It's Created

The Brand Guide is created during **onboarding Step 4-5** after the AI website scrape completes.

### How It's Created

1. **Website URL Submitted** (Step 2)
   - Client enters website URL in `Screen2BusinessEssentials.tsx`
   - URL stored in brand record

2. **AI Scrape Triggered** (Step 4)
   - `POST /api/crawl/start` called with `{ url, brand_id, sync: true }`
   - Backend crawler (`server/workers/brand-crawler.ts`) extracts:
     - **Images:** 10-15 brand images and logos
     - **Colors:** 6-color palette (3 primary + 3 secondary)
     - **Voice:** Tone analysis from website content
     - **Messaging:** Headlines, about text, services

3. **Brand Snapshot Created**
   - Scrape results converted to `brandSnapshot` object
   - Stored temporarily in onboarding state

4. **Brand Guide Saved** (Step 5)
   - Client reviews and optionally edits Brand Snapshot
   - `saveBrandGuideFromOnboarding()` called
   - Brand Guide saved to Supabase `brands.brand_kit` JSONB column

### Fallback Behavior

If the website scrape fails:
- User can proceed with manual Brand Guide creation
- Default values provided (generic professional tone)
- All fields editable in Brand Guide UI

---

## Brand Guide Structure

The Brand Guide is stored as a JSONB object in the `brands.brand_kit` column. Here is the canonical structure:

```typescript
interface BrandGuide {
  // Identity
  identity: {
    name: string;                    // Brand name
    businessType?: string;           // e.g., "coffee shop", "accountant"
    industryKeywords: string[];      // e.g., ["latte art", "community"]
    competitors?: string[];          // Competitor names to avoid
    targetAudience?: string;         // Audience description
  };

  // Voice & Tone
  voiceAndTone: {
    tone: string[];                  // e.g., ["Friendly", "Confident"]
    friendlinessLevel: number;       // 0-100
    formalityLevel: number;          // 0-100
    confidenceLevel: number;         // 0-100
    voiceDescription?: string;       // Prose description
    writingRules?: string[];         // Rules to follow
    avoidPhrases?: string[];         // Phrases to NEVER use
  };

  // Visual Identity
  visualIdentity: {
    colors: string[];                // Hex codes (e.g., ["#A76CF5", "#EC4899"])
    typography: {
      heading?: string;              // Heading font name
      body?: string;                 // Body font name
      source?: "google" | "custom";
    };
    photographyStyle: {
      mustInclude: string[];         // e.g., ["poured coffee only"]
      mustAvoid: string[];           // e.g., ["no stock photos of people"]
    };
    logoUrl?: string;                // Primary logo URL
    visualNotes?: string;
  };

  // Content Rules
  contentRules: {
    platformGuidelines?: Record<string, string>;  // Per-platform rules
    preferredPlatforms?: string[];   // e.g., ["instagram", "linkedin"]
    preferredPostTypes?: string[];   // e.g., ["carousel", "reel"]
    brandPhrases?: string[];         // Approved phrases
    formalityLevel?: "very_formal" | "formal" | "casual" | "very_casual";
    neverDo: string[];               // "Never do" rules
    guardrails?: Guardrail[];        // Structured guardrails
    contentPillars?: string[];       // Core content themes
  };

  // Approved Assets
  approvedAssets?: {
    uploadedPhotos?: MediaAsset[];
    uploadedGraphics?: MediaAsset[];
    uploadedTemplates?: Template[];
    approvedStockImages?: MediaAsset[];
    productsServices?: ProductService[];
  };

  // Performance Insights (populated over time)
  performanceInsights?: {
    visualPatterns?: Pattern[];
    copyPatterns?: Pattern[];
  };

  // Metadata
  longFormSummary?: string;          // 8-10 paragraph narrative summary
  summaryGeneratedAt?: string;       // When summary was generated
}
```

**For the authoritative schema, see:** `supabase/migrations/001_bootstrap_schema.sql`

---

## Who Can Edit

### Client (User)
**Can Edit:**
- All identity fields (name, business type, industry keywords)
- All voice & tone settings
- All visual identity (colors, fonts, photography style)
- All content rules
- Approved assets (upload/remove)

**How:** Brand Guide UI at `/brand-guide`

**When:** Any time after onboarding

### Success Team (Internal)
**Can Edit:**
- All fields (same as client)
- Can make edits on behalf of client during support calls

**How:** Direct database access or admin UI (if available)

**When:** During optimization calls, troubleshooting, or client requests

### System (AI/Automated)
**Can Edit:**
- `performanceInsights` — Updated based on content performance
- `longFormSummary` — Regenerated on demand
- `summaryGeneratedAt` — Timestamp updated

**How:** Background jobs and AI agents

**When:**
- After content publishes (performance data)
- When client clicks "Regenerate AI Snapshot"
- After significant Brand Guide changes

---

## When It Updates

### Real-Time Updates (User-Initiated)
- **Auto-save:** Brand Guide changes auto-save after 2-second debounce
- **Trigger:** User edits any field in Brand Guide UI
- **API:** `PATCH /api/brand-guide/:brandId`

### On-Demand Regeneration
- **Trigger:** User clicks "Regenerate AI Snapshot" button
- **API:** `POST /api/brand-guide/:brandId/generate`
- **What Updates:** AI-generated sections (voice summary, narrative summary)

### Scheduled/Background Updates
- **Performance Insights:** Updated when content analytics processed
- **Pattern Detection:** AI identifies successful patterns over time

---

## Brand Guide Health Indicators

A healthy Brand Guide should have:

| Field | Minimum Requirement | Ideal State |
|-------|---------------------|-------------|
| Name | Present | ✓ |
| Business Type | Present | ✓ |
| Colors | 2+ colors | 4-6 colors |
| Tone Keywords | 2+ keywords | 4-6 keywords |
| Voice Description | Present | 2+ sentences |
| Target Audience | Present | Specific persona |
| Logo | Present | High-res uploaded |
| Photography Style | At least 1 rule | 3+ rules |
| Content Pillars | At least 1 | 3-5 pillars |

### Brand Guide Completeness Score

Calculate completeness as percentage of fields filled:

```
Core Fields (Required):
- name ✓
- businessType ✓
- colors (≥2) ✓
- tone (≥2 keywords) ✓

Recommended Fields:
- logoUrl
- targetAudience
- voiceDescription
- photographyStyle.mustInclude (≥1)
- contentPillars (≥1)

Score = (Filled Fields / Total Fields) × 100
```

**Target:** ≥70% completeness for "Brand Guide Complete" status

---

## Regeneration / Refresh Process

### When to Regenerate

| Scenario | Action |
|----------|--------|
| Initial scrape produced poor results | Re-run scrape with different URL |
| Client rebranded | Manual update + regenerate AI sections |
| AI sections feel generic | Click "Regenerate AI Snapshot" |
| Performance data available | Refresh performance insights |

### How to Regenerate

**Full Re-Scrape:**
1. Navigate to Brand Guide
2. Click "Re-scan Website" (if available)
3. Wait for new scrape to complete
4. Review and merge with existing data

**AI Sections Only:**
1. Navigate to Brand Guide
2. Click "Regenerate AI Snapshot"
3. Wait 5-10 seconds
4. Review updated voice summary and narrative

**Manual Refresh:**
1. Edit fields directly in Brand Guide UI
2. Changes auto-save
3. AI agents use updated data immediately

---

## Integration with AI Agents

All AI agents read the Brand Guide before generating content:

### The Copywriter (`POST /api/ai/doc`)
**Uses:**
- `identity.businessType`, `industryKeywords`
- `voiceAndTone.tone`, `writingRules`, `avoidPhrases`
- `contentRules.neverDo`, `guardrails`
- `contentRules.formalityLevel`

**Produces:** On-brand captions, emails, blogs, carousels

### The Creative (`POST /api/ai/design`)
**Uses:**
- `visualIdentity.colors` — **MUST use ONLY these colors**
- `visualIdentity.typography` — **MUST use ONLY these fonts**
- `visualIdentity.photographyStyle` — **MUST follow these rules**
- `approvedAssets` — Prioritizes uploaded images

**Produces:** On-brand templates, graphics, visual content

### The Advisor (`POST /api/ai/advisor`)
**Uses:**
- `identity.businessType`, `industryKeywords`
- `contentRules.guardrails`
- `performanceInsights`
- `contentRules.preferredPlatforms`

**Produces:** Strategy recommendations, performance insights

---

## Best Practices

### For Clients

1. **Complete the basics first** — Name, colors, tone keywords
2. **Add photography rules** — Prevent off-brand images
3. **Define "never do" rules** — Prevent content mistakes
4. **Review AI-generated content** — Refine based on what feels off
5. **Update regularly** — Brand evolves, so should the Brand Guide

### For Success Team

1. **Check completeness score** — Ensure ≥70% before first publish
2. **Review photography style** — Biggest source of off-brand content
3. **Listen for client feedback** — "It doesn't sound like me" = voice update needed
4. **Schedule Brand Guide reviews** — At 30 days, 90 days, annually

### For Engineering

1. **Always use `getCurrentBrandGuide()`** — Never cache stale data
2. **Validate before save** — Use Zod schema validation
3. **Log completeness metrics** — Track health over time
4. **Handle missing fields gracefully** — Use sensible defaults

---

## Troubleshooting

### Brand Guide Not Loading
- Verify brand exists and user has access
- Check `brand_id` is valid UUID
- Verify RLS policies allow access

### AI Content Sounds Generic
- Check if Brand Guide has enough detail
- Verify tone keywords are specific (not just "professional")
- Add more context to voice description
- Add "never do" rules to exclude generic phrases

### Colors/Fonts Not Applying
- Verify Brand Guide has colors in correct hex format
- Check Creative Studio is loading Brand Guide (`useBrandGuide()`)
- Verify template is configured to use brand colors

### Photography Style Not Followed
- Ensure `photographyStyle.mustInclude` and `mustAvoid` are populated
- Check if image sourcing is respecting these rules
- Verify AI agents are passing photography style to image generation

---

## Related Documentation

- **[Onboarding Brand Guide Flow](ONBOARDING_BRAND_GUIDE_FLOW.md)** — Technical onboarding flow
- **[Crawler and Brand Summary](CRAWLER_AND_BRAND_SUMMARY.md)** — Crawler implementation details
- **[Client Onboarding Checklist](CLIENT_ONBOARDING_CHECKLIST.md)** — Brand Guide completion criteria
- **[POSTD Product Definition](POSTD_PRODUCT_DEFINITION_AND_GUARDRAILS.md)** — Brand Brain pillar definition
- **[AI Agents System Overview](AI_AGENTS_SYSTEM_OVERVIEW.md)** — How AI uses Brand Guide

---

**Last Updated:** December 2025  
**Owner:** Engineering & Product Teams

