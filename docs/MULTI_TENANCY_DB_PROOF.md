# Multi-Tenancy Database Truth — SQL Verification Queries

**Purpose**: Provide SQL queries to verify franchise support at the database level (not just migration files).

**Status**: ⚠️ **QUERIES PROVIDED** — Must be run against live database for final proof

---

## ❗ Important

Grepping migration files proves **intent**, but not **reality**.  
The database may have:
- Manual schema changes
- Squashed migrations
- Legacy constraints from old versions
- Indexes added outside migrations

**You must run these queries against your Supabase database to get true proof.**

---

## 1️⃣ Verify No Unique Constraint on `website_url`

**Query**:
```sql
-- Check for UNIQUE constraints on brands table
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'brands'
  AND c.contype = 'u';
```

**Expected Result** (franchise-safe):
```
constraint_name              | constraint_definition
-----------------------------+----------------------
brands_pkey                  | PRIMARY KEY (id)
brands_slug_tenant_id_key    | UNIQUE (slug, tenant_id)
```

**Expected NOT to see**:
- `UNIQUE (website_url)`
- `UNIQUE (domain)`
- `UNIQUE (host)`
- Any constraint involving `website_url` alone

---

## 2️⃣ Verify No Unique Index on `website_url`

**Query**:
```sql
-- Check for all indexes on brands table (including unique indexes)
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'brands'
ORDER BY indexname;
```

**Expected Result** (franchise-safe):
```
indexname                          | indexdef
-----------------------------------+--------------------------------------------------
brands_pkey                        | CREATE UNIQUE INDEX brands_pkey ON brands USING btree (id)
brands_slug_tenant_id_key          | CREATE UNIQUE INDEX brands_slug_tenant_id_key ON brands USING btree (slug, tenant_id)
idx_brands_tenant_id               | CREATE INDEX idx_brands_tenant_id ON brands USING btree (tenant_id)
idx_brands_created_by              | CREATE INDEX idx_brands_created_by ON brands USING btree (created_by)
```

**Expected NOT to see**:
- `CREATE UNIQUE INDEX ... ON brands (website_url)`
- `CREATE UNIQUE INDEX ... ON brands (domain)`
- Any unique index involving `website_url` alone

**Acceptable** (if exists):
- `CREATE INDEX idx_brands_website_url ...` (non-unique index for query performance)
- `CREATE UNIQUE INDEX ... ON brands (brand_id, website_url)` (composite, still franchise-safe)

---

## 3️⃣ Verify `brand_id` Type Match

**Query**:
```sql
-- Verify brand_id types match across related tables
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('brands', 'media_assets', 'brand_members', 'content_items')
  AND column_name IN ('id', 'brand_id')
ORDER BY table_name, column_name;
```

**Expected Result** (type-safe):
```
table_name     | column_name | data_type | is_nullable
---------------+-------------+-----------+-------------
brands         | id          | uuid      | NO
brand_members  | brand_id    | uuid      | NO
content_items  | brand_id    | uuid      | YES
media_assets   | brand_id    | uuid      | NO
```

**Confirms**:
- All `brand_id` columns are `UUID` (not TEXT)
- Types match across all tables (FK-safe)

---

## 4️⃣ Verify Foreign Key Constraints

**Query**:
```sql
-- Check foreign key constraints involving brand_id
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (kcu.column_name = 'brand_id' OR ccu.column_name = 'id')
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

**Expected Result** (referential integrity):
```
constraint_name                   | table_name    | column_name | foreign_table_name | foreign_column_name
----------------------------------+---------------+-------------+--------------------+---------------------
brand_members_brand_id_fkey       | brand_members | brand_id    | brands             | id
content_items_brand_id_fkey       | content_items | brand_id    | brands             | id
media_assets_brand_id_fkey        | media_assets  | brand_id    | brands             | id
```

**Confirms**:
- All `brand_id` columns properly reference `brands(id)`
- Cascading deletes configured (ON DELETE CASCADE)

---

## 5️⃣ Verify RLS Policies on `brands`

**Query**:
```sql
-- Check RLS policies on brands table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'brands'
ORDER BY policyname;
```

**Expected Result** (team isolation):
```
tablename | policyname                                    | cmd    | qual (USING clause)
----------+-----------------------------------------------+--------+--------------------
brands    | Users can only access brands they are members | SELECT | EXISTS (SELECT 1 FROM brand_members WHERE ...)
brands    | Authenticated users can create brands         | INSERT | (no restriction)
brands    | Brand admins can update brands                | UPDATE | EXISTS (SELECT 1 FROM brand_members WHERE ... AND role IN ('owner'))
```

**Confirms**:
- RLS is enabled on `brands`
- SELECT requires brand membership
- Team isolation is enforced

---

## 6️⃣ Verify RLS Policies on `media_assets`

**Query**:
```sql
-- Check RLS policies on media_assets table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'media_assets'
ORDER BY policyname;
```

**Expected Result** (brand-scoped assets):
```
tablename     | policyname                           | cmd    | qual (USING clause)
--------------+--------------------------------------+--------+--------------------
media_assets  | Brand members can view media assets  | SELECT | EXISTS (SELECT 1 FROM brand_members WHERE brand_members.brand_id = media_assets.brand_id ...)
media_assets  | Brand members can insert media       | INSERT | EXISTS (SELECT 1 FROM brand_members WHERE ...)
media_assets  | Brand members can update media       | UPDATE | EXISTS (SELECT 1 FROM brand_members WHERE ...)
```

**Confirms**:
- Assets are scoped by `brand_id`
- Only brand members can access brand's assets
- No cross-brand leakage via RLS

---

## 7️⃣ Test Query: Franchise Behavior

**Query** (safe to run, read-only):
```sql
-- Count brands by website_url to see if duplicates exist
SELECT 
  website_url,
  COUNT(*) as brand_count,
  array_agg(name) as brand_names
FROM brands
WHERE website_url IS NOT NULL
GROUP BY website_url
HAVING COUNT(*) > 1
ORDER BY brand_count DESC
LIMIT 10;
```

**If franchise brands exist**:
```
website_url              | brand_count | brand_names
-------------------------+-------------+---------------------------
https://bahamabucks.com  | 3           | {Miami, Orlando, Atlanta}
https://example.com      | 2           | {Brand A, Brand B}
```

**If no franchise brands exist** (empty result):
- Means: No current brands share `website_url`
- Does NOT mean: System blocks it (must still verify constraints)

---

## 8️⃣ Test Query: Verify brand_id Scoping

**Query** (safe to run, read-only):
```sql
-- Verify each brand has separate assets
SELECT 
  b.name AS brand_name,
  b.website_url,
  COUNT(ma.id) AS asset_count,
  COUNT(DISTINCT ma.id) AS unique_assets
FROM brands b
LEFT JOIN media_assets ma ON ma.brand_id = b.id
WHERE ma.metadata->>'source' = 'scrape'
GROUP BY b.id, b.name, b.website_url
ORDER BY b.website_url, b.name;
```

**Expected Result** (brand-scoped):
```
brand_name           | website_url              | asset_count | unique_assets
---------------------+--------------------------+-------------+--------------
Bahama Bucks Miami   | https://bahamabucks.com  | 15          | 15
Bahama Bucks Orlando | https://bahamabucks.com  | 12          | 12
Bahama Bucks Atlanta | https://bahamabucks.com  | 18          | 18
```

**Confirms**:
- Same `website_url`, different brands, different asset counts
- No shared asset IDs across brands

---

## 📋 How to Run These Queries

### Option 1: Supabase Dashboard (SQL Editor)
1. Go to Supabase Dashboard → SQL Editor
2. Paste each query
3. Run and save results

### Option 2: psql CLI
```bash
# Connect to Supabase
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run queries
\i verify_constraints.sql
```

### Option 3: Local Supabase
```bash
# If running local Supabase via Docker
psql "postgresql://postgres:postgres@localhost:54322/postgres"
```

---

## ✅ Passing Criteria

For franchise support to be **database-proven**:

1. ✅ Query 1 returns **NO** constraint with `website_url` alone
2. ✅ Query 2 returns **NO** unique index with `website_url` alone
3. ✅ Query 3 shows `brand_id` is `UUID` in all tables
4. ✅ Query 4 shows FK constraints from `*_brand_id` → `brands.id`
5. ✅ Query 5 shows RLS policies check `brand_members`
6. ✅ Query 6 shows asset RLS policies check `brand_members.brand_id`
7. ℹ️ Query 7 (optional) shows existing franchise brands (if any)
8. ℹ️ Query 8 (optional) confirms brand-scoped assets

---

## ⚠️ Current Status

**Migration file audit**: ✅ **PASS** — No unique constraints found in migration files

**Database runtime audit**: ⚠️ **PENDING** — Queries above must be run against live database

**Recommendation**: Run queries 1-6 against your **production** or **staging** Supabase database and paste results into this document under a new section:

```markdown
## 🔍 Production Database Results (YYYY-MM-DD)

### Query 1: Unique Constraints
[paste results]

### Query 2: Indexes
[paste results]

... etc
```

---

## 📝 Notes

- **Query 7-8 are optional** — they show current data, not schema correctness
- **Service role key required** — some queries need elevated permissions
- **Safe to run** — all queries are `SELECT` only (read-only)
- **Version matters** — if you've made manual schema changes post-deployment, those won't show in migrations

---

**Document Version**: 1.0  
**Created**: 2025-12-15  
**Purpose**: Provide database-level proof beyond migration file audits

