# Aligned-20AI — Feature Verification Test Plan

## Smoke + Functional Testing Checklist

**Document Version:** 2.0  
**Last Updated:** January 2025  
**Test Environment:** Production / Staging  
**Environment URL:** https://alignedai20.vercel.app  
**Commit Hash Tested:** `4a845bd475737813b7df4b6030bfe30ca8e98ecf`  
**Tester Name:** ******\_\_\_\_******  
**Test Date:** ******\_\_\_\_******

---

## 📊 GAP LOG & COMPLETION SUMMARY

**Document Status:** ✅ COMPLETED — v2.0 (Enhanced from v1.0)

### What Was Added/Enhanced:

1. **Gap Log Section** — Added this section to track completeness per user requirements
2. **Mobile Testing** — Added explicit viewport testing (320px, 768px, 1024px) to all modules
3. **Accessibility Checks** — Added per-module WCAG AA checks (focus order, labels, contrast, keyboard nav)
4. **Evidence & Artifacts** — Added dedicated sections per module for screenshots/GIFs/videos
5. **Feature Flags** — Added section documenting required feature flags for testing
6. **Negative Test Paths** — Enhanced error/edge case coverage (timeouts, invalid data, auth failures)
7. **Data Setup & Cleanup** — Added reproducibility notes and cleanup steps for idempotent testing
8. **API Examples** — Added curl snippets and expected responses for data-driven modules
9. **Single-Action Steps** — Broke down compound steps into atomic, numbered instructions
10. **Binary Acceptance Criteria** — Improved criteria to be testable with clear PASS/FAIL conditions
11. **Environment Variables** — Added section for required env vars and secrets
12. **Pre-Flight Checklist** — Added system readiness verification before testing begins

### Modules Coverage:

| Module                   | Complete | Mobile | A11y | Evidence | Negative Paths |
| ------------------------ | -------- | ------ | ---- | -------- | -------------- |
| 1. Signup & Onboarding   | ✅       | ✅     | ✅   | ✅       | ✅             |
| 2. Brand Intake          | ✅       | ✅     | ✅   | ✅       | ✅             |
| 3. Content Creation      | ✅       | ✅     | ✅   | ✅       | ✅             |
| 4. Approval Workflow     | ✅       | ✅     | ✅   | ✅       | ✅             |
| 5. Publishing            | ✅       | ✅     | ✅   | ✅       | ✅             |
| 6. Analytics Insights    | ✅       | ✅     | ✅   | ✅       | ✅             |
| 7. Client Portal         | ✅       | ✅     | ✅   | ✅       | ✅             |
| 8. Billing               | ✅       | ✅     | ✅   | ✅       | ✅             |
| 9. Live Data & Real-Time | ✅       | ✅     | ✅   | ✅       | ✅             |
| 10. Design Tokens & A11y | ✅       | ✅     | ✅   | ✅       | ✅             |
| 11. API Sanity Check     | ✅       | N/A    | N/A  | ✅       | ✅             |

---

## 🔧 FEATURE FLAGS & ENVIRONMENT SETUP

### Required Feature Flags

Test execution may require enabling specific feature flags. Set these before testing:

| Flag Name                 | Purpose                     | Default | Test Value                   |
| ------------------------- | --------------------------- | ------- | ---------------------------- |
| `ENABLE_CLIENT_PORTAL`    | Client portal access        | `false` | `true`                       |
| `ENABLE_REALTIME_UPDATES` | WebSocket connections       | `true`  | `true`                       |
| `ENABLE_AI_GENERATION`    | AI content generation       | `true`  | `true`                       |
| `ENABLE_BILLING`          | Stripe integration          | `false` | `true` (if testing Module 8) |
| `ENABLE_BRAND_CRAWLER`    | Brand intelligence crawling | `true`  | `true`                       |
| `POLLING_INTERVAL_MS`     | Real-time polling fallback  | `10000` | `10000`                      |
| `KPI_REFRESH_INTERVAL_MS` | Dashboard auto-refresh      | `60000` | `60000`                      |

### Required Environment Variables

Ensure these are set in your test environment:

```bash
# Authentication
JWT_SECRET=<test-secret-key>
SESSION_SECRET=<test-session-key>

# Database
DATABASE_URL=<postgresql-connection-string>

# OAuth Providers
LINKEDIN_CLIENT_ID=<client-id>
LINKEDIN_CLIENT_SECRET=<client-secret>
INSTAGRAM_CLIENT_ID=<client-id>
INSTAGRAM_CLIENT_SECRET=<client-secret>

# Payment (for Module 8)
STRIPE_SECRET_KEY=sk_test_<stripe-test-key>
STRIPE_PUBLISHABLE_KEY=pk_test_<stripe-test-key>
STRIPE_WEBHOOK_SECRET=whsec_<webhook-secret>

# AI Services
OPENAI_API_KEY=<openai-key>

# Real-Time
WEBSOCKET_URL=wss://alignedai20.vercel.app/ws
```

---

## 📋 PRE-FLIGHT SYSTEM READINESS

Before beginning Module 1, verify system readiness:

### Database & Seed Data

- [ ] **Database Connected**
  - [ ] Run: `curl -H "Authorization: Bearer $TOKEN" https://alignedai20.vercel.app/api/health`
  - [ ] Response: `{ status: "ok", database: "connected" }`
  - Observed Result: ******\_\_\_\_******

- [ ] **Seed Data Present**
  - [ ] At least 1 test user exists (email: `test@example.com`)
  - [ ] At least 1 brand exists (name: "Test Brand")
  - [ ] At least 5 test posts exist (statuses: draft, reviewing, scheduled, published, failed)
  - [ ] Run: `npm run db:seed` or verify via database query
  - Observed Result: ******\_\_\_\_******

### Services Health

- [ ] **Backend API**
  - [ ] API responds at `https://alignedai20.vercel.app/api`
  - [ ] Status: 200 OK
  - Observed Result: ******\_\_\_\_******

- [ ] **WebSocket Server**
  - [ ] WebSocket endpoint reachable at `wss://alignedai20.vercel.app/ws`
  - [ ] Connection establishes successfully
  - Observed Result: ******\_\_\_\_******

- [ ] **AI Generation Service**
  - [ ] OpenAI API key valid
  - [ ] Test call: `curl -H "Authorization: Bearer sk_..." https://api.openai.com/v1/models`
  - [ ] Response includes `gpt-4` model
  - Observed Result: ******\_\_\_\_******

### Browser Setup

- [ ] **Testing Browsers**
  - [ ] Chrome (latest) installed
  - [ ] Firefox (latest) installed
  - [ ] Safari (latest) installed (macOS only)
  - [ ] Mobile simulator (iOS Safari, Android Chrome)
  - Observed Result: ******\_\_\_\_******

- [ ] **Browser Extensions**
  - [ ] WAVE (accessibility checker) installed
  - [ ] axe DevTools installed
  - [ ] React DevTools installed
  - Observed Result: ******\_\_\_\_******

### Test Accounts

- [ ] **Primary Test User**
  - [ ] Email: `admin@test.com`
  - [ ] Role: Admin
  - [ ] Password/Magic Link: Available
  - Observed Result: ******\_\_\_\_******

- [ ] **Secondary Test User**
  - [ ] Email: `creator@test.com`
  - [ ] Role: Creator
  - [ ] Password/Magic Link: Available
  - Observed Result: ******\_\_\_\_******

- [ ] **Client Test User**
  - [ ] Email: `client@test.com`
  - [ ] Role: Client (external)
  - [ ] Has valid client portal token
  - Observed Result: ******\_\_\_\_******

---

## 📋 PRE-REQUISITES (SETUP)

Before beginning any test module, ensure all prerequisites are in place:

- [ ] **User Account**
  - [ ] Logged-in test user with **Admin role**
  - [ ] Test account has valid email (for magic link tests)
  - Observed Result: ******\_\_\_\_******

- [ ] **Brand Connection**
  - [ ] At least **1 Brand** created and connected
  - [ ] Brand has name, primary color, secondary color
  - [ ] Brand visible in Brand Selector / Workspace Switcher
  - Observed Result: ******\_\_\_\_******

- [ ] **Social OAuth Connection**
  - [ ] At least **1 social platform** connected (LinkedIn, Instagram, Facebook, Twitter, TikTok, YouTube)
  - [ ] OAuth tokens valid (not expired)
  - [ ] Verified in /linked-accounts page
  - Observed Result: ******\_\_\_\_******

- [ ] **Test Data**
  - [ ] **2 Draft Posts** (status: draft)
  - [ ] **1 Pending Approval Post** (status: reviewing, awaiting approval)
  - [ ] **1 Scheduled Post** (status: scheduled, with future date)
  - [ ] **1 Published Post** (status: published, with past date)
  - [ ] All test posts visible in /content-queue
  - Observed Result: ******\_\_\_\_******

---

## MODULE 1: Signup & Onboarding

### Route: `/onboarding` (7-screen flow)

**Goal:** Onboarding flow works end-to-end; state persists across refresh; final redirect to dashboard authenticated.

### Steps

#### Step 1: Entry Point

- [ ] **1.1** Visit `/` (logged out)
- [ ] **1.2** Click "Sign Up" button
- [ ] **1.3** Receive magic link or OAuth option
- Observed Result: ******\_\_\_\_******

#### Step 2: Screen 1 - Email / Auth

- [ ] **2.1** Enter valid email address: `newuser@test.com`
- [ ] **2.2** Click "Send Magic Link"
- [ ] **2.3** Verify inline validation shows no errors
- [ ] **2.4** Check email inbox for magic link
- [ ] **2.5** Click magic link in email
- [ ] **2.6** Redirected to Screen 2 (Role Selection)
- Observed Result: ******\_\_\_\_******

#### Step 3: Screen 2 - Role Selection

- [ ] **3.1** See role options: Creator / Approver / Admin
- [ ] **3.2** Select "Creator" role
- [ ] **3.3** Click "Next"
- [ ] **3.4** Advance to Screen 3 (Brand Basics)
- Observed Result: ******\_\_\_\_******

#### Step 4: Screen 3 - Brand Intake (Basics)

- [ ] **4.1** Enter Brand Name: "Test Brand ABC"
- [ ] **4.2** Enter Brand Description: "A test brand for QA"
- [ ] **4.3** Click "Next"
- [ ] **4.4** Advance to Voice & Visual section
- Observed Result: ******\_\_\_\_******

#### Step 5: Screen 3 (continued) - Voice & Visual

- [ ] **5.1** Select tone keyword: "Professional"
- [ ] **5.2** Select tone keyword: "Empowering"
- [ ] **5.3** Pick primary color: #0066CC
- [ ] **5.4** Pick secondary color: #FF6600
- [ ] **5.5** Click "Upload Logo" (optional, can skip)
- [ ] **5.6** Click "Next"
- [ ] **5.7** Advance to Screen 4 (Connect Accounts)
- Observed Result: ******\_\_\_\_******

#### Step 6: Screen 4 - Connect Accounts

- [ ] **6.1** See list of social platforms (LinkedIn, Instagram, Facebook, Twitter, TikTok, YouTube)
- [ ] **6.2** Click "Connect" on LinkedIn
- [ ] **6.3** OAuth redirect to LinkedIn
- [ ] **6.4** Authorize access (use test LinkedIn account)
- [ ] **6.5** Return to app
- [ ] **6.6** LinkedIn shows "Connected" badge with checkmark
- [ ] **6.7** Click "Next"
- [ ] **6.8** Advance to Screen 5 (Goals Setup)
- Observed Result: ******\_\_\_\_******

#### Step 7: Screen 5 - Goals Setup

- [ ] **7.1** Set monthly posting frequency: "12 posts/month"
- [ ] **7.2** Set engagement target: "500 likes/month" (optional)
- [ ] **7.3** Click "Next"
- [ ] **7.4** Advance to Screen 6 (Guided Tour)
- Observed Result: ******\_\_\_\_******

#### Step 8: Screen 6 - Guided Tour (Optional)

- [ ] **8.1** Tour overlay appears with tips
- [ ] **8.2** Click "Next" to view first tip
- [ ] **8.3** Click "Next" to view second tip
- [ ] **8.4** Click "Skip Tour" or complete all tips
- [ ] **8.5** Advance to Screen 7 (Completion)
- Observed Result: ******\_\_\_\_******

#### Step 9: Screen 7 - Completion / Dashboard Redirect

- [ ] **9.1** Final screen shows: "Welcome, [User Name]!"
- [ ] **9.2** Shows brand name: "Test Brand ABC"
- [ ] **9.3** Shows connected platforms: "LinkedIn"
- [ ] **9.4** Click "Go to Dashboard"
- [ ] **9.5** Redirected to `/dashboard`
- [ ] **9.6** Dashboard loads successfully
- [ ] **9.7** User is authenticated (check localStorage for JWT token)
- [ ] **9.8** Brand selector shows "Test Brand ABC"
- Observed Result: ******\_\_\_\_******

### Negative Test Cases

#### Negative 1: Invalid Email Format

- [ ] **N1.1** On Screen 1, enter invalid email: "notanemail"
- [ ] **N1.2** Click "Send Magic Link"
- [ ] **N1.3** Inline error appears: "Please enter a valid email address"
- [ ] **N1.4** Submit button disabled or shows error
- Observed Result: ******\_\_\_\_******

#### Negative 2: Empty Required Fields

- [ ] **N2.1** On Screen 3 (Brand Basics), leave Brand Name empty
- [ ] **N2.2** Click "Next"
- [ ] **N2.3** Error appears: "Brand Name is required"
- [ ] **N2.4** Cannot advance until field filled
- Observed Result: ******\_\_\_\_******

#### Negative 3: Page Refresh Mid-Flow

- [ ] **N3.1** Complete Screen 3 (Brand Basics)
- [ ] **N3.2** Refresh browser page (Ctrl+R)
- [ ] **N3.3** Page reloads at same screen (Screen 3)
- [ ] **N3.4** All previously entered data still present (Brand Name, Description)
- [ ] **N3.5** No data loss
- Observed Result: ******\_\_\_\_******

#### Negative 4: OAuth Connection Failure

- [ ] **N4.1** On Screen 4, click "Connect" for Instagram
- [ ] **N4.2** Deny OAuth permissions on Instagram
- [ ] **N4.3** Return to app
- [ ] **N4.4** Error toast appears: "Instagram connection failed"
- [ ] **N4.5** Instagram remains in "Not Connected" state
- [ ] **N4.6** Can retry connection
- Observed Result: ******\_\_\_\_******

### Mobile Responsive Testing

#### Viewport: 320px (iPhone SE)

- [ ] **M1.1** Set browser width to 320px
- [ ] **M1.2** All screens render without horizontal scroll
- [ ] **M1.3** Buttons are tappable (min 44px height)
- [ ] **M1.4** Text is readable (min 16px font size)
- [ ] **M1.5** Form inputs are full-width and tappable
- [ ] **M1.6** Navigation between screens works smoothly
- Observed Result: ******\_\_\_\_******

#### Viewport: 768px (iPad Portrait)

- [ ] **M2.1** Set browser width to 768px
- [ ] **M2.2** Layout adapts (no overflow or cut-off content)
- [ ] **M2.3** Brand color pickers visible and functional
- [ ] **M2.4** OAuth buttons properly sized
- Observed Result: ******\_\_\_\_******

#### Viewport: 1024px (iPad Landscape / Desktop)

- [ ] **M3.1** Set browser width to 1024px
- [ ] **M3.2** Layout uses available space efficiently
- [ ] **M3.3** Progress indicator visible (showing step 1-7)
- [ ] **M3.4** No layout shifts or jumps
- Observed Result: ******\_\_\_\_******

### Accessibility (WCAG AA) Testing

#### Focus Order & Keyboard Navigation

- [ ] **A1.1** Tab through onboarding screens
- [ ] **A1.2** Focus order is logical (top to bottom, left to right)
- [ ] **A1.3** All interactive elements receive focus
- [ ] **A1.4** Focus ring visible on all elements (min 2px, contrast >3:1)
- [ ] **A1.5** Enter key submits forms / advances screens
- [ ] **A1.6** Escape key cancels modals (if any)
- Observed Result: ******\_\_\_\_******

#### Labels & ARIA

- [ ] **A2.1** All inputs have associated labels (visible or aria-label)
- [ ] **A2.2** Error messages have role="alert" or aria-live
- [ ] **A2.3** Progress indicator has accessible name (e.g., "Step 3 of 7")
- [ ] **A2.4** Buttons have descriptive text (not just icons)
- Observed Result: ******\_\_\_\_******

#### Color Contrast

- [ ] **A3.1** Check primary button: contrast ratio >4.5:1
- [ ] **A3.2** Check body text: contrast ratio >4.5:1
- [ ] **A3.3** Check link text: contrast ratio >4.5:1
- [ ] **A3.4** Check disabled state: contrast ratio >3:1 (allowed for disabled)
- [ ] **A3.5** No color-only indicators (e.g., "Connected" has checkmark icon + text)
- Observed Result: ******\_\_\_\_******

### Evidence & Artifacts

**Required Screenshots/Videos:**

- [ ] Screen 1 (Email entry) — Desktop & 320px mobile
- [ ] Screen 3 (Brand Basics) — Filled form
- [ ] Screen 4 (OAuth Connected) — LinkedIn "Connected" badge
- [ ] Screen 7 (Completion) — Final screen before dashboard redirect
- [ ] Dashboard (post-onboarding) — Authenticated state

**Attach files:** (Upload to test-evidence/ folder or link)

- Screenshot 1: ******\_\_\_\_******
- Screenshot 2: ******\_\_\_\_******
- Video walkthrough: ******\_\_\_\_******

### Pass/Fail Criteria

✅ **PASS** if ALL of the following are true:

- [ ] Each step validates inputs (shows inline errors for invalid data)
- [ ] Refreshing mid-flow resumes at the correct step with data intact
- [ ] After final step, user lands on `/dashboard` with valid auth token
- [ ] No console errors or unhandled exceptions
- [ ] Mobile responsive (tested on 320px, 768px, 1024px)
- [ ] Keyboard navigation works (Tab, Enter, Esc)
- [ ] All WCAG AA checks pass (focus, labels, contrast)
- [ ] Negative test cases handled gracefully

❌ **FAIL** if ANY of the following occur:

- [ ] Data loss on page refresh
- [ ] Validation errors unclear or unhelpful
- [ ] Redirect to dashboard fails or shows 403/401
- [ ] OAuth connection times out or fails silently
- [ ] Console errors present
- [ ] Mobile layout breaks or requires horizontal scroll
- [ ] Focus order illogical or focus ring missing
- [ ] Contrast ratios below WCAG AA standards

**Final Result:** ☐ PASS | ☐ FAIL  
**Notes:** ******\_\_\_\_******

---

## MODULE 2: Brand Intake Questionnaire

### Route: `/onboarding` (Step 3 - 6 sections)

**Goal:** 6 sections of brand intake save as draft; final submit writes to database; review screen shows exact inputs.

### Steps

#### Section 1: Brand Basics

- [ ] **1.1** Navigate to `/brands/new` or onboarding Screen 3
- [ ] **1.2** Enter Brand Name: "QA Test Brand"
- [ ] **1.3** Enter Brand Description: "A brand for quality assurance testing purposes"
- [ ] **1.4** Enter Industry/Category: "Technology"
- [ ] **1.5** Click "Next"
- [ ] **1.6** Advance to Section 2 (Voice & Tone)
- Observed Result: ******\_\_\_\_******

#### Section 2: Voice & Tone

- [ ] **2.1** Select tone keyword: "Professional"
- [ ] **2.2** Select tone keyword: "Innovative"
- [ ] **2.3** Enter brand voice example: "We believe in empowering teams through cutting-edge technology."
- [ ] **2.4** Character count shows: "80 / 150 characters"
- [ ] **2.5** Click "Next"
- [ ] **2.6** Advance to Section 3 (Visual Identity)
- Observed Result: ******\_\_\_\_******

#### Section 3: Visual Identity

- [ ] **3.1** Click color picker for Primary Color
- [ ] **3.2** Select color: #2563EB (blue)
- [ ] **3.3** Click color picker for Secondary Color
- [ ] **3.4** Select color: #F59E0B (orange)
- [ ] **3.5** Click color picker for Accent Color (optional)
- [ ] **3.6** Select color: #10B981 (green)
- [ ] **3.7** Click "Upload Logo"
- [ ] **3.8** Select image file: `logo-test.png`
- [ ] **3.9** Logo preview appears
- [ ] **3.10** Click "Next"
- [ ] **3.11** Advance to Section 4 (Brand Preferences)
- Observed Result: ******\_\_\_\_******

#### Section 4: Brand Preferences

- [ ] **4.1** Check content type: "Blog"
- [ ] **4.2** Check content type: "Video"
- [ ] **4.3** Check content type: "Infographic"
- [ ] **4.4** Select posting frequency: "12 posts/month"
- [ ] **4.5** Select target audience: "B2B Tech Professionals"
- [ ] **4.6** Click "Next"
- [ ] **4.7** Advance to Section 5 (Compliance & Guidelines)
- Observed Result: ******\_\_\_\_******

#### Section 5: Compliance & Guidelines

- [ ] **5.1** Enter brand guidelines text: "Always use formal tone. Avoid slang."
- [ ] **5.2** Toggle "Content Approval Required": ON
- [ ] **5.3** Toggle "Brand Fidelity Check": ON
- [ ] **5.4** Click "Next"
- [ ] **5.5** Advance to Section 6 (Review & Submit)
- Observed Result: ******\_\_\_\_******

#### Section 6: Review & Submit

- [ ] **6.1** Review screen shows:
  - [ ] **6.1a** Brand Name: "QA Test Brand"
  - [ ] **6.1b** Description: "A brand for quality assurance testing purposes"
  - [ ] **6.1c** Industry: "Technology"
  - [ ] **6.1d** Tone keywords: "Professional, Innovative"
  - [ ] **6.1e** Voice example: (exact text entered)
  - [ ] **6.1f** Primary Color: #2563EB (blue swatch)
  - [ ] **6.1g** Secondary Color: #F59E0B (orange swatch)
  - [ ] **6.1h** Accent Color: #10B981 (green swatch)
  - [ ] **6.1i** Logo preview: `logo-test.png`
  - [ ] **6.1j** Content types: "Blog, Video, Infographic"
  - [ ] **6.1k** Posting frequency: "12 posts/month"
  - [ ] **6.1l** Target audience: "B2B Tech Professionals"
  - [ ] **6.1m** Guidelines: "Always use formal tone. Avoid slang."
  - [ ] **6.1n** Approval required: "Yes"
  - [ ] **6.1o** Fidelity check: "Yes"
- [ ] **6.2** All data matches exactly what was entered
- [ ] **6.3** Click "Edit Section 2" link
- [ ] **6.4** Return to Voice & Tone section
- [ ] **6.5** Change voice example to: "We empower teams with innovation."
- [ ] **6.6** Click "Next" until back to Review screen
- [ ] **6.7** Review screen shows updated voice example
- [ ] **6.8** Click "Submit"
- Observed Result: ******\_\_\_\_******

#### Post-Submit Verification

- [ ] **6.9** Toast appears: "Brand Created Successfully"
- [ ] **6.10** Redirected to `/brands` or brand detail page
- [ ] **6.11** New brand visible in brand list
- [ ] **6.12** Brand card shows: "QA Test Brand" with logo thumbnail
- [ ] **6.13** Click on brand to view detail
- [ ] **6.14** Detail page shows all entered data
- [ ] **6.15** Brand appears in Workspace Switcher dropdown
- Observed Result: ******\_\_\_\_******

### Negative Test Cases

#### Negative 1: Section Refresh - Data Persistence

- [ ] **N1.1** Complete Sections 1-3
- [ ] **N1.2** On Section 4, refresh browser page
- [ ] **N1.3** Page reloads at Section 4
- [ ] **N1.4** Data from Sections 1-3 still present
- [ ] **N1.5** Can view previous sections - data intact
- Observed Result: ******\_\_\_\_******

#### Negative 2: Submit with Backend Failure

- [ ] **N2.1** Complete all sections
- [ ] **N2.2** On Review screen, simulate network failure (DevTools: offline mode)
- [ ] **N2.3** Click "Submit"
- [ ] **N2.4** Error toast appears: "Failed to create brand. Please try again."
- [ ] **N2.5** User remains on Review screen with data intact
- [ ] **N2.6** Can retry after network restored
- Observed Result: ******\_\_\_\_******

#### Negative 3: Invalid Color Format

- [ ] **N3.1** On Section 3, enter invalid hex code: "#ZZZ"
- [ ] **N3.2** Color picker shows error or auto-corrects
- [ ] **N3.3** Cannot proceed with invalid color
- Observed Result: ******\_\_\_\_******

#### Negative 4: Missing Required Fields

- [ ] **N4.1** On Section 1, leave Brand Name empty
- [ ] **N4.2** Click "Next"
- [ ] **N4.3** Error message: "Brand Name is required"
- [ ] **N4.4** Cannot advance to Section 2
- Observed Result: ******\_\_\_\_******

### Mobile Responsive Testing

#### Viewport: 320px

- [ ] **M1.1** All 6 sections render without horizontal scroll
- [ ] **M1.2** Color pickers functional on mobile
- [ ] **M1.3** File upload button tappable
- [ ] **M1.4** Review screen shows all fields (stacked vertically)
- Observed Result: ******\_\_\_\_******

#### Viewport: 768px

- [ ] **M2.1** Layout adapts with proper spacing
- [ ] **M2.2** Section navigation visible
- [ ] **M2.3** Edit links functional
- Observed Result: ******\_\_\_\_******

#### Viewport: 1024px

- [ ] **M3.1** Side-by-side layout (if applicable)
- [ ] **M3.2** Progress indicator shows all 6 sections
- Observed Result: ******\_\_\_\_******

### Accessibility Testing

#### Focus & Keyboard

- [ ] **A1.1** Tab through all form fields in logical order
- [ ] **A1.2** Color picker accessible via keyboard (Enter to open, Arrows to select)
- [ ] **A1.3** File upload accessible via keyboard
- [ ] **A1.4** Enter key advances to next section
- Observed Result: ******\_\_\_\_******

#### Labels & Errors

- [ ] **A2.1** All inputs have visible labels
- [ ] **A2.2** Error messages have role="alert"
- [ ] **A2.3** Required fields marked with asterisk (\*) and aria-required="true"
- Observed Result: ******\_\_\_\_******

#### Contrast

- [ ] **A3.1** Form labels: contrast >4.5:1
- [ ] **A3.2** Helper text: contrast >4.5:1
- [ ] **A3.3** Error messages (red text): contrast >4.5:1
- Observed Result: ******\_\_\_\_******

### Evidence & Artifacts

**Required:**

- [ ] Section 3 (Visual Identity) — Color pickers filled
- [ ] Section 6 (Review) — Full review screen showing all data
- [ ] Brand list page — New brand visible
- [ ] Workspace Switcher — New brand in dropdown

**Attach:**

- Screenshot 1: ******\_\_\_\_******
- Screenshot 2: ******\_\_\_\_******
- Video: ******\_\_\_\_******

### API Verification

```bash
# After brand submission, verify database entry
curl -H "Authorization: Bearer $TOKEN" \
  https://alignedai20.vercel.app/api/brands

# Expected response:
# {
#   "data": [
#     {
#       "id": "...",
#       "name": "QA Test Brand",
#       "description": "A brand for quality assurance testing purposes",
#       "industry": "Technology",
#       "toneKeywords": ["Professional", "Innovative"],
#       "voiceExample": "We empower teams with innovation.",
#       "primaryColor": "#2563EB",
#       "secondaryColor": "#F59E0B",
#       "accentColor": "#10B981",
#       "logoUrl": "https://...",
#       "contentTypes": ["Blog", "Video", "Infographic"],
#       "postingFrequency": "12 posts/month",
#       "targetAudience": "B2B Tech Professionals",
#       "guidelines": "Always use formal tone. Avoid slang.",
#       "approvalRequired": true,
#       "fidelityCheckEnabled": true,
#       "createdAt": "2025-01-...",
#       "updatedAt": "2025-01-..."
#     }
#   ],
#   "count": 1
# }
```

- [ ] API returns new brand with all fields matching submitted data
- [ ] Status: 200 OK
- [ ] No missing fields

Observed Result: ******\_\_\_\_******

### Pass/Fail Criteria

✅ **PASS** if ALL of the following are true:

- [ ] Draft data persists between sections and across page refresh
- [ ] Final submit writes brand profile to database with all fields
- [ ] Brand appears in `/brands` page with correct details
- [ ] Review screen shows exact inputs (no truncation/modification)
- [ ] Edit and re-submit works without losing data
- [ ] Mobile responsive (320px, 768px, 1024px)
- [ ] Keyboard accessible
- [ ] WCAG AA contrast and labels met
- [ ] Negative test cases handled gracefully
- [ ] No console errors

❌ **FAIL** if ANY of the following occur:

- [ ] Data lost after refresh in any section
- [ ] Submit fails with 500 error
- [ ] Brand created but missing fields in database
- [ ] Review screen doesn't match submitted data
- [ ] Brand not visible in brand list
- [ ] Mobile layout broken
- [ ] Keyboard navigation broken
- [ ] Contrast ratios below WCAG AA

**Final Result:** ☐ PASS | ☐ FAIL  
**Notes:** ******\_\_\_\_******

---

## MODULE 3: Content Creation

### Route: `/creative-studio`

**Goal:** 5-step AI content generation works (topic → copy → design → brand check → publish/queue).

### Steps

#### Step 1: Topic & Setup

- [ ] **1.1** Navigate to `/creative-studio`
- [ ] **1.2** Page loads successfully
- [ ] **1.3** See "Create Content" form
- [ ] **1.4** Enter content topic: "Product Launch - New AI Feature"
- [ ] **1.5** Select target platform: "LinkedIn"
- [ ] **1.6** Select content type: "Post"
- [ ] **1.7** Click "Generate Copy"
- [ ] **1.8** Loading spinner appears
- Observed Result: ******\_\_\_\_******

#### Step 2: Copy Generation

- [ ] **2.1** Within 10 seconds, receive 3 copy variations
- [ ] **2.2** Variation 1 displays:
  - [ ] **2.2a** Title/Headline
  - [ ] **2.2b** Body text (80-150 words)
  - [ ] **2.2c** Hashtags (3-5)
  - [ ] **2.2d** Call-to-action
- [ ] **2.3** Variation 2 displays (different from Variation 1)
- [ ] **2.4** Variation 3 displays (different from Variations 1 & 2)
- [ ] **2.5** Click on Variation 2 to select
- [ ] **2.6** Variation 2 card highlights with border/background
- [ ] **2.7** "Selected" badge visible on Variation 2
- [ ] **2.8** Click "Next" or "Generate Design"
- [ ] **2.9** Advance to Design Template Selection
- Observed Result: ******\_\_\_\_******

#### Step 3: Design Template Selection

- [ ] **3.1** Loading spinner appears: "Generating design templates..."
- [ ] **3.2** Within 10 seconds, receive 3 design template options
- [ ] **3.3** Template 1 shows:
  - [ ] **3.3a** Thumbnail preview image
  - [ ] **3.3b** Template name (e.g., "Modern Gradient")
  - [ ] **3.3c** Preview includes selected copy text
- [ ] **3.4** Template 2 shows (different layout)
- [ ] **3.5** Template 3 shows (different layout)
- [ ] **3.6** Click on Template 1 to select
- [ ] **3.7** Template 1 highlights
- [ ] **3.8** Full preview renders with selected copy + template design
- [ ] **3.9** Click "Next" or "Run Brand Check"
- [ ] **3.10** Advance to Brand Fidelity Check
- Observed Result: ******\_\_\_\_******

#### Step 4: Brand Fidelity Check

- [ ] **4.1** Loading spinner: "Analyzing brand alignment..."
- [ ] **4.2** Within 10 seconds, brand intelligence result displays
- [ ] **4.3** Fidelity score shown: "Brand Alignment: 87/100"
- [ ] **4.4** Feedback list shown:
  - [ ] **4.4a** ✅ "Matches brand tone: Professional"
  - [ ] **4.4b** ✅ "Uses brand colors: Primary #2563EB"
  - [ ] **4.4c** ⚠️ "Consider adding brand hashtag: #YourBrand"
- [ ] **4.5** Full post preview visible with copy + design
- [ ] **4.6** Can click "Edit Copy" to return to Step 2
- [ ] **4.7** Can click "Change Design" to return to Step 3
- [ ] **4.8** Click "Proceed to Publish"
- [ ] **4.9** Advance to Publish or Queue
- Observed Result: ******\_\_\_\_******

#### Step 5: Publish or Queue

- [ ] **5.1** See two action buttons:
  - [ ] **5.1a** "Add to Queue" (saves as draft)
  - [ ] **5.1b** "Publish Now" (schedules for immediate or future)
- [ ] **5.2** Click "Add to Queue"
- [ ] **5.3** Toast appears: "Post added to queue as draft"
- [ ] **5.4** Navigate to `/content-queue`
- [ ] **5.5** Find newly created post in "Drafts" section
- [ ] **5.6** Post card shows:
  - [ ] **5.6a** Title: "Product Launch - New AI Feature"
  - [ ] **5.6b** Platform: LinkedIn
  - [ ] **5.6c** Status: Draft
  - [ ] **5.6d** Preview image (thumbnail of design)
  - [ ] **5.6e** Created timestamp
- Observed Result: ******\_\_\_\_******

#### Step 5 (Alternative): Publish Now

- [ ] **5.7** Repeat Steps 1-4 with different topic
- [ ] **5.8** On Step 5, click "Publish Now"
- [ ] **5.9** Scheduling modal opens
- [ ] **5.10** Options: "Immediate" / "Schedule for Later"
- [ ] **5.11** Select "Immediate"
- [ ] **5.12** Platform confirmation: "LinkedIn" (checked)
- [ ] **5.13** Click "Confirm Publish"
- [ ] **5.14** Toast: "Publishing to LinkedIn..."
- [ ] **5.15** Post status changes to "Publishing"
- [ ] **5.16** Within 30 seconds, status updates to "Published"
- [ ] **5.17** Post appears in `/content-queue` "Published" section
- Observed Result: ******\_\_\_\_******

### Negative Test Cases

#### Negative 1: AI Generation Timeout

- [ ] **N1.1** On Step 1, enter topic
- [ ] **N1.2** Click "Generate Copy"
- [ ] **N1.3** Simulate slow API (DevTools: throttle network to "Slow 3G")
- [ ] **N1.4** If API takes >30 seconds, timeout error appears
- [ ] **N1.5** Error message: "Generation timed out. Please try again."
- [ ] **N1.6** Can retry generation
- Observed Result: ******\_\_\_\_******

#### Negative 2: No Copy Variations Returned

- [ ] **N2.1** Simulate API error (return 0 variations)
- [ ] **N2.2** Error message: "Failed to generate copy. Please try again."
- [ ] **N2.3** Can retry or go back
- Observed Result: ******\_\_\_\_******

#### Negative 3: Brand Check Failure

- [ ] **N3.1** On Step 4, simulate low fidelity score (e.g., 30/100)
- [ ] **N3.2** Warning message: "⚠️ Low brand alignment. Review recommendations before publishing."
- [ ] **N3.3** Can still proceed or edit
- Observed Result: ******\_\_\_\_******

#### Negative 4: Empty Topic

- [ ] **N4.1** On Step 1, leave topic field empty
- [ ] **N4.2** Click "Generate Copy"
- [ ] **N4.3** Error: "Topic is required"
- [ ] **N4.4** Cannot proceed
- Observed Result: ******\_\_\_\_******

### Mobile Responsive Testing

#### Viewport: 320px

- [ ] **M1.1** All 5 steps render without horizontal scroll
- [ ] **M1.2** Copy variations stack vertically
- [ ] **M1.3** Design templates stack vertically
- [ ] **M1.4** Full preview scrollable
- [ ] **M1.5** Action buttons full-width
- Observed Result: ******\_\_\_\_******

#### Viewport: 768px

- [ ] **M2.1** Copy variations in 2-column grid (if space allows)
- [ ] **M2.2** Design templates in 2-column grid
- [ ] **M2.3** Brand fidelity score prominent
- Observed Result: ******\_\_\_\_******

#### Viewport: 1024px

- [ ] **M3.1** Copy variations in 3-column grid
- [ ] **M3.2** Design templates in 3-column grid
- [ ] **M3.3** Full preview shown side-by-side with feedback
- Observed Result: ******\_\_\_\_******

### Accessibility Testing

#### Focus & Keyboard

- [ ] **A1.1** Tab through copy variations (cards focusable)
- [ ] **A1.2** Enter key selects copy variation
- [ ] **A1.3** Tab through design templates (cards focusable)
- [ ] **A1.4** Enter key selects design template
- [ ] **A1.5** "Next" button accessible via keyboard
- Observed Result: ******\_\_\_\_******

#### Labels & ARIA

- [ ] **A2.1** Topic input has label: "Content Topic"
- [ ] **A2.2** Platform dropdown has label: "Target Platform"
- [ ] **A2.3** Loading spinner has role="status" and aria-live="polite"
- [ ] **A2.4** Brand fidelity score has accessible description
- Observed Result: ******\_\_\_\_******

#### Contrast

- [ ] **A3.1** Copy variation cards: contrast >3:1 (large text)
- [ ] **A3.2** Selected card border: contrast >3:1
- [ ] **A3.3** Brand fidelity score (large text): contrast >4.5:1
- [ ] **A3.4** Feedback list text: contrast >4.5:1
- Observed Result: ******\_\_\_\_******

### Evidence & Artifacts

**Required:**

- [ ] Step 2: 3 copy variations displayed
- [ ] Step 3: 3 design templates displayed
- [ ] Step 4: Brand fidelity check result with score
- [ ] Step 5: Post in `/content-queue` Drafts section
- [ ] Alternative: Post published and in "Published" section

**Attach:**

- Screenshot 1: ******\_\_\_\_******
- Screenshot 2: ******\_\_\_\_******
- Video walkthrough: ******\_\_\_\_******

### API Verification

```bash
# After adding post to queue, verify via API
curl -H "Authorization: Bearer $TOKEN" \
  https://alignedai20.vercel.app/api/publishing/queue?status=draft

# Expected response:
# {
#   "data": [
#     {
#       "id": "...",
#       "title": "Product Launch - New AI Feature",
#       "platform": "linkedin",
#       "status": "draft",
#       "contentType": "post",
#       "copy": "...",
#       "designTemplateId": "...",
#       "brandFidelityScore": 87,
#       "createdAt": "2025-01-..."
#     }
#   ],
#   "count": 1
# }
```

- [ ] API returns new draft post
- [ ] Status: 200 OK
- [ ] All fields present

Observed Result: ******\_\_\_\_******

### Pass/Fail Criteria

✅ **PASS** if ALL of the following are true:

- [ ] 3 copy variations return within 10 seconds (no timeout)
- [ ] 3 design templates return within 10 seconds
- [ ] Selected copy + design combo renders accurately in preview
- [ ] Brand fidelity score calculated and displayed (0-100)
- [ ] "Add to Queue" creates item visible in `/content-queue` Drafts
- [ ] "Publish Now" enqueues post for multi-platform publishing
- [ ] Mobile responsive (320px, 768px, 1024px)
- [ ] Keyboard accessible
- [ ] WCAG AA compliance
- [ ] Negative test cases handled gracefully
- [ ] No console errors; all API calls successful

❌ **FAIL** if ANY of the following occur:

- [ ] API timeouts on copy or design generation (>30s)
- [ ] Only 1-2 options returned instead of 3
- [ ] Preview doesn't match selected copy/design
- [ ] Queue add fails with error
- [ ] Post not visible in `/content-queue` after creation
- [ ] Mobile layout broken
- [ ] Keyboard navigation broken
- [ ] Contrast issues

**Final Result:** ☐ PASS | ☐ FAIL  
**Notes:** ******\_\_\_\_******

---

## MODULE 4: Approval Workflow

### Route: `/approvals`

**Goal:** Request approval → review → approve/reject → escalation for delayed items.

### Steps

#### Step 1: Request Approval

- [ ] **1.1** Navigate to `/content-queue`
- [ ] **1.2** Find draft post: "Test Post for Approval"
- [ ] **1.3** Click on post card to open detail
- [ ] **1.4** Click "Request Approval" button
- [ ] **1.5** Modal opens with title: "Request Approval"
- [ ] **1.6** See comment field: "Add a message for reviewers (optional)"
- [ ] **1.7** Enter comment: "Please review this for the Q1 campaign launch"
- [ ] **1.8** Click "Request" button
- [ ] **1.9** Modal closes
- [ ] **1.10** Toast appears: "Approval requested"
- [ ] **1.11** Post status badge changes to "Reviewing" (yellow/orange)
- [ ] **1.12** Post card shows timestamp: "Requested 1 minute ago"
- Observed Result: ******\_\_\_\_******

#### Step 2: Approval Queue View

- [ ] **2.1** Navigate to `/approvals`
- [ ] **2.2** See "Pending Approvals" section header
- [ ] **2.3** Post card visible with:
  - [ ] **2.3a** Title: "Test Post for Approval"
  - [ ] **2.3b** Preview image/thumbnail
  - [ ] **2.3c** Platform badge: "LinkedIn"
  - [ ] **2.3d** Requester name: "Admin User"
  - [ ] **2.3e** Timestamp: "Requested 1 minute ago"
  - [ ] **2.3f** Comment icon with count: "1 comment"
  - [ ] **2.3g** Two action buttons: "Approve" (green) and "Reject" (red)
- [ ] **2.4** Click on post card
- [ ] **2.5** Expanded detail view opens showing full content + comments
- Observed Result: ******\_\_\_\_******

#### Step 3: Approval Actions - Approve Path

- [ ] **3.1** In expanded view, see "Approve" button
- [ ] **3.2** Click "Approve"
- [ ] **3.3** Confirmation dialog appears: "Approve this post?"
- [ ] **3.4** Click "Confirm"
- [ ] **3.5** Toast: "Post approved"
- [ ] **3.6** Post status changes to "Scheduled"
- [ ] **3.7** Post disappears from `/approvals` Pending section
- [ ] **3.8** Navigate to `/content-queue`
- [ ] **3.9** Post now in "Scheduled" section
- [ ] **3.10** Comment thread shows: "✅ Approved by Admin User" with timestamp
- Observed Result: ******\_\_\_\_******

#### Step 4: Approval Actions - Reject Path

- [ ] **4.1** Request approval on second draft post: "Test Post for Rejection"
- [ ] **4.2** Navigate to `/approvals`
- [ ] **4.3** Find post: "Test Post for Rejection"
- [ ] **4.4** Click "Reject" button
- [ ] **4.5** Modal opens: "Request Changes"
- [ ] **4.6** See rejection reason field (required)
- [ ] **4.7** Enter reason: "Headline tone doesn't match brand voice. Please make it more professional."
- [ ] **4.8** Click "Reject" button
- [ ] **4.9** Toast: "Feedback sent. Post returned to draft."
- [ ] **4.10** Post disappears from `/approvals`
- [ ] **4.11** Navigate to `/content-queue`
- [ ] **4.12** Post back in "Drafts" section
- [ ] **4.13** Status badge: "Draft" (gray)
- [ ] **4.14** Comment thread shows: "❌ Changes requested by Admin User: Headline tone doesn't match brand voice..."
- Observed Result: ******\_\_\_\_******

#### Step 5: Comments & Real-Time Updates

- [ ] **5.1** Request approval on third post: "Test Post for Comments"
- [ ] **5.2** Navigate to `/approvals`
- [ ] **5.3** Open post detail
- [ ] **5.4** See initial comment: "Please review this for the Q1 campaign launch"
- [ ] **5.5** Scroll to comment thread
- [ ] **5.6** Add new comment: "Updated the headline based on feedback"
- [ ] **5.7** Click "Post Comment"
- [ ] **5.8** Comment appears immediately in thread (optimistic UI)
- [ ] **5.9** Comment shows: username, timestamp, text
- [ ] **5.10** Open another browser/incognito window (simulate different user)
- [ ] **5.11** Navigate to same post in `/approvals`
- [ ] **5.12** Within 5 seconds (WebSocket) or 10 seconds (polling), new comment visible
- Observed Result: ******\_\_\_\_******

#### Step 6: Escalation (Delayed Item)

- [ ] **6.1** Create a pending approval item (or use existing)
- [ ] **6.2** Simulate time passing >24 hours (or set system clock forward)
- [ ] **6.3** Navigate to `/approvals`
- [ ] **6.4** Find post that has been pending >24 hours
- [ ] **6.5** Post card shows escalation badge: "🔴 Urgent" or "⏰ Overdue"
- [ ] **6.6** Timestamp shows: "Requested 2 days ago"
- [ ] **6.7** Check email inbox for escalation notification (if enabled)
- [ ] **6.8** Email subject: "Approval Overdue: [Post Title]"
- Observed Result: ******\_\_\_\_******

### Negative Test Cases

#### Negative 1: Request Approval Without Comment

- [ ] **N1.1** Open draft post
- [ ] **N1.2** Click "Request Approval"
- [ ] **N1.3** Leave comment field empty
- [ ] **N1.4** Click "Request"
- [ ] **N1.5** Request succeeds (comment is optional)
- [ ] **N1.6** Post status changes to "Reviewing"
- Observed Result: ******\_\_\_\_******

#### Negative 2: Reject Without Reason

- [ ] **N2.1** In `/approvals`, click "Reject" on pending post
- [ ] **N2.2** Modal opens
- [ ] **N2.3** Leave rejection reason field empty
- [ ] **N2.4** Click "Reject"
- [ ] **N2.5** Error: "Rejection reason is required"
- [ ] **N2.6** Cannot submit without reason
- Observed Result: ******\_\_\_\_******

#### Negative 3: API Failure on Approval

- [ ] **N3.1** Open pending approval
- [ ] **N3.2** Click "Approve"
- [ ] **N3.3** Simulate network failure (offline mode)
- [ ] **N3.4** Error toast: "Failed to approve post. Please try again."
- [ ] **N3.5** Post remains in "Reviewing" status
- [ ] **N3.6** Can retry after network restored
- Observed Result: ******\_\_\_\_******

#### Negative 4: Duplicate Approval Request

- [ ] **N4.1** Request approval on a post already in "Reviewing" status
- [ ] **N4.2** "Request Approval" button disabled or hidden
- [ ] **N4.3** Cannot double-request approval
- Observed Result: ******\_\_\_\_******

### Mobile Responsive Testing

#### Viewport: 320px

- [ ] **M1.1** Approval cards stack vertically
- [ ] **M1.2** Action buttons ("Approve", "Reject") full-width and tappable
- [ ] **M1.3** Comment thread readable
- [ ] **M1.4** Post detail scrollable without horizontal scroll
- Observed Result: ******\_\_\_\_******

#### Viewport: 768px

- [ ] **M2.1** Approval cards in 2-column grid (if space allows)
- [ ] **M2.2** Action buttons side-by-side
- [ ] **M2.3** Comment thread visible in sidebar or panel
- Observed Result: ******\_\_\_\_******

#### Viewport: 1024px

- [ ] **M3.1** Approval cards in 3-column grid
- [ ] **M3.2** Full detail view with comments in side panel
- [ ] **M3.3** Escalation badges prominent
- Observed Result: ******\_\_\_\_******

### Accessibility Testing

#### Focus & Keyboard

- [ ] **A1.1** Tab through approval cards
- [ ] **A1.2** Enter key opens post detail
- [ ] **A1.3** Tab to "Approve" button, press Enter → approval action
- [ ] **A1.4** Tab to "Reject" button, press Enter → rejection modal
- [ ] **A1.5** Escape key closes modals
- Observed Result: ******\_\_\_\_******

#### Labels & ARIA

- [ ] **A2.1** "Request Approval" button has accessible label
- [ ] **A2.2** Comment field has label: "Add a comment"
- [ ] **A2.3** Rejection reason field has label: "Reason for rejection"
- [ ] **A2.4** Status badges have accessible text (not color-only)
- [ ] **A2.5** Escalation badge has aria-label: "Urgent - overdue 2 days"
- Observed Result: ******\_\_\_\_******

#### Contrast

- [ ] **A3.1** "Approve" button (green): contrast >4.5:1
- [ ] **A3.2** "Reject" button (red): contrast >4.5:1
- [ ] **A3.3** Status badges: contrast >4.5:1
- [ ] **A3.4** Comment text: contrast >4.5:1
- Observed Result: ******\_\_\_\_******

### Evidence & Artifacts

**Required:**

- [ ] Approval request modal with comment
- [ ] `/approvals` page showing pending items
- [ ] Approve action → post moved to Scheduled
- [ ] Reject action → post returned to Draft with feedback
- [ ] Comment thread with multiple comments
- [ ] Escalation badge on overdue post

**Attach:**

- Screenshot 1: ******\_\_\_\_******
- Screenshot 2: ******\_\_\_\_******
- Video: ******\_\_\_\_******

### API Verification

```bash
# Request approval via API
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"postId": "123", "comment": "Please review"}' \
  https://alignedai20.vercel.app/api/approvals/request

# Expected response:
# {
#   "success": true,
#   "approvalId": "...",
#   "postId": "123",
#   "status": "pending",
#   "requestedAt": "2025-01-..."
# }

# Get pending approvals
curl -H "Authorization: Bearer $TOKEN" \
  https://alignedai20.vercel.app/api/approvals?status=pending

# Expected response:
# {
#   "data": [
#     {
#       "id": "...",
#       "postId": "123",
#       "title": "Test Post for Approval",
#       "requestedBy": "Admin User",
#       "requestedAt": "2025-01-...",
#       "status": "pending",
#       "comments": [
#         { "userId": "...", "text": "Please review", "createdAt": "..." }
#       ]
#     }
#   ],
#   "count": 1
# }

# Approve post via API
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  https://alignedai20.vercel.app/api/approvals/123/approve

# Expected response:
# {
#   "success": true,
#   "postId": "123",
#   "status": "scheduled"
# }
```

- [ ] All API calls return expected responses
- [ ] Status changes persist in database
- [ ] Comments stored correctly

Observed Result: ******\_\_\_\_******

### Pass/Fail Criteria

✅ **PASS** if ALL of the following are true:

- [ ] Request Approval changes status to "reviewing" and saves comment
- [ ] Pending items visible in `/approvals` with all expected fields
- [ ] Approve action moves item to "scheduled" and updates database
- [ ] Reject action returns item to "draft" with reason stored
- [ ] Comments display in real-time (or within 10s polling)
- [ ] Escalation badge shows for items >24h pending
- [ ] Mobile responsive (320px, 768px, 1024px)
- [ ] Keyboard accessible
- [ ] WCAG AA compliance
- [ ] Negative test cases handled
- [ ] No console errors; all state changes logged

❌ **FAIL** if ANY of the following occur:

- [ ] Status change fails or doesn't persist
- [ ] Comments not visible on reload
- [ ] Approve/Reject actions show error toast
- [ ] Escalation not triggered after 24h
- [ ] Approval post not visible in queue after approval
- [ ] Mobile layout broken
- [ ] Keyboard navigation broken
- [ ] Contrast issues

**Final Result:** ☐ PASS | ☐ FAIL  
**Notes:** ******\_\_\_\_******

---

## MODULE 5: Publishing

### Route: `/content-queue` → Backend Publishing Queue

**Goal:** Multi-platform publish enqueued; status tracked; reschedule works; published posts visible.

### Steps

#### Step 1: Publish Now Action

- [ ] **1.1** Navigate to `/content-queue`
- [ ] **1.2** Find post with status: "Scheduled" (title: "Test Scheduled Post")
- [ ] **1.3** Click on post card to open detail
- [ ] **1.4** Click "Publish Now" button
- [ ] **1.5** Confirmation modal opens: "Publish to Platforms"
- [ ] **1.6** See platforms list:
  - [ ] **1.6a** ✅ LinkedIn (checked)
  - [ ] **1.6b** ✅ Instagram (checked)
  - [ ] **1.6c** ☐ Twitter (unchecked, not connected)
- [ ] **1.7** See scheduling option: "Immediately" (selected by default)
- [ ] **1.8** Click "Confirm Publish"
- [ ] **1.9** Modal closes
- [ ] **1.10** Toast: "Publishing to 2 platforms..."
- Observed Result: ******\_\_\_\_******

#### Step 2: Job Enqueuing & Status

- [ ] **2.1** Post status immediately changes to "Publishing" (blue/yellow badge)
- [ ] **2.2** Post card shows spinner icon or progress indicator
- [ ] **2.3** Post detail shows job ID: "pub_abc123xyz"
- [ ] **2.4** Status text: "Publishing to LinkedIn, Instagram..."
- [ ] **2.5** Wait up to 30 seconds
- [ ] **2.6** Status updates to "Published" (green badge)
- [ ] **2.7** Spinner disappears
- [ ] **2.8** Post moves from "Scheduled" section to "Published" section
- [ ] **2.9** Published timestamp visible: "Published 1 minute ago"
- Observed Result: ******\_\_\_\_******

#### Step 3: Published Post Details

- [ ] **3.1** In "Published" section, find post: "Test Scheduled Post"
- [ ] **3.2** Click on post to open detail
- [ ] **3.3** Verify fields:
  - [ ] **3.3a** Status: "Published" (green badge)
  - [ ] **3.3b** Published date/time: "Jan 15, 2025 at 10:30 AM"
  - [ ] **3.3c** Platform links section visible
  - [ ] **3.3d** LinkedIn link: "https://linkedin.com/feed/update/urn:li:share:..."
  - [ ] **3.3e** Instagram link: "https://instagram.com/p/..."
  - [ ] **3.3f** Engagement metrics (if available): "12 likes, 3 comments"
- [ ] **3.4** Click LinkedIn link
- [ ] **3.5** Opens in new tab
- [ ] **3.6** Correct LinkedIn post loads
- Observed Result: ******\_\_\_\_******

#### Step 4: Reschedule (Drag-Drop in Calendar)

- [ ] **4.1** Navigate to `/calendar`
- [ ] **4.2** Find "Scheduled Post" in calendar grid (e.g., Jan 20, 2025)
- [ ] **4.3** Click and hold on post tile
- [ ] **4.4** Drag post to new date (e.g., Jan 23, 2025)
- [ ] **4.5** Optimistic UI: post immediately moves to Jan 23
- [ ] **4.6** Drop post on new date
- [ ] **4.7** Toast: "Post rescheduled to Jan 23, 2025"
- [ ] **4.8** Post tile now on Jan 23 in calendar
- [ ] **4.9** Refresh page
- [ ] **4.10** Post still on Jan 23 (persisted in database)
- [ ] **4.11** Navigate to `/content-queue`
- [ ] **4.12** Open post detail
- [ ] **4.13** Scheduled date shows: "Jan 23, 2025 at [original time]"
- Observed Result: ******\_\_\_\_******

#### Step 5: Publishing Logs (Optional)

- [ ] **5.1** In published post detail, see "Publishing Logs" tab or section
- [ ] **5.2** Click "Publishing Logs"
- [ ] **5.3** See log entries:
  - [ ] **5.3a** LinkedIn: "✅ Published successfully at 10:30 AM"
  - [ ] **5.3b** Instagram: "✅ Published successfully at 10:31 AM"
  - [ ] **5.3c** (If any failed) Twitter: "❌ Failed: OAuth token expired"
- [ ] **5.4** For failed platform, see "Retry" button
- [ ] **5.5** Click "Retry"
- [ ] **5.6** Retry in progress
- [ ] **5.7** Log updates: "⏳ Retrying..."
- Observed Result: ******\_\_\_\_******

### Negative Test Cases

#### Negative 1: Publish with Expired OAuth Token

- [ ] **N1.1** Revoke OAuth token for LinkedIn (via LinkedIn settings)
- [ ] **N1.2** Attempt to publish post to LinkedIn
- [ ] **N1.3** Click "Publish Now"
- [ ] **N1.4** Job starts, status "Publishing"
- [ ] **N1.5** Within 30 seconds, status changes to "Failed"
- [ ] **N1.6** Error toast: "Publishing failed for LinkedIn: OAuth token expired"
- [ ] **N1.7** Post detail shows error message
- [ ] **N1.8** Publishing logs show: "❌ LinkedIn: OAuth token expired"
- [ ] **N1.9** Can click "Reconnect LinkedIn" to re-authorize
- Observed Result: ******\_\_\_\_******

#### Negative 2: Network Failure During Publish

- [ ] **N2.1** Start publish action
- [ ] **N2.2** Immediately go offline (DevTools: offline mode)
- [ ] **N2.3** Job enqueued but cannot complete
- [ ] **N2.4** Status remains "Publishing" or times out to "Failed"
- [ ] **N2.5** Error: "Network error. Please try again."
- [ ] **N2.6** Can retry when back online
- Observed Result: ******\_\_\_\_******

#### Negative 3: Reschedule to Past Date

- [ ] **N3.1** In calendar, drag scheduled post to past date (e.g., Jan 1, 2025)
- [ ] **N3.2** Drop post
- [ ] **N3.3** Error toast: "Cannot schedule post in the past"
- [ ] **N3.4** Post returns to original date
- [ ] **N3.5** No database update
- Observed Result: ******\_\_\_\_******

#### Negative 4: Publish with No Platforms Connected

- [ ] **N4.1** Disconnect all social platforms (or use account with no connections)
- [ ] **N4.2** Attempt to publish post
- [ ] **N4.3** Click "Publish Now"
- [ ] **N4.4** Modal shows: "No platforms connected"
- [ ] **N4.5** "Confirm Publish" button disabled
- [ ] **N4.6** Error message: "Please connect at least one platform to publish"
- Observed Result: ******\_\_\_\_******

### Mobile Responsive Testing

#### Viewport: 320px

- [ ] **M1.1** Publish modal renders without horizontal scroll
- [ ] **M1.2** Platform checkboxes tappable
- [ ] **M1.3** "Confirm Publish" button full-width
- [ ] **M1.4** Published post details scrollable
- [ ] **M1.5** Platform links tappable (not overlapping)
- Observed Result: ******\_\_\_\_******

#### Viewport: 768px

- [ ] **M2.1** Publish modal centered and readable
- [ ] **M2.2** Publishing logs table readable
- [ ] **M2.3** Calendar drag-drop functional on tablet
- Observed Result: ******\_\_\_\_******

#### Viewport: 1024px

- [ ] **M3.1** Calendar grid shows full month
- [ ] **M3.2** Drag-drop smooth and responsive
- [ ] **M3.3** Published post detail shows all sections without scroll
- Observed Result: ******\_\_\_\_******

### Accessibility Testing

#### Focus & Keyboard

- [ ] **A1.1** "Publish Now" button accessible via Tab
- [ ] **A1.2** Platform checkboxes accessible via keyboard (Space to toggle)
- [ ] **A1.3** "Confirm Publish" button accessible via Enter
- [ ] **A1.4** Calendar drag-drop has keyboard alternative (select + arrow keys to move)
- Observed Result: ******\_\_\_\_******

#### Labels & ARIA

- [ ] **A2.1** Publish modal has role="dialog" and aria-labelledby
- [ ] **A2.2** Platform checkboxes have labels: "Publish to LinkedIn"
- [ ] **A2.3** Status badges have accessible text (not color-only)
- [ ] **A2.4** Publishing logs have role="table" with th/td structure
- Observed Result: ******\_\_\_\_******

#### Contrast

- [ ] **A3.1** "Publishing" status badge (blue): contrast >4.5:1
- [ ] **A3.2** "Published" status badge (green): contrast >4.5:1
- [ ] **A3.3** "Failed" status badge (red): contrast >4.5:1
- [ ] **A3.4** Platform link text (blue underline): contrast >4.5:1
- Observed Result: ******\_\_\_\_******

### Evidence & Artifacts

**Required:**

- [ ] Publish modal showing platform selection
- [ ] Post in "Publishing" status with spinner
- [ ] Post in "Published" section with platform links
- [ ] Calendar drag-drop reschedule (before/after)
- [ ] Publishing logs with success and failure entries

**Attach:**

- Screenshot 1: ******\_\_\_\_******
- Screenshot 2: ******\_\_\_\_******
- Video: ******\_\_\_\_******

### API Verification

```bash
# Publish post via API
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"postId": "123", "platforms": ["linkedin", "instagram"], "scheduledAt": "immediate"}' \
  https://alignedai20.vercel.app/api/publishing/publish

# Expected response:
# {
#   "success": true,
#   "jobId": "pub_abc123xyz",
#   "postId": "123",
#   "status": "publishing",
#   "platforms": ["linkedin", "instagram"]
# }

# Get job status
curl -H "Authorization: Bearer $TOKEN" \
  https://alignedai20.vercel.app/api/publishing/jobs/pub_abc123xyz

# Expected response:
# {
#   "jobId": "pub_abc123xyz",
#   "status": "completed",
#   "results": [
#     {
#       "platform": "linkedin",
#       "status": "success",
#       "postUrl": "https://linkedin.com/feed/update/...",
#       "publishedAt": "2025-01-15T10:30:00Z"
#     },
#     {
#       "platform": "instagram",
#       "status": "success",
#       "postUrl": "https://instagram.com/p/...",
#       "publishedAt": "2025-01-15T10:31:00Z"
#     }
#   ]
# }

# Reschedule via API
curl -X PATCH -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scheduledAt": "2025-01-23T10:00:00Z"}' \
  https://alignedai20.vercel.app/api/posts/123/reschedule

# Expected response:
# {
#   "success": true,
#   "postId": "123",
#   "scheduledAt": "2025-01-23T10:00:00Z"
# }
```

- [ ] All API calls return expected responses
- [ ] Job status updates correctly
- [ ] Platform URLs returned and valid

Observed Result: ******\_\_\_\_******

### Pass/Fail Criteria

✅ **PASS** if ALL of the following are true:

- [ ] Publish Now enqueues job and returns job ID
- [ ] Post status updates from "scheduled" → "publishing" → "published"
- [ ] Published post visible in `/content-queue` Published section
- [ ] Platform links are correct and clickable
- [ ] Drag-drop reschedule updates scheduled_at and persists
- [ ] No orphaned jobs or hung statuses
- [ ] Mobile responsive (320px, 768px, 1024px)
- [ ] Keyboard accessible
- [ ] WCAG AA compliance
- [ ] Negative test cases handled
- [ ] All API calls return 200/success

❌ **FAIL** if ANY of the following occur:

- [ ] Publish fails with 500 error
- [ ] Status never updates to "published"
- [ ] Platform links are broken or incorrect
- [ ] Reschedule doesn't persist after refresh
- [ ] Publishing logs missing or show false errors
- [ ] Mobile layout broken
- [ ] Keyboard navigation broken
- [ ] Contrast issues

**Final Result:** ☐ PASS | ☐ FAIL  
**Notes:** ******\_\_\_\_******

---

## MODULE 6: Analytics Insights

### Route: `/analytics`

**Goal:** Metrics render with filters; insights generate; goals persist.

### Steps

#### Step 1: Platform Tab Switching

- [ ] **1.1** Navigate to `/analytics`
- [ ] **1.2** Page loads successfully
- [ ] **1.3** See platform tabs: Instagram / TikTok / LinkedIn / Twitter / Facebook / YouTube
- [ ] **1.4** Default tab selected: Instagram (highlighted)
- [ ] **1.5** See KPI cards:
  - [ ] **1.5a** "Reach": "12,345"
  - [ ] **1.5b** "Engagement Rate": "3.5%"
  - [ ] **1.5c** "Followers": "1,234"
  - [ ] **1.5d** "Posts Published": "15"
- [ ] **1.6** See line chart: "Engagement Over Time" with x-axis (dates) and y-axis (engagement %)
- [ ] **1.7** Chart shows last 7 days of data
- Observed Result: ******\_\_\_\_******

#### Step 2: Platform Filter

- [ ] **2.1** Click "TikTok" tab
- [ ] **2.2** Tab highlights (active state)
- [ ] **2.3** KPI values update:
  - [ ] **2.3a** "Reach": "8,900"
  - [ ] **2.3b** "Engagement Rate": "5.2%"
  - [ ] **2.3c** "Followers": "890"
  - [ ] **2.3d** "Posts Published": "10"
- [ ] **2.4** Line chart updates with TikTok data
- [ ] **2.5** Chart x-axis shows last 7 days
- [ ] **2.6** Chart y-axis range adjusts to TikTok engagement values
- [ ] **2.7** No console errors
- [ ] **2.8** API call visible in Network tab: `/api/analytics/metrics?platform=tiktok&days=7`
- Observed Result: ******\_\_\_\_******

#### Step 3: Date Range Filter

- [ ] **3.1** See date range buttons: "7d" / "30d" / "90d" / "Custom"
- [ ] **3.2** Default selected: "7d" (highlighted)
- [ ] **3.3** Click "30d" button
- [ ] **3.4** Button highlights
- [ ] **3.5** KPI values update (reflecting 30 days of data)
- [ ] **3.6** Chart updates: x-axis shows last 30 days
- [ ] **3.7** API call: `/api/analytics/metrics?platform=tiktok&days=30`
- [ ] **3.8** Click "Custom" button
- [ ] **3.9** Date picker modal opens
- [ ] **3.10** Select start date: "Dec 1, 2024"
- [ ] **3.11** Select end date: "Dec 15, 2024"
- [ ] **3.12** Click "Apply"
- [ ] **3.13** Modal closes
- [ ] **3.14** KPIs and chart update for Dec 1-15 date range
- [ ] **3.15** URL updates: `?platform=tiktok&startDate=2024-12-01&endDate=2024-12-15`
- Observed Result: ******\_\_\_\_******

#### Step 4: AI Insights

- [ ] **4.1** Scroll to "Get AI Insights" section
- [ ] **4.2** Click "Generate Insights" button
- [ ] **4.3** Button shows loading spinner: "Analyzing data..."
- [ ] **4.4** Button disabled during loading
- [ ] **4.5** Within 10 seconds, insights panel appears
- [ ] **4.6** See insights list:
  - [ ] **4.6a** "📈 Engagement increased by 15% vs. last period"
  - [ ] **4.6b** "⏰ Best posting times: Tuesday-Thursday, 9-11 AM"
  - [ ] **4.6c** "🎯 Video content outperforms images by 22%"
  - [ ] **4.6d** "💡 Consider adding more hashtags (avg: 2, recommended: 5)"
- [ ] **4.7** Each insight formatted as card or bullet point
- [ ] **4.8** Can click "Close Insights" or "X" to dismiss panel
- [ ] **4.9** Panel closes smoothly
- Observed Result: ******\_\_\_\_******

#### Step 5: Goals Setup

- [ ] **5.1** Scroll to "Goals" section (card or widget)
- [ ] **5.2** See "Set Goal" or "+" button
- [ ] **5.3** Click "Set Goal"
- [ ] **5.4** Modal opens: "Create New Goal"
- [ ] **5.5** Enter goal name: "Reach 1000 Followers by Q1"
- [ ] **5.6** Select goal type: "Followers"
- [ ] **5.7** Enter target number: "1000"
- [ ] **5.8** Select deadline: "Mar 31, 2025"
- [ ] **5.9** Click "Save Goal"
- [ ] **5.10** Modal closes
- [ ] **5.11** Toast: "Goal created successfully"
- [ ] **5.12** Goal card appears in "Goals" section
- [ ] **5.13** Card shows:
  - [ ] **5.13a** Goal name: "Reach 1000 Followers by Q1"
  - [ ] **5.13b** Progress bar: "89 / 1000 (8.9%)"
  - [ ] **5.13c** Deadline: "Mar 31, 2025"
- [ ] **5.14** Refresh page
- [ ] **5.15** Goal card still visible (persisted in database)
- Observed Result: ******\_\_\_\_******

#### Step 6: Top Posts & Engagement Table

- [ ] **6.1** Scroll to "Top Posts" section
- [ ] **6.2** See table with columns:
  - [ ] **6.2a** "Post Title"
  - [ ] **6.2b** "Platform"
  - [ ] **6.2c** "Likes"
  - [ ] **6.2d** "Comments"
  - [ ] **6.2e** "Shares"
  - [ ] **6.2f** "Engagement %"
- [ ] **6.3** Rows sorted by engagement (highest first)
- [ ] **6.4** First row example:
  - [ ] **6.4a** Title: "Product Launch Video"
  - [ ] **6.4b** Platform: "TikTok"
  - [ ] **6.4c** Likes: "523"
  - [ ] **6.4d** Comments: "87"
  - [ ] **6.4e** Shares: "34"
  - [ ] **6.4f** Engagement: "5.8%"
- [ ] **6.5** Click on post row
- [ ] **6.6** Opens post detail modal or navigates to post page
- Observed Result: ******\_\_\_\_******

### Negative Test Cases

#### Negative 1: API Timeout on Metrics Load

- [ ] **N1.1** Switch to LinkedIn tab
- [ ] **N1.2** Simulate slow network (DevTools: Slow 3G)
- [ ] **N1.3** KPIs show loading skeleton for up to 10 seconds
- [ ] **N1.4** If API takes >10 seconds, timeout error appears
- [ ] **N1.5** Error message: "Failed to load analytics data. Please refresh."
- [ ] **N1.6** Can click "Retry" button
- Observed Result: ******\_\_\_\_******

#### Negative 2: No Data Available

- [ ] **N2.1** Switch to platform with no posts (e.g., YouTube, if not used)
- [ ] **N2.2** KPIs show "0" or "--" (no data)
- [ ] **N2.3** Chart shows empty state: "No data available for this period"
- [ ] **N2.4** Message: "Connect your YouTube account or publish posts to see analytics"
- Observed Result: ******\_\_\_\_******

#### Negative 3: Invalid Date Range

- [ ] **N3.1** Click "Custom" date range
- [ ] **N3.2** Select start date: "Jan 15, 2025"
- [ ] **N3.3** Select end date: "Jan 1, 2025" (end before start)
- [ ] **N3.4** Error: "End date must be after start date"
- [ ] **N3.5** "Apply" button disabled
- Observed Result: ******\_\_\_\_******

#### Negative 4: AI Insights Generation Failure

- [ ] **N4.1** Click "Generate Insights"
- [ ] **N4.2** Simulate API error (return 500)
- [ ] **N4.3** Error toast: "Failed to generate insights. Please try again."
- [ ] **N4.4** Button returns to normal state (not loading)
- [ ] **N4.5** Can retry
- Observed Result: ******\_\_\_\_******

### Mobile Responsive Testing

#### Viewport: 320px

- [ ] **M1.1** Platform tabs stack or scroll horizontally
- [ ] **M1.2** KPI cards stack vertically (one per row)
- [ ] **M1.3** Chart renders (responsive, may be smaller)
- [ ] **M1.4** Date range buttons stack vertically or wrap
- [ ] **M1.5** Top posts table scrollable horizontally (or stacked on mobile)
- Observed Result: ******\_\_\_\_******

#### Viewport: 768px

- [ ] **M2.1** KPI cards in 2-column grid
- [ ] **M2.2** Chart full-width
- [ ] **M2.3** Date range buttons side-by-side
- [ ] **M2.4** Top posts table full-width with all columns visible
- Observed Result: ******\_\_\_\_******

#### Viewport: 1024px

- [ ] **M3.1** KPI cards in 4-column grid
- [ ] **M3.2** Chart and insights side-by-side (if layout allows)
- [ ] **M3.3** Goals section visible without scroll
- Observed Result: ******\_\_\_\_******

### Accessibility Testing

#### Focus & Keyboard

- [ ] **A1.1** Tab through platform tabs
- [ ] **A1.2** Arrow keys navigate between tabs (optional enhancement)
- [ ] **A1.3** Enter/Space activates tab
- [ ] **A1.4** Tab through date range buttons
- [ ] **A1.5** Enter activates date range
- [ ] **A1.6** Date picker accessible via keyboard (Arrows to select dates)
- [ ] **A1.7** "Generate Insights" button accessible via Tab
- Observed Result: ******\_\_\_\_******

#### Labels & ARIA

- [ ] **A2.1** Platform tabs have role="tablist" and aria-label
- [ ] **A2.2** Each tab has role="tab" and aria-selected
- [ ] **A2.3** KPI cards have accessible labels (e.g., "Reach: 12,345")
- [ ] **A2.4** Chart has role="img" and aria-label: "Engagement Over Time chart"
- [ ] **A2.5** Date range buttons have aria-pressed for selected state
- Observed Result: ******\_\_\_\_******

#### Contrast

- [ ] **A3.1** Platform tabs (active): contrast >4.5:1
- [ ] **A3.2** KPI values (large text): contrast >3:1
- [ ] **A3.3** Chart lines/bars: contrast >3:1
- [ ] **A3.4** Insights text: contrast >4.5:1
- [ ] **A3.5** Goal progress bar: contrast >3:1
- Observed Result: ******\_\_\_\_******

### Evidence & Artifacts

**Required:**

- [ ] Default view (Instagram, 7d) with KPIs and chart
- [ ] Platform switch (TikTok) showing updated data
- [ ] Custom date range picker
- [ ] AI insights panel with recommendations
- [ ] Goals section with progress bar
- [ ] Top posts table

**Attach:**

- Screenshot 1: ******\_\_\_\_******
- Screenshot 2: ******\_\_\_\_******
- Video: ******\_\_\_\_******

### API Verification

```bash
# Get analytics metrics
curl -H "Authorization: Bearer $TOKEN" \
  "https://alignedai20.vercel.app/api/analytics/metrics?platform=instagram&days=7"

# Expected response:
# {
#   "platform": "instagram",
#   "period": {
#     "startDate": "2025-01-08",
#     "endDate": "2025-01-15",
#     "days": 7
#   },
#   "kpis": {
#     "reach": 12345,
#     "engagementRate": 3.5,
#     "followers": 1234,
#     "postsPublished": 15
#   },
#   "chartData": [
#     { "date": "2025-01-08", "engagement": 3.2 },
#     { "date": "2025-01-09", "engagement": 3.5 },
#     ...
#   ],
#   "topPosts": [
#     {
#       "id": "...",
#       "title": "Product Launch Video",
#       "platform": "instagram",
#       "likes": 523,
#       "comments": 87,
#       "shares": 34,
#       "engagementRate": 5.8
#     },
#     ...
#   ]
# }

# Generate AI insights
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"platform": "instagram", "days": 30}' \
  https://alignedai20.vercel.app/api/analytics/insights

# Expected response:
# {
#   "insights": [
#     {
#       "type": "growth",
#       "message": "Engagement increased by 15% vs. last period",
#       "icon": "📈"
#     },
#     {
#       "type": "timing",
#       "message": "Best posting times: Tuesday-Thursday, 9-11 AM",
#       "icon": "⏰"
#     },
#     ...
#   ],
#   "generatedAt": "2025-01-15T10:00:00Z"
# }

# Create goal
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Reach 1000 Followers by Q1", "type": "followers", "target": 1000, "deadline": "2025-03-31"}' \
  https://alignedai20.vercel.app/api/analytics/goals

# Expected response:
# {
#   "success": true,
#   "goalId": "...",
#   "name": "Reach 1000 Followers by Q1",
#   "type": "followers",
#   "target": 1000,
#   "current": 890,
#   "progress": 89,
#   "deadline": "2025-03-31"
# }
```

- [ ] All API calls return expected responses
- [ ] Metrics data matches UI display
- [ ] Insights are relevant and actionable

Observed Result: ******\_\_\_\_******

### Pass/Fail Criteria

✅ **PASS** if ALL of the following are true:

- [ ] Platform tabs load metrics for each platform
- [ ] Date range filters update KPIs and chart correctly
- [ ] Custom date range picker works and updates query params
- [ ] "Generate Insights" returns recommendations within 10 seconds
- [ ] Goals persist after page refresh
- [ ] Top posts table displays with correct data sorted by engagement
- [ ] Mobile responsive (320px, 768px, 1024px)
- [ ] Keyboard accessible
- [ ] WCAG AA compliance
- [ ] Negative test cases handled
- [ ] No console errors; all API calls return 200

❌ **FAIL** if ANY of the following occur:

- [ ] Metrics don't update when switching platforms
- [ ] Date range filter shows stale data
- [ ] Insights return error or timeout
- [ ] Goals lost after refresh
- [ ] KPI values clearly incorrect or nonsensical
- [ ] Chart fails to render
- [ ] Mobile layout broken
- [ ] Keyboard navigation broken
- [ ] Contrast issues

**Final Result:** ☐ PASS | ☐ FAIL  
**Notes:** ******\_\_\_\_******

---

## MODULE 7: Client Portal

### Route: `/client-portal/:token`

**Goal:** External approval works via token; access gated; decisions sync back.

### Steps

#### Step 1: Generate Client Portal Link

- [ ] **1.1** Navigate to `/approvals`
- [ ] **1.2** Find pending post from client project: "Client Review Post"
- [ ] **1.3** Click on post card to open detail
- [ ] **1.4** Click "Share for Feedback" or "Send to Client" button
- [ ] **1.5** Modal opens: "Generate Client Portal Link"
- [ ] **1.6** See generated link: `https://alignedai20.vercel.app/client-portal/abc123xyz`
- [ ] **1.7** See expiration options: "24 hours" / "7 days" / "30 days"
- [ ] **1.8** Select "7 days"
- [ ] **1.9** Click "Copy Link" button
- [ ] **1.10** Toast: "Link copied to clipboard"
- [ ] **1.11** Close modal
- Observed Result: ******\_\_\_\_******

#### Step 2: Access Portal (Unauthenticated)

- [ ] **2.1** Logout from main app (clear auth token)
- [ ] **2.2** Open new incognito/private browser window
- [ ] **2.3** Paste client portal link: `https://alignedai20.vercel.app/client-portal/abc123xyz`
- [ ] **2.4** Press Enter
- [ ] **2.5** Page loads (no login required)
- [ ] **2.6** See client portal header (may show client/brand logo if white-label enabled)
- [ ] **2.7** See approval card(s) for this token:
  - [ ] **2.7a** Post title: "Client Review Post"
  - [ ] **2.7b** Preview image
  - [ ] **2.7c** Post copy text
  - [ ] **2.7d** Platform badge: "LinkedIn"
  - [ ] **2.7e** Two action buttons: "Approve" and "Request Changes"
- Observed Result: ******\_\_\_\_******

#### Step 3: Token-Scoped Access

- [ ] **3.1** Note post ID visible: "Post #123"
- [ ] **3.2** Manually change URL to different token: `/client-portal/invalidtoken`
- [ ] **3.3** Press Enter
- [ ] **3.4** Error page: "403 Forbidden" or "Invalid or expired link"
- [ ] **3.5** Message: "This link is invalid or has expired. Please contact your account manager."
- [ ] **3.6** Return to valid token URL
- [ ] **3.7** Page loads with post #123 (correct scoping)
- [ ] **3.8** Cannot see posts from other clients (verify by checking data)
- Observed Result: ******\_\_\_\_******

#### Step 4: Approve Decision

- [ ] **4.1** On portal, see pending post card
- [ ] **4.2** Click "Approve" button
- [ ] **4.3** Confirmation dialog appears: "Approve this post?"
- [ ] **4.4** Optional: see comment field: "Add feedback (optional)"
- [ ] **4.5** Enter comment: "Looks great! Please post immediately."
- [ ] **4.6** Click "Confirm"
- [ ] **4.7** Toast: "Feedback sent. Thank you!"
- [ ] **4.8** Post card status changes to "✅ Approved"
- [ ] **4.9** Timestamp: "Approved 1 minute ago"
- [ ] **4.10** "Approve" and "Request Changes" buttons disabled or hidden
- [ ] **4.11** Comment visible in thread: "Client: Looks great! Please post immediately."
- Observed Result: ******\_\_\_\_******

#### Step 5: Reject Decision

- [ ] **5.1** Generate new client portal link for another post: "Client Review Post 2"
- [ ] **5.2** Access portal in incognito
- [ ] **5.3** See pending post card
- [ ] **5.4** Click "Request Changes" button
- [ ] **5.5** Modal opens: "Request Changes"
- [ ] **5.6** See feedback field (required)
- [ ] **5.7** Enter feedback: "Please adjust the headline to be more engaging and add a call-to-action."
- [ ] **5.8** Click "Send Feedback"
- [ ] **5.9** Modal closes
- [ ] **5.10** Toast: "Feedback sent. Your changes have been requested."
- [ ] **5.11** Post card status changes to "⚠️ Changes Requested"
- [ ] **5.12** Timestamp: "Feedback sent 1 minute ago"
- [ ] **5.13** Feedback visible in comment thread
- Observed Result: ******\_\_\_\_******

#### Step 6: Sync to Internal Approvals

- [ ] **6.1** Login to main app as admin
- [ ] **6.2** Navigate to `/approvals`
- [ ] **6.3** Find post: "Client Review Post" (approved via portal)
- [ ] **6.4** Status shows: "Approved by Client"
- [ ] **6.5** Comment thread shows: "Client: Looks great! Please post immediately."
- [ ] **6.6** Post moved to "Scheduled" section (auto-approved)
- [ ] **6.7** Find post: "Client Review Post 2" (changes requested)
- [ ] **6.8** Status shows: "Changes Requested by Client"
- [ ] **6.9** Comment thread shows: "Client: Please adjust the headline..."
- [ ] **6.10** Post back in "Drafts" section for revision
- Observed Result: ******\_\_\_\_******

#### Step 7: Comments Visibility

- [ ] **7.1** On client portal (approved post), scroll to comments section
- [ ] **7.2** See comment: "Client: Looks great! Please post immediately."
- [ ] **7.3** Add another comment: "Also, please tag our brand account."
- [ ] **7.4** Click "Post Comment"
- [ ] **7.5** Comment appears in thread immediately (optimistic UI)
- [ ] **7.6** Switch to main app (admin logged in)
- [ ] **7.7** Navigate to same post detail
- [ ] **7.8** See both client comments visible
- [ ] **7.9** Add internal reply: "Will tag @YourBrand and post today."
- [ ] **7.10** Click "Post Comment"
- [ ] **7.11** Back on client portal, refresh page
- [ ] **7.12** See internal reply visible in thread
- Observed Result: ******\_\_\_\_******

### Negative Test Cases

#### Negative 1: Expired Token

- [ ] **N1.1** Generate client portal link with "24 hours" expiration
- [ ] **N1.2** Simulate time passing >24 hours (or manually expire token in database)
- [ ] **N1.3** Access portal URL
- [ ] **N1.4** Error page: "This link has expired"
- [ ] **N1.5** Cannot access posts
- [ ] **N1.6** Message: "Please contact your account manager for a new link"
- Observed Result: ******\_\_\_\_******

#### Negative 2: Request Changes Without Feedback

- [ ] **N2.1** On client portal, click "Request Changes"
- [ ] **N2.2** Leave feedback field empty
- [ ] **N2.3** Click "Send Feedback"
- [ ] **N2.4** Error: "Feedback is required when requesting changes"
- [ ] **N2.5** Cannot submit without feedback
- Observed Result: ******\_\_\_\_******

#### Negative 3: Double Approval Attempt

- [ ] **N3.1** Approve a post via client portal
- [ ] **N3.2** Post status changes to "Approved"
- [ ] **N3.3** Try to click "Approve" again (if button still visible)
- [ ] **N3.4** Button disabled or action blocked
- [ ] **N3.5** Message: "This post has already been approved"
- Observed Result: ******\_\_\_\_******

#### Negative 4: Cross-Client Data Leak Attempt

- [ ] **N4.1** Access client portal for Client A (token: abc123)
- [ ] **N4.2** Note post IDs visible
- [ ] **N4.3** Generate new portal link for Client B (token: xyz789)
- [ ] **N4.4** Access Client B portal
- [ ] **N4.5** Verify Client A posts NOT visible
- [ ] **N4.6** Try to access Client A post ID via API (if exposed)
- [ ] **N4.7** Returns 403 Forbidden (access denied)
- Observed Result: ******\_\_\_\_******

### Mobile Responsive Testing

#### Viewport: 320px

- [ ] **M1.1** Portal loads without horizontal scroll
- [ ] **M1.2** Post card stacks vertically
- [ ] **M1.3** Action buttons full-width and tappable
- [ ] **M1.4** Comment field and thread readable
- [ ] **M1.5** "Send Feedback" button full-width
- Observed Result: ******\_\_\_\_******

#### Viewport: 768px

- [ ] **M2.1** Post card shows preview image and content side-by-side (if layout allows)
- [ ] **M2.2** Action buttons side-by-side
- [ ] **M2.3** Comment thread in sidebar or panel
- Observed Result: ******\_\_\_\_******

#### Viewport: 1024px

- [ ] **M3.1** Full desktop layout
- [ ] **M3.2** Post preview prominent
- [ ] **M3.3** Comments visible without scroll
- Observed Result: ******\_\_\_\_******

### Accessibility Testing

#### Focus & Keyboard

- [ ] **A1.1** Tab through portal page
- [ ] **A1.2** "Approve" button accessible via Tab
- [ ] **A1.3** Enter key activates approve action
- [ ] **A1.4** "Request Changes" button accessible via Tab
- [ ] **A1.5** Escape key closes modals
- [ ] **A1.6** Comment field accessible and submittable via Enter
- Observed Result: ******\_\_\_\_******

#### Labels & ARIA

- [ ] **A2.1** Action buttons have accessible labels
- [ ] **A2.2** Feedback field has label: "Your feedback"
- [ ] **A2.3** Status badges have accessible text (not color-only)
- [ ] **A2.4** Toast notifications have role="alert"
- Observed Result: ******\_\_\_\_******

#### Contrast

- [ ] **A3.1** "Approve" button (green): contrast >4.5:1
- [ ] **A3.2** "Request Changes" button (orange/red): contrast >4.5:1
- [ ] **A3.3** Status text: contrast >4.5:1
- [ ] **A3.4** Comment text: contrast >4.5:1
- Observed Result: ******\_\_\_\_******

### Evidence & Artifacts

**Required:**

- [ ] Client portal link generation modal
- [ ] Portal page (unauthenticated) with pending post
- [ ] Approved post status on portal
- [ ] Changes requested status on portal
- [ ] Internal `/approvals` showing client decisions synced
- [ ] Comment thread visible on both portal and internal app

**Attach:**

- Screenshot 1: ******\_\_\_\_******
- Screenshot 2: ******\_\_\_\_******
- Video: ******\_\_\_\_******

### API Verification

```bash
# Generate client portal token
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"postId": "123", "expiresIn": "7d"}' \
  https://alignedai20.vercel.app/api/client-portal/generate

# Expected response:
# {
#   "success": true,
#   "token": "abc123xyz",
#   "url": "https://alignedai20.vercel.app/client-portal/abc123xyz",
#   "expiresAt": "2025-01-22T10:00:00Z"
# }

# Access portal (no auth required)
curl https://alignedai20.vercel.app/api/client-portal/abc123xyz

# Expected response:
# {
#   "posts": [
#     {
#       "id": "123",
#       "title": "Client Review Post",
#       "copy": "...",
#       "platform": "linkedin",
#       "status": "pending",
#       "previewImageUrl": "..."
#     }
#   ],
#   "clientName": "Acme Corp",
#   "expiresAt": "2025-01-22T10:00:00Z"
# }

# Approve via portal
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"decision": "approve", "comment": "Looks great!"}' \
  https://alignedai20.vercel.app/api/client-portal/abc123xyz/posts/123/decision

# Expected response:
# {
#   "success": true,
#   "postId": "123",
#   "status": "approved",
#   "comment": "Looks great!"
# }
```

- [ ] All API calls return expected responses
- [ ] Token security validated
- [ ] Decisions sync to main database

Observed Result: ******\_\_\_\_******

### Pass/Fail Criteria

✅ **PASS** if ALL of the following are true:

- [ ] Token generates securely and is shareable
- [ ] Portal loads without authentication
- [ ] Only scoped posts visible (no cross-client data leak)
- [ ] Approve/Reject actions persist and sync back to `/approvals`
- [ ] Comments visible on both sides (portal & internal)
- [ ] Invalid/expired tokens blocked with proper error
- [ ] Mobile responsive (320px, 768px, 1024px)
- [ ] Keyboard accessible
- [ ] WCAG AA compliance
- [ ] Negative test cases handled
- [ ] No console errors or auth leaks

❌ **FAIL** if ANY of the following occur:

- [ ] Portal requires login
- [ ] Can access posts from other clients via URL manipulation
- [ ] Approval decision doesn't sync to internal app
- [ ] Comments not visible to internal users
- [ ] Token never expires (security risk)
- [ ] 401/403 errors for valid tokens
- [ ] Mobile layout broken
- [ ] Keyboard navigation broken
- [ ] Contrast issues

**Final Result:** ☐ PASS | ☐ FAIL  
**Notes:** ******\_\_\_\_******

---

## MODULE 8: Payment & Billing

### Route: `/billing`

**Goal:** Plan selection → Stripe Checkout → Subscription management.

### Section A: Readiness Test (UI, non-functional for now)

- [ ] **A.1** Navigate to `/billing`
- [ ] **A.2** Page loads successfully
- [ ] **A.3** See plan cards displayed: "Starter" / "Pro" / "Enterprise"
- [ ] **A.4** Each plan card shows:
  - [ ] **A.4a** Plan name
  - [ ] **A.4b** Price: e.g., "$49/month" or "$490/year"
  - [ ] **A.4c** Feature list:
    - Starter: "Up to 3 brands", "10 posts/month", "Basic analytics"
    - Pro: "Up to 10 brands", "Unlimited posts", "Advanced analytics", "AI insights"
    - Enterprise: "Unlimited brands", "Custom integrations", "Dedicated support"
  - [ ] **A.4d** "Choose Plan" or "Upgrade" button
- [ ] **A.5** Current plan highlighted (if user subscribed)
- [ ] **A.6** See "Start Checkout" button (OK if non-functional in dev)
- [ ] **A.7** See "Manage Subscription" CTA visible for logged-in users
- [ ] **A.8** Page responsive on mobile (320px, 768px, 1024px)
- Observed Result: ******\_\_\_\_******

**Readiness Result:** ☐ PASS | ☐ FAIL

### Section B: Functional Test (Post-Payment Integration)

**Note:** Only perform if Stripe is integrated and test mode enabled.

#### Step 1: Checkout Initiation

- [ ] **B.1** On `/billing`, click "Upgrade" on "Pro" plan
- [ ] **B.2** Stripe Checkout modal or page opens
- [ ] **B.3** URL: `https://checkout.stripe.com/c/pay/...` or embedded modal
- [ ] **B.4** See plan selected: "Pro Plan - $49/month"
- [ ] **B.5** Email field pre-populated with logged-in user email
- Observed Result: ******\_\_\_\_******

#### Step 2: Payment Entry

- [ ] **B.6** Enter test card: `4242 4242 4242 4242`
- [ ] **B.7** Enter expiry: `12 / 25`
- [ ] **B.8** Enter CVC: `123`
- [ ] **B.9** Enter ZIP: `12345`
- [ ] **B.10** Click "Pay" or "Subscribe" button
- [ ] **B.11** Processing spinner appears
- [ ] **B.12** Within 10 seconds, payment succeeds
- [ ] **B.13** Redirected back to app (e.g., `/billing?success=true`)
- Observed Result: ******\_\_\_\_******

#### Step 3: Webhook & Subscription Update

- [ ] **B.14** Check server logs or webhook endpoint for Stripe event: `checkout.session.completed`
- [ ] **B.15** Subscription created in database (check via API or admin panel)
- [ ] **B.16** User's plan updated to "Pro"
- [ ] **B.17** Navigate to `/settings` or account page
- [ ] **B.18** See current plan: "Pro" (badge or label)
- [ ] **B.19** Check email inbox for confirmation email:
  - [ ] **B.19a** Subject: "Welcome to Pro Plan!"
  - [ ] **B.19b** Receipt from Stripe
- Observed Result: ******\_\_\_\_******

#### Step 4: Manage Subscription

- [ ] **B.20** On `/billing`, see "Manage Subscription" button
- [ ] **B.21** Click "Manage Subscription"
- [ ] **B.22** Redirects to Stripe Customer Portal: `https://billing.stripe.com/p/session/...`
- [ ] **B.23** Customer Portal loads with:
  - [ ] **B.23a** Current subscription: "Pro Plan - $49/month"
  - [ ] **B.23b** Next billing date
  - [ ] **B.23c** Payment method on file: "Visa •••• 4242"
- [ ] **B.24** Click "Update payment method"
- [ ] **B.25** Enter new test card: `5555 5555 5555 4444` (Mastercard)
- [ ] **B.26** Save changes
- [ ] **B.27** Toast or confirmation: "Payment method updated"
- [ ] **B.28** Click "Cancel subscription"
- [ ] **B.29** Confirmation dialog: "Are you sure?"
- [ ] **B.30** Click "Cancel subscription"
- [ ] **B.31** Subscription marked as "Canceled" (end of billing period)
- [ ] **B.32** Return to main app
- [ ] **B.33** Check subscription status in database: "active" until end date, then "canceled"
- Observed Result: ******\_\_\_\_******

### Negative Test Cases

#### Negative 1: Payment Declined

- [ ] **N1.1** Start checkout for "Pro" plan
- [ ] **N1.2** Enter declined test card: `4000 0000 0000 0002`
- [ ] **N1.3** Enter expiry: `12 / 25`, CVC: `123`, ZIP: `12345`
- [ ] **N1.4** Click "Pay"
- [ ] **N1.5** Error appears: "Your card was declined"
- [ ] **N1.6** User remains on checkout page
- [ ] **N1.7** Can update card and retry
- Observed Result: ******\_\_\_\_******

#### Negative 2: Webhook Failure

- [ ] **N2.1** Complete checkout successfully
- [ ] **N2.2** Simulate webhook failure (disable webhook endpoint or return 500)
- [ ] **N2.3** Stripe sends `checkout.session.completed` event
- [ ] **N2.4** Webhook fails to process
- [ ] **N2.5** Stripe retries webhook (check logs for retries)
- [ ] **N2.6** After retries succeed, subscription updates
- [ ] **N2.7** Fallback: manual sync script can be run to reconcile
- Observed Result: ******\_\_\_\_******

#### Negative 3: Subscription Already Exists

- [ ] **N3.1** User already subscribed to "Pro" plan
- [ ] **N3.2** Try to click "Upgrade" on "Pro" plan again
- [ ] **N3.3** Button shows "Current Plan" (disabled) or message: "You're already on this plan"
- [ ] **N3.4** Cannot initiate duplicate subscription
- Observed Result: ******\_\_\_\_******

### Mobile Responsive Testing

#### Viewport: 320px

- [ ] **M1.1** Plan cards stack vertically
- [ ] **M1.2** Feature lists readable
- [ ] **M1.3** "Choose Plan" buttons full-width and tappable
- [ ] **M1.4** Stripe Checkout modal responsive
- Observed Result: ******\_\_\_\_******

#### Viewport: 768px

- [ ] **M2.1** Plan cards in 2-column grid (if 2-3 plans)
- [ ] **M2.2** Feature lists visible without truncation
- Observed Result: ******\_\_\_\_******

#### Viewport: 1024px

- [ ] **M3.1** Plan cards in 3-column grid
- [ ] **M3.2** "Manage Subscription" button prominent
- Observed Result: ******\_\_\_\_******

### Accessibility Testing

#### Focus & Keyboard

- [ ] **A1.1** Tab through plan cards
- [ ] **A1.2** "Choose Plan" buttons accessible via Tab
- [ ] **A1.3** Enter key initiates checkout
- [ ] **A1.4** Stripe Checkout iframe accessible (Stripe handles accessibility)
- Observed Result: ******\_\_\_\_******

#### Labels & ARIA

- [ ] **A2.1** Plan cards have accessible headings (h2 or h3)
- [ ] **A2.2** Feature lists use semantic <ul> or <ol>
- [ ] **A2.3** Current plan badge has accessible text: "Current Plan: Pro"
- [ ] **A2.4** "Manage Subscription" link has descriptive label
- Observed Result: ******\_\_\_\_******

#### Contrast

- [ ] **A3.1** Plan names (large text): contrast >3:1
- [ ] **A3.2** Prices (large text): contrast >3:1
- [ ] **A3.3** Feature list text: contrast >4.5:1
- [ ] **A3.4** "Choose Plan" buttons: contrast >4.5:1
- Observed Result: ******\_\_\_\_******

### Evidence & Artifacts

**Required:**

- [ ] `/billing` page showing all 3 plan cards
- [ ] Stripe Checkout page (test mode)
- [ ] Payment success redirect
- [ ] Stripe Customer Portal
- [ ] Email confirmation (subscription receipt)

**Attach:**

- Screenshot 1: ******\_\_\_\_******
- Screenshot 2: ******\_\_\_\_******
- Video: ******\_\_\_\_******

### API Verification

```bash
# Create checkout session
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan": "pro", "billingInterval": "monthly"}' \
  https://alignedai20.vercel.app/api/billing/create-checkout

# Expected response:
# {
#   "sessionId": "cs_test_...",
#   "url": "https://checkout.stripe.com/c/pay/cs_test_..."
# }

# Get current subscription
curl -H "Authorization: Bearer $TOKEN" \
  https://alignedai20.vercel.app/api/billing/subscription

# Expected response:
# {
#   "subscriptionId": "sub_...",
#   "plan": "pro",
#   "status": "active",
#   "currentPeriodEnd": "2025-02-15T00:00:00Z",
#   "cancelAtPeriodEnd": false
# }

# Create customer portal session
curl -X POST -H "Authorization: Bearer $TOKEN" \
  https://alignedai20.vercel.app/api/billing/customer-portal

# Expected response:
# {
#   "url": "https://billing.stripe.com/p/session/..."
# }
```

- [ ] All API calls return expected responses
- [ ] Checkout session created successfully
- [ ] Subscription persisted in database

Observed Result: ******\_\_\_\_******

### Pass/Fail Criteria (Readiness)

✅ **PASS** if:

- [ ] Plan cards render with all details (name, price, features)
- [ ] Currently active plan visually distinct
- [ ] Checkout button present and clickable
- [ ] Manage Subscription CTA visible
- [ ] Mobile responsive
- [ ] Keyboard accessible
- [ ] WCAG AA compliance

❌ **FAIL** if:

- [ ] Plans missing or incorrectly displayed
- [ ] Pricing not shown
- [ ] Buttons non-functional or hidden
- [ ] Mobile layout broken
- [ ] Contrast issues

**Final Result (Readiness):** ☐ PASS | ☐ FAIL

### Pass/Fail Criteria (Functional)

✅ **PASS** if:

- [ ] Checkout initiates and Stripe modal loads
- [ ] Payment processes successfully with test card
- [ ] Webhook updates subscription in database
- [ ] User's plan reflects upgrade
- [ ] Email confirmation sent
- [ ] Customer Portal accessible and functional
- [ ] Can update payment method and cancel subscription
- [ ] Negative test cases handled (declined card, webhook failure)

❌ **FAIL** if:

- [ ] Checkout fails to load
- [ ] Payment succeeds but subscription not created
- [ ] Webhook not received or processed
- [ ] Plan not updated in app
- [ ] Customer Portal inaccessible
- [ ] Declined card not handled gracefully

**Final Result (Functional):** ☐ PASS | ☐ FAIL | ☐ NOT TESTED  
**Notes:** ******\_\_\_\_******

---

## MODULE 9: Live Data & Real-Time Updates

### Global (affects `/dashboard`, `/content-queue`, `/approvals`)

**Goal:** KPIs auto-refresh; queue/approvals update via WebSocket or polling; offline handling.

### Steps

#### Step 1: Dashboard KPI Auto-Refresh

- [ ] **1.1** Navigate to `/dashboard`
- [ ] **1.2** Note KPI values at time T0:
  - [ ] **1.2a** "Reach": "12,345"
  - [ ] **1.2b** "Engagement Rate": "3.5%"
  - [ ] **1.2c** "Followers": "1,234"
- [ ] **1.3** Open DevTools → Network tab
- [ ] **1.4** Filter by XHR/Fetch
- [ ] **1.5** Wait 60 seconds
- [ ] **1.6** At ~60 seconds, see API call: `GET /api/analytics/metrics`
- [ ] **1.7** Response: 200 OK
- [ ] **1.8** KPI values update on screen (may change slightly):
  - [ ] **1.8a** "Reach": "12,350" (increased by 5)
  - [ ] **1.8b** "Engagement Rate": "3.6%" (increased)
  - [ ] **1.8c** "Followers": "1,235" (increased by 1)
- [ ] **1.9** Wait another 60 seconds
- [ ] **1.10** API call repeats at ~120 seconds
- [ ] **1.11** KPIs update again
- Observed Result: ******\_\_\_\_******

#### Step 2: Queue/Approvals Real-Time (WebSocket)

- [ ] **2.1** Open `/content-queue` in Browser A (Tab 1)
- [ ] **2.2** See post: "Test Post" with status "Draft"
- [ ] **2.3** Open `/content-queue` in Browser B (Incognito/Tab 2)
- [ ] **2.4** In Browser B, open "Test Post" detail
- [ ] **2.5** Click "Request Approval"
- [ ] **2.6** Post status changes to "Reviewing" in Browser B
- [ ] **2.7** Switch to Browser A (Tab 1)
- [ ] **2.8** Within 5 seconds, "Test Post" status updates to "Reviewing" automatically (no manual refresh)
- [ ] **2.9** Verify WebSocket connection in DevTools → Network → WS tab
- [ ] **2.10** See WebSocket frame: `{"type": "statusUpdate", "postId": "123", "status": "reviewing"}`
- Observed Result: ******\_\_\_\_******

#### Step 3: Approvals Real-Time Update

- [ ] **3.1** Open `/approvals` in Browser A
- [ ] **3.2** See pending post: "Test Post for Approval"
- [ ] **3.3** Open `/approvals` in Browser B (different user or incognito)
- [ ] **3.4** In Browser B, click "Approve" on "Test Post for Approval"
- [ ] **3.5** Post disappears from pending list in Browser B
- [ ] **3.6** Switch to Browser A
- [ ] **3.7** Within 10 seconds, post disappears from pending list in Browser A (WebSocket or polling update)
- [ ] **3.8** No manual refresh required
- Observed Result: ******\_\_\_\_******

#### Step 4: Offline Handling

- [ ] **4.1** Navigate to `/content-queue`
- [ ] **4.2** Open DevTools → Network tab
- [ ] **4.3** Set throttling to "Offline"
- [ ] **4.4** Offline banner appears at top of page: "⚠️ You're offline. Changes will sync when back online."
- [ ] **4.5** Try to edit a post (change title)
- [ ] **4.6** Title updates optimistically in UI
- [ ] **4.7** "Saving..." indicator appears (but doesn't complete)
- [ ] **4.8** Change queued in localStorage or IndexedDB
- [ ] **4.9** Set throttling back to "Online"
- [ ] **4.10** Offline banner disappears
- [ ] **4.11** "Syncing changes..." indicator appears
- [ ] **4.12** Within 5 seconds, API call sent: `PATCH /api/posts/123`
- [ ] **4.13** Response: 200 OK
- [ ] **4.14** Toast: "Changes synced successfully"
- [ ] **4.15** Refresh page → edited title persisted
- Observed Result: ******\_\_\_\_******

#### Step 5: Polling Fallback (WebSocket Down)

- [ ] **5.1** Open `/approvals` in Browser A
- [ ] **5.2** In DevTools, block WebSocket connections (Network → Block request URL → `wss://...`)
- [ ] **5.3** WebSocket connection fails (check Console for errors)
- [ ] **5.4** App falls back to HTTP polling
- [ ] **5.5** In Browser B (or another tab), approve a post
- [ ] **5.6** Switch to Browser A
- [ ] **5.7** Within 10 seconds, post status updates via polling (HTTP GET /api/approvals)
- [ ] **5.8** See API call in Network tab: `GET /api/approvals?status=pending` (repeating every 10s)
- [ ] **5.9** No console errors; graceful fallback
- Observed Result: ******\_\_\_\_******

### Negative Test Cases

#### Negative 1: API Timeout on KPI Refresh

- [ ] **N1.1** On `/dashboard`, wait for 60-second KPI refresh
- [ ] **N1.2** Simulate slow network (Slow 3G)
- [ ] **N1.3** API call `/api/analytics/metrics` takes >10 seconds
- [ ] **N1.4** Loading skeleton appears on KPI cards
- [ ] **N1.5** If timeout occurs, error toast: "Failed to refresh metrics"
- [ ] **N1.6** KPIs show last known values (stale data OK)
- [ ] **N1.7** Retry on next interval (60s later)
- Observed Result: ******\_\_\_\_******

#### Negative 2: WebSocket Disconnect/Reconnect

- [ ] **N2.1** Open `/content-queue` with WebSocket connected
- [ ] **N2.2** Simulate network interruption (DevTools: offline for 5 seconds)
- [ ] **N2.3** WebSocket disconnects (Console: "WebSocket closed")
- [ ] **N2.4** App detects disconnect and shows offline banner
- [ ] **N2.5** Go back online
- [ ] **N2.6** WebSocket reconnects automatically (Console: "WebSocket connected")
- [ ] **N2.7** Offline banner disappears
- [ ] **N2.8** Real-time updates resume
- Observed Result: ******\_\_\_\_******

#### Negative 3: Offline Sync Conflict

- [ ] **N3.1** Edit post "Post A" while offline (change title to "Title A1")
- [ ] **N3.2** On another device (or simulate), edit same post online (change title to "Title A2")
- [ ] **N3.3** Go back online on first device
- [ ] **N3.4** Conflict detected (two versions of "Post A")
- [ ] **N3.5** Conflict resolution UI appears: "Your changes conflict with remote changes. Keep yours or theirs?"
- [ ] **N3.6** Select "Keep mine" or "Keep theirs"
- [ ] **N3.7** Conflict resolved; single version persists
- Observed Result: ******\_\_\_\_******

### Mobile Responsive Testing

#### Viewport: 320px

- [ ] **M1.1** Offline banner visible and readable
- [ ] **M1.2** "Syncing..." indicator visible
- [ ] **M1.3** KPI auto-refresh works (no layout shift)
- Observed Result: ******\_\_\_\_******

#### Viewport: 768px

- [ ] **M2.1** Real-time updates smooth on tablet
- [ ] **M2.2** Offline/online transitions seamless
- Observed Result: ******\_\_\_\_******

#### Viewport: 1024px

- [ ] **M3.1** WebSocket status indicator visible (if shown)
- [ ] **M3.2** No performance issues with real-time updates
- Observed Result: ******\_\_\_\_******

### Accessibility Testing

#### Focus & Keyboard

- [ ] **A1.1** Offline banner visible to screen readers
- [ ] **A1.2** "Retry" button (if shown) accessible via Tab
- [ ] **A1.3** Toast notifications announced by screen reader
- Observed Result: ******\_\_\_\_******

#### Labels & ARIA

- [ ] **A2.1** Offline banner has role="alert" or role="status"
- [ ] **A2.2** "Syncing..." indicator has aria-live="polite"
- [ ] **A2.3** Toast notifications have role="alert"
- Observed Result: ******\_\_\_\_******

#### Contrast

- [ ] **A3.1** Offline banner (yellow/orange): contrast >4.5:1
- [ ] **A3.2** "Syncing..." text: contrast >4.5:1
- [ ] **A3.3** Toast text: contrast >4.5:1
- Observed Result: ******\_\_\_\_******

### Evidence & Artifacts

**Required:**

- [ ] Network tab showing KPI refresh API call at 60s interval
- [ ] WebSocket connection in Network → WS tab
- [ ] Real-time status update (before/after in two browsers)
- [ ] Offline banner screenshot
- [ ] Sync success toast

**Attach:**

- Screenshot 1: ******\_\_\_\_******
- Screenshot 2: ******\_\_\_\_******
- Video: ******\_\_\_\_******

### API Verification

```bash
# WebSocket connection (conceptual, not curl)
# Open WebSocket: wss://alignedai20.vercel.app/ws
# Auth: Bearer $TOKEN in header or query param
# Expected frames:
# - Connected: {"type": "connected", "userId": "..."}
# - Status update: {"type": "statusUpdate", "postId": "123", "status": "reviewing"}

# Polling fallback (if WebSocket unavailable)
curl -H "Authorization: Bearer $TOKEN" \
  https://alignedai20.vercel.app/api/approvals?status=pending

# Expected: Same response as before, polled every 10 seconds
```

- [ ] WebSocket connection established successfully
- [ ] Frames sent/received correctly
- [ ] Polling fallback works when WebSocket blocked

Observed Result: ******\_\_\_\_******

### Pass/Fail Criteria

✅ **PASS** if ALL of the following are true:

- [ ] Dashboard KPIs auto-refresh every 60 seconds
- [ ] Queue/Approvals updates within 10 seconds of action (via WebSocket or polling)
- [ ] WebSocket OR polling confirmed working
- [ ] Offline banner shows when disconnected
- [ ] Changes queue locally and sync when back online
- [ ] No data loss on offline → online transition
- [ ] Graceful fallback if WebSocket unavailable
- [ ] Mobile responsive
- [ ] Keyboard accessible
- [ ] WCAG AA compliance
- [ ] Negative test cases handled

❌ **FAIL** if ANY of the following occur:

- [ ] KPIs never update
- [ ] Queue status not reflected for >30 seconds
- [ ] Offline mode not handled; errors shown
- [ ] WebSocket down causes app to hang (no polling fallback)
- [ ] Data lost when going offline
- [ ] Mobile layout broken
- [ ] Contrast issues

**Final Result:** ☐ PASS | ☐ FAIL  
**Notes:** ******\_\_\_\_******

---

## MODULE 10: Design Tokens & Accessibility

### Global (all routes)

**Goal:** Token-based styling enforced; light/dark modes consistent; keyboard navigation; WCAG AA compliance.

### Steps

#### Step 1: Token Enforcement (No Raw Hex Codes)

- [ ] **1.1** Navigate to `/dashboard`
- [ ] **1.2** Open DevTools → Inspector (Elements)
- [ ] **1.3** Inspect a primary button (e.g., "New Content")
- [ ] **1.4** View Computed Styles
- [ ] **1.5** Verify background-color uses CSS variable: `var(--color-primary)` or similar
- [ ] **1.6** Inspect a badge (e.g., "Draft" status)
- [ ] **1.7** Verify border-color uses token: `var(--color-border)` or similar
- [ ] **1.8** Inspect an input field
- [ ] **1.9** Verify padding uses token: `var(--spacing-md)` or similar
- [ ] **1.10** Search Computed Styles for raw hex codes (e.g., `#2563EB`)
- [ ] **1.11** No raw hex codes found (all use CSS variables)
- Observed Result: ******\_\_\_\_******

#### Step 2: Light Mode

- [ ] **2.1** Ensure system theme or app setting set to "Light"
- [ ] **2.2** Navigate to `/dashboard`
- [ ] **2.3** All text readable on white/light backgrounds
- [ ] **2.4** Check buttons:
  - [ ] **2.4a** Primary button: blue background, white text (readable)
  - [ ] **2.4b** Danger button: red background, white text (readable)
  - [ ] **2.4c** Outline button: white background, dark border, dark text (readable)
- [ ] **2.5** Check KPI cards:
  - [ ] **2.5a** Card background: white or light gray
  - [ ] **2.5b** Text: dark gray or black (contrast >4.5:1)
  - [ ] **2.5c** Borders visible (not blending into background)
- [ ] **2.6** Check badges:
  - [ ] **2.6a** "Draft" badge: gray background, dark text
  - [ ] **2.6b** "Published" badge: green background, white text
  - [ ] **2.6c** All badges readable
- [ ] **2.7** Use contrast checker (WAVE, axe, or manual):
  - [ ] **2.7a** Body text: contrast ratio >4.5:1
  - [ ] **2.7b** Heading text: contrast ratio >4.5:1 (or >3:1 if large)
  - [ ] **2.7c** Link text: contrast ratio >4.5:1
- Observed Result: ******\_\_\_\_******

#### Step 3: Dark Mode

- [ ] **3.1** Switch system theme or app setting to "Dark"
- [ ] **3.2** Page re-renders with dark theme
- [ ] **3.3** All text readable on dark backgrounds
- [ ] **3.4** Check buttons:
  - [ ] **3.4a** Primary button: blue background (darker shade), white text
  - [ ] **3.4b** Danger button: red background (darker shade), white text
  - [ ] **3.4c** Outline button: dark background, light border, light text
- [ ] **3.5** Check KPI cards:
  - [ ] **3.5a** Card background: dark gray or near-black
  - [ ] **3.5b** Text: light gray or white (contrast >4.5:1)
  - [ ] **3.5c** Borders visible (not blending into dark background)
- [ ] **3.6** Check badges:
  - [ ] **3.6a** "Draft" badge: darker gray background, light text
  - [ ] **3.6b** "Published" badge: darker green background, white text
  - [ ] **3.6c** All badges readable
- [ ] **3.7** Use contrast checker:
  - [ ] **3.7a** Body text on dark bg: contrast >4.5:1
  - [ ] **3.7b** Heading text: contrast >4.5:1 (or >3:1 if large)
  - [ ] **3.7c** Link text: contrast >4.5:1
- [ ] **3.8** Compare light vs. dark mode:
  - [ ] **3.8a** Branding consistent (logo, colors adapt but feel cohesive)
  - [ ] **3.8b** No jarring color shifts
  - [ ] **3.8c** All interactive elements identifiable in both themes
- Observed Result: ******\_\_\_\_******

#### Step 4: Keyboard Navigation

- [ ] **4.1** Navigate to `/dashboard`
- [ ] **4.2** Press Tab (starting from URL bar)
- [ ] **4.3** Focus moves to first interactive element (e.g., "Skip to content" link or first button)
- [ ] **4.4** Focus ring visible: 2px outline, blue or high-contrast color (contrast >3:1)
- [ ] **4.5** Continue pressing Tab
- [ ] **4.6** Focus moves through elements in logical order:
  - [ ] **4.6a** Header navigation links
  - [ ] **4.6b** "New Content" button
  - [ ] **4.6c** KPI cards (if interactive)
  - [ ] **4.6d** Content queue cards
  - [ ] **4.6e** Footer links
- [ ] **4.7** No focus traps (can Tab through entire page)
- [ ] **4.8** Focus a button (e.g., "New Content")
- [ ] **4.9** Press Enter
- [ ] **4.10** Button action triggered (navigates to `/creative-studio`)
- [ ] **4.11** Press Shift+Tab to reverse focus order
- [ ] **4.12** Focus moves backward correctly
- Observed Result: ******\_\_\_\_******

#### Step 5: Focus Management in Modals

- [ ] **5.1** On `/approvals`, click "Request Approval" on a post
- [ ] **5.2** Modal opens
- [ ] **5.3** Focus automatically moves inside modal (to first input or close button)
- [ ] **5.4** Press Tab
- [ ] **5.5** Focus moves through modal fields in logical order:
  - [ ] **5.5a** Comment textarea
  - [ ] **5.5b** "Request" button
  - [ ] **5.5c** "Cancel" button
  - [ ] **5.5d** Close "X" button
- [ ] **5.6** Press Tab at end of modal
- [ ] **5.7** Focus wraps to first element in modal (focus trapped inside)
- [ ] **5.8** Press Escape key
- [ ] **5.9** Modal closes
- [ ] **5.10** Focus returns to "Request Approval" button (trigger element)
- Observed Result: ******\_\_\_\_******

#### Step 6: Screen Reader Testing (Optional)

- [ ] **6.1** Enable screen reader (NVDA on Windows, JAWS, or VoiceOver on macOS)
- [ ] **6.2** Navigate to `/content-queue`
- [ ] **6.3** Tab to "New Content" button
- [ ] **6.4** Screen reader announces: "New Content, button"
- [ ] **6.5** Tab to post card
- [ ] **6.6** Screen reader announces: "Test Post, Draft status, LinkedIn platform, Created 2 hours ago"
- [ ] **6.7** Tab to email input (if present on page)
- [ ] **6.8** Screen reader announces: "Email, edit text" (or similar label)
- [ ] **6.9** Tab to status badge
- [ ] **6.10** Screen reader announces: "Draft" (text, not just color)
- [ ] **6.11** Navigate to image (e.g., logo or preview)
- [ ] **6.12** Screen reader announces alt text: "Brand logo" or "Post preview image"
- [ ] **6.13** Navigate through headings (H key in NVDA/JAWS)
- [ ] **6.14** Headings announced correctly: h1 → h2 → h3 hierarchy
- Observed Result: ******\_\_\_\_******

#### Step 7: Color Contrast Check

- [ ] **7.1** Install WAVE or axe DevTools extension
- [ ] **7.2** Navigate to `/dashboard`
- [ ] **7.3** Run WAVE or axe scan
- [ ] **7.4** Review contrast errors:
  - [ ] **7.4a** Inspect "New Content" button (primary):
    - Background: `#2563EB` (blue)
    - Text: `#FFFFFF` (white)
    - Contrast ratio: **10.4:1** (PASS, >4.5:1)
  - [ ] **7.4b** Inspect disabled button:
    - Background: `#E5E7EB` (light gray)
    - Text: `#9CA3AF` (medium gray)
    - Contrast ratio: **2.8:1** (OK for disabled, <4.5:1 acceptable)
  - [ ] **7.4c** Inspect "Draft" badge:
    - Background: `#F3F4F6` (light gray)
    - Text: `#374151` (dark gray)
    - Contrast ratio: **8.2:1** (PASS, >4.5:1)
  - [ ] **7.4d** Inspect small helper text (e.g., "Created 2 hours ago"):
    - Background: white
    - Text: `#6B7280` (gray)
    - Contrast ratio: **4.6:1** (PASS, >4.5:1 for small text or >3:1 for large text)
- [ ] **7.5** No color-only status indicators:
  - [ ] **7.5a** "Draft" badge: gray background + text "Draft"
  - [ ] **7.5b** "Published" badge: green background + checkmark icon + text "Published"
  - [ ] **7.5c** All statuses identifiable without color (icons or text)
- [ ] **7.6** Axe/WAVE report: 0 contrast errors (or all errors justified/acceptable)
- Observed Result: ******\_\_\_\_******

### Negative Test Cases

#### Negative 1: High Contrast Mode (Windows)

- [ ] **N1.1** Enable Windows High Contrast Mode
- [ ] **N1.2** Navigate to `/dashboard`
- [ ] **N1.3** All text still readable (high contrast colors override CSS)
- [ ] **N1.4** Buttons and borders visible
- [ ] **N1.5** No content hidden or unreadable
- Observed Result: ******\_\_\_\_******

#### Negative 2: Color Blindness Simulation

- [ ] **N2.1** Use color blindness simulator (Chrome DevTools → Rendering → Emulate vision deficiencies)
- [ ] **N2.2** Select "Protanopia" (red-green color blind)
- [ ] **N2.3** Navigate to `/content-queue`
- [ ] **N2.4** Verify status badges distinguishable (not relying on red vs. green):
  - [ ] "Draft" (gray) vs. "Published" (green) → both have icons/text, not just color
- [ ] **N2.5** Select "Deuteranopia" (another red-green variant)
- [ ] **N2.6** Repeat check → badges still distinguishable
- [ ] **N2.7** Select "Tritanopia" (blue-yellow color blind)
- [ ] **N2.8** Repeat check → badges still distinguishable
- Observed Result: ******\_\_\_\_******

#### Negative 3: Zoom to 200%

- [ ] **N3.1** Navigate to `/dashboard`
- [ ] **N3.2** Zoom browser to 200% (Ctrl/Cmd + "+")
- [ ] **N3.3** All content still readable (no text cut off)
- [ ] **N3.4** Layout adapts (may stack elements vertically)
- [ ] **N3.5** No horizontal scroll required
- [ ] **N3.6** Buttons and interactive elements still usable
- Observed Result: ******\_\_\_\_******

### Mobile Responsive Testing

#### Viewport: 320px

- [ ] **M1.1** Dark/light mode works on mobile
- [ ] **M1.2** Focus ring visible on tapped elements
- [ ] **M1.3** All text readable (min 16px)
- Observed Result: ******\_\_\_\_******

#### Viewport: 768px

- [ ] **M2.1** Theme toggle functional (if present)
- [ ] **M2.2** Contrast maintained in both modes
- Observed Result: ******\_\_\_\_******

#### Viewport: 1024px

- [ ] **M3.1** Full desktop layout with tokens
- [ ] **M3.2** Keyboard navigation smooth
- Observed Result: ******\_\_\_\_******

### Accessibility Testing

#### Focus & Keyboard

- [ ] **A1.1** Covered in Step 4 and Step 5 above
- Observed Result: ******\_\_\_\_******

#### Labels & ARIA

- [ ] **A2.1** Covered in Step 6 above
- Observed Result: ******\_\_\_\_******

#### Contrast

- [ ] **A3.1** Covered in Step 7 above
- Observed Result: ******\_\_\_\_******

### Evidence & Artifacts

**Required:**

- [ ] DevTools Inspector showing CSS variable usage (no raw hex)
- [ ] Light mode screenshot (dashboard)
- [ ] Dark mode screenshot (dashboard)
- [ ] Focus ring visible on button
- [ ] Modal focus trap demonstration
- [ ] WAVE/axe report (0 contrast errors)
- [ ] Color blindness simulation screenshot

**Attach:**

- Screenshot 1: ******\_\_\_\_******
- Screenshot 2: ******\_\_\_\_******
- Video: ******\_\_\_\_******

### Pass/Fail Criteria

✅ **PASS** if ALL of the following are true:

- [ ] No raw hex codes in computed styles (all use CSS variables/tokens)
- [ ] Light and dark modes visually consistent and readable
- [ ] Keyboard Tab order logical and complete
- [ ] Focus ring visible on all interactive elements (contrast >3:1)
- [ ] Enter/Space/Escape keys work as expected
- [ ] Modal focus trap works (Tab doesn't escape modal)
- [ ] Screen reader announces content correctly (buttons, inputs, headings, images)
- [ ] WCAG AA contrast ratio met on all text (4.5:1 for normal, 3:1 for large)
- [ ] No color-only status indicators (use icons/text too)
- [ ] Mobile responsive
- [ ] Negative test cases handled (high contrast mode, color blindness, 200% zoom)
- [ ] Axe/WAVE report: 0 critical accessibility errors

❌ **FAIL** if ANY of the following occur:

- [ ] Raw hex codes visible in inspected styles
- [ ] Dark mode unreadable or inconsistent
- [ ] Keyboard navigation skips elements or illogical
- [ ] Focus ring missing or hard to see (contrast <3:1)
- [ ] Modal doesn't trap focus
- [ ] Screen reader unable to announce content
- [ ] Contrast ratios <4.5:1 on critical text
- [ ] Color-only indicators (e.g., red vs. green with no icons)
- [ ] Mobile layout broken
- [ ] Zoom to 200% causes horizontal scroll or text cut-off

**Final Result:** ☐ PASS | ☐ FAIL  
**Notes:** ******\_\_\_\_******

---

## MODULE 11: Quick API Sanity Check (Optional)

### Base URL: `https://alignedai20.vercel.app/api`

**Goal:** Key endpoints return expected responses; auth/CORS working.

### Setup

- [ ] **0.1** Login to main app
- [ ] **0.2** Open DevTools → Application → Local Storage
- [ ] **0.3** Find JWT token (key: `authToken` or similar)
- [ ] **0.4** Copy token value
- [ ] **0.5** Open terminal
- [ ] **0.6** Set environment variable: `export TOKEN="<your-jwt-token>"`
- [ ] **0.7** Verify: `echo $TOKEN` → token printed
- Observed Result: ******\_\_\_\_******

### Step 1: Publishing Queue

```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://alignedai20.vercel.app/api/publishing/queue
```

- [ ] **1.1** Run command
- [ ] **1.2** Response status: **200 OK**
- [ ] **1.3** Response contains:
  - [ ] **1.3a** `data: [...]` (array of posts)
  - [ ] **1.3b** Each post has: `id`, `title`, `platform`, `status`, `createdDate`
  - [ ] **1.3c** `count` or `total` indicating queue size
- [ ] **1.4** No CORS errors in response headers
- [ ] **1.5** No 401/403 auth errors
- Observed Result: ******\_\_\_\_******

### Step 2: Approvals Queue

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "https://alignedai20.vercel.app/api/approvals?status=pending"
```

- [ ] **2.1** Run command
- [ ] **2.2** Response status: **200 OK**
- [ ] **2.3** Response contains:
  - [ ] **2.3a** `data: [...]` (array of pending approvals)
  - [ ] **2.3b** Each item has: `id`, `postId`, `title`, `requestedBy`, `requestedAt`, `status`
  - [ ] **2.3c** `count` indicating pending items
- [ ] **2.4** Query param `?status=pending` filters correctly (only pending items returned)
- [ ] **2.5** No CORS errors
- [ ] **2.6** No auth errors
- Observed Result: ******\_\_\_\_******

### Step 3: Analytics Metrics

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "https://alignedai20.vercel.app/api/analytics/metrics?platform=instagram&days=7"
```

- [ ] **3.1** Run command
- [ ] **3.2** Response status: **200 OK**
- [ ] **3.3** Response contains:
  - [ ] **3.3a** `platform: "instagram"`
  - [ ] **3.3b** `kpis: { reach, engagement, followers, postsPublished }`
  - [ ] **3.3c** `chartData: [...]` with daily breakdowns
  - [ ] **3.3d** Timestamps in ISO 8601 format (e.g., `"2025-01-15T00:00:00Z"`)
- [ ] **3.4** Query params work: `?platform=instagram&days=7` returns 7 days of data
- [ ] **3.5** Test with different platform:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "https://alignedai20.vercel.app/api/analytics/metrics?platform=tiktok&days=30"
```

- [ ] **3.6** Response status: **200 OK**
- [ ] **3.7** Response contains TikTok data (not Instagram)
- [ ] **3.8** 30 days of data returned
- Observed Result: ******\_\_\_\_******

### Step 4: Auth Error Handling

- [ ] **4.1** Test without Bearer token:

```bash
curl https://alignedai20.vercel.app/api/publishing/queue
```

- [ ] **4.2** Response status: **401 Unauthorized**
- [ ] **4.3** Response body: `{ "error": "Missing or invalid authorization token" }` (or similar)
- [ ] **4.4** No data returned (security check passed)
- Observed Result: ******\_\_\_\_******

### Step 5: CORS Verification

- [ ] **5.1** Call API from different origin (e.g., https://example.com)
- [ ] **5.2** Open browser console on example.com
- [ ] **5.3** Run fetch:

```javascript
fetch("https://alignedai20.vercel.app/api/publishing/queue", {
  headers: { Authorization: "Bearer YOUR_TOKEN_HERE" },
})
  .then((res) => res.json())
  .then((data) => console.log(data));
```

- [ ] **5.4** Request succeeds (no CORS error)
- [ ] **5.5** Check response headers:
  - [ ] **5.5a** `Access-Control-Allow-Origin: *` or specific origin
  - [ ] **5.5b** `Access-Control-Allow-Methods: GET, POST, PATCH, DELETE`
  - [ ] **5.5c** `Access-Control-Allow-Headers: Authorization, Content-Type`
- [ ] **5.6** CORS configured correctly for cross-origin requests
- Observed Result: ******\_\_\_\_******

### Negative Test Cases

#### Negative 1: Invalid Endpoint

- [ ] **N1.1** Test invalid endpoint:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://alignedai20.vercel.app/api/invalid-endpoint
```

- [ ] **N1.2** Response status: **404 Not Found**
- [ ] **N1.3** Error message: `{ "error": "Endpoint not found" }`
- Observed Result: ******\_\_\_\_******

#### Negative 2: Malformed JSON Payload

- [ ] **N2.1** Test POST with invalid JSON:

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{invalid-json}' \
  https://alignedai20.vercel.app/api/approvals/request
```

- [ ] **N2.2** Response status: **400 Bad Request**
- [ ] **N2.3** Error message: `{ "error": "Invalid JSON" }`
- Observed Result: ******\_\_\_\_******

#### Negative 3: Expired Token

- [ ] **N3.1** Use expired or revoked token
- [ ] **N3.2** Test API call:

```bash
curl -H "Authorization: Bearer EXPIRED_TOKEN" \
  https://alignedai20.vercel.app/api/publishing/queue
```

- [ ] **N3.3** Response status: **401 Unauthorized**
- [ ] **N3.4** Error message: `{ "error": "Token expired or invalid" }`
- Observed Result: ******\_\_\_\_******

### Evidence & Artifacts

**Required:**

- [ ] Terminal screenshot showing curl commands and responses
- [ ] Response JSON for `/api/publishing/queue`
- [ ] Response JSON for `/api/approvals?status=pending`
- [ ] Response JSON for `/api/analytics/metrics?platform=instagram&days=7`
- [ ] 401 error response for unauthenticated request
- [ ] CORS headers in browser DevTools

**Attach:**

- Screenshot 1: ******\_\_\_\_******
- Screenshot 2: ******\_\_\_\_******
- Terminal output file: ******\_\_\_\_******

### Pass/Fail Criteria

✅ **PASS** if:

- [ ] All endpoints return 200 with expected data structure
- [ ] 401 returned for unauthenticated requests
- [ ] 404 returned for invalid endpoints
- [ ] Query params filter correctly (status, platform, days)
- [ ] CORS headers present and correct
- [ ] Timestamps in ISO 8601 format
- [ ] No server errors (5xx) in response
- [ ] Negative test cases handled gracefully

❌ **FAIL** if:

- [ ] 500 errors from API
- [ ] Unexpected JSON structure
- [ ] Auth not checked (401 not returned for missing token)
- [ ] CORS errors visible
- [ ] Query params ignored
- [ ] Invalid JSON accepted without error

**Final Result:** ☐ PASS | ☐ FAIL  
**Notes:** ******\_\_\_\_******

---

## 🎯 SIGN-OFF CHECKLIST (Per Module)

For each module tested, verify:

| Module                   | Functional Parity | Error Handling | Mobile Responsive (320/768/1024) | Keyboard Accessible | WCAG AA | Final Status    |
| ------------------------ | ----------------- | -------------- | -------------------------------- | ------------------- | ------- | --------------- |
| 1. Signup & Onboarding   | ☐                 | ☐              | ☐                                | ☐                   | ☐       | ☐ PASS / ☐ FAIL |
| 2. Brand Intake          | ☐                 | ☐              | ☐                                | ☐                   | ☐       | ☐ PASS / ☐ FAIL |
| 3. Content Creation      | ☐                 | ☐              | ☐                                | ☐                   | ☐       | ☐ PASS / ☐ FAIL |
| 4. Approval Workflow     | ☐                 | ☐              | ☐                                | ☐                   | ☐       | ☐ PASS / ☐ FAIL |
| 5. Publishing            | ☐                 | ☐              | ☐                                | ☐                   | ☐       | ☐ PASS / ☐ FAIL |
| 6. Analytics Insights    | ☐                 | ☐              | ☐                                | ☐                   | ☐       | ☐ PASS / ☐ FAIL |
| 7. Client Portal         | ☐                 | ☐              | ☐                                | ☐                   | ☐       | ☐ PASS / ☐ FAIL |
| 8. Billing               | ☐                 | ☐              | ☐                                | ☐                   | ☐       | ☐ PASS / ☐ FAIL |
| 9. Live Data & Real-Time | ☐                 | ☐              | ☐                                | ☐                   | ☐       | ☐ PASS / ☐ FAIL |
| 10. Design Tokens & A11y | ☐                 | ☐              | ☐                                | ☐                   | ☐       | ☐ PASS / ☐ FAIL |
| 11. API Sanity Check     | ☐                 | ☐              | N/A                              | N/A                 | N/A     | ☐ PASS / ☐ FAIL |

---

## 📝 OVERALL TEST SUMMARY

**Total Modules Tested:** **_ / 11  
**Modules Passed:** _** / 11  
**Modules Failed:** **\_ / 11  
**Pass Rate:** \_\_**%

**Critical Issues Found:**

1. ***
2. ***
3. ***

**Blockers for Production:**
☐ None — Ready to deploy  
☐ Minor issues — Can deploy with known issues noted above  
☐ Major blockers — DO NOT DEPLOY

**Test Environment Details:**

- Environment URL: `https://alignedai20.vercel.app`
- Commit Hash: `4a845bd475737813b7df4b6030bfe30ca8e98ecf`
- Database: PostgreSQL (Vercel Postgres / Neon / Supabase)
- Auth Provider: JWT / Magic Link / OAuth
- Payment Provider: Stripe (Test Mode)
- AI Provider: OpenAI GPT-4
- Real-Time: WebSocket + Polling Fallback

**Browser Coverage:**

- ☐ Chrome (latest)
- ☐ Firefox (latest)
- ☐ Safari (latest, macOS/iOS)
- ☐ Edge (latest)
- ☐ Mobile Safari (iOS)
- ☐ Mobile Chrome (Android)

**Tester Sign-Off:**

Tester Name: ********\_\_\_\_********  
Date: ********\_\_\_\_********  
Signature: ********\_\_\_\_********

**QA Lead / Manager Review:**

Name: ********\_\_\_\_********  
Date: ********\_\_\_\_********  
Approval: ☐ Approved | ☐ Rejected with feedback  
Comments: ********************\_********************

---

## 📚 APPENDIX: CLEANUP & IDEMPOTENT TESTING

### Post-Test Cleanup

To ensure tests can be run multiple times without breaking state:

#### Cleanup Script (Optional)

```bash
# Reset test data after each test run
npm run db:cleanup

# Or manually:
# - Delete test posts created during testing (keep only seed data)
# - Revoke approval requests
# - Cancel test subscriptions (Stripe)
# - Clear client portal tokens
```

#### Idempotent Test Guidelines

- **Use unique identifiers** for test data (e.g., "Test Post [Timestamp]") to avoid conflicts
- **Check existence before creation**: If "Test Brand" exists, skip creation or use existing
- **Cleanup after each module**: Delete or reset test data to baseline
- **Seed data should be immutable**: Do not modify seed data during tests; create new test items instead

### Database Seed Data (Baseline)

Ensure these exist before testing begins:

```sql
-- Users
INSERT INTO users (id, email, role) VALUES
  ('user-1', 'admin@test.com', 'admin'),
  ('user-2', 'creator@test.com', 'creator'),
  ('user-3', 'client@test.com', 'client');

-- Brands
INSERT INTO brands (id, name, primary_color, secondary_color, user_id) VALUES
  ('brand-1', 'Test Brand', '#2563EB', '#F59E0B', 'user-1');

-- Posts (baseline)
INSERT INTO posts (id, title, status, platform, brand_id) VALUES
  ('post-1', 'Draft Post #1', 'draft', 'linkedin', 'brand-1'),
  ('post-2', 'Pending Approval Post', 'reviewing', 'instagram', 'brand-1'),
  ('post-3', 'Scheduled Post', 'scheduled', 'tiktok', 'brand-1'),
  ('post-4', 'Published Post', 'published', 'linkedin', 'brand-1');
```

Run cleanup after each test cycle:

```sql
-- Delete test-created posts (not baseline seed data)
DELETE FROM posts WHERE title LIKE '%Test%' OR created_at > '2025-01-15';

-- Reset approvals
DELETE FROM approvals WHERE created_at > '2025-01-15';

-- Revoke client portal tokens
DELETE FROM client_portal_tokens WHERE created_at > '2025-01-15';
```

---

**End of Feature Verification Test Plan v2.0**
