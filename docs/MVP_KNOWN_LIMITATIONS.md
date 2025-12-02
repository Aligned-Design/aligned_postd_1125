# MVP Known Limitations & Issues

**Date**: January 2025  
**Purpose**: Document known issues, limitations, and workarounds for each MVP from a client perspective

---

## MVP 2: Brand Guide Builder

### Known Issues

#### Issue 1: Brand Guide Not Loading for New Brands
**Impact**: Medium  
**Description**: If a brand is created without going through onboarding scrape, the Brand Guide page may show empty state even after manual edits.

**Workaround**: 
- Complete onboarding flow (Steps 1-5) to auto-populate Brand Guide
- OR manually fill all Brand Guide fields and save

**Status**: ⚠️ Needs investigation

---

#### Issue 2: Scraped Images Not Appearing in Brand Guide
**Impact**: Low  
**Description**: Images scraped during onboarding may not appear in Brand Guide UI immediately.

**Workaround**: 
- Refresh page after scrape completes
- Navigate away and back to Brand Guide page

**Status**: ⚠️ Non-critical (images are saved, just UI refresh issue)

---

#### Issue 3: Brand Guide Auto-Save Error Handling
**Impact**: Low  
**Description**: Auto-save now shows clear status and error messages.

**Status**: ✅ **Fixed** — Brand Guide now shows:
- "Saving..." indicator while saving
- "✓ Saved" confirmation after successful save
- "⚠ Error saving" if save fails
- Toast notification with error details

---

## MVP 3: AI Content Generator

### Known Issues

#### Issue 1: AI Generation Unavailable if API Keys Not Configured
**Impact**: Low  
**Description**: If OpenAI or Anthropic API keys are not set in environment, AI generation is unavailable.

**Status**: ✅ **Fixed** — UI now:
- Checks AI availability via health endpoint
- Disables Generate button when AI unavailable
- Shows clear message: "AI generation is currently unavailable. Please contact support or your admin to enable AI."
- Applies to both Content Generator and Creative Studio "Start from AI"

---

#### Issue 2: Generated Content May Not Match Brand Guide Tone
**Impact**: Medium  
**Description**: In rare cases, AI-generated content may not perfectly match Brand Guide tone settings, especially if Brand Guide is newly created.

**Workaround**: 
- Regenerate content multiple times
- Manually edit generated content
- Refine Brand Guide tone descriptors for better results

**Status**: ⚠️ Expected behavior (AI is probabilistic)

---

#### Issue 3: 7-Day Content Generation Takes 30-60 Seconds
**Impact**: Low  
**Description**: Generating 7 content items can take 30-60 seconds, which may feel slow to users.

**Workaround**: 
- Wait for generation to complete (progress indicator shows status)
- Don't refresh page during generation

**Status**: ✅ Expected (generating 7 items takes time)

---

#### Issue 4: BFS Score May Be Low for New Brands
**Impact**: Low  
**Description**: Brand Fidelity Score may be lower (< 0.80) for brands with minimal Brand Guide data.

**Workaround**: 
- Complete Brand Guide with detailed tone, keywords, and examples
- Regenerate content after Brand Guide is complete
- BFS should improve with more Brand Guide data

**Status**: ✅ Expected behavior

---

## MVP 4: Creative Studio

### Known Issues

#### Issue 1: Large Images May Cause Performance Issues
**Impact**: Medium  
**Description**: Uploading very large images (> 10MB) may cause slow loading or browser crashes.

**Workaround**: 
- Compress images before uploading (recommended: < 5MB)
- Use image optimization tools before upload

**Status**: ⚠️ Needs image compression/optimization

---

#### Issue 2: Design May Not Save if Browser Closes Unexpectedly
**Impact**: Medium  
**Description**: If browser closes or crashes before auto-save completes, unsaved changes may be lost.

**Workaround**: 
- Manually click "Save" button frequently
- Use browser's "Restore Session" feature if available

**Status**: ⚠️ Needs better auto-save reliability

---

#### Issue 3: Brand Colors May Not Appear in Color Picker
**Impact**: Low  
**Description**: If Brand Guide colors are not set, color picker may not show brand colors.

**Workaround**: 
- Complete Brand Guide color setup first
- Use manual color picker as alternative

**Status**: ✅ Expected (requires Brand Guide setup)

---

#### Issue 4: AI Design Generation Requires Brand Guide
**Impact**: Low  
**Description**: AI design generation works best when Brand Guide has colors, fonts, and visual style defined.

**Workaround**: 
- Complete Brand Guide before using AI design generation
- AI will still work but may not match brand style as well

**Status**: ✅ Expected behavior

---

## MVP 5: Scheduler + Queue + Approvals

### Known Issues

#### Issue 1: Approval Queue Empty State
**Impact**: Low  
**Description**: Content must be explicitly submitted with "Require approval" enabled to appear in approval queue.

**Status**: ✅ **Fixed** — Now shows friendly empty state with explanation and tip to enable "Require approval"

---

#### Issue 2: Calendar Drag & Drop May Not Work on Mobile
**Impact**: Low  
**Description**: Drag & drop rescheduling may not work on touch devices.

**Workaround**: 
- Use desktop/laptop for drag & drop
- Use schedule modal (click item → edit) on mobile

**Status**: ⚠️ Mobile UX limitation

---

#### Issue 3: Scheduled Content May Not Publish if Platform Not Connected
**Impact**: Low  
**Description**: If social media platform (Instagram, LinkedIn, etc.) is not connected via OAuth, scheduled content will not publish.

**Status**: ✅ **Fixed** — Schedule modal now:
- Shows which platforms are connected
- Blocks scheduling (disables button) when no platforms connected and auto-publish is ON
- Shows clear message: "Connect at least one platform in Settings"
- Calendar shows banner when no platforms connected

---

#### Issue 4: Timezone Conversion May Be Incorrect
**Impact**: Medium  
**Description**: Scheduled times may not convert correctly to user's timezone.

**Workaround**: 
- Verify timezone in browser settings
- Double-check scheduled time matches expected local time
- Report incorrect timezone conversion to support

**Status**: ⚠️ Needs timezone testing

---

#### Issue 5: Bulk Approve May Fail for Large Batches
**Impact**: Low  
**Description**: Approving 50+ items at once may timeout or fail.

**Workaround**: 
- Approve in smaller batches (10-20 items at a time)
- Use individual approve for critical items

**Status**: ⚠️ Needs batch size limits

---

## Cross-MVP Issues

### Issue 1: Multi-Tenant Data Leakage
**Impact**: Critical  
**Description**: If RLS (Row Level Security) policies are misconfigured, users may see other brands' data.

**Workaround**: 
- Report immediately if you see another brand's data
- Do not use leaked data
- Contact support immediately

**Status**: ❌ Critical security issue (should not occur, but report if found)

---

### Issue 2: Brand Guide Changes Not Reflected in AI Generation
**Impact**: Medium  
**Description**: If Brand Guide is updated, existing generated content does not automatically update.

**Workaround**: 
- Regenerate content after Brand Guide updates
- New content will use updated Brand Guide

**Status**: ✅ Expected behavior (content is snapshot, not live)

---

### Issue 3: Slow Performance on Large Brands
**Impact**: Low  
**Description**: Brands with 100+ content items may experience slower loading times.

**Workaround**: 
- Use filters to reduce visible items
- Paginate or limit view to recent items

**Status**: ⚠️ Needs performance optimization

---

## Environment-Specific Issues

### Issue 1: OAuth Redirect URLs Must Match Production Domain
**Impact**: High  
**Description**: Social media platform connections (Instagram, LinkedIn, etc.) will fail if OAuth redirect URLs don't match production domain.

**Workaround**: 
- Contact support to configure OAuth redirect URLs
- Cannot connect platforms until URLs are configured

**Status**: ❌ Blocker for platform connections (backend configuration)

---

### Issue 2: Email Notifications May Not Work
**Impact**: Low  
**Description**: Approval email notifications require email service configuration.

**Workaround**: 
- Check in-app notifications instead
- Manually notify approvers if needed

**Status**: ⚠️ Non-critical (in-app notifications work)

---

## Reporting Issues

When reporting issues, include:
1. **MVP**: Which MVP (2, 3, 4, or 5)
2. **Step**: What step were you on?
3. **Expected**: What should have happened?
4. **Actual**: What actually happened?
5. **Screenshot**: If possible
6. **Browser/OS**: Browser and OS version
7. **Brand ID**: (if safe to share, for debugging)

---

## Temporary Workarounds Summary

| Issue | Workaround |
|-------|------------|
| Brand Guide empty | Complete onboarding or manually fill |
| AI generation fails | Check API keys configured |
| Approval queue empty | Ensure "Require approval" is ON |
| Platform not publishing | Connect platform in Settings first |
| Timezone incorrect | Verify browser timezone settings |
| Slow performance | Use filters, limit view |
| Images not appearing | Refresh page |

---

## Priority Fixes Needed

### P0 (Blockers):
1. OAuth redirect URLs configuration
2. AI API keys configuration
3. Multi-tenant data leak (if found)

### P1 (High Priority):
1. Approval queue empty state messaging
2. Brand Guide auto-save error handling
3. Timezone conversion testing

### P2 (Medium Priority):
1. Image compression/optimization
2. Mobile drag & drop alternative
3. Bulk approve batch size limits

### P3 (Low Priority):
1. Performance optimization for large brands
2. Better loading states
3. Email notification configuration

