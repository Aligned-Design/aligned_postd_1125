# POSTD Schema Notes

**Last Updated:** 2025-01-12  
**Purpose:** Quick reference for critical schema decisions and canonical table definitions

---

## Table of Contents

1. [Migration Authority](#migration-authority)
2. [Platform Connections (`platform_connections`)](#platform-connections-platform_connections)
3. [Known Schema Issues](#known-schema-issues)

---

## Migration Authority

**Single Source of Truth:** `supabase/migrations/001_bootstrap_schema.sql`

For complete migration guidelines, see: [`docs/MIGRATIONS_SOURCE_OF_TRUTH.md`](./MIGRATIONS_SOURCE_OF_TRUTH.md)

### "Two Migration Systems" Resolution

✅ **CONFIRMED:** The `server/migrations/` directory **DOES NOT EXIST**.

There is **NO competing migration system**. All database schema changes must be made exclusively in `supabase/migrations/`.

**Server scripts** (`server/scripts/*.ts`) that reference migrations are deployment helpers and analysis tools only—they do not define schema.

**Full Report:** [`docs/SERVER_MIGRATIONS_CLASSIFICATION.md`](./SERVER_MIGRATIONS_CLASSIFICATION.md)

**Quick Rules:**
- ✅ Use `supabase/migrations/001_bootstrap_schema.sql` for baseline schema
- ✅ Create new migrations in `supabase/migrations/` with sequential numbering
- ❌ Ignore `supabase/migrations/_legacy/` and `supabase/migrations/archived/`
- ❌ Never create schema in `server/` (server scripts are helpers only)

---

## Platform Connections (`platform_connections`)

### Canonical Schema

**Defined in:** `supabase/migrations/001_bootstrap_schema.sql` (lines 440-498)

**Last Audited:** December 12, 2025  
**Status:** ✅ Fully documented with comprehensive header

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
  is_active BOOLEAN DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'active',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  next_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  disconnected_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(brand_id, platform, account_id)
);
```

### Key Columns

| Column             | Type                        | Required | Notes                                                  |
|--------------------|-----------------------------|----------|--------------------------------------------------------|
| `id`               | UUID                        | ✅       | Primary key                                            |
| `brand_id`         | UUID                        | ✅       | References `brands(id)`, CASCADE on delete             |
| `platform`         | VARCHAR(50)                 | ✅       | e.g., 'instagram', 'facebook', 'linkedin', 'twitter'   |
| `account_id`       | VARCHAR(255)                | ✅       | Platform-specific account identifier                   |
| `account_name`     | VARCHAR(255)                | ❌       | Display name for the connected account                 |
| `access_token`     | TEXT                        | ✅       | OAuth access token (encrypted in production)           |
| `refresh_token`    | TEXT                        | ❌       | OAuth refresh token                                    |
| `expires_at`       | TIMESTAMP WITH TIME ZONE    | ❌       | Token expiration timestamp                             |
| `is_active`        | BOOLEAN                     | ✅       | **REQUIRED** - Still actively used by code! (not legacy) |
| `status`           | TEXT                        | ✅       | **REQUIRED** - Granular connection state (see values below) |
| `last_sync_at`     | TIMESTAMP WITH TIME ZONE    | ❌       | Last successful sync timestamp                         |
| `next_sync_at`     | TIMESTAMP WITH TIME ZONE    | ❌       | Scheduled next sync timestamp                          |
| `created_at`       | TIMESTAMP WITH TIME ZONE    | ❌       | Auto-populated                                         |
| `updated_at`       | TIMESTAMP WITH TIME ZONE    | ❌       | Auto-updated by trigger                                |
| `disconnected_at`  | TIMESTAMP WITH TIME ZONE    | ❌       | When user disconnected the account                     |

**⚠️ CRITICAL UPDATE:** Both `is_active` AND `status` are REQUIRED!
- Previous documentation incorrectly marked `is_active` as legacy
- Code analysis shows BOTH columns are actively used together
- Do NOT remove either column without updating code first

### Status Values

| Status Value    | Meaning                                | `is_active` Value | Usage |
|----------------|----------------------------------------|-------------------|-------|
| `active`       | Connection is valid and operational    | `TRUE`            | Default state |
| `connected`    | Alias for `active` (some services use) | `TRUE`            | Same as active |
| `disconnected` | User manually disconnected             | `FALSE`           | User action |
| `expired`      | OAuth token has expired                | `FALSE`           | Needs refresh |
| `revoked`      | Platform revoked the token             | `FALSE`           | Re-auth required |

**Code Pattern:** Services set BOTH columns together:
```typescript
// Creating connection
{ status: "active", is_active: true }

// Disconnecting
{ status: "disconnected", is_active: false }

// Querying active connections
.eq("status", "active").eq("is_active", true)
```

### Code Dependencies

**Services that use `platform_connections` table:**

**1. `server/lib/connections-db-service.ts` (PRIMARY)**
- **29 references** to status/is_active
- **Usage pattern:** Sets AND queries BOTH columns together
- **Example operations:**
  - Create: `status: "active", is_active: true`
  - Query active: `.eq("status", "active").eq("is_active", true)`
  - Disconnect: `status: "disconnected", is_active: false`
  - Update status: Updates BOTH columns in sync
- **Key methods:**
  - `upsertConnection()` - Sets both columns
  - `getActivePlatforms()` - Filters by both columns
  - `updateConnectionStatus()` - Updates both columns
  - `disconnectPlatform()` - Sets both to inactive states
  
**2. `server/lib/integrations-db-service.ts` (SECONDARY)**
- **16 references** to status column
- **Interface mapping:**
  - `platform` ↔ `provider` (naming difference)
  - `account_name` ↔ `account_username` (naming difference)
  - `expires_at` ↔ `token_expires_at` (naming difference)
- **Key methods:**
  - `createConnection()` - Sets `status: "connected"`
  - `updateConnection()` - Can update status
  - `disconnectIntegration()` - Sets `status: "disconnected"`

### Unique Constraint

```sql
UNIQUE(brand_id, platform, account_id)
```

**Ensures:** One connection per (brand, platform, account) tuple  
**Prevents:** Duplicate connections for same account

---

## Known Schema Issues

### 1. Duplicate `platform_connections` Definitions (✅ RESOLVED)

**Issue:** Multiple conflicting definitions existed across migrations

**Definitions Found:**
1. **CANONICAL:** `001_bootstrap_schema.sql` (lines 440-498)
   - ✅ Has BOTH `is_active` AND `status` columns
   - ✅ Comprehensive 57-line documentation header
   - ✅ Required by current code

2. **DEPRECATED:** `_legacy/005_integrations.sql` (line 15)
   - ❌ Missing `status` column (only has `is_active`)
   - ❌ Would cause runtime errors if used
   - ✅ Marked with prominent deprecation warning

3. **BRIDGE:** `_legacy/012_canonical_schema_alignment.sql` (line 268)
   - Adds `status` column via ALTER TABLE
   - For databases created from legacy 005 migration
   - Not needed if using 001_bootstrap_schema.sql

4. **ARCHIVED:** `archived/20250119_create_integrations_tables.sql` (line 5)
   - Old definition, do not use
   - Kept for historical reference only

**Resolution:**
- ✅ Canonical schema documented in `001_bootstrap_schema.sql` with full header
- ✅ Legacy migration `005_integrations.sql` updated with detailed deprecation warning
- ✅ Both `is_active` AND `status` columns confirmed as required by code
- ✅ Migration authority established (Supabase SQL only)

**Evidence:**
- Code analysis: 45+ references to status/is_active across 2 services
- Both columns used together in all operations
- Removing either column would break production code

**References:**
- [`docs/MIGRATIONS_SOURCE_OF_TRUTH.md`](./MIGRATIONS_SOURCE_OF_TRUTH.md) - Updated with correct line numbers
- `server/lib/connections-db-service.ts` - Primary code dependency
- `server/lib/integrations-db-service.ts` - Secondary code dependency

### 2. Multiple Asset Tables (✅ BEING ADDRESSED)

**Tables:**
- `media_assets` - 139 refs (CANONICAL)
- `brand_assets` - 0 refs (DROP in Phase 1C)
- `assets` - 11 refs (CONSOLIDATE to media_assets in Phase 2)

**Status:** Migration plan created
- **Phase 1C:** Drop `brand_assets` (zero usage)
- **Phase 2:** Consolidate `assets` → `media_assets`
- **See:** `docs/SCHEMA_CLEANUP_DECISION_MATRIX.md`

### 3. Content Table Bug (✅ FIXED)

**Issue:** `content` table queried but didn't exist in schema

**Tables:**
- `content_items` - 90 refs (CANONICAL) ✅
- `content` - 13 refs (BUG - table doesn't exist) 🔴

**Resolution:**
- ✅ Fixed all 13 queries in `server/lib/client-portal-db-service.ts`
- ✅ Changed `.from("content")` → `.from("content_items")`
- ✅ Updated interface to match actual schema
- **Status:** FIXED, ready for testing

### 4. Unused Tables (✅ MIGRATION PLAN CREATED)

**21 tables flagged for deletion:**

**Phase 1A** (3 tables):
- `user_profiles`, `user_preferences`, `approval_threads`
- **Migration:** `007_drop_unused_tables_phase_1a.sql` ✅

**Phase 1B** (6 tables):
- Persistence schema tables (all unused)
- **Migration:** `008_drop_unused_tables_phase_1b.sql` ✅

**Phase 1C** (12 tables):
- Webhooks, sync logs, `brand_assets`, payments
- **Migration:** `009_drop_unused_tables_phase_1c.sql` ✅

**Status:** All migrations created and tested  
**See:** `docs/SCHEMA_CLEANUP_IMPLEMENTATION_SUMMARY.md`

### 5. Migration 006: Destructive brand_id TEXT Cleanup (GATED)

⚠️ **CRITICAL: This migration is DESTRUCTIVE and GATED**

**Migration File:** `supabase/migrations/006_drop_legacy_brand_id_text_columns.sql`

**What It Does:**
- Permanently **drops** legacy `brand_id TEXT` columns from 10 persistence schema tables
- Drops 10 indexes on `brand_id TEXT` columns
- Drops `is_brand_member_text()` helper function
- **IRREVERSIBLE** - requires full database restore to rollback

**Why It's Destructive:**
- Once executed, the `brand_id TEXT` columns are **permanently deleted**
- No automatic rollback mechanism exists
- If migration fails mid-execution, only a full database restore can recover

**Affected Tables (10):**
1. `strategy_briefs`
2. `content_packages`
3. `brand_history`
4. `brand_success_patterns`
5. `collaboration_logs`
6. `performance_logs`
7. `platform_insights`
8. `token_health`
9. `weekly_summaries`
10. `advisor_review_audits`

**Status:** ⚠️ **GATED - DO NOT RUN WITHOUT APPROVAL**

**Preconditions Checklist:** [`docs/MIGRATION_006_PRECONDITIONS_CHECKLIST.md`](./MIGRATION_006_PRECONDITIONS_CHECKLIST.md)

**Must Be Satisfied Before Running:**
- ✅ Migrations 003, 005, 010 applied successfully
- ✅ All `brand_id_uuid` columns populated
- ✅ All RLS policies use `brand_id_uuid` (not `brand_id` TEXT)
- ✅ All application code uses `brand_id_uuid` (not `brand_id` TEXT)
- ✅ All tests pass with UUID-based schema
- ✅ Full database backup created
- ✅ Rollback plan documented
- ✅ Sign-off from DBA, Backend Lead, and CTO

**Current Code Status (as of 2025-01-12):**
- ✅ No server code references legacy `brand_id TEXT` columns in persistence tables
- ✅ `persistence-service.ts` uses in-memory store (DB operations disabled)
- ✅ `advisor-event-logger.ts` uses event logger abstraction (no direct queries)
- ✅ Template string replacements (`{{brand_id}}`) are NOT database columns

**See Also:**
- [`docs/MIGRATION_006_PRECONDITIONS_CHECKLIST.md`](./MIGRATION_006_PRECONDITIONS_CHECKLIST.md) - Complete checklist
- `supabase/migrations/006_drop_legacy_brand_id_text_columns.sql` - Migration file with safety checks

---

## Quick Reference: Where to Find Things

| Need to...                          | Look here...                                                     |
|-------------------------------------|------------------------------------------------------------------|
| Check canonical schema              | `supabase/migrations/001_bootstrap_schema.sql`                   |
| Understand migration rules          | [`docs/MIGRATIONS_SOURCE_OF_TRUTH.md`](./MIGRATIONS_SOURCE_OF_TRUTH.md) |
| See server migrations classification | [`docs/SERVER_MIGRATIONS_CLASSIFICATION.md`](./SERVER_MIGRATIONS_CLASSIFICATION.md) |
| Check Migration 006 preconditions   | [`docs/MIGRATION_006_PRECONDITIONS_CHECKLIST.md`](./MIGRATION_006_PRECONDITIONS_CHECKLIST.md) |
| See tables flagged for deletion     | [`SCHEMA_DELETE_LIST.md`](../SCHEMA_DELETE_LIST.md)             |
| See RLS policies                    | `supabase/migrations/001_bootstrap_schema.sql` (end of file)     |
| See connection service logic        | `server/lib/connections-db-service.ts`                           |
| See integration service logic       | `server/lib/integrations-db-service.ts`                          |

---

**For detailed migration authority and rules, always consult [`docs/MIGRATIONS_SOURCE_OF_TRUTH.md`](./MIGRATIONS_SOURCE_OF_TRUTH.md).**

