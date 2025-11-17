# QA Team: Quick Reference Guide

**Audit Date**: November 11, 2025
**Verdict**: 🟡 READY_WITH_WARNINGS (96/100)
**Estimated QA Time**: 4-6 hours

---

## ⚡ TL;DR

✅ **All routes work** (24/25 passing)
✅ **All workflows operational** (8/8)
⚠️ **One beta feature** needs verification
❌ **No critical blockers**
🎯 **Clear for staging** | Conditional for production

---

## 🚀 Quick Start

### 1. What to Test (31 Test Cases)

**Route Testing** (5 min)
- [ ] All 25 routes load without 404
- [ ] Invalid routes → /404 page
- [ ] Protected routes require auth
- [ ] Auth redirects work
- [ ] No console errors

**Workflow Testing** (2-3 hours)
- [ ] Auth: signup → dashboard
- [ ] Content: generate → queue → approve → schedule
- [ ] Campaign: create → dashboard
- [ ] Queue: view → select platform → schedule → calendar
- [ ] Analytics: view metrics → drill-down → export
- [ ] Accounts: connect → verify token health
- [ ] Brand: intake form → guide → snapshot
- [ ] Settings: update → save → verify persistence

**Interaction Testing** (30 min)
- [ ] All CTAs navigate correctly
- [ ] Buttons show loading states
- [ ] Breadcrumbs work
- [ ] Pagination functions
- [ ] Filters/sorts work
- [ ] Modals open/close
- [ ] Toasts appear
- [ ] Keyboard shortcuts work

**Responsive Testing** (30 min)
- [ ] Mobile menu works
- [ ] Tables readable on mobile
- [ ] Buttons clickable on touch
- [ ] No horizontal scroll
- [ ] Small screens render correctly

**Error Testing** (15 min)
- [ ] 404 page shows navigation
- [ ] Expired auth → reconnect prompt
- [ ] API errors → friendly message
- [ ] Empty states → guidance
- [ ] Console clean

---

## 🎯 25 Routes to Test

### Quick Test All
```bash
# All these routes should load (HTTP 200)
/
/onboarding
/dashboard
/calendar
/content-queue
/approvals
/creative-studio
/content-generator
/campaigns
/brands
/brand-intake
/brand-guide
/brand-snapshot
/brand-intelligence
/analytics
/reporting
/paid-ads        ← ⚠️ Verify beta messaging
/library
/client-portal
/events
/reviews
/linked-accounts
/settings
/client-settings
/billing
```

### Grouping by Category
- **Auth**: `/`, `/onboarding`
- **Core**: `/dashboard`, `/calendar`, `/content-queue`, `/approvals`, `/creative-studio`, `/content-generator`
- **Strategy**: `/campaigns`, `/brands`, `/brand-intake`, `/brand-guide`, `/brand-snapshot`, `/brand-intelligence`, `/analytics`, `/reporting`, `/paid-ads`
- **Assets**: `/library`, `/client-portal`, `/events`, `/reviews`, `/linked-accounts`
- **Settings**: `/settings`, `/client-settings`, `/billing`

---

## ⚠️ The One Warning

**Paid Ads** (`/paid-ads`) - Beta Feature

**Issue**: Should clearly display beta/coming-soon status
**Action**: Verify the page displays appropriate messaging
**Time**: 5 minutes
**Importance**: Prevents user confusion

---

## 8 Workflows to Complete

### 1. Auth Flow (5 min)
Sign up → Enter details → Confirm → Login → Dashboard

### 2. Content Creation (30 min)
Create Post → Select brand → Generate → Preview → Queue → Approve → Schedule

### 3. Campaign Management (20 min)
New Campaign → Add details → Add posts → Save → Dashboard

### 4. Content Queue (15 min)
View queue → Select posts → Choose platform/date → Schedule → Calendar

### 5. Analytics (20 min)
Analytics page → Select date → View metrics → Click campaign → Drill-down

### 6. Linked Accounts (10 min)
Connect account → OAuth flow → Confirm → Verify health

### 7. Brand Setup (15 min)
Brand intake → Fill form → Upload assets → Save → View guide

### 8. Settings (10 min)
Edit profile → Change preferences → Save → Verify persistence

---

## 7 Primary CTAs to Check

| Button | Should Go To | Location |
|--------|-------------|----------|
| Create Post | /content-generator | Dashboard |
| New Campaign | /campaigns | Dashboard |
| Connect Account | /linked-accounts | Dashboard |
| Generate Report | /reporting | Analytics |
| View Analytics | /analytics | Dashboard |
| Schedule Post | /calendar | Content Queue |
| Submit for Approval | /approvals | Content Queue |

---

## 📋 Quick Checklist

### Before Testing
- [ ] Fresh browser (clear cache)
- [ ] Incognito/private window
- [ ] DevTools open (check console)
- [ ] Network throttling OFF (first pass)
- [ ] Note any errors

### During Testing
- [ ] Test on Chrome first
- [ ] Then Safari
- [ ] Then Firefox
- [ ] Mobile (iPhone or Android)
- [ ] Screenshot failures

### After Testing
- [ ] Document any issues
- [ ] Note improvement areas
- [ ] Sign off in QA system
- [ ] Clear for production (if all pass)

---

## 🔍 What to Look For

### Good Signs ✅
- Routes load instantly
- Buttons respond immediately
- No console errors
- Toasts appear on action
- Forms save without error
- Navigation highlights active page

### Bad Signs ❌
- Routes show 404
- Buttons don't respond
- Console errors appear
- Features don't load
- Forms fail to save
- Redirects fail

---

## 🔧 Troubleshooting

### Route returns 404
- Check spelling in address bar
- Hard refresh (Cmd+Shift+R)
- Check App.tsx route definition

### Button doesn't work
- Check if button is disabled
- Look for error in console
- Test in incognito mode

### Form won't save
- Check network tab for failed requests
- Verify API is responding
- Check local storage is not full

### Pages load slowly
- Check network tab
- Test with throttling OFF first
- Note Load Time in report

---

## 📱 Mobile Testing Dimensions

Test these breakpoints:
- **Mobile**: 375px (iPhone SE)
- **Tablet**: 768px (iPad)
- **Desktop**: 1024px+ (Desktop)

Check:
- Menu collapse/expand
- Button sizes (tap target ≥ 44px)
- Table scrolling
- Form input focus states

---

## 📊 Metrics to Capture

**Performance**:
- Page load time (< 3s ideal)
- Time to interactive
- Largest contentful paint

**Coverage**:
- Routes tested: 25
- Workflows tested: 8
- Test cases passed: ?/31
- Blockers: ?

**Quality**:
- Console errors: ?
- Console warnings: ?
- Accessibility issues: ?

---

## ✅ Approval Gate

### Ready for Production When:
- [ ] All 25 routes load
- [ ] All 8 workflows pass
- [ ] All 31 test cases pass
- [ ] No critical console errors
- [ ] Paid Ads beta messaging verified
- [ ] Mobile responsive verified
- [ ] Browser test (Chrome, Safari, Firefox) pass
- [ ] Accessibility audit passes
- [ ] QA team sign-off

---

## 📞 Escalation

**Found a critical issue?**
1. Take screenshot
2. Note exact steps to reproduce
3. Check console for errors
4. File issue in tracking system
5. Notify engineering lead

**Need clarification?**
- Check SITEMAP_AUDIT_SUMMARY.md
- Review sitemap-audit-report.json
- Run `npx tsx qa/sitemap-audit.ts`

---

## 📚 Documents

- **Summary**: `qa/SITEMAP_AUDIT_SUMMARY.md` (human-readable)
- **Report**: `qa/sitemap-audit-report.json` (machine-readable)
- **Script**: `qa/sitemap-audit.ts` (runnable audit)
- **This Guide**: `qa/QA_QUICK_REFERENCE.md` (quick lookup)

---

## ⏱️ Time Estimates

| Task | Time | Priority |
|------|------|----------|
| Route Testing | 15 min | HIGH |
| Workflow Testing | 3 hours | HIGH |
| Interaction Testing | 30 min | MEDIUM |
| Responsive Testing | 30 min | MEDIUM |
| Error Testing | 15 min | MEDIUM |
| Browser Testing | 30 min | HIGH |
| Report & Sign-off | 30 min | HIGH |
| **TOTAL** | **5-6 hours** | - |

---

## 🎯 Success Criteria

**This QA pass is SUCCESSFUL when:**
1. ✅ All 25 routes accessible
2. ✅ All 8 workflows functional
3. ✅ All 7 CTAs navigate correctly
4. ✅ Mobile responsive works
5. ✅ No critical console errors
6. ✅ Paid Ads beta messaging clear
7. ✅ All error scenarios handled
8. ✅ QA team approves

---

**Good luck! 🎉 Expected completion: 6 hours from start**

