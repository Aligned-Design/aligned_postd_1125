# POSTD Brand Cleanup Report

> **Status:** ✅ Completed – This brand cleanup has been completed.  
> **Last Updated:** 2025-01-20

**Date**: January 2025  
**Scope**: Comprehensive audit and cleanup of all customer-facing copy to align with POSTD brand guidelines

---

## 📊 Executive Summary

Completed a full audit and cleanup of all customer-facing copy across the codebase. Updated **50+ files** to remove old branding ("Aligned", "Aligned AI", "Aligned-20AI", "ABD") and replace AI agent terminology with the new role-based system ("The Copywriter", "The Creative", "The Advisor").

---

## ✅ Completed Changes

### 1. Brand Name Updates

**Removed:**
- "Aligned"
- "Aligned AI"
- "Aligned-20AI"
- "Aligned by Design"
- "ABD"

**Replaced with:**
- "POSTD" (consistent across all customer-facing copy)

**Files Updated:**
- `client/components/postd/layout/Header.tsx`
- `client/components/postd/layout/MobileNav.tsx`
- `client/components/site/SiteFooter.tsx`
- `client/components/FooterNew.tsx`
- All legal pages (`/legal/*`)
- Onboarding screens
- Blog posts
- Default brand context

### 2. AI Agent Terminology → Role-Based System

**Removed:**
- "Doc Agent" → **"The Copywriter"**
- "Design Agent" → **"The Creative"**
- "Advisor Agent" → **"The Advisor"**
- "AI agent", "the agent", "our agent"
- Anthropomorphic language ("the agent thinks", "agent generates", etc.)

**Files Updated:**
- `client/components/postd/studio/AiGenerationModal.tsx`
- `client/components/postd/studio/DocAiPanel.tsx`
- `client/components/postd/studio/DesignAiPanel.tsx`
- `client/app/(postd)/approvals/page.tsx`
- `client/pages/Approvals.tsx`
- `client/app/(postd)/brand-snapshot/page.tsx`
- `client/pages/BrandSnapshot.tsx`
- `client/app/(postd)/admin/page.tsx`
- `client/components/brand-intake/Section6AITraining.tsx`
- `client/components/postd/dashboard/widgets/AdvisorInsightsPanel.tsx`
- `client/components/postd/dashboard/FirstTimeWelcome.tsx`
- File comments and documentation

### 3. Removed Anthropomorphic AI Language

**Removed:**
- "AI-powered" (replaced with simpler phrasing)
- "AI suite", "AI bundle"
- "magically generated"
- "smart bot"
- "initializing AI"
- "running AI process"
- "our agent is designing"

**Replaced with:**
- "Content generation"
- "Insights and recommendations"
- "Marketing platform"
- Simple, direct language

**Files Updated:**
- Blog posts
- Dashboard components
- Analytics page
- Studio page
- Brand Guide Wizard
- Advisor panels
- Goal Content Bridge

### 4. Updated Tone & Voice

**Applied Postd Voice Guidelines:**
- Clear, helpful, confident, professional
- Short sentences
- No jargon or hype
- Minimal use of "AI" unless necessary
- Focus on user benefits
- Position Postd as unified system

**Examples of Updated Copy:**
- "Welcome to Postd" (was "Welcome to Aligned")
- "Marketing that stays true to your brand" (was "AI-powered marketing that actually sounds like you")
- "Generate Content" (was "✨ Generate with AI")
- "The Copywriter" / "The Creative" (was "Copy (Doc Agent)" / "Visual Concepts (Design Agent)")

### 5. Legal Pages & Contact Information

**Updated:**
- All legal page titles and content
- Email addresses: `@aligned20.ai` → `@postd.app`
- Domain references: `aligned20.ai` → `postd.app`
- Company name in all legal text

**Files Updated:**
- `client/app/(public)/legal/terms/page.tsx`
- `client/app/(public)/legal/privacy-policy/page.tsx`
- `client/app/(public)/legal/api-policy/page.tsx`
- `client/app/(public)/legal/ai-disclosure/page.tsx`
- `client/app/(public)/legal/data-deletion/page.tsx`
- `client/app/(public)/legal/acceptable-use/page.tsx`
- `client/app/(public)/legal/refunds/page.tsx`
- `client/app/(public)/legal/security/page.tsx`
- `client/app/(public)/legal/cookies/page.tsx`

### 6. Onboarding Screens

**Updated:**
- Welcome screen: "Welcome to Postd"
- Tagline: "Marketing that stays true to your brand"
- Brand snapshot: "Postd is Ready!" (was "Your AI Agents Are Ready!")
- Connection errors: "Postd" instead of "Aligned AI"
- Placeholder text: Generic examples instead of "Aligned AI"

**Files Updated:**
- `client/pages/onboarding/Screen1SignUp.tsx`
- `client/pages/onboarding/Screen3BrandIntake.tsx`
- `client/pages/onboarding/Screen35ConnectAccounts.tsx`
- `client/pages/onboarding/Screen10DashboardWelcome.tsx`

### 7. Landing Pages

**Updated:**
- Hero section: "Marketing that stays true to your brand" (was "Aligned. Automatic. Finally easy.")
- Problem section: "consistent" instead of "aligned"
- Why Teams Love It: "Always consistent" (was "Always aligned")

**Files Updated:**
- `client/components/landing/HeroSection.tsx`
- `client/components/landing/ProblemSection.tsx`
- `client/components/landing/WhyTeamsLoveItSection.tsx`
- `client/components/landing/WhatItFeelsLikeSection.tsx`

### 8. Dashboard & Analytics

**Updated:**
- Advisor panel: "The Advisor" (was "AI Insights")
- Subtitle: "Insights and recommendations" (was "AI-powered insights")
- Analytics page: Removed "AI-powered" from subtitle
- First-time welcome: "The Advisor" instead of "AI Advisor"

**Files Updated:**
- `client/components/postd/dashboard/widgets/AdvisorInsightsPanel.tsx`
- `client/components/postd/dashboard/FirstTimeWelcome.tsx`
- `client/app/(postd)/analytics/page.tsx`
- `client/components/dashboard/AdvisorPanel.tsx`
- `client/components/dashboard/AnalyticsAdvisor.tsx`
- `client/components/dashboard/ActionableAdvisor.tsx`
- `client/components/dashboard/SchedulingAdvisor.tsx`

### 9. Creative Studio

**Updated:**
- Modal title: "Generate Content" (was "✨ Generate with AI")
- Tab labels: "The Copywriter" / "The Creative"
- Design tab: "The Creative" (was "AI-Powered Design")
- Helper text: Removed anthropomorphic language

**Files Updated:**
- `client/components/postd/studio/AiGenerationModal.tsx`
- `client/components/postd/studio/DocAiPanel.tsx`
- `client/components/postd/studio/DesignAiPanel.tsx`
- `client/app/(postd)/studio/page.tsx`
- `client/components/dashboard/CreativeStudioTemplateGrid.tsx`

### 10. Blog & Content

**Updated:**
- Blog post titles and content
- Author name: "Postd Team" (was "Aligned Team")
- Meta tags: "Postd" (was "Aligned AI")
- Removed "AI-powered" from blog content

**Files Updated:**
- `client/lib/blog/getBlogPosts.ts`
- `client/app/(public)/blog/[slug]/page.tsx`

### 11. Mock Data & Defaults

**Updated:**
- Default brand name: "Default Brand" (was "Aligned by Design")
- Calendar mock data: "Brand A" (was "Aligned-20AI")
- Events page: Removed "Aligned-20AI" from descriptions

**Files Updated:**
- `client/contexts/BrandContext.tsx`
- `client/app/(postd)/calendar/page.tsx`
- `client/components/dashboard/MonthCalendarView.tsx`
- `client/app/(postd)/events/page.tsx`

### 12. Server-Side Copy

**Updated:**
- Approval emails: "Postd" (was "Aligned AI")

**Files Updated:**
- `server/routes/approvals.ts`

---

## 📝 Replaced Terms Summary

| Old Term | New Term | Count |
|----------|----------|-------|
| Aligned / Aligned AI / Aligned-20AI | Postd | 50+ |
| Doc Agent | The Copywriter | 15+ |
| Design Agent | The Creative | 15+ |
| Advisor Agent | The Advisor | 10+ |
| AI-powered | (removed/rephrased) | 20+ |
| AI agent / the agent | Postd / The Copywriter / The Creative / The Advisor | 10+ |
| aligned20.ai / aligned.ai | postd.app | 10+ |
| @aligned20.ai / @aligned.ai | @postd.app | 5+ |

---

## 🎯 Areas Requiring Review

### 1. Type Definitions (Non-Customer-Facing)

**Files with "Agent" in type names (internal code only):**
- `client/types/agent-config.ts` - Contains type definitions with "Doc Agent", "Design Agent", "Advisor Agent" in comments
- `client/lib/types/aiContent.ts` - Contains "Doc and Design agents" in comment

**Recommendation:** These are internal type definitions and comments. Consider updating for consistency, but not customer-facing.

### 2. README Files

**Files:**
- `client/README.md` - Contains "AI-powered content generation" in feature list

**Recommendation:** Update to match new branding if this README is customer-facing.

### 3. Documentation Files

**Files:**
- Various `.md` files in `docs/` directory contain old branding

**Recommendation:** These are internal documentation. Update if needed for team consistency.

---

## ✅ Final Verification Checklist

- [x] All "Aligned" / "Aligned AI" references replaced with "Postd"
- [x] All "Doc Agent" → "The Copywriter"
- [x] All "Design Agent" → "The Creative"
- [x] All "Advisor Agent" → "The Advisor"
- [x] All anthropomorphic AI language removed
- [x] All "AI-powered" references removed or rephrased
- [x] All legal pages updated
- [x] All contact information updated
- [x] All onboarding screens updated
- [x] All landing pages updated
- [x] All dashboard components updated
- [x] All Creative Studio components updated
- [x] All error messages and empty states reviewed
- [x] All mock data updated
- [x] Tone aligned with Postd voice guidelines

---

## 🎉 Summary

**Total Files Modified:** 50+  
**Total Replacements:** 100+  
**Status:** ✅ Complete

All customer-facing copy has been updated to:
- Use "Postd" as the product name
- Reference "The Copywriter", "The Creative", and "The Advisor" as tools
- Remove anthropomorphic AI language
- Align with Postd's clear, helpful, confident tone
- Present Postd as a unified system, not a collection of agents

The product now consistently presents itself as **Postd** with three integrated tools: **The Copywriter**, **The Creative**, and **The Advisor**.

