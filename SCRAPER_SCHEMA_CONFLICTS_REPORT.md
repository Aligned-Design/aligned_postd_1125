# 🚨 SCRAPER SCHEMA CONFLICTS REPORT

**Date:** 2025-12-12  
**Severity:** CRITICAL - Production Data Inconsistency  
**Status:** Multiple schema/code conflicts found

---

## EXECUTIVE SUMMARY

The scraper pipeline has **critical conflicts** between database schema expectations (migrations) and actual code implementation. Migration 009 attempted to consolidate `voice_summary` and `visual_summary` into `brand_kit`, but the code was **never updated** to match. This creates data fragmentation and lookup failures.

**Impact:** 
- Data written to wrong locations
- Multiple sources of truth for same data
- Smoke tests check 8+ different locations for colors
- Brand Guide queries fail to find data

---

## CONFLICT 1: voice_summary Storage 🔴 CRITICAL

### Schema Says (Migration 009):
```sql
-- Migration: 009_consolidate_brand_guide_fields.sql
-- Purpose: Merge voice_summary, visual_summary, and tone_keywords into brand_kit JSONB
-- After this migration:
-- - All Brand Guide data should be in brands.brand_kit
-- - voice_summary, visual_summary, tone_keywords are kept for backward compatibility
-- - Code should be updated to read/write only from brand_kit

COMMENT ON COLUMN brands.voice_summary IS 'LEGACY: Voice & tone data. Use brand_kit->voiceAndTone instead. This field is kept for backward compatibility and will be removed in a future migration.';
```

**Schema expects:** `brand_kit.voiceAndTone`  
**Migration status:** Declares `voice_summary` as LEGACY

### Code Does (Current Implementation):

#### ❌ SCRAPER WRITES TO LEGACY COLUMN
```typescript
// server/routes/crawler.ts:977
voice_summary: brandKit.voice_summary || {},
```

#### ❌ BRAND GUIDE SERVICE WRITES TO LEGACY COLUMN
```typescript
// server/lib/brand-guide-service.ts:307
.update({
  brand_kit: brandKit,
  voice_summary: voiceSummary,  // ❌ Writing to LEGACY field
  visual_summary: visualSummary,
})
```

#### ❌ BRAND GUIDE SYNC WRITES TO LEGACY COLUMN
```typescript
// server/lib/brand-guide-sync.ts:307
.update({
  brand_kit: brandKit,
  voice_summary: voiceSummary,  // ❌ Writing to LEGACY field
  visual_summary: visualSummary,
})
```

#### ❌ BRAND GUIDE API WRITES TO LEGACY COLUMN
```typescript
// server/routes/brand-guide.ts:378
.update({
  brand_kit: brandKit,
  voice_summary: voiceSummary,  // ❌ Writing to LEGACY field
  visual_summary: visualSummary,
})
```

### ✅ Shared Type CORRECTLY Uses New Structure
```typescript
// shared/brand-guide.ts
export interface BrandGuide {
  voiceAndTone: {
    tone: string[];
    friendlinessLevel: number;
    // ...
  };
}
```

### 🤔 Normalization Function Reads BOTH Locations
```typescript
// shared/brand-guide.ts:190-202
voiceAndTone: {
  tone: Array.isArray(voiceSummary.tone)
    ? voiceSummary.tone                    // ❌ Reading from LEGACY column
    : Array.isArray(brandKit.toneKeywords)
    ? brandKit.toneKeywords               // ✅ Reading from brand_kit
    : legacy.tone_keywords || [],         // ❌ Reading from LEGACY column
}
```

### Result:
**FRAGMENTED DATA** - Voice/tone data exists in 3 places:
1. `brands.voice_summary` (JSONB column) - where code writes
2. `brands.brand_kit.voiceAndTone` - where schema expects
3. `brands.tone_keywords` (TEXT[] column) - legacy fallback

---

## CONFLICT 2: Color Storage 🔴 CRITICAL

### Schema Says:
```typescript
// shared/brand-guide.ts:44-45
visualIdentity: {
  colors: string[]; // hex codes
}
```

### Code Does:

#### ❌ SCRAPER WRITES TO 3 LOCATIONS
```typescript
// server/routes/crawler.ts:961-981
brand_kit: {
  colors: colorPalette,  // ✅ Writing to brand_kit.colors
},
voice_summary: brandKit.voice_summary || {},
visual_summary: {
  colors: brandKit.colors?.allColors || brandKit.colors?.primaryColors || [],  // ❌ Also writing to visual_summary.colors
}
```

#### 🔥 SMOKE TEST CHECKS 8+ LOCATIONS
```typescript
// scripts/scraper-truth-smoke.ts:288-306
const allColors: string[] =
  // 1. brand_kit.colors.allColors (preferred)
  (colorsObj.allColors as string[]) ||
  // 2. brand_kit.colors.palette (some crawlers use this)
  (colorsObj.palette as string[]) ||
  // 3. brand_kit.colors.primaryColors
  (colorsObj.primaryColors as string[]) ||
  // 4. brand_kit.primaryColors (direct)
  (brandKit.primaryColors as string[]) ||
  // 5. brand_kit.colorPalette
  (brandKit.colorPalette as string[]) ||
  // 6. brand_kit.allColors (direct)
  (brandKit.allColors as string[]) ||
  // 7. visual_summary.colors (crawler also saves here - fallback)
  (visualSummary.colors as string[]) ||
  // 8. Individual color fields
  [colorsObj.primary, colorsObj.secondary, colorsObj.accent].filter(Boolean)
```

### Result:
**8 DIFFERENT COLOR STORAGE LOCATIONS** - Smoke test has to check all of them because no single source of truth exists.

---

## CONFLICT 3: BrandKitData Interface Mismatch 🟡 MEDIUM

### Scraper Defines:
```typescript
// server/workers/brand-crawler.ts:166-181
interface BrandKitData {
  voice_summary: VoiceSummary;  // ❌ Nested object
  keyword_themes: string[];
  about_blurb: string;
  colors: ColorPalette;
  // ...
}
```

### Shared Type Defines:
```typescript
// shared/brand-guide.ts:14-164
export interface BrandGuide {
  voiceAndTone: {  // ✅ Different structure
    tone: string[];
    friendlinessLevel: number;
    // ...
  };
  visualIdentity: {
    colors: string[];  // ✅ Simple array
  };
}
```

### Result:
**TYPE MISMATCH** - Scraper's `BrandKitData` does not match `BrandGuide` interface. Conversion logic scattered across multiple files.

---

## CONFLICT 4: Database Schema vs Code 🔴 CRITICAL

### Database Schema:
```sql
-- supabase/migrations/001_bootstrap_schema.sql:111-113
brand_kit JSONB DEFAULT '{}'::jsonb,
voice_summary JSONB,
visual_summary JSONB,
```

### Migration 009 Comments:
```sql
COMMENT ON COLUMN brands.brand_kit IS 'Canonical Brand Guide data (JSONB). All Brand Guide fields should be stored here. voice_summary, visual_summary, and tone_keywords are legacy fields kept for backward compatibility.';

COMMENT ON COLUMN brands.voice_summary IS 'LEGACY: Voice & tone data. Use brand_kit->voiceAndTone instead.';

COMMENT ON COLUMN brands.visual_summary IS 'LEGACY: Visual identity data. Use brand_kit->visualIdentity instead.';
```

### Code Reality:
✅ Schema says: `brand_kit` is canonical  
❌ Code does: Writes to both `brand_kit` AND legacy columns  
❌ Migration says: Update code to read/write only from brand_kit  
❌ Reality: Code was NEVER updated

---

## CONFLICT 5: Color Structure Inconsistency 🟡 MEDIUM

### Scraper Creates:
```typescript
// server/routes/crawler.ts:893-902
{
  primary: "#HEX",
  secondary: "#HEX",
  accent: "#HEX",
  confidence: number,
  primaryColors: ["#HEX", "#HEX", "#HEX"],
  secondaryColors: ["#HEX", "#HEX", "#HEX"],
  allColors: ["#HEX", ...] // Max 6
}
```

### BrandGuide Expects:
```typescript
// shared/brand-guide.ts:44-45
visualIdentity: {
  colors: string[]; // Simple array of hex codes
}
```

### Result:
**STRUCTURE MISMATCH** - Scraper creates complex ColorPalette object, but BrandGuide expects simple string array.

---

## ROOT CAUSE ANALYSIS

### Migration 009 Failed to Complete
1. ✅ Migration merged existing data from `voice_summary` → `brand_kit.voiceAndTone`
2. ✅ Migration added comments marking fields as LEGACY
3. ❌ **Code was NEVER updated to use new structure**
4. ❌ **All write operations still target legacy columns**

### Why This Happened
- Migration 009 says: *"Code should be updated to read/write only from brand_kit"*
- Migration 009 says: *"Future migration can drop legacy fields after code is updated"*
- **The future never came** - Code was never updated

---

## IMPACT ASSESSMENT

### 🔴 CRITICAL ISSUES
1. **Data Fragmentation**: Same data exists in multiple locations with no sync
2. **Query Failures**: Code checks wrong locations, fails to find data
3. **Scraper Writes to Wrong Locations**: Violates schema design intent
4. **Smoke Test Complexity**: Must check 8+ locations for colors (symptom of deeper issue)

### 🟡 MEDIUM ISSUES
1. **Type Mismatches**: `BrandKitData` vs `BrandGuide` interface conflicts
2. **Color Structure**: Complex object vs simple array expectations
3. **No Single Source of Truth**: Multiple partial truths scattered across codebase

### 🟢 LOW ISSUES
1. **Backward Compatibility**: Migration kept legacy columns, preventing immediate breakage
2. **Normalization Function**: Attempts to unify, but adds complexity

---

## AFFECTED FILES

### Files Writing to Legacy Columns (Need Update)
- ❌ `server/routes/crawler.ts:977` - Scraper write
- ❌ `server/lib/brand-guide-service.ts:307` - Brand Guide save
- ❌ `server/lib/brand-guide-sync.ts:307` - Brand Guide sync
- ❌ `server/routes/brand-guide.ts:378` - Brand Guide API

### Files Reading from Multiple Locations
- ⚠️ `shared/brand-guide.ts:190-202` - Normalization function
- ⚠️ `scripts/scraper-truth-smoke.ts:288-306` - Smoke test
- ⚠️ `server/lib/brand-context.ts:35-191` - Brand context fetch

### Interface Definition Conflicts
- 🔧 `server/workers/brand-crawler.ts:166` - `BrandKitData` interface
- 🔧 `shared/brand-guide.ts:14` - `BrandGuide` interface
- 🔧 `client/lib/supabase.ts:53-55` - Client Brand type

---

## RECOMMENDED FIXES

### PHASE 1: Align Code to Schema (PRIORITY)
1. Update scraper to write ONLY to `brand_kit` (no more `voice_summary`/`visual_summary` writes)
2. Update all save operations to write to `brand_kit.voiceAndTone` and `brand_kit.visualIdentity`
3. Keep read operations checking both locations for backward compat

### PHASE 2: Standardize Color Storage
1. Decide: Complex `ColorPalette` object OR simple `string[]`?
2. Update `BrandGuide` interface if keeping complex structure
3. Migrate existing data to single location

### PHASE 3: Clean Up Smoke Test
1. After Phase 1/2, smoke test should check ONLY 1-2 locations
2. Current 8-location check is technical debt indicator

### PHASE 4: Drop Legacy Columns (Future)
1. After all code updated and deployed
2. Run final data migration to ensure no data loss
3. Drop `voice_summary`, `visual_summary`, `tone_keywords` columns

---

## FILES REQUIRING CHANGES

### Immediate (Phase 1)
```
server/routes/crawler.ts          - Remove voice_summary/visual_summary writes
server/lib/brand-guide-service.ts - Write to brand_kit only
server/lib/brand-guide-sync.ts    - Write to brand_kit only
server/routes/brand-guide.ts      - Write to brand_kit only
```

### Medium-term (Phase 2)
```
server/workers/brand-crawler.ts   - Update BrandKitData interface
shared/brand-guide.ts             - Unify color structure
scripts/scraper-truth-smoke.ts    - Simplify color checks
```

### Long-term (Phase 4)
```
supabase/migrations/XXX_drop_legacy_columns.sql
```

---

## VERIFICATION STEPS

### After Phase 1
1. Run scraper smoke test - should check only `brand_kit` locations
2. Check new brands - no data in `voice_summary`/`visual_summary`
3. Verify Brand Guide loads correctly from `brand_kit.voiceAndTone`

### After Phase 2
1. Smoke test checks max 2 color locations (brand_kit + fallback)
2. All brands have consistent color structure
3. No "color not found" errors in logs

---

## CONCLUSION

Migration 009 intended to consolidate Brand Guide data into `brand_kit` but the code migration was never completed. The result is **data fragmentation** across 3+ locations with no clear source of truth.

**Recommendation:** Complete the migration 009 intent by updating all write operations to target `brand_kit` exclusively, while maintaining backward-compatible reads during transition.

**Priority:** HIGH - This affects core scraper functionality and data consistency.

---

## APPENDIX: Migration 009 Original Intent

```sql
-- Migration: 009_consolidate_brand_guide_fields.sql
-- Date: 2025-01-20
-- Purpose: Merge voice_summary, visual_summary, and tone_keywords into brand_kit JSONB

-- After this migration:
-- - All Brand Guide data should be in brands.brand_kit
-- - voice_summary, visual_summary, tone_keywords are kept for backward compatibility
-- - Code should be updated to read/write only from brand_kit
-- - Future migration can drop legacy fields after code is updated
```

**Status:** Migration ran, code update never happened. ❌

