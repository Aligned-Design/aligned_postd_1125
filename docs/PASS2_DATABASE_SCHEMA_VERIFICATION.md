# Pass 2: Database Schema Verification

This document provides SQL queries to verify that all database tables accessed by the services we fixed in Pass 2 have the correct column names and types.

## Purpose

After fixing TypeScript errors in Pass 2, we introduced new interfaces and type definitions. This verification ensures:

1. All columns we access in code actually exist in the database
2. Column types match what we expect (numbers vs text vs jsonb)
3. Our TypeScript interfaces align with the actual database schema

---

## Tables to Verify

### 1. Publishing Tables

#### `publishing_jobs`
**Service**: `server/lib/publishing-db-service.ts`  
**Interface**: `PublishingJobRecord`

```sql
-- Verify table exists and check column structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'publishing_jobs'
ORDER BY ordinal_position;

-- Sample query to verify data access
SELECT 
  id,
  brand_id,
  tenant_id,
  content,
  platforms,
  scheduled_at,
  status,
  retry_count,
  max_retries,
  published_at,
  last_error,
  last_error_details,
  validation_results,
  created_at,
  updated_at
FROM publishing_jobs 
LIMIT 1;
```

**Expected Columns** (from `PublishingJobRecord`):
- `id` (string/uuid)
- `brand_id` (string/uuid)
- `tenant_id` (string/uuid)
- `content` (jsonb or json)
- `platforms` (text[] or jsonb)
- `scheduled_at` (timestamp)
- `status` (text - enum: "pending" | "processing" | "published" | "failed" | "scheduled")
- `retry_count` (integer)
- `max_retries` (integer)
- `published_at` (timestamp, nullable)
- `last_error` (text, nullable)
- `last_error_details` (jsonb, nullable)
- `validation_results` (jsonb[], nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `publishing_logs`
**Service**: `server/lib/publishing-db-service.ts`  
**Interface**: `PublishingLogRecord`

```sql
-- Verify table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'publishing_logs'
ORDER BY ordinal_position;

-- Sample query to verify data access
SELECT 
  id,
  job_id,
  brand_id,
  platform,
  status,
  attempt_number,
  platform_post_id,
  platform_post_url,
  error_code,
  error_message,
  error_details,
  content_snapshot,
  request_metadata,
  response_metadata,
  created_at
FROM publishing_logs 
LIMIT 1;
```

**Expected Columns** (from `PublishingLogRecord`):
- `id` (string/uuid)
- `job_id` (string/uuid)
- `brand_id` (string/uuid)
- `platform` (text)
- `status` (text)
- `attempt_number` (integer)
- `platform_post_id` (text, nullable)
- `platform_post_url` (text, nullable)
- `error_code` (text, nullable)
- `error_message` (text, nullable)
- `error_details` (jsonb, nullable)
- `content_snapshot` (jsonb, nullable)
- `request_metadata` (jsonb, nullable)
- `response_metadata` (jsonb, nullable)
- `created_at` (timestamp)

**Platform Stats Query** (used in `getPlatformStats`):
```sql
-- This is the actual query we use - verify it works
SELECT 
  platform, 
  status
FROM publishing_logs
WHERE brand_id = 'some-brand-id'
  AND created_at >= '2024-01-01'::timestamp
LIMIT 10;
```

---

### 2. User Preferences

#### `user_preferences`
**Service**: `server/lib/preferences-db-service.ts`  
**Interface**: `UserPreferencesRecord`

```sql
-- Verify table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_preferences'
ORDER BY ordinal_position;

-- Sample query to verify data access
SELECT 
  id,
  user_id,
  brand_id,
  preferences,
  created_at,
  updated_at
FROM user_preferences 
LIMIT 1;

-- Verify preferences JSON structure
SELECT 
  user_id,
  brand_id,
  preferences->'notifications' as notifications,
  preferences->'ui' as ui,
  preferences->'publishing' as publishing,
  preferences->'analytics' as analytics
FROM user_preferences 
LIMIT 1;
```

**Expected Columns**:
- `id` (string/uuid)
- `user_id` (string/uuid)
- `brand_id` (string/uuid)
- `preferences` (jsonb) - should contain nested structure:
  - `notifications` object
  - `ui` object
  - `publishing` object
  - `analytics` object
- `created_at` (timestamp)
- `updated_at` (timestamp)

---

### 3. Client Settings

#### `client_settings`
**Service**: `server/routes/client-settings.ts` (via `dbClient.ts`)  
**Interface**: `ClientSettingsRecord`

```sql
-- Verify table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'client_settings'
ORDER BY ordinal_position;

-- Sample query to verify data access
SELECT 
  id,
  client_id,
  brand_id,
  email_preferences,
  timezone,
  language,
  unsubscribe_token,
  unsubscribed_from_all,
  unsubscribed_types,
  created_at,
  updated_at,
  last_modified_by
FROM client_settings 
LIMIT 1;
```

**Expected Columns** (from `ClientSettingsRecord`):
- `id` (string/uuid)
- `client_id` (string/uuid)
- `brand_id` (string/uuid)
- `email_preferences` (jsonb)
- `timezone` (text)
- `language` (text - enum: 'en' | 'es' | 'fr' | 'de')
- `unsubscribe_token` (text, nullable)
- `unsubscribed_from_all` (boolean)
- `unsubscribed_types` (text[] or jsonb)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `last_modified_by` (text/uuid, nullable)

---

### 4. Client Portal Content

#### `content`
**Service**: `server/lib/client-portal-db-service.ts`  
**Interface**: `ClientDashboardContentRecord`

```sql
-- Verify table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'content'
ORDER BY ordinal_position;

-- Sample query to verify data access
SELECT 
  id,
  brand_id,
  platform,
  content,
  status,
  published_at,
  scheduled_for,
  thumbnail,
  metrics,
  compliance_badges,
  version,
  approval_required,
  created_at,
  updated_at
FROM content 
LIMIT 1;
```

**Expected Columns**:
- `id` (string/uuid)
- `brand_id` (string/uuid)
- `platform` (text)
- `content` (text or jsonb)
- `status` (text - enum: "draft" | "scheduled" | "published" | "in_review")
- `published_at` (timestamp, nullable)
- `scheduled_for` (timestamp, nullable)
- `thumbnail` (text, nullable)
- `metrics` (jsonb) - should have: reach, engagement, likes, comments, shares
- `compliance_badges` (text[] or jsonb)
- `version` (integer)
- `approval_required` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Status Query** (used in `getContentForClientPortal`):
```sql
-- Verify status filtering works
SELECT * FROM content
WHERE brand_id = 'some-brand-id'
  AND status IN ('draft', 'scheduled', 'published', 'in_review')
LIMIT 10;
```

---

### 5. Platform Connections (Pass 1)

#### `platform_connections`
**Service**: `server/lib/connections-db-service.ts` (fixed in Pass 1)  
**Interface**: `PlatformConnectionRecord`

```sql
-- Verify table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'platform_connections'
ORDER BY ordinal_position;

-- Sample query to verify data access
SELECT 
  id,
  brand_id,
  tenant_id,
  platform,
  access_token,
  refresh_token,
  token_expires_at,
  expires_at,
  last_verified_at,
  permissions,
  metadata,
  connected_at,
  disconnected_at,
  created_at,
  updated_at
FROM platform_connections 
LIMIT 1;
```

**Expected Columns** (from Pass 1 additions):
- `id` (string/uuid)
- `brand_id` (string/uuid)
- `tenant_id` (string/uuid, nullable)
- `platform` (text)
- `access_token` (text, encrypted)
- `refresh_token` (text, nullable, encrypted)
- `token_expires_at` (timestamp, nullable) - **Added in Pass 1**
- `expires_at` (timestamp, nullable) - alternative name
- `last_verified_at` (timestamp, nullable) - **Added in Pass 1**
- `permissions` (text[] or jsonb, nullable) - **Added in Pass 1**
- `metadata` (jsonb, nullable) - **Added in Pass 1**
- `connected_at` (timestamp)
- `disconnected_at` (timestamp, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

---

## Verification Checklist

Run these queries in your Supabase SQL editor or database client:

- [ ] **publishing_jobs** - All columns from `PublishingJobRecord` exist
- [ ] **publishing_logs** - All columns from `PublishingLogRecord` exist
- [ ] **user_preferences** - `preferences` column is jsonb with expected structure
- [ ] **client_settings** - All columns from `ClientSettingsRecord` exist
- [ ] **content** - All columns from `ClientDashboardContentRecord` exist
- [ ] **platform_connections** - All columns including Pass 1 additions exist

### Column Type Verification

For each table, verify:
- [ ] UUID columns are type `uuid` (not `text`)
- [ ] JSON data is stored as `jsonb` (not `json` or `text`)
- [ ] Arrays are stored as `text[]` or `jsonb` (not `text`)
- [ ] Timestamps are type `timestamp` or `timestamptz`
- [ ] Boolean columns are type `boolean` (not `text` or `integer`)

### Data Type Examples

```sql
-- Check actual data types from sample rows
SELECT 
  pg_typeof(id) as id_type,
  pg_typeof(brand_id) as brand_id_type,
  pg_typeof(content) as content_type,
  pg_typeof(platforms) as platforms_type,
  pg_typeof(status) as status_type,
  pg_typeof(created_at) as created_at_type
FROM publishing_jobs 
LIMIT 1;
```

---

## Common Issues to Watch For

1. **Snake_case vs camelCase**: Our TypeScript interfaces use camelCase (e.g., `brandId`), but database columns are snake_case (e.g., `brand_id`). Supabase handles this mapping automatically.

2. **JSONB vs JSON**: Prefer `jsonb` for better query performance. Our code expects `Record<string, unknown>` which maps to `jsonb`.

3. **Array Types**: PostgreSQL arrays (`text[]`) vs JSON arrays in `jsonb`. Check which format your tables use.

4. **Nullable Columns**: Many optional fields in our interfaces should be nullable in the database.

5. **Enum Constraints**: Status fields should have CHECK constraints or be enforced at the application level.

---

## Next Steps

After verifying schema:

1. ✅ Document any discrepancies found
2. ✅ Update TypeScript interfaces if schema differs
3. ✅ Create migration scripts if columns are missing
4. ✅ Run runtime smoke tests (see `docs/PASS2_RUNTIME_SMOKE_TESTS.md`)

---

## Notes

- Weekly Summary service (`weekly-summary.ts`) processes in-memory `PerformanceLog` and `BrandHistory` objects, not direct database queries, so no schema verification needed for those.
- Client Portal also uses `content_comments` table - not extensively modified in Pass 2, but worth verifying if issues arise.
