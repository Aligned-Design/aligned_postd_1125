# RLS Security Strengthening Plan

**Date**: 2025-01-XX  
**Purpose**: Propose RLS fixes for all tables with weak or missing security  
**Status**: ⏸️ **AWAITING APPROVAL** - No migrations generated yet

---

## Executive Summary

This document proposes RLS (Row Level Security) fixes for **10+ tables** identified as having weak or missing security policies. All proposals follow POSTD's multi-tenant, multi-brand access control model.

**Key Principles:**
- **Brand-scoped access**: Most tables use `brand_members` table to verify user access
- **Tenant-scoped access**: Some tables need tenant-level isolation
- **User-only access**: Financial/personal data restricted to user's own records
- **Admin-only access**: Sensitive operations require admin/owner role

---

## Tables Requiring RLS Fixes

### 🔴 Critical Priority (High Risk)

#### 1. milestones

**Current State:**
- RLS enabled but uses `USING (true)` for all policies
- Allows any authenticated user to read/write any milestone
- TODO comments indicate need for proper workspace auth

**Proposed RLS Model:** **Tenant-scoped** (workspace-based)

**Rationale:**
- Milestones are workspace-level achievements
- Users should only see milestones for their workspace
- Need to map `workspace_id TEXT` to tenant/brand membership

**Proposed Policies:**
```sql
-- Users can view milestones for their workspace
-- Workspace is determined via brand_members → brands → tenant_id
CREATE POLICY "Users can view workspace milestones"
  ON milestones FOR SELECT
  USING (
    workspace_id IN (
      SELECT COALESCE(b.workspace_id, b.tenant_id::text)
      FROM brands b
      JOIN brand_members bm ON bm.brand_id = b.id
      WHERE bm.user_id = auth.uid()
    )
  );

-- System/service role can insert milestones
CREATE POLICY "System can insert milestones"
  ON milestones FOR INSERT
  WITH CHECK (
    auth.uid()::text = '00000000-0000-0000-0000-000000000000'
    OR workspace_id IN (
      SELECT COALESCE(b.workspace_id, b.tenant_id::text)
      FROM brands b
      JOIN brand_members bm ON bm.brand_id = b.id
      WHERE bm.user_id = auth.uid()
      AND bm.role IN ('owner', 'admin')
    )
  );

-- Users can acknowledge milestones for their workspace
CREATE POLICY "Users can acknowledge workspace milestones"
  ON milestones FOR UPDATE
  USING (
    workspace_id IN (
      SELECT COALESCE(b.workspace_id, b.tenant_id::text)
      FROM brands b
      JOIN brand_members bm ON bm.brand_id = b.id
      WHERE bm.user_id = auth.uid()
    )
  );
```

**Schema Note:**
- `workspace_id` is TEXT - consider adding FK to `tenants` table if workspace_id maps to tenant
- May need helper function: `is_workspace_member(workspace_id TEXT)`

---

#### 2. strategy_briefs

**Current State:**
- RLS not enabled
- Contains AI-generated strategy data per brand
- Uses `brand_id TEXT` (not UUID)

**Proposed RLS Model:** **Brand-scoped** (brand members only)

**Rationale:**
- Strategy briefs are brand-specific AI artifacts
- Only brand members should access their brand's strategies
- System/agents can insert (for AI generation)

**Proposed Policies:**
```sql
ALTER TABLE strategy_briefs ENABLE ROW LEVEL SECURITY;

-- Brand members can view strategy briefs for their brands
CREATE POLICY "Brand members can view strategy briefs"
  ON strategy_briefs FOR SELECT
  USING (
    brand_id::uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
    OR brand_id IN (
      SELECT id::text FROM brands
      WHERE created_by = auth.uid()
    )
  );

-- System/agents can insert strategy briefs
CREATE POLICY "System can insert strategy briefs"
  ON strategy_briefs FOR INSERT
  WITH CHECK (
    auth.uid()::text = '00000000-0000-0000-0000-000000000000'
    OR brand_id::uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Only admins can update/delete strategy briefs
CREATE POLICY "Admins can manage strategy briefs"
  ON strategy_briefs FOR UPDATE
  USING (
    brand_id::uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );
```

**Schema Note:**
- ⚠️ **CRITICAL**: `brand_id TEXT` should be migrated to UUID for FK constraints
- Consider migration: `ALTER TABLE strategy_briefs ALTER COLUMN brand_id TYPE UUID USING brand_id::uuid;`
- Add FK: `ALTER TABLE strategy_briefs ADD CONSTRAINT fk_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;`

---

#### 3. content_packages

**Current State:**
- RLS not enabled
- Contains AI-generated content packages per brand
- Uses `brand_id TEXT` (not UUID)

**Proposed RLS Model:** **Brand-scoped** (brand members only)

**Rationale:**
- Content packages are brand-specific AI artifacts
- Only brand members should access their brand's content packages
- System/agents can insert (for AI generation)

**Proposed Policies:**
```sql
ALTER TABLE content_packages ENABLE ROW LEVEL SECURITY;

-- Brand members can view content packages for their brands
CREATE POLICY "Brand members can view content packages"
  ON content_packages FOR SELECT
  USING (
    brand_id::uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
    OR brand_id IN (
      SELECT id::text FROM brands
      WHERE created_by = auth.uid()
    )
  );

-- System/agents can insert content packages
CREATE POLICY "System can insert content packages"
  ON content_packages FOR INSERT
  WITH CHECK (
    auth.uid()::text = '00000000-0000-0000-0000-000000000000'
    OR brand_id::uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'editor', 'creator')
    )
  );

-- Brand members can update content packages (for approval workflow)
CREATE POLICY "Brand members can update content packages"
  ON content_packages FOR UPDATE
  USING (
    brand_id::uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
  );
```

**Schema Note:**
- ⚠️ **CRITICAL**: `brand_id TEXT` should be migrated to UUID
- Add FK constraint after migration

---

#### 4. brand_history

**Current State:**
- RLS not enabled
- Contains brand activity history (AI agent actions)
- Uses `brand_id TEXT` (not UUID)

**Proposed RLS Model:** **Brand-scoped** (brand members only, read-only for most)

**Rationale:**
- Brand history is audit trail of AI agent actions
- Brand members should view their brand's history
- Only system/agents should insert (immutable log)

**Proposed Policies:**
```sql
ALTER TABLE brand_history ENABLE ROW LEVEL SECURITY;

-- Brand members can view brand history
CREATE POLICY "Brand members can view brand history"
  ON brand_history FOR SELECT
  USING (
    brand_id::uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
    OR brand_id IN (
      SELECT id::text FROM brands
      WHERE created_by = auth.uid()
    )
  );

-- Only system/agents can insert (immutable log)
CREATE POLICY "System can insert brand history"
  ON brand_history FOR INSERT
  WITH CHECK (
    auth.uid()::text = '00000000-0000-0000-0000-000000000000'
    OR brand_id::uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- No UPDATE/DELETE policies (immutable log)
```

**Schema Note:**
- ⚠️ **CRITICAL**: `brand_id TEXT` should be migrated to UUID
- This is an immutable audit log - no updates/deletes needed

---

#### 5. payment_attempts

**Current State:**
- RLS not enabled
- Contains sensitive financial data (payment history)
- References `users` table (not `user_profiles`)

**Proposed RLS Model:** **User-only** (users see own payments) + **Admin-only** (admins see all)

**Rationale:**
- Payment data is highly sensitive
- Users should only see their own payment attempts
- Admins/owners need to view for support/billing
- System can insert (payment processing)

**Proposed Policies:**
```sql
ALTER TABLE payment_attempts ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment attempts
CREATE POLICY "Users can view own payment attempts"
  ON payment_attempts FOR SELECT
  USING (user_id = auth.uid());

-- System can insert payment attempts
CREATE POLICY "System can insert payment attempts"
  ON payment_attempts FOR INSERT
  WITH CHECK (
    auth.uid()::text = '00000000-0000-0000-0000-000000000000'
    OR user_id = auth.uid() -- User can create their own payment attempt
  );

-- Admins can view all payment attempts (for support)
-- Note: This requires a way to check if user is admin
-- Could use a function: is_superadmin() or check user_profiles.role
CREATE POLICY "Admins can view all payment attempts"
  ON payment_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('superadmin', 'admin')
    )
  );
```

**Schema Note:**
- ⚠️ **ISSUE**: References `users` table - verify this exists or should reference `user_profiles`
- May need to add `user_profiles.role` column if not exists
- Consider adding FK constraint after verification

---

#### 6. archived_data

**Current State:**
- RLS not enabled
- Contains archived user data (90-day retention)
- Highly sensitive (user content, settings, etc.)

**Proposed RLS Model:** **User-only** (users see own archived data) + **Admin-only** (admins for support)

**Rationale:**
- Archived data contains user's personal content
- Users should only see their own archived data
- Admins need access for support/restoration
- System can insert (archival process)

**Proposed Policies:**
```sql
ALTER TABLE archived_data ENABLE ROW LEVEL SECURITY;

-- Users can view their own archived data
CREATE POLICY "Users can view own archived data"
  ON archived_data FOR SELECT
  USING (user_id = auth.uid());

-- System can insert archived data
CREATE POLICY "System can insert archived data"
  ON archived_data FOR INSERT
  WITH CHECK (
    auth.uid()::text = '00000000-0000-0000-0000-000000000000'
  );

-- Admins can view all archived data (for support/restoration)
CREATE POLICY "Admins can view all archived data"
  ON archived_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('superadmin', 'admin')
    )
  );

-- System can update (for restoration flag)
CREATE POLICY "System can update archived data"
  ON archived_data FOR UPDATE
  USING (
    auth.uid()::text = '00000000-0000-0000-0000-000000000000'
  );
```

**Schema Note:**
- ⚠️ **ISSUE**: `user_id` is UUID but no FK constraint
- Consider adding FK: `ALTER TABLE archived_data ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;`
- `brand_id` is optional - may need brand-scoped access if present

---

### 🟡 Medium Priority

#### 7. tenants

**Current State:**
- RLS enabled but minimal policies
- Core multi-tenant table
- No tenant member table exists

**Proposed RLS Model:** **Tenant-scoped** (tenant members only)

**Rationale:**
- Tenants are workspaces/organizations
- Users should only see tenants they belong to
- Need to determine tenant membership via brands or create tenant_members table

**Proposed Policies:**
```sql
-- Users can view tenants they belong to (via brands)
CREATE POLICY "Users can view their tenants"
  ON tenants FOR SELECT
  USING (
    id IN (
      SELECT DISTINCT COALESCE(b.tenant_id, b.workspace_id::uuid)
      FROM brands b
      JOIN brand_members bm ON bm.brand_id = b.id
      WHERE bm.user_id = auth.uid()
      AND COALESCE(b.tenant_id, b.workspace_id::uuid) IS NOT NULL
    )
  );

-- Only system/superadmin can create tenants
CREATE POLICY "System can create tenants"
  ON tenants FOR INSERT
  WITH CHECK (
    auth.uid()::text = '00000000-0000-0000-0000-000000000000'
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'superadmin'
    )
  );

-- Only superadmin can update/delete tenants
CREATE POLICY "Superadmin can manage tenants"
  ON tenants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'superadmin'
    )
  );
```

**Schema Note:**
- Consider creating `tenant_members` table for explicit tenant membership
- Currently relies on `brands.tenant_id` → `brand_members` relationship

---

#### 8. brand_success_patterns

**Current State:**
- RLS not enabled (from persistence schema)
- Uses `brand_id TEXT` (not UUID)

**Proposed RLS Model:** **Brand-scoped** (brand members only)

**Rationale:**
- Success patterns are brand-specific insights
- Only brand members should access their brand's patterns
- System can insert (AI learning)

**Proposed Policies:**
```sql
ALTER TABLE brand_success_patterns ENABLE ROW LEVEL SECURITY;

-- Brand members can view success patterns
CREATE POLICY "Brand members can view success patterns"
  ON brand_success_patterns FOR SELECT
  USING (
    brand_id::uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
  );

-- System can insert/update success patterns
CREATE POLICY "System can manage success patterns"
  ON brand_success_patterns FOR ALL
  WITH CHECK (
    auth.uid()::text = '00000000-0000-0000-0000-000000000000'
    OR brand_id::uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );
```

**Schema Note:**
- ⚠️ **CRITICAL**: `brand_id TEXT` should be migrated to UUID

---

#### 9. collaboration_logs

**Current State:**
- RLS not enabled (from persistence schema)
- Uses `brand_id TEXT` (not UUID)

**Proposed RLS Model:** **Brand-scoped** (brand members only, read-only)

**Rationale:**
- Collaboration logs are brand-specific AI agent interactions
- Brand members should view their brand's collaboration logs
- Only system can insert (immutable log)

**Proposed Policies:**
```sql
ALTER TABLE collaboration_logs ENABLE ROW LEVEL SECURITY;

-- Brand members can view collaboration logs
CREATE POLICY "Brand members can view collaboration logs"
  ON collaboration_logs FOR SELECT
  USING (
    brand_id::uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
  );

-- Only system can insert (immutable log)
CREATE POLICY "System can insert collaboration logs"
  ON collaboration_logs FOR INSERT
  WITH CHECK (
    auth.uid()::text = '00000000-0000-0000-0000-000000000000'
  );
```

**Schema Note:**
- ⚠️ **CRITICAL**: `brand_id TEXT` should be migrated to UUID

---

#### 10. performance_logs

**Current State:**
- RLS not enabled (from persistence schema)
- Uses `brand_id TEXT` (not UUID)

**Proposed RLS Model:** **Brand-scoped** (brand members only, read-only)

**Rationale:**
- Performance logs are brand-specific analytics data
- Brand members should view their brand's performance
- Only system can insert (analytics sync)

**Proposed Policies:**
```sql
ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;

-- Brand members can view performance logs
CREATE POLICY "Brand members can view performance logs"
  ON performance_logs FOR SELECT
  USING (
    brand_id::uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
  );

-- Only system can insert (analytics sync)
CREATE POLICY "System can insert performance logs"
  ON performance_logs FOR INSERT
  WITH CHECK (
    auth.uid()::text = '00000000-0000-0000-0000-000000000000'
  );
```

**Schema Note:**
- ⚠️ **CRITICAL**: `brand_id TEXT` should be migrated to UUID

---

#### 11. platform_insights

**Current State:**
- RLS not enabled (from persistence schema)
- Uses `brand_id TEXT` (not UUID)

**Proposed RLS Model:** **Brand-scoped** (brand members only)

**Rationale:**
- Platform insights are brand-specific analytics
- Brand members should view their brand's insights
- System can insert/update (analytics processing)

**Proposed Policies:**
```sql
ALTER TABLE platform_insights ENABLE ROW LEVEL SECURITY;

-- Brand members can view platform insights
CREATE POLICY "Brand members can view platform insights"
  ON platform_insights FOR SELECT
  USING (
    brand_id::uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
  );

-- System can insert/update platform insights
CREATE POLICY "System can manage platform insights"
  ON platform_insights FOR ALL
  WITH CHECK (
    auth.uid()::text = '00000000-0000-0000-0000-000000000000'
    OR brand_id::uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );
```

**Schema Note:**
- ⚠️ **CRITICAL**: `brand_id TEXT` should be migrated to UUID

---

#### 12. token_health

**Current State:**
- RLS not enabled (from persistence schema)
- Uses `brand_id TEXT` (not UUID)
- Contains OAuth token status (sensitive)

**Proposed RLS Model:** **Brand-scoped** (brand members only, admins can manage)

**Rationale:**
- Token health is brand-specific OAuth status
- Brand members should view their brand's token health
- Only admins can update (token refresh)

**Proposed Policies:**
```sql
ALTER TABLE token_health ENABLE ROW LEVEL SECURITY;

-- Brand members can view token health
CREATE POLICY "Brand members can view token health"
  ON token_health FOR SELECT
  USING (
    brand_id::uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
  );

-- System/admins can insert/update token health
CREATE POLICY "System/admins can manage token health"
  ON token_health FOR ALL
  WITH CHECK (
    auth.uid()::text = '00000000-0000-0000-0000-000000000000'
    OR brand_id::uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );
```

**Schema Note:**
- ⚠️ **CRITICAL**: `brand_id TEXT` should be migrated to UUID

---

#### 13. weekly_summaries

**Current State:**
- RLS not enabled (from persistence schema)
- Uses `brand_id TEXT` (not UUID)

**Proposed RLS Model:** **Brand-scoped** (brand members only)

**Rationale:**
- Weekly summaries are brand-specific reports
- Brand members should view their brand's summaries
- System can insert/update (report generation)

**Proposed Policies:**
```sql
ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;

-- Brand members can view weekly summaries
CREATE POLICY "Brand members can view weekly summaries"
  ON weekly_summaries FOR SELECT
  USING (
    brand_id::uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
  );

-- System can insert/update weekly summaries
CREATE POLICY "System can manage weekly summaries"
  ON weekly_summaries FOR ALL
  WITH CHECK (
    auth.uid()::text = '00000000-0000-0000-0000-000000000000'
  );
```

**Schema Note:**
- ⚠️ **CRITICAL**: `brand_id TEXT` should be migrated to UUID

---

#### 14. advisor_review_audits

**Current State:**
- RLS not enabled (from persistence schema)
- Uses `brand_id TEXT` (not UUID)

**Proposed RLS Model:** **Brand-scoped** (brand members only, read-only)

**Rationale:**
- Advisor review audits are brand-specific AI reviews
- Brand members should view their brand's reviews
- Only system can insert (AI advisor)

**Proposed Policies:**
```sql
ALTER TABLE advisor_review_audits ENABLE ROW LEVEL SECURITY;

-- Brand members can view advisor reviews
CREATE POLICY "Brand members can view advisor reviews"
  ON advisor_review_audits FOR SELECT
  USING (
    brand_id::uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
  );

-- Only system can insert (AI advisor)
CREATE POLICY "System can insert advisor reviews"
  ON advisor_review_audits FOR INSERT
  WITH CHECK (
    auth.uid()::text = '00000000-0000-0000-0000-000000000000'
  );
```

**Schema Note:**
- ⚠️ **CRITICAL**: `brand_id TEXT` should be migrated to UUID

---

## Schema Migration Recommendations

### TEXT → UUID Migration for brand_id

**Tables Affected:**
1. `strategy_briefs.brand_id` (TEXT → UUID)
2. `content_packages.brand_id` (TEXT → UUID)
3. `brand_history.brand_id` (TEXT → UUID)
4. `brand_success_patterns.brand_id` (TEXT → UUID)
5. `collaboration_logs.brand_id` (TEXT → UUID)
6. `performance_logs.brand_id` (TEXT → UUID)
7. `platform_insights.brand_id` (TEXT → UUID)
8. `token_health.brand_id` (TEXT → UUID)
9. `weekly_summaries.brand_id` (TEXT → UUID)
10. `advisor_review_audits.brand_id` (TEXT → UUID)

**Migration Strategy:**
```sql
-- For each table:
-- 1. Verify all brand_id values are valid UUIDs
-- 2. Add new UUID column
-- 3. Migrate data
-- 4. Drop old column
-- 5. Rename new column
-- 6. Add FK constraint

-- Example for strategy_briefs:
ALTER TABLE strategy_briefs 
  ADD COLUMN brand_id_uuid UUID;

UPDATE strategy_briefs 
  SET brand_id_uuid = brand_id::uuid 
  WHERE brand_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Verify no NULLs
ALTER TABLE strategy_briefs 
  ALTER COLUMN brand_id_uuid SET NOT NULL;

ALTER TABLE strategy_briefs 
  DROP COLUMN brand_id;

ALTER TABLE strategy_briefs 
  RENAME COLUMN brand_id_uuid TO brand_id;

ALTER TABLE strategy_briefs 
  ADD CONSTRAINT fk_strategy_briefs_brand 
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
```

**Risk Assessment:**
- ⚠️ **MEDIUM RISK**: Requires data validation
- Must verify all TEXT brand_ids are valid UUIDs
- May have legacy data with non-UUID format
- Recommend running validation query first

---

### Foreign Key Constraints to Add

**Missing FKs:**
1. `strategy_briefs.brand_id` → `brands.id` (after UUID migration)
2. `content_packages.brand_id` → `brands.id` (after UUID migration)
3. `brand_history.brand_id` → `brands.id` (after UUID migration)
4. `brand_success_patterns.brand_id` → `brands.id` (after UUID migration)
5. `collaboration_logs.brand_id` → `brands.id` (after UUID migration)
6. `performance_logs.brand_id` → `brands.id` (after UUID migration)
7. `platform_insights.brand_id` → `brands.id` (after UUID migration)
8. `token_health.brand_id` → `brands.id` (after UUID migration)
9. `weekly_summaries.brand_id` → `brands.id` (after UUID migration)
10. `advisor_review_audits.brand_id` → `brands.id` (after UUID migration)
11. `payment_attempts.user_id` → `user_profiles.id` (verify table exists)
12. `archived_data.user_id` → `user_profiles.id`
13. `milestones.workspace_id` → `tenants.id` (if workspace_id maps to tenant)

---

## Legacy/Unused Tables

**Potential Legacy Tables** (need verification):
1. `assets` - May be duplicate of `brand_assets` or `media_assets`
2. `content` - May be duplicate of `content_items`
3. `posts` - May be legacy table (check if used)

**Recommendation:**
- Audit codebase for references to these tables
- If unused, archive or remove
- If used, ensure RLS is properly configured

---

## Helper Functions for RLS

**Proposed Helper Functions:**

```sql
-- Helper: Check if user is brand member (handles TEXT brand_id)
CREATE OR REPLACE FUNCTION is_brand_member_text(brand_id_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM brand_members
    WHERE brand_id = brand_id_param::uuid
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: Check if user is workspace member
CREATE OR REPLACE FUNCTION is_workspace_member(workspace_id_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM brands b
    JOIN brand_members bm ON bm.brand_id = b.id
    WHERE COALESCE(b.workspace_id, b.tenant_id::text) = workspace_id_param
    AND bm.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role IN ('superadmin', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Migration Execution Plan

### Phase 1: Critical RLS Fixes (No Schema Changes)
1. Fix `milestones` RLS policies (workspace-scoped)
2. Add RLS to `payment_attempts` (user-only + admin)
3. Add RLS to `archived_data` (user-only + admin)

### Phase 2: Persistence Schema RLS (No Schema Changes)
4. Add RLS to all persistence schema tables (brand-scoped)
5. Use helper function for TEXT brand_id conversion

### Phase 3: Tenant RLS (No Schema Changes)
6. Strengthen `tenants` RLS policies

### Phase 4: Schema Migrations (Requires Data Validation)
7. Migrate TEXT brand_id → UUID (one table at a time)
8. Add FK constraints after migration
9. Update RLS policies to use UUID directly

---

## Risk Assessment

### Low Risk (Safe to Apply)
- ✅ Adding RLS to tables without RLS (no existing access)
- ✅ Fixing `milestones` RLS (currently open, fixing is safer)
- ✅ Adding RLS to persistence schema tables (currently no access)

### Medium Risk (Requires Testing)
- ⚠️ TEXT → UUID migration (data validation required)
- ⚠️ Adding FK constraints (may fail if orphaned data exists)
- ⚠️ Tenant RLS changes (may affect workspace access)

### High Risk (Requires Careful Planning)
- 🔴 Payment/archived data RLS (sensitive data, test thoroughly)
- 🔴 System role checks (ensure service role still works)

---

## Testing Checklist

Before applying migrations:

1. **Data Validation:**
   - [ ] Verify all TEXT brand_ids are valid UUIDs
   - [ ] Check for orphaned records (brand_id not in brands table)
   - [ ] Verify payment_attempts.user_id references valid users

2. **Access Testing:**
   - [ ] Test brand member can access their brand's data
   - [ ] Test user cannot access other brands' data
   - [ ] Test admin can access all data (where applicable)
   - [ ] Test system role can insert (where applicable)

3. **Performance Testing:**
   - [ ] Verify RLS policies don't cause performance degradation
   - [ ] Check index usage on brand_members table
   - [ ] Test helper functions performance

---

## Approval Required

**⚠️ DO NOT GENERATE MIGRATIONS UNTIL APPROVED**

This plan proposes:
- **14 tables** requiring RLS fixes
- **10 tables** requiring TEXT → UUID migration
- **13 tables** requiring FK constraints

**Questions for Approval:**

1. **TEXT → UUID Migration**: Proceed with migration or use helper functions for now?
2. **System Role**: Confirm system role UUID (`00000000-0000-0000-0000-000000000000`) is correct?
3. **Admin Check**: Use `user_profiles.role` or create separate admin table?
4. **Tenant Membership**: Create `tenant_members` table or rely on brands → brand_members?
5. **Migration Phases**: Approve phased approach or all-at-once?

**Once approved, I will generate:**
- `supabase/migrations/016_secure_rls_policies.sql` - RLS fixes (no schema changes)
- `supabase/migrations/017_migrate_brand_id_text_to_uuid.sql` - TEXT → UUID migration (if approved)
- `supabase/migrations/018_add_missing_foreign_keys.sql` - FK constraints (if approved)

---

**Status**: ⏸️ **AWAITING APPROVAL**

