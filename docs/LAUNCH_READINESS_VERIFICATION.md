# Launch Readiness Verification — Core Experiences

**Date**: January 2025  
**Status**: 🔄 In Progress

---

## 🎯 Verification Strategy

This document tracks verification of all non-negotiable features for launch. Each section includes:
- ✅ Verified / ⚠️ Issues Found / ❌ Broken
- Test steps
- Issues found
- Fixes applied

---

## 1. Onboarding (Forced Flow) — 10 Steps

### **Test Steps:**
1. Navigate to `/onboarding` as new user
2. Complete all 10 steps sequentially
3. Test browser refresh at each step
4. Test mobile responsiveness
5. Verify redirects work correctly

### **Steps to Verify:**
- [ ] Step 1: Account Setup (email/password)
- [ ] Step 2: Business Essentials (website, type, description)
- [ ] Step 3: Expectation Setting
- [ ] Step 4: AI Scrape (loading animation, progress)
- [ ] Step 5: Brand Summary Review (visual preview, edit modal)
- [ ] Step 6: Weekly Focus Selector
- [ ] Step 7: Content Generation (7-day package)
- [ ] Step 8: Calendar Preview (drag & drop, edit)
- [ ] Step 9: Connect Accounts CTA
- [ ] Step 10: Dashboard Welcome Hero

### **Critical Checks:**
- [ ] Progress state persists in localStorage
- [ ] Browser refresh recovers to correct step
- [ ] Mobile version is usable (no broken layouts)
- [ ] Scrape → Brand Summary → Content → Calendar flow works
- [ ] No console errors at any step

### **Status**: ⏳ Pending Verification

---

## 2. Brand Guide (Minimum Viable Version)

### **Test Steps:**
1. Navigate to Brand Guide
2. Edit and save each field
3. Regenerate AI Snapshot
4. Verify tokens available in Studio
5. Check AI agents use brand data

### **Fields to Verify:**
- [ ] Brand name
- [ ] Logo upload/display
- [ ] Primary/Secondary/Accent colors
- [ ] Font family
- [ ] Voice & tone descriptors
- [ ] Audience overview
- [ ] Values
- [ ] Brand keywords
- [ ] Example posts
- [ ] AI Snapshot (regenerate button)

### **Integration Checks:**
- [ ] Brand colors available in Studio color picker
- [ ] Brand font available in Studio font selector
- [ ] Doc Agent uses brand tone
- [ ] Design Agent uses brand colors
- [ ] Advisor Agent uses brand guidelines

### **Status**: ⏳ Pending Verification

---

## 3. 7-Day Content Engine

### **Test Steps:**
1. Complete onboarding through Step 6 (Weekly Focus)
2. Trigger Step 7 (Content Generation)
3. Verify all content types generated
4. Check Calendar Preview shows posts
5. Test drag, edit, replace, regenerate

### **Content Types to Verify:**
- [ ] 5 social media posts
- [ ] 1 email newsletter
- [ ] 1 Google Business Profile post
- [ ] 1 blog/caption expansion (optional)
- [ ] Images included (scraped or default)

### **Calendar Preview Checks:**
- [ ] Posts appear on correct days
- [ ] Drag & drop works
- [ ] Click to edit works
- [ ] Regenerate button works
- [ ] Replace image works

### **Error Handling:**
- [ ] Slow API shows loading state
- [ ] Timeout shows error message
- [ ] Partial generation still shows what was created
- [ ] Retry mechanism works

### **Status**: ⏳ Pending Verification

---

## 4. Creative Studio

### **Test Steps:**
1. Open Studio entry screen
2. Upload image to edit
3. Edit existing design
4. Select text element → verify floating toolbar
5. Apply brand style
6. Test AI rewrite
7. Export, Save, Draft

### **Entry Screen:**
- [ ] "Upload to Edit" works
- [ ] "Edit from Library" shows recent designs
- [ ] Recent designs load correctly
- [ ] "Start from AI" / "Blank Canvas" (secondary) work

### **Editor Functionality:**
- [ ] Canvas loads without errors
- [ ] Floating toolbar appears on element selection
- [ ] Text editing works (font, size, color, alignment)
- [ ] Image editing works (replace, crop placeholder)
- [ ] Brand style button applies font + color
- [ ] AI rewrite opens modal (Phase 2: inline)
- [ ] Properties panel shows when element selected
- [ ] Properties panel shows canvas properties when nothing selected

### **Actions:**
- [ ] Save to Library works
- [ ] Save as Draft works
- [ ] Download works
- [ ] Publish works
- [ ] Export (PNG/SVG) works

### **Mobile:**
- [ ] Canvas doesn't break on mobile
- [ ] Toolbar is accessible
- [ ] Properties panel is usable

### **Status**: ⏳ Pending Verification

---

## 5. Calendar & Scheduling

### **Test Steps:**
1. Navigate to Calendar
2. Test drag & drop scheduling
3. Click day → verify Schedule Modal
4. Save schedule → verify instant update
5. Toggle Weekly ↔ Monthly
6. Verify timezone handling
7. Check post statuses

### **Drag & Drop:**
- [ ] Drag existing post to new date/time
- [ ] Drop updates scheduled time
- [ ] UI updates immediately
- [ ] Backend persists change
- [ ] Error handling (revert on failure)

### **Schedule Modal:**
- [ ] Opens on day click
- [ ] Date/time picker works
- [ ] Platform selection works
- [ ] Auto-publish toggle works
- [ ] Save button works
- [ ] Cancel button works

### **View Toggles:**
- [ ] Weekly view works
- [ ] Monthly view works
- [ ] Toggle between views works
- [ ] Posts display correctly in both

### **Timezone:**
- [ ] User timezone detected
- [ ] Scheduled times convert correctly
- [ ] Display shows user's local time

### **Post Statuses:**
- [ ] Draft posts show "Draft" badge
- [ ] Generated posts show "Generated" badge
- [ ] Scheduled posts show "Scheduled" badge
- [ ] Status colors are clear

### **Weekend Restrictions:**
- [ ] NO weekend blocking (removed)
- [ ] Can schedule on Saturday/Sunday
- [ ] No warnings about weekends

### **Status**: ⏳ Pending Verification

---

## 6. AI Agent System

### **Doc Agent:**
- [ ] Generate copy works
- [ ] Rewrite/adjust tone works
- [ ] Produces content with metadata
- [ ] Respects brand tone + guidelines
- [ ] BFS score calculated
- [ ] Compliance warnings shown
- [ ] Variants displayed

### **Design Agent:**
- [ ] Generate concepts works
- [ ] Attach to canvas works
- [ ] Provides variants
- [ ] Respects brand colors/fonts
- [ ] BFS score calculated

### **Advisor Agent:**
- [ ] Insights populate on dashboard
- [ ] BFS score displayed
- [ ] Compliance warnings shown
- [ ] "Try this next" suggestions appear
- [ ] Handles unknown brands gracefully
- [ ] Handles empty data gracefully
- [ ] No errors on API failure

### **Status**: ⏳ Pending Verification

---

## 7. Integrations (Critical for Monetization)

### **OAuth Connection:**
- [ ] Google Business Profile connects
- [ ] Facebook/Instagram connects
- [ ] LinkedIn connects
- [ ] TikTok connects (nice to have)
- [ ] Mailchimp connects (nice to have)

### **Onboarding Step:**
- [ ] "Connect Accounts" step appears
- [ ] OAuth flow works
- [ ] Success message shows
- [ ] Skip option works

### **Publishing:**
- [ ] Queue → Publish works
- [ ] Success/failure handling
- [ ] Error messages are clear
- [ ] Retry mechanism works

### **Analytics:**
- [ ] Fetching analytics works
- [ ] Data displays correctly
- [ ] Refresh button works
- [ ] Last updated timestamp shows

### **Token Management:**
- [ ] Refresh token rotation works
- [ ] Expired tokens detected
- [ ] Reconnect flow works
- [ ] Graceful error handling

### **Status**: ⏳ Pending Verification

---

## 8. Client Collaboration Components

### **Approval Queue:**
- [ ] Queue page loads
- [ ] Posts show in queue
- [ ] Approve button works
- [ ] Reject button works
- [ ] Status updates correctly

### **Status Tags:**
- [ ] "Approved" badge shows
- [ ] "Pending" badge shows
- [ ] "Rejected" badge shows
- [ ] Colors are clear

### **Commenting:**
- [ ] Add comment works
- [ ] Comments display
- [ ] Edit comment works
- [ ] Delete comment works

### **Revision Requests:**
- [ ] Request revision works
- [ ] Revision shows in queue
- [ ] Creator sees revision request

### **Client Portal:**
- [ ] Client can access portal
- [ ] Brand Guide view-only works
- [ ] Analytics view works
- [ ] Shareable links work

### **Shareable Analytics Links:**
- [ ] Generate link works
- [ ] Link opens report
- [ ] Passcode protection works
- [ ] Expiration works
- [ ] Revoke works

### **Status**: ⏳ Pending Verification

---

## 9. Templates, Library, Media System

### **Uploads:**
- [ ] Image upload works
- [ ] Video upload works (if supported)
- [ ] File size limits enforced
- [ ] Progress indicator shows

### **Library:**
- [ ] Library page loads
- [ ] Thumbnails display
- [ ] Grid view works
- [ ] List view works
- [ ] No broken previews
- [ ] No 404s

### **Search & Filters:**
- [ ] Search works
- [ ] Filter by brand works
- [ ] Filter by type works
- [ ] Filter by date works

### **Status**: ⏳ Pending Verification

---

## 10. Billing & Accounts

### **Billing:**
- [ ] Stripe checkout works
- [ ] Per-brand pricing calculates
- [ ] Trial logic works
- [ ] Cancel subscription works
- [ ] Add/remove brands updates billing
- [ ] Email receipts sent

### **Account Management:**
- [ ] Add team member works
- [ ] Remove team member works
- [ ] Role permissions enforced
- [ ] Workspace switching works
- [ ] Delete brand works (safe deletion)

### **Security:**
- [ ] OAuth tokens encrypted
- [ ] Supabase RLS working
- [ ] Audit logs stored
- [ ] No data leakage between brands

### **Status**: ⏳ Pending Verification

---

## 11. Public Site + Legal + Performance

### **Public Website:**
- [ ] Landing page loads
- [ ] Features page loads
- [ ] Pricing page loads
- [ ] Blog index loads
- [ ] Blog post pages load
- [ ] Demo experience works
- [ ] CTA flows work
- [ ] Navigation works
- [ ] Mobile responsive

### **Legal Pages:**
- [ ] Privacy Policy loads
- [ ] Terms of Service loads
- [ ] Cookie Policy loads
- [ ] Data Deletion loads
- [ ] Acceptable Use loads
- [ ] Refund Policy loads
- [ ] API Policy loads
- [ ] AI Disclosure loads
- [ ] Security Statement loads
- [ ] All linked in footer

### **Performance:**
- [ ] Lighthouse score > 80
- [ ] No large blocking scripts
- [ ] Dashboard widgets lazy-loaded
- [ ] Images optimized
- [ ] Bundle size reasonable

### **Status**: ⏳ Pending Verification

---

## 12. Post-Onboarding Tour

### **Test Steps:**
1. Complete onboarding
2. Land on dashboard
3. Verify tour triggers
4. Complete all 4 steps
5. Test "Skip" option
6. Test "Show me again"

### **Steps to Verify:**
- [ ] Step 1: Dashboard overview
- [ ] Step 2: Creative Studio
- [ ] Step 3: Calendar
- [ ] Step 4: Connect Accounts
- [ ] Confetti animation on completion

### **Functionality:**
- [ ] Tour triggers once (localStorage flag)
- [ ] Tooltips anchor correctly
- [ ] "Next" button works
- [ ] "Skip" button works
- [ ] "Show me again" option works
- [ ] Mobile-friendly

### **Status**: ⏳ Pending Verification

---

## 🔍 Verification Process

1. **Systematic Testing**: Go through each section methodically
2. **Document Issues**: Record all bugs, missing features, UX problems
3. **Prioritize Fixes**: Critical → High → Medium → Low
4. **Re-test**: Verify fixes work
5. **Sign-off**: Mark each section as ✅ Ready for Launch

---

## 📊 Overall Status

- **Total Sections**: 12
- **Verified**: 0
- **Issues Found**: 0
- **Ready for Launch**: ❌ Not Yet

---

**Next Steps**: Begin systematic verification of each section.

