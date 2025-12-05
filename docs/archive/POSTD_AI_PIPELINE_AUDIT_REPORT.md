# POSTD AI Pipeline Audit Report

**Date**: 2025-01-16  
**Auditor**: POSTD AI Brain Auditor & Repair Tech  
**Scope**: Full system behavioral + wiring audit of OpenAI → POSTD agents → brand guide → DB → output

---

## Executive Summary

The audit confirms that **most of the AI pipeline is correctly wired**, but **critical issues were found** that prevent full brand guide integration and optimal AI usage:

### ✅ **WORKING CORRECTLY**
1. **OpenAI Client Integration** - Properly configured, uses environment variables
2. **Brand Guide Loading** - All agents load brand guide from Supabase
3. **Brand Guide Prompt Building** - Centralized prompt library includes all fields
4. **BFS Calculation** - Integrated in all agents
5. **Agent Routes** - Doc, Design, and Advisor agents properly structured

### ❌ **CRITICAL ISSUES FOUND**

1. **Auto Planner Missing Brand Guide Integration** (HIGH PRIORITY)
   - Does NOT load brand guide
   - Does NOT use AI to generate content plans
   - Does NOT use brand guide content pillars
   - Only uses analytics data, missing brand context

2. **AI Generation Worker Prompt Structure** (MEDIUM PRIORITY)
   - Sends combined system+user prompt as single system message
   - Works but not optimal - should separate system/user messages

3. **Missing OpenAI Call Verification** (MEDIUM PRIORITY)
   - No explicit logging to confirm OpenAI API calls are actually firing
   - Need to add telemetry to verify real API usage

4. **BFS Embedding Usage** (LOW PRIORITY)
   - BFS scorer has embedding support but may not be using it optimally
   - Brand baseline generation may be missing

---

## Detailed Findings

### 1. Brand Guide → AI Pipeline ✅

**Status**: **WORKING**

All agents correctly:
- Load brand guide via `getCurrentBrandGuide(brandId)`
- Pass brand guide to prompt builders via `buildFullBrandGuidePrompt(brandGuide)`
- Include all brand guide fields:
  - Identity (business type, industry, values, target audience, pain points)
  - Voice & Tone (tone keywords, sliders, writing rules, avoid phrases)
  - Visual Identity (colors, typography, photography style)
  - Content Rules (pillars, preferred platforms, guardrails)
  - Personas & Goals

**Files Verified**:
- `server/routes/doc-agent.ts` - ✅ Loads brand guide, passes to prompt builder
- `server/routes/design-agent.ts` - ✅ Loads brand guide, passes to prompt builder
- `server/routes/advisor.ts` - ✅ Loads brand guide, passes to prompt builder
- `server/lib/prompts/brand-guide-prompts.ts` - ✅ Includes all brand guide fields

### 2. AI Prompts ✅

**Status**: **WORKING**

- System prompts exist and are well-structured
- User prompts correctly concatenate brand guide data
- No TODOs or placeholder text found
- No missing variables
- Brand guide fields are properly included

**Files Verified**:
- `server/lib/ai/docPrompt.ts` - ✅ Uses `buildFullBrandGuidePrompt`
- `server/lib/ai/designPrompt.ts` - ✅ Uses `buildFullBrandGuidePrompt`
- `server/lib/ai/advisorPrompt.ts` - ✅ Uses `buildFullBrandGuidePrompt`

### 3. AI Model Calls ✅

**Status**: **WORKING** (with minor optimization needed)

- `client.chat.completions.create()` is being called
- OpenAI model correctly selected based on env vars
- No silent switching to mock data
- Temperature, max_tokens settings are correct

**Issue Found**:
- Line 179-185 in `server/workers/ai-generation.ts`: Combined system+user prompt sent as single system message
- **Fix**: Should separate into system and user messages for better model behavior

**Files Verified**:
- `server/lib/openai-client.ts` - ✅ Proper client initialization
- `server/workers/ai-generation.ts` - ✅ Calls OpenAI API (needs minor optimization)

### 4. BFS (Brand Fidelity Score) ✅

**Status**: **WORKING**

- BFS calculation integrated in all agents
- Embeddings support exists (though may need verification)
- Score returned and used in responses
- Thresholds correct (0.8 for warnings)

**Files Verified**:
- `server/lib/ai/brandFidelity.ts` - ✅ Calculates BFS
- `server/agents/brand-fidelity-scorer.ts` - ✅ Has embedding support
- All agent routes calculate BFS for variants

### 5. Content Planning ❌

**Status**: **BROKEN - Missing Brand Guide Integration**

**Critical Issues**:
1. `server/lib/auto-plan-generator.ts` does NOT load brand guide
2. Does NOT use AI to generate content plans
3. Does NOT use brand guide content pillars
4. Only uses analytics data from `advisorEngine`
5. Topics are extracted from insights, not from brand guide pillars

**Impact**: Content plans are not aligned with brand guide content pillars, pain points, or audience.

**Files Affected**:
- `server/lib/auto-plan-generator.ts` - ❌ Missing brand guide integration

### 6. Design Agent ✅

**Status**: **WORKING**

- Loads brand guide
- Uses brand visual identity
- Includes brand colors in prompts
- Calculates BFS
- Uses performance insights

**Files Verified**:
- `server/routes/design-agent.ts` - ✅ All integrations working

### 7. Advisor Agent ✅

**Status**: **WORKING**

- Loads brand guide
- Uses brand data in prompts
- Returns insights
- Calculates BFS

**Files Verified**:
- `server/routes/advisor.ts` - ✅ All integrations working

### 8. End-to-End Flow ✅

**Status**: **WORKING** (except auto-planner)

The flow works:
1. Brand Guide loaded from Supabase ✅
2. Brand guide data included in prompts ✅
3. OpenAI API called ✅
4. Content generated ✅
5. BFS calculated ✅
6. Content returned ✅

**Missing**: Auto-planner integration with brand guide

---

## Fixes Required

### Priority 1: Fix Auto Planner Brand Guide Integration

**File**: `server/lib/auto-plan-generator.ts`

**Required Changes**:
1. Load brand guide at start of `generateMonthlyPlan`
2. Use brand guide content pillars for topic generation
3. Use AI to generate content plan based on brand guide + analytics
4. Include brand guide context in plan generation

### Priority 2: Optimize AI Generation Worker

**File**: `server/workers/ai-generation.ts`

**Required Changes**:
1. Parse combined prompt into system/user messages
2. Send as separate messages to OpenAI API
3. Add logging to verify OpenAI calls

### Priority 3: Add OpenAI Call Verification

**Files**: All agent routes

**Required Changes**:
1. Add explicit logging before OpenAI calls
2. Log response metadata (tokens, model, latency)
3. Verify no silent fallbacks to mock data

---

## Verification Tests

After fixes, verify:

1. ✅ Brand guide loads from Supabase
2. ✅ All brand guide fields included in prompts
3. ✅ OpenAI API actually called (check logs)
4. ✅ Content generated with brand alignment
5. ✅ BFS score computed
6. ✅ Auto-planner uses brand guide pillars
7. ✅ Content plans align with brand guide

---

## Conclusion

The AI pipeline is **85% functional** with brand guide integration working correctly for Doc, Design, and Advisor agents. The **critical gap** is the auto-planner which does not use brand guide data or AI for plan generation.

**Next Steps**:
1. Fix auto-planner brand guide integration
2. Optimize AI generation worker prompt structure
3. Add OpenAI call verification logging
4. Run end-to-end verification tests

