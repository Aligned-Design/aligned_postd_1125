# MVP Critical Files - Handle with Extra Care

These files are part of the 5 core MVPs that MUST work for V1 launch. Any changes to these files should be extremely careful and non-destructive.

## 🔥 MVP #1: Website Scrape → Intake → Auto-Populate Brand Guide

**Critical Files:**
- `client/app/(postd)/brand-intake/page.tsx` - Main intake UI
- `client/components/brand-intake/*` - Intake components
- `server/routes/crawler.ts` - Website crawling logic
- `server/lib/crawler/*` - Crawler implementation
- `client/app/(postd)/brand-snapshot/page.tsx` - Brand snapshot review
- `client/lib/colorExtraction.ts` - Color extraction from images
- `server/routes/brand-intelligence.ts` - Brand intelligence API
- `client/app/(postd)/brand-intelligence/page.tsx` - Brand intelligence UI

**Cleanup Priority:** HIGH - These files are critical for onboarding flow

## 🔥 MVP #2: Brand Guide Builder (AI-Powered)

**Critical Files:**
- `client/app/(postd)/brand-guide/page.tsx` - Main brand guide UI
- `client/components/dashboard/BrandGuideWizard.tsx` - Guide builder wizard
- `client/components/dashboard/VoiceToneEditor.tsx` - Voice & tone editor
- `client/components/dashboard/VisualIdentityEditor.tsx` - Visual kit editor
- `client/components/dashboard/PersonasEditor.tsx` - Audience editor
- `server/routes/brand-guide.ts` - Brand guide API
- `server/routes/brand-guide-generate.ts` - AI generation
- `client/hooks/useBrandGuide.ts` - Brand guide hook
- `client/contexts/BrandContext.tsx` - Brand context (already being cleaned)

**Cleanup Priority:** HIGH - This is the "brain" of POSTD

## 🔥 MVP #3: AI Content Generator (Three-Agent System)

**Critical Files:**
- `server/agents/*` - Agent implementations
  - Copywriter agent files
  - Design agent files
  - Advisor agent files
- `client/components/postd/studio/DocAiPanel.tsx` - Copywriter UI (already being cleaned)
- `client/components/postd/studio/DesignAiPanel.tsx` - Design UI (already being cleaned)
- `client/components/dashboard/AnalyticsAdvisor.tsx` - Advisor UI (needs cleanup)
- `client/components/dashboard/ActionableAdvisor.tsx` - Advisor UI (needs cleanup)
- `server/routes/ai-generation.ts` - AI generation API
- `server/routes/design-agent.ts` - Design agent API
- `server/routes/advisor.ts` - Advisor API
- `client/app/(postd)/content-generator/page.tsx` - Content generator page (needs cleanup)

**Cleanup Priority:** HIGH - Core product functionality

## 🔥 MVP #4: Creative Studio (Canvas + Templates)

**Critical Files:**
- `client/app/(postd)/studio/page.tsx` - Main studio (ALREADY CLEANED)
- `client/components/dashboard/CreativeStudioCanvas.tsx` - Canvas component (needs cleanup)
- `client/components/dashboard/CreativeStudioTemplateGrid.tsx` - Template picker
- `client/lib/studio/templates.ts` - Template definitions
- `server/routes/creative-studio.ts` - Studio API
- `client/types/creativeStudio.ts` - Studio types

**Cleanup Priority:** HIGH - Visual content creation is critical

## 🔥 MVP #5: Scheduler + Queue + Approvals

**Critical Files:**
- `client/app/(postd)/queue/page.tsx` - Queue view (ALREADY CLEANED)
- `client/app/(postd)/approvals/page.tsx` - Approvals page (ALREADY CLEANED)
- `client/app/(postd)/calendar/page.tsx` - Calendar view
- `server/routes/publishing.ts` - Publishing/scheduling API
- `server/routes/approvals.ts` - Approvals API
- `client/components/dashboard/ScheduleModal.tsx` - Schedule modal
- `client/hooks/useRescheduleContent.ts` - Reschedule hook (needs cleanup)
- `server/lib/publishing/*` - Publishing logic

**Cleanup Priority:** HIGH - Automation is core value prop

## Cleanup Strategy for MVP Files

1. **Console Replacements:** ✅ SAFE - Only changing logging mechanism
2. **Unused Imports:** ✅ SAFE - Removing unused code
3. **Dead Code:** ⚠️ CAREFUL - Only remove obviously dead code, nothing that might be used
4. **Lint Fixes:** ✅ SAFE - Only simple fixes (useEffect deps, hasOwnProperty)
5. **JSX Cleanup:** ⚠️ CAREFUL - Only remove unnecessary wrappers, not functional wrappers

## Files Already Cleaned (Safe)

✅ These MVP files have been cleaned and are safe:
- `client/app/(postd)/studio/page.tsx` - Studio console statements cleaned
- `client/app/(postd)/queue/page.tsx` - Queue console statements cleaned
- `client/app/(postd)/approvals/page.tsx` - Approvals console statements cleaned

## Files Needing Cleanup (MVP-Critical)

These MVP files still need console statement cleanup:
- `client/components/postd/studio/DocAiPanel.tsx`
- `client/components/postd/studio/DesignAiPanel.tsx`
- `client/components/dashboard/CreativeStudioCanvas.tsx`
- `client/components/dashboard/AnalyticsAdvisor.tsx`
- `client/components/dashboard/ActionableAdvisor.tsx`
- `client/app/(postd)/content-generator/page.tsx`
- `client/hooks/useRescheduleContent.ts`
- `client/contexts/BrandContext.tsx` (high priority - MVP #2)

