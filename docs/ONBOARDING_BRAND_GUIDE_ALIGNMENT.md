# Onboarding & Brand Guide Alignment Analysis

**Date**: 2025-01-16  
**Status**: 🔄 **IN PROGRESS**

---

## Overview

This document identifies gaps between what's collected during onboarding and what the Brand Guide expects, ensuring complete alignment.

---

## Current Onboarding Flow

### Screen 2: Business Essentials
**Collects:**
- ✅ Website URL (required)
- ✅ Business Type (required) → maps to `identity.businessType`
- ⚠️ Description (optional) → partially used

### Screen 3: AI Scrape
**Collects (via scraping):**
- ✅ Colors → maps to `visualIdentity.colors`
- ✅ Fonts → maps to `visualIdentity.typography`
- ✅ Logo → maps to `visualIdentity.logoUrl`
- ✅ Images → maps to `approvedAssets.uploadedPhotos`
- ✅ Headlines/About text → maps to `identity` and `voiceAndTone.voiceDescription`
- ✅ Tone → maps to `voiceAndTone.tone`
- ⚠️ Keywords → maps to `identity.industryKeywords`

### Screen 3: Brand Intake (Alternative/Manual)
**Collects:**
- ✅ Brand Name → maps to `identity.name` and `brandName`
- ✅ Business Description → maps to `voiceAndTone.voiceDescription`
- ✅ Tone (array) → maps to `voiceAndTone.tone`
- ✅ Audience → maps to legacy `targetAudience`
- ✅ Goal → maps to legacy `mission`
- ✅ Colors (array) → maps to `visualIdentity.colors`
- ✅ Logo → maps to `visualIdentity.logoUrl`

### Screen 5: Brand Summary Review
**Allows editing:**
- ✅ Tone → `voiceAndTone.tone`
- ✅ Keywords → `identity.industryKeywords`
- ✅ Brand Identity → `purpose`
- ✅ Colors → `visualIdentity.colors`

---

## Brand Guide Required Fields

### ✅ Fully Covered
- `identity.name` ✅
- `identity.businessType` ✅
- `identity.industryKeywords` ✅ (from scraping or manual)
- `voiceAndTone.tone` ✅
- `voiceAndTone.voiceDescription` ✅
- `visualIdentity.colors` ✅
- `visualIdentity.logoUrl` ✅
- `visualIdentity.typography` ✅ (from scraping)

### ⚠️ Partially Covered
- `voiceAndTone.friendlinessLevel` ⚠️ (defaults to 50, not asked)
- `voiceAndTone.formalityLevel` ⚠️ (defaults to 50, not asked)
- `voiceAndTone.confidenceLevel` ⚠️ (defaults to 50, not asked)
- `voiceAndTone.writingRules` ⚠️ (empty array, not asked)
- `voiceAndTone.avoidPhrases` ⚠️ (from scraping `donts`, but not explicitly asked)
- `visualIdentity.photographyStyle.mustInclude` ⚠️ (empty array, not asked)
- `visualIdentity.photographyStyle.mustAvoid` ⚠️ (empty array, not asked)
- `contentRules.preferredPlatforms` ⚠️ (empty array, not asked)
- `contentRules.preferredPostTypes` ⚠️ (empty array, not asked)
- `contentRules.formalityLevel` ⚠️ (not asked, defaults to undefined)
- `contentRules.neverDo` ⚠️ (from scraping `donts`, but not explicitly asked)
- `contentRules.guardrails` ⚠️ (empty array, not asked)

### ❌ Missing
- `identity.competitors` ❌ (not asked)
- `contentRules.brandPhrases` ❌ (not asked)
- `contentRules.platformGuidelines` ❌ (not asked)

---

## Recommended Changes

### Option 1: Add Questions to Onboarding (Comprehensive)
Add a new screen or expand existing screens to ask:
1. **Photography Style Rules** (Screen 3 or 5)
   - "What images MUST we include?" → `visualIdentity.photographyStyle.mustInclude`
   - "What images MUST we avoid?" → `visualIdentity.photographyStyle.mustAvoid`
   - Example: "Only use poured coffee, no espresso shots" / "No stock photos of people"

2. **Preferred Platforms** (Screen 3 or 5)
   - Multi-select: Instagram, Facebook, LinkedIn, TikTok, Twitter/X
   - → `contentRules.preferredPlatforms`

3. **Preferred Post Types** (Screen 3 or 5)
   - Multi-select: Carousel, Reel, Story, Feed Post, LinkedIn Post
   - → `contentRules.preferredPostTypes`

4. **Voice & Tone Levels** (Screen 3 or 5)
   - Sliders for: Friendliness (0-100), Formality (0-100), Confidence (0-100)
   - → `voiceAndTone.friendlinessLevel`, `formalityLevel`, `confidenceLevel`

5. **Writing Rules** (Screen 3 or 5)
   - Text area: "Any specific writing rules or guidelines?"
   - → `voiceAndTone.writingRules`

6. **Avoid Phrases** (Screen 3 or 5)
   - Text area: "Phrases or words to NEVER use?"
   - → `voiceAndTone.avoidPhrases`

7. **Competitors** (Screen 3 or 5)
   - Text area: "Competitor names to avoid referencing?"
   - → `identity.competitors`

8. **Formality Level** (Screen 3 or 5)
   - Dropdown: Very Formal, Formal, Casual, Very Casual
   - → `contentRules.formalityLevel`

### Option 2: Smart Defaults + Post-Onboarding Collection (Minimal)
Keep onboarding minimal, but:
1. Use AI to infer missing fields from scraped data
2. Add a "Complete Your Brand Guide" step after onboarding
3. Show empty states in Brand Guide page prompting user to fill gaps

### Option 3: Hybrid Approach (Recommended)
1. **Onboarding**: Ask critical fields (photography rules, preferred platforms, avoid phrases)
2. **Post-Onboarding**: Show "Complete Your Brand Guide" prompt with remaining fields
3. **Brand Guide Page**: Allow editing all fields at any time

---

## Implementation Plan

### Phase 1: Update Mapping Functions
- ✅ Update `brandSnapshotToBrandGuide()` to handle all Brand Guide fields
- ✅ Ensure defaults are sensible for missing fields
- ✅ Map scraped `donts` to both `voiceAndTone.avoidPhrases` and `contentRules.neverDo`

### Phase 2: Add Missing Questions (Hybrid)
- Add photography style rules question to Screen 3 or 5
- Add preferred platforms question to Screen 3 or 5
- Add avoid phrases question to Screen 3 or 5
- Keep other fields as optional/post-onboarding

### Phase 3: Update Brand Guide Generation
- Ensure `/api/ai/brand-guide/generate` uses all onboarding data
- Infer missing fields from context when possible
- Set sensible defaults for uncollected fields

---

## Current Mapping Issues

### Issue 1: `brandSnapshotToBrandGuide()` Uses Old Structure
**Problem**: The function in `client/lib/onboarding-brand-sync.ts` still uses old flat structure instead of new nested Brand Guide structure.

**Fix**: Update to use new nested structure (`identity`, `voiceAndTone`, `visualIdentity`, `contentRules`).

### Issue 2: Photography Style Rules Not Collected
**Problem**: Brand Guide expects `photographyStyle.mustInclude` and `mustAvoid`, but onboarding doesn't ask for these.

**Fix**: Add question to Screen 3 or 5, or infer from scraped data.

### Issue 3: Preferred Platforms/Post Types Not Collected
**Problem**: Brand Guide expects `preferredPlatforms` and `preferredPostTypes`, but onboarding doesn't ask.

**Fix**: Add multi-select questions to Screen 3 or 5.

### Issue 4: Voice & Tone Levels Default to 50
**Problem**: All voice levels default to 50, not reflecting actual brand voice.

**Fix**: Add sliders to Screen 3 or 5, or infer from tone keywords.

---

## Next Steps

1. ✅ Update `brandSnapshotToBrandGuide()` to use new nested structure
2. ⏳ Add photography style rules question to onboarding
3. ⏳ Add preferred platforms/post types questions
4. ⏳ Add avoid phrases question
5. ⏳ Update Brand Guide generation endpoint to use all collected data
6. ⏳ Test end-to-end flow: Onboarding → Brand Guide → AI Agents

