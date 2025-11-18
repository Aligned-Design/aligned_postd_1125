# Schema Alignment Summary

## Migration File
**`supabase/migrations/012_canonical_schema_alignment.sql`**

## Overview
This migration aligns the Supabase database schema to the canonical Postd schema, ensuring all app features have a clear home in the database.

## Key Schema Changes

### 1. Core Identity & Access

#### Tenants Table (NEW)
- **Purpose**: Workspace/tenant management
- **Key Fields**: `id`, `name`, `plan`, `created_at`, `updated_at`
- **Status**: ✅ Created

#### Brands Table (UPDATED)
- **Added Columns**:
  - `tenant_id` - References tenants table (workspace isolation)
  - `created_by` - References auth.users (who created the brand)
  - `website_url` - Website URL for crawler
  - `scraped_at` - Timestamp of last successful scrape
  - `scraper_status` - Status: never_run, running, completed, failed
  - `brand_kit` - JSONB (colors, fonts, logos, etc.)
  - `voice_summary` - TEXT/JSONB (voice & tone data)
  - `visual_summary` - TEXT/JSONB (visual identity data)
  - `slug` - Unique slug for brand
- **Backward Compatibility**: `workspace_id` is kept as alias to `tenant_id`
- **Status**: ✅ Updated

#### Brand Members Table (UPDATED)
- **Fixed**: Now references `auth.users` (not `user_profiles`)
- **Key Fields**: `user_id`, `brand_id`, `role`, `created_at`, `updated_at`
- **Status**: ✅ Fixed foreign key references

### 2. Media Management

#### Media Assets Table (NEW)
- **Purpose**: Metadata for all media files (including scraped images)
- **Key Fields**: 
  - `brand_id`, `tenant_id`
  - `category`, `filename`, `path`, `hash`
  - `mime_type`, `size_bytes`
  - `used_in` (TEXT[]), `usage_count`
  - `metadata` (JSONB) - includes `source: 'scrape'` for crawler images
- **Status**: ✅ Created

#### Media Usage Logs Table (NEW)
- **Purpose**: Audit trail for media usage
- **Key Fields**: `asset_id`, `brand_id`, `used_in`, `used_by_user`, `context`
- **Status**: ✅ Created

#### Storage Quotas Table (NEW)
- **Purpose**: Track storage usage per brand
- **Key Fields**: `brand_id`, `tenant_id`, `limit_bytes`, `used_bytes`
- **Status**: ✅ Created

### 3. Publishing & OAuth

#### Publishing Jobs Table (NEW)
- **Purpose**: Content publishing queue
- **Key Fields**: `brand_id`, `tenant_id`, `content` (JSONB), `platforms` (TEXT[]), `status`, `scheduled_at`
- **Status**: ✅ Created

#### Publishing Logs Table (NEW)
- **Purpose**: Track publishing results
- **Key Fields**: `job_id`, `brand_id`, `platform`, `status`, `platform_post_id`, `error_message`
- **Status**: ✅ Created

#### Platform Connections Table (UPDATED)
- **Added**: `status` column (was using `is_active` boolean)
- **Status**: ✅ Updated

#### Platform Sync Logs Table (NEW)
- **Purpose**: Track platform sync operations
- **Key Fields**: `brand_id`, `platform`, `sync_type`, `status`, `error_message`
- **Status**: ✅ Created

### 4. Analytics & Advisor

#### Analytics Metrics Table (UPDATED)
- **Added**: `brand_id`, `date`, `metrics` (JSONB)
- **Migration**: Existing columns (impressions, reach, etc.) migrated to `metrics` JSONB
- **Status**: ✅ Updated with data migration

#### Analytics Sync Logs Table (NEW)
- **Purpose**: Track analytics sync operations
- **Status**: ✅ Created

#### Analytics Goals Table (NEW)
- **Purpose**: Track analytics goals per brand
- **Status**: ✅ Created

#### Advisor Feedback Table (NEW)
- **Purpose**: Store advisor agent feedback
- **Status**: ✅ Created

#### Auto Plans Table (NEW)
- **Purpose**: Store auto-generated content plans
- **Status**: ✅ Created

### 5. Approvals, Client Settings & Compliance

#### Client Settings Table (UPDATED)
- **Fixed**: `client_id` now references `auth.users` (not `user_profiles`)
- **Added**: `email_preferences`, `timezone`, `unsubscribe_token`
- **Status**: ✅ Updated

#### Post Approvals Table (UPDATED)
- **Fixed**: `post_id` is now UUID (was TEXT in some migrations)
- **Fixed**: `approved_by` references `auth.users`
- **Added**: `rejection_reason`
- **Status**: ✅ Updated

#### Audit Logs Table (UPDATED)
- **Fixed**: `user_id` now references `auth.users`
- **Renamed**: `changes` → `metadata` (JSONB)
- **Status**: ✅ Updated

#### Webhook Events Table (NEW)
- **Purpose**: Store incoming webhook events
- **Status**: ✅ Created

#### Webhook Attempts Table (NEW)
- **Purpose**: Track webhook delivery attempts
- **Status**: ✅ Created

#### Escalation Rules Table (NEW)
- **Purpose**: Define escalation rules for approvals
- **Status**: ✅ Created

#### Escalation Events Table (NEW)
- **Purpose**: Track escalation events
- **Status**: ✅ Created

### 6. Content & Creative Studio

#### Content Items Table (UPDATED)
- **Renamed**: `content_type` → `type`
- **Added**: `content` JSONB (migrated from `body` TEXT)
- **Fixed**: `created_by` references `auth.users`
- **Status**: ✅ Updated with data migration

#### Scheduled Content Table (NEW)
- **Purpose**: Track scheduled content posts
- **Key Fields**: `brand_id`, `content_id`, `scheduled_at`, `platforms`, `status`
- **Status**: ✅ Created

### 7. Workflow & Notifications

#### Workflow Templates Table (NEW)
- **Purpose**: Store workflow templates
- **Status**: ✅ Created

#### Workflow Instances Table (NEW)
- **Purpose**: Track active workflow instances
- **Status**: ✅ Created

#### Workflow Notifications Table (NEW)
- **Purpose**: Notifications for workflow steps
- **Status**: ✅ Created

## Indexes Added

- `idx_brand_members_user` - Fast user lookup
- `idx_brand_members_brand` - Fast brand lookup
- `idx_media_assets_brand` - Fast brand media lookup
- `idx_media_assets_tenant` - Fast tenant media lookup
- `idx_publishing_jobs_brand` - Fast brand publishing lookup
- `idx_publishing_jobs_status` - Fast status filtering
- `idx_analytics_metrics_brand_date` - Fast analytics queries
- `idx_analytics_metrics_brand_platform` - Fast platform analytics
- `idx_content_items_brand` - Fast brand content lookup
- `idx_content_items_status` - Fast status filtering
- `idx_scheduled_content_brand` - Fast scheduled content lookup
- `idx_scheduled_content_scheduled_at` - Fast date range queries
- `idx_brands_tenant_id` - Fast tenant brand lookup
- `idx_brands_created_by` - Fast creator lookup
- `idx_brands_website_url` - Fast website lookup
- `idx_brands_scraper_status` - Fast scraper status filtering

## RLS Policies Added

- Basic SELECT policies for brand-scoped tables (media_assets, publishing_jobs, content_items, analytics_metrics)
- Policies ensure users can only access data for brands they're members of
- Full RLS policies should be in `20250120_enhanced_security_rls.sql`

## Data Migrations

1. **Analytics Metrics**: Migrated from individual columns (impressions, reach, etc.) to `metrics` JSONB
2. **Content Items**: Migrated `body` TEXT to `content` JSONB
3. **Brand Members**: Fixed foreign key from `user_profiles` to `auth.users`
4. **Client Settings**: Fixed foreign key from `user_profiles` to `auth.users`
5. **Post Approvals**: Converted TEXT IDs to UUIDs where applicable
6. **Brands**: Sync `workspace_id` with `tenant_id` for backward compatibility

## Backward Compatibility

- `workspace_id` is kept in brands table as alias to `tenant_id`
- Existing data is migrated where possible
- Foreign key constraints are updated, not dropped (preserves data)

## Known Gaps / TODOs

### Tables Not in Canonical Schema (Still Used by App)

1. **`user_profiles`** - User profile data (separate from auth.users)
   - **Status**: Kept for backward compatibility
   - **Action**: May need to deprecate in favor of auth.users metadata

2. **`user_preferences`** - User preferences
   - **Status**: Kept for backward compatibility
   - **Action**: Consider merging into user_profiles or auth.users metadata

3. **`brand_assets`** - Brand asset files (different from media_assets)
   - **Status**: Kept for backward compatibility
   - **Action**: Consider consolidating with media_assets

4. **`content_packages`** - AI-generated content packages (from 011_persistence_schema.sql)
   - **Status**: Used by onboarding and AI pipeline
   - **Action**: Keep - this is part of the AI orchestration system

5. **`strategy_briefs`** - Strategy briefs (from 011_persistence_schema.sql)
   - **Status**: Used by AI pipeline
   - **Action**: Keep - this is part of the AI orchestration system

6. **`brand_history`** - Brand history log (from 011_persistence_schema.sql)
   - **Status**: Used by AI learning loop
   - **Action**: Keep - this is part of the AI orchestration system

7. **`generation_logs`** - AI generation logs (from archived migrations)
   - **Status**: Used by publishing approval flow
   - **Action**: Keep - needed for approval workflow

8. **`notifications`** - User notifications (from 007_client_portal_and_audit.sql)
   - **Status**: Different from workflow_notifications
   - **Action**: Keep - general notifications vs workflow-specific

### Code Updates Needed

1. **Standardize on `tenant_id`**: Some code still uses `workspace_id` - should standardize
2. **Update foreign key references**: Ensure all code references `auth.users` not `user_profiles` for user IDs
3. **Update analytics queries**: Code should use `metrics` JSONB instead of individual columns
4. **Update content queries**: Code should use `content` JSONB instead of `body` TEXT

## Testing Checklist

After applying migration:

- [ ] Signup works (Supabase auth)
- [ ] Brand row is created with `tenant_id` and `created_by`
- [ ] Brand members entry is created
- [ ] Crawler writes scraped data to `media_assets` with `source='scrape'`
- [ ] Brand snapshot reads from `brands.brand_kit` and `media_assets`
- [ ] Publishing jobs are created in `publishing_jobs` table
- [ ] Analytics metrics are stored in `analytics_metrics` with `metrics` JSONB
- [ ] Content items use `content` JSONB instead of `body` TEXT
- [ ] All foreign keys reference `auth.users` (not `user_profiles`)

## Migration Safety

- ✅ All DDL is idempotent (IF NOT EXISTS, ADD COLUMN IF NOT EXISTS)
- ✅ Data migrations preserve existing data
- ✅ Foreign key updates don't drop data
- ✅ Backward compatibility maintained (`workspace_id` alias)
- ⚠️ Some data type conversions (TEXT → UUID) may fail for invalid data
- ⚠️ Analytics metrics migration requires existing data to be valid

## Next Steps

1. Apply migration to Supabase database
2. Test onboarding flow with fresh user
3. Verify all foreign keys point to correct tables
4. Update server code to use standardized column names
5. Remove `workspace_id` once all code uses `tenant_id`

