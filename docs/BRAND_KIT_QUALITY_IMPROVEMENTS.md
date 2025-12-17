# Brand Kit Quality Improvements

**Commit SHA:** `caefd72`  
**Date:** December 17, 2025  
**Status:** ✅ Deployed to `main`

## 🎯 Problems Solved

### 1. ✅ Squarespace "0 images extracted" Problem

**Problem**: Crawler was detecting Squarespace sites but extracting 0-2 images because:
- CSS background images not captured
- Lazy-loaded images not triggered
- srcset parsing was rudimentary
- Data attributes not checked comprehensively

**Solution**: `server/workers/squarespace-image-extractor.ts`

**Features**:
- **CSS Background Detection**: Extracts from `.sqs-block`, `.image-block-wrapper`, `.content-fill`, `[data-block-type='5']`
- **Lazy-Loading Trigger**: Scrolls page in 5 steps to trigger Intersection Observer-based lazy loading
- **Enhanced Data Attributes**: Checks `data-src`, `data-image`, `data-image-resolution`, `data-original`, `data-lazy-src`
- **Better srcset**: Parses all variants and selects largest
- **Picture Elements**: Extracts from `<picture>` and `<source>` tags
- **Automatic Fallback**: Kicks in when `<5` images found + Squarespace detected

**Expected Result**: Sites like `sdirawealth.com` will now extract 3-10+ usable images instead of 0.

---

### 2. ✅ Brand Kit Versioning System

**Problem**: No version history, no rollback, unclear what changed, "pipeline outputs may not be saved" errors.

**Solution**: Complete versioning infrastructure

#### Database Schema
**File**: `supabase/migrations/20241217_brand_kit_versions.sql`

**Table**: `brand_kit_versions`
```sql
id                UUID PRIMARY KEY
brand_id          TEXT NOT NULL
tenant_id         UUID
version_number    INTEGER NOT NULL
brand_kit         JSONB NOT NULL
changed_fields    TEXT[] -- ['colors.primary', 'logos (added)']
change_summary    TEXT -- Human-readable
source            TEXT -- 'crawler', 'manual_edit', 'api_import', 'ai_refinement'
created_by        UUID
created_by_email  TEXT
created_at        TIMESTAMPTZ
crawl_run_id      UUID
validated         BOOLEAN DEFAULT FALSE
validated_at      TIMESTAMPTZ
validated_by      UUID
```

**Functions**:
- `get_next_brand_kit_version(brand_id)` → Returns next version number
- `get_active_brand_kit_version(brand_id)` → Returns latest validated (or latest)
- `compare_brand_kit_versions(old, new)` → Returns changed fields array

**Trigger**: Syncs latest version to `brands.brand_kit` automatically

#### Service Layer
**File**: `server/lib/brand-kit-service.ts`

**API**:
```typescript
// ✅ CANONICAL WRITE PATH (all brand kit saves MUST use this)
await saveBrandKit({
  brandId: string;
  tenantId?: string;
  brandKit: Record<string, any>;
  source: 'crawler' | 'manual_edit' | 'api_import' | 'ai_refinement' | 'onboarding';
  createdBy?: string;
  createdByEmail?: string;
  crawlRunId?: string;
  changeSummary?: string;
  autoValidate?: boolean; // Mark as confirmed
});

// Get versions
await getLatestVersion(brandId);
await getVersionHistory(brandId);
await getVersion(versionId);

// User actions
await validateVersion(versionId, userId);
await rollbackToVersion(brandId, targetVersionNumber, userId, email);

// Diffs
await getDiff(brandId, version1, version2);
```

**Change Detection**:
- Automatically detects added/modified/removed fields
- Generates human-readable summaries
- Tracks who changed what when

**Integration**:
- Crawler now saves via `saveBrandKit()` in `server/lib/crawler-job-service.ts`
- Stores result in both `crawl_runs.brand_kit` and `brand_kit_versions`
- Source = 'crawler', autoValidate = false (user should review)

---

## 📋 What's Next (Items 3-5)

### 3. ⏳ Review + Edit UI (Pending)

**Goal**: Let users confirm/correct crawler output before using it.

**Design**:
```
┌─ Brand Kit Review ────────────────────────────┐
│                                                │
│ Logos (2 found):                               │
│ ┌───┐ ┌───┐                                    │
│ │ ✓ │ │   │ [Replace] [Remove]                │
│ └───┘ └───┘                                    │
│                                                │
│ Colors (5 found):                              │
│ ● #FF5733  ● #33FF57  ● #3357FF [Edit]        │
│                                                │
│ Fonts:                                         │
│ Heading: Montserrat [Change]                   │
│ Body: Open Sans [Change]                       │
│                                                │
│ Voice & Tone:                                  │
│ Professional ●───────○───────● Casual          │
│ Formal       ●───────○───────● Friendly        │
│                                                │
│ [Save & Continue]  [Re-scan Website]           │
└────────────────────────────────────────────────┘
```

**API Endpoints to Add**:
- `GET /api/brands/:id/kit/review` → Returns unvalidated kit + suggestions
- `PATCH /api/brands/:id/kit/validate` → Marks version as validated
- `PUT /api/brands/:id/kit/logos/:logoId` → Replace specific logo
- `PUT /api/brands/:id/kit/colors` → Update color palette

**Success Criteria**: User can fix crawler mistakes in < 2 minutes.

---

### 4. ⏳ Gate Downstream on Validated Kit (Pending)

**Goal**: Never generate content with empty brand context.

**Implementation**:
```typescript
// In all AI generation endpoints (agents, content-plan, etc.)
async function requireValidatedBrandKit(brandId: string) {
  const version = await getLatestVersion(brandId);
  
  if (!version) {
    throw new AppError(
      ErrorCode.BRAND_KIT_MISSING,
      "Brand kit not found. Please complete brand setup.",
      400
    );
  }
  
  if (!version.validated) {
    throw new AppError(
      ErrorCode.BRAND_KIT_UNVALIDATED,
      "Brand kit requires review. Please review and validate your brand kit first.",
      400
    );
  }
  
  // Check for minimum required fields
  const { logos, colors, fonts, tone, industry } = version.brand_kit;
  if (!logos?.length || !colors?.primary || !tone) {
    throw new AppError(
      ErrorCode.BRAND_KIT_INCOMPLETE,
      "Brand kit is missing required fields. Please complete setup.",
      400
    );
  }
  
  return version.brand_kit;
}
```

**Files to Update**:
- `server/routes/agents.ts` (social, doc, design)
- `server/routes/content-plan.ts`
- `server/lib/brand-summary-generator.ts`
- `server/lib/auto-plan-generator.ts`

**UI Changes**:
- Show "Review Brand Kit" prompt before first generation
- Disable generation buttons until kit validated
- Show validation status badge in UI

**Success Criteria**: No AI generation runs without validated brand context.

---

### 5. ⏳ Production Hardening (Pending)

#### A. Rate Limiting
```typescript
// Per-tenant crawler rate limiting
const CRAWLER_LIMITS = {
  maxConcurrentPerTenant: 2,
  maxPerHour: 10,
  cooldownMinutes: 5,
};

// Implementation in server/lib/crawler-job-service.ts
async function checkRateLimit(tenantId: string): Promise<boolean> {
  const recentJobs = await supabase
    .from("crawl_runs")
    .select("created_at")
    .eq("tenant_id", tenantId)
    .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());
  
  if (recentJobs.data && recentJobs.data.length >= CRAWLER_LIMITS.maxPerHour) {
    throw new AppError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      `Crawler rate limit exceeded. Max ${CRAWLER_LIMITS.maxPerHour}/hour.`,
      429
    );
  }
  
  // Check concurrent
  const activeJobs = await supabase
    .from("crawl_runs")
    .select("id")
    .eq("tenant_id", tenantId)
    .in("status", ["pending", "processing"]);
  
  if (activeJobs.data && activeJobs.data.length >= CRAWLER_LIMITS.maxConcurrentPerTenant) {
    throw new AppError(
      ErrorCode.TOO_MANY_REQUESTS,
      `Too many crawls in progress. Max ${CRAWLER_LIMITS.maxConcurrentPerTenant} concurrent.`,
      429
    );
  }
  
  return true;
}
```

#### B. Concurrency Limits
```typescript
// Domain-level deduplication (already exists via lockKey)
// Tenant-level concurrency (add check above)
// Worker-level batch size limit (max 5 jobs per cron run)
```

#### C. Better Error UI
```typescript
// In Screen3AiScrape.tsx and brand-intake/page.tsx
if (crawlStatus.status === "failed") {
  return (
    <ErrorCard>
      <AlertCircle />
      <Title>Crawl Failed</Title>
      <Message>{crawlStatus.errorMessage || "Unknown error"}</Message>
      <ErrorCode>{crawlStatus.errorCode}</ErrorCode>
      <Actions>
        <Button onClick={retryWithSameUrl}>Retry</Button>
        <Button variant="secondary" onClick={tryDifferentUrl}>
          Try Different URL
        </Button>
      </Actions>
    </ErrorCard>
  );
}
```

#### D. Observability Dashboard
**New Route**: `GET /api/admin/crawler/metrics`

```typescript
interface CrawlerMetrics {
  last24Hours: {
    totalRuns: number;
    completed: number;
    failed: number;
    pending: number;
    processing: number;
    avgDurationMs: number;
    avgImagesExtracted: number;
    avgColorsExtracted: number;
  };
  topFailureReasons: Array<{
    errorCode: string;
    count: number;
    lastOccurred: string;
  }>;
  hostBreakdown: Array<{
    host: string; // 'squarespace', 'wordpress', etc.
    count: number;
    successRate: number;
  }>;
  slowestDomains: Array<{
    domain: string;
    avgDurationMs: number;
    count: number;
  }>;
}
```

**UI Component**: `client/components/admin/CrawlerDashboard.tsx`

---

## 🚀 Deployment Checklist

### Before Deploy
- [x] TypeScript passes
- [x] Build passes (1.25MB server bundle)
- [x] No linting errors
- [x] Committed and pushed (`caefd72`)

### After Deploy
- [ ] Apply migration: `supabase/migrations/20241217_brand_kit_versions.sql`
- [ ] Verify migration:
  ```sql
  SELECT COUNT(*) FROM brand_kit_versions; -- Should be 0 initially
  SELECT * FROM crawl_runs ORDER BY created_at DESC LIMIT 5;
  ```
- [ ] Test Squarespace site: Create brand with `https://sdirawealth.com`
- [ ] Verify images extracted > 0:
  ```sql
  SELECT 
    cr.id,
    cr.brand_id,
    cr.url,
    (cr.brand_kit->'images')::jsonb AS images,
    jsonb_array_length((cr.brand_kit->'images')::jsonb) AS image_count
  FROM crawl_runs cr
  WHERE cr.url LIKE '%sdirawealth%'
  ORDER BY cr.created_at DESC
  LIMIT 1;
  ```
- [ ] Check versioning:
  ```sql
  SELECT 
    version_number,
    source,
    changed_fields,
    validated,
    created_at
  FROM brand_kit_versions
  WHERE brand_id = '<BRAND_ID>'
  ORDER BY version_number DESC;
  ```

### Success Metrics
- **Squarespace Extraction**: `image_count >= 3` for test crawl
- **Versioning**: New entry in `brand_kit_versions` for each crawl
- **Change Detection**: `changed_fields` array populated
- **Source Tracking**: `source = 'crawler'`

---

##  Files Changed (5 files, +966 lines)

### New Files
1. `server/lib/brand-kit-service.ts` (286 lines)
   - Canonical write path for all brand kit saves
   - Version management, rollback, diffs

2. `server/workers/squarespace-image-extractor.ts` (322 lines)
   - Squarespace-specific image extraction
   - CSS backgrounds, lazy-loading, srcset

3. `supabase/migrations/20241217_brand_kit_versions.sql` (158 lines)
   - Versioning table + indexes
   - Helper functions + trigger

### Modified Files
4. `server/lib/crawler-job-service.ts` (+33 lines)
   - Integrated `saveBrandKit()` call
   - Saves version on every successful crawl

5. `server/workers/brand-crawler.ts` (+167 lines)
   - Squarespace fallback integration
   - Triggers when `<5` images found

---

## 🧪 Manual Testing Guide

### Test 1: Squarespace Image Extraction
```bash
# 1. Start dev server
pnpm dev

# 2. Create brand with Squarespace site
curl -X POST http://localhost:8080/api/crawl/start \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://sdirawealth.com",
    "brand_id": "test-brand-1"
  }'

# 3. Poll status
curl http://localhost:8080/api/crawl/status/<RUN_ID> \
  -H "Authorization: Bearer <TOKEN>"

# 4. Verify images extracted
# Should see brandKit.images array with 3-10+ images
```

### Test 2: Brand Kit Versioning
```sql
-- 1. Check version created
SELECT * FROM brand_kit_versions
WHERE brand_id = 'test-brand-1'
ORDER BY version_number DESC
LIMIT 1;

-- 2. Verify fields
-- version_number: 1
-- source: 'crawler'
-- validated: false
-- brand_kit: {...}
-- changed_fields: ['images (added)', 'colors (added)', ...]

-- 3. Test rollback (via API or direct SQL)
-- Should create version 2 with version 1's data
```

### Test 3: Version History
```typescript
// In your UI or API client
const history = await fetch('/api/brands/test-brand-1/kit/versions');
const versions = await history.json();

console.log(versions);
// Should show:
// [{
//   version_number: 1,
//   source: 'crawler',
//   change_summary: 'Initial brand kit created via crawler',
//   validated: false,
//   created_at: '2025-12-17T...'
// }]
```

---

## 📊 Expected Improvements

| Metric | Before | After | Goal |
|--------|--------|-------|------|
| Squarespace Images Extracted | 0-2 | 3-10+ | ✅ 3+ |
| Version History | ❌ None | ✅ Full audit trail | ✅ Complete |
| Rollback Capability | ❌ Manual | ✅ Automated | ✅ 1-click |
| Change Visibility | ❌ None | ✅ Field-level diff | ✅ Detailed |
| Brand Kit Source Tracking | ❌ Unknown | ✅ Recorded | ✅ Auditable |

---

## 🔗 Related Commits

- **Previous**: `8a36b1f` - Async crawler with canonical statuses
- **Current**: `caefd72` - Squarespace extraction + versioning
- **Next**: Items 3-5 (UI, gating, hardening)

---

## 💡 Notes for Next Session

1. **Test on Real Squarespace Site**: Priority is verifying `sdirawealth.com` extracts images
2. **Review UI is Critical**: Users won't trust AI if they can't fix mistakes
3. **Gating Prevents Bad Output**: Don't generate content until kit is validated
4. **Rate Limits Prevent Abuse**: Especially important for free tier
5. **Observability Enables Debugging**: Dashboard should show why crawls fail

**Recommendation**: Test items 1-2 in production, get user feedback, then tackle items 3-5.

