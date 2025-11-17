# Phase 6 - Doc & Design Agents Integration Report

## Implementation Summary

Phase 6 successfully integrates Doc and Design AI agents into the Creative Studio with Brand Fidelity Score (BFS) and compliance guardrails, reusing patterns from Phase 5.

---

## ✅ Phase 6A: Shared AI Content Types

**Files Created:**
- `shared/aiContent.ts` - Shared types between client and server
- `client/lib/types/aiContent.ts` - Client-side types (mirrors shared)

**Types Defined:**
- `AiContentStatus` - "draft" | "approved" | "needs_review"
- `AiDocVariant` - Text content variant with BFS and compliance tags
- `AiDesignVariant` - Visual concept variant with BFS and compliance tags
- `AiDocGenerationRequest` - Request payload for Doc Agent
- `AiDesignGenerationRequest` - Request payload for Design Agent
- `AiDocGenerationResponse` - Response with variants array
- `AiDesignGenerationResponse` - Response with variants array

---

## ✅ Phase 6B: Doc Agent Endpoint

**Files Created:**
- `server/lib/ai/docPrompt.ts` - Prompt builder for Doc Agent
- `server/routes/doc-agent.ts` - API route handler

**Route:** `POST /api/ai/doc`

**Features:**
- Accepts `AiDocGenerationRequest` with brandId, topic, platform, contentType, tone, length, CTA, context
- Uses environment-based provider switch (OpenAI/Anthropic)
- Fetches brand profile (currently mocked, TODO: database)
- Builds system + user prompts with brand context
- Generates 3 variants of text content
- Calculates BFS for each variant using shared `calculateBrandFidelityScore()`
- Adds compliance tags (banned phrases, missing disclaimers, tone mismatch, etc.)
- Retries with stricter prompt if average BFS < 0.8
- Provider fallback on failure
- Comprehensive error handling
- Telemetry logging: provider, latency, avgBFS, retry status, variant count

**Sample Response:**
```json
{
  "variants": [
    {
      "id": "variant-1",
      "label": "Option A",
      "content": "Full generated text content...",
      "tone": "professional",
      "wordCount": 150,
      "brandFidelityScore": 0.92,
      "complianceTags": [],
      "status": "draft"
    }
  ]
}
```

---

## ✅ Phase 6C: Design Agent Endpoint

**Files Created:**
- `server/lib/ai/designPrompt.ts` - Prompt builder for Design Agent
- `server/routes/design-agent.ts` - API route handler

**Route:** `POST /api/ai/design`

**Features:**
- Accepts `AiDesignGenerationRequest` with brandId, campaignName, platform, format, tone, visualStyle, context
- Uses same provider switch and error handling as Doc Agent
- Generates 3 visual concepts with:
  - Text prompt for image generator
  - Description of concept
  - Suggested aspect ratio
  - Use case (feed, story, reel cover, etc.)
- Calculates BFS based on prompt + description text
- Same retry logic and compliance checking as Doc Agent
- Telemetry logging

**Sample Response:**
```json
{
  "variants": [
    {
      "id": "variant-1",
      "label": "Concept A",
      "prompt": "Detailed image generation prompt...",
      "description": "Warm, cozy fall mood with minimalist design",
      "aspectRatio": "1:1",
      "useCase": "Instagram Feed Post",
      "brandFidelityScore": 0.88,
      "complianceTags": [],
      "status": "draft"
    }
  ]
}
```

---

## ✅ Phase 6D: Studio Hooks

**Files Created:**
- `client/components/postd/studio/hooks/useDocAgent.ts`
- `client/components/postd/studio/hooks/useDesignAgent.ts`

**Hook API:**
```typescript
{
  data?: AiDocGenerationResponse | AiDesignGenerationResponse;
  variants: AiDocVariant[] | AiDesignVariant[];
  isLoading: boolean;
  isError: boolean;
  error?: Error;
  generate: (payload) => Promise<void>;
  reset: () => void;
}
```

**Features:**
- Uses React Query `useMutation` for API calls
- Manages variants state internally
- Provides `generate()` function to trigger generation
- Provides `reset()` to clear state
- Extracts BFS and compliance tags from response

---

## ✅ Phase 6E: Creative Studio UI Integration

**Files Created:**
- `client/components/postd/studio/DocAiPanel.tsx` - Doc Agent UI panel
- `client/components/postd/studio/DesignAiPanel.tsx` - Design Agent UI panel
- `client/components/postd/studio/AiGenerationModal.tsx` - Modal wrapper with tabs

**DocAiPanel Features:**
- Form inputs: topic, platform, contentType, length, CTA, additional context
- Loading state with spinner
- Error state with retry button
- Variant cards showing:
  - Variant label ("Option A", "Option B", "Option C")
  - Content preview
  - BFS badge (green ≥80%, amber <80%)
  - Compliance tags as chips
  - Word count
  - Actions: "Use This", "Edit", "Copy"
- Low BFS warning panel when score < 0.8

**DesignAiPanel Features:**
- Form inputs: campaign name, platform, format, visual style, additional context
- Loading state
- Error state with retry
- Concept cards showing:
  - Concept label
  - Description
  - Image prompt (with copy button)
  - Aspect ratio and use case badges
  - BFS badge
  - Compliance tags
  - "Use Prompt" action
- Low BFS warning

**AiGenerationModal:**
- Dialog wrapper with tabs for Doc/Design
- Integrates both panels
- Handles variant selection callbacks

**Studio Page Integration:**
- Added `showAiModal` state
- Replaced "Coming Soon" toast with `setShowAiModal(true)`
- Added `handleUseDocVariant()` - populates design with text content
- Added `handleUseDesignVariant()` - creates design with prompt
- Modal renders when `showAiModal` is true

---

## ✅ Phase 6F: Saving AI Output to Studio

**Doc Variant Integration:**
- `handleUseDocVariant()`:
  - Creates new design if none exists
  - Finds existing text item or creates new one
  - Updates/creates text item with `variant.content`
  - Shows success toast
  - Updates design history

**Design Variant Integration:**
- `handleUseDesignVariant()`:
  - Creates new design with `startMode: "ai"`
  - Adds text item containing the image prompt
  - Sets design name to variant label
  - Shows success toast

**Content Model:**
- Doc variants → `CanvasItem` with `type: "text"` and `text: variant.content`
- Design variants → `CanvasItem` with prompt stored in text field
- BFS and compliance tags stored in variant object (can be extended to design metadata)

---

## ✅ Phase 6G: Guardrails, Logging, and Tests

**Shared BFS Utilities:**
- `server/lib/ai/brandFidelity.ts`:
  - `calculateBrandFidelityScore(text, brand)` - Returns BFS (0-1) and compliance tags
  - `getComplianceTags(text, brand)` - Returns array of compliance tag strings
  - Checks: banned phrases, tone alignment, missing disclaimers, promissory language

**Logging:**
- Doc Agent: `[DocAgent] provider=openai latency=1234ms avgBFS=0.92 retry=false variants=3`
- Design Agent: `[DesignAgent] provider=openai latency=2345ms avgBFS=0.88 retry=false variants=3`
- Logs include: provider, latency, average BFS, retry status, variant count, errors

**Build Status:**
- ✅ `pnpm build` - Successful
- ✅ `pnpm lint` - No errors
- ✅ All TypeScript types properly defined

---

## Files Created/Modified

### New Files (13):
1. `shared/aiContent.ts` - Shared types
2. `client/lib/types/aiContent.ts` - Client types
3. `server/lib/ai/brandFidelity.ts` - Shared BFS utilities
4. `server/lib/ai/docPrompt.ts` - Doc prompt builder
5. `server/lib/ai/designPrompt.ts` - Design prompt builder
6. `server/routes/doc-agent.ts` - Doc API route
7. `server/routes/design-agent.ts` - Design API route
8. `client/components/postd/studio/hooks/useDocAgent.ts` - Doc hook
9. `client/components/postd/studio/hooks/useDesignAgent.ts` - Design hook
10. `client/components/postd/studio/DocAiPanel.tsx` - Doc UI panel
11. `client/components/postd/studio/DesignAiPanel.tsx` - Design UI panel
12. `client/components/postd/studio/AiGenerationModal.tsx` - Modal wrapper

### Modified Files (2):
1. `server/index.ts` - Registered `/api/ai/doc` and `/api/ai/design` routes
2. `client/app/(postd)/studio/page.tsx` - Integrated AI modal and handlers

---

## Testing Checklist

To test Phase 6:

1. **Start dev server:** `pnpm dev`

2. **Navigate to `/studio`**

3. **Test "Generate with AI" flow:**
   - Click "Generate with AI" button in template grid
   - Modal opens with Doc/Design tabs

4. **Test Doc Agent:**
   - Fill in form: topic, platform, contentType, length
   - Click "Generate Copy"
   - Wait for loading state
   - Verify 3 variants appear with:
     - BFS badges
     - Content preview
     - Compliance tags (if any)
     - Actions (Use This, Edit, Copy)
   - Click "Use This" → Content should populate in Studio canvas
   - Test low BFS warning (if variant has BFS < 0.8)

5. **Test Design Agent:**
   - Switch to Design tab
   - Fill in form: campaign name, platform, format
   - Click "Generate Concepts"
   - Verify 3 concepts appear with:
     - Prompts
     - Descriptions
     - Aspect ratios
     - BFS badges
   - Click "Use Prompt" → Prompt should be added to canvas

6. **Test Error Handling:**
   - Set invalid API key
   - Try to generate
   - Verify error message and retry button appear

7. **Test Empty States:**
   - Generate with empty/invalid input
   - Verify appropriate validation messages

---

## TODOs for Future Improvements

1. **Database Integration:**
   - Replace `getBrandProfile()` mocks with real database queries
   - Fetch brand guidelines, colors, typography from `brands` table
   - Store AI-generated content in database with BFS metadata

2. **Enhanced BFS:**
   - Use semantic similarity (embeddings) for tone matching
   - Industry-specific compliance rules
   - More sophisticated banned phrase detection

3. **Studio Content Model Enhancement:**
   - Store BFS and compliance tags in design metadata
   - Add "AI-generated" flag to content items
   - Track source (doc agent, design agent, manual)

4. **Refinement Features:**
   - "Regenerate like this" - send variant as base for refinement
   - "Refine" button - ask for variations (more minimal, bolder, etc.)
   - A/B testing support for variants

5. **Image Generation Integration:**
   - Connect Design Agent prompts to actual image generators
   - Store generated images as assets
   - Preview images in Design panel

6. **Analytics:**
   - Track which variants are used most
   - Track BFS distribution
   - Track compliance issues frequency

---

## Summary

Phase 6 is **complete** and **functional**:

✅ Doc Agent endpoint with BFS/compliance  
✅ Design Agent endpoint with BFS/compliance  
✅ React hooks for both agents  
✅ UI panels with full feature set  
✅ Integration into Creative Studio  
✅ Content saving to Studio canvas  
✅ Shared BFS utilities  
✅ Comprehensive logging  
✅ Error handling and retry logic  
✅ Build successful, no lint errors  

The Creative Studio now has full AI-powered content generation capabilities with brand fidelity guardrails, matching the quality and patterns established in Phase 5.

