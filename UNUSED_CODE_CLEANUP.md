# Unused Code Cleanup - Files & Migrations

**Generated:** 2025-11-19  
**Status:** Code and files marked for removal or consolidation

---

## 📁 MIGRATION FILES TO REMOVE/CONSOLIDATE

### A. Duplicate Migration Files (Conflicting Definitions) 🚨 **CRITICAL**

#### 1. `platform_connections` Duplicate
**Problem:** Table defined in TWO different migrations

```
⚠️ server/migrations/007_publishing_jobs_and_logs.sql
   - Lines 70-103: CREATE TABLE platform_connections
   - Schema: Uses `status` column (connected, expired, revoked, disconnected)

⚠️ supabase/migrations/005_integrations.sql
   - Lines 8-24: CREATE TABLE platform_connections
   - Schema: Uses `is_active` BOOLEAN column
```

**Resolution:**
1. **Investigate production:** Which migration ran last?
   ```sql
   SELECT * FROM information_schema.columns 
   WHERE table_name = 'platform_connections';
   -- Check if 'status' or 'is_active' column exists
   ```

2. **Keep ONE migration:**
   - If production has `status` column → Keep `007`, remove from `005`
   - If production has `is_active` column → Keep `005`, remove from `007`

3. **Remove duplicate definition from rejected migration**

**Files to modify:**
- [ ] `server/migrations/007_publishing_jobs_and_logs.sql` (maybe)
- [ ] `supabase/migrations/005_integrations.sql` (maybe)

---

#### 2. Migration Numbering Conflicts
**Problem:** Same migration numbers in different folders

```
⚠️ server/migrations/007_schema_alignment_FULL_FIX.sql
⚠️ server/migrations/009_schema_alignment_FULL_FIX.sql

vs

✅ supabase/migrations/007_client_portal_and_audit.sql
✅ supabase/migrations/009_complete_schema_sync.sql
```

**Issue:** Confusing migration numbering, unclear which runs first

**Resolution:**
1. Rename server migrations to non-conflicting numbers
2. Or move server migrations to supabase folder with proper sequencing
3. Document migration order clearly

**Recommendation:** 
- Consolidate all migrations in `supabase/migrations/`
- Archive `server/migrations/` folder
- Use timestamp-based naming (e.g., `20250119_fix_name.sql`)

---

### B. Orphaned/Unclear Purpose Migrations

#### `server/migrations/007_schema_alignment_FULL_FIX.sql`
- **Status:** Unclear what this "fixes"
- **Action:** Review contents, determine if superseded by later migrations
- **If superseded:** Archive or delete

#### `server/migrations/009_schema_alignment_FULL_FIX.sql`
- **Status:** Same number as supabase/009, unclear purpose
- **Action:** Review contents, determine if duplicate or unique fixes
- **If duplicate:** Delete
- **If unique:** Rename and document

#### `server/migrations/010_quick_schema_fixes.sql`
- **Status:** "Quick fixes" usually means temporary patches
- **Action:** Review what it fixes
- **If fixes are in later migrations:** Delete
- **If still needed:** Document clearly

---

### C. Archived Migrations (Already Handled ✅)

These are already in `supabase/migrations/archived/` folder:

```
✅ 20250108_create_audit_logs_table.sql
✅ 20250108_create_client_settings_table.sql
✅ 20250115_create_brand_embeddings.sql
✅ 20250116_create_brand_kit_history.sql
✅ 20250117_create_agent_safety_tables.sql
✅ 20250118_create_content_calendar_tables.sql
✅ 20250119_create_integrations_tables.sql
✅ 20250120_create_dashboard_client_portal_tables.sql
✅ 20250121_create_phase_9_client_settings.sql
✅ 20250122_create_phase_9_post_approvals.sql
✅ 20250123_create_phase_9_audit_logs.sql
✅ 20250125_create_webhook_events.sql
✅ 20250125_create_webhook_attempts.sql
✅ 20250126_create_escalation_rules.sql
```

**Status:** Already archived, no action needed

**However:** Verify tables from these migrations are actually dropped or consolidated

---

## 🗂️ DATABASE SERVICE FILES TO UPDATE

### 1. Media Services (Asset Consolidation)

After consolidating `brand_assets` and `assets` into `media_assets`:

#### Files to Update:
```
server/lib/image-sourcing.ts
  - Update: 3 refs to brand_assets
  - Change to: media_assets queries

server/lib/workflow-db-service.ts
  - Update: 10 refs to assets/brand_assets
  - Change to: media_assets queries

server/lib/media-service.ts
  - Verify: Already uses media_assets (10 refs)
  - No changes needed

server/lib/media-db-service.ts
  - Verify: Already uses media_assets (13 refs)
  - No changes needed
```

**Estimated Effort:** 4-6 hours

---

### 2. Content Services (Content Consolidation)

After consolidating `content` into `content_items`:

#### Files to Update:
```
server/lib/client-portal-db-service.ts
  - Update: 9 refs to .from("content")
  - Change to: .from("content_items")
  - Lines: 86, 105, 124, 397, etc.

server/lib/approvals-db-service.ts
  - Verify: Already uses content_items (4 refs)
  - May need alias queries for backward compat

server/lib/content-planning-service.ts
  - Verify: Already uses content_items (1 ref)
  - No changes needed

server/lib/search-service.ts
  - Update: Uses both scheduled_content and content
  - Review search queries for consolidation
```

**Estimated Effort:** 6-8 hours

---

### 3. Platform Connection Services (If Migrating to New Schema)

**⚠️ HIGH EFFORT** - Only if deciding to fully migrate to new connector infrastructure

#### Files to Update (44 files total):

##### Core Service Files:
```
server/lib/connections-db-service.ts (15 refs)
  - COMPLETE REWRITE needed
  - Change from: platform_connections
  - Change to: connections + encrypted_secrets
  
server/lib/integrations-db-service.ts (8 refs)
  - Update: platform_connections queries
  - Update: Add token encryption/decryption
  
server/lib/publishing-db-service.ts (15 refs)
  - Change from: publishing_jobs
  - Change to: publish_jobs (new schema)
```

##### Connector Implementation Files:
```
server/connectors/manager.ts (8 refs)
  - Already uses new schema (connections)
  - Verify consistency

server/connectors/meta/implementation.ts (1 ref)
  - Update connection references

server/connectors/oauth-utils.ts (1 ref)
  - Update token storage references
```

##### Queue Workers:
```
server/queue/workers.ts (2 refs)
  - Update: publish_jobs → new publish_jobs schema

server/lib/job-queue.ts (1 ref)
  - Update job references

server/lib/job-recovery.ts (3 refs)
  - Update recovery queries
```

**Estimated Effort:** 40-60 hours (1-2 weeks)

**Recommendation:** Phased migration with feature flags

---

## 📝 CODE PATTERNS TO REMOVE

### 1. Old Asset Query Pattern
```typescript
// ❌ OLD (to be removed)
const { data } = await supabase
  .from("brand_assets")
  .select("*")
  .eq("brand_id", brandId);

// ✅ NEW (after consolidation)
const { data } = await supabase
  .from("media_assets")
  .select("*")
  .eq("brand_id", brandId);
```

**Files affected:** image-sourcing.ts, workflow-db-service.ts

---

### 2. Old Content Query Pattern
```typescript
// ❌ OLD (to be removed)
const { data } = await supabase
  .from("content")
  .select("*")
  .eq("brand_id", brandId);

// ✅ NEW (after consolidation)
const { data } = await supabase
  .from("content_items")
  .select("*")
  .eq("brand_id", brandId);
```

**Files affected:** client-portal-db-service.ts (9 locations)

---

### 3. Old Connection Pattern (if migrating)
```typescript
// ❌ OLD
const { data } = await supabase
  .from("platform_connections")
  .select("*")
  .eq("brand_id", brandId)
  .eq("platform", platform)
  .single();

// ✅ NEW
const { data: connection } = await supabase
  .from("connections")
  .select(`
    *,
    connector_platforms!inner(platform_name),
    encrypted_secrets!inner(encrypted_value, iv, auth_tag)
  `)
  .eq("tenant_id", tenantId)
  .eq("connector_platforms.platform_name", platform)
  .single();

// Decrypt token
const accessToken = await decryptSecret(
  connection.encrypted_secrets.encrypted_value,
  connection.encrypted_secrets.iv,
  connection.encrypted_secrets.auth_tag
);
```

**Files affected:** 44 files (see above)

---

## 🧹 HELPER FUNCTIONS TO ADD

After consolidations, create helper functions to ease migration:

### 1. Asset Query Helper
```typescript
// server/lib/asset-helpers.ts (NEW FILE)
import { supabase } from './supabase';

/**
 * Get media assets for a brand
 * @deprecated Use direct media_assets queries
 */
export async function getBrandAssets(brandId: string) {
  const { data, error } = await supabase
    .from("media_assets")
    .select("*")
    .eq("brand_id", brandId);
  
  if (error) throw error;
  return data;
}

// Add other common asset queries
```

### 2. Content Query Helper
```typescript
// server/lib/content-helpers.ts (NEW FILE)
import { supabase } from './supabase';

/**
 * Get content for client portal
 * Unified query replacing old "content" table references
 */
export async function getContentForBrand(
  brandId: string, 
  status?: string
) {
  let query = supabase
    .from("content_items")
    .select("*")
    .eq("brand_id", brandId);
  
  if (status) {
    query = query.eq("status", status);
  }
  
  const { data, error } = await query.order("created_at", { ascending: false });
  
  if (error) throw error;
  return data;
}
```

### 3. Token Encryption Helpers (for connector migration)
```typescript
// server/lib/token-helpers.ts (NEW FILE or update existing token-vault.ts)
import crypto from 'crypto';

export async function encryptToken(token: string): Promise<{
  encrypted_value: string;
  iv: string;
  auth_tag: string;
}> {
  // Use AWS KMS or local encryption key
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted_value: encrypted,
    iv: iv.toString('hex'),
    auth_tag: authTag.toString('hex')
  };
}

export async function decryptToken(
  encrypted_value: string,
  iv: string,
  auth_tag: string
): Promise<string> {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  
  const decipher = crypto.createDecipheriv(
    algorithm, 
    key, 
    Buffer.from(iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(auth_tag, 'hex'));
  
  let decrypted = decipher.update(encrypted_value, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

---

## 📊 CLIENT-SIDE UPDATES

### Files Using Supabase Direct Queries

#### 1. Brand Queries (Client Side)
```typescript
// client/contexts/BrandContext.tsx
// Lines 61-74: Uses brands table directly
// Status: OK - brands table is keeping same structure

// client/pages/BrandSnapshot.tsx
// Lines 41-45: .from("brands").select("*")
// Status: OK - no changes needed
```

#### 2. File Upload Queries
```typescript
// client/lib/fileUpload.ts
// Uses Supabase Storage buckets
// Status: Review if using media_assets table
// Action: Verify table references after consolidation
```

#### 3. Brand Member Queries
```typescript
// client/contexts/BrandContext.tsx
// Line 83: .from("brand_members").insert({...})
// Status: OK - brand_members table unchanged
```

**Estimated Client Changes:** Minimal (2-3 hours)

---

## 🧪 TEST FILES TO UPDATE

After schema changes, update test fixtures and mocks:

### 1. Test Fixtures
```
server/__tests__/fixtures.ts
  - Update: Mock data for consolidated tables
  - Remove: References to deleted tables
  - Add: New connector schema fixtures
```

### 2. Integration Tests
```
server/__tests__/integration-brand-ai-publishing.test.ts
  - Update: Database setup/teardown
  - Verify: Table references

server/__tests__/phase-6-media.test.ts
  - Update: media_assets tests only
  - Remove: brand_assets/assets tests

server/__tests__/phase-7-publishing.test.ts
  - Update: If migrating to new connector schema
```

### 3. RLS Validation Tests
```
server/__tests__/rls-validation.test.ts
  - Update: Test cases for consolidated tables
  - Remove: Tests for deleted tables
  - Verify: RLS policies on new schema
```

**Estimated Effort:** 8-12 hours

---

## 📑 DOCUMENTATION FILES TO UPDATE

### 1. Schema Documentation
```
✏️ DATABASE-STRUCTURE.md
  - Remove: References to deleted tables
  - Update: Consolidation changes
  - Add: New connector infrastructure

✏️ QUICK-DB-REFERENCE.md
  - Update: Table list
  - Update: Interface definitions
  - Remove: Deprecated tables

✏️ SCHEMA_VERIFICATION.md
  - Update: Current schema state
  - Add: Post-cleanup verification steps
```

### 2. Migration Guides
```
✏️ MIGRATION_GUIDE.md (if exists)
  - Add: Asset table consolidation steps
  - Add: Content table consolidation steps
  - Add: Connector migration guide (if applicable)

✏️ README.md (server/)
  - Update: Database service file list
  - Update: Migration instructions
```

### 3. API Documentation
```
✏️ API_DOCUMENTATION.md
  - Update: Endpoint response types
  - Remove: References to old tables
  - Add: New schemas
```

---

## 🔧 ENVIRONMENT & CONFIG UPDATES

### 1. Environment Variables
After implementing token encryption:

```bash
# Add to .env
ENCRYPTION_KEY=<generate-32-byte-hex-key>

# For AWS KMS (production)
AWS_KMS_KEY_ID=<kms-key-arn>
AWS_REGION=us-east-1
```

### 2. Supabase Configuration
```typescript
// Update any Supabase client configuration
// Verify RLS policies are active on all new tables
```

---

## 📋 CLEANUP CHECKLIST

### Phase 1: Migration Files
- [ ] Resolve `platform_connections` duplicate definition
- [ ] Rename or archive conflicting server migrations (007, 009, 010)
- [ ] Document migration execution order
- [ ] Verify all archived migrations are truly unused

### Phase 2: Asset Table Consolidation
- [ ] Update `image-sourcing.ts` (3 refs)
- [ ] Update `workflow-db-service.ts` (10 refs)
- [ ] Create asset-helpers.ts utility
- [ ] Update test fixtures
- [ ] Update documentation

### Phase 3: Content Table Consolidation
- [ ] Investigate `content` vs `content_items` relationship
- [ ] Update `client-portal-db-service.ts` (9 refs)
- [ ] Create content-helpers.ts utility
- [ ] Update test fixtures
- [ ] Update documentation

### Phase 4: Connector Schema (Optional)
- [ ] Make strategic decision (migrate or keep both)
- [ ] If migrating:
  - [ ] Create encryption helpers
  - [ ] Update connections-db-service.ts
  - [ ] Update integrations-db-service.ts
  - [ ] Update publishing-db-service.ts
  - [ ] Update 44 connector files
  - [ ] Update queue workers
  - [ ] Implement feature flags
  - [ ] Phased rollout plan

### Phase 5: Testing & Documentation
- [ ] Update all test files
- [ ] Update DATABASE-STRUCTURE.md
- [ ] Update QUICK-DB-REFERENCE.md
- [ ] Update API_DOCUMENTATION.md
- [ ] Create migration guides

---

## ⏱️ EFFORT ESTIMATES

| Task | Estimated Hours | Priority |
|------|----------------|----------|
| Resolve migration conflicts | 4-6h | 🔴 HIGH |
| Asset table consolidation | 8-12h | 🟡 MEDIUM |
| Content table consolidation | 10-14h | 🟡 MEDIUM |
| Connector schema migration | 40-60h | 🟢 LOW (Strategic) |
| Test file updates | 8-12h | 🟡 MEDIUM |
| Documentation updates | 6-8h | 🟡 MEDIUM |
| **TOTAL (without connector)** | **36-52h** | **~1 week** |
| **TOTAL (with connector)** | **76-112h** | **~2 weeks** |

---

## 🎯 RECOMMENDED EXECUTION ORDER

1. **Resolve Migration Conflicts** (Day 1-2)
   - Critical blocker for other work
   - Low risk, high value

2. **Asset Table Consolidation** (Day 3-4)
   - Medium complexity
   - Clear migration path
   - 14 file updates

3. **Content Table Consolidation** (Day 5-6)
   - Requires investigation first
   - 9 file updates
   - Medium complexity

4. **Test & Documentation Updates** (Day 7-8)
   - After code changes
   - Verify everything works

5. **Connector Schema Migration** (Future/Optional)
   - Strategic decision
   - High effort
   - Can be separate project

---

## 🚨 CRITICAL WARNINGS

### ⚠️ DO NOT DELETE WITHOUT BACKUP
- Always create full database backup before migrations
- Keep old tables for 30 days before dropping
- Have rollback migrations ready

### ⚠️ PRODUCTION QUERY ANALYSIS REQUIRED
Before deleting any table:
```sql
-- Check actual table usage in production
SELECT 
  schemaname, tablename, 
  seq_scan, seq_tup_read, 
  idx_scan, idx_tup_fetch,
  n_tup_ins, n_tup_upd, n_tup_del
FROM pg_stat_user_tables
WHERE tablename IN ('user_profiles', 'user_preferences', ...);
```

If `seq_scan > 0` or `idx_scan > 0`, table IS being used!

### ⚠️ TEST EVERYTHING IN STAGING FIRST
- Never test schema changes in production first
- Run full test suite after each change
- Monitor error logs for 48 hours after each deployment

---

## ✅ SUCCESS CRITERIA

- [ ] No duplicate table definitions
- [ ] All migration conflicts resolved
- [ ] Asset tables consolidated (3 → 1)
- [ ] Content tables consolidated (2 → 1)
- [ ] All file references updated
- [ ] All tests passing
- [ ] Documentation updated
- [ ] No production errors
- [ ] Query performance maintained or improved

---

**End of Unused Code Cleanup Document**

For overall schema cleanup strategy, see `SCHEMA_FINAL_PLAN.md`.
For tables to keep, see `SCHEMA_KEEP_LIST.md`.
For tables to delete, see `SCHEMA_DELETE_LIST.md`.


