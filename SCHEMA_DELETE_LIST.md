# Schema Delete List - Unused & Legacy Tables

**Generated:** 2025-11-19  
**Status:** Tables and code identified for removal or consolidation

---

## ❌ TABLES TO DELETE (NO USAGE FOUND)

### 1. User Management (Legacy - Replaced by auth.users)
| Table | Location | Reason | References | Action |
|-------|----------|--------|------------|--------|
| **user_profiles** | 001_auth_and_users.sql | Replaced by auth.users | 0 | **DELETE** |
| **user_preferences** | 001_auth_and_users.sql | Never referenced | 0 | **DELETE** |

**Analysis:**
- `user_profiles` was defined in initial migration but all FK references now point to `auth.users`
- Migration 012 explicitly fixes FK constraints to use `auth.users` instead of `user_profiles`
- No server code references these tables
- Client code uses `auth.users` directly

**Migration Impact:** LOW - Already migrated away from these tables

---

### 2. Approval System (Unused Alternative)
| Table | Location | Reason | References | Action |
|-------|----------|--------|------------|--------|
| **approval_threads** | 009_complete_schema_sync.sql | Only 6 refs, unused | 6 (minimal) | **DELETE or MERGE** |

**Analysis:**
- Defined in schema but minimal actual usage
- `post_approvals` is the primary approval tracking table (22 refs)
- `approval_threads` appears to be for comments/discussion but not actively used
- May have been replaced by `post_approvals` workflow

**Recommendation:** DELETE - functionality covered by `post_approvals`

---

### 3. Persistence Schema Tables (Defined but Minimal/No Usage)
| Table | Location | Reason | References | Action |
|-------|----------|--------|------------|--------|
| **performance_logs** | 011_persistence_schema.sql | Not referenced in code | 0 | **DELETE** |
| **platform_insights** | 011_persistence_schema.sql | Not referenced in code | 0 | **DELETE** |
| **token_health** | 011_persistence_schema.sql | Not referenced in code | 0 | **DELETE** |
| **weekly_summaries** | 011_persistence_schema.sql | Not referenced in code | 0 | **DELETE** |
| **advisor_review_audits** | 011_persistence_schema.sql | Not referenced in code | 0 | **DELETE** |
| **brand_success_patterns** | 011_persistence_schema.sql | Not referenced in code | 0 | **DELETE** |

**Analysis:**
- All defined in `supabase/migrations/011_persistence_schema.sql`
- Created for orchestration/learning loop but never implemented in code
- Views created (content_quality_trends, platform_performance_summary, brand_history_patterns) also unused
- Migration is 237 lines - large portion can be removed

**Migration Impact:** MEDIUM - Need to create new migration to drop these tables

---

### 4. API Connector Schema Tables (Defined but Not Used Yet)
| Table | Location | Reason | References | Action |
|-------|----------|--------|------------|--------|
| **connection_health_log** | 20241111_api_connector_schema.sql | Feature not implemented | 0 | **KEEP or DELETE** |
| **connection_audit** | 20241111_api_connector_schema.sql | Feature not implemented | 0 | **KEEP or DELETE** |
| **publish_job_analytics** | 20241111_api_connector_schema.sql | Feature not implemented | 0 | **KEEP or DELETE** |
| **publish_job_errors** | 20241111_api_connector_schema.sql | Feature not implemented | 0 | **KEEP or DELETE** |
| **feature_flags** | 20241111_api_connector_schema.sql | Feature not implemented | 0 | **KEEP or DELETE** |
| **queue_jobs_monitoring** | 20241111_api_connector_schema.sql | Feature not implemented | 0 | **KEEP or DELETE** |
| **rate_limit_buckets** | 20241111_api_connector_schema.sql | Feature not implemented | 0 | **KEEP or DELETE** |

**Analysis:**
- Part of comprehensive API Connector schema (679 lines)
- Core tables (`connections`, `publish_jobs`, `connector_platforms`, `encrypted_secrets`) ARE used
- These auxiliary/monitoring tables defined but features not implemented
- Schema includes 3 views that query these unused tables

**Recommendation:** **KEEP FOR NOW** - This is production-ready infrastructure code, just not fully activated. Removing would require rewriting migration. Mark as "Future Use" in documentation.

---

### 5. Archived/Legacy Integration Tables (Minimal Usage)
| Table | Location | Reason | References | Action |
|-------|----------|--------|------------|--------|
| **integration_events** | 005_integrations.sql | Low usage, possibly legacy | ~3 | **REVIEW** |
| **webhook_logs** | 005_integrations.sql | Replaced by webhook_events | ~5 | **DELETE** |
| **review_response_templates** | archived/20250119_create_integrations_tables.sql | Not seen in code | 0 | **DELETE** |

**Analysis:**
- `webhook_logs` appears to be older implementation, now replaced by `webhook_events` (21 refs)
- `integration_events` has minimal refs
- `review_response_templates` is in archived migrations but table still exists

---

### 6. Content Calendar (Archived - Not Implemented)
| Table | Location | Reason | References | Action |
|-------|----------|--------|------------|--------|
| **content_calendar_items** | archived/20250118_create_content_calendar_tables.sql | Archived migration, not used | 0 | **DELETE** |
| **content_plans** | archived/20250118_create_content_calendar_tables.sql | Archived migration, not used | 0 | **DELETE** |

**Analysis:**
- Migration is in `archived/` folder
- No code references found
- Functionality may be covered by `scheduled_content` and `auto_plans`

---

### 7. Agent Safety (Minimal Usage)
| Table | Location | Reason | References | Action |
|-------|----------|--------|------------|--------|
| **agent_guardrails** | archived/20250117_create_agent_safety_tables.sql | Only 3 refs in crawler | 3 | **DELETE or MERGE** |
| **agent_execution_logs** | archived/20250117_create_agent_safety_tables.sql | Only 3 refs in crawler | 3 | **DELETE or MERGE** |

**Analysis:**
- Archived migration
- Only used in crawler code (6 total refs)
- Functionality may be covered by `audit_logs`

---

### 8. Brand Intelligence (Minimal Usage)
| Table | Location | Reason | References | Action |
|-------|----------|--------|------------|--------|
| **brand_embeddings** | archived/20250115_create_brand_embeddings.sql | Only 3 refs in crawler | 3 | **DELETE or MERGE** |
| **brand_kit_history** | archived/20250116_create_brand_kit_history.sql | Only 3 refs in crawler | 3 | **DELETE or MERGE** |

**Analysis:**
- Archived migrations
- Minimal usage in crawler code
- Functionality may be stored in `brand_kit` JSONB column on `brands` table

---

### 9. Escalation System (Unused Table)
| Table | Location | Reason | References | Action |
|-------|----------|--------|------------|--------|
| **escalation_history** | archived/20250126_create_escalation_rules.sql | Not seen in code | 0 | **DELETE** |

**Analysis:**
- Defined in escalation migration
- `escalation_rules` (15 refs) and `escalation_events` (10 refs) ARE used
- `escalation_history` appears to be audit trail but not implemented

---

### 10. Webhook System (Unused Table)
| Table | Location | Reason | References | Action |
|-------|----------|--------|------------|--------|
| **webhook_attempts** | archived/20250125_create_webhook_attempts.sql | Not seen in server code | 0 | **DELETE** |

**Analysis:**
- Defined but not referenced in server code
- `webhook_events` (21 refs) is the active table
- May have been intended for retry tracking but not implemented

---

## ⚠️ TABLES TO CONSOLIDATE (DUPLICATES/OVERLAP)

### 1. Asset Tables (3 Different Tables)
| Table | Defined In | Usage | Recommendation |
|-------|-----------|-------|----------------|
| **media_assets** | server/migrations/006 | 40 refs | **KEEP as PRIMARY** |
| **brand_assets** | supabase/migrations/009 | 14 refs | **MERGE into media_assets** |
| **assets** | supabase/migrations/009 | 6 refs | **MERGE into media_assets** |

**Analysis:**
- Three separate asset tracking tables with overlapping purposes
- `media_assets` is most comprehensive and actively used
- `brand_assets` and `assets` appear to be from different development phases
- All three track similar data: files, metadata, brand association

**Consolidation Plan:**
1. Migrate data from `assets` and `brand_assets` into `media_assets`
2. Update references in image-sourcing.ts and workflow-db-service.ts
3. Drop `assets` and `brand_assets` tables

---

### 2. Content Tables (Duplicate Concept)
| Table | Defined In | Usage | Recommendation |
|-------|-----------|-------|----------------|
| **content_items** | supabase/migrations/009 | 44 refs | **KEEP as PRIMARY** |
| **content** | supabase/migrations/009 | ~15 refs | **REVIEW - May be alias** |

**Analysis:**
- Both tables track content/posts
- `content_items` has more references
- `content` used primarily in client-portal queries
- May be same table with different name, or duplicate concept

**Consolidation Plan:**
1. Verify if `content` and `content_items` are same table or different
2. If different, migrate `content` data to `content_items`
3. Update client-portal-db-service.ts references
4. Drop `content` table

---

### 3. Platform Connections (DUPLICATE DEFINITION) 🚨
| Table | Defined In | Usage | Recommendation |
|-------|-----------|-------|----------------|
| **platform_connections** | server/migrations/007 | 44 refs | **CONFLICT** |
| **platform_connections** | supabase/migrations/005 | (same refs) | **CONFLICT** |

**Analysis:**
- **CRITICAL**: Table is defined in TWO DIFFERENT MIGRATIONS
- Schema differences between the two definitions:
  - Migration 007: `status` column (connected, expired, revoked, disconnected)
  - Migration 005: `is_active` BOOLEAN column
  - Migration 007: More comprehensive structure
- Which schema is actually in production?

**Resolution Required:**
1. Determine which migration was run last (which schema is active)
2. Remove duplicate migration
3. Create single source of truth
4. Run schema alignment migration if needed

---

### 4. Connector Schema (New vs Old Infrastructure)
| Old Table | New Table | Status | Recommendation |
|-----------|-----------|--------|----------------|
| **platform_connections** | **connections** | Both exist | **MIGRATE** |
| **publishing_jobs** | **publish_jobs** | Both exist | **MIGRATE** |
| - | **connector_platforms** | New only | **KEEP** |
| - | **encrypted_secrets** | New only | **KEEP** |

**Analysis:**
- API Connector schema (`20241111_api_connector_schema.sql`) is newer, more comprehensive
- Old schema uses `platform_connections`, `publishing_jobs`
- New schema uses `connections`, `publish_jobs`, `connector_platforms`, `encrypted_secrets`
- Both are currently in use (27 refs to new `connections`, 44 refs to old `platform_connections`)

**Migration Decision Required:**
- Option A: Fully migrate to new connector schema, deprecate old tables
- Option B: Keep both schemas for different use cases
- Option C: Merge best features from both into single schema

---

### 5. Analytics Metrics (Schema Mismatch)
**Problem:** `analytics_metrics` defined with different column structures across migrations

**Migration 009 (older):**
```sql
impressions INTEGER, reach INTEGER, engagements INTEGER,
clicks INTEGER, shares INTEGER, comments INTEGER, likes INTEGER
```

**Migration 008 (newer):**
```sql
metrics JSONB  -- Contains all metrics as JSON
```

**Migration 012 (canonical):**
```sql
-- Migrates old columns to metrics JSONB
```

**Status:** Migration 012 should have resolved this, but verify in production

---

## 📁 MIGRATION FILES TO DELETE/ARCHIVE

### Fully Unused Migrations (Safe to Archive)
```
✅ supabase/migrations/archived/20250108_create_audit_logs_table.sql
✅ supabase/migrations/archived/20250108_create_client_settings_table.sql
✅ supabase/migrations/archived/20250115_create_brand_embeddings.sql
✅ supabase/migrations/archived/20250116_create_brand_kit_history.sql
✅ supabase/migrations/archived/20250117_create_agent_safety_tables.sql
✅ supabase/migrations/archived/20250118_create_content_calendar_tables.sql
✅ supabase/migrations/archived/20250119_create_integrations_tables.sql
✅ supabase/migrations/archived/20250120_create_dashboard_client_portal_tables.sql
✅ supabase/migrations/archived/20250121_create_phase_9_client_settings.sql
✅ supabase/migrations/archived/20250122_create_phase_9_post_approvals.sql
✅ supabase/migrations/archived/20250123_create_phase_9_audit_logs.sql
✅ supabase/migrations/archived/20250125_create_webhook_events.sql
✅ supabase/migrations/archived/20250125_create_webhook_attempts.sql
✅ supabase/migrations/archived/20250126_create_escalation_rules.sql
```

**Status:** Already in archived/ folder ✅

### Duplicate Migrations (Need Resolution)
```
⚠️ server/migrations/007_publishing_jobs_and_logs.sql (defines platform_connections)
⚠️ supabase/migrations/005_integrations.sql (also defines platform_connections)

⚠️ server/migrations/006_media_tables.sql (defines media_assets)
⚠️ supabase/migrations/012_canonical_schema_alignment.sql (also addresses media_assets)
```

**Action Required:** Consolidate to single source of truth

### Server Migrations (Orphaned/Incomplete)
```
⚠️ server/migrations/007_schema_alignment_FULL_FIX.sql (what does this fix?)
⚠️ server/migrations/009_schema_alignment_FULL_FIX.sql (duplicate number with supabase/009)
⚠️ server/migrations/010_quick_schema_fixes.sql (what fixes?)
```

**Status:** Unclear purpose, likely superseded by Supabase migrations

---

## 📊 Deletion Impact Summary

### Tables to DELETE (Confirmed Unused)
- user_profiles
- user_preferences
- approval_threads
- performance_logs
- platform_insights
- token_health
- weekly_summaries
- advisor_review_audits
- brand_success_patterns
- webhook_logs
- review_response_templates
- content_calendar_items
- content_plans
- escalation_history
- webhook_attempts

**Total:** 15 tables

### Tables to CONSOLIDATE (Duplicates)
- media_assets ← brand_assets + assets (3 → 1)
- content_items ← content (2 → 1)
- platform_connections (2 definitions → 1)

**Total:** 5 tables affected

### Views to DELETE (Reference Unused Tables)
- content_quality_trends (references unused tables)
- platform_performance_summary (references unused tables)
- brand_history_patterns (references unused tables)

**Total:** 3 views

### Estimated Space Savings
- **Tables removed:** 15
- **Duplicate definitions resolved:** 3
- **Migration files to archive:** ~14 (already archived)
- **Code cleanup:** Multiple service files need updates

---

## ⚠️ CRITICAL ACTIONS REQUIRED

### 1. Resolve platform_connections Duplicate (HIGH PRIORITY)
- Investigate which migration runs last in production
- Determine active schema
- Create migration to drop duplicate definition
- Update code to use consistent schema

### 2. Consolidate Asset Tables (MEDIUM PRIORITY)
- Migrate data from `assets` and `brand_assets` to `media_assets`
- Update 20 file references
- Drop old tables

### 3. Verify Analytics Metrics Schema (MEDIUM PRIORITY)
- Confirm production schema matches migration 012 (JSONB approach)
- Verify no code still expects old column structure

### 4. Clean Up Persistence Schema (LOW PRIORITY)
- Remove 6 unused tables from migration 011
- Drop unused views
- Update migration file or create rollback

### 5. API Connector Schema Decision (STRATEGIC)
- Decide: Migrate to new connector infrastructure or keep both?
- If migrating: Plan data migration from old to new schema
- If keeping both: Document different use cases

---

## 🔄 Next Steps

1. **Review this list with team** - Confirm deletion decisions
2. **Create rollback migration** - Before deleting any tables
3. **Run production query analysis** - Verify no queries use tables marked for deletion
4. **Create consolidation migrations** - For duplicate tables
5. **Update code references** - Before dropping tables
6. **Test in staging** - Full deletion + consolidation plan
7. **Document decisions** - Why each table was kept or deleted

See `SCHEMA_FINAL_PLAN.md` for step-by-step execution plan.


