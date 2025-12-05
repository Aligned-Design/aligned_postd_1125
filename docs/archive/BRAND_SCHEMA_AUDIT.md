# Brand Schema Audit & Alignment

## ✅ Migration Applied

**Migration File**: `supabase/migrations/012_canonical_schema_alignment.sql`

### Columns Added
- ✅ `workspace_id` (TEXT) - Backward compatibility alias to `tenant_id`
- ✅ `industry` (TEXT) - Industry classification for brands

### Schema Alignment Status
All brand creation/update code now matches the live database schema.

## 📋 Brand Creation Code Audit

### ✅ Brand Insert (POST /api/brands)

**File**: `server/routes/brands.ts` (lines 182-191)

**Columns Set**:
```typescript
{
  name,                    // ✅ TEXT - exists
  slug,                    // ✅ TEXT - exists
  website_url,             // ✅ TEXT - exists
  industry,                // ✅ TEXT - exists (added by migration)
  description,             // ✅ TEXT - exists
  tenant_id,               // ✅ UUID - exists
  workspace_id,            // ✅ TEXT - exists (added by migration)
  created_by,              // ✅ UUID - exists
}
```

**Status**: ✅ **SAFE** - All columns exist in database schema.

## ⚠️ Legacy Column References (Read-Only Fallbacks)

The following columns are referenced in **read operations only** as fallbacks. They are **NOT** inserted or updated, so they won't cause errors if they don't exist:

### Referenced But Not Written
1. **`brand.logo_url`** (referenced in):
   - `server/routes/brand-guide.ts:153` - Fallback: `brand.logo_url || brandKit.logoUrl || ...`
   - `server/lib/approvals-db-service.ts:631` - Fallback: `brand.logo_url || undefined`

2. **`brand.primary_color`** (referenced in):
   - `server/routes/brand-guide.ts:158` - Fallback: `brand.primary_color || ...`
   - `server/lib/brand-visual-identity.ts:55` - Fallback: `brand.primary_color || ...`

3. **`brand.tone_keywords`** (referenced in):
   - `server/routes/brand-guide.ts:145` - Fallback: `brand.tone_keywords || ...`
   - `server/lib/brand-profile.ts:75,165` - Fallback: `brand.tone_keywords || ...`

4. **`brand.compliance_rules`** (referenced in):
   - `server/lib/brand-profile.ts:150` - Fallback: `brand.compliance_rules || ...`

**Status**: ✅ **SAFE** - These are read-only fallbacks. If columns don't exist, they return `undefined` and code falls back to `brand_kit` JSONB field.

## 🔄 Migration Strategy

### Prefer `tenant_id` Over `workspace_id`

**Current Approach**:
- `tenant_id` is the **source of truth** (UUID, references `tenants` table)
- `workspace_id` is kept for **backward compatibility** (TEXT, synced from `tenant_id`)

**Code Pattern**:
```typescript
// ✅ Preferred: Use tenant_id
const finalTenantId = tenant_id || workspace_id || user?.workspaceId || user?.tenantId;

// ✅ Brand creation sets both (for compatibility)
{
  tenant_id: finalTenantId,      // Primary
  workspace_id: finalTenantId,   // Backward compatibility
}
```

**Migration Logic** (in `012_canonical_schema_alignment.sql`):
- If `workspace_id` exists, sync it with `tenant_id`
- If `workspace_id` doesn't exist, create it and sync from `tenant_id`

## ✅ Onboarding Brand Creation

**File**: `client/pages/onboarding/Screen2BusinessEssentials.tsx`

**API Call**: `POST /api/brands`

**Payload**:
```typescript
{
  name: brandName,
  website_url: normalizedUrl,
  industry: businessType,        // ✅ Column exists
  description: description,
  tenant_id: workspaceId,
  workspace_id: workspaceId,     // ✅ Column exists (backward compatibility)
  autoRunOnboarding: false,
}
```

**Status**: ✅ **SAFE** - All columns exist in database schema.

## 🎯 Next Steps

1. ✅ Migration adds `workspace_id` and `industry` columns
2. ✅ Brand creation code verified to match schema
3. ✅ Legacy column references are read-only fallbacks (safe)
4. ⏭️ Test brand creation during onboarding with fresh user
5. ⏭️ Verify `workspace_id` syncs correctly with `tenant_id`

## 📝 Notes

- **Legacy columns** (`logo_url`, `primary_color`, `tone_keywords`, `compliance_rules`) are not in the canonical schema but are referenced as fallbacks. They should be migrated to `brand_kit` JSONB field in a future cleanup.
- **`workspace_id`** is kept for backward compatibility but `tenant_id` is the preferred field going forward.
- All brand creation/update operations now use only columns that exist in the live schema.

