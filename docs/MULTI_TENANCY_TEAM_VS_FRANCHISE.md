# Multi-Tenancy: Team vs Franchise Model

**Status**: ✅ **FRANCHISE-READY** (as of commit 30e9d8e)  
**Audited**: 2025-12-15  
**Verdict**: Same domain **CAN** be crawled unlimited times for different brands

---

## Executive Summary

**Question**: Can the same website URL be crawled for multiple brands?  
**Answer**: **YES** ✅

POSTD supports both **Team** and **Franchise** multi-tenancy models:

- **Team**: Multiple users share one brand → one Brand Guide
- **Franchise**: Multiple brands use same website → separate Brand Guides per brand

**No unique constraints or application logic block franchise behavior.**

---

## Definitions

### Team Model

**Concept**: Multiple users collaborate on the same brand.

**Data Model**:
```
User A ──┐
User B ──┼──> brand_members ──> Brand X (one brand_id)
User C ──┘                        └─> Brand Guide (shared)
```

**Key Tables**:
- `brands`: One record per brand (unique `id`)
- `brand_members`: Maps `user_id` → `brand_id` with `role` (owner/editor/viewer)
- `brand_guide_versions`: Version history shared by all team members

**Permissions**:
- Defined by `role` in `brand_members` (owner/editor/member)
- RLS policies enforce: `EXISTS (SELECT 1 FROM brand_members WHERE user_id = auth.uid() AND brand_id = brands.id)`
- Team members see the same data, subject to role permissions

**Example**: 
- Acme Corp has 5 employees
- All 5 are members of Brand "Acme Corp" (brand_id: `abc-123`)
- They share one Brand Guide, content calendar, and assets
- Changes are versioned in `brand_guide_versions`

---

### Franchise Model

**Concept**: Multiple brands/locations use the same website domain but maintain separate Brand Guides.

**Data Model**:
```
User A ──> Brand "Bahama Bucks Miami" (brand_1)     ──> bahamabucks.com ──> Brand Guide 1
User B ──> Brand "Bahama Bucks Orlando" (brand_2)   ──> bahamabucks.com ──> Brand Guide 2
User C ──> Brand "Bahama Bucks Atlanta" (brand_3)   ──> bahamabucks.com ──> Brand Guide 3
```

**Key Tables**:
- `brands`: Multiple records, each with unique `brand_id`
- `brands.website_url`: **No unique constraint** (same URL allowed)
- `media_assets`: Scoped by `brand_id` (each franchise has own assets)
- `content_items`: Scoped by `brand_id` (each franchise has own content)

**Isolation**:
- Each brand_id has its own:
  - Brand Guide (`brands.brand_kit`)
  - Scraped assets (`media_assets` WHERE `brand_id = X`)
  - Content calendar (`content_items` WHERE `brand_id = X`)
  - Version history (`brand_guide_versions` WHERE `brand_id = X`)

**Example**:
- Bahama Bucks franchise system
- 50 franchise locations all use `bahamabucks.com`
- Each franchise creates their own brand in POSTD
- Each gets their own Brand Guide tailored to their location
- Corporate updates don't overwrite local customizations

---

## Data Model Support

### Brands Table

```sql
CREATE TABLE brands (
  id UUID PRIMARY KEY,                    -- Unique per brand
  name TEXT NOT NULL,                     -- e.g., "Bahama Bucks Miami"
  website_url TEXT,                       -- ✅ NOT UNIQUE (franchise-safe)
  slug TEXT,                              -- Unique per tenant (team-safe)
  tenant_id UUID REFERENCES tenants(id),  -- Workspace/org owner
  brand_kit JSONB,                        -- Brand-specific guide
  ...
);
```

**Key Points**:
- ✅ `website_url` has **NO UNIQUE CONSTRAINT**
- ✅ `slug` is unique **per tenant** (via `generateUniqueSlug`)
- ✅ Each `brand_id` is globally unique UUID

---

### Brand Members Table

```sql
CREATE TABLE brand_members (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  brand_id UUID REFERENCES brands(id),
  role VARCHAR(50) DEFAULT 'member',      -- owner/editor/member/viewer
  UNIQUE (user_id, brand_id)              -- User can only join brand once
);
```

**Team Support**:
- Multiple users can join same `brand_id`
- RLS enforces: Users only see brands they're members of
- Roles determine permissions (read/write/admin)

---

### Media Assets Table

```sql
CREATE TABLE media_assets (
  id UUID PRIMARY KEY,
  brand_id TEXT NOT NULL,                 -- Scoped to brand
  tenant_id UUID,                         -- Additional isolation
  url TEXT,
  category TEXT,                          -- logo/image/graphics
  metadata JSONB,                         -- Includes source: "scrape"
  ...
);
```

**Franchise Isolation**:
- Each brand's scraped assets stored separately
- Query: `WHERE brand_id = X AND metadata->>'source' = 'scrape'`
- No cross-brand reads (enforced by RLS)

---

## Crawler Behavior

### Lock Mechanism (Brand-Scoped)

**File**: `server/routes/crawler.ts` line 240

```typescript
lockKey = `${finalBrandId}:${normalizedUrl}`;
const activeLock = activeCrawlLocks.get(lockKey);
```

**Result**:
- ✅ **Brand-scoped lock**: Different brands can crawl same URL concurrently
- ✅ **Duplicate prevention**: Same brand cannot run concurrent crawl for same URL
- ✅ **Lock scope**: `brand_abc:example.com` ≠ `brand_xyz:example.com`

**Examples**:
```
Brand A crawls example.com → Lock: "brand-a:example.com"
Brand B crawls example.com → Lock: "brand-b:example.com" (allowed, different lock)
Brand A crawls example.com → Blocked (same lock still active)
```

---

### Cache Behavior (Brand-Scoped)

**Asset Extraction Cache** (`server/routes/crawler.ts` lines 703-758):
```typescript
// Check if assets already extracted FOR THIS BRAND
const { count: existingAssetCount } = await supabase
  .from("media_assets")
  .select("id", { count: "exact", head: true })
  .eq("brand_id", brandId)                          // ← Brand-scoped!
  .eq("metadata->>source", "scrape");
```

**Result**:
- ✅ Cache keyed by `brand_id`
- ✅ Brand A's cache doesn't affect Brand B
- ✅ Each brand gets fresh extraction on first crawl

**Brand Kit Update Cache** (`server/routes/crawler.ts` lines 1145-1169):
```typescript
// Check if brand_kit fields already populated FOR THIS BRAND
const { data: existingBrand } = await supabase
  .from("brands")
  .select("brand_kit")
  .eq("id", brandId);                               // ← Brand-scoped!
```

**Result**:
- ✅ Each brand has independent brand_kit
- ✅ Franchise locations don't overwrite each other

---

## What's Allowed

### ✅ Franchise Use Cases

1. **Multiple brands, same domain**:
   ```
   Brand "Bahama Bucks Miami"    → bahamabucks.com
   Brand "Bahama Bucks Orlando"  → bahamabucks.com
   Brand "Bahama Bucks Atlanta"  → bahamabucks.com
   ```
   **Result**: Each gets own Brand Guide + assets

2. **Concurrent crawls**:
   ```
   User A starts crawl for Brand A + example.com
   User B starts crawl for Brand B + example.com
   ```
   **Result**: Both crawls succeed (different locks)

3. **Cache independence**:
   ```
   Brand A crawls example.com → assets cached for Brand A
   Brand B crawls example.com → fresh crawl (Brand B has no cache)
   ```
   **Result**: Each brand builds own asset library

---

### ✅ Team Use Cases

1. **Multiple users, one brand**:
   ```
   User A (owner)   ──┐
   User B (editor)  ──┼──> Brand "Acme Corp"
   User C (viewer)  ──┘
   ```
   **Result**: All see same Brand Guide, permissions differ by role

2. **Collaborative editing**:
   ```
   User A updates Brand Guide → version 2 created
   User B sees version 2 immediately
   ```
   **Result**: Changes tracked in `brand_guide_versions`

3. **Shared assets**:
   ```
   User A triggers crawl → assets saved to Brand X
   User B accesses Brand Guide → sees same assets
   ```
   **Result**: One set of assets per brand

---

## What's NOT Allowed

### ❌ Cross-Brand Data Access

**RLS Enforcement**:
```sql
-- Brands table RLS policy
CREATE POLICY "Users can only access brands they are members of"
ON brands FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM brand_members
    WHERE brand_members.brand_id = brands.id
    AND brand_members.user_id = auth.uid()
  )
);
```

**Result**:
- ❌ User A (Brand A member) cannot read Brand B's data
- ❌ User A cannot trigger crawl for Brand B
- ❌ User A cannot see Brand B's assets or content

---

### ❌ Global Domain Locks

**Explicitly Avoided**:
```typescript
// ❌ WRONG (would block franchise):
lockKey = `${normalizedUrl}`;  // Global lock

// ✅ CORRECT (allows franchise):
lockKey = `${brandId}:${normalizedUrl}`;  // Brand-scoped lock
```

---

### ❌ Domain Uniqueness Constraints

**Schema Check**:
```bash
# Search for unique constraints on website_url
grep -r "UNIQUE.*website_url" supabase/migrations/
# Result: (no matches)
```

**Result**: No database constraint prevents multiple brands from using same `website_url`

---

## Cache Rules

### When Cache is Used

1. **Asset Extraction**:
   - **Check**: `media_assets` WHERE `brand_id = X` AND `metadata->>'source' = 'scrape'`
   - **Skip if**: Count > 0 AND `cacheMode = 'default'`
   - **Bypass**: Set `cacheMode = 'bypass'` or `'refresh'`

2. **Image Persistence**:
   - **Check**: Same as asset extraction
   - **Skip if**: Assets already persisted for this brand
   - **Result**: Avoids duplicate storage

3. **Brand Kit Update**:
   - **Check**: `brands.brand_kit` WHERE `id = brandId`
   - **Skip if**: Key fields (`about_blurb`, `colors`) already populated
   - **Bypass**: Set `cacheMode = 'bypass'`

---

### Cache Scope

**All caches are brand-scoped**:
```typescript
// Asset cache
.eq("brand_id", brandId)        // ← Scoped

// Brand kit cache
.eq("id", brandId)              // ← Scoped

// Lock cache
lockKey = `${brandId}:${url}`   // ← Scoped
```

**Result**: Brand A's cache never affects Brand B

---

### Force Fresh Crawl

**API Parameter**:
```json
POST /api/crawl/start
{
  "brand_id": "abc-123",
  "url": "https://example.com",
  "cacheMode": "bypass"        // ← Force fresh crawl
}
```

**Result**: Bypasses all caches, always performs fresh extraction

---

## Testing

### Franchise Test (Required)

**File**: `server/__tests__/multi-tenancy-franchise.test.ts` (to be created)

```typescript
describe("Franchise Model", () => {
  it("allows multiple brands to crawl same domain", async () => {
    // Create Brand A with example.com
    const brandA = await createBrand({ website_url: "https://example.com" });
    
    // Create Brand B with example.com
    const brandB = await createBrand({ website_url: "https://example.com" });
    
    // Crawl with Brand A
    const resultA = await crawl(brandA.id, "https://example.com");
    expect(resultA.success).toBe(true);
    
    // Crawl with Brand B (should succeed, not blocked)
    const resultB = await crawl(brandB.id, "https://example.com");
    expect(resultB.success).toBe(true);
    
    // Verify separate assets
    const assetsA = await getAssets(brandA.id);
    const assetsB = await getAssets(brandB.id);
    expect(assetsA.length).toBeGreaterThan(0);
    expect(assetsB.length).toBeGreaterThan(0);
    expect(assetsA[0].id).not.toBe(assetsB[0].id); // Different assets
  });
});
```

---

### Team Test (Required)

**File**: `server/__tests__/multi-tenancy-team.test.ts` (to be created)

```typescript
describe("Team Model", () => {
  it("allows multiple users to access same brand", async () => {
    // Create brand
    const brand = await createBrand({ name: "Acme Corp" });
    
    // Add User A as owner
    await addBrandMember(brand.id, userA.id, "owner");
    
    // Add User B as editor
    await addBrandMember(brand.id, userB.id, "editor");
    
    // User A triggers crawl
    const result = await crawl(brand.id, "https://acme.com", { userId: userA.id });
    expect(result.success).toBe(true);
    
    // User B can see results
    const assets = await getAssets(brand.id, { userId: userB.id });
    expect(assets.length).toBeGreaterThan(0);
    
    // Both see same brand_kit
    const kitA = await getBrandKit(brand.id, { userId: userA.id });
    const kitB = await getBrandKit(brand.id, { userId: userB.id });
    expect(kitA.about_blurb).toBe(kitB.about_blurb);
  });
});
```

---

## Audit Summary

| Location | What It Does | Blocks Franchise? | Status |
|----------|--------------|-------------------|--------|
| `brands.website_url` | Stores brand's website | ❌ No (no UNIQUE constraint) | ✅ Safe |
| `brands.slug` | URL-friendly identifier | ❌ No (unique per tenant only) | ✅ Safe |
| `brand_members` | Team access control | ❌ No (brand-scoped) | ✅ Safe |
| `activeCrawlLocks` | Duplicate crawl prevention | ❌ No (brand-scoped lock key) | ✅ Safe |
| Asset extraction cache | Skip if assets exist | ❌ No (checks `brand_id`) | ✅ Safe |
| Brand kit update cache | Skip if populated | ❌ No (checks `brand_id`) | ✅ Safe |
| RLS policies | Data isolation | ❌ No (enforces brand membership) | ✅ Safe |

**Verdict**: ✅ **ZERO BLOCKERS** for franchise model

---

## Schema Verification

### Checked for Unique Constraints

**Command**:
```bash
grep -ri "UNIQUE.*\(website\|domain\|url\|host\)" supabase/migrations/
```

**Result**: No unique constraints on `website_url` or related fields in `brands` table

**White Label Domain** (separate concern):
- `white_label_configs.domain` IS unique (for custom agency domains)
- This is CORRECT behavior (custom domains must be unique)
- Does NOT affect brand crawling

---

## Migration Check

**Required**: NO MIGRATION NEEDED ✅

**Reason**: Schema already supports franchise model

**Verified**:
- ✅ No unique constraint on `website_url`
- ✅ Lock keys are brand-scoped
- ✅ Caches are brand-scoped
- ✅ RLS policies enforce brand isolation

---

## Recommendations

### For Franchise Users

1. **Create separate brands**:
   - One brand per franchise location
   - Use descriptive names: "Brand Name - Location"
   - Each gets own Brand Guide

2. **Use consistent website_url**:
   - All franchise locations can use corporate website
   - Each will extract and customize their own Brand Guide

3. **Leverage team features**:
   - Add local staff as brand_members
   - Corporate can be members of all franchise brands (if desired)

---

### For Corporate/Multi-Location

1. **Brand structure**:
   ```
   Brand "Acme Corporate" → acme.com (corporate branding)
   Brand "Acme NYC"       → acme.com (local customizations)
   Brand "Acme LA"        → acme.com (local customizations)
   ```

2. **Content strategy**:
   - Corporate maintains master brand guidelines
   - Locations customize for local audience
   - No cross-contamination of assets or content

---

## Future Enhancements

### Franchise Template System (Optional)

**Concept**: Allow "parent brand" to define templates that child brands can inherit.

**Data Model**:
```sql
ALTER TABLE brands
ADD COLUMN parent_brand_id UUID REFERENCES brands(id);

CREATE TABLE brand_templates (
  id UUID PRIMARY KEY,
  parent_brand_id UUID REFERENCES brands(id),
  template_data JSONB,
  allow_child_overrides JSONB
);
```

**Use Case**:
- Corporate creates "master brand" with approved colors/fonts/voice
- Franchise locations create child brands
- Children inherit but can override specific fields

**Status**: Not implemented (franchise independence is default)

---

## Conclusion

**POSTD is fully franchise-ready** with:

✅ No unique constraints blocking same-domain multi-brand  
✅ Brand-scoped locks preventing only same-brand duplicates  
✅ Brand-scoped caches ensuring data isolation  
✅ RLS policies enforcing security boundaries  
✅ Clear separation between Team (shared brand) and Franchise (separate brands)

**Same domain can be crawled unlimited times for different brands.**

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-15  
**Audit Status**: ✅ Complete  
**Commit**: 30e9d8e

