# MVP Client Acceptance Checklists

**Date**: January 2025  
**Purpose**: Plain-English checklists that a non-technical person can follow in the deployed app

---

## MVP 2: Brand Guide Builder

### Checklist 1: Onboard Brand via Website Scrape

**Prerequisites**: 
- Access to deployed app (staging/prod URL)
- Test account with login credentials
- A real website URL to scrape (e.g., your agency's website)

**Steps**:

1. **Log in and start onboarding**
   - [ ] Go to `/login` or `/signup`
   - [ ] Log in with test account
   - [ ] If new account, you should be redirected to `/onboarding`

2. **Create brand (Step 2)**
   - [ ] Enter brand name (e.g., "Test Brand")
   - [ ] Enter website URL (e.g., "https://example.com")
   - [ ] Select industry from dropdown
   - [ ] Click "Continue" or "Next"
   - [ ] **Expected**: Progresses to Step 3 (Expectation Setting)

3. **Set expectations (Step 3)**
   - [ ] Read the explanation about what will be extracted
   - [ ] Click "Start Scan" button
   - [ ] **Expected**: Progresses to Step 4 (AI Scrape)

4. **Wait for website scrape (Step 4)**
   - [ ] See progress messages:
     - "Exploring your website..."
     - "Collecting images..."
     - "Identifying colors..."
     - "Analyzing messaging..."
     - "Building Brand Snapshot..."
   - [ ] Wait 30-60 seconds for scrape to complete
   - [ ] **Expected**: Progresses to Step 5 (Brand Summary Review)

5. **Review auto-generated Brand Guide (Step 5)**
   - [ ] See color palette chips (at least 1-2 colors displayed)
   - [ ] See logo or brand images in gallery
   - [ ] Read AI-generated voice summary (should have text, not empty)
   - [ ] See suggested keywords/themes
   - [ ] **Expected**: All fields populated with scraped data

6. **Edit Brand Guide**
   - [ ] Click "Edit" button or navigate to `/brand-guide`
   - [ ] Adjust tone sliders (if available)
   - [ ] Edit voice description text
   - [ ] Add/remove keywords
   - [ ] Change a color (if color picker available)
   - [ ] **Expected**: Changes save automatically (wait 2-3 seconds, see "Saved" indicator)

7. **Verify persistence**
   - [ ] Refresh the page (F5 or Cmd+R)
   - [ ] **Expected**: All your edits are still there
   - [ ] Navigate away (go to `/dashboard`)
   - [ ] Navigate back to `/brand-guide`
   - [ ] **Expected**: Brand Guide data still loaded

8. **Verify Brand Guide is used by AI**
   - [ ] Go to `/content-generator`
   - [ ] Enter a topic (e.g., "New product launch")
   - [ ] Click "Generate"
   - [ ] **Expected**: Generated content tone matches Brand Guide settings
   - [ ] Go to `/studio`
   - [ ] Open color picker
   - [ ] **Expected**: Brand colors appear in color picker
   - [ ] Open font selector
   - [ ] **Expected**: Brand font appears in font selector

9. **Test multi-tenant isolation**
   - [ ] Create a second brand (go to `/brands`, create new brand)
   - [ ] Switch to second brand
   - [ ] Go to `/brand-guide`
   - [ ] **Expected**: See second brand's Brand Guide (or empty if not set up)
   - [ ] **Expected**: First brand's data is NOT visible
   - [ ] Switch back to first brand
   - [ ] **Expected**: First brand's data is still there

**Success Criteria**: ✅ All steps complete without errors, data persists, no cross-brand leaks

**New Checks (P0/P1)**:
- [ ] **Save status indicator** appears when editing Brand Guide (shows "Saving...", "✓ Saved", or error)
- [ ] **Error message** appears if save fails (toast notification)

---

### Checklist 2: Manual Brand Guide Creation

**Prerequisites**: 
- Access to deployed app
- Test account logged in

**Steps**:

1. **Create brand without website**
   - [ ] Go to `/brands`
   - [ ] Click "Create Brand" or "Add Brand"
   - [ ] Enter brand name only (leave website URL empty)
   - [ ] Click "Create"
   - [ ] **Expected**: Brand created successfully

2. **Navigate to Brand Guide**
   - [ ] Go to `/brand-guide`
   - [ ] **Expected**: Brand Guide page loads (may be empty)

3. **Upload logo**
   - [ ] Find logo upload section
   - [ ] Click "Upload Logo" or drag & drop logo file
   - [ ] Wait for upload to complete
   - [ ] **Expected**: Logo appears in Brand Guide

4. **Set colors**
   - [ ] Find color picker section
   - [ ] Click primary color → select a color (e.g., #3B82F6)
   - [ ] Click secondary color → select a color (e.g., #EC4899)
   - [ ] Click accent color → select a color (e.g., #10B981)
   - [ ] **Expected**: Colors save automatically (see "Saved" indicator)

5. **Set font**
   - [ ] Find font selector
   - [ ] Select a font (e.g., "Inter", "Roboto")
   - [ ] **Expected**: Font saves automatically

6. **Write voice & tone**
   - [ ] Find "Voice & Tone" section
   - [ ] Enter description (e.g., "Professional, friendly, approachable")
   - [ ] **Expected**: Text saves automatically

7. **Add keywords**
   - [ ] Find "Brand Keywords" section
   - [ ] Add keywords (e.g., "innovation", "quality", "customer-first")
   - [ ] **Expected**: Keywords save automatically

8. **Regenerate AI Snapshot**
   - [ ] Find "AI Snapshot" section
   - [ ] Click "Regenerate AI Snapshot" button
   - [ ] Wait 5-10 seconds
   - [ ] **Expected**: AI-generated summary appears based on your manual inputs

9. **Verify in content creation**
   - [ ] Go to `/content-generator`
   - [ ] Generate content
   - [ ] **Expected**: Generated content uses your manual Brand Guide settings

**Success Criteria**: ✅ All manual inputs save correctly, AI Snapshot generates, content uses Brand Guide

---

## MVP 3: AI Content Generator

### Checklist 1: Generate Single Post

**Prerequisites**: 
- Brand Guide exists (complete Checklist 1 or 2 above)
- Test account logged in

**Steps**:

1. **Navigate to Content Generator**
   - [ ] Go to `/content-generator`
   - [ ] **Expected**: Page loads with form visible

2. **Verify brand is selected**
   - [ ] Check brand selector (if visible)
   - [ ] **Expected**: Current brand is selected

3. **Fill out generation form**
   - [ ] Enter topic (e.g., "New product launch")
   - [ ] Select platform (e.g., "Instagram")
   - [ ] Select tone (e.g., "Professional")
   - [ ] Select format (e.g., "Post")
   - [ ] (Optional) Adjust max length
   - [ ] (Optional) Toggle CTA on/off

4. **Generate content**
   - [ ] Click "Generate" button
   - [ ] **Expected**: See loading state (spinner or progress indicator)
   - [ ] Wait 3-10 seconds
   - [ ] **Expected**: Generated content appears

5. **Review generated content**
   - [ ] See headline (should have text)
   - [ ] See body text (should have text, not empty)
   - [ ] See CTA (if enabled)
   - [ ] See hashtags (if applicable)
   - [ ] See BFS score badge (should show number 0.0-1.0)
   - [ ] See compliance/safety status (green/yellow/red indicator)

6. **Test regenerate**
   - [ ] Click "Regenerate" button
   - [ ] Wait for new content
   - [ ] **Expected**: New variant appears (different from first)

7. **Test using content**
   - [ ] Click "Use This" or "Save" button
   - [ ] **Expected**: Content saved or scheduled (check library or calendar)

8. **Verify Brand Guide integration**
   - [ ] Check if generated tone matches Brand Guide tone
   - [ ] Check if generated keywords match Brand Guide keywords
   - [ ] **Expected**: Content aligns with Brand Guide settings

**Success Criteria**: ✅ Content generates successfully, BFS score shown, Brand Guide respected

**New Checks (P0/P1)**:
- [ ] **AI unavailable state**: If AI not configured, see clear message and Generate button is disabled
- [ ] **No 500 errors**: If AI unavailable, see friendly message instead of error

---

### Checklist 2: Generate 7-Day Content Package

**Prerequisites**: 
- Complete onboarding through Step 6 (Weekly Focus)
- Brand Guide exists

**Steps**:

1. **Complete onboarding Steps 1-6**
   - [ ] Step 1: Sign up
   - [ ] Step 2: Create brand with website
   - [ ] Step 3: Set expectations
   - [ ] Step 4: Wait for scrape
   - [ ] Step 5: Review Brand Guide
   - [ ] Step 6: Select weekly focus (e.g., "Awareness", "Engagement")
   - [ ] **Expected**: Progresses to Step 7

2. **Trigger 7-day generation (Step 7)**
   - [ ] See "Generating your 7-day content package..." message
   - [ ] Wait 30-60 seconds (generating 7 items takes time)
   - [ ] **Expected**: Progress indicator shows progress
   - [ ] **Expected**: All 7 items appear when complete

3. **Review generated batch**
   - [ ] See 5 social media posts
   - [ ] See 1 email newsletter
   - [ ] See 1 Google Business Profile post
   - [ ] Each item shows:
     - Platform
     - Topic/headline
     - BFS score
   - [ ] **Expected**: All 7 items have content (not empty)

4. **Preview individual items**
   - [ ] Click on an item
   - [ ] **Expected**: See full content (headline, body, CTA, hashtags)

5. **Edit or regenerate item**
   - [ ] Click "Edit" on an item
   - [ ] Make a change (e.g., edit headline)
   - [ ] Save changes
   - [ ] **Expected**: Changes saved
   - [ ] OR click "Regenerate" on an item
   - [ ] **Expected**: New variant generated

6. **Review in Calendar Preview (Step 8)**
   - [ ] See all 7 items on calendar
   - [ ] Items appear on different days
   - [ ] **Expected**: Calendar shows scheduled dates

7. **Reschedule items**
   - [ ] Drag an item to a different day
   - [ ] **Expected**: Item moves to new date
   - [ ] Click an item to edit time
   - [ ] Change scheduled time
   - [ ] Save
   - [ ] **Expected**: Time updated

8. **Approve batch**
   - [ ] Click "Approve All" or approve individually
   - [ ] **Expected**: Items move to "Approved" status
   - [ ] **Expected**: Items appear in Calendar with "Scheduled" badge

**Success Criteria**: ✅ All 7 items generated, calendar preview works, rescheduling works

---

## MVP 4: Creative Studio

### Checklist 1: Create Design from Template

**Prerequisites**: 
- Brand Guide exists
- Test account logged in

**Steps**:

1. **Navigate to Creative Studio**
   - [ ] Go to `/studio`
   - [ ] **Expected**: See entry screen with options

2. **Select template**
   - [ ] Click "Start from Template" or browse template grid
   - [ ] See template previews
   - [ ] Click a template
   - [ ] **Expected**: Template opens in canvas editor

3. **Edit text element**
   - [ ] Click on a text element in canvas
   - [ ] **Expected**: Floating toolbar appears
   - [ ] Edit text content (type new text)
   - [ ] **Expected**: Text updates in canvas

4. **Change text styling**
   - [ ] With text selected, change font (if font selector visible)
   - [ ] Change font size (if size selector visible)
   - [ ] Change text color (click color picker)
   - [ ] **Expected**: Changes apply immediately

5. **Apply brand style**
   - [ ] Find "Apply Brand Style" button (if available)
   - [ ] Click it
   - [ ] **Expected**: Text uses Brand Guide font and colors

6. **Add image**
   - [ ] Click "Add Image" or image icon
   - [ ] Select image from library or upload new
   - [ ] **Expected**: Image appears in canvas

7. **Add shape**
   - [ ] Click "Add Shape" or shape icon
   - [ ] Select rectangle or circle
   - [ ] **Expected**: Shape appears in canvas

8. **Save design**
   - [ ] Click "Save to Library" button
   - [ ] Enter name (optional)
   - [ ] **Expected**: Design saved (see success message)

9. **Download design**
   - [ ] Click "Download" button
   - [ ] Select format (PNG or SVG)
   - [ ] **Expected**: File downloads

10. **Schedule design**
    - [ ] Click "Schedule" button
    - [ ] **Expected**: Schedule modal opens
    - [ ] Set date/time
    - [ ] Select platform(s)
    - [ ] Click "Schedule"
    - [ ] **Expected**: Design scheduled (appears in Calendar)

**Success Criteria**: ✅ Template loads, editing works, save/download/schedule all work

**New Checks (P0/P1)**:
- [ ] **AI unavailable state**: If AI not configured, "Start from AI" is disabled with clear message
- [ ] **Template/Blank still work**: Can still use templates and blank canvas when AI unavailable

---

### Checklist 2: Edit Existing Design

**Steps**:

1. **Open existing design**
   - [ ] Go to `/studio`
   - [ ] Click "Edit from Library"
   - [ ] **Expected**: See recent designs
   - [ ] Click a design
   - [ ] **Expected**: Design opens in canvas

2. **Make edits**
   - [ ] Select an element
   - [ ] Make changes (edit text, change color, etc.)
   - [ ] **Expected**: Changes visible immediately

3. **Save changes**
   - [ ] Click "Save" button
   - [ ] **Expected**: Changes saved (see "Saved" indicator)
   - [ ] Close and reopen design
   - [ ] **Expected**: Your edits are still there

**Success Criteria**: ✅ Design loads, edits work, changes persist

---

### Checklist 3: Generate Design with AI

**Steps**:

1. **Start AI generation**
   - [ ] Go to `/studio`
   - [ ] Click "Start from AI"
   - [ ] **Expected**: AI prompt modal opens

2. **Enter prompt**
   - [ ] Type prompt (e.g., "Instagram post for product launch")
   - [ ] Select format/aspect ratio
   - [ ] Click "Generate"
   - [ ] **Expected**: Loading state appears

3. **Review AI variants**
   - [ ] Wait 10-20 seconds
   - [ ] **Expected**: See multiple design variants (2-4 variants)
   - [ ] Each variant shows preview
   - [ ] Each variant shows BFS score

4. **Select variant**
   - [ ] Click a variant
   - [ ] **Expected**: Variant loads into canvas

5. **Edit and save**
   - [ ] Make manual adjustments if needed
   - [ ] Click "Save to Library"
   - [ ] **Expected**: AI-generated design saved

**Success Criteria**: ✅ AI generates variants, can select and edit, saves correctly

---

## MVP 5: Scheduler + Queue + Approvals

### Checklist 1: Schedule Content with Approval

**Prerequisites**: 
- Content exists (generated or created in Studio)
- Test account logged in

**Steps**:

1. **Create or select content**
   - [ ] Generate content in `/content-generator`, OR
   - [ ] Create design in `/studio`, OR
   - [ ] Select item from library
   - [ ] **Expected**: Content ready to schedule

2. **Open schedule modal**
   - [ ] Click "Schedule" button (on content or design)
   - [ ] OR go to `/calendar` and click a day
   - [ ] **Expected**: Schedule modal opens

3. **Set schedule details**
   - [ ] Select date (click date picker)
   - [ ] Select time (click time picker)
   - [ ] Select platform(s) (checkboxes: Instagram, LinkedIn, etc.)
   - [ ] Toggle "Require approval" ON
   - [ ] (Optional) Add notes
   - [ ] **Expected**: All fields can be filled

4. **Submit for approval**
   - [ ] Click "Schedule" button
   - [ ] **Expected**: Success message appears
   - [ ] **Expected**: Content appears in Approvals queue

5. **Review in Approvals queue**
   - [ ] Go to `/approvals`
   - [ ] **Expected**: See content card with:
     - Preview/image
     - BFS score badge
     - Safety/compliance status
     - Scheduled date/time
     - Platform(s)
     - Status: "Pending Review"

6. **Approve content**
   - [ ] Click "Approve" button
   - [ ] (Optional) Add comment
   - [ ] Click "Confirm Approve"
   - [ ] **Expected**: Status changes to "Approved"
   - [ ] **Expected**: Content will publish at scheduled time

7. **Verify on calendar**
   - [ ] Go to `/calendar`
   - [ ] **Expected**: See approved content on scheduled date/time
   - [ ] **Expected**: Status badge shows "Scheduled" or "Approved"

8. **Test rejection**
   - [ ] Go back to `/approvals`
   - [ ] Find another pending item
   - [ ] Click "Reject"
   - [ ] Enter rejection reason
   - [ ] Click "Confirm Reject"
   - [ ] **Expected**: Status changes to "Rejected"
   - [ ] **Expected**: Content returns to draft (not scheduled)

**Success Criteria**: ✅ Schedule modal works, approval queue shows items, approve/reject work, calendar updates

**New Checks (P0/P1)**:
- [ ] **Platform connection check**: Schedule modal shows which platforms are connected
- [ ] **Blocked scheduling**: If no platforms connected and auto-publish ON, Schedule button is disabled
- [ ] **Connection message**: See "Connect at least one platform in Settings" message
- [ ] **Calendar banner**: Calendar shows banner when no platforms connected

---

### Checklist 2: Queue Management

**Steps**:

1. **View content queue**
   - [ ] Go to `/queue` or `/content-queue`
   - [ ] **Expected**: See list/grid of content items
   - [ ] Each item shows status badge (Draft, Pending, Approved, Scheduled, Published)

2. **Filter queue**
   - [ ] Find filter dropdown or buttons
   - [ ] Filter by brand (if multiple brands)
   - [ ] **Expected**: Only selected brand's items shown
   - [ ] Filter by platform
   - [ ] **Expected**: Only selected platform's items shown
   - [ ] Filter by status
   - [ ] **Expected**: Only selected status shown

3. **Sort queue**
   - [ ] Find sort dropdown
   - [ ] Sort by date (newest first)
   - [ ] **Expected**: Items reorder
   - [ ] Sort by BFS score
   - [ ] **Expected**: Items reorder by score

4. **Bulk actions** (if available)
   - [ ] Select multiple items (checkboxes)
   - [ ] Click "Bulk Approve"
   - [ ] **Expected**: All selected items approved
   - [ ] OR select items and click "Bulk Schedule"
   - [ ] **Expected**: Schedule modal opens for all items

5. **Monitor publishing status**
   - [ ] Find published items
   - [ ] **Expected**: See "Published" badge
   - [ ] **Expected**: See permalink (if available)
   - [ ] Find failed publishes
   - [ ] **Expected**: See "Failed" badge with error message
   - [ ] Click "Retry" on failed item
   - [ ] **Expected**: Retry attempt starts

**Success Criteria**: ✅ Queue loads, filters/sort work, bulk actions work, publishing status visible

**New Checks (P0/P1)**:
- [ ] **Empty state**: Approval queue shows friendly empty state with explanation when no items

---

### Checklist 3: Calendar Drag & Drop

**Steps**:

1. **View calendar**
   - [ ] Go to `/calendar`
   - [ ] **Expected**: See monthly or weekly view
   - [ ] **Expected**: See scheduled content items on calendar

2. **Reschedule via drag & drop**
   - [ ] Find a scheduled item
   - [ ] Click and drag item to different day
   - [ ] Drop on calendar slot
   - [ ] **Expected**: Item moves to new date immediately
   - [ ] **Expected**: See "Saving..." or "Saved" indicator

3. **Verify persistence**
   - [ ] Refresh page (F5)
   - [ ] **Expected**: Rescheduled item still in new location

4. **Edit schedule details**
   - [ ] Click a scheduled item
   - [ ] **Expected**: Schedule modal opens
   - [ ] Change time (e.g., from 10:00 AM to 2:00 PM)
   - [ ] Change platform (add/remove platforms)
   - [ ] Click "Save"
   - [ ] **Expected**: Changes saved, calendar updates

5. **Test timezone handling**
   - [ ] Note your current timezone
   - [ ] Schedule item for 3:00 PM
   - [ ] **Expected**: Calendar shows 3:00 PM in your timezone
   - [ ] (If possible) Change browser timezone
   - [ ] **Expected**: Calendar adjusts to new timezone

**Success Criteria**: ✅ Drag & drop works, changes persist, timezone handled correctly

**New Checks (P0/P1)**:
- [ ] **Timezone display**: Schedule modal shows user's browser timezone
- [ ] **Platform connection banner**: Calendar shows banner if no platforms connected

---

## Cross-MVP Integration Test

### End-to-End Journey

**Steps**:

1. **Onboard brand** (MVP 2)
   - [ ] Complete Checklist 1 (Onboard Brand via Website Scrape)
   - [ ] **Expected**: Brand Guide created and saved

2. **Generate content** (MVP 3)
   - [ ] Complete Checklist 1 (Generate Single Post)
   - [ ] **Expected**: Content generated using Brand Guide settings

3. **Design visuals** (MVP 4)
   - [ ] Complete Checklist 1 (Create Design from Template)
   - [ ] **Expected**: Design uses Brand Guide colors/fonts

4. **Schedule with approvals** (MVP 5)
   - [ ] Complete Checklist 1 (Schedule Content with Approval)
   - [ ] **Expected**: Content scheduled and approved

5. **Verify multi-tenant isolation**
   - [ ] Create second brand
   - [ ] Generate content for second brand
   - [ ] **Expected**: Second brand's content uses second brand's Brand Guide
   - [ ] **Expected**: First brand's data not visible when viewing second brand

**Success Criteria**: ✅ All MVPs work together, no broken flows, no data leaks

---

## Known Limitations & Workarounds

If you encounter issues, check:

- **Brand Guide not loading**: Verify brand exists and you have access
- **AI generation fails**: Check if AI API keys are configured (backend issue)
- **Approval queue empty**: Verify content was submitted with "Require approval" enabled
- **Calendar not showing items**: Verify items are scheduled (not just saved as drafts)
- **Multi-tenant leak**: Report immediately — this is a critical security issue

---

## Reporting Issues

For each failed step, note:
- **MVP**: Which MVP (2, 3, 4, or 5)
- **Step**: Which step number failed
- **Expected**: What should have happened
- **Actual**: What actually happened
- **Screenshot**: If possible, include screenshot
- **Browser/OS**: Browser and OS version

