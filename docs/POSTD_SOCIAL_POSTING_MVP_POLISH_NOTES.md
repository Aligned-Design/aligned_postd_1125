# POSTD Social Posting MVP Polish Notes

**Implementation Date:** 2025-01-XX  
**Reference:** docs/POSTD_SOCIAL_POSTING_BEHAVIOR_AUDIT.md

---

## Summary

This document summarizes the UX and behavior improvements implemented to polish the Facebook + Instagram posting experience in POSTD, following the flow:

**Plan → Generate → Edit/Refine → Preview → Schedule → Publish**

---

## Files Touched

### New Files Created

| File | Purpose |
|------|---------|
| `client/components/content/RefinementToolbar.tsx` | Quick-action toolbar for caption refinement (shorten, expand, tone, emojis) |
| `client/components/content/SocialPostPreview.tsx` | Inline platform preview component showing FB/IG mock-ups |

### Modified Files

| File | Changes |
|------|---------|
| `server/routes/agents.ts` | Added `POST /api/agents/refine-caption` endpoint |
| `client/components/content/SocialContentEditor.tsx` | Integrated RefinementToolbar, SocialPostPreview, and Approve button |
| `client/components/dashboard/ScheduleModal.tsx` | Added optional content preview with `DualPlatformPreview` |
| `server/lib/publishing-queue.ts` | Added approval status guardrail (`checkContentApprovalStatus`) |

---

## New API Endpoints

### POST /api/agents/refine-caption

Refines a caption using AI while maintaining brand voice.

**Request:**
```json
{
  "brand_id": "uuid",
  "caption": "Original caption text...",
  "platform": "facebook" | "instagram_feed" | "instagram_reel",
  "refinement_type": "shorten" | "expand" | "more_fun" | "more_professional" | "add_emojis" | "remove_emojis",
  "hashtags": ["#optional", "#array"]
}
```

**Response:**
```json
{
  "success": true,
  "refined_caption": "Refined caption text...",
  "refinement_type": "shorten",
  "original_length": 250,
  "refined_length": 120,
  "tokens_used": { "input": 500, "output": 100 }
}
```

---

## Features Implemented

### 1. Caption Refinement Toolbar (Spec #8)

**Location:** `RefinementToolbar.tsx` integrated into `SocialContentEditor.tsx`

**Buttons:**
- **Shorten** - Reduces caption length by 30-50% while keeping core message
- **Expand** - Adds detail and context without being verbose
- **More Fun** - Adds playfulness and personality
- **More Pro** - Makes tone more polished and professional
- **Add 😀 / Remove 😀** - Contextually shows based on current emoji presence

**How it works:**
1. User clicks a refinement button
2. Current caption + brand guide context sent to `/api/agents/refine-caption`
3. AI refines caption per the requested style
4. New caption replaces current, marked as unsaved change
5. User can save or continue refining

---

### 2. Platform-Specific Preview (Spec #9 + #22)

**Location:** `SocialPostPreview.tsx` with `DualPlatformPreview` wrapper

**Features:**
- **Facebook mock-up:** Desktop-style feed post with profile, caption, hashtags, engagement bar
- **Instagram mock-up:** Mobile-style post with avatar, square/9:16 aspect ratio for Reels
- **Character count:** Shows current/limit with warnings when over
- **Hashtag display:** Platform-appropriate hashtag rendering
- **"More" truncation:** Instagram-style caption expansion

**Integration points:**
- SocialContentEditor: Toggle button "Preview How It Will Look"
- ScheduleModal: Toggle button "Preview How Posts Will Look" (when content passed)

---

### 3. Emoji Tools (Spec #10)

**Implemented via refinement types:**
- `add_emojis` - Weaves in 3-5 relevant emojis naturally
- `remove_emojis` - Strips all emoji characters, preserves punctuation

The toolbar dynamically shows "Add 😀" or "Remove 😀" based on whether the caption currently contains emojis.

---

### 4. Approval Guardrails (Spec #26)

**Location:** `server/lib/publishing-queue.ts`

**Function:** `checkContentApprovalStatus(contentId, brandId)`

**Behavior:**
1. Before adding a job to the publishing queue, checks if content is approved
2. Looks up `content_items` table first, then `content_drafts` table
3. Allowed statuses: `approved`, `ready`, `scheduled`
4. If not approved:
   - Job is immediately set to `failed`
   - Clear error message returned to user
   - Job logged with rejection reason

**User Experience:**
- If scheduling non-approved content, the job fails with message:
  `"Content [title] is not approved. Current status: [draft]. Please approve the content before scheduling."`
- SocialContentEditor now has an "Approve" button for quick approval

---

## UI/UX Details

### Refinement Toolbar
- Horizontal button row below caption textarea
- Subtle outline style buttons
- Active state shows loading spinner
- Toast notifications for success/failure
- Disabled when no caption or during save

### Preview Component
- Collapsible with toggle button
- Realistic device frames (mobile for IG, desktop for FB)
- Shows actual caption with brand name placeholder
- Character limit badges with color-coded warnings
- Expandable caption for Instagram (125 char truncation)

### Approval Flow
- Green "Approve" button in SocialContentEditor
- Badge showing "Approved" status
- Blocking guardrail at publish time (not just UI)

---

## Follow-up TODOs (Phase 2)

These items from the audit remain for future implementation:

| Spec | Feature | Priority | Effort |
|------|---------|----------|--------|
| #5 | Platform toggles per slot (multi-platform selection) | High | Medium |
| #20 | Per-platform scheduling times (advanced mode) | Medium | Medium |
| #7 | Draft version history with selector | Medium | High |
| #24 | Connection disconnect pause/resume | Low | Medium |

### Phase 2 Implementation Notes

**Platform Toggles (#5):**
1. Add `platforms TEXT[]` column to content_items (or new join table)
2. Create PlatformToggleSelector component
3. Update content generation to create per-platform variants
4. Wire toggles to CalendarAccordion slot cards

**Per-Platform Times (#20):**
1. Add "Advanced" toggle in ScheduleModal
2. Show per-platform date/time pickers
3. Create multiple jobs with different `scheduledAt` values
4. Group jobs in UI as "multi-platform scheduled"

**Draft Version History (#7):**
1. Add `version` column to content_drafts
2. Modify regeneration to increment version instead of replace
3. Create VersionSelector component
4. Add "View previous versions" dropdown

**Connection Pause/Resume (#24):**
1. Add `paused` status to publishing_jobs
2. On connection disconnect, mark pending jobs as paused
3. On reconnection, auto-resume paused jobs
4. Show paused state in UI with "Resume" action

---

## Testing Recommendations

1. **Refinement API:** Test all 6 refinement types with various caption lengths
2. **Preview rendering:** Verify previews for FB, IG feed, IG Reels
3. **Approval flow:** Attempt to schedule draft/unapproved content
4. **Character limits:** Test over-limit captions show warnings
5. **Emoji detection:** Verify toggle shows correct action based on content

---

## Dependencies

- Existing brand guide loading (`getCurrentBrandGuide`)
- AI generation worker (`generateWithAI`)
- React Query for API calls
- Supabase for draft/content status checks

No new dependencies were added.

---

**Implementation Complete:** ✅

