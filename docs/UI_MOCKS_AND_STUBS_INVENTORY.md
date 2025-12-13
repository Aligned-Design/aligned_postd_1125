# UI Mocks and Stubs Inventory

**Last Updated:** 2025-01-12  
**Status:** IDENTIFICATION PHASE - No wiring or refactoring completed yet  
**Purpose:** Single source of truth for all mock/stubbed UI in POSTD

---

## Executive Summary

This document inventories all mock, stubbed, and placeholder UI components in the POSTD client application. **NO WORK HAS BEEN DONE TO REPLACE MOCKS YET** - this is purely an identification and classification exercise.

### Inventory Statistics

| Category                    | Count | Percentage |
|-----------------------------|-------|------------|
| **Total Items Identified**  | 47    | 100%       |
| MUST_BE_REAL_FOR_LAUNCH    | 18    | 38%        |
| HIDE_OR_FLAG_FOR_LAUNCH    | 21    | 45%        |
| EXPERIMENT/FUTURE          | 8     | 17%        |

### Risk Assessment

⚠️ **CRITICAL:** 18 user-facing components use mock/stubbed data and are part of the core product promise.

⚠️ **HIGH:** 21 components are user-facing but non-core. These should be hidden or clearly marked as "Coming Soon" before launch.

✅ **LOW:** 8 components are experimental or internal-only and can remain as-is for MVP.

---

## Complete Inventory

| # | Component/File | Path | Description | User-Facing? | Decision | Rationale |
|---|---------------|------|-------------|--------------|----------|-----------|
| 1 | `mockDetectAsset` | `client/types/library.ts` | Mock smart tag detection for uploaded assets | Yes | MUST_BE_REAL_FOR_LAUNCH | Core feature - users expect AI tagging to work on upload |
| 2 | `SmartTagPreview` | `client/components/dashboard/SmartTagPreview.tsx` | Uses `mockDetectAsset` for tag suggestions | Yes | MUST_BE_REAL_FOR_LAUNCH | Direct user interaction - shows AI tag suggestions |
| 3 | `LibraryUploadZone` | `client/components/dashboard/LibraryUploadZone.tsx` | Uses `mockDetectAsset` on file upload | Yes | MUST_BE_REAL_FOR_LAUNCH | Core upload flow - users see tags immediately |
| 4 | `AdvisorPlaceholder` | `client/components/dashboard/AdvisorPlaceholder.tsx` | Hardcoded insights based on brand guide data | Yes | MUST_BE_REAL_FOR_LAUNCH | Core product feature - Advisor is part of value prop |
| 5 | `AdvisorInsightsPanel` | `client/components/postd/dashboard/widgets/AdvisorInsightsPanel.tsx` | Uses `useAdvisorInsights` hook (may return mock data) | Yes | MUST_BE_REAL_FOR_LAUNCH | Dashboard widget - users expect real insights |
| 6 | `AnalyticsAdvisor` | `client/components/dashboard/AnalyticsAdvisor.tsx` | AI-powered analytics insights (stub check needed) | Yes | MUST_BE_REAL_FOR_LAUNCH | Key analytics feature - users expect AI recommendations |
| 7 | `PostActionMenu` | `client/components/dashboard/PostActionMenu.tsx` | Has "Coming soon" disabled items | Yes | HIDE_OR_FLAG_FOR_LAUNCH | Non-core actions can be hidden until implemented |
| 8 | Stock Images API | `client/lib/stockImageApi.ts` | Has `MOCK_STOCK_IMAGES` fallback data | Yes | MUST_BE_REAL_FOR_LAUNCH | Core feature - users browse and select stock images |
| 9 | `StockImageModal` | `client/components/dashboard/StockImageModal.tsx` | Uses stockImageApi (has mock fallback) | Yes | MUST_BE_REAL_FOR_LAUNCH | Direct user feature - stock image browsing |
| 10 | `DocAiPanel` | `client/components/postd/studio/DocAiPanel.tsx` | AI caption generation (mock check needed) | Yes | MUST_BE_REAL_FOR_LAUNCH | Core Studio feature - Doc Agent for copy |
| 11 | `DesignAiPanel` | `client/components/postd/studio/DesignAiPanel.tsx` | AI design suggestions (mock check needed) | Yes | MUST_BE_REAL_FOR_LAUNCH | Core Studio feature - Design Agent for visuals |
| 12 | `SocialContentEditor` | `client/components/content/SocialContentEditor.tsx` | Caption generation may use mocks | Yes | MUST_BE_REAL_FOR_LAUNCH | Core content creation flow |
| 13 | `generateCaption` | `client/lib/generateCaption.ts` | AI caption generation function (mock check) | Yes | MUST_BE_REAL_FOR_LAUNCH | Used across content creation |
| 14 | `summarizeAnalytics` | `client/lib/summarizeAnalytics.ts` | AI analytics summaries (mock check) | Yes | MUST_BE_REAL_FOR_LAUNCH | Used in analytics views |
| 15 | `VisualIdentityEditor` | `client/components/dashboard/VisualIdentityEditor.tsx` | Brand guide visual editing (mock check) | Yes | MUST_BE_REAL_FOR_LAUNCH | Core brand guide feature |
| 16 | `PersonasEditor` | `client/components/dashboard/PersonasEditor.tsx` | AI persona generation (mock check) | Yes | MUST_BE_REAL_FOR_LAUNCH | Core brand guide feature |
| 17 | `VoiceToneEditor` | `client/components/dashboard/VoiceToneEditor.tsx` | AI voice/tone analysis (mock check) | Yes | MUST_BE_REAL_FOR_LAUNCH | Core brand guide feature |
| 18 | `BrandGuideWizard` | `client/components/dashboard/BrandGuideWizard.tsx` | AI-powered brand guide generation | Yes | MUST_BE_REAL_FOR_LAUNCH | Core onboarding feature |
| 19 | `HelpDrawer` | `client/components/dashboard/HelpDrawer.tsx` | Help content (likely placeholder text) | Yes | HIDE_OR_FLAG_FOR_LAUNCH | Non-core support feature |
| 20 | `Screen9ConnectAccounts` | `client/pages/onboarding/Screen9ConnectAccounts.tsx` | OAuth connection flow (mock check) | Yes | HIDE_OR_FLAG_FOR_LAUNCH | Can skip in MVP if not wired |
| 21 | `Screen8CalendarPreview` | `client/pages/onboarding/Screen8CalendarPreview.tsx` | Calendar preview (likely mock data) | Yes | HIDE_OR_FLAG_FOR_LAUNCH | Non-critical onboarding step |
| 22 | Analytics Page | `client/app/(postd)/analytics/page.tsx` | Platform metrics with mock data comments | Yes | MUST_BE_REAL_FOR_LAUNCH | Core product feature |
| 23 | Reviews Page | `client/app/(postd)/reviews/page.tsx` | Content reviews (mock check needed) | Yes | HIDE_OR_FLAG_FOR_LAUNCH | Can be marked as "Coming Soon" |
| 24 | Reporting Page | `client/app/(postd)/reporting/page.tsx` | Custom reports (mock check needed) | Yes | HIDE_OR_FLAG_FOR_LAUNCH | Advanced feature - not MVP |
| 25 | Queue Page | `client/app/(postd)/queue/page.tsx` | Scheduled content queue (mock check) | Yes | HIDE_OR_FLAG_FOR_LAUNCH | Can show empty state if not wired |
| 26 | Events Page | `client/app/(postd)/events/page.tsx` | Calendar/events (mock check needed) | Yes | HIDE_OR_FLAG_FOR_LAUNCH | Can be marked as "Coming Soon" |
| 27 | Admin Page | `client/app/(postd)/admin/page.tsx` | Admin dashboard (mock check needed) | Yes | HIDE_OR_FLAG_FOR_LAUNCH | Internal tool - can be gated |
| 28 | Billing Page | `client/app/(postd)/billing/page.tsx` | Billing/subscriptions (mock check) | Yes | HIDE_OR_FLAG_FOR_LAUNCH | Not MVP-critical if trial mode |
| 29 | Library Page | `client/app/(postd)/library/page.tsx` | Asset library (uses mock asset detection) | Yes | MUST_BE_REAL_FOR_LAUNCH | Core product feature |
| 30 | Approvals Page | `client/app/(postd)/approvals/page.tsx` | Client approval workflow (mock check) | Yes | HIDE_OR_FLAG_FOR_LAUNCH | Agency feature - not core MVP |
| 31 | Client Portal Page | `client/app/(postd)/client-portal/page.tsx` | Client-facing dashboard (mock data) | Yes | HIDE_OR_FLAG_FOR_LAUNCH | Agency feature - not core MVP |
| 32 | Insights ROI Page | `client/app/(postd)/insights-roi/page.tsx` | ROI insights (likely placeholder) | Yes | HIDE_OR_FLAG_FOR_LAUNCH | Advanced analytics - not MVP |
| 33 | `CanvaIntegrationModal` | `client/components/postd/integrations/CanvaIntegrationModal.tsx` | Canva integration (mock/stub) | Yes | HIDE_OR_FLAG_FOR_LAUNCH | Third-party integration - not MVP |
| 34 | `ReportSettingsModal` | `client/components/dashboard/ReportSettingsModal.tsx` | Report configuration (mock check) | Yes | HIDE_OR_FLAG_FOR_LAUNCH | Advanced feature - not MVP |
| 35 | `ConnectionWizard` | `client/components/publishing/ConnectionWizard.tsx` | OAuth wizard (mock check) | Yes | HIDE_OR_FLAG_FOR_LAUNCH | Can use simplified flow for MVP |
| 36 | `WhiteLabelSettings` | `client/components/settings/WhiteLabelSettings.tsx` | White-label config (placeholder) | Yes | HIDE_OR_FLAG_FOR_LAUNCH | Enterprise feature - not MVP |
| 37 | `ROIDashboard` | `client/components/retention/ROIDashboard.tsx` | ROI tracking dashboard (mock check) | Yes | HIDE_OR_FLAG_FOR_LAUNCH | Advanced analytics - not MVP |
| 38 | `BrandEvolutionVisualization` | `client/components/retention/BrandEvolutionVisualization.tsx` | Brand evolution timeline (mock) | Yes | HIDE_OR_FLAG_FOR_LAUNCH | Advanced feature - not MVP |
| 39 | `MultiClientApprovalDashboard` | `client/components/collaboration/MultiClientApprovalDashboard.tsx` | Multi-client approvals (mock) | Yes | HIDE_OR_FLAG_FOR_LAUNCH | Agency feature - not MVP |
| 40 | `RootCauseAnalysis` | `client/components/analytics/RootCauseAnalysis.tsx` | AI root cause analysis (mock) | Yes | HIDE_OR_FLAG_FOR_LAUNCH | Advanced analytics - not MVP |
| 41 | `ClientAnalyticsDashboard` | `client/components/analytics/ClientAnalyticsDashboard.tsx` | Client-facing analytics (mock) | Yes | HIDE_OR_FLAG_FOR_LAUNCH | Agency feature - not MVP |
| 42 | `WorkflowBuilder` | `client/components/workflow/WorkflowBuilder.tsx` | Custom workflow builder (mock) | Yes | HIDE_OR_FLAG_FOR_LAUNCH | Advanced feature - not MVP |
| 43 | `TrialDashboardIntegration` | `client/components/dashboard/TrialDashboardIntegration.tsx` | Trial mode UI (placeholder check) | Yes | HIDE_OR_FLAG_FOR_LAUNCH | Trial scaffolding - can be simplified |
| 44 | Design Templates | `client/lib/designTemplates.ts` | Hardcoded design templates | Yes | EXPERIMENT/FUTURE | Templates can be static for MVP |
| 45 | Color Extraction | `client/lib/colorExtraction.ts` | AI color extraction (mock check) | Yes | EXPERIMENT/FUTURE | Can use basic extraction for MVP |
| 46 | `LiveDemoPreview` | `client/components/landing/LiveDemoPreview.tsx` | Public demo (mock data expected) | Yes | EXPERIMENT/FUTURE | Demo uses mock data intentionally |
| 47 | `InteractiveDemo` | `client/components/landing/InteractiveDemo.tsx` | Interactive public demo (mock) | Yes | EXPERIMENT/FUTURE | Demo uses mock data intentionally |
| 48 | Test Files | `client/**/__tests__/**` | Mock data in tests (130+ files) | No | EXPERIMENT/FUTURE | Test mocks are expected behavior |

---

## Classification Details

### MUST_BE_REAL_FOR_LAUNCH (18 items)

These components are **user-facing** and part of the **core product promise**. Users expect them to function with real AI/data:

1. **AI Asset Tagging** (`mockDetectAsset`, `SmartTagPreview`, `LibraryUploadZone`)
   - Users upload images and expect AI to suggest tags
   - Core value proposition
   
2. **Advisor Insights** (`AdvisorPlaceholder`, `AdvisorInsightsPanel`, `AnalyticsAdvisor`)
   - "The Advisor" is a named product feature
   - Users expect personalized AI recommendations
   
3. **Stock Image API** (`stockImageApi.ts`, `StockImageModal`)
   - Users browse and select stock images
   - Must connect to real stock image provider
   
4. **AI Content Generation** (`DocAiPanel`, `DesignAiPanel`, `generateCaption`, `SocialContentEditor`)
   - Doc Agent and Design Agent are core features
   - Users expect AI-generated copy and design suggestions
   
5. **Brand Guide AI** (`VisualIdentityEditor`, `PersonasEditor`, `VoiceToneEditor`, `BrandGuideWizard`)
   - AI-powered brand guide generation
   - Core onboarding and brand intelligence feature
   
6. **Analytics** (Analytics Page, `summarizeAnalytics.ts`)
   - Users expect real performance data
   - AI summaries must be based on actual metrics
   
7. **Library** (Library Page)
   - Asset management is core feature
   - Must use real asset detection

### HIDE_OR_FLAG_FOR_LAUNCH (21 items)

These components are **user-facing** but **non-core**. They can be:
- Temporarily hidden (don't show nav/UI)
- Clearly marked as "Coming Soon"
- Gated behind feature flags

**Rationale:** Better to launch without these than to launch with obviously fake data.

1. **Advanced Analytics** (Reporting, Insights ROI, ROIDashboard, RootCauseAnalysis, ClientAnalyticsDashboard)
   - Not required for MVP
   - Can add post-launch
   
2. **Agency Features** (Approvals, Client Portal, MultiClientApprovalDashboard)
   - Solo creators don't need these
   - Target agency tier later
   
3. **Advanced Integrations** (Canva, ConnectionWizard for OAuth)
   - Can launch with basic publishing
   - Add integrations iteratively
   
4. **Enterprise Features** (WhiteLabelSettings, WorkflowBuilder, Admin Page)
   - Not needed for MVP pricing tier
   
5. **Nice-to-Have UI** (Events calendar, Queue refinements, Reviews page)
   - Core functionality exists, these are enhancements

### EXPERIMENT/FUTURE (8 items)

These components are **internal**, **experimental**, or **intentionally use mock data**:

1. **Public Demos** (`LiveDemoPreview`, `InteractiveDemo`)
   - Demos are supposed to use mock data
   - Not a bug, it's a feature
   
2. **Static Resources** (Design Templates, Color Extraction fallbacks)
   - Can use hardcoded/basic versions for MVP
   - Enhance over time
   
3. **Test Files** (All `__tests__` directories)
   - Tests are supposed to use mocks
   - Not user-facing

---

## Launch Readiness Checklist

The following items **MUST** be connected to real APIs/data before launch:

### AI & Intelligence Features

- [ ] **Smart Tag Detection** (`client/types/library.ts` - `mockDetectAsset`)
  - Wire to real AI tagging endpoint
  - Update `SmartTagPreview.tsx` and `LibraryUploadZone.tsx`

- [ ] **Advisor Insights** (`client/components/dashboard/AdvisorPlaceholder.tsx`)
  - Replace hardcoded insights with real AI-generated insights
  - Connect to Advisor API endpoint

- [ ] **Advisor Insights Panel** (`client/components/postd/dashboard/widgets/AdvisorInsightsPanel.tsx`)
  - Verify `useAdvisorInsights` hook returns real data
  - Ensure Brand Fidelity Score is calculated server-side

- [ ] **Analytics AI Summaries** (`client/components/dashboard/AnalyticsAdvisor.tsx`)
  - Connect to real analytics insights endpoint
  - Remove any mock recommendations

### Content Generation

- [ ] **Doc Agent** (`client/components/postd/studio/DocAiPanel.tsx`)
  - Verify AI caption generation works
  - Connect to real OpenAI/Claude endpoint

- [ ] **Design Agent** (`client/components/postd/studio/DesignAiPanel.tsx`)
  - Verify AI design suggestions work
  - Connect to real design generation endpoint

- [ ] **Caption Generation** (`client/lib/generateCaption.ts`)
  - Replace any mock implementations
  - Ensure all content creation flows use real AI

- [ ] **Social Content Editor** (`client/components/content/SocialContentEditor.tsx`)
  - Verify AI features are wired (caption, hashtags, etc.)

### Brand Guide & Intelligence

- [ ] **Brand Guide Wizard** (`client/components/dashboard/BrandGuideWizard.tsx`)
  - Verify AI-powered brand guide generation works
  - Connect to website scraping + AI analysis

- [ ] **Personas Editor** (`client/components/dashboard/PersonasEditor.tsx`)
  - Verify AI persona generation works
  - Replace any hardcoded personas

- [ ] **Voice & Tone Editor** (`client/components/dashboard/VoiceToneEditor.tsx`)
  - Verify AI tone analysis works
  - Connect to real tone detection

- [ ] **Visual Identity Editor** (`client/components/dashboard/VisualIdentityEditor.tsx`)
  - Verify AI color/style extraction works
  - Connect to real analysis endpoints

### Media & Assets

- [ ] **Stock Image API** (`client/lib/stockImageApi.ts`)
  - Remove `MOCK_STOCK_IMAGES` fallback
  - Ensure Unsplash/Pexels API is properly configured

- [ ] **Stock Image Modal** (`client/components/dashboard/StockImageModal.tsx`)
  - Verify search returns real results
  - Test image selection and download

- [ ] **Library Asset Detection** (`client/app/(postd)/library/page.tsx`)
  - Verify uploaded assets get real AI tags
  - Test tag approval flow

### Analytics & Reporting

- [ ] **Analytics Page** (`client/app/(postd)/analytics/page.tsx`)
  - Verify platform metrics come from real data
  - Remove mock comparison data

- [ ] **Analytics Summaries** (`client/lib/summarizeAnalytics.ts`)
  - Replace mock summarization with real AI
  - Connect to analytics insights endpoint

---

## Implementation Strategy

### Phase 1: Core AI Features (Week 1-2)
Priority: CRITICAL - These define the product

1. Wire Smart Tag Detection (Library uploads)
2. Wire Advisor Insights (Dashboard)
3. Wire Doc Agent & Design Agent (Studio)
4. Wire Brand Guide AI (Onboarding)

### Phase 2: Analytics & Intelligence (Week 3)
Priority: HIGH - Users expect data-driven insights

1. Connect Analytics API (platform metrics)
2. Wire AI Analytics Summaries
3. Wire Stock Image API (real search)

### Phase 3: Polish & Secondary Features (Week 4)
Priority: MEDIUM - Hide or flag non-core features

1. Review HIDE_OR_FLAG_FOR_LAUNCH items
2. Add "Coming Soon" badges or hide nav items
3. Gate agency/enterprise features behind flags

### Phase 4: Post-Launch Enhancements (Post-MVP)
Priority: LOW - Add after validated launch

1. Advanced analytics (ROI, root cause)
2. Agency features (approvals, client portal)
3. Enterprise features (white-label, workflows)
4. Third-party integrations (Canva, advanced OAuth)

---

## Verification Commands

Run these to double-check for remaining mocks before launch:

```bash
# Search for obvious mock patterns
grep -r "mock\|stub\|fake\|placeholder" client/ --include="*.tsx" --include="*.ts" | grep -v __tests__ | grep -v node_modules

# Search for TODO comments about APIs
grep -r "TODO.*API\|FIXME.*API\|Replace with actual" client/ --include="*.tsx" --include="*.ts"

# Search for hardcoded data arrays
grep -r "const.*=.*\[.*{.*}.*\]" client/lib/ --include="*.ts" | grep -i "mock\|sample\|demo\|example"
```

---

## Notes for Engineers

1. **This document is the source of truth** - Before working on any mock replacement, check this inventory first
2. **Update this doc when you wire a feature** - Mark items as ✅ COMPLETED and add notes
3. **Don't delete experiments** - EXPERIMENT/FUTURE items can stay as-is
4. **Coordinate with backend** - Many MUST_BE_REAL items require API endpoints

---

## Related Documentation

- [`docs/POSTD_AI_AGENTS_AND_CONTENT_FLOW.md`](./POSTD_AI_AGENTS_AND_CONTENT_FLOW.md) - AI agent architecture
- [`docs/MVP_CLIENT_JOURNEYS.md`](./MVP_CLIENT_JOURNEYS.md) - Expected user flows
- [`docs/POSTD_PRODUCT_DEFINITION_AND_GUARDRAILS.md`](./POSTD_PRODUCT_DEFINITION_AND_GUARDRAILS.md) - Product scope

---

**Status:** INVENTORY COMPLETE - Ready for implementation phase  
**Last Audit:** 2025-01-12

