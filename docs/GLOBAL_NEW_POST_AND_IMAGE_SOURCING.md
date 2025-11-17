# Global "New Post" Button + AI Image Sourcing Implementation

**Date**: January 2025  
**Status**: ✅ Complete

---

## 📋 Summary

This implementation adds:
1. **Global "Create Content" Button** — Consistent CTA across all content-centric pages
2. **Prioritized AI Image Sourcing** — Brand assets → Approved stock images → Generic fallback
3. **AI Prompt Integration** — Image context included in Doc and Design agent prompts

---

## 1️⃣ Global "Create Content" Button

### Component

- **File**: `client/components/postd/shared/NewPostButton.tsx`
- **Props**: `variant`, `size`, `label`, `className`, `showIcon`
- **Behavior**: Routes to `/studio` (Creative Studio entry screen)

### Pages Updated

1. **Dashboard** (`client/app/(postd)/dashboard/page.tsx`)
   - Location: `PageHeader` actions (top-right)
   - Label: "Create Content"

2. **Calendar** (`client/app/(postd)/calendar/page.tsx`)
   - Location: Header area (top-right, next to title)
   - Label: "Create Content"

3. **Library** (`client/app/(postd)/library/page.tsx`)
   - Location: Header actions (next to "Import from Canva" and "Upload Media")
   - Label: "Create Content"

4. **Approvals** (`client/app/(postd)/approvals/page.tsx`)
   - Location: `PageHeader` actions (top-right)
   - Label: "Create Content"

### User Flow

**From any content page:**
1. User clicks "Create Content" button
2. Navigates to `/studio` (Creative Studio)
3. Sees Studio entry screen with options:
   - Edit existing content
   - Create new content
   - Start with AI

**No competing modals** — clean route-based navigation.

---

## 2️⃣ Prioritized AI Image Sourcing

### Service

- **File**: `server/lib/image-sourcing.ts`
- **Priority Order**:
  1. **Brand Assets** (from `media_assets` or `brand_assets` table)
     - Brand uploads, logos, brand-specific graphics
     - Ordered by usage count and recency
  2. **Approved Stock Images** (from brand's stock image library)
     - Stock images with `metadata.source === "stock"` OR `metadata.provider` set
     - From `media_assets` or `brand_assets` table
  3. **Generic Fallback**
     - Brand snapshot images (from onboarding)
     - Returns `null` if nothing found (caller handles)

### Functions

1. **`getPrioritizedImage(brandId, category?)`**
   - Returns single image following priority
   - Used for individual content items

2. **`getPrioritizedImages(brandId, count)`**
   - Returns array of images for content packages
   - Used for 7-day content generation and AI agent prompts

### Stock Image Detection

Stock images are identified by:
- `metadata.source === "stock"` OR
- `metadata.provider` (Unsplash, Pexels, Pixabay) OR
- Tags include "stock" or provider name

**Tables checked:**
- `media_assets` (newer structure) — `category="images"`, `status="active"`
- `brand_assets` (legacy structure) — `asset_type="image"`

---

## 3️⃣ AI Prompt Integration

### Doc Agent

**Updated Files:**
- `server/lib/ai/docPrompt.ts` — Added `availableImages` to `DocPromptContext`
- `server/routes/doc-agent.ts` — Fetches images and includes in prompt

**Prompt Enhancement:**
```
## Available Visual Assets
Brand-owned images available: 3
- Image 1
- Image 2
- Image 3
Approved stock images available: 2
When creating content, reference or align with these visual assets when relevant.
```

### Design Agent

**Updated Files:**
- `server/lib/ai/designPrompt.ts` — Added `availableImages` to `DesignPromptContext`
- `server/routes/design-agent.ts` — Fetches images and includes in prompt

**Prompt Enhancement:**
```
## Available Visual Assets
Brand-owned images available: 3
- Image 1
- Image 2
- Image 3
Prefer referencing these brand-owned visuals in your design concepts.
Approved stock images available: 2
These can be used as reference for visual style and composition.
```

### Onboarding Content Generator

**Updated File:**
- `server/lib/onboarding-content-generator.ts` — Includes image context in prompts

**Behavior:**
- Fetches prioritized image before generating each content item
- Includes image context in AI prompt
- Attaches `imageUrl` to generated `ContentItem`

---

## 📊 Database Schema

### Image Storage

**Primary Table**: `media_assets`
- `brand_id` — Brand scoping
- `category` — "images", "graphics", "logos", "videos"
- `status` — "active", "archived", "deleted"
- `metadata` (JSONB) — `{ source: "stock" | "upload", provider?: "unsplash" | "pexels" | "pixabay", width, height, alt, attribution }`
- `usage_count` — For prioritization

**Legacy Table**: `brand_assets`
- `brand_id` — Brand scoping
- `asset_type` — "image", "logo", etc.
- `metadata` (JSONB) — Same structure as `media_assets.metadata`

### Stock Image Flagging

Stock images are identified by:
- `metadata->>'source' = 'stock'` OR
- `metadata->>'provider' IS NOT NULL`

**No schema changes required** — uses existing `metadata` JSONB field.

---

## 📁 Files Changed / Created

### Created

- `client/components/postd/shared/NewPostButton.tsx` — Global button component
- `server/lib/image-sourcing.ts` — Image sourcing service
- `docs/GLOBAL_NEW_POST_AND_IMAGE_SOURCING.md` — This document

### Modified

**Frontend:**
- `client/app/(postd)/dashboard/page.tsx` — Added "Create Content" button
- `client/app/(postd)/calendar/page.tsx` — Added "Create Content" button
- `client/app/(postd)/library/page.tsx` — Added "Create Content" button
- `client/app/(postd)/approvals/page.tsx` — Added "Create Content" button

**Backend:**
- `server/lib/onboarding-content-generator.ts` — Image sourcing + prompt integration
- `server/lib/ai/docPrompt.ts` — Added image context to prompts
- `server/lib/ai/designPrompt.ts` — Added image context to prompts
- `server/routes/doc-agent.ts` — Fetches and includes images in prompts
- `server/routes/design-agent.ts` — Fetches and includes images in prompts

---

## ✅ Verification

### Build Status

- ✅ `pnpm build` passes
- ✅ No TypeScript errors
- ✅ No linter errors

### Functionality

1. **"Create Content" Button**
   - ✅ Appears on Dashboard, Calendar, Library, Approvals
   - ✅ Routes to `/studio` correctly
   - ✅ Uses consistent styling (design system)

2. **Image Sourcing**
   - ✅ Prioritizes brand assets first
   - ✅ Falls back to approved stock images
   - ✅ Handles missing images gracefully
   - ✅ Distinguishes stock images via metadata

3. **AI Prompts**
   - ✅ Include image context when available
   - ✅ Distinguish brand assets from stock images
   - ✅ Work for Doc, Design, and Onboarding generators

---

## 🔄 TODOs / Future Enhancements

1. **Image Attribution Display**
   - Show attribution text for stock images in generated content
   - Display image source badge (brand-owned vs. stock)

2. **Image Selection UI**
   - Allow users to manually select images for AI generation
   - Show image previews in AI generation modals

3. **Image Usage Tracking**
   - Track which images are used in generated content
   - Update `usage_count` in `media_assets` table

4. **Stock Image Approval Workflow**
   - UI for approving/rejecting stock images
   - Bulk approval actions

5. **Image Recommendations**
   - AI suggests best images for specific content types
   - Color/style matching between images and content

---

## 📝 Notes

- Image sourcing gracefully falls back if no images found
- Stock images are identified via metadata flags (no schema changes)
- AI prompts include image context but don't require images
- All changes are backward-compatible with existing content

---

**Ready for**: Production use

