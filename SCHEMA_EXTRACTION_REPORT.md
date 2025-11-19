# SCHEMA EXTRACTION REPORT (AUTO-GENERATED)

Generated: 2025-11-19T14:56:54.896Z

Total tables found: 64

---

## TABLE: brands

### Columns found in SQL migrations (44 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: server/migrations/009_schema_alignment_FULL_FIX.sql
- **name**: TEXT NOT NULL NOT NULL
  - Source: server/migrations/009_schema_alignment_FULL_FIX.sql
- **slug**: TEXT NULL
  - Source: server/migrations/009_schema_alignment_FULL_FIX.sql
- **logo_url**: TEXT NULL
  - Source: server/migrations/009_schema_alignment_FULL_FIX.sql
- **primary_color**: TEXT DEFAULT NULL DEFAULT '#3b82f6'
  - Source: server/migrations/009_schema_alignment_FULL_FIX.sql
- **website_url**: TEXT NULL
  - Source: server/migrations/009_schema_alignment_FULL_FIX.sql
- **industry**: TEXT NULL
  - Source: server/migrations/009_schema_alignment_FULL_FIX.sql
- **description**: TEXT NULL
  - Source: server/migrations/009_schema_alignment_FULL_FIX.sql
- **tone_keywords**: TEXT[] NULL
  - Source: server/migrations/009_schema_alignment_FULL_FIX.sql
- **compliance_rules**: TEXT NULL
  - Source: server/migrations/009_schema_alignment_FULL_FIX.sql
- **brand_kit**: JSONB DEFAULT NULL DEFAULT '{}'::jsonb
  - Source: server/migrations/009_schema_alignment_FULL_FIX.sql
- **voice_summary**: TEXT NULL
  - Source: server/migrations/009_schema_alignment_FULL_FIX.sql
- **visual_summary**: TEXT NULL
  - Source: server/migrations/009_schema_alignment_FULL_FIX.sql
- **tenant_id**: UUID NULL
  - Source: server/migrations/009_schema_alignment_FULL_FIX.sql
- **workspace_id**: TEXT NULL
  - Source: server/migrations/009_schema_alignment_FULL_FIX.sql
- **created_by**: UUID NULL
  - Source: server/migrations/009_schema_alignment_FULL_FIX.sql
- **scraped_at**: TIMESTAMPTZ NULL
  - Source: server/migrations/009_schema_alignment_FULL_FIX.sql
- **scraper_status**: TEXT DEFAULT NULL DEFAULT 'never_run'
  - Source: server/migrations/009_schema_alignment_FULL_FIX.sql
- **intake_completed**: BOOLEAN DEFAULT FALSE NULL DEFAULT FALSE
  - Source: server/migrations/009_schema_alignment_FULL_FIX.sql
- **intake_completed_at**: TIMESTAMPTZ NULL
  - Source: server/migrations/009_schema_alignment_FULL_FIX.sql
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: server/migrations/009_schema_alignment_FULL_FIX.sql
- **updated_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: server/migrations/009_schema_alignment_FULL_FIX.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (88 found):

- id: found in 10 locations
-   → server/connectors/base.ts
- name: found in 10 locations
-   → server/connectors/base.ts
- slug: found in 10 locations
-   → server/__tests__/crawler-improvements.test.ts
- logo_url: found in 10 locations
-   → server/scripts/extract-complete-schema.ts
- primary_color: found in 10 locations
-   → server/scripts/extract-complete-schema.ts
- _... and 78 more_

---

## TABLE: brand_members

### Columns found in SQL migrations (12 total):

- **updated_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **brand_id**: UUID NOT NULL REFERENCES brands NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **user_id**: UUID NOT NULL REFERENCES auth NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **role**: VARCHAR(50) NOT NULL DEFAULT NOT NULL DEFAULT 'member'
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (24 found):

- updated_at: found in 10 locations
-   → server/connectors/oauth-utils.ts
- id: found in 10 locations
-   → server/connectors/base.ts
- brand_id: found in 10 locations
-   → server/middleware/token-health-middleware.ts
- user_id: found in 10 locations
-   → server/connectors/canva/index.ts
- role: found in 10 locations
-   → server/middleware/authenticateUser.ts
- _... and 14 more_

---

## TABLE: media_assets

### Columns found in SQL migrations (33 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **tenant_id**: UUID REFERENCES tenants NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **brand_id**: UUID NOT NULL REFERENCES brands NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **category**: TEXT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **filename**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **mime_type**: TEXT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **path**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **file_size**: BIGINT NOT NULL NOT NULL
  - Source: server/migrations/006_media_tables.sql
- **hash**: TEXT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **url**: TEXT NOT NULL NOT NULL
  - Source: server/migrations/006_media_tables.sql
- **thumbnail_url**: TEXT NULL
  - Source: server/migrations/006_media_tables.sql
- **status**: VARCHAR(20) NOT NULL DEFAULT NOT NULL DEFAULT 'active'
  - Source: server/migrations/006_media_tables.sql
- **metadata**: JSONB DEFAULT NULL DEFAULT '{}'::jsonb
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **variants**: JSONB NULL
  - Source: server/migrations/006_media_tables.sql
- **used_in**: TEXT[] DEFAULT ARRAY NULL DEFAULT ARRAY[]::TEXT[]
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **last_used**: TIMESTAMPTZ NULL
  - Source: server/migrations/006_media_tables.sql
- **usage_count**: INTEGER NOT NULL DEFAULT NOT NULL DEFAULT 0
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **updated_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **size_bytes**: BIGINT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (66 found):

- id: found in 10 locations
-   → server/connectors/base.ts
- tenant_id: found in 10 locations
-   → server/connectors/manager.ts
- brand_id: found in 10 locations
-   → server/middleware/token-health-middleware.ts
- category: found in 10 locations
-   → server/types/guards.ts
- filename: found in 10 locations
-   → server/types/database.ts
- _... and 56 more_

---

## TABLE: storage_quotas

### Columns found in SQL migrations (23 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **brand_id**: UUID NOT NULL REFERENCES brands NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **tenant_id**: UUID REFERENCES tenants NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **limit_bytes**: BIGINT NOT NULL DEFAULT NOT NULL DEFAULT 5368709120
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **warning_threshold_percent**: INTEGER DEFAULT NULL DEFAULT 80
  - Source: server/migrations/006_media_tables_PRODUCTION_FIX.sql
- **hard_limit_percent**: INTEGER DEFAULT NULL DEFAULT 100
  - Source: server/migrations/006_media_tables_PRODUCTION_FIX.sql
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **updated_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **used_bytes**: BIGINT NOT NULL DEFAULT NOT NULL DEFAULT 0
  - Source: supabase/migrations/012_canonical_schema_alignment.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (46 found):

- id: found in 10 locations
-   → server/connectors/base.ts
- brand_id: found in 10 locations
-   → server/middleware/token-health-middleware.ts
- tenant_id: found in 10 locations
-   → server/connectors/manager.ts
- limit_bytes: found in 9 locations
-   → server/scripts/schema-alignment-smoke-test.ts
- warning_threshold_percent: found in 6 locations
-   → server/scripts/schema-alignment-smoke-test.ts
- _... and 36 more_

---

## TABLE: content_items

### Columns found in SQL migrations (24 total):

- **content**: JSONB NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **brand_id**: UUID NOT NULL REFERENCES brands NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **title**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **content_type**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **platform**: TEXT NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **body**: TEXT NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **media_urls**: TEXT[] NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **scheduled_for**: TIMESTAMP WITH TIME ZONE NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **status**: TEXT NOT NULL DEFAULT NOT NULL DEFAULT 'draft'
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **generated_by_agent**: TEXT NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **created_by**: UUID REFERENCES auth NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **approved_by**: UUID REFERENCES user NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **published_at**: TIMESTAMP WITH TIME ZONE NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **updated_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **type**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (48 found):

- content: found in 10 locations
-   → server/connectors/base.ts
- id: found in 10 locations
-   → server/connectors/base.ts
- brand_id: found in 10 locations
-   → server/middleware/token-health-middleware.ts
- title: found in 10 locations
-   → server/connectors/base.ts
- content_type: found in 10 locations
-   → server/scripts/schema-alignment-smoke-test.ts
- _... and 38 more_

---

## TABLE: scheduled_content

### Columns found in SQL migrations (8 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **brand_id**: UUID NOT NULL REFERENCES brands NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **content_id**: UUID NOT NULL REFERENCES content NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **scheduled_at**: TIMESTAMPTZ NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **platforms**: TEXT[] NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **status**: TEXT NOT NULL DEFAULT NOT NULL DEFAULT 'scheduled'
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **updated_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (16 found):

- id: found in 10 locations
-   → server/connectors/base.ts
- brand_id: found in 10 locations
-   → server/middleware/token-health-middleware.ts
- content_id: found in 10 locations
-   → server/utils/verify-supabase-setup.ts
- scheduled_at: found in 10 locations
-   → server/types/guards.ts
- platforms: found in 10 locations
-   → server/connectors/manager.ts
- _... and 6 more_

---

## TABLE: analytics_metrics

### Columns found in SQL migrations (31 total):

- **brand_id**: UUID NOT NULL REFERENCES brands NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **date**: DATE NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **metrics**: JSONB NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **tenant_id**: UUID NOT NULL NOT NULL
  - Source: server/migrations/008_analytics_metrics.sql
- **platform**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **post_id**: VARCHAR(255) NULL
  - Source: server/migrations/008_analytics_metrics.sql
- **metadata**: JSONB NOT NULL DEFAULT NOT NULL DEFAULT '{}'
  - Source: server/migrations/008_analytics_metrics.sql
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **updated_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: server/migrations/008_analytics_metrics.sql
- **content_item_id**: UUID REFERENCES content NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **impressions**: INTEGER DEFAULT NULL DEFAULT 0
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **reach**: INTEGER DEFAULT NULL DEFAULT 0
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **engagements**: INTEGER DEFAULT NULL DEFAULT 0
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **clicks**: INTEGER DEFAULT NULL DEFAULT 0
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **shares**: INTEGER DEFAULT NULL DEFAULT 0
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **comments**: INTEGER DEFAULT NULL DEFAULT 0
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **likes**: INTEGER DEFAULT NULL DEFAULT 0
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **recorded_at**: TIMESTAMP WITH TIME ZONE DEFAULT now NULL DEFAULT now()
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **metrics_temp**: JSONB NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (60 found):

- brand_id: found in 10 locations
-   → server/middleware/token-health-middleware.ts
- date: found in 10 locations
-   → server/connectors/base.ts
- metrics: found in 10 locations
-   → server/connectors/meta/implementation.ts
- id: found in 10 locations
-   → server/connectors/base.ts
- brand_id: found in 10 locations
-   → server/middleware/token-health-middleware.ts
- _... and 50 more_

---

## TABLE: milestones

### Columns found in SQL migrations (7 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/20250120_create_milestones_table.sql
- **workspace_id**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/20250120_create_milestones_table.sql
- **key**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/20250120_create_milestones_table.sql
- **unlocked_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/20250120_create_milestones_table.sql
- **acknowledged_at**: TIMESTAMP WITH TIME ZONE NULL
  - Source: supabase/migrations/20250120_create_milestones_table.sql
- **created_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/20250120_create_milestones_table.sql
- **updated_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/20250120_create_milestones_table.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (14 found):

- id: found in 10 locations
-   → server/connectors/base.ts
- workspace_id: found in 10 locations
-   → server/scripts/extract-complete-schema.ts
- key: found in 10 locations
-   → server/connectors/manager.ts
- unlocked_at: found in 5 locations
-   → server/scripts/schema-alignment-smoke-test.ts
- acknowledged_at: found in 3 locations
-   → server/scripts/schema-alignment-smoke-test.ts
- _... and 4 more_

---

## TABLE: advisor_feedback

### Columns found in SQL migrations (19 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **brand_id**: UUID NOT NULL REFERENCES brands NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **tenant_id**: UUID NOT NULL NOT NULL
  - Source: server/migrations/008_analytics_metrics.sql
- **insight_id**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **category**: TEXT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **type**: TEXT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **feedback**: TEXT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **previous_weight**: NUMERIC NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **new_weight**: NUMERIC NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: advisor_review_audits

### Columns found in SQL migrations (20 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/011_persistence_schema.sql
- **cycle_id**: TEXT NOT NULL UNIQUE NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **request_id**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **brand_id**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **content_id**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **platform**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **clarity_score**: DECIMAL(3 NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **alignment_score**: DECIMAL(3 NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **resonance_score**: DECIMAL(3 NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **actionability_score**: DECIMAL(3 NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **platform_fit_score**: DECIMAL(3 NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **average_score**: DECIMAL(4 NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **weighted_score**: DECIMAL(4 NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **severity_level**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **reflection_question**: TEXT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **suggested_actions**: JSONB NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **created_at**: TIMESTAMP WITH TIME ZONE DEFAULT NOW NULL DEFAULT NOW()
  - Source: supabase/migrations/011_persistence_schema.sql
- **INDEX**: idx NULL
  - Source: supabase/migrations/011_persistence_schema.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: analytics_goals

### Columns found in SQL migrations (19 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **brand_id**: UUID NOT NULL REFERENCES brands NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **tenant_id**: UUID NOT NULL NOT NULL
  - Source: server/migrations/008_analytics_metrics.sql
- **metric**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **target**: NUMERIC NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **current**: NUMERIC NOT NULL DEFAULT NOT NULL DEFAULT 0
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **deadline**: DATE NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **updated_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **status**: VARCHAR(20) NOT NULL DEFAULT NOT NULL DEFAULT 'active'
  - Source: server/migrations/008_analytics_metrics.sql
- **notes**: TEXT NULL
  - Source: server/migrations/008_analytics_metrics.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: analytics_sync_logs

### Columns found in SQL migrations (22 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **brand_id**: UUID NOT NULL REFERENCES brands NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **tenant_id**: UUID NOT NULL NOT NULL
  - Source: server/migrations/008_analytics_metrics.sql
- **platform**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **sync_type**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **status**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **items_synced**: INTEGER DEFAULT NULL DEFAULT 0
  - Source: server/migrations/008_analytics_metrics.sql
- **items_failed**: INTEGER DEFAULT NULL DEFAULT 0
  - Source: server/migrations/008_analytics_metrics.sql
- **started_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **completed_at**: TIMESTAMPTZ NULL
  - Source: server/migrations/008_analytics_metrics.sql
- **duration_ms**: INTEGER NULL
  - Source: server/migrations/008_analytics_metrics.sql
- **error_message**: TEXT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **error_details**: JSONB NULL
  - Source: server/migrations/008_analytics_metrics.sql
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: server/migrations/008_analytics_metrics.sql
- **finished_at**: TIMESTAMPTZ NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: approval_threads

### Columns found in SQL migrations (6 total):

- **id**: UUID PRIMARY KEY DEFAULT uuid NULL DEFAULT uuid_generate_v4()
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **content_item_id**: UUID REFERENCES content NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **user_id**: UUID REFERENCES user NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **comment**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **action**: TEXT NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **created_at**: TIMESTAMP WITH TIME ZONE DEFAULT now NULL DEFAULT now()
  - Source: supabase/migrations/009_complete_schema_sync.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: archived_data

### Columns found in SQL migrations (9 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/20250201_payment_status_tracking.sql
- **user_id**: UUID NOT NULL NOT NULL
  - Source: supabase/migrations/20250201_payment_status_tracking.sql
- **brand_id**: UUID NULL
  - Source: supabase/migrations/20250201_payment_status_tracking.sql
- **data_type**: VARCHAR(100) NOT NULL NOT NULL
  - Source: supabase/migrations/20250201_payment_status_tracking.sql
- **data**: JSONB NOT NULL NOT NULL
  - Source: supabase/migrations/20250201_payment_status_tracking.sql
- **archived_at**: TIMESTAMP WITH TIME ZONE DEFAULT NOW NULL DEFAULT NOW()
  - Source: supabase/migrations/20250201_payment_status_tracking.sql
- **delete_after**: TIMESTAMP WITH TIME ZONE NOT NULL NOT NULL
  - Source: supabase/migrations/20250201_payment_status_tracking.sql
- **restored**: BOOLEAN DEFAULT FALSE NULL DEFAULT FALSE
  - Source: supabase/migrations/20250201_payment_status_tracking.sql
- **restored_at**: TIMESTAMP WITH TIME ZONE NULL
  - Source: supabase/migrations/20250201_payment_status_tracking.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: assets

### Columns found in SQL migrations (9 total):

- **id**: UUID PRIMARY KEY DEFAULT uuid NULL DEFAULT uuid_generate_v4()
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **brand_id**: UUID REFERENCES brands NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **file_name**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **file_url**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **file_type**: TEXT NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **file_size_bytes**: BIGINT NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **tags**: TEXT[] NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **uploaded_by**: UUID REFERENCES user NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **created_at**: TIMESTAMP WITH TIME ZONE DEFAULT now NULL DEFAULT now()
  - Source: supabase/migrations/009_complete_schema_sync.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: audit_logs

### Columns found in SQL migrations (30 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **brand_id**: UUID REFERENCES brands NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **user_id**: UUID REFERENCES auth NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **action**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **resource_type**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **resource_id**: TEXT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **changes**: JSONB DEFAULT NULL DEFAULT '{}'
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **metadata**: JSONB DEFAULT NULL DEFAULT '{}'::jsonb
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **ip_address**: CHARACTER VARYING NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **user_agent**: TEXT NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **post_id**: CHARACTER VARYING NOT NULL NOT NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **actor_id**: CHARACTER VARYING NOT NULL NOT NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **actor_email**: CHARACTER VARYING NOT NULL NOT NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **updated_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now NOT NULL DEFAULT now()
  - Source: supabase/migrations/009_complete_schema_sync.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: auto_plans

### Columns found in SQL migrations (24 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **brand_id**: UUID NOT NULL REFERENCES brands NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **tenant_id**: UUID NOT NULL NOT NULL
  - Source: server/migrations/008_analytics_metrics.sql
- **month**: DATE NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **name**: VARCHAR(255) NOT NULL NOT NULL
  - Source: server/migrations/008_analytics_metrics.sql
- **description**: TEXT NULL
  - Source: server/migrations/008_analytics_metrics.sql
- **plan_data**: JSONB NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **confidence**: NUMERIC NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **generated_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: server/migrations/008_analytics_metrics.sql
- **approved**: BOOLEAN DEFAULT FALSE NULL DEFAULT FALSE
  - Source: server/migrations/008_analytics_metrics.sql
- **approved_at**: TIMESTAMPTZ NULL
  - Source: server/migrations/008_analytics_metrics.sql
- **approved_by**: UUID NULL
  - Source: server/migrations/008_analytics_metrics.sql
- **published_count**: INTEGER DEFAULT NULL DEFAULT 0
  - Source: server/migrations/008_analytics_metrics.sql
- **completed**: BOOLEAN DEFAULT FALSE NULL DEFAULT FALSE
  - Source: server/migrations/008_analytics_metrics.sql
- **completed_at**: TIMESTAMPTZ NULL
  - Source: server/migrations/008_analytics_metrics.sql
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **updated_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: brand_assets

### Columns found in SQL migrations (10 total):

- **id**: UUID PRIMARY KEY DEFAULT uuid NULL DEFAULT uuid_generate_v4()
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **brand_id**: UUID REFERENCES brands NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **asset_type**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **file_name**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **file_path**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **file_size**: BIGINT NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **mime_type**: TEXT NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **metadata**: JSONB DEFAULT NULL DEFAULT '{}'
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **created_at**: TIMESTAMP WITH TIME ZONE DEFAULT now NULL DEFAULT now()
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **updated_at**: TIMESTAMP WITH TIME ZONE DEFAULT now NULL DEFAULT now()
  - Source: supabase/migrations/009_complete_schema_sync.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: brand_history

### Columns found in SQL migrations (15 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/011_persistence_schema.sql
- **brand_id**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **entry_id**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **timestamp**: TIMESTAMP WITH TIME ZONE NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **agent**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **action**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **content_id**: TEXT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **details**: JSONB NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **rationale**: TEXT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **performance**: JSONB NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **tags**: TEXT[] NOT NULL DEFAULT NOT NULL DEFAULT '{}'
  - Source: supabase/migrations/011_persistence_schema.sql
- **created_at**: TIMESTAMP WITH TIME ZONE DEFAULT NOW NULL DEFAULT NOW()
  - Source: supabase/migrations/011_persistence_schema.sql
- **INDEX**: idx NULL
  - Source: supabase/migrations/011_persistence_schema.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: brand_success_patterns

### Columns found in SQL migrations (9 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/011_persistence_schema.sql
- **brand_id**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **pattern**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **frequency**: INTEGER DEFAULT NULL DEFAULT 1
  - Source: supabase/migrations/011_persistence_schema.sql
- **avg_performance**: DECIMAL(4 NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **examples**: TEXT[] NOT NULL DEFAULT NOT NULL DEFAULT '{}'
  - Source: supabase/migrations/011_persistence_schema.sql
- **last_seen**: TIMESTAMP WITH TIME ZONE DEFAULT NOW NULL DEFAULT NOW()
  - Source: supabase/migrations/011_persistence_schema.sql
- **created_at**: TIMESTAMP WITH TIME ZONE DEFAULT NOW NULL DEFAULT NOW()
  - Source: supabase/migrations/011_persistence_schema.sql
- **INDEX**: idx NULL
  - Source: supabase/migrations/011_persistence_schema.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: client_comments

### Columns found in SQL migrations (10 total):

- **id**: UUID PRIMARY KEY DEFAULT uuid NULL DEFAULT uuid_generate_v4()
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **content_id**: UUID NOT NULL REFERENCES content NOT NULL
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **client_id**: UUID NOT NULL REFERENCES user NOT NULL
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **comment**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **attachment_urls**: TEXT[] DEFAULT ARRAY NULL DEFAULT ARRAY[]::TEXT[]
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **is_resolved**: BOOLEAN DEFAULT FALSE NULL DEFAULT FALSE
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **resolved_at**: TIMESTAMP WITH TIME ZONE NULL
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **resolved_by**: UUID REFERENCES user NULL
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **created_at**: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT NULL DEFAULT CURRENT_TIMESTAMP
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **updated_at**: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT NULL DEFAULT CURRENT_TIMESTAMP
  - Source: supabase/migrations/007_client_portal_and_audit.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: client_media

### Columns found in SQL migrations (10 total):

- **id**: UUID PRIMARY KEY DEFAULT uuid NULL DEFAULT uuid_generate_v4()
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **brand_id**: UUID NOT NULL REFERENCES brands NOT NULL
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **client_id**: UUID NOT NULL REFERENCES user NOT NULL
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **filename**: VARCHAR(500) NOT NULL NOT NULL
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **file_size**: BIGINT NOT NULL NOT NULL
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **mime_type**: VARCHAR(100) NULL
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **url**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **status**: VARCHAR(50) DEFAULT NULL DEFAULT 'uploading' CHECK (status IN ('uploading'
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **uploaded_at**: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT NULL DEFAULT CURRENT_TIMESTAMP
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **expires_at**: TIMESTAMP WITH TIME ZONE NULL
  - Source: supabase/migrations/007_client_portal_and_audit.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: client_settings

### Columns found in SQL migrations (29 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **brand_id**: UUID NOT NULL REFERENCES brands NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **client_id**: UUID REFERENCES auth NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **can_view_analytics**: BOOLEAN DEFAULT FALSE NULL DEFAULT FALSE
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **can_approve_content**: BOOLEAN DEFAULT FALSE NULL DEFAULT FALSE
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **can_upload_media**: BOOLEAN DEFAULT FALSE NULL DEFAULT FALSE
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **can_view_brand_guide**: BOOLEAN DEFAULT FALSE NULL DEFAULT FALSE
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **updated_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **email_preferences**: JSONB NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **timezone**: TEXT DEFAULT NULL DEFAULT 'America/Chicago'
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **language**: CHARACTER VARYING NOT NULL DEFAULT NOT NULL DEFAULT 'en'
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **unsubscribe_token**: TEXT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **unsubscribed_from_all**: BOOLEAN NOT NULL DEFAULT FALSE NOT NULL DEFAULT FALSE
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **unsubscribed_types**: TEXT[] NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **last_modified_by**: CHARACTER VARYING NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql

### TypeScript type definitions (3 found):

- export interface ClientSettingsRecord { (/Users/krisfoust/Downloads/Aligned-20ai.posted/server/lib/dbClient.ts)
- export interface ClientSettingsResponse { (/Users/krisfoust/Downloads/Aligned-20ai.posted/shared/client-settings.ts)
- export interface ClientSettingsListResponse { (/Users/krisfoust/Downloads/Aligned-20ai.posted/shared/client-settings.ts)

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: collaboration_logs

### Columns found in SQL migrations (16 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/011_persistence_schema.sql
- **cycle_id**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **request_id**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **brand_id**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **agent**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **action**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **timestamp**: TIMESTAMP WITH TIME ZONE NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **content_id**: TEXT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **notes**: TEXT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **metadata**: JSONB NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **created_at**: TIMESTAMP WITH TIME ZONE DEFAULT NOW NULL DEFAULT NOW()
  - Source: supabase/migrations/011_persistence_schema.sql
- **INDEX**: idx NULL
  - Source: supabase/migrations/011_persistence_schema.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: connection_audit

### Columns found in SQL migrations (10 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **connection_id**: UUID NOT NULL REFERENCES connections NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **tenant_id**: UUID NOT NULL REFERENCES auth NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **action**: VARCHAR(100) NOT NULL NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **status_before**: VARCHAR(50) NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **status_after**: VARCHAR(50) NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **details**: JSONB NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **user_id**: VARCHAR(255) NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **ip_address**: VARCHAR(45) NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **created_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/20241111_api_connector_schema.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: connection_health_log

### Columns found in SQL migrations (8 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **connection_id**: UUID NOT NULL REFERENCES connections NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **status**: VARCHAR(50) NOT NULL NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **latency_ms**: INT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **http_status**: INT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **error_message**: TEXT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **check_type**: VARCHAR(50) NOT NULL DEFAULT NOT NULL DEFAULT 'synthetic'
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **created_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/20241111_api_connector_schema.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: connections

### Columns found in SQL migrations (19 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **tenant_id**: UUID NOT NULL REFERENCES auth NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **platform_id**: UUID NOT NULL REFERENCES connector NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **platform_user_id**: VARCHAR(255) NOT NULL NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **platform_account_id**: VARCHAR(255) NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **display_name**: VARCHAR(255) NOT NULL NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **profile_image_url**: TEXT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **status**: VARCHAR(50) NOT NULL DEFAULT NOT NULL DEFAULT 'active'
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **health_status**: VARCHAR(50) NOT NULL DEFAULT NOT NULL DEFAULT 'healthy'
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **last_health_check**: TIMESTAMP WITH TIME ZONE NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **health_check_error**: TEXT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **token_expires_at**: TIMESTAMP WITH TIME ZONE NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **last_token_refresh**: TIMESTAMP WITH TIME ZONE NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **requires_reconnect**: BOOLEAN NOT NULL DEFAULT false NOT NULL DEFAULT false
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **scopes**: TEXT[] NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **metadata**: JSONB DEFAULT NULL DEFAULT '{}'::JSONB
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **created_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **updated_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **last_used_at**: TIMESTAMP WITH TIME ZONE NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: connector_platforms

### Columns found in SQL migrations (13 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **tenant_id**: UUID NOT NULL REFERENCES auth NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **platform_name**: VARCHAR(50) NOT NULL UNIQUE NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **is_enabled**: BOOLEAN NOT NULL DEFAULT false NOT NULL DEFAULT false
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **is_beta**: BOOLEAN NOT NULL DEFAULT false NOT NULL DEFAULT false
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **api_version**: VARCHAR(20) NOT NULL DEFAULT NOT NULL DEFAULT 'v1'
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **rate_limit_requests**: INT NOT NULL DEFAULT NOT NULL DEFAULT 60
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **rate_limit_window_seconds**: INT NOT NULL DEFAULT NOT NULL DEFAULT 60
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **max_retry_attempts**: INT NOT NULL DEFAULT NOT NULL DEFAULT 4
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **webhook_supported**: BOOLEAN NOT NULL DEFAULT false NOT NULL DEFAULT false
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **scheduling_supported**: BOOLEAN NOT NULL DEFAULT false NOT NULL DEFAULT false
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **created_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **updated_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/20241111_api_connector_schema.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: content_packages

### Columns found in SQL migrations (17 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/011_persistence_schema.sql
- **brand_id**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **content_id**: TEXT NOT NULL UNIQUE NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **request_id**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **cycle_id**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **copy**: JSONB NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **design_context**: JSONB NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **collaboration_log**: JSONB NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **status**: TEXT NOT NULL DEFAULT NOT NULL DEFAULT 'draft'
  - Source: supabase/migrations/011_persistence_schema.sql
- **quality_score**: DECIMAL(3 NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **requires_approval**: BOOLEAN DEFAULT true NULL DEFAULT true
  - Source: supabase/migrations/011_persistence_schema.sql
- **created_at**: TIMESTAMP WITH TIME ZONE DEFAULT NOW NULL DEFAULT NOW()
  - Source: supabase/migrations/011_persistence_schema.sql
- **updated_at**: TIMESTAMP WITH TIME ZONE DEFAULT NOW NULL DEFAULT NOW()
  - Source: supabase/migrations/011_persistence_schema.sql
- **published_at**: TIMESTAMP WITH TIME ZONE NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **INDEX**: idx NULL
  - Source: supabase/migrations/011_persistence_schema.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: encrypted_secrets

### Columns found in SQL migrations (12 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **tenant_id**: UUID NOT NULL REFERENCES auth NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **connection_id**: UUID NOT NULL REFERENCES connections NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **secret_type**: VARCHAR(100) NOT NULL NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **secret_name**: VARCHAR(255) NOT NULL NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **encrypted_value**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **iv**: VARCHAR(255) NOT NULL NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **auth_tag**: VARCHAR(255) NOT NULL NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **rotated_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **expires_at**: TIMESTAMP WITH TIME ZONE NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **metadata**: JSONB DEFAULT NULL DEFAULT '{}'::JSONB
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **created_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/20241111_api_connector_schema.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: escalation_events

### Columns found in SQL migrations (7 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **brand_id**: UUID NOT NULL REFERENCES brands NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **approval_id**: UUID REFERENCES post NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **rule_id**: UUID REFERENCES escalation NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **status**: TEXT NOT NULL DEFAULT NOT NULL DEFAULT 'pending'
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **resolved_at**: TIMESTAMPTZ NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: escalation_rules

### Columns found in SQL migrations (7 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **brand_id**: UUID NOT NULL REFERENCES brands NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **rule_type**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **trigger_hours**: INTEGER NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **escalate_to_role**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **updated_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: feature_flags

### Columns found in SQL migrations (9 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **tenant_id**: UUID NOT NULL REFERENCES auth NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **flag_name**: VARCHAR(255) NOT NULL NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **description**: TEXT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **is_enabled**: BOOLEAN NOT NULL DEFAULT false NOT NULL DEFAULT false
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **rollout_percentage**: INT DEFAULT NULL DEFAULT 0
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **created_by**: VARCHAR(255) NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **created_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **updated_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/20241111_api_connector_schema.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: integration_events

### Columns found in SQL migrations (7 total):

- **id**: UUID PRIMARY KEY DEFAULT uuid NULL DEFAULT uuid_generate_v4()
  - Source: supabase/migrations/005_integrations.sql
- **brand_id**: UUID NOT NULL REFERENCES brands NOT NULL
  - Source: supabase/migrations/005_integrations.sql
- **connection_id**: UUID NOT NULL REFERENCES platform NOT NULL
  - Source: supabase/migrations/005_integrations.sql
- **event_type**: VARCHAR(100) NOT NULL NOT NULL
  - Source: supabase/migrations/005_integrations.sql
- **payload**: JSONB NOT NULL DEFAULT NOT NULL DEFAULT '{}'
  - Source: supabase/migrations/005_integrations.sql
- **processed_at**: TIMESTAMP WITH TIME ZONE NULL
  - Source: supabase/migrations/005_integrations.sql
- **created_at**: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT NULL DEFAULT CURRENT_TIMESTAMP
  - Source: supabase/migrations/005_integrations.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: media_usage_logs

### Columns found in SQL migrations (13 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **asset_id**: UUID NOT NULL REFERENCES media NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **brand_id**: UUID NOT NULL REFERENCES brands NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **used_in**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **used_by_user**: UUID REFERENCES auth NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **context**: JSONB DEFAULT NULL DEFAULT '{}'::jsonb
  - Source: supabase/migrations/012_canonical_schema_alignment.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: notification_preferences

### Columns found in SQL migrations (10 total):

- **id**: UUID PRIMARY KEY DEFAULT uuid NULL DEFAULT uuid_generate_v4()
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **user_id**: UUID NOT NULL UNIQUE REFERENCES user NOT NULL
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **brand_id**: UUID REFERENCES brands NULL
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **approval_notifications**: BOOLEAN DEFAULT TRUE NULL DEFAULT TRUE
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **job_completion_notifications**: BOOLEAN DEFAULT TRUE NULL DEFAULT TRUE
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **sync_alerts**: BOOLEAN DEFAULT TRUE NULL DEFAULT TRUE
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **weekly_digest**: BOOLEAN DEFAULT TRUE NULL DEFAULT TRUE
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **daily_summary**: BOOLEAN DEFAULT FALSE NULL DEFAULT FALSE
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **created_at**: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT NULL DEFAULT CURRENT_TIMESTAMP
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **updated_at**: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT NULL DEFAULT CURRENT_TIMESTAMP
  - Source: supabase/migrations/007_client_portal_and_audit.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: notifications

### Columns found in SQL migrations (12 total):

- **id**: UUID PRIMARY KEY DEFAULT uuid NULL DEFAULT uuid_generate_v4()
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **user_id**: UUID NOT NULL REFERENCES user NOT NULL
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **brand_id**: UUID REFERENCES brands NULL
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **type**: VARCHAR(50) NOT NULL NOT NULL
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **title**: VARCHAR(255) NOT NULL NOT NULL
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **message**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **severity**: VARCHAR(20) NOT NULL DEFAULT NOT NULL DEFAULT 'info' CHECK (severity IN ('info'
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **action_url**: TEXT NULL
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **is_read**: BOOLEAN DEFAULT FALSE NULL DEFAULT FALSE
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **read_at**: TIMESTAMP WITH TIME ZONE NULL
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **created_at**: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT NULL DEFAULT CURRENT_TIMESTAMP
  - Source: supabase/migrations/007_client_portal_and_audit.sql
- **expires_at**: TIMESTAMP WITH TIME ZONE NULL
  - Source: supabase/migrations/007_client_portal_and_audit.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: payment_attempts

### Columns found in SQL migrations (13 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/20250201_payment_status_tracking.sql
- **user_id**: UUID NOT NULL REFERENCES users NOT NULL
  - Source: supabase/migrations/20250201_payment_status_tracking.sql
- **attempt_number**: INT NOT NULL NOT NULL
  - Source: supabase/migrations/20250201_payment_status_tracking.sql
- **status**: VARCHAR(50) NOT NULL NOT NULL
  - Source: supabase/migrations/20250201_payment_status_tracking.sql
- **amount**: DECIMAL(10 NULL
  - Source: supabase/migrations/20250201_payment_status_tracking.sql
- **currency**: VARCHAR(3) DEFAULT NULL DEFAULT 'USD'
  - Source: supabase/migrations/20250201_payment_status_tracking.sql
- **stripe_invoice_id**: VARCHAR(255) NULL
  - Source: supabase/migrations/20250201_payment_status_tracking.sql
- **stripe_payment_intent_id**: VARCHAR(255) NULL
  - Source: supabase/migrations/20250201_payment_status_tracking.sql
- **error_code**: VARCHAR(255) NULL
  - Source: supabase/migrations/20250201_payment_status_tracking.sql
- **error_message**: TEXT NULL
  - Source: supabase/migrations/20250201_payment_status_tracking.sql
- **attempted_at**: TIMESTAMP WITH TIME ZONE DEFAULT NOW NULL DEFAULT NOW()
  - Source: supabase/migrations/20250201_payment_status_tracking.sql
- **created_at**: TIMESTAMP WITH TIME ZONE DEFAULT NOW NULL DEFAULT NOW()
  - Source: supabase/migrations/20250201_payment_status_tracking.sql
- **updated_at**: TIMESTAMP WITH TIME ZONE DEFAULT NOW NULL DEFAULT NOW()
  - Source: supabase/migrations/20250201_payment_status_tracking.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: payment_notifications

### Columns found in SQL migrations (9 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/20250201_payment_status_tracking.sql
- **user_id**: UUID NOT NULL REFERENCES users NOT NULL
  - Source: supabase/migrations/20250201_payment_status_tracking.sql
- **notification_type**: VARCHAR(100) NOT NULL NOT NULL
  - Source: supabase/migrations/20250201_payment_status_tracking.sql
- **sent_at**: TIMESTAMP WITH TIME ZONE DEFAULT NOW NULL DEFAULT NOW()
  - Source: supabase/migrations/20250201_payment_status_tracking.sql
- **email_subject**: TEXT NULL
  - Source: supabase/migrations/20250201_payment_status_tracking.sql
- **email_body**: TEXT NULL
  - Source: supabase/migrations/20250201_payment_status_tracking.sql
- **delivered**: BOOLEAN DEFAULT FALSE NULL DEFAULT FALSE
  - Source: supabase/migrations/20250201_payment_status_tracking.sql
- **opened**: BOOLEAN DEFAULT FALSE NULL DEFAULT FALSE
  - Source: supabase/migrations/20250201_payment_status_tracking.sql
- **clicked**: BOOLEAN DEFAULT FALSE NULL DEFAULT FALSE
  - Source: supabase/migrations/20250201_payment_status_tracking.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: performance_logs

### Columns found in SQL migrations (15 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/011_persistence_schema.sql
- **brand_id**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **content_id**: TEXT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **cycle_id**: TEXT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **content_type**: TEXT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **platform**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **engagement**: JSONB NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **reach**: INTEGER NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **impressions**: INTEGER NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **click_through_rate**: DECIMAL(5 NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **recorded_at**: TIMESTAMP WITH TIME ZONE NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **created_at**: TIMESTAMP WITH TIME ZONE DEFAULT NOW NULL DEFAULT NOW()
  - Source: supabase/migrations/011_persistence_schema.sql
- **INDEX**: idx NULL
  - Source: supabase/migrations/011_persistence_schema.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: platform_connections

### Columns found in SQL migrations (31 total):

- **id**: UUID PRIMARY KEY DEFAULT uuid NULL DEFAULT uuid_generate_v4()
  - Source: supabase/migrations/005_integrations.sql
- **brand_id**: UUID NOT NULL REFERENCES brands NOT NULL
  - Source: supabase/migrations/005_integrations.sql
- **tenant_id**: UUID NOT NULL NOT NULL
  - Source: server/migrations/007_publishing_jobs_and_logs.sql
- **platform**: VARCHAR(50) NOT NULL NOT NULL
  - Source: supabase/migrations/005_integrations.sql
- **account_id**: VARCHAR(255) NOT NULL NOT NULL
  - Source: supabase/migrations/005_integrations.sql
- **account_name**: VARCHAR(255) NULL
  - Source: supabase/migrations/005_integrations.sql
- **profile_picture**: TEXT NULL
  - Source: server/migrations/007_publishing_jobs_and_logs.sql
- **access_token**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/005_integrations.sql
- **refresh_token**: TEXT NULL
  - Source: supabase/migrations/005_integrations.sql
- **token_expires_at**: TIMESTAMPTZ NULL
  - Source: server/migrations/007_publishing_jobs_and_logs.sql
- **status**: VARCHAR(20) NOT NULL DEFAULT NOT NULL DEFAULT 'connected'
  - Source: server/migrations/007_publishing_jobs_and_logs.sql
- **permissions**: TEXT[] NULL
  - Source: server/migrations/007_publishing_jobs_and_logs.sql
- **metadata**: JSONB NULL
  - Source: server/migrations/007_publishing_jobs_and_logs.sql
- **created_by**: UUID NULL
  - Source: server/migrations/007_publishing_jobs_and_logs.sql
- **created_at**: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT NULL DEFAULT CURRENT_TIMESTAMP
  - Source: supabase/migrations/005_integrations.sql
- **updated_at**: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT NULL DEFAULT CURRENT_TIMESTAMP
  - Source: supabase/migrations/005_integrations.sql
- **last_verified_at**: TIMESTAMPTZ NULL
  - Source: server/migrations/007_publishing_jobs_and_logs.sql
- **expires_at**: TIMESTAMP WITH TIME ZONE NULL
  - Source: supabase/migrations/005_integrations.sql
- **is_active**: BOOLEAN DEFAULT TRUE NULL DEFAULT TRUE
  - Source: supabase/migrations/005_integrations.sql
- **last_sync_at**: TIMESTAMP WITH TIME ZONE NULL
  - Source: supabase/migrations/005_integrations.sql
- **next_sync_at**: TIMESTAMP WITH TIME ZONE NULL
  - Source: supabase/migrations/005_integrations.sql
- **disconnected_at**: TIMESTAMP WITH TIME ZONE NULL
  - Source: supabase/migrations/005_integrations.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: platform_insights

### Columns found in SQL migrations (12 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/011_persistence_schema.sql
- **brand_id**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **platform**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **top_visual_style**: TEXT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **best_posting_time**: TEXT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **topic_affinity**: TEXT[] NOT NULL DEFAULT NOT NULL DEFAULT '{}'
  - Source: supabase/migrations/011_persistence_schema.sql
- **avg_engagement**: DECIMAL(4 NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **sample_size**: INTEGER NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **last_updated**: TIMESTAMP WITH TIME ZONE DEFAULT NOW NULL DEFAULT NOW()
  - Source: supabase/migrations/011_persistence_schema.sql
- **created_at**: TIMESTAMP WITH TIME ZONE DEFAULT NOW NULL DEFAULT NOW()
  - Source: supabase/migrations/011_persistence_schema.sql
- **INDEX**: idx NULL
  - Source: supabase/migrations/011_persistence_schema.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: platform_sync_logs

### Columns found in SQL migrations (22 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **brand_id**: UUID NOT NULL REFERENCES brands NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **tenant_id**: UUID NOT NULL NOT NULL
  - Source: server/migrations/007_publishing_jobs_and_logs.sql
- **platform**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **sync_type**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **status**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **items_synced**: INTEGER DEFAULT NULL DEFAULT 0
  - Source: server/migrations/007_publishing_jobs_and_logs.sql
- **items_failed**: INTEGER DEFAULT NULL DEFAULT 0
  - Source: server/migrations/007_publishing_jobs_and_logs.sql
- **started_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **completed_at**: TIMESTAMPTZ NULL
  - Source: server/migrations/007_publishing_jobs_and_logs.sql
- **duration_ms**: INTEGER NULL
  - Source: server/migrations/007_publishing_jobs_and_logs.sql
- **error_message**: TEXT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **error_details**: JSONB NULL
  - Source: server/migrations/007_publishing_jobs_and_logs.sql
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: server/migrations/007_publishing_jobs_and_logs.sql
- **finished_at**: TIMESTAMPTZ NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: post_approvals

### Columns found in SQL migrations (23 total):

- **rejection_reason**: TEXT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **brand_id**: UUID NOT NULL REFERENCES brands NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **post_id**: UUID NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **status**: TEXT NOT NULL DEFAULT NOT NULL DEFAULT 'pending'
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **approved_at**: TIMESTAMPTZ NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **approved_by**: UUID REFERENCES auth NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **rejected_at**: TIMESTAMP WITH TIME ZONE NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **rejected_by**: TEXT NULL
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **locked**: BOOLEAN DEFAULT FALSE NULL DEFAULT FALSE
  - Source: supabase/migrations/009_complete_schema_sync.sql
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **updated_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **post_id_uuid**: UUID NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **approved_by_uuid**: UUID REFERENCES auth NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: publish_job_analytics

### Columns found in SQL migrations (16 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **tenant_id**: UUID NOT NULL REFERENCES auth NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **publish_job_id**: UUID NOT NULL REFERENCES publish NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **views**: INT DEFAULT NULL DEFAULT 0
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **impressions**: INT DEFAULT NULL DEFAULT 0
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **likes**: INT DEFAULT NULL DEFAULT 0
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **comments**: INT DEFAULT NULL DEFAULT 0
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **shares**: INT DEFAULT NULL DEFAULT 0
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **saves**: INT DEFAULT NULL DEFAULT 0
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **clicks**: INT DEFAULT NULL DEFAULT 0
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **engagement_rate**: DECIMAL(5 NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **total_engagement**: INT DEFAULT NULL DEFAULT 0
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **snapshot_date**: DATE NOT NULL NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **data_freshness**: VARCHAR(50) DEFAULT NULL DEFAULT 'delayed'
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **created_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **updated_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/20241111_api_connector_schema.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: publish_job_errors

### Columns found in SQL migrations (9 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **publish_job_id**: UUID NOT NULL REFERENCES publish NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **error_code**: VARCHAR(100) NOT NULL NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **error_message**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **error_context**: JSONB NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **is_retryable**: BOOLEAN NOT NULL NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **retry_attempt_number**: INT NOT NULL NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **stack_trace**: TEXT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **created_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/20241111_api_connector_schema.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: publish_jobs

### Columns found in SQL migrations (25 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **tenant_id**: UUID NOT NULL REFERENCES auth NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **connection_id**: UUID NOT NULL REFERENCES connections NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **idempotency_key**: UUID NOT NULL DEFAULT gen NOT NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **content_type**: VARCHAR(50) NOT NULL NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **title**: VARCHAR(500) NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **body**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **media_urls**: TEXT[] NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **call_to_action**: JSONB NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **metadata**: JSONB DEFAULT NULL DEFAULT '{}'::JSONB
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **scheduled_for**: TIMESTAMP WITH TIME ZONE NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **publish_at**: TIMESTAMP WITH TIME ZONE NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **status**: VARCHAR(50) NOT NULL DEFAULT NOT NULL DEFAULT 'pending'
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **platform_post_id**: VARCHAR(255) NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **attempt_count**: INT NOT NULL DEFAULT NOT NULL DEFAULT 0
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **max_attempts**: INT NOT NULL DEFAULT NOT NULL DEFAULT 4
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **next_retry_at**: TIMESTAMP WITH TIME ZONE NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **last_error_code**: VARCHAR(50) NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **last_error_message**: TEXT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **error_history**: JSONB DEFAULT NULL DEFAULT '[]'::JSONB
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **dlq_reason**: TEXT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **dlq_at**: TIMESTAMP WITH TIME ZONE NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **created_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **updated_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **created_by**: VARCHAR(255) NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: publishing_jobs

### Columns found in SQL migrations (25 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **brand_id**: UUID NOT NULL REFERENCES brands NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **tenant_id**: UUID REFERENCES tenants NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **content**: JSONB NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **platforms**: TEXT[] NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **scheduled_at**: TIMESTAMPTZ NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **status**: TEXT NOT NULL DEFAULT NOT NULL DEFAULT 'pending'
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **retry_count**: INTEGER DEFAULT NULL DEFAULT 0
  - Source: server/migrations/007_publishing_jobs_and_logs.sql
- **max_retries**: INTEGER DEFAULT NULL DEFAULT 3
  - Source: server/migrations/007_publishing_jobs_and_logs.sql
- **published_at**: TIMESTAMPTZ NULL
  - Source: server/migrations/007_publishing_jobs_and_logs.sql
- **last_error**: TEXT NULL
  - Source: server/migrations/007_publishing_jobs_and_logs.sql
- **last_error_details**: JSONB NULL
  - Source: server/migrations/007_publishing_jobs_and_logs.sql
- **validation_results**: JSONB NULL
  - Source: server/migrations/007_publishing_jobs_and_logs.sql
- **created_by**: UUID NULL
  - Source: server/migrations/007_publishing_jobs_and_logs.sql
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **updated_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: publishing_logs

### Columns found in SQL migrations (23 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **job_id**: UUID NOT NULL REFERENCES publishing NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **brand_id**: UUID NOT NULL REFERENCES brands NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **platform**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **status**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **attempt_number**: INTEGER DEFAULT NULL DEFAULT 1
  - Source: server/migrations/007_publishing_jobs_and_logs.sql
- **platform_post_id**: TEXT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **platform_post_url**: TEXT NULL
  - Source: server/migrations/007_publishing_jobs_and_logs.sql
- **error_code**: VARCHAR(100) NULL
  - Source: server/migrations/007_publishing_jobs_and_logs.sql
- **error_message**: TEXT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **error_details**: JSONB NULL
  - Source: server/migrations/007_publishing_jobs_and_logs.sql
- **content_snapshot**: JSONB NULL
  - Source: server/migrations/007_publishing_jobs_and_logs.sql
- **request_metadata**: JSONB NULL
  - Source: server/migrations/007_publishing_jobs_and_logs.sql
- **response_metadata**: JSONB NULL
  - Source: server/migrations/007_publishing_jobs_and_logs.sql
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: queue_jobs_monitoring

### Columns found in SQL migrations (13 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **queue_name**: VARCHAR(100) NOT NULL NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **job_id**: UUID NOT NULL NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **state**: VARCHAR(50) NOT NULL NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **attempts**: INT DEFAULT NULL DEFAULT 0
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **max_attempts**: INT DEFAULT NULL DEFAULT 4
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **progress**: INT DEFAULT NULL DEFAULT 0
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **wait_time_ms**: INT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **process_time_ms**: INT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **total_time_ms**: INT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **error_message**: TEXT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **created_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **updated_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/20241111_api_connector_schema.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: rate_limit_buckets

### Columns found in SQL migrations (7 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **connection_id**: UUID NOT NULL REFERENCES connections NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **window_start**: TIMESTAMP WITH TIME ZONE NOT NULL NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **window_end**: TIMESTAMP WITH TIME ZONE NOT NULL NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **requests_count**: INT NOT NULL DEFAULT NOT NULL DEFAULT 0
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **limit_reset_at**: TIMESTAMP WITH TIME ZONE NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **created_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/20241111_api_connector_schema.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: strategy_briefs

### Columns found in SQL migrations (13 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/011_persistence_schema.sql
- **brand_id**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **request_id**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **cycle_id**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **version**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **positioning**: JSONB NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **voice**: JSONB NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **visual**: JSONB NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **competitive**: JSONB NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **created_at**: TIMESTAMP WITH TIME ZONE DEFAULT NOW NULL DEFAULT NOW()
  - Source: supabase/migrations/011_persistence_schema.sql
- **updated_at**: TIMESTAMP WITH TIME ZONE DEFAULT NOW NULL DEFAULT NOW()
  - Source: supabase/migrations/011_persistence_schema.sql
- **INDEX**: idx NULL
  - Source: supabase/migrations/011_persistence_schema.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: tenants

### Columns found in SQL migrations (5 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **name**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **plan**: TEXT DEFAULT NULL DEFAULT 'free'
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **updated_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: token_health

### Columns found in SQL migrations (11 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/011_persistence_schema.sql
- **brand_id**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **platform**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **token_type**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **status**: TEXT NOT NULL DEFAULT NOT NULL DEFAULT 'healthy'
  - Source: supabase/migrations/011_persistence_schema.sql
- **expires_at**: TIMESTAMP WITH TIME ZONE NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **last_verified**: TIMESTAMP WITH TIME ZONE DEFAULT NOW NULL DEFAULT NOW()
  - Source: supabase/migrations/011_persistence_schema.sql
- **error_message**: TEXT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **created_at**: TIMESTAMP WITH TIME ZONE DEFAULT NOW NULL DEFAULT NOW()
  - Source: supabase/migrations/011_persistence_schema.sql
- **INDEX**: idx NULL
  - Source: supabase/migrations/011_persistence_schema.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: user_preferences

### Columns found in SQL migrations (9 total):

- **id**: UUID PRIMARY KEY DEFAULT uuid NULL DEFAULT uuid_generate_v4()
  - Source: supabase/migrations/001_auth_and_users.sql
- **user_id**: UUID NOT NULL UNIQUE REFERENCES user NOT NULL
  - Source: supabase/migrations/001_auth_and_users.sql
- **theme**: VARCHAR(20) DEFAULT NULL DEFAULT 'system' CHECK (theme IN ('light'
  - Source: supabase/migrations/001_auth_and_users.sql
- **notifications_enabled**: BOOLEAN DEFAULT TRUE NULL DEFAULT TRUE
  - Source: supabase/migrations/001_auth_and_users.sql
- **email_digest**: VARCHAR(20) DEFAULT NULL DEFAULT 'daily' CHECK (email_digest IN ('daily'
  - Source: supabase/migrations/001_auth_and_users.sql
- **language**: VARCHAR(10) DEFAULT NULL DEFAULT 'en'
  - Source: supabase/migrations/001_auth_and_users.sql
- **timezone**: VARCHAR(100) DEFAULT NULL DEFAULT 'UTC'
  - Source: supabase/migrations/001_auth_and_users.sql
- **created_at**: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT NULL DEFAULT CURRENT_TIMESTAMP
  - Source: supabase/migrations/001_auth_and_users.sql
- **updated_at**: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT NULL DEFAULT CURRENT_TIMESTAMP
  - Source: supabase/migrations/001_auth_and_users.sql

### TypeScript type definitions (2 found):

- export interface UserPreferencesRecord { (/Users/krisfoust/Downloads/Aligned-20ai.posted/server/lib/preferences-db-service.ts)
- export interface UserPreferencesRecord { (/Users/krisfoust/Downloads/Aligned-20ai.posted/server/types/database.ts)

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: user_profiles

### Columns found in SQL migrations (9 total):

- **id**: UUID PRIMARY KEY DEFAULT uuid NULL DEFAULT uuid_generate_v4()
  - Source: supabase/migrations/001_auth_and_users.sql
- **email**: VARCHAR(255) UNIQUE NOT NULL NOT NULL
  - Source: supabase/migrations/001_auth_and_users.sql
- **first_name**: VARCHAR(100) NULL
  - Source: supabase/migrations/001_auth_and_users.sql
- **last_name**: VARCHAR(100) NULL
  - Source: supabase/migrations/001_auth_and_users.sql
- **avatar_url**: TEXT NULL
  - Source: supabase/migrations/001_auth_and_users.sql
- **is_active**: BOOLEAN DEFAULT TRUE NULL DEFAULT TRUE
  - Source: supabase/migrations/001_auth_and_users.sql
- **created_at**: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT NULL DEFAULT CURRENT_TIMESTAMP
  - Source: supabase/migrations/001_auth_and_users.sql
- **updated_at**: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT NULL DEFAULT CURRENT_TIMESTAMP
  - Source: supabase/migrations/001_auth_and_users.sql
- **last_sign_in_at**: TIMESTAMP WITH TIME ZONE NULL
  - Source: supabase/migrations/001_auth_and_users.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: users

### Columns found in SQL migrations (5 total):

- **trial_published_count**: INT DEFAULT NULL DEFAULT 0
  - Source: supabase/migrations/20250201_add_trial_support.sql
- **plan**: VARCHAR(50) DEFAULT NULL DEFAULT 'trial'
  - Source: supabase/migrations/20250201_add_trial_support.sql
- **trial_started_at**: TIMESTAMP WITH TIME ZONE NULL
  - Source: supabase/migrations/20250201_add_trial_support.sql
- **trial_expires_at**: TIMESTAMP WITH TIME ZONE NULL
  - Source: supabase/migrations/20250201_add_trial_support.sql
- **plan_status**: VARCHAR(50) DEFAULT NULL DEFAULT 'active'
  - Source: supabase/migrations/20250201_payment_status_tracking.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: webhook_attempts

### Columns found in SQL migrations (7 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **event_id**: UUID NOT NULL REFERENCES webhook NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **attempt_number**: INTEGER NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **status**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **response_code**: INTEGER NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **error_message**: TEXT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: webhook_events

### Columns found in SQL migrations (21 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **brand_id**: UUID REFERENCES brands NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **provider**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **event_type**: VARCHAR(100) NOT NULL NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **payload**: JSONB NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **idempotency_key**: VARCHAR(255) NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **status**: TEXT NOT NULL DEFAULT NOT NULL DEFAULT 'received'
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **created_at**: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **tenant_id**: UUID NOT NULL NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **platform_id**: UUID NOT NULL REFERENCES connector NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **webhook_signature**: VARCHAR(255) NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **signature_valid**: BOOLEAN NOT NULL DEFAULT false NOT NULL DEFAULT false
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **platform_event_id**: VARCHAR(255) NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **raw_payload**: JSONB NOT NULL NOT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **processed**: BOOLEAN NOT NULL DEFAULT false NOT NULL DEFAULT false
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **processed_at**: TIMESTAMP WITH TIME ZONE NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql
- **processing_error**: TEXT NULL
  - Source: supabase/migrations/20241111_api_connector_schema.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: webhook_logs

### Columns found in SQL migrations (10 total):

- **id**: UUID PRIMARY KEY DEFAULT uuid NULL DEFAULT uuid_generate_v4()
  - Source: supabase/migrations/005_integrations.sql
- **brand_id**: UUID NOT NULL REFERENCES brands NOT NULL
  - Source: supabase/migrations/005_integrations.sql
- **platform**: VARCHAR(50) NOT NULL NOT NULL
  - Source: supabase/migrations/005_integrations.sql
- **endpoint**: VARCHAR(255) NULL
  - Source: supabase/migrations/005_integrations.sql
- **event_type**: VARCHAR(100) NULL
  - Source: supabase/migrations/005_integrations.sql
- **payload**: JSONB NULL
  - Source: supabase/migrations/005_integrations.sql
- **status_code**: INTEGER NULL
  - Source: supabase/migrations/005_integrations.sql
- **response_time_ms**: INTEGER NULL
  - Source: supabase/migrations/005_integrations.sql
- **error_message**: TEXT NULL
  - Source: supabase/migrations/005_integrations.sql
- **created_at**: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT NULL DEFAULT CURRENT_TIMESTAMP
  - Source: supabase/migrations/005_integrations.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: weekly_summaries

### Columns found in SQL migrations (12 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/011_persistence_schema.sql
- **brand_id**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **week_start**: DATE NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **week_end**: DATE NOT NULL NOT NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **total_cycles**: INTEGER DEFAULT NULL DEFAULT 0
  - Source: supabase/migrations/011_persistence_schema.sql
- **avg_quality_score**: DECIMAL(4 NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **top_performers**: JSONB NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **success_patterns**: JSONB NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **recommendations**: JSONB NULL
  - Source: supabase/migrations/011_persistence_schema.sql
- **created_at**: TIMESTAMP WITH TIME ZONE DEFAULT NOW NULL DEFAULT NOW()
  - Source: supabase/migrations/011_persistence_schema.sql
- **INDEX**: idx NULL
  - Source: supabase/migrations/011_persistence_schema.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: workflow_instances

### Columns found in SQL migrations (8 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **template_id**: UUID REFERENCES workflow NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **brand_id**: UUID NOT NULL REFERENCES brands NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **status**: TEXT NOT NULL DEFAULT NOT NULL DEFAULT 'active'
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **current_step**: INTEGER DEFAULT NULL DEFAULT 0
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **context**: JSONB DEFAULT NULL DEFAULT '{}'::jsonb
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **updated_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: workflow_notifications

### Columns found in SQL migrations (7 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **instance_id**: UUID REFERENCES workflow NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **user_id**: UUID REFERENCES auth NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **type**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **message**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **read_at**: TIMESTAMPTZ NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

## TABLE: workflow_templates

### Columns found in SQL migrations (6 total):

- **id**: UUID PRIMARY KEY DEFAULT gen NULL DEFAULT gen_random_uuid()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **brand_id**: UUID NOT NULL REFERENCES brands NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **name**: TEXT NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **steps**: JSONB NOT NULL NOT NULL
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql
- **updated_at**: TIMESTAMPTZ NOT NULL DEFAULT NOW NOT NULL DEFAULT NOW()
  - Source: supabase/migrations/012_canonical_schema_alignment.sql

### TypeScript type definitions (0 found):

_No TypeScript types found matching this table_

### Code references (0 found):

_No code references found (table may not be used yet)_

---

