# MVP2 Implementation Notes: Host-Aware Brand Guide Builder Integration

**Date:** 2025-12-11  
**Phase:** Phase 1 Audit (Complete)  
**Status:** ✅ AUDIT ONLY — Design Plan Only, No Code Changes

---

## Host-Aware Brand Guide Integration — Design Plan

This section describes WHAT the system should support, NOT HOW it should be implemented in code.

---

### 1. How Scraped Fields Should Inform Brand Guide Identity

#### 1.1 Hero Headline → Positioning / Identity Headline

| Scraped Field | Brand Guide Target | Mapping Logic |
|---------------|-------------------|---------------|
| `heroHeadline` | `identity.sampleHeadlines[0]` | Prepend as first sample headline |
| `heroHeadline` | `positioning.tagline` (via Brand Brain) | Used in Brand Context Pack |

**Rationale:** The hero headline is the brand's primary value proposition from their website. It should be the first sample headline AI agents see.

**Current Status:** ✅ Implemented

#### 1.2 About Text → Mission / Story / Values

| Scraped Field | Brand Guide Target | Mapping Logic |
|---------------|-------------------|---------------|
| `aboutText` | `purpose` | Use as fallback if AI-generated `brandIdentity` is weak (<100 chars) |
| `aboutText` | Available in extractedMetadata | Stored for reference |

**Rationale:** `aboutText` is raw extracted content. `about_blurb` (brandIdentity) is AI-polished. If AI generation fails, use raw. If both exist, AI wins but raw is available.

**Current Status:** ✅ Implemented

#### 1.3 Services → Offerings & Content Pillars

| Scraped Field | Brand Guide Target | Mapping Logic |
|---------------|-------------------|---------------|
| `services[]` | `contentRules.contentPillars` | Add as candidate pillars (if no existing pillars) |
| `services[]` | `approvedAssets.productsServices` | Store as offerings list |
| `services[]` | `offers` (via Brand Brain) | Available in Brand Context Pack |

**Rationale:** Services extracted from accordion titles, product cards, or portfolio items represent what the brand actually offers. These should inform content pillars and be visible to AI agents.

**Current Status:** ✅ Implemented

#### 1.4 Tone Cues → Voice Sliders & Profile

| Scraped Field | Brand Guide Target | Mapping Logic |
|---------------|-------------------|---------------|
| `voice_summary.tone` | `voiceAndTone.tone` | Direct mapping |
| `voice_summary.style` | `voiceAndTone.voiceDescription` | Direct mapping |
| `voice_summary.avoid` | `voiceAndTone.avoidPhrases` | Direct mapping |

**Current Status:** ✅ Already implemented (no changes needed)

---

### 2. How Host Metadata Should Influence Defaults

#### 2.1 Current State

Host metadata (`metadata.host`) is:
- ✅ Extracted in crawler
- ✅ Persisted to `brand_kit.metadata.host`
- ⚠️ Not used to influence Brand Guide defaults

#### 2.2 Potential Future Enhancements

| Host | Suggested Defaults | Use Case |
|------|-------------------|----------|
| `squarespace` | `visualNotes: "Clean, modern, minimal aesthetic"` | Design-forward sensibility |
| `shopify` | `contentPillars: ["Product highlights", "Customer reviews"]` | E-commerce focus |
| `wordpress` | `writingRules: ["SEO-optimized headlines", "Long-form content"]` | Blog/SEO focus |
| `webflow` | `visualNotes: "Design-forward, custom typography"` | Design agency style |
| `wix` | `visualNotes: "Template-based, vibrant colors"` | SMB-friendly |
| `unknown` | No special defaults | Generic heuristics |

#### 2.3 Implementation Decision

**MVP2 Decision:** Do NOT auto-apply host-specific defaults.

**Rationale:**
- Host metadata is stored for observability and future use
- Generic extraction produces consistent output across all hosts
- User can always edit Brand Guide manually
- Avoids over-engineering for edge cases

**Future Enhancement:** If analytics show host-specific quality gaps, consider adding defaults.

---

### 3. What Fields Should Produce Tone Insights

#### 3.1 Current Tone Sources

| Source | Field | Status |
|--------|-------|--------|
| AI-extracted tone | `voice_summary.tone[]` | ✅ Working |
| AI-extracted style | `voice_summary.style` | ✅ Working |
| AI-extracted personality | `voice_summary.personality[]` | ✅ Working |
| Avoid phrases | `voice_summary.avoid[]` | ✅ Working |

#### 3.2 Additional Tone Sources (Potential)

| Source | Potential Insight | Status |
|--------|-------------------|--------|
| `heroHeadline` length/style | Concise vs. elaborate | Not implemented |
| `aboutText` formality | Formal vs. casual | Not implemented |
| Host type | Platform-typical tone | Not implemented |

**Assessment:** Current AI-based tone extraction is sufficient. Additional sources are enhancements.

---

### 4. How Services Should Become Content Pillars

#### 4.1 Current Mapping

```
services[] (scraped)
    ↓
extractedMetadata.services (in brandSnapshot)
    ↓
contentRules.contentPillars (if empty) + approvedAssets.productsServices
    ↓
Brand Brain → offers[] + contentPillars[]
    ↓
AI Agents receive services as context
```

#### 4.2 Mapping Rules

| Rule | Logic |
|------|-------|
| Max pillars from services | 5 (slice) |
| Prefer existing pillars | Yes — services only used if no user-defined pillars |
| All services to productsServices | Yes — no limit |
| Deduplication | Applied at extraction time |

**Current Status:** ✅ Implemented

---

### 5. What Overrides Should Exist to Prevent Low-Quality Data

#### 5.1 Quality Constraints (Implemented)

| Field | Max Length | Min Length | Notes |
|-------|------------|------------|-------|
| `heroHeadline` | 180 chars | 3 chars | Whitespace normalized |
| `aboutText` | 800 chars | 50 chars | Multi-paragraph combined |
| `services[n]` | 120 chars | 2 chars | Max 10 items, deduped |

#### 5.2 Copy Exclusions (Implemented)

| Host | Excluded Selectors |
|------|-------------------|
| Squarespace | `.sqs-cookie-banner`, `.sqs-announcement-bar` |
| WordPress | `.sidebar`, `.comment-form`, `#secondary` |
| Wix | `[data-testid='WixAdsDesktopRoot']` |
| Shopify | `.announcement-bar` |
| Webflow | `.w-webflow-badge` |

#### 5.3 Fallback Behavior

| Scenario | Fallback |
|----------|----------|
| No heroHeadline | Use first H1 from generic extraction |
| No aboutText | Use AI-generated about_blurb |
| No services | contentPillars empty (user fills in) |
| Unknown host | Generic selectors |

---

### 6. What Tests the Final Implementation Must Satisfy

#### 6.1 Current Test Coverage

| Test File | Count | Status |
|-----------|-------|--------|
| `brand-crawler-host-aware.test.ts` | 55 | ✅ Pass |
| `scraped-images-squarespace.test.ts` | 12 | ✅ Pass |
| `brand-guide-host-aware.test.ts` | 15 | ✅ Pass |
| `brand-guide-completeness.test.ts` | 14 | ✅ Pass |
| **Total** | **96** | ✅ All Pass |

#### 6.2 Test Categories

| Category | Coverage |
|----------|----------|
| Host detection (URL/meta/HTML) | ✅ 19 tests |
| Host config selection | ✅ 4 tests |
| Image URL extraction | ✅ 10 tests |
| Regression protection | ✅ 5 tests |
| Copy extraction config | ✅ 6 tests |
| Copy quality constraints | ✅ 11 tests |
| Brand Guide field mapping | ✅ 15 tests |
| Brand Guide validation | ✅ 14 tests |

---

### 7. UX Considerations for Stable Output Across All CMS Types

#### 7.1 Consistency Guarantees

| Aspect | Guarantee |
|--------|-----------|
| Field structure | Same for all hosts |
| Data types | Same for all hosts |
| Fallback behavior | Defined for all fields |
| Error handling | Graceful degradation |

#### 7.2 User Experience

| UX Aspect | Behavior |
|-----------|----------|
| Brand Snapshot | Looks the same regardless of CMS |
| Brand Guide | Same sections regardless of CMS |
| AI agent output | Same quality regardless of CMS |
| Editing | All fields editable by user |

#### 7.3 What Users DON'T See

| Hidden Detail | Reason |
|---------------|--------|
| Host detection result | Not useful for non-technical users |
| Extraction method | Implementation detail |
| Fallback status | Transparent to user |

---

## Implementation Checklist (Already Complete)

### Phase 1: Screen3AiScrape.tsx ✅
- [x] Add `heroHeadline` to `brandSnapshot.extractedMetadata`
- [x] Add `aboutText` to `brandSnapshot.extractedMetadata`
- [x] Add `services` to `brandSnapshot.extractedMetadata`
- [x] Add `metadata.host` to `brandSnapshot.extractedMetadata`

### Phase 2: brandSnapshotToBrandGuide() ✅
- [x] Map `heroHeadline` → `identity.sampleHeadlines[0]`
- [x] Map `aboutText` → enrich `purpose` if needed
- [x] Map `services` → `contentRules.contentPillars` AND `approvedAssets.productsServices`
- [x] Host metadata passed through for observability

### Phase 3: Tests ✅
- [x] Add test for heroHeadline mapping (3 tests)
- [x] Add test for services → contentPillars (3 tests)
- [x] Add test for services → productsServices (2 tests)
- [x] Add test for aboutText fallback (4 tests)
- [x] Add regression tests for generic snapshots (2 tests)
- [x] Add full integration scenario test (1 test)

**Total tests added: 15**

---

## Risk Assessment

| Risk | Status | Mitigation |
|------|--------|------------|
| Breaking existing brands | ✅ Mitigated | All changes are additive |
| Empty fields | ✅ Mitigated | Graceful fallback to empty arrays |
| Type mismatches | ✅ Mitigated | Use existing interfaces |
| Performance | ✅ Mitigated | Minimal — just mapping |

---

## Success Criteria (All Met)

| Criterion | Status |
|-----------|--------|
| `heroHeadline` appears in `identity.sampleHeadlines` | ✅ |
| `services` populate `contentRules.contentPillars` (if empty) | ✅ |
| `services` populate `approvedAssets.productsServices` | ✅ |
| `aboutText` is available for enrichment | ✅ |
| Host metadata is stored for observability | ✅ |
| Generic sites work exactly as before | ✅ |
| All existing tests pass | ✅ |
| Brand Brain provides enriched context | ✅ |

---

## Conclusion

**MVP2 is complete.** The Brand Guide builder now:
- ✅ Receives all host-aware scraped data
- ✅ Maps fields correctly to Brand Guide structure
- ✅ Provides enriched context to AI agents via Brand Brain
- ✅ Produces consistent output regardless of CMS type
- ✅ Has comprehensive test coverage (96 tests)

No additional implementation is required.
