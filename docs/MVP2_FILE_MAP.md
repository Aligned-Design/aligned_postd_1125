# MVP2 File Map: Host-Aware Brand Guide Builder Integration

**Date:** 2025-12-11  
**Updated:** Phase 1 Audit Complete  
**Purpose:** Complete file inventory for Brand Guide building with host-aware data flow

---

## Overview

MVP2 ensures host-aware scraped data (`heroHeadline`, `aboutText`, `services`, `metadata.host`) flows correctly through the Brand Guide Builder pipeline and is consumed by AI agents.

---

## 1. Scraper & Host-Aware Extraction

### Core Crawler

| File | Role | Host-Aware Fields |
|------|------|-------------------|
| `server/workers/brand-crawler.ts` | Main crawler implementation | ✅ `detectHost()`, `extractImages()`, `extractPageContent()` |
| `server/routes/crawler.ts` | API endpoints for crawler | ✅ Persists `heroHeadline`, `aboutText`, `services`, `metadata.host` |

### Host Detection System

| Component | Location | Status |
|-----------|----------|--------|
| `DetectedHost` interface | `brand-crawler.ts:190-195` | ✅ Defined |
| `HOST_SIGNATURES` | `brand-crawler.ts:216-258` | ✅ Squarespace, Wix, WordPress, Webflow, Shopify |
| `HOST_EXTRACTION_CONFIGS` | `brand-crawler.ts:263-360` | ✅ Per-host copy/image selectors |
| `detectHost()` | `brand-crawler.ts:366-450` | ✅ Multi-method detection |

### Image Persistence

| File | Role | Status |
|------|------|--------|
| `server/lib/scraped-images-service.ts` | Image persistence to `media_assets` | ✅ Working |
| `server/lib/media-db-service.ts` | Low-level DB operations | ✅ Working |

---

## 2. Brand Snapshot Transformation

### Client-Side (Onboarding Flow)

| File | Role | Host-Aware Fields Used |
|------|------|------------------------|
| `client/pages/onboarding/Screen3AiScrape.tsx` | Transforms `brandKit` → `brandSnapshot` | ✅ Includes `heroHeadline`, `aboutText`, `services`, `host` in `extractedMetadata` |
| `client/lib/onboarding-brand-sync.ts` | `brandSnapshotToBrandGuide()` | ✅ Maps host-aware fields to BrandGuide |

### Server-Side

| File | Role | Host-Aware Fields Used |
|------|------|------------------------|
| `server/lib/brand-guide-sync.ts` | Server-side `brandSnapshotToBrandGuide()` | ✅ Maps host-aware fields to BrandGuide |

---

## 3. Brand Guide Storage & Retrieval

| File | Role | Status |
|------|------|--------|
| `server/lib/brand-guide-service.ts` | Central Brand Guide service | ✅ `getCurrentBrandGuide()`, `saveBrandGuide()` |
| `server/routes/brand-guide.ts` | API endpoints `/api/brand-guide/:brandId` | ✅ Working |
| `server/lib/brand-guide-validation.ts` | Validates Brand Guide structure | ✅ Working |
| `server/lib/brand-guide-version-history.ts` | Version tracking | ✅ Working |

---

## 4. AI Agents (Brand Guide Consumers)

### Agent Files

| File | Role | Uses Brand Guide? |
|------|------|-------------------|
| `server/lib/copy-agent.ts` | Copy generation | ✅ Via Brand Brain |
| `server/lib/creative-agent.ts` | Design concept generation | ✅ Via CollaborationContext |
| `server/lib/advisor-engine.ts` | Analytics insights | ⚠️ Uses metrics, not Brand Guide |
| `server/lib/brand-brain-service.ts` | Central brand context provider | ✅ Provides `BrandContextPack` |

### Brand Brain Integration

| Field | Brand Guide Source | Brand Context Pack Field | Status |
|-------|-------------------|--------------------------|--------|
| Hero headline | `identity.sampleHeadlines[0]` | `positioning.tagline` | ✅ Flows |
| Content pillars | `contentRules.contentPillars` | `contentPillars` | ✅ Flows |
| Services | `approvedAssets.productsServices` | `offers` | ✅ Flows |
| Voice/Tone | `voiceAndTone.*` | `voiceRules` | ✅ Flows |

---

## 5. Prompts & AI Configuration

| File | Role | Uses Scraped Data? |
|------|------|-------------------|
| `server/lib/prompts/brand-guide-prompts.ts` | Brand Guide generation prompts | ⚠️ Generic prompts |
| `server/lib/brand-summary-generator.ts` | Brand summary AI generation | ✅ Uses `aboutText`, `services`, `headlines` |
| `server/lib/ai/docPrompt.ts` | Doc generation prompts | ⚠️ Generic prompts |
| `server/lib/ai/advisorPrompt.ts` | Advisor prompts | ⚠️ Generic prompts |

---

## 6. Host-Aware Field Flow

### Complete Field Trace

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     HOST-AWARE DATA FLOW                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Crawler (brand-crawler.ts)                                              │
│    ├── detectHost() → { name: "squarespace", confidence: "high" }       │
│    ├── extractPageContent() → heroHeadline, aboutText, services[]       │
│    └── Returns CrawlResult with detectedHost + copy fields              │
│                                                                          │
│  crawler.ts API Route                                                    │
│    ├── Persists to brands.brand_kit JSONB:                              │
│    │   ├── brand_kit.heroHeadline                                       │
│    │   ├── brand_kit.aboutText                                          │
│    │   ├── brand_kit.services[]                                         │
│    │   └── brand_kit.metadata.host                                      │
│    └── Returns brandKit to client                                       │
│                                                                          │
│  Screen3AiScrape.tsx                                                     │
│    ├── Reads brandKit from API response                                 │
│    └── Builds brandSnapshot.extractedMetadata:                          │
│        ├── heroHeadline                                                 │
│        ├── aboutText                                                    │
│        ├── services[]                                                   │
│        └── host                                                         │
│                                                                          │
│  brandSnapshotToBrandGuide() [client + server]                          │
│    ├── heroHeadline → identity.sampleHeadlines[0]                       │
│    ├── services → contentRules.contentPillars (if empty)                │
│    ├── services → approvedAssets.productsServices                       │
│    └── aboutText → purpose (fallback if brandIdentity weak)             │
│                                                                          │
│  Brand Guide (brands.brand_kit)                                         │
│    ├── identity.sampleHeadlines[]                                       │
│    ├── contentRules.contentPillars[]                                    │
│    ├── approvedAssets.productsServices[]                                │
│    └── purpose                                                          │
│                                                                          │
│  Brand Brain Service                                                     │
│    ├── getBrandContextPack() reads from Brand Guide:                    │
│    │   ├── positioning.tagline = sampleHeadlines[0]                     │
│    │   ├── offers = productsServices.map(p => p.name)                   │
│    │   └── contentPillars = preferences.contentPillars                  │
│    └── Provides context to Copy Agent, Creative Agent                   │
│                                                                          │
│  AI Agents                                                               │
│    ├── Copy Agent → Uses BrandContextPack for generation                │
│    └── Creative Agent → Uses CollaborationContext with brand colors     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Test Files

| File | Coverage | Status |
|------|----------|--------|
| `server/__tests__/brand-crawler-host-aware.test.ts` | Host detection + image extraction | ✅ 55 tests |
| `server/__tests__/scraped-images-squarespace.test.ts` | Squarespace image classification | ✅ 12 tests |
| `server/__tests__/brand-guide-host-aware.test.ts` | Brand Guide field mapping | ✅ 15 tests |
| `server/__tests__/brand-guide-completeness.test.ts` | Brand Guide validation | ✅ 14 tests |

**Total: 96 tests passing**

---

## 8. Documentation

| File | Purpose | Status |
|------|---------|--------|
| `docs/MVP1_FILE_MAP.md` | Scraper pipeline map | ✅ Complete |
| `docs/MVP1_AUDIT_REPORT.md` | Scraper audit with host-aware sections | ✅ Complete |
| `docs/MVP1_IMPLEMENTATION_NOTES.md` | Scraper implementation notes | ✅ Complete |
| `docs/MVP1_TEST_RESULTS.md` | Scraper test results | ✅ Complete |
| `docs/MVP2_FILE_MAP.md` | Brand Guide builder map | ✅ This file |
| `docs/MVP2_AUDIT_REPORT.md` | Brand Guide audit | 🔄 In progress |
| `docs/MVP2_IMPLEMENTATION_NOTES.md` | Brand Guide implementation notes | ✅ Complete |
| `docs/MVP2_TEST_RESULTS.md` | Brand Guide test results | ✅ Complete |

---

## 9. Files NOT Modified (Correctly Excluded)

| File | Reason |
|------|--------|
| `shared/brand-guide.ts` | Existing interface works; fields map correctly |
| `server/lib/agent-preflight.ts` | Already uses Brand Brain service |
| AI prompts | Generic prompts work with existing Brand Context |

---

## 10. Summary

### What's Implemented

| Feature | Status |
|---------|--------|
| Host detection | ✅ 5 CMS + unknown fallback |
| Host-aware image extraction | ✅ Per-host data attributes |
| Host-aware copy extraction | ✅ Hero, about, services |
| Database persistence | ✅ All fields in brand_kit JSONB |
| brandSnapshot includes host fields | ✅ extractedMetadata updated |
| brandSnapshotToBrandGuide mapping | ✅ Client + server |
| Brand Brain uses host-aware fields | ✅ Via Brand Guide |
| Tests | ✅ 96 tests passing |

### What's NOT Implemented (By Design)

| Feature | Reason |
|---------|--------|
| Host-specific styling defaults | Future enhancement |
| Host metadata in AI prompts | Not needed; Brand Context sufficient |
| Host analytics dashboard | Future enhancement |
