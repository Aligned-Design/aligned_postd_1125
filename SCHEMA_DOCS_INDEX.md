# 📚 Schema Documentation Index

**Complete database schema extraction and analysis for the POSTD application**

Generated: 2025-11-19

---

## 🎯 Quick Start

**If you need to know...**

1. **"What columns does the `brands` table have?"**  
   → See [SCHEMA_EXTRACTION_REPORT.md](./SCHEMA_EXTRACTION_REPORT.md) - Section: `brands`

2. **"Is my production schema correct?"**  
   → See [SCHEMA_EXTRACTION_EXECUTIVE_SUMMARY.md](./SCHEMA_EXTRACTION_EXECUTIVE_SUMMARY.md) - Critical Findings

3. **"How do I map TypeScript types to database columns?"**  
   → See [SCHEMA_TYPE_MAPPING.md](./SCHEMA_TYPE_MAPPING.md)

4. **"How do I test if my schema is aligned?"**  
   → Run: `pnpm test:schema-align`  
   → See [SCHEMA_SMOKE_TEST_README.md](./SCHEMA_SMOKE_TEST_README.md)

---

## 📄 Document Overview

### 1. **SCHEMA_EXTRACTION_REPORT.md** (2549 lines)
**Purpose:** Complete, exhaustive listing of all 64 database tables

**What's inside:**
- Every table found in SQL migrations
- Every column with type, nullable, default value, and source file
- TypeScript type definitions that reference each table
- Code references (where columns are used)
- Identified mismatches between schema and code

**When to use:**
- You need the full, unfiltered schema
- You're debugging a specific column or table
- You want to see which migration file defined a column

**Structure:**
```
## TABLE: brands
### Columns found in SQL migrations (44 total)
  - id: UUID PRIMARY KEY...
  - name: TEXT NOT NULL...
  - brand_kit: JSONB...
### TypeScript type definitions
  - BrandGuide (shared/brand-guide.ts)
### Code references
  - brand_kit: found in 88 locations
### Mismatches
  - ❌ Expected column missing: ...
```

---

### 2. **SCHEMA_EXTRACTION_EXECUTIVE_SUMMARY.md**
**Purpose:** High-level overview of schema health and critical issues

**What's inside:**
- ✅ Tables that are fully aligned (5 tables)
- ⚠️ Tables that need attention (3 tables)
- 🚨 Immediate action items with SQL fixes
- Schema health by category
- Notable findings (unused tables, most-used tables)

**When to use:**
- Quick schema health check
- Understanding which tables have issues
- Getting SQL fixes for common problems

**Critical Findings:**
1. **brands** - ✅ All 44 columns present
2. **media_assets** - ⚠️ `file_size` vs `size_bytes` conflict
3. **content_items** - ⚠️ `body`/`content_type` vs `content`/`type` migration
4. **analytics_metrics** - ⚠️ Flat columns vs JSONB consolidation

---

### 3. **SCHEMA_TYPE_MAPPING.md**
**Purpose:** TypeScript ↔ Database mapping reference

**What's inside:**
- Which TypeScript interfaces map to which tables
- Snake_case (DB) ↔ camelCase (TS) conversions
- JSONB column → nested object mappings
- Mapping functions and best practices
- Common pitfalls and how to avoid them

**When to use:**
- Writing new database queries
- Creating new TypeScript types
- Understanding how `brand_kit` JSONB is structured
- Debugging type mismatches

**Example:**
```typescript
// Database (snake_case)
brand_id, size_bytes, created_at

// TypeScript (camelCase)
brandId, sizeBytes, createdAt

// Mapping function
function mapAssetRecord(record: MediaAssetRecord): MediaAsset {
  return {
    brandId: record.brand_id,
    sizeBytes: record.size_bytes,
    createdAt: record.created_at,
  };
}
```

---

### 4. **SCHEMA_SMOKE_TEST_README.md**
**Purpose:** Documentation for the schema alignment smoke test

**What's inside:**
- How to run the test: `pnpm test:schema-align`
- Required environment variables
- How to interpret test failures
- What each test validates
- Integration with CI/CD

**When to use:**
- After running database migrations
- Before deploying to production
- Debugging schema mismatches
- Setting up CI/CD schema validation

**Test coverage:**
- ✅ `brands` table insert/read
- ✅ `brand_members` table and FK constraints
- ✅ `media_assets` table (size_bytes check)
- ✅ `storage_quotas` table
- ✅ `content_items` table (content JSONB check)
- ✅ `scheduled_content` table
- ✅ `analytics_metrics` table (metrics JSONB check)
- ✅ `milestones` table

---

### 5. **SCHEMA_AUDIT_REPORT.md** (older)
**Purpose:** Manual schema audit comparing migrations to code expectations

**Status:** Superseded by `SCHEMA_EXTRACTION_REPORT.md`

**When to use:**
- Historical reference
- Understanding the audit process
- Seeing what was manually identified before automation

---

### 6. **SCHEMA_AUDIT_EXECUTIVE_SUMMARY.md** (older)
**Purpose:** Executive summary of manual audit

**Status:** Superseded by `SCHEMA_EXTRACTION_EXECUTIVE_SUMMARY.md`

---

## 🔧 Schema Maintenance Workflow

### Step 1: Check Schema Health
```bash
# Run automated schema test
pnpm test:schema-align
```

**If it passes:** ✅ Your schema is aligned

**If it fails:** Go to Step 2

---

### Step 2: Identify the Problem

**Look at the error message:**
```
❌ Failed to insert brand: Could not find the 'tone_keywords' column
```

**This tells you:**
- Table: `brands`
- Missing column: `tone_keywords`
- Expected type: `TEXT[]`

---

### Step 3: Find the Fix

**Option A: Check SCHEMA_EXTRACTION_EXECUTIVE_SUMMARY.md**
- Look under "Immediate Action Items"
- Copy/paste SQL fix

**Option B: Check migration files**
```bash
# Find which migration adds this column
grep -r "tone_keywords" server/migrations/ supabase/migrations/
```

**Option C: Use this quick reference:**

| Missing Column | SQL Fix |
|----------------|---------|
| `tone_keywords` | `ALTER TABLE brands ADD COLUMN tone_keywords TEXT[];` |
| `intake_completed` | `ALTER TABLE brands ADD COLUMN intake_completed BOOLEAN DEFAULT FALSE;` |
| `size_bytes` | `ALTER TABLE media_assets ADD COLUMN size_bytes BIGINT;` |
| `content` (JSONB) | `ALTER TABLE content_items ADD COLUMN content JSONB DEFAULT '{}'::jsonb;` |
| `metrics` (JSONB) | `ALTER TABLE analytics_metrics ADD COLUMN metrics JSONB;` |

---

### Step 4: Apply the Fix

**In Supabase SQL Editor:**
1. Go to https://app.supabase.com/project/YOUR_PROJECT/sql
2. Paste SQL from Step 3
3. Click "Run"

**Or via `psql`:**
```bash
psql $DATABASE_URL -f server/migrations/011_add_all_brand_columns.sql
```

---

### Step 5: Verify the Fix
```bash
pnpm test:schema-align
```

Should now pass ✅

---

### Step 6: Clear Supabase Schema Cache (if needed)

Sometimes Supabase's REST API cache needs to be cleared:

1. Go to Supabase Dashboard → Settings → API
2. Click "Reload schema cache"
3. Wait 10-30 seconds
4. Re-run test

---

## 📊 Schema Statistics

**Total tables:** 64

**Critical V1 tables:** 8
- `brands` (44 columns)
- `brand_members` (12 columns)
- `media_assets` (33 columns)
- `storage_quotas` (23 columns)
- `content_items` (24 columns)
- `scheduled_content` (8 columns)
- `analytics_metrics` (31 columns)
- `milestones` (7 columns)

**Most referenced in code:**
1. `brands` - 88 references
2. `media_assets` - 66 references
3. `analytics_metrics` - 60 references
4. `content_items` - 48 references

**Least used (future features):**
- `workflow_templates`, `workflow_instances`, `workflow_notifications`
- `webhook_events`, `webhook_attempts`
- `escalation_rules`, `escalation_events`
- `advisor_feedback`, `advisor_review_audits`

---

## 🚨 Common Issues & Solutions

### Issue 1: "Could not find the 'X' column in schema cache"

**Cause:** Column exists in migration but not in production database

**Fix:**
```sql
-- Find the correct migration file
grep -r "ADD COLUMN X" supabase/migrations/

-- Run that migration in Supabase SQL Editor
```

---

### Issue 2: "Cannot insert NULL into non-null column"

**Cause:** Column is marked NOT NULL in database but code is sending NULL

**Fix:**
```sql
-- Make column nullable
ALTER TABLE table_name ALTER COLUMN column_name DROP NOT NULL;

-- Or set a default value
ALTER TABLE table_name ALTER COLUMN column_name SET DEFAULT 'value';
```

---

### Issue 3: "Type mismatch: expected JSONB, got TEXT"

**Cause:** Migration changed column type from TEXT to JSONB (or vice versa)

**Fix:**
```sql
-- Check current type
SELECT data_type FROM information_schema.columns 
WHERE table_name = 'brands' AND column_name = 'voice_summary';

-- If it's TEXT but should be JSONB:
ALTER TABLE brands ALTER COLUMN voice_summary TYPE JSONB USING voice_summary::jsonb;

-- If it's JSONB but should be TEXT:
ALTER TABLE brands ALTER COLUMN voice_summary TYPE TEXT;
```

---

### Issue 4: "Foreign key violation"

**Cause:** `brand_members.user_id` references `user_profiles(id)` but should reference `auth.users(id)`

**Fix:**
```sql
-- Drop old FK
ALTER TABLE brand_members DROP CONSTRAINT IF EXISTS brand_members_user_id_fkey;

-- Add correct FK
ALTER TABLE brand_members ADD CONSTRAINT brand_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

---

## 🔍 How to Search the Schema Docs

### Find a table:
```bash
# In any document
grep -i "## TABLE: brands" SCHEMA_*.md
```

### Find a column:
```bash
# In SCHEMA_EXTRACTION_REPORT.md
grep -A 5 "tone_keywords" SCHEMA_EXTRACTION_REPORT.md
```

### Find TypeScript type:
```bash
# In SCHEMA_TYPE_MAPPING.md
grep -A 10 "MediaAssetRecord" SCHEMA_TYPE_MAPPING.md
```

### Find SQL fix:
```bash
# In SCHEMA_EXTRACTION_EXECUTIVE_SUMMARY.md
grep -A 5 "ALTER TABLE" SCHEMA_EXTRACTION_EXECUTIVE_SUMMARY.md
```

---

## 🛠️ Tooling

### Schema Extraction Script
**Location:** `server/scripts/extract-complete-schema.ts`

**Run it:**
```bash
pnpm exec tsx server/scripts/extract-complete-schema.ts
```

**Output:** Regenerates `SCHEMA_EXTRACTION_REPORT.md`

**When to run:**
- After adding new migrations
- After adding new TypeScript types
- Monthly schema audit

---

### Schema Alignment Smoke Test
**Location:** `server/scripts/schema-alignment-smoke-test.ts`

**Run it:**
```bash
pnpm test:schema-align
```

**Output:** Pass/fail for each critical table

**When to run:**
- After database migrations
- Before production deployments
- In CI/CD pipeline

---

## 📝 Keeping Docs Up to Date

### When to regenerate docs:

1. **After adding a new migration file:**
   ```bash
   pnpm exec tsx server/scripts/extract-complete-schema.ts
   ```

2. **After adding new TypeScript types:**
   - Update `SCHEMA_TYPE_MAPPING.md` manually
   - Add examples of new type → DB mappings

3. **After fixing a schema issue:**
   - Update `SCHEMA_EXTRACTION_EXECUTIVE_SUMMARY.md`
   - Move table from "⚠️ Needs Attention" to "✅ Fully Aligned"

---

## ✅ Schema Health Checklist

Before production deployment:

- [ ] Run `pnpm test:schema-align` - all tests pass
- [ ] All critical tables listed in `SCHEMA_EXTRACTION_EXECUTIVE_SUMMARY.md` are ✅
- [ ] No `file_size` references in code (should be `size_bytes`)
- [ ] No `content_type` references in `content_items` queries (should be `type`)
- [ ] No `body` references in `content_items` queries (should be `content` JSONB)
- [ ] `brand_members.user_id` references `auth.users`, not `user_profiles`
- [ ] Supabase schema cache has been reloaded after migrations

---

## 🎓 Learning Path

**If you're new to this codebase:**

1. **Start here:** `SCHEMA_EXTRACTION_EXECUTIVE_SUMMARY.md`  
   Get the big picture of schema health

2. **Then read:** `SCHEMA_TYPE_MAPPING.md`  
   Understand how code maps to database

3. **Run the test:** `pnpm test:schema-align`  
   See if schema is aligned

4. **Deep dive:** `SCHEMA_EXTRACTION_REPORT.md`  
   Explore specific tables and columns

5. **Reference:** This index document  
   Come back when you need to find something

---

**Questions? Issues?**

See the full extraction report for exhaustive details:  
`SCHEMA_EXTRACTION_REPORT.md` (2549 lines, all 64 tables, all columns)

---

**Last updated:** 2025-11-19  
**Generated by:** `server/scripts/extract-complete-schema.ts`

