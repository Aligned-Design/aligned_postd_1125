# Launch Smoke Test Checklist

**Purpose**: One crisp pass to verify a real human can use the product and it feels coherent.

**Note**: This checklist focuses on **v1 launch-critical flows only**. Items like Canva connector, dark mode, full WCAG audit, and advanced performance work are intentionally deferred (see `POST_LAUNCH_ROADMAP.md`).

**Pre-conditions**:
- ✅ Staging environment deployed with latest migrations (including `20251118_fix_milestones_rls.sql`)
- ✅ CI pipeline green (typecheck + lint passing)
- ✅ Test users available:
  - One "agency owner" test user
  - One "client viewer" test user (if possible)

---

## Flow 1 – Onboarding → Brand Guide → AI

**As**: Agency Owner user

### Sign up / Log in
- [ ] You can create or log into an agency account without errors
- [ ] No console errors in dev tools

### Create a new brand via onboarding
- [ ] Enter brand name, website, industry
- [ ] Choose one of the new color themes you just token-ized
- [ ] Continue through all steps to the final "Dashboard welcome"
- [ ] **Visual Check**: Confetti/particles use on-brand colors (purple/lime palette, not random)
- [ ] **Visual Check**: Backgrounds look consistent (no sudden dark/light shifts)

### Brand Guide verification
- [ ] Go to Brand Guide page for that brand
- [ ] Identity, voice/tone, audience are populated from onboarding/AI
- [ ] **Visual Check**: Visual Identity colors match the theme / tokens (no off-brand random hexes)
- [ ] You can edit and save without errors
- [ ] Autosave works (wait 2 seconds after edit, see "Saved" indicator)

### AI brand summary & plan
- [ ] Trigger AI brand summary (if explicit action) or verify it's present
- [ ] Verify 7-day or 30-day content plan exists (titles/descriptions make sense)
- [ ] If there's BFS/compliance info, it appears and doesn't break the UI

---

## Flow 2 – Creative Studio

**Same brand**

### Start from AI
- [ ] From Studio, choose "Start from AI" (or equivalent)
- [ ] Enter a prompt / pick a suggested one
- [ ] AI returns variants
- [ ] **Critical**: Selecting a variant opens a canvas with actual content on it (not blank)
- [ ] Canvas shows brand colors/fonts correctly

### Blank canvas
- [ ] Choose "Blank Canvas" or equivalent
- [ ] See a brand-aware canvas (brand fonts/colors available)
- [ ] Add at least one element (text or image) and save/update
- [ ] **Visual Check**: Default zoom shows entire canvas (fit-to-screen)

### Upload to edit
- [ ] Upload an image
- [ ] It appears on the canvas, centered or reasonably placed
- [ ] You can move/resize and save

### A11y basics in Studio
- [ ] Tab through AI panels: focus moves logically
- [ ] Labels read properly (no mystery inputs)
- [ ] Pressing Enter (or Cmd/Ctrl+Enter) triggers AI as expected
- [ ] No console errors during Studio interactions

---

## Flow 3 – Calendar & Statuses

### View calendar
- [ ] Navigate to Calendar
- [ ] Any drafts/scheduled posts from AI/Studio appear on the correct days
- [ ] **Visual Check**: Loading state shows while fetching
- [ ] **Visual Check**: Empty state is helpful (not just blank)

### States & filters
- [ ] Switch filters: draft / pending / scheduled / published
- [ ] Only matching items show in each filter
- [ ] Empty state appears when there are none (and is helpful)

### Status chips
- [ ] Colors & labels for draft / pending / scheduled / published are correct and readable
- [ ] Status pills use design tokens (not hard-coded colors)

### Post card actions
- [ ] **Preview**: Click "Preview" → modal opens with full content
- [ ] **Edit**: Click "Edit" → navigates to Studio with post loaded
- [ ] **Approve**: Click "Approve" → status updates, toast shows success

---

## Flow 4 – Approvals & Publishing

### Create a piece requiring approval
- [ ] In Studio or Content, mark a post as "needs approval" / "pending review"
- [ ] Post appears in Approvals queue

### Approve as manager/owner
- [ ] Switch to an account with manager/owner role (if roles are wired)
- [ ] Approve the content
- [ ] Status moves from "pending" → "scheduled" or "published"
- [ ] Post appears in Calendar with updated status

### Client permissions sanity
- [ ] As a client viewer (if available), confirm:
  - [ ] Can see content
  - [ ] Cannot approve or edit where they shouldn't
  - [ ] Gets 403 or friendly message if attempting unauthorized action

**Note**: Even if you can't fully simulate all roles yet, just confirm the main approval happy path works.

---

## Flow 5 – Analytics (basic)

### Open Analytics for brand
- [ ] Page loads with a visible loading state
- [ ] When data loads, charts/tables appear (even if mocked/test data)
- [ ] **Visual Check**: Empty state shows if no data (not broken page)
- [ ] If you force an error (temporary API break or bad brandId), the error UI & retry show

**Note**: You don't need perfect real metrics yet, just no broken page and clear states.

---

## Flow 6 – Quick Regression Checks

### Brand switching
- [ ] Switch between brands: all brand-scoped screens (Dashboard, Calendar, Studio, Analytics) update correctly
- [ ] No stale data from previous brand
- [ ] No console errors during brand switch

### Mobile responsiveness
- [ ] Mobile view for one main page (Studio or Dashboard) looks sane
- [ ] No broken words / impossible buttons
- [ ] Touch targets are reasonable size

### Console & security
- [ ] Open dev tools console:
  - [ ] No red errors when navigating through the main flows
  - [ ] No obvious PII logs (email, tokens, secrets)
  - [ ] Logger utility used (not `console.log` for sensitive data)

---

## RLS Security Test (Milestones)

**As**: User in Brand A
- [ ] Can see only Brand A milestones
- [ ] Cannot see milestones for Brand B (if Brand B exists)

**As**: User in Brand B
- [ ] Cannot see Brand A milestones
- [ ] Can see only Brand B milestones

**As**: Viewer role
- [ ] Can read milestones (SELECT works)
- [ ] Cannot create/update/delete (should get 403 or similar)
- [ ] Attempting INSERT/UPDATE/DELETE shows appropriate error

---

## Final Sign-off

**Issues Found**:
- [ ] Document any "ugh" moments → Create P1 ticket
- [ ] Document anything actually broken → Fix now or create P0 ticket

**Status**:
- [ ] ✅ All critical flows work
- [ ] ✅ No blocking issues
- [ ] ✅ Ready for production deployment

**Notes**:
_Add any observations, edge cases, or follow-up items here_

---

## Quick Reference: Design Token Verification

During the smoke test, verify these visual elements use design tokens:

- [ ] Onboarding color themes use token hex values (not `#4F46E5`, etc.)
- [ ] Particle animations use `primary-light`, `purple-400`, `slate-200`, `purple-500`, `success`
- [ ] Brand Guide default colors use `primary-dark`, `success`, `blue-500`
- [ ] Studio placeholder colors use `foreground` token (`#111827`, not `#000000`)
- [ ] Status chips use semantic colors (success, warning, error tokens)

