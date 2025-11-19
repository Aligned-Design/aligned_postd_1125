# Schema Keep List - Production Tables

**Generated:** 2025-11-19  
**Status:** Active tables with confirmed usage in codebase

---

## ✅ CORE TABLES (KEEP - HIGH USAGE)

### 1. Identity & Access
| Table | Usage Count | Primary Files | RLS | Status |
|-------|-------------|---------------|-----|--------|
| **brands** | 136 | 45 files across server/routes, server/lib | ✅ | **KEEP - CRITICAL** |
| **brand_members** | ~50 | RLS policies, brand-access.ts, approvals | ✅ | **KEEP - CRITICAL** |
| **tenants** | ~30 | FK references, tenant isolation | ✅ | **KEEP - CORE** |

**References:**
- `brands`: Used in brands.ts, auth.ts, crawler.ts, content-plan.ts, brand-guide.ts, onboarding.ts, creative-studio.ts, agents.ts, billing.ts, + 35 more
- `brand_members`: Used in all RLS policies, brand-access.ts, auth middleware
- `tenants`: Referenced as FK in media_assets, publishing_jobs, analytics_metrics, etc.

---

### 2. Media Management
| Table | Usage Count | Primary Files | RLS | Status |
|-------|-------------|---------------|-----|--------|
| **media_assets** | 40 | media-db-service.ts, media-service.ts, image-sourcing.ts | ✅ | **KEEP - CORE** |
| **media_usage_logs** | 15 | media-db-service.ts | ✅ | **KEEP** |
| **storage_quotas** | 10 | media-db-service.ts | ✅ | **KEEP** |

**References:**
- `media_assets`: media-db-service.ts (13 refs), media-service.ts (10 refs), scraped-images-service.ts, image-sourcing.ts
- Defined in: `server/migrations/006_media_tables.sql`

**Columns Used:**
```typescript
id, tenant_id, brand_id, category, filename, mime_type, 
path, size_bytes, hash, metadata, used_in, usage_count,
created_at, updated_at
```

---

### 3. Publishing & Scheduling
| Table | Usage Count | Primary Files | RLS | Status |
|-------|-------------|---------------|-----|--------|
| **publishing_jobs** | 44 | publishing-db-service.ts, job-queue.ts, job-recovery.ts | ✅ | **KEEP - CORE** |
| **publishing_logs** | 20 | publishing-db-service.ts | ✅ | **KEEP** |
| **scheduled_content** | 15 | approvals-db-service.ts, search-service.ts | ✅ | **KEEP - ACTIVE** |

**References:**
- `publishing_jobs`: publishing-db-service.ts (15 refs), job-queue.ts, job-recovery.ts, integrations-db-service.ts
- `scheduled_content`: approvals-db-service.ts (4 refs), search-service.ts (2 refs)
- Defined in: `server/migrations/007_publishing_jobs_and_logs.sql`

**Columns Used:**
```typescript
// publishing_jobs
id, brand_id, tenant_id, content, platforms, status, 
scheduled_at, retry_count, max_retries, published_at, 
last_error, validation_results, created_at, updated_at

// scheduled_content  
id, brand_id, headline, body, status, platform, 
scheduled_for, created_at, updated_at
```

---

### 4. Platform Connections (OAuth)
| Table | Usage Count | Primary Files | RLS | Status |
|-------|-------------|---------------|-----|--------|
| **platform_connections** | 44 | connections-db-service.ts, integrations-db-service.ts | ✅ | **KEEP - ACTIVE** |
| **platform_sync_logs** | 15 | integrations-db-service.ts, analytics-scheduler.ts | ✅ | **KEEP** |

**References:**
- `platform_connections`: connections-db-service.ts (15 refs), integrations-db-service.ts (8 refs)
- Defined in: `server/migrations/007_publishing_jobs_and_logs.sql` AND `supabase/migrations/005_integrations.sql` ⚠️ **DUPLICATE**

**⚠️ SCHEMA CONFLICT:** `platform_connections` is defined in TWO places with slightly different schemas. See "Schema Conflicts" section.

---

### 5. Analytics & Metrics
| Table | Usage Count | Primary Files | RLS | Status |
|-------|-------------|---------------|-----|--------|
| **analytics_metrics** | 14 | analytics-db-service.ts, dashboard.ts | ✅ | **KEEP - CORE** |
| **analytics_sync_logs** | 8 | analytics-db-service.ts | ✅ | **KEEP** |
| **analytics_goals** | 6 | analytics-db-service.ts | ✅ | **KEEP** |
| **advisor_feedback** | 5 | analytics-db-service.ts | ✅ | **KEEP** |
| **auto_plans** | 5 | auto-plan-generator.ts, content-planning-service.ts | ✅ | **KEEP** |

**References:**
- Defined in: `server/migrations/008_analytics_metrics.sql`
- Used extensively in analytics-db-service.ts class

**Columns Used:**
```typescript
// analytics_metrics
id, brand_id, tenant_id, platform, date, metrics (JSONB),
metadata (JSONB), created_at, updated_at

// analytics_goals
id, brand_id, tenant_id, metric, target, current, 
deadline, status, created_at, updated_at
```

---

### 6. Approvals & Compliance
| Table | Usage Count | Primary Files | RLS | Status |
|-------|-------------|---------------|-----|--------|
| **post_approvals** | 22 | approvals-db-service.ts, dbClient.ts | ✅ | **KEEP - CORE** |
| **client_settings** | 20 | dbClient.ts, client-settings.ts | ✅ | **KEEP - CORE** |
| **audit_logs** | 15 | dbClient.ts, audit-logger.ts | ✅ | **KEEP - COMPLIANCE** |

**References:**
- `post_approvals`: approvals-db-service.ts (6 refs), dbClient.ts (15 refs)
- `client_settings`: dbClient.ts, client-settings.ts
- Defined in: Supabase migrations (Phase 9)

**Columns Used:**
```typescript
// post_approvals
id, brand_id, post_id, status, approved_at, approved_by,
rejected_at, rejected_by, locked, created_at, updated_at

// client_settings
id, client_id, brand_id, email_preferences (JSONB),
timezone, language, unsubscribe_token, 
unsubscribed_from_all, created_at, updated_at
```

---

### 7. Webhooks & Escalations
| Table | Usage Count | Primary Files | RLS | Status |
|-------|-------------|---------------|-----|--------|
| **webhook_events** | 21 | dbClient.ts, webhook-handler.ts | ✅ | **KEEP - ACTIVE** |
| **escalation_rules** | 15 | dbClient.ts, escalations.ts | ✅ | **KEEP** |
| **escalation_events** | 10 | dbClient.ts, escalation-scheduler.ts | ✅ | **KEEP** |

**References:**
- Defined in: Supabase migrations (Phase 9)
- Used in dbClient.ts service class

---

### 8. Content Management
| Table | Usage Count | Primary Files | RLS | Status |
|-------|-------------|---------------|-----|--------|
| **content_items** | 44 | approvals-db-service.ts, content-planning-service.ts | ✅ | **KEEP - ACTIVE** |
| **content** | ~15 | client-portal-db-service.ts (client portal queries) | ✅ | **KEEP - REVIEW** |

**References:**
- `content_items`: approvals-db-service.ts (4 refs), content-planning-service.ts
- `content`: client-portal-db-service.ts (9 refs)
- Defined in: `supabase/migrations/009_complete_schema_sync.sql`

**⚠️ NOTE:** `content` vs `content_items` - potential duplicate concept. See "Schema Conflicts" section.

---

### 9. Milestones & Onboarding
| Table | Usage Count | Primary Files | RLS | Status |
|-------|-------------|---------------|-----|--------|
| **milestones** | 21 | milestones.ts, onboarding.ts | ✅ | **KEEP - ACTIVE** |

**References:**
- Defined in: `supabase/migrations/20250120_create_milestones_table.sql`
- Used in: milestones.ts (5 refs), RLS validation tests

**Columns Used:**
```typescript
id, workspace_id, key, unlocked_at, acknowledged_at,
created_at, updated_at
```

---

### 10. Orchestration & Learning Loop (New)
| Table | Usage Count | Primary Files | RLS | Status |
|-------|-------------|---------------|-----|--------|
| **strategy_briefs** | 4 | collaboration-storage.ts, persistence-service.ts | ⚠️ | **KEEP - NEW** |
| **content_packages** | 4 | collaboration-storage.ts | ⚠️ | **KEEP - NEW** |
| **brand_history** | 2 | collaboration-storage.ts | ⚠️ | **KEEP - NEW** |
| **collaboration_logs** | 2 | collaboration-storage.ts | ⚠️ | **KEEP - NEW** |

**References:**
- Defined in: `supabase/migrations/011_persistence_schema.sql`
- Used in: collaboration-storage.ts (newly implemented)

**⚠️ NOTE:** These are newly implemented tables for multi-agent orchestration. Usage is low because feature is new.

---

### 11. API Connector Infrastructure (New - Production Ready)
| Table | Usage Count | Primary Files | RLS | Status |
|-------|-------------|---------------|-----|--------|
| **connections** | 27 | connectors/manager.ts, token-vault.ts | ✅ | **KEEP - NEW INFRA** |
| **publish_jobs** | 10 | connectors/manager.ts, queue/workers.ts | ✅ | **KEEP - NEW INFRA** |
| **connector_platforms** | 8 | connector-validation.ts, db-healthcheck.ts | ✅ | **KEEP - NEW INFRA** |
| **encrypted_secrets** | 5 | token-vault.ts | ✅ | **KEEP - NEW INFRA** |

**References:**
- Defined in: `supabase/migrations/20241111_api_connector_schema.sql`
- Used in: connectors/manager.ts (8 refs), queue/workers.ts, token-vault.ts

**⚠️ NOTE:** This is a NEW connector infrastructure schema (Nov 11, 2024) that may replace older `platform_connections` / `publishing_jobs` tables. See "Schema Conflicts" section.

---

### 12. Workflow System
| Table | Usage Count | Primary Files | RLS | Status |
|-------|-------------|---------------|-----|--------|
| **workflow_templates** | 10 | workflow-db-service.ts | ✅ | **KEEP - ACTIVE** |
| **workflow_instances** | 10 | workflow-db-service.ts | ✅ | **KEEP - ACTIVE** |
| **workflow_notifications** | 5 | workflow-db-service.ts | ✅ | **KEEP** |

**References:**
- Used in: workflow-db-service.ts (31 total refs across all workflow tables)
- Defined in: `supabase/migrations/012_canonical_schema_alignment.sql`

---

### 13. Integrations & Social
| Table | Usage Count | Primary Files | RLS | Status |
|-------|-------------|---------------|-----|--------|
| **social_posts** | 6 | integrations-db-service.ts, search-service.ts | ⚠️ | **KEEP - REVIEW** |
| **platform_reviews** | 3 | integrations-db-service.ts | ⚠️ | **KEEP - REVIEW** |

**References:**
- Defined in: `supabase/migrations/archived/20250119_create_integrations_tables.sql`
- Usage is minimal - may be legacy

---

### 14. Miscellaneous Active Tables
| Table | Usage Count | Primary Files | RLS | Status |
|-------|-------------|---------------|-----|--------|
| **brand_assets** | 14 | image-sourcing.ts, workflow-db-service.ts | ✅ | **KEEP - ACTIVE** |
| **assets** | 6 | image-sourcing.ts | ⚠️ | **KEEP - REVIEW** |
| **approval_requests** | 6 | approvals-db-service.ts | ✅ | **KEEP** |

**⚠️ NOTE:** `brand_assets` vs `assets` vs `media_assets` - three asset tables exist. See conflicts.

---

## 📊 Summary Statistics

- **Total Tables Analyzed:** 80+
- **Tables to KEEP:** 50+
- **High Usage (40+ refs):** 6 tables
- **Core Usage (20-40 refs):** 8 tables
- **Active Usage (10-20 refs):** 12 tables
- **Light Usage (5-10 refs):** 15 tables
- **New/Recently Added:** 15 tables
- **Schema Conflicts Detected:** 8 conflicts

---

## 🔍 Usage Categories

### Critical (Cannot Remove)
- brands
- brand_members  
- tenants
- media_assets
- publishing_jobs
- analytics_metrics
- post_approvals
- client_settings

### Core (High Value)
- platform_connections
- publishing_logs
- scheduled_content
- content_items
- webhook_events
- escalation_rules
- milestones

### Active (In Use)
- All tables listed above with 5+ references

### New Infrastructure (Recently Added, Production Ready)
- connections, publish_jobs, connector_platforms (API Connector schema)
- strategy_briefs, content_packages, brand_history (Orchestration schema)
- workflow_templates, workflow_instances

---

## ⚠️ Known Issues

1. **Duplicate Table Definitions:** `platform_connections` defined in 2 migrations
2. **Conflicting Schemas:** `analytics_metrics` has different column structures
3. **Overlapping Concepts:** `content` vs `content_items`, `assets` vs `brand_assets` vs `media_assets`
4. **New vs Old:** API Connector schema (connections, publish_jobs) vs old schema (platform_connections, publishing_jobs)

See `SCHEMA_DELETE_LIST.md` and `SCHEMA_FINAL_PLAN.md` for resolution strategies.


