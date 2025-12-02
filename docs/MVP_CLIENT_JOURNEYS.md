# MVP Client User Journeys

**Date**: January 2025  
**Purpose**: Define concrete "happy path" scenarios from an agency client's perspective for each core MVP

---

## MVP 2: Brand Guide Builder

### Journey 1: Onboard a New Brand via Website Scrape

**As an agency client, I can:**

1. **Log in and create a new brand**
   - Navigate to `/brands` or start onboarding
   - Enter brand name and website URL
   - System creates brand record

2. **Trigger website scrape to auto-build Brand Guide**
   - During onboarding Step 4 (AI Scrape), or manually via Brand Guide page
   - System crawls website, extracts:
     - Logo and brand images
     - Color palette (primary, secondary, accent)
     - Typography preferences
     - Voice and tone from existing content
     - Key messaging and offerings

3. **Review auto-generated Brand Guide**
   - See extracted colors displayed as chips
   - See logo and images in gallery
   - Read AI-generated voice summary
   - Review suggested keywords and themes

4. **Tweak and customize Brand Guide**
   - Adjust tone sliders (professional ↔ casual, formal ↔ friendly)
   - Edit voice descriptors
   - Add/remove brand keywords
   - Update audience description
   - Modify visual kit (colors, fonts)

5. **Save and verify persistence**
   - Changes auto-save after 2 seconds
   - Refresh page and confirm all values persist
   - Switch to another brand and return — data still there

6. **Confirm Brand Guide is used by AI**
   - Generate content in Content Generator
   - Verify tone matches Brand Guide settings
   - Check that brand colors appear in Creative Studio color picker
   - Confirm brand font is available in Studio font selector

---

### Journey 2: Manual Brand Guide Creation (No Website)

**As an agency client, I can:**

1. **Create brand without website URL**
   - Enter brand name only
   - Skip website scrape step

2. **Manually build Brand Guide from scratch**
   - Upload logo
   - Select primary/secondary/accent colors via color picker
   - Choose font family
   - Write voice & tone description
   - Define audience overview
   - Add brand values and keywords
   - Write example posts

3. **Regenerate AI Snapshot**
   - Click "Regenerate AI Snapshot" button
   - System generates voice summary based on manual inputs
   - Review and edit generated summary

4. **Use Brand Guide in content creation**
   - Generate content and verify it uses manual Brand Guide settings
   - Design posts in Studio using brand colors and fonts

---

## MVP 3: AI Content Generator

### Journey 1: Generate Single Post

**As an agency client, I can:**

1. **Navigate to Content Generator**
   - Go to `/content-generator`
   - See form with topic, platform, tone, format fields

2. **Select brand and enter content request**
   - Brand is auto-selected from current workspace
   - Enter topic (e.g., "New product launch")
   - Choose platform (Instagram, LinkedIn, Facebook, etc.)
   - Select tone (professional, casual, friendly, etc.)
   - Choose format (post, story, reel, etc.)

3. **Generate content**
   - Click "Generate" button
   - See loading state with progress indicator
   - Wait 3-10 seconds for AI generation

4. **Review generated content**
   - See headline, body text, CTA, hashtags
   - View Brand Fidelity Score (BFS) badge (0-1.0)
   - See compliance/safety status
   - Review any warnings or suggestions

5. **Regenerate or use content**
   - Click "Regenerate" to get new variant
   - Click "Use This" to save to library or schedule
   - Copy content to clipboard
   - Edit manually before using

---

### Journey 2: Generate Batch Content (7-Day Package)

**As an agency client, I can:**

1. **Complete onboarding through Step 6 (Weekly Focus)**
   - Select weekly content focus (awareness, engagement, conversion, etc.)

2. **Trigger 7-day content generation**
   - System automatically generates during Step 7 (Content Generation)
   - Or manually trigger from dashboard

3. **Review generated batch**
   - See 7 content items (5 social posts, 1 email, 1 GBP post)
   - Each item shows platform, topic, BFS score
   - Preview content for each item

4. **Edit or regenerate individual items**
   - Click item to edit
   - Regenerate specific item
   - Replace image for item
   - Delete item if not needed

5. **Review in Calendar Preview**
   - See all 7 items on calendar (Step 8)
   - Drag & drop to reschedule
   - Edit scheduled times
   - Approve batch for scheduling

---

## MVP 4: Creative Studio

### Journey 1: Create New Design from Template

**As an agency client, I can:**

1. **Navigate to Creative Studio**
   - Go to `/studio`
   - See entry screen with options:
     - "Start from Template"
     - "Upload to Edit"
     - "Edit from Library"
     - "Start from AI"
     - "Blank Canvas"

2. **Select template**
   - Browse template grid
   - See preview of each template
   - Click template to open in editor

3. **Edit design in canvas**
   - Select text element → see floating toolbar
   - Edit text content
   - Change font, size, color
   - Apply brand style (uses Brand Guide colors/fonts)
   - Add images from library
   - Add shapes, backgrounds

4. **Save and export**
   - Click "Save to Library" → design saved as draft
   - Click "Download" → export as PNG/SVG
   - Click "Schedule" → opens schedule modal

---

### Journey 2: Edit Existing Design

**As an agency client, I can:**

1. **Open existing design**
   - Go to `/studio`
   - Click "Edit from Library"
   - See recent designs
   - Click design to open in editor

2. **Make edits**
   - Select elements and modify
   - Add new elements
   - Remove unwanted elements
   - Adjust layout

3. **Save changes**
   - Changes auto-save as draft
   - Or click "Save" to explicitly save
   - Design updates in library

---

### Journey 3: Generate Design with AI

**As an agency client, I can:**

1. **Start AI design generation**
   - Go to `/studio`
   - Click "Start from AI"
   - Enter prompt (e.g., "Instagram post for product launch")

2. **Review AI-generated design concepts**
   - See multiple variants
   - Each variant shows preview
   - View BFS score for each

3. **Select and edit variant**
   - Click variant to load into canvas
   - Make manual adjustments
   - Apply brand colors/fonts
   - Save to library

---

## MVP 5: Scheduler + Queue + Approvals

### Journey 1: Schedule Content with Approval

**As an agency client, I can:**

1. **Create or select content to schedule**
   - Generate content in Content Generator
   - Or open existing design in Creative Studio
   - Or select item from library

2. **Open schedule modal**
   - Click "Schedule" button
   - Or go to Calendar and click a day

3. **Set schedule details**
   - Select date and time
   - Choose platform(s) (Instagram, LinkedIn, Facebook, etc.)
   - Toggle "Require approval before publishing"
   - Add notes or instructions

4. **Submit for approval**
   - Click "Schedule"
   - Content appears in Approvals queue (`/approvals`)
   - Status: "Pending Review"

5. **Review in Approvals queue**
   - Navigate to `/approvals`
   - See content card with:
     - Preview
     - BFS score
     - Safety/compliance status
     - Scheduled date/time
     - Platform(s)

6. **Approve or reject**
   - Click "Approve" → status changes to "Approved", will publish at scheduled time
   - Click "Reject" → add rejection reason, content returns to draft
   - Add comments before approving/rejecting

7. **Verify scheduled content**
   - Go to Calendar (`/calendar`)
   - See approved content on scheduled date/time
   - Status badge shows "Scheduled" or "Approved"

---

### Journey 2: Queue Management

**As an agency client, I can:**

1. **View content queue**
   - Navigate to `/queue` or `/content-queue`
   - See all content items with status:
     - Draft
     - Pending Review
     - Approved
     - Scheduled
     - Published

2. **Filter and sort queue**
   - Filter by brand
   - Filter by platform
   - Filter by status
   - Sort by date, BFS score, etc.

3. **Bulk actions**
   - Select multiple items
   - Bulk approve
   - Bulk schedule
   - Bulk delete

4. **Monitor publishing status**
   - See published items with permalink
   - See failed publishes with error message
   - Retry failed publishes

---

### Journey 3: Calendar Drag & Drop Rescheduling

**As an agency client, I can:**

1. **View calendar**
   - Navigate to `/calendar`
   - See monthly or weekly view
   - See all scheduled content

2. **Reschedule via drag & drop**
   - Drag content item to new date/time
   - Drop on calendar slot
   - System updates scheduled time immediately

3. **Edit schedule details**
   - Click scheduled item
   - Opens schedule modal
   - Change date, time, platform
   - Save changes

4. **Verify changes persist**
   - Refresh page
   - Confirm rescheduled items still in new time slots
   - Check that approval status preserved if item was approved

---

## Cross-MVP Integration Journeys

### Journey: End-to-End Content Creation → Approval → Publishing

**As an agency client, I can:**

1. **Onboard brand** (MVP 2)
   - Scrape website → Brand Guide auto-created
   - Review and tweak Brand Guide

2. **Generate content** (MVP 3)
   - Use Content Generator with Brand Guide settings
   - Generate multiple posts

3. **Design visuals** (MVP 4)
   - Open Creative Studio
   - Create designs using brand colors/fonts from Brand Guide
   - Pair designs with generated content

4. **Schedule with approvals** (MVP 5)
   - Schedule content for next week
   - Submit for approval
   - Approve in queue
   - Verify on calendar

5. **Verify multi-tenant isolation**
   - Switch to different brand
   - Confirm no cross-brand data visible
   - Generate content for Brand B
   - Verify it uses Brand B's Brand Guide, not Brand A's

---

## Success Criteria

Each journey is successful if:

- ✅ No broken flows (all steps complete without errors)
- ✅ No missing data (all inputs saved and retrieved correctly)
- ✅ No multi-tenant leaks (brand data isolated correctly)
- ✅ Brand Guide settings respected (AI uses correct tone/colors)
- ✅ Visual feedback clear (loading states, success messages, error handling)
- ✅ Data persists (refresh page, data still there)

