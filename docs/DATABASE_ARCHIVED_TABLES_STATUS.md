# Archived Tables Status

**Date**: 2025-01-20  
**Reference**: MVP_DATABASE_TABLE_AUDIT_REPORT.md - Section 4.7

This document clarifies the status of tables that were found in `supabase/migrations/archived/` directory.

---

## ACTIVE Tables (Moved to Active Migrations)

### `generation_logs`
- **Status**: ✅ **ACTIVE** - Moved to `004_activate_generation_logs_table.sql`
- **Evidence**: Used in `server/routes/agents.ts` (8 references)
- **Location**: `archived/20250117_create_agent_safety_tables.sql:20`
- **Action**: ✅ Activated in migration 004

---

## DEPRECATED Tables (Not Found in Codebase)

### `prompt_templates`
- **Status**: ❌ **DEPRECATED** - Not found in codebase
- **Evidence**: No references found in `server/` directory
- **Location**: `archived/20250117_create_agent_safety_tables.sql:48`
- **Action**: Keep in archived for historical reference only

### `agent_cache`
- **Status**: ❌ **DEPRECATED** - Not found in codebase
- **Evidence**: No references found in `server/` directory
- **Location**: `archived/20250117_create_agent_safety_tables.sql:62`
- **Action**: Keep in archived for historical reference only

### `content_review_queue`
- **Status**: ❌ **DEPRECATED** - Not found in codebase
- **Evidence**: No references found in `server/` directory
- **Location**: `archived/20250117_create_agent_safety_tables.sql:77`
- **Action**: Keep in archived for historical reference only

### `monthly_content_plans`
- **Status**: ❌ **DEPRECATED** - Not found in codebase
- **Evidence**: No references found in `server/` directory
- **Location**: `archived/20250118_create_content_calendar_tables.sql:16`
- **Action**: Keep in archived for historical reference only

---

## Summary

- **Active**: 1 table (`generation_logs`) - ✅ Activated
- **Deprecated**: 4 tables - Keep in archived for historical reference

**Note**: If any of these deprecated tables are needed in the future, they can be reactivated by creating a new migration similar to `004_activate_generation_logs_table.sql`.

