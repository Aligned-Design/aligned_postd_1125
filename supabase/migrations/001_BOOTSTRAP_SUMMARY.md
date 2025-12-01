# Bootstrap Migration Summary

**File**: `001_bootstrap_schema.sql`  
**Date**: 2025-01-XX  
**Purpose**: Single authoritative baseline migration for brand-new Supabase project

---

## ✅ What's Included

### 1. Extensions
- ✅ `uuid-ossp` - For UUID generation
- ✅ `pgcrypto` - For `gen_random_uuid()` and cryptographic functions

### 2. Helper Functions
- ✅ `update_updated_at()` - Trigger function for updating `updated_at` timestamps
- ✅ `is_brand_member_text(brand_id_param TEXT)` - Checks brand membership for TEXT brand_id columns (persistence schema)
- ✅ `is_workspace_member(workspace_id_param TEXT)` - Checks workspace membership via brands → brand_members

### 3. Tables Created (50+ tables)

#### Core / Multi-Tenant (5 tables)
- ✅ `tenants` - Workspace/tenant management
- ✅ `user_profiles` - User identity
- ✅ `user_preferences` - User settings
- ✅ `brands` - Brand/agency entities
- ✅ `brand_members` - User-brand access control

#### Content / Studio (4 tables)
- ✅ `content_items` - Primary content storage
- ✅ `scheduled_content` - Content scheduling
- ✅ `publishing_jobs` - Publishing queue
- ✅ `publishing_logs` - Publishing history

#### Approvals / Workflows (5 tables)
- ✅ `post_approvals` - Content approval tracking
- ✅ `approval_threads` - Approval comments
- ✅ `workflow_templates` - Workflow definitions
- ✅ `workflow_instances` - Active workflows
- ✅ `escalation_rules` - Escalation configuration
- ✅ `escalation_events` - Triggered escalations

#### Client Portal / Audit (6 tables)
- ✅ `client_settings` - Client preferences
- ✅ `client_comments` - Client feedback
- ✅ `client_media` - Client uploads
- ✅ `audit_logs` - Activity audit trail
- ✅ `notifications` - User notifications
- ✅ `notification_preferences` - Notification settings

#### Integrations / OAuth (6 tables)
- ✅ `platform_connections` - OAuth tokens
- ✅ `platform_sync_logs` - Sync history
- ✅ `webhook_events` - Webhook processing
- ✅ `webhook_attempts` - Webhook retries
- ✅ `integration_events` - Integration webhooks
- ✅ `webhook_logs` - Webhook debugging

#### Analytics / Metrics (5 tables)
- ✅ `analytics_metrics` - Performance data
- ✅ `analytics_sync_logs` - Sync tracking
- ✅ `analytics_goals` - Goal tracking
- ✅ `advisor_feedback` - AI advisor feedback
- ✅ `auto_plans` - Auto-generated plans

#### Media & Assets (5 tables)
- ✅ `media_assets` - Media metadata
- ✅ `media_usage_logs` - Asset usage tracking
- ✅ `brand_assets` - Brand media assets
- ✅ `assets` - General asset storage (legacy)
- ✅ `storage_quotas` - Storage limits per brand

#### Persistence / Learning Loop (10 tables)
- ✅ `strategy_briefs` - AI strategy briefs (brand_id TEXT)
- ✅ `content_packages` - Content packages (brand_id TEXT)
- ✅ `brand_history` - Brand activity log (brand_id TEXT)
- ✅ `brand_success_patterns` - Success patterns (brand_id TEXT)
- ✅ `collaboration_logs` - Agent collaboration (brand_id TEXT)
- ✅ `performance_logs` - Performance tracking (brand_id TEXT)
- ✅ `platform_insights` - Platform insights (brand_id TEXT)
- ✅ `token_health` - OAuth token health (brand_id TEXT)
- ✅ `weekly_summaries` - Weekly reports (brand_id TEXT)
- ✅ `advisor_review_audits` - Advisor reviews (brand_id TEXT)

#### Milestones (1 table)
- ✅ `milestones` - User milestone tracking (workspace_id TEXT)

#### Payments / Billing (3 tables)
- ✅ `payment_attempts` - Payment history
- ✅ `archived_data` - Archived user data (90-day retention)
- ✅ `payment_notifications` - Payment emails

**Total**: 50+ tables across 11 functional categories

---

## 🔒 RLS Policies Implemented

### Phase 1 Critical Tables (Full RLS)

#### milestones
- ✅ **SELECT**: Workspace members can view milestones for their workspace
- ✅ **INSERT**: Service role OR brand owners/admins for that workspace
- ✅ **UPDATE**: Workspace members can acknowledge milestones

#### strategy_briefs (brand_id TEXT)
- ✅ **SELECT**: Brand members OR brand creator
- ✅ **INSERT**: Service role OR brand owners/admins
- ✅ **UPDATE**: Brand owners/admins only
- ✅ **DELETE**: Brand owners/admins only

#### content_packages (brand_id TEXT)
- ✅ **SELECT**: Brand members OR brand creator
- ✅ **INSERT**: Service role OR brand members with role IN ('owner','admin','editor','creator')
- ✅ **UPDATE**: Brand members for that brand
- ✅ **DELETE**: Brand owners/admins only

#### brand_history (brand_id TEXT, immutable)
- ✅ **SELECT**: Brand members OR brand creator
- ✅ **INSERT**: Service role OR brand owners/admins
- ❌ **UPDATE/DELETE**: None (immutable audit log)

#### payment_attempts
- ✅ **SELECT**: Users can view their own payment attempts only
- ✅ **INSERT**: Service role OR user_id = auth.uid()
- ✅ **UPDATE**: Service role OR user_id = auth.uid()

#### archived_data
- ✅ **SELECT**: Users can view own data OR brand members (if brand_id present)
- ✅ **INSERT**: Service role only
- ✅ **UPDATE**: Service role only (for restoration flags)

### Phase 1 Medium Priority Tables

#### tenants
- ✅ **SELECT**: Users can view tenants they belong to via brands → brand_members
- ✅ **INSERT**: Service role only
- ✅ **UPDATE**: Service role only
- ✅ **DELETE**: Service role only

#### brand_success_patterns (brand_id TEXT)
- ✅ **SELECT**: Brand members
- ✅ **ALL**: Service role OR brand owners/admins

#### collaboration_logs (brand_id TEXT, immutable)
- ✅ **SELECT**: Brand members
- ✅ **INSERT**: Service role only
- ❌ **UPDATE/DELETE**: None (immutable log)

#### performance_logs (brand_id TEXT, immutable)
- ✅ **SELECT**: Brand members
- ✅ **INSERT**: Service role only
- ❌ **UPDATE/DELETE**: None (immutable log)

#### platform_insights (brand_id TEXT)
- ✅ **SELECT**: Brand members
- ✅ **ALL**: Service role OR brand owners/admins

#### token_health (brand_id TEXT, sensitive)
- ✅ **SELECT**: Brand members
- ✅ **ALL**: Service role OR brand owners/admins

#### weekly_summaries (brand_id TEXT)
- ✅ **SELECT**: Brand members
- ✅ **ALL**: Service role only

#### advisor_review_audits (brand_id TEXT, immutable)
- ✅ **SELECT**: Brand members
- ✅ **INSERT**: Service role only
- ❌ **UPDATE/DELETE**: None (immutable log)

### Core Tables (Existing Good RLS - Reproduced)

All core tables have proper RLS policies:
- ✅ `user_profiles` - Own data only
- ✅ `user_preferences` - Own data only
- ✅ `brands` - Brand members can view/manage
- ✅ `brand_members` - Users can view own memberships; admins can manage
- ✅ `content_items` - Brand members only
- ✅ `post_approvals` - Brand members only
- ✅ `client_settings` - Clients + admins
- ✅ `audit_logs` - Admins only
- ✅ `platform_connections` - Brand members view, admins manage
- ✅ `analytics_metrics` - Brand members only
- ✅ `publishing_jobs` - Brand members only
- ✅ `notifications` - Own notifications only
- ✅ And all other core tables...

---

## 🔧 Technical Decisions

### 1. Service Role Pattern
- ✅ **Used**: `auth.role() = 'service_role'` consistently
- ❌ **Not Used**: Magic UUID patterns like `'00000000-0000-0000-0000-000000000000'`

### 2. Type Preservation
- ✅ **Preserved**: All TEXT brand_id columns remain TEXT (no migrations)
- ✅ **Preserved**: All existing column types as documented in schema map
- ❌ **No Conversions**: No `ALTER TABLE ... TYPE` statements

### 3. Foreign Keys
- ✅ **Included**: Only FKs explicitly documented in schema map
- ❌ **Not Added**: No new FK constraints beyond documented schema

### 4. Indexes
- ✅ **Included**: All indexes documented in schema map
- ✅ **Composite Indexes**: Included where specified (e.g., `brands_slug_tenant_unique`)

### 5. Constraints
- ✅ **PRIMARY KEY**: All tables have UUID primary keys
- ✅ **UNIQUE**: All unique constraints from schema map
- ✅ **CHECK**: All check constraints (e.g., status enums, theme values)

---

## 📋 Assumptions Made

1. **Empty Database**: Migration assumes empty Supabase project (safe to run with `IF NOT EXISTS`)

2. **auth.users Table**: Assumes Supabase's built-in `auth.users` table exists (standard in Supabase)

3. **Service Role**: Assumes `auth.role() = 'service_role'` is the correct way to check for service role access (Supabase standard)

4. **TEXT brand_id**: Assumes persistence schema tables with TEXT brand_id are intentional and should remain TEXT (no migration)

5. **workspace_id vs tenant_id**: Assumes `workspace_id` is backward compatibility alias for `tenant_id` (handled via COALESCE in policies)

6. **No user_profiles.role**: Assumes `user_profiles.role` column does not exist (no admin checks based on role column)

7. **Brand Member Roles**: Assumes standard roles: 'owner', 'admin', 'editor', 'creator', 'member'

---

## ⚠️ Notes & Warnings

1. **Persistence Schema Tables**: 10 tables use `brand_id TEXT` instead of UUID. These are handled via `is_brand_member_text()` helper function.

2. **No Admin Role Check**: Payment and archived data tables do NOT have admin-only policies because `user_profiles.role` is not assumed to exist. If admin access is needed, add after verifying role column exists.

3. **Immutable Logs**: Several tables (brand_history, collaboration_logs, performance_logs, advisor_review_audits) are immutable - no UPDATE/DELETE policies.

4. **Service Role Required**: Many INSERT operations require service role. Ensure backend uses service role key for system operations.

5. **Workspace Mapping**: Milestones table uses `workspace_id TEXT` which maps to brands via `COALESCE(b.workspace_id, b.tenant_id::text)`.

---

## ✅ Verification Checklist

- [x] All tables from SUPABASE_SCHEMA_MAP.md included
- [x] All indexes from schema map included
- [x] All constraints from schema map included
- [x] Phase 1 RLS policies from RLS_SECURITY_PLAN.md implemented
- [x] Helper functions for TEXT brand_id support included
- [x] Service role pattern used (not magic UUIDs)
- [x] No type conversions (TEXT remains TEXT)
- [x] No new FK constraints beyond documented schema
- [x] All triggers for updated_at columns included
- [x] Safe to run on empty database (IF NOT EXISTS used)

---

## 🧪 RLS Verification Tests

After applying the migration, verify RLS policies using the provided test suite:

### SQL Test File

**File**: `supabase/tests/rls_phase1_verification.sql`

**How to Run**:
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the entire contents of `rls_phase1_verification.sql`
3. Click "Run" to execute
4. The script will:
   - ✅ Verify RLS is enabled on all Phase 1 tables
   - ✅ Seed minimal test data (idempotent)
   - ✅ Provide manual test queries for each RLS policy

**Manual Testing**:
The SQL file includes commented test queries. To test a specific scenario:
1. Set user context:
   ```sql
   SET LOCAL ROLE authenticated;
   SELECT set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', false);
   ```
2. Run the test query (e.g., `SELECT COUNT(*) FROM payment_attempts;`)
3. Verify the expected result

### Node.js Test Script

**File**: `server/tests/rls_phase1_test.ts`

**How to Run**:
```bash
# Set environment variables
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export SUPABASE_ANON_KEY="your-anon-key"

# Optional: Set user access tokens for more realistic testing
export USER1_ACCESS_TOKEN="jwt-token-for-user1"
export USER2_ACCESS_TOKEN="jwt-token-for-user2"

# Run the test
tsx server/tests/rls_phase1_test.ts
```

**What It Tests**:
- ✅ User1 can see their own payment_attempts
- ✅ User2 cannot see user1's payment_attempts
- ✅ Brand members can see strategy_briefs and content_packages
- ✅ Non-admin users cannot insert strategy_briefs
- ✅ Service role can insert strategy_briefs
- ✅ Immutable logs (brand_history, collaboration_logs) cannot be updated/deleted

**Output**:
The script provides color-coded output:
- ✅ Green: Test passed
- ❌ Red: Test failed
- ⚠️ Yellow: Warning
- ℹ️ Info: Test in progress

## 🚀 Next Steps

1. **Test Migration**: Run on fresh Supabase project to verify
2. **Verify RLS**: Run `supabase/tests/rls_phase1_verification.sql` in SQL Editor
3. **Run Node Tests**: Execute `server/tests/rls_phase1_test.ts` with proper env vars
4. **Service Role**: Ensure backend uses service role for system operations
5. **Phase 2+**: Future migrations can add:
   - TEXT → UUID migrations (if approved)
   - Additional FK constraints
   - Admin role checks (if user_profiles.role exists)
   - Additional RLS policies for Phase 2+

---

**Status**: ✅ Complete - Ready for review and testing

---

## Migration Hygiene Check

**Date**: 2025-01-XX  
**Auditor**: Bootstrap Migration Auditor

### Findings

#### ✅ Active Migrations
- **Only active migration**: `001_bootstrap_schema.sql`
- **Summary document**: `001_BOOTSTRAP_SUMMARY.md` (this file)
- **Legacy migrations**: All old migrations safely archived in `_legacy/` folder

#### ✅ Cleanup Actions Taken
1. **Moved duplicate file**: `016_secure_rls_policies.sql` → `_legacy/016_secure_rls_policies_duplicate.sql`
   - This file was a duplicate of policies already included in the bootstrap migration
   - All RLS policies from 016 are already present in 001_bootstrap_schema.sql

#### ✅ Stray DDL Check
- **`server/migrations/` directory**: Contains legacy SQL migration files
  - These files are **NOT executed automatically** by the application
  - They are old migration scripts that reference deprecated migration files
  - Safe to leave as-is (archived/legacy code)
  - Note: `server/utils/apply-migrations*.ts` scripts reference old migration files from `supabase/migrations/` (now in `_legacy/`), but these scripts are not part of the active deployment pipeline

- **`BOOTSTRAP_MIGRATION_FIXES.sql`**: Contains fixes that were already applied to the bootstrap migration
  - All deny policies for immutable log tables are already present in `001_bootstrap_schema.sql`
  - This file can be considered documentation/reference only

#### ✅ No Conflicting DDL Found
- No `CREATE TABLE`, `ALTER TABLE`, `DROP TABLE`, `CREATE POLICY`, or `ALTER POLICY` statements found outside of:
  - `supabase/migrations/001_bootstrap_schema.sql` (active)
  - `supabase/migrations/_legacy/` (archived)
  - `server/migrations/` (legacy, not executed)

### Verification Results

#### Static SQL Audit
- ✅ All `CREATE TABLE` statements use `IF NOT EXISTS`
- ✅ All `CREATE INDEX` statements use `IF NOT EXISTS`
- ✅ All `CREATE EXTENSION` statements use `IF NOT EXISTS`
- ✅ No `DROP TABLE`, `DROP POLICY`, `DROP INDEX`, or other destructive statements
- ✅ Helper functions defined before use:
  - `update_updated_at()` defined at line 21, used in triggers starting at line 1039
  - `is_brand_member_text()` defined at line 31, used in policies starting at line 1893
  - `is_workspace_member()` defined at line 48, used in policies starting at line 2159

#### RLS Coverage
- ✅ All Phase 1 critical tables have RLS enabled (51 tables total)
- ✅ All critical tables have at least one policy:
  - `milestones`: 3 policies (SELECT, INSERT, UPDATE)
  - `strategy_briefs`: 4 policies (SELECT, INSERT, UPDATE, DELETE)
  - `content_packages`: 4 policies (SELECT, INSERT, UPDATE, DELETE)
  - `brand_history`: 3 policies (SELECT, INSERT, deny UPDATE/DELETE)
  - `payment_attempts`: 3 policies (SELECT, INSERT, UPDATE)
  - `archived_data`: 4 policies (SELECT x2, INSERT, UPDATE)
- ✅ All medium priority tables have RLS enabled and policies

#### Forbidden Patterns Check
- ✅ No `DROP TABLE` statements
- ✅ No `ALTER TABLE ... ALTER COLUMN ... TYPE uuid` on persistence tables
- ✅ No magic UUIDs like `'00000000-0000-0000-0000-000000000000'`
- ✅ Only `auth.role() = 'service_role'` used for service role checks

#### Immutable Log Tables
- ✅ All immutable log tables have explicit deny policies:
  - `brand_history`: Deny UPDATE, Deny DELETE
  - `collaboration_logs`: Deny UPDATE, Deny DELETE
  - `performance_logs`: Deny UPDATE, Deny DELETE
  - `advisor_review_audits`: Deny UPDATE, Deny DELETE

### Verification Assets Created

1. **`supabase/tests/001_bootstrap_verification.sql`**
   - SQL file for manual verification in Supabase SQL Editor
   - Checks RLS status, policy counts, helper functions, triggers
   - Provides summary report via DO block

2. **`server/tests/supabase_bootstrap_rls.test.ts`**
   - Vitest test file for automated RLS smoke testing
   - Requires environment variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - Optional: `USER1_ACCESS_TOKEN`, `USER2_ACCESS_TOKEN` for realistic user context testing
   - Contains TODO comments for test data seeding (requires manual setup of auth.users)

### Remaining TODOs

1. **Test Data Seeding**: The Vitest test file requires test data to be seeded manually:
   - Create test users in Supabase Auth (user1@test.com, user2@test.com)
   - Get JWT access tokens for these users
   - Seed test tenant, brand, brand_members, strategy_brief, content_package, payment_attempt, milestone
   - See comments in `server/tests/supabase_bootstrap_rls.test.ts` for details

2. **Migration Scripts Update**: Consider updating or removing:
   - `server/utils/apply-migrations*.ts` (references old migration files)
   - `server/scripts/deploy-db-schema.ts` (references old migration file)
   - These are not part of active deployment but could cause confusion

### Conclusion

✅ **Migration hygiene is clean**: Only `001_bootstrap_schema.sql` is active, all old migrations are archived.

✅ **Static SQL validation passed**: All safety checks passed, no forbidden patterns found.

✅ **RLS coverage complete**: All Phase 1 tables have RLS enabled with appropriate policies.

✅ **Verification assets created**: SQL verification script and Vitest test file are ready for use.

**Ready for Supabase deployment**: The bootstrap migration is safe to apply to a fresh Supabase project.

