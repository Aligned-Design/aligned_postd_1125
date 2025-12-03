# POSTD Go-Live Checklist

**Purpose**: Final pre-deployment sanity check to ensure POSTD is ready for real customers.  
**When to use**: Before every production deploy, especially after major feature additions or mock-data removals.  
**Who runs this**: Tech Lead + Product/Founder (both must sign off)

---

## Overview

This is the checklist we run before pushing POSTD to production. Goal: ensure no mocks, correct environment configuration, and real data/UX in key customer-facing flows. If anything on this list is half-true, it's a no.

---

## Environment & Flags

- [ ] `NODE_ENV=production` is set in the live environment (Vercel/Supabase/hosting platform)
- [ ] All required environment variables from `docs/ENVIRONMENT_SETUP.md` are configured in hosting platform
- [ ] AI provider env vars (OpenAI/Anthropic API keys) are set and valid
- [ ] Media/storage env vars (Supabase keys) are set and pass validation
- [ ] Database connection strings point to production Supabase instance
- [ ] `USE_MOCKS` environment variable is **NOT** set (or would trigger a warning in `server/utils/validate-env.ts`)
- [ ] All API keys are production keys, not test/dev keys

---

## No Mocks / No Unsplash in Production

- [ ] No production route or shared component imports anything named `mock`, `Mock`, `MOCK_`, or `generateMock*` (outside `__tests__/` and Storybook)
- [ ] No `https://images.unsplash.com/*` URLs exist in `client/app/(postd)/**` or `client/components/dashboard/**` (only informational text about stock services is acceptable)
- [ ] All placeholder visuals in production use neutral SVG/icon data URIs, not external stock URLs
- [ ] No hardcoded arrays of demo data (reports, analytics, events, approvals, invoices) in production pages
- [ ] All "coming soon" features show honest empty states, not fake data

---

## Core Product Flows (Spot Check)

### Onboarding & Brand Guide

- [ ] Onboarding creates a real brand record in the database (no lorem ipsum or canned demo brands)
- [ ] Brand Guide wizard saves real brand data (voice, tone, colors, messaging pillars)
- [ ] Brand scraping/ingestion creates real assets, not placeholder content
- [ ] No demo/mock brands are visible to real users

### Library & Media

- [ ] Library page shows real uploaded/scraped assets for a test tenant
- [ ] Media thumbnails display real images or neutral SVG placeholders (no Unsplash URLs)
- [ ] Image upload creates real storage records in Supabase
- [ ] Stock image search works or shows "coming soon" (never fake stock images in production)

### Queue & Approvals

- [ ] Queue page shows real scheduled content for a test brand, or empty state
- [ ] Approvals dashboard displays real approval items, or honest empty/error states (no mock approvals)
- [ ] Content generation creates real database records
- [ ] Post statuses reflect actual workflow state, not fake data

### Analytics / Insights / ROI

- [ ] Analytics charts show real data OR clearly labeled "coming soon" states (never fake metrics)
- [ ] ROI insights page shows "coming soon" UI, not fake ROI numbers
- [ ] Brand Intelligence endpoint returns real brand-derived insights or clearly marked "coming soon" sections
- [ ] Performance tracking uses real platform APIs or logs warnings (never `generateMockMetrics()`)

### Billing / Reporting / Events

- [ ] Billing page fetches from `/api/billing/status` and shows real plan/subscription status (no fake invoices)
- [ ] Reporting page uses real saved reports from `/api/reports` or shows "coming soon"
- [ ] Events page shows real events from `/api/events` or clean empty state (no fake webinars or Unsplash banners)
- [ ] All financial data (invoices, usage, limits) comes from real API responses

---

## AI & Jobs

- [ ] All AI flows route through shared AI client(s) with env-based model selection
- [ ] Brand Intelligence queries real brand data from database (AI-generated insights marked as "coming soon" if not yet implemented)
- [ ] Content Planning calls real AI providers or returns controlled errors
- [ ] Doc Agent uses real AI generation with proper error handling
- [ ] Media AI Tagging calls real Claude Vision API (no mock tags in production)
- [ ] Performance Tracking Job (`server/lib/performance-tracking-job.ts`):
  - [ ] Does NOT call `generateMockMetrics()` in production
  - [ ] Logs warnings and returns `null` if platform APIs are not yet implemented
  - [ ] Handles API failures gracefully without falling back to fake data

---

## Audits & Regression Sweeps

- [ ] `docs/POSTD_LIVE_VS_MOCK_AUDIT.md` status shows ✅ (no PROD_PATH violations)
- [ ] Latest "No-Mock Regression Sweep" report shows 0 production violations
- [ ] AI Provider health audit (if applicable) shows all required providers configured
- [ ] All critical findings from recent audits have been remediated

---

## User Experience

- [ ] Error states show helpful messages, not technical errors or mock data
- [ ] Empty states are clear and actionable ("No reports yet" not "Loading fake data...")
- [ ] Loading states are appropriate and don't show placeholder content
- [ ] All "coming soon" features are clearly labeled, not disguised as working features

---

## Sign-off

**Tech Lead Sign-off**: _________________________ Date: ___________

**Product/Founder Sign-off**: ____________________ Date: ___________

**Reminder**: If anything on this list is half-true, it's a no. We love you, but we're not shipping fake data.

---

## Quick Verification Commands

Run these to spot-check before signing off:

```bash
# Check for Unsplash URLs in production routes
grep -r "images.unsplash.com" client/app/\(postd\)/ client/components/dashboard/

# Check for MOCK_ imports in production pages
grep -r "MOCK_\|generateMock" client/app/\(postd\)/ --exclude-dir=__tests__

# Verify environment validation
pnpm run typecheck
```

Expected: No matches (or only informational text about stock services).

---

**Last Updated**: 2025-01-20  
**Related Docs**: `docs/POSTD_MOCK_USAGE_RULES.md`, `docs/POSTD_LIVE_VS_MOCK_AUDIT.md`

