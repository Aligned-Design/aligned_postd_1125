# Storage Bucket Usage Documentation

**Date**: 2025-01-20  
**Purpose**: Document canonical storage bucket usage patterns

## Storage Bucket Architecture

### Bucket: `brand-assets` (Public)

**Purpose**: Public-facing brand assets that need to be accessible via public URLs

**Usage**:
- Logos (served in Brand Guide, Creative Studio)
- Brand graphics (used in share links, public-facing content)
- Client uploads via `client/lib/fileUpload.ts`

**RLS Policies**: 
- INSERT: Authenticated users can upload to their brand folders
- SELECT: Public read access (for logo/image URLs)
- UPDATE/DELETE: Authenticated users can manage their brand files

**Path Structure**: `{brandId}/{category}/{filename}`

**Code References**:
- `client/lib/fileUpload.ts` - Client-side uploads
- `supabase/storage/brand-assets-policies.sql` - RLS policies

### Buckets: `tenant-{uuid}` (Private)

**Purpose**: Private tenant-scoped storage for working files and raw uploads

**Usage**:
- Server-side media uploads (`server/lib/media-service.ts`)
- Generated graphics from Creative Studio
- Private assets that should not be publicly accessible

**Creation**: Dynamically created via `ensureBrandStorage()` in `server/lib/storage-manager.ts`

**Path Structure**: `{brandId}/{category}/{filename}`

**Code References**:
- `server/lib/storage-manager.ts` - Bucket creation and management
- `server/lib/media-service.ts` - Media upload service

## Decision: Current Architecture is Correct

**Current Behavior**:
- `brand-assets` = Public assets (logos, brand graphics)
- `tenant-{uuid}` = Private working files

**Rationale**:
- Public assets need to be accessible without authentication (for share links, embeds)
- Private assets should require authentication (for security, quota management)
- Clear separation of concerns

**No Changes Needed**: The current architecture follows a clear rule and is consistent.

## Future Considerations

If we need to serve private assets publicly:
- Use Supabase signed URLs with expiration
- Keep private bucket structure but generate signed URLs on-demand

