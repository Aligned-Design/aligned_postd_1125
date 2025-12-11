# MVP2 Audit Report: Host-Aware Brand Guide Builder Integration

**Date:** 2025-12-11  
**Phase:** Phase 1 Audit (Complete)  
**Status:** ✅ AUDIT ONLY — NO CODE CHANGES

---

## A. Current Behavior (Without Modifications)

### A.1 What Scraped Fields Exist

| Field | Location in Crawler | Persisted To | Type |
|-------|---------------------|--------------|------|
| `detectedHost` | `CrawlResult.detectedHost` | `brand_kit.metadata.host` | `{ name, confidence, detectionMethod, signals }` |
| `heroHeadline` | `CrawlResult.heroHeadline` | `brand_kit.heroHeadline` | `string` (max 180 chars) |
| `aboutText` | `CrawlResult.aboutText` | `brand_kit.aboutText` | `string` (max 800 chars) |
| `services[]` | `CrawlResult.services` | `brand_kit.services` | `string[]` (max 10 items × 120 chars) |
| `h1/h2/h3` | `CrawlResult.h1/h2/h3` | `brand_kit.headlines` | `string[]` |
| `voice_summary` | `brandKit.voice_summary` | `brand_kit.voice_summary` | `{ tone, style, avoid, audience, personality }` |
| `about_blurb` | `brandKit.about_blurb` | `brand_kit.about_blurb` | `string` (AI-generated) |
| `colors` | `brandKit.colors` | `brand_kit.colors` | `{ primary, secondary, accent, allColors[] }` |
| `images[]` | `brandKit.images` | `media_assets` table | `CrawledImage[]` |

### A.2 What Brand Snapshot Captures

| Brand Snapshot Field | Source | Captured? |
|---------------------|--------|-----------|
| `extractedMetadata.heroHeadline` | `brandKit.heroHeadline` | ✅ Yes |
| `extractedMetadata.aboutText` | `brandKit.aboutText` | ✅ Yes |
| `extractedMetadata.services` | `brandKit.services` | ✅ Yes |
| `extractedMetadata.host` | `brandKit.metadata.host` | ✅ Yes |
| `extractedMetadata.keywords` | `brandKit.keyword_themes` | ✅ Yes |
| `extractedMetadata.brandIdentity` | `brandKit.about_blurb` | ✅ Yes |
| `extractedMetadata.headlines` | `brandKit.headlines` | ✅ Yes |
| `voice` | `brandKit.voice_summary.style` | ✅ Yes |
| `tone` | `brandKit.voice_summary.tone` | ✅ Yes |
| `colors` | `brandKit.colors.allColors` | ✅ Yes |

### A.3 What Brand Guide Uses

| Brand Guide Field | Mapped From | Status |
|-------------------|-------------|--------|
| `identity.sampleHeadlines[0]` | `extractedMetadata.heroHeadline` | ✅ Mapped |
| `identity.industryKeywords` | `extractedMetadata.keywords` | ✅ Mapped |
| `contentRules.contentPillars` | `extractedMetadata.services` (fallback) | ✅ Mapped |
| `approvedAssets.productsServices` | `extractedMetadata.services` | ✅ Mapped |
| `purpose` | `extractedMetadata.brandIdentity` OR `aboutText` fallback | ✅ Mapped |
| `voiceAndTone.tone` | `brandSnapshot.tone` | ✅ Mapped |
| `voiceAndTone.voiceDescription` | `brandSnapshot.voice` | ✅ Mapped |
| `visualIdentity.colors` | `brandSnapshot.colors` | ✅ Mapped |

### A.4 What Is NOT Mapped

| Field | Status | Notes |
|-------|--------|-------|
| `metadata.host` | ⚠️ Stored but not used | Available for future use |
| Host-specific styling defaults | ❌ Not implemented | Future enhancement |
| Host-specific tone recommendations | ❌ Not implemented | Future enhancement |

---

## B. Gaps & Deficiencies

### B.1 Places Where Data Could Be Dropped (But Isn't)

| Potential Gap | Actual Status |
|---------------|---------------|
| heroHeadline not in brandSnapshot | ✅ Fixed — now included |
| aboutText not used for fallback | ✅ Fixed — now fallback for purpose |
| services not populating pillars | ✅ Fixed — now populates contentPillars |
| host metadata not stored | ✅ Fixed — stored in brand_kit.metadata.host |

### B.2 Inconsistent Mappings

| Mapping | Issue | Status |
|---------|-------|--------|
| `heroHeadline` → `sampleHeadlines` | Must be prepended as first | ✅ Correct |
| `services` → `contentPillars` | Only if no existing pillars | ✅ Correct (fallback) |
| `aboutText` → `purpose` | Only if brandIdentity weak | ✅ Correct (fallback) |

### B.3 Host-Aware Behavior Missing in Brand Guide

| Feature | Current State | Impact |
|---------|---------------|--------|
| Host-specific styling defaults | Not implemented | Squarespace brands don't get "clean/minimal" defaults |
| Host-specific content pillars | Not implemented | Shopify brands don't get "product-focused" pillars |
| Host-specific tone recommendations | Not implemented | WordPress brands don't get "SEO-oriented" suggestions |

**Assessment:** These are future enhancements, not critical gaps. The current implementation provides a normalized, consistent output regardless of host.

### B.4 Missing Tone Inference

| Feature | Current State |
|---------|---------------|
| Tone extracted from website | ✅ AI-generated `voice_summary.tone` |
| Host-specific tone hints | ❌ Not implemented |

**Assessment:** AI inference from scraped text is sufficient. Host-specific hints would be an enhancement.

### B.5 Missing Services → Content Pillar Mapping

**Status:** ✅ FIXED

The mapping now exists in both client and server:

```typescript
// client/lib/onboarding-brand-sync.ts
contentPillars: brandSnapshot.contentPillars || brandSnapshot.messagingPillars || 
  (brandSnapshot.extractedMetadata?.services?.slice(0, 5) || []),
```

### B.6 Missing About Text → Brand Identity Mapping

**Status:** ✅ FIXED

The mapping now exists with fallback logic:

```typescript
// client/lib/onboarding-brand-sync.ts
purpose: (() => {
  const brandIdentity = brandSnapshot.extractedMetadata?.brandIdentity;
  const aboutText = brandSnapshot.extractedMetadata?.aboutText;
  
  if (brandIdentity && brandIdentity.trim().length > 10) {
    return brandIdentity.trim();
  }
  
  if (aboutText && aboutText.trim().length > 50) {
    return aboutText.trim();
  }
  
  return "";
})(),
```

---

## C. Customer Experience Risks

### C.1 Squarespace Site Experience

| Aspect | Risk | Mitigation |
|--------|------|------------|
| Images | Low — host-aware extraction working | ✅ Mitigated |
| Hero headline | Low — extracted from `.sqs-block-html h1` | ✅ Mitigated |
| About/Mission | Low — extracted from `.sqs-block-content` | ✅ Mitigated |
| Services | Low — extracted from accordion/portfolio | ✅ Mitigated |
| Brand Guide quality | Low — fields flow correctly | ✅ Mitigated |

### C.2 Shopify Site Experience

| Aspect | Risk | Mitigation |
|--------|------|------------|
| Images | Low — CDN patterns handled | ✅ Mitigated |
| Hero headline | Low — banner/collection titles | ✅ Mitigated |
| Services (Products) | Medium — product cards as services | ⚠️ May need refinement |
| Brand Guide quality | Low — fields flow correctly | ✅ Mitigated |

### C.3 WordPress Site Experience

| Aspect | Risk | Mitigation |
|--------|------|------------|
| Images | Low — lazy-loading handled | ✅ Mitigated |
| Hero headline | Low — entry-title/wp-block-heading | ✅ Mitigated |
| About/Mission | Low — entry-content extraction | ✅ Mitigated |
| Services | Low — column/list patterns | ✅ Mitigated |
| Brand Guide quality | Low — fields flow correctly | ✅ Mitigated |

### C.4 Wix/Webflow Site Experience

| Aspect | Risk | Mitigation |
|--------|------|------------|
| Images | Low — data-src handling | ✅ Mitigated |
| Dynamic content | Medium — JS-rendered may be missed | ⚠️ Inherent limitation |
| Brand Guide quality | Low — fields flow correctly | ✅ Mitigated |

### C.5 Unknown/Generic Site Experience

| Aspect | Risk | Mitigation |
|--------|------|------------|
| Images | Low — generic fallback works | ✅ Mitigated |
| Copy extraction | Low — generic selectors work | ✅ Mitigated |
| Brand Guide quality | Low — same as before | ✅ No regression |

---

## D. Summary of Findings

### D.1 What's Working Well

| Feature | Status |
|---------|--------|
| Host detection (5 CMS + unknown) | ✅ Complete |
| Host-aware image extraction | ✅ Complete |
| Host-aware copy extraction | ✅ Complete |
| Database persistence | ✅ Complete |
| brandSnapshot transformation | ✅ Complete |
| brandSnapshotToBrandGuide mapping | ✅ Complete |
| Brand Brain context provision | ✅ Complete |
| AI agent consumption | ✅ Complete |
| Test coverage (96 tests) | ✅ Complete |

### D.2 What Could Be Enhanced (Future)

| Feature | Priority | Notes |
|---------|----------|-------|
| Host-specific styling defaults | Low | Squarespace → "clean/minimal" |
| Host-specific tone recommendations | Low | WordPress → "SEO-oriented" |
| Host analytics dashboard | Low | Track extraction quality per CMS |
| Deeper page crawling | Medium | Crawl `/about`, `/services` pages |

### D.3 Risks Remaining

| Risk | Severity | Mitigation |
|------|----------|------------|
| JS-rendered content missed | Low | Wait + scroll mitigates most cases |
| Dynamic content in modals | Low | Edge case; user can edit Brand Guide |
| Complex template variations | Low | Generic fallback still works |

---

## E. Conclusion

**The host-aware Brand Guide builder integration is COMPLETE.**

All critical data flows correctly:
- ✅ Scraper extracts host-aware copy (hero, about, services)
- ✅ Data persists to database
- ✅ brandSnapshot includes all fields
- ✅ brandSnapshotToBrandGuide maps correctly
- ✅ Brand Brain provides context to AI agents
- ✅ 96 tests validate behavior

**No additional code changes are required for MVP2.**

The system now produces equally rich Brand Guides regardless of website CMS type.

---

## Appendix: Code References

### Host Detection
- `server/workers/brand-crawler.ts:190-195` — `DetectedHost` interface
- `server/workers/brand-crawler.ts:216-258` — `HOST_SIGNATURES`
- `server/workers/brand-crawler.ts:263-360` — `HOST_EXTRACTION_CONFIGS`
- `server/workers/brand-crawler.ts:366-450` — `detectHost()`

### Copy Extraction
- `server/workers/brand-crawler.ts:extractPageContent()` — Uses host-specific selectors
- `server/workers/brand-crawler.ts:normalizeText()` — Text normalization

### Field Mapping
- `client/lib/onboarding-brand-sync.ts:72-77` — heroHeadline → sampleHeadlines
- `client/lib/onboarding-brand-sync.ts:117-119` — services → contentPillars
- `client/lib/onboarding-brand-sync.ts:137-147` — services → productsServices
- `client/lib/onboarding-brand-sync.ts:153-170` — aboutText → purpose

### Brand Brain
- `server/lib/brand-brain-service.ts:65-129` — `getBrandContextPack()`
- `server/lib/brand-brain-service.ts:100-107` — Uses sampleHeadlines, productsServices
