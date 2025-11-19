# SCHEMA EXTRACTION - EXECUTIVE SUMMARY

**Generated:** 2025-11-19  
**Total Tables Found:** 64  
**Critical Tables Validated:** 8

---

## 🎯 PURPOSE

This report consolidates ALL database schema information found across:
- SQL migration files (`server/migrations/`, `supabase/migrations/`)
- TypeScript type definitions (`server/`, `client/`, `shared/`)
- Runtime code references (database queries, inserts, updates)

**Goal:** Identify every column the system expects vs. what exists in migrations.

---

## 🔥 CRITICAL FINDINGS

### 1. **brands** table (44 columns found)

✅ **All expected columns are present:**
- Core identity: `id`, `name`, `slug`, `logo_url`, `primary_color`, `website_url`, `industry`, `description`
- Brand guide data: `brand_kit` (JSONB), `voice_summary` (TEXT), `visual_summary` (TEXT), `tone_keywords` (TEXT[]), `compliance_rules`
- Onboarding: `intake_completed`, `intake_completed_at`
- Multi-tenancy: `tenant_id`, `workspace_id`, `created_by`
- Scraper: `scraped_at`, `scraper_status`
- Timestamps: `created_at`, `updated_at`

⚠️ **Note:** `voice_summary` and `visual_summary` are defined as:
- **Migration 012:** TEXT
- **Migration 002:** JSONB
- **Code expectation:** Can be either (normalized via `normalizeBrandGuide()`)

**Status:** ✅ Schema is complete after migration 011

---

### 2. **brand_members** table (12 columns found)

✅ **All expected columns present:**
- `id`, `brand_id`, `user_id` (FK to `auth.users`), `role`, `created_at`, `updated_at`

⚠️ **Foreign Key Fix:** Migration 012 ensures `user_id` references `auth.users` (not `user_profiles`)

**Status:** ✅ Schema is correct

---

### 3. **media_assets** table (33 columns found)

⚠️ **SCHEMA CONFLICT:**

Two competing schemas exist:
- **Migration 006 (older):** Uses `file_size`, `url`, `thumbnail_url`, `status`, `variants`, `last_used`
- **Migration 012 (canonical):** Uses `size_bytes`, `metadata`, `used_in`, `usage_count`

**Code expectation (server/lib/media-db-service.ts):**
```typescript
export interface MediaAssetRecord {
  size_bytes: number; // ✅ NOT file_size
  metadata?: Record<string, unknown>;
  used_in?: string[];
  usage_count: number;
}
```

**Status:** ⚠️ Migration 012 is the correct schema. If production still has `file_size`, it needs to be migrated to `size_bytes`.

---

### 4. **storage_quotas** table (23 columns found)

✅ **All expected columns present:**
- `id`, `brand_id`, `tenant_id`, `limit_bytes`, `used_bytes`
- `warning_threshold_percent`, `hard_limit_percent`
- `created_at`, `updated_at`

**Status:** ✅ Schema is complete after migration 006_PRODUCTION_FIX

---

### 5. **content_items** table (24 columns found)

⚠️ **SCHEMA CONFLICT:**

Two competing columns:
- **Old schema:** `content_type` (TEXT), `body` (TEXT)
- **New schema (migration 012):** `type` (TEXT), `content` (JSONB)

**Code expectation:**
- The app expects `content` (JSONB) for structured content
- `type` should be used instead of `content_type`

**Migration 012 performs:**
```sql
ALTER TABLE content_items RENAME COLUMN content_type TO type;
ALTER TABLE content_items ADD COLUMN content JSONB;
-- Note: body column should be dropped after data migration
```

**Status:** ⚠️ Migration 012 fixes this, but `body` column may still exist in production

---

### 6. **scheduled_content** table (8 columns found)

✅ **All expected columns present:**
- `id`, `brand_id`, `content_id`, `scheduled_at`, `platforms`, `status`
- `created_at`, `updated_at`

**Status:** ✅ Schema is correct

---

### 7. **analytics_metrics** table (31 columns found)

⚠️ **DUAL SCHEMA:**

Old flat schema:
- `impressions`, `reach`, `engagements`, `clicks`, `shares`, `comments`, `likes`

New consolidated schema:
- `metrics` (JSONB) - all metrics stored as JSON

**Migration 012 performs:**
```sql
ALTER TABLE analytics_metrics ADD COLUMN metrics JSONB;
-- Temporary column for migration
ALTER TABLE analytics_metrics ADD COLUMN metrics_temp JSONB;
```

**Code expectation (server/scripts/schema-alignment-smoke-test.ts):**
```typescript
{
  brand_id: '...',
  date: '2025-01-01',
  metrics: { impressions: 1000, reach: 500 } // JSONB
}
```

**Status:** ⚠️ Migration in progress (metrics_temp suggests data is being migrated)

---

### 8. **milestones** table (7 columns found)

✅ **All expected columns present:**
- `id`, `workspace_id`, `key`, `unlocked_at`, `acknowledged_at`
- `created_at`, `updated_at`

**Status:** ✅ Schema is correct

---

## 📊 SCHEMA HEALTH BY CATEGORY

### ✅ Fully Aligned (5 tables)
1. `brands` - All 44 columns present
2. `brand_members` - All 12 columns present
3. `storage_quotas` - All 23 columns present
4. `scheduled_content` - All 8 columns present
5. `milestones` - All 7 columns present

### ⚠️ Needs Attention (3 tables)
1. **media_assets** - `file_size` vs `size_bytes` conflict
2. **content_items** - `body`/`content_type` vs `content`/`type` migration
3. **analytics_metrics** - Flat columns vs JSONB consolidation

---

## 🚨 IMMEDIATE ACTION ITEMS

### For `media_assets`:
If your production schema still has `file_size` instead of `size_bytes`, run:

```sql
-- Check if size_bytes exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'media_assets' AND column_name = 'size_bytes';

-- If not, run:
ALTER TABLE media_assets ADD COLUMN size_bytes BIGINT;
UPDATE media_assets SET size_bytes = file_size WHERE size_bytes IS NULL;
ALTER TABLE media_assets DROP COLUMN file_size;
```

### For `content_items`:
Ensure `content` (JSONB) exists and `body` is migrated:

```sql
-- Add content column if missing
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS content JSONB DEFAULT '{}'::jsonb;

-- Migrate body to content.text
UPDATE content_items 
SET content = jsonb_build_object('text', body)
WHERE content IS NULL OR content = '{}'::jsonb;

-- Rename content_type to type
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'content_items' AND column_name = 'content_type') THEN
    ALTER TABLE content_items RENAME COLUMN content_type TO type;
  END IF;
END $$;
```

### For `analytics_metrics`:
Check if `metrics` (JSONB) column exists:

```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'analytics_metrics' AND column_name = 'metrics';
```

If not, run migration 012.

---

## 📝 NEXT STEPS

1. **Validate production schema:**
   ```bash
   pnpm test:schema-align
   ```

2. **If errors occur:**
   - Check which column is missing
   - Find the appropriate SQL fix in migration 011 or 012
   - Run it in Supabase SQL Editor

3. **For detailed column-by-column analysis:**
   - See `SCHEMA_EXTRACTION_REPORT.md` (2549 lines)
   - Contains all 64 tables with full column definitions

---

## 🔍 NOTABLE FINDINGS

### TypeScript Type Coverage
- **0 TypeScript Record types found** that directly match table names
- This is expected: code uses domain types (`MediaAsset`, `BrandGuide`) that map to database records
- Mapping happens in service layers (e.g., `media-db-service.ts`, `brand-guide.ts`)

### Code Reference Density
- **brands**: 88 code references (most used)
- **media_assets**: 66 code references
- **analytics_metrics**: 60 code references
- **content_items**: 48 code references

### Tables Not Yet Used in Code (0 references)
- `advisor_feedback`
- `advisor_review_audits`
- `workflow_templates`, `workflow_instances`, `workflow_notifications`
- `webhook_events`, `webhook_attempts`
- `escalation_rules`, `escalation_events`

These are likely future features or archived from older phases.

---

## ✅ CONCLUSION

**Overall Schema Health: 🟡 Good with minor issues**

- **Core tables (brands, brand_members, milestones):** ✅ Fully aligned
- **Media tables:** ⚠️ Schema drift between migrations 006 and 012
- **Content tables:** ⚠️ Mid-migration state (old + new columns coexist)

**Recommendation:**
1. Run migration 012 (`canonical_schema_alignment.sql`) in production
2. Verify with `pnpm test:schema-align`
3. Clean up deprecated columns (`file_size`, `body`, flat analytics columns) after data migration

---

**For the complete 2549-line extraction report with all 64 tables:**  
See `SCHEMA_EXTRACTION_REPORT.md`

