# Canva Integration + Global "New Post" + Image Sourcing Implementation

**Date**: January 2025  
**Status**: ✅ Scaffolding Complete — Ready for API Keys

---

## 📋 Summary

This implementation adds:
1. **Canva Integration Scaffolding** — Ready for API integration
2. **Global "New Post" Button** — Consistent UX across content pages
3. **Prioritized Image Sourcing** — Brand assets → Stock images → Generic fallback

---

## 1️⃣ Canva Integration Scaffolding

### Files Created

#### Backend
- `server/lib/integrations/canva-client.ts` — Canva API client with placeholder functions
- `server/lib/integrations/canva/README.md` — Integration documentation

#### Frontend
- `client/components/postd/integrations/CanvaIntegrationModal.tsx` — UI modal for Canva actions
- `client/lib/canva-utils.ts` — Client-side utilities

#### Types
- Updated `shared/integrations.ts` — Added `'canva'` to `IntegrationType`

### Integration Points

#### Creative Studio
- **Location**: `client/app/(postd)/studio/page.tsx`
- **Hook**: "Design in Canva" button in StudioHeader "More" dropdown
- **Action**: Opens `CanvaIntegrationModal` with `mode="editor"`

#### Library
- **Location**: `client/app/(postd)/library/page.tsx`
- **Hook**: "Import from Canva" button next to "Upload Media"
- **Action**: Opens `CanvaIntegrationModal` with `mode="import"`

### Placeholder Functions

All functions in `canva-client.ts` are placeholders that:
- Check if Canva is configured (`isCanvaConfigured()`)
- Return helpful error messages if not configured
- Log "TODO" messages for actual API implementation
- Provide type-safe interfaces for future implementation

### Functions Ready for Implementation

1. **`initiateCanvaEditorSession(brandId, designId?, templateId?)`**
   - Opens design in Canva editor
   - Returns editor URL with CSRF state token

2. **`handleCanvaCallback(code, state, brandId)`**
   - Exchanges OAuth code for access token
   - Stores connection in `platform_connections` table

3. **`saveCanvaDesignToLibrary(designId, brandId, accessToken)`**
   - Downloads design from Canva
   - Uploads to Supabase Storage via MediaService
   - Saves to `media_assets` table

4. **`getCanvaDesignMetadata(designId, accessToken)`**
   - Fetches design info from Canva API

### Environment Variables Needed

```bash
CANVA_CLIENT_ID=your_client_id_here
CANVA_CLIENT_SECRET=your_client_secret_here
CANVA_REDIRECT_URI=https://your-domain.com/api/integrations/canva/callback
```

### TODO When API Keys Available

1. **OAuth Flow**
   - [ ] Implement `initiateCanvaEditorSession()` with real API calls
   - [ ] Implement `handleCanvaCallback()` with token exchange
   - [ ] Store tokens in `platform_connections` table
   - [ ] Add token refresh logic

2. **Design Management**
   - [ ] Implement `getCanvaDesignMetadata()` to fetch design info
   - [ ] Implement `saveCanvaDesignToLibrary()` to download and save
   - [ ] Add design sync/import functionality

3. **UI Integration**
   - [ ] Connect "Design in Canva" button to `initiateCanvaEditorSession()`
   - [ ] Connect "Import from Canva" to design picker
   - [ ] Add "Open in Canva" action in Approvals (if needed)

4. **Error Handling**
   - [ ] Handle expired tokens
   - [ ] Handle API rate limits
   - [ ] Handle network errors
   - [ ] Add retry logic

---

## 2️⃣ Global "New Post" Button

### Component Created

- `client/components/postd/shared/NewPostButton.tsx`
  - Main button component
  - Floating button variant for mobile

### Usage

```tsx
import { NewPostButton } from "@/components/postd/shared/NewPostButton";

// In page component
<NewPostButton variant="default" size="md" label="New Post" />
```

### Pages to Add Button

Add `NewPostButton` to these content-centric pages:

1. **Dashboard** (`client/app/(postd)/dashboard/page.tsx`)
   - Add to header actions area

2. **Queue** (`client/app/(postd)/queue/page.tsx`)
   - Add to header actions area

3. **Calendar** (`client/app/(postd)/calendar/page.tsx`)
   - Add to header actions area

4. **Approvals** (`client/app/(postd)/approvals/page.tsx`)
   - Add to header actions area

5. **Library** (`client/app/(postd)/library/page.tsx`)
   - Already has "Upload Media" — can add "New Post" next to it

### Example Implementation

```tsx
// In page header
<div className="flex items-center justify-between gap-4">
  <h1>Dashboard</h1>
  <div className="flex items-center gap-3">
    <NewPostButton variant="default" size="md" />
    {/* Other actions */}
  </div>
</div>
```

---

## 3️⃣ Prioritized Image Sourcing

### Service Created

- `server/lib/image-sourcing.ts` — Image sourcing service with priority logic

### Priority Order

1. **Brand Assets** (from `media_assets` or `brand_assets` table)
   - Logos, uploaded images, brand-specific graphics
   - Ordered by usage count and recency

2. **Approved Stock Images** (from brand's stock image library)
   - Stock images assigned to brand
   - From `brand_assets` with `asset_type="image"` and source="stock"

3. **Generic Fallback**
   - Brand snapshot images (from onboarding)
   - Placeholder images
   - Returns `null` if nothing found (caller handles)

### Functions

1. **`getPrioritizedImage(brandId, category?)`**
   - Returns single image following priority
   - Used for individual content items

2. **`getPrioritizedImages(brandId, count)`**
   - Returns array of images for content packages
   - Used for 7-day content generation

### Integration

**Updated**: `server/lib/onboarding-content-generator.ts`
- Calls `getPrioritizedImage()` for each content item
- Falls back to `brandSnapshot?.images?.[0]` if no prioritized image found
- Sets `imageUrl` on `ContentItem`

### Example Usage

```typescript
// In content generator
const imageSource = await getPrioritizedImage(brandId, "image");
const imageUrl = imageSource?.url || brandSnapshot?.images?.[0] || undefined;
```

---

## 📊 Implementation Status

### ✅ Completed

- [x] Canva integration scaffolding (types, functions, README)
- [x] Canva UI hooks (Studio, Library)
- [x] Global "New Post" button component
- [x] Prioritized image sourcing service
- [x] AI content generator updated to use prioritized images

### 🔄 TODO (When Ready)

1. **Canva API Integration**
   - [ ] Add Canva API credentials to environment
   - [ ] Implement OAuth flow
   - [ ] Implement design import/export
   - [ ] Test end-to-end flow

2. **Global "New Post" Button**
   - [ ] Add to Dashboard page
   - [ ] Add to Queue page
   - [ ] Add to Calendar page
   - [ ] Add to Approvals page

3. **Image Sourcing**
   - [ ] Test with real brand assets
   - [ ] Test with stock images
   - [ ] Verify fallback logic
   - [ ] Add image attribution display

---

## 🎯 Next Steps

1. **Get Canva API Credentials**
   - Register app in Canva Developer Portal
   - Add credentials to `.env`
   - Test OAuth flow

2. **Add "New Post" Buttons**
   - Add to remaining content-centric pages
   - Test navigation flow

3. **Test Image Sourcing**
   - Upload brand assets
   - Assign stock images to brands
   - Generate 7-day content and verify images

---

## 📝 Notes

- All Canva code is isolated and won't break existing flows
- Image sourcing gracefully falls back if no images found
- "New Post" button is reusable and consistent
- All placeholder functions log helpful "TODO" messages

---

**Ready for**: API key configuration and testing

