# Server Migrations Classification Report

**Date:** 2025-01-12  
**Purpose:** Resolve "two migration systems" confusion by classifying server-side migration files

---

## Executive Summary

✅ **GOOD NEWS:** The `server/migrations/` directory **DOES NOT EXIST** in the POSTD repository.

There is **NO duplicate migration system** at the file-system level. All database schema is managed through **Supabase SQL migrations** in `supabase/migrations/`.

However, several **server scripts** reference or interact with migrations. These have been classified below.

---

## File Inventory and Classification

### Directory Status

| Directory Path         | Status                  | Notes                                   |
|------------------------|-------------------------|-----------------------------------------|
| `supabase/migrations/` | ✅ **AUTHORITATIVE**    | Single source of truth for schema       |
| `server/migrations/`   | ❌ **DOES NOT EXIST**   | Never created; no conflict              |

### Server Scripts That Reference Migrations

The following files in `server/scripts/` interact with migrations but **DO NOT define schema**:

#### 1. `server/scripts/deploy-db-schema.ts`

**Classification:** ✅ **NON-SCHEMA / SAFE**

**Purpose:** 
- Deployment helper script
- Pushes Supabase migrations to remote database using `supabase db push`
- References: `supabase/migrations/20241111_api_connector_schema.sql`

**Schema Impact:** None (reads and deploys existing Supabase migrations)

**Status:** Safe to keep; assists with deployment workflow

---

#### 2. `server/scripts/extract-complete-schema.ts`

**Classification:** ✅ **NON-SCHEMA / SAFE**

**Purpose:** 
- Schema analysis and reporting tool
- Scans both `server/migrations` and `supabase/migrations` for CREATE/ALTER statements
- Cross-references SQL schema with TypeScript types and code usage
- Generates `SCHEMA_EXTRACTION_REPORT.md`

**Schema Impact:** None (read-only analysis tool)

**Status:** Safe to keep; useful for auditing and documentation

**Note:** Lines 35-38 reference `server/migrations` as a potential migration directory, but since the directory doesn't exist, this has no effect.

---

#### 3. `server/scripts/apply-content-drafts-migration.ts`

**Classification:** ✅ **NON-SCHEMA / SAFE**

**Purpose:** 
- Helper script to guide manual application of a Supabase migration
- Checks if `content_drafts` table exists
- Displays SQL from `supabase/migrations/017_create_content_drafts.sql` for copy-paste

**Schema Impact:** None (instructs user to manually run Supabase migration)

**Status:** Safe to keep; assists with manual migration application

---

#### 4. `server/scripts/create-health-dashboard.sql`

**Classification:** ⚠️ **NON-SCHEMA / SAFE (but misplaced)**

**Purpose:** 
- Creates 8 database VIEWs for API health monitoring
- Creates indexes for performance
- Grants SELECT permissions

**Schema Impact:** 
- Creates views (not tables)
- Views are **derived schema** (not base schema)
- Should ideally be in `supabase/migrations/` for consistency

**Status:** 
- ✅ Safe to keep in current location (does not conflict with Supabase migrations)
- 💡 **RECOMMENDATION:** Consider moving to `supabase/migrations/` as a numbered migration file (e.g., `002_api_health_dashboard_views.sql`) for better tracking

**Tables Referenced (must exist in base schema):**
- `connections`
- `connector_platforms`
- `publish_jobs`
- `publish_job_errors`
- `connection_health_log`
- `publish_job_analytics`

---

### Server Scripts Referencing `supabase/migrations` in Code

| Script                                  | References To                             | Impact     |
|-----------------------------------------|-------------------------------------------|------------|
| `stack-activation-audit.ts`             | Checks existence of `supabase/migrations` | Read-only  |

---

## Key Findings

### 1. No Duplicate Migration System

✅ **Confirmed:** There is no `server/migrations/` directory competing with `supabase/migrations/`.

### 2. Server Scripts Are Helpers, Not Schema Definers

✅ **Confirmed:** All server scripts that reference migrations are:
- Deployment helpers (`deploy-db-schema.ts`)
- Analysis tools (`extract-complete-schema.ts`)
- Manual migration guides (`apply-content-drafts-migration.ts`)

None of these scripts **define or alter** base table schema directly.

### 3. One SQL File in `server/scripts/`

⚠️ **`create-health-dashboard.sql`** creates VIEWs (not tables). While safe, it should ideally be tracked in `supabase/migrations/` for consistency.

---

## Recommendations

### Immediate Actions (None Required)

✅ No immediate action needed. The repository already follows best practices:
- Single migration authority: `supabase/migrations/`
- No conflicting server-side migrations

### Future Enhancements (Optional)

1. **Move `create-health-dashboard.sql` to Supabase migrations:**
   ```bash
   mv server/scripts/create-health-dashboard.sql supabase/migrations/002_api_health_dashboard_views.sql
   ```
   - Update `deploy-db-schema.ts` if it references this file
   - This ensures views are version-controlled alongside tables

2. **Update `extract-complete-schema.ts`:**
   - Remove `'server/migrations'` from `MIGRATION_DIRS` array (line 36)
   - It's harmless (directory doesn't exist), but cleaner to remove

---

## Conclusion

✅ **The "two migration systems" problem does not exist in POSTD.**

- **Supabase SQL migrations** are the sole source of database schema truth
- **Server scripts** only assist with deployment, analysis, and guidance
- **No deprecation markings** are needed because there are no conflicting server migrations to deprecate

**Status:** Migration authority is already clean and unambiguous.

---

## Related Documentation

- [MIGRATIONS_SOURCE_OF_TRUTH.md](./MIGRATIONS_SOURCE_OF_TRUTH.md) - Migration authority and rules
- [POSTD_SCHEMA_NOTES.md](./POSTD_SCHEMA_NOTES.md) - Schema quick reference
- [SCHEMA_DELETE_LIST.md](../SCHEMA_DELETE_LIST.md) - Tables flagged for cleanup

---

**This classification resolves the "two migration systems" audit requirement.**

