# POSTD Migrations: Source of Truth

**Last Updated:** 2025-01-12  
**Status:** Active  
**Audit Status:** ✅ "Two Migration Systems" Issue Resolved

---

## Migration Authority

### Single Source of Truth: Supabase SQL Migrations

**All database schema for POSTD is canonically defined in:**

```
supabase/migrations/
```

**Primary Migration File:**

```
supabase/migrations/001_bootstrap_schema.sql
```

This file contains the complete, authoritative schema for a brand-new POSTD database.

---

## Resolution: "Two Migration Systems" Confusion

### Issue Background

Previous audits flagged potential confusion about whether schema is managed through:
1. Supabase SQL migrations (`supabase/migrations/`), or
2. Server-side migrations (`server/migrations/`)

### Resolution Status: ✅ RESOLVED

**Finding:** The `server/migrations/` directory **DOES NOT EXIST** in the POSTD repository.

There is **NO competing migration system**. All database schema is managed exclusively through **Supabase SQL migrations**.

**Evidence:**
- File system scan confirms `server/migrations/` does not exist
- All CREATE TABLE and ALTER TABLE statements are in `supabase/migrations/`
- Server scripts that reference migrations are deployment helpers, not schema definers

**Full Classification Report:** See [`docs/SERVER_MIGRATIONS_CLASSIFICATION.md`](./SERVER_MIGRATIONS_CLASSIFICATION.md)

---

## Non-Canonical Migration Locations

### Legacy Supabase Migrations (Deprecated)

The following directories contain **DEPRECATED** migration files that **MUST NOT** be applied:

```
supabase/migrations/_legacy/
supabase/migrations/archived/
```

**Important:**
- These files are retained for historical reference only
- They contain conflicting or incomplete table definitions
- Applying them to production will cause schema conflicts
- New engineers should ignore these directories

### Server Scripts (Non-Schema)

The following server scripts interact with migrations but **DO NOT define schema**:

```
server/scripts/deploy-db-schema.ts          (deployment helper)
server/scripts/extract-complete-schema.ts   (analysis tool)
server/scripts/apply-content-drafts-migration.ts (manual guide)
server/scripts/create-health-dashboard.sql  (VIEW definitions only)
```

**Classification:** ✅ All are NON-SCHEMA / SAFE

**See:** [`docs/SERVER_MIGRATIONS_CLASSIFICATION.md`](./SERVER_MIGRATIONS_CLASSIFICATION.md) for detailed analysis

---

## Platform Connections Table (`platform_connections`)

### Canonical Definition

**Location:** `supabase/migrations/001_bootstrap_schema.sql` (lines 440-498)

**Status:** ✅ Fully Documented (comprehensive header added)

**Authoritative Schema:**
```sql
CREATE TABLE IF NOT EXISTS platform_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  account_id VARCHAR(255) NOT NULL,
  account_name VARCHAR(255),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,                      -- ✅ LEGACY (still used by code)
  status TEXT NOT NULL DEFAULT 'active',               -- ✅ REQUIRED (granular states)
  last_sync_at TIMESTAMP WITH TIME ZONE,
  next_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  disconnected_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(brand_id, platform, account_id)
);
```

**⚠️ CRITICAL: Both `is_active` AND `status` columns are REQUIRED!**
- Code uses BOTH columns (see server/lib/connections-db-service.ts)
- `is_active`: Boolean flag for quick active/inactive checks
- `status`: Text field for granular connection states

### Conflicting Legacy Definitions (DEPRECATED)

**DO NOT USE:**

1. **`supabase/migrations/_legacy/005_integrations.sql`**
   - Missing `status` column
   - Marked as `DEPRECATED` with warning comment
   - Will cause runtime errors if used

2. **`supabase/migrations/_legacy/012_canonical_schema_alignment.sql`**
   - Attempts to add `status` via `ALTER TABLE`
   - Inconsistent with bootstrap schema
   - Not needed if 001_bootstrap_schema.sql is used

### Code Dependencies

The following services **require BOTH** `is_active` AND `status` columns:

- `server/lib/connections-db-service.ts` (29 references)
  - Sets BOTH: `status: "active"` AND `is_active: true` on create
  - Queries by BOTH: `.eq("status", "active").eq("is_active", true)` for active connections
  - Updates BOTH when changing connection state
  - Uses `status` values: 'active', 'connected', 'expired', 'revoked', 'disconnected'
  
- `server/lib/integrations-db-service.ts` (16 references)
  - Sets `status: "connected"` on connection create
  - Updates `status: "disconnected"` on disconnect
  - Filters connections by `status: "connected"`

**If EITHER column is missing, these services will throw database errors.**

**Evidence:**
- Grep search shows 45+ references across both services
- Code pattern: Sets/checks BOTH columns together
- Line examples: connections-db-service.ts lines 72-73, 159-160, 233-234

---

## Migration Management Guidelines

### For New Databases

1. Run `supabase/migrations/001_bootstrap_schema.sql` only
2. Do **NOT** run any migrations from `_legacy/` or `archived/`

### For Existing Databases

1. Verify current schema matches `001_bootstrap_schema.sql`
2. If misaligned, create a forward migration to reconcile
3. Do **NOT** re-run legacy migrations

### For New Features

1. Create new migrations in `supabase/migrations/` with sequential numbering:
   ```
   002_feature_name.sql
   003_another_feature.sql
   ```
2. Never modify `001_bootstrap_schema.sql` (it is the baseline)
3. Test migrations on a local Supabase instance before deploying

---

## Platform Connection Status Values

### Canonical Status Values

| Status Value    | Meaning                                   | `is_active` |
|----------------|-------------------------------------------|-------------|
| `active`       | Connection is valid and operational       | `TRUE`      |
| `connected`    | Alias for `active` (used by some services)| `TRUE`      |
| `disconnected` | User manually disconnected                | `FALSE`     |
| `expired`      | OAuth token has expired                   | `FALSE`     |
| `revoked`      | OAuth token was revoked by platform       | `FALSE`     |

### Migration Note

- ~~`is_active` is **LEGACY**~~ **CORRECTION:** Both columns are actively used!
- Code uses BOTH `is_active` AND `status` together
- Do NOT remove either column - both are required by current code
- Future: Consider migrating fully to `status` only (requires code changes)

---

## Summary

| Aspect                  | Canonical Source                                      |
|-------------------------|-------------------------------------------------------|
| **Migration Authority** | `supabase/migrations/` (Supabase SQL files)           |
| **Baseline Schema**     | `supabase/migrations/001_bootstrap_schema.sql`        |
| **`platform_connections`** | Defined in `001_bootstrap_schema.sql` (lines 440-498) |
| **Required Columns**    | Must include BOTH `is_active` BOOLEAN AND `status` TEXT  |
| **Deprecated Paths**    | `_legacy/`, `archived/`, (server/migrations/ doesn't exist) |

---

**For questions or schema changes, consult this document first.**

