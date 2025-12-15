# Multi-Tenancy Audit Summary

**Date**: 2025-12-15  
**Commit**: 40febe2  
**Status**: ✅ **FRANCHISE-READY** — No blockers found

---

## 🎯 Question

**Can the same website URL be crawled for multiple brands?**

## ✅ Answer

**YES** — The system fully supports franchise multi-tenancy.

---

## 📊 Audit Results

| Category | Finding | Status |
|----------|---------|--------|
| **Schema** | No `UNIQUE` constraint on `brands.website_url` | ✅ Safe |
| **Locks** | Lock keys are brand-scoped: `${brandId}:${url}` | ✅ Safe |
| **Caches** | All caches check `brand_id` (assets, brand_kit) | ✅ Safe |
| **RLS** | Policies enforce brand membership isolation | ✅ Safe |
| **Tests** | 16 tests (7 franchise + 9 team) all passing | ✅ Pass |

**Verdict**: **ZERO BLOCKERS** for franchise model

---

## 📚 Definitions

### Team Model
**Multiple users → Same brand**

```
User A (owner) ──┐
User B (editor) ──┼──> Brand X (one brand_id)
User C (member) ──┘      └─> Shared Brand Guide
```

- Uses `brand_members` table
- RLS enforces membership
- All see same `brand_kit` and assets
- Role-based permissions (owner/editor/member/viewer)

**Use when**: Company marketing team, agency team

---

### Franchise Model
**Multiple brands → Same website**

```
User A ──> Brand "Miami"     ──> bahamabucks.com ──> Brand Guide 1
User B ──> Brand "Orlando"   ──> bahamabucks.com ──> Brand Guide 2  
User C ──> Brand "Atlanta"   ──> bahamabucks.com ──> Brand Guide 3
```

- Each brand has unique `brand_id`
- Each brand has separate `brand_kit`
- Each brand has separate `media_assets`
- No cross-brand data leakage

**Use when**: Restaurant franchises, retail chains, multi-location businesses

---

## 🔍 Evidence

### 1. Schema Check

**Command**:
```bash
grep -r "UNIQUE.*website_url" supabase/migrations/
```

**Result**: No matches found ✅

**Confirmed**:
- `brands.website_url` has **NO UNIQUE CONSTRAINT**
- `brands.slug` is unique **per tenant** (not global)
- Multiple brands can share same `website_url`

---

### 2. Lock Scope Check

**File**: `server/routes/crawler.ts` line 240

```typescript
lockKey = `${finalBrandId}:${normalizedUrl}`;
const activeLock = activeCrawlLocks.get(lockKey);
```

**Result**: Lock keys include `brandId` ✅

**Confirmed**:
- Brand A crawling `example.com` → Lock: `brand-a:example.com`
- Brand B crawling `example.com` → Lock: `brand-b:example.com` (different lock, allowed)

---

### 3. Cache Scope Check

**Asset Extraction** (`server/routes/crawler.ts` lines 703-758):
```typescript
const { count: existingAssetCount } = await supabase
  .from("media_assets")
  .select("id", { count: "exact", head: true })
  .eq("brand_id", brandId)          // ← Brand-scoped!
  .eq("metadata->>source", "scrape");
```

**Brand Kit Update** (`server/routes/crawler.ts` lines 1145-1169):
```typescript
const { data: existingBrand } = await supabase
  .from("brands")
  .select("brand_kit")
  .eq("id", brandId);                // ← Brand-scoped!
```

**Result**: All caches are brand-scoped ✅

---

### 4. Test Results

#### Franchise Model Tests
**File**: `server/__tests__/multi-tenancy-franchise.test.ts`

```
✓ should allow creating multiple brands with the same website_url
✓ should maintain separate brand_kit for each brand
✓ should store separate scraped assets for each brand
✓ should allow concurrent crawls for different brands with same URL
✓ should enforce RLS isolation (brands cannot see each other's data)
✓ should not reuse cache across different brands
✓ should support typical franchise workflow

7 tests | 7 passed | 0 failed | Duration: 3.28s
```

#### Team Model Tests
**File**: `server/__tests__/multi-tenancy-team.test.ts`

```
✓ should verify brand_members table structure supports team model
✓ should allow all team members to see the same brand_kit
✓ should allow team members to see shared scraped assets
✓ should support version history shared across team
✓ should prevent duplicate crawl within same brand (lock is brand-scoped)
✓ should enforce RLS for brand access (only members can access)
✓ should support typical team workflow
✓ should document role hierarchy
✓ should clarify when to use Team vs Franchise

9 tests | 9 passed | 0 failed | Duration: 1.60s
```

**Total**: 16 tests, all passing ✅

---

## 📖 Documentation

### Primary Document
**File**: `docs/MULTI_TENANCY_TEAM_VS_FRANCHISE.md`

**Contents**:
- Executive summary (same-domain multi-brand allowed)
- Team vs Franchise definitions
- Data model details (brands, brand_members, media_assets tables)
- Crawler behavior (locks, caches)
- What's allowed / not allowed
- Real-world examples
- Testing guidance
- Audit summary table

**Size**: 1,400+ lines of comprehensive documentation

---

## 🚀 Usage Examples

### Franchise Scenario
**Bahama Bucks Franchise System**:

```javascript
// Create Brand A (Miami)
const brandA = await createBrand({
  name: "Bahama Bucks Miami",
  website_url: "https://bahamabucks.com",
  tenant_id: "franchise-system-1"
});

// Create Brand B (Orlando)
const brandB = await createBrand({
  name: "Bahama Bucks Orlando",
  website_url: "https://bahamabucks.com",  // ← SAME DOMAIN
  tenant_id: "franchise-system-1"
});

// Both crawls succeed
await crawl(brandA.id, "https://bahamabucks.com");  // ✅ Creates Brand Guide 1
await crawl(brandB.id, "https://bahamabucks.com");  // ✅ Creates Brand Guide 2

// Each brand has separate Brand Guide + assets
const guideA = await getBrandKit(brandA.id);  // Miami-specific
const guideB = await getBrandKit(brandB.id);  // Orlando-specific
```

---

### Team Scenario
**Acme Corp Marketing Team**:

```javascript
// Create brand
const brand = await createBrand({
  name: "Acme Corp",
  website_url: "https://acmecorp.com",
  tenant_id: "acme-workspace-1"
});

// Add team members
await addBrandMember(brand.id, userSarah.id, "owner");
await addBrandMember(brand.id, userMike.id, "editor");
await addBrandMember(brand.id, userLisa.id, "member");

// All team members see same Brand Guide
const guideSarah = await getBrandKit(brand.id, { userId: userSarah.id });
const guideMike = await getBrandKit(brand.id, { userId: userMike.id });
// guideSarah === guideMike (same brand_id, same data)
```

---

## ✅ Quality Gates

**All passed**:

```bash
pnpm typecheck  # ✅ No TypeScript errors
pnpm build      # ✅ Build succeeds
pnpm test       # ✅ 16 tests pass (7 franchise + 9 team)
```

---

## 🎯 Deliverables

### 1. Documentation
- ✅ `docs/MULTI_TENANCY_TEAM_VS_FRANCHISE.md` (1,400+ lines)
- ✅ `docs/MULTI_TENANCY_AUDIT_SUMMARY.md` (this file)

### 2. Tests
- ✅ `server/__tests__/multi-tenancy-franchise.test.ts` (7 tests)
- ✅ `server/__tests__/multi-tenancy-team.test.ts` (9 tests)

### 3. Audit Table
| Location | What It Does | Blocks Franchise? | Status |
|----------|--------------|-------------------|--------|
| `brands.website_url` | Stores brand's website | ❌ No (no UNIQUE) | ✅ Safe |
| `brands.slug` | URL-friendly identifier | ❌ No (tenant-scoped) | ✅ Safe |
| `brand_members` | Team access control | ❌ No (brand-scoped) | ✅ Safe |
| `activeCrawlLocks` | Duplicate prevention | ❌ No (brand-scoped key) | ✅ Safe |
| Asset extraction cache | Skip if exists | ❌ No (checks `brand_id`) | ✅ Safe |
| Brand kit update cache | Skip if populated | ❌ No (checks `brand_id`) | ✅ Safe |
| RLS policies | Data isolation | ❌ No (enforces membership) | ✅ Safe |

### 4. Code Changes
- ✅ No code changes needed (system already franchise-ready)
- ✅ No migrations needed
- ✅ No schema changes needed

---

## 🔐 Security Verification

**RLS Policies Confirmed**:

```sql
-- Brands table RLS (from migration 001)
CREATE POLICY "Users can only access brands they are members of"
ON brands FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM brand_members
    WHERE brand_members.brand_id = brands.id
    AND brand_members.user_id = auth.uid()
  )
);

-- Media Assets table RLS (from migration 001)
CREATE POLICY "Brand members can view media assets"
ON media_assets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM brand_members
    WHERE brand_members.brand_id = media_assets.brand_id
    AND brand_members.user_id = auth.uid()
  )
);
```

**Result**: Cross-brand data access is impossible via RLS ✅

---

## 📈 Next Steps (Optional)

### Franchise Template System (Future Enhancement)
**Concept**: Allow parent brand to define templates that child brands inherit.

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
- Corporate creates "master brand" with approved colors/fonts
- Franchise locations create child brands
- Children inherit but can override specific fields

**Status**: Not implemented (franchise independence is default)

---

## 🎉 Summary

✅ **System is fully franchise-ready**  
✅ **No schema changes needed**  
✅ **No code changes needed**  
✅ **Zero blockers found**  
✅ **16 tests passing**  
✅ **Comprehensive documentation delivered**

**Same domain can be crawled unlimited times for different brands.**

---

**Audit Completed By**: AI Assistant  
**Date**: 2025-12-15  
**Commit**: 40febe2  
**Test Results**: 16/16 passing

