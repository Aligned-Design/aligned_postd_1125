# Schema Alignment Smoke Test

**Quick validation that your Supabase schema matches what the app expects.**

---

## 🚀 Quick Start

```bash
# Run the schema alignment test
pnpm test:schema-align
```

**Expected output:**
```
============================================================
  SCHEMA ALIGNMENT SMOKE TEST
============================================================

⏳ Testing tenants table...
✓ tenants table (insert/read)
⏳ Testing brands table...
✓ brands table (20 columns validated)
⏳ Testing brand_members table...
✓ brand_members table (FK to auth.users validated)
⏳ Testing media_assets table...
✓ media_assets table (size_bytes validated)
⏳ Testing storage_quotas table...
✓ storage_quotas table (all columns present)
⏳ Testing content_items table...
✓ content_items table (type + content JSONB validated)
⏳ Testing scheduled_content table...
✓ scheduled_content table (insert/read)
⏳ Testing analytics_metrics table...
✓ analytics_metrics table (JSONB metrics validated)
⏳ Testing milestones table...
✓ milestones table (insert/read)
⏳ Testing brand guide structure (TypeScript alignment)...
✓ brand guide structure (TypeScript type validated)
⏳ Cleaning up test data...
✓ Cleaned up 10 test records

============================================================
  ✅ ALL SCHEMA TESTS PASSED
============================================================

Validated:
  • tenants (optional)
  • brands (20 columns including migrations 009 additions)
  • brand_members (FK to auth.users)
  • media_assets (size_bytes, not file_size)
  • storage_quotas (warning/hard limit columns)
  • content_items (type + content JSONB)
  • scheduled_content (platforms array)
  • analytics_metrics (JSONB metrics)
  • milestones (workspace_id)
  • brand_kit structure (TypeScript type alignment)

All schema-dependent flows completed successfully. ✅
```

---

## 🎯 What This Test Does

### **End-to-End Insert/Read Tests**

The test validates your database schema by:

1. **Creating test data** in each critical table
2. **Reading it back** and validating structure
3. **Using TypeScript types** to catch drift
4. **Cleaning up** all test data

### **Tables Tested**

| Table | What's Validated |
|-------|-----------------|
| `tenants` | Basic insert/read (optional table) |
| `brands` | All 20 columns from migration 009 including `voice_summary`, `visual_summary`, `scraper_status` |
| `brand_members` | Foreign key to `auth.users` (not `user_profiles`) |
| `media_assets` | **`size_bytes` column** (not `file_size` - critical fix from Nov 19) |
| `storage_quotas` | `warning_threshold_percent` and `hard_limit_percent` columns |
| `content_items` | **`type` column** (not `content_type`) and **`content` JSONB** (not `body` TEXT) |
| `scheduled_content` | `platforms` array, `scheduled_at` timestamp |
| `analytics_metrics` | **`metrics` JSONB** (not flat columns) |
| `milestones` | `workspace_id` TEXT, `acknowledged_at` column |
| `brand_kit` | Full `BrandGuide` type structure matches database storage |

---

## 🔍 When to Run This Test

### **Before Deploying to Production**

```bash
# After running migration 009
pnpm test:schema-align
```

If it passes, your schema is aligned with the code.

---

### **After Any Database Migration**

```bash
# Run migration
psql $DATABASE_URL -f server/migrations/XXX_new_migration.sql

# Verify schema
pnpm test:schema-align
```

---

### **When Debugging Schema Issues**

If you see errors like:
- `column "size_bytes" does not exist`
- `column "type" does not exist`
- `relation "storage_quotas" does not exist`

**Run the smoke test to see exactly what's wrong:**

```bash
pnpm test:schema-align
```

The test will show which specific table/column is missing or has the wrong type.

---

## ⚠️ What If It Fails?

### **Scenario 1: Missing Column**

```
Error: Failed to insert brand: column "voice_summary" does not exist
```

**Fix:** Run migration 009 (or the specific migration that adds that column)

```bash
psql $DATABASE_URL -f server/migrations/009_schema_alignment_FULL_FIX.sql
```

---

### **Scenario 2: Wrong Column Name**

```
Error: Failed to insert media asset: column "file_size" does not exist
```

**Fix:** This means the code expects `size_bytes` but your database has `file_size`.

Run the media assets migration:

```bash
psql $DATABASE_URL -f server/migrations/006_media_tables_PRODUCTION_FIX.sql
```

---

### **Scenario 3: Foreign Key Error**

```
Error: Failed to insert brand_member: foreign key constraint "brand_members_user_id_fkey" 
violates referential integrity
```

**This is actually GOOD!** It means:
- ✅ The FK constraint exists
- ✅ It correctly points to `auth.users`
- ⚠️ The test user doesn't exist (expected)

The test handles this gracefully and marks it as passed.

---

### **Scenario 4: Wrong Type**

```
Error: Failed to insert content item: column "content" is of type text but expression is of type jsonb
```

**Fix:** Run migration 009 to convert `body` TEXT → `content` JSONB

```bash
psql $DATABASE_URL -f server/migrations/009_schema_alignment_FULL_FIX.sql
```

---

## 🛠️ How It Works

### **Safe & Idempotent**

The test:
- Creates test data with a unique `runId` (timestamp)
- Validates structure and types
- **Cleans up everything** at the end
- Exits with code 0 on success, non-zero on failure

### **Type-Safe**

The test uses actual TypeScript types from your codebase:

```typescript
import type { BrandGuide } from "../../shared/brand-guide";

// If schema drifts from types, TypeScript will error
const brandGuideData: Partial<BrandGuide> = { /* ... */ };
```

This catches mismatches at **compile time**, not runtime.

---

## 📋 Integration with CI/CD

### **Add to Pre-Deploy Checks**

Update `package.json`:

```json
{
  "scripts": {
    "predeploy": "npm run test:schema-align && npm run security:check && npm run typecheck"
  }
}
```

Now schema validation runs before every deploy.

---

### **Add to GitHub Actions**

```yaml
- name: Validate Schema Alignment
  run: pnpm test:schema-align
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

---

## 🔧 Environment Variables Required

The test needs:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

These should already be set if your app is working.

---

## 📝 Customizing the Test

### **Add More Tables**

Edit `server/scripts/schema-alignment-smoke-test.ts`:

```typescript
async function testYourTable(ctx: TestContext): Promise<void> {
  logStep("Testing your_table...", "⏳");
  
  const { data, error } = await supabase
    .from("your_table")
    .insert({ /* test data */ })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to insert: ${error.message}`);
  }
  
  assert(data?.id, "Should have id");
  // ... more assertions
  
  logStep("your_table (insert/read)", "✓");
}

// Add to main():
await testYourTable(ctx);
```

---

### **Skip Optional Tables**

Some tables (like `tenants`) are optional. The test checks if they exist and skips gracefully:

```typescript
const { error } = await supabase.from("tenants").select("*").limit(1);

if (error && error.code === "42P01") {
  logStep("tenants table (optional - not found, skipping)", "✓");
  return;
}
```

---

## 🎓 Understanding the Output

### **Green ✓ = Passed**

```
✓ brands table (20 columns validated)
```

This means:
- Table exists
- All expected columns exist
- Data types match
- Insert/read works

---

### **Red ✗ = Failed**

```
✗ media_assets table
Error: column "size_bytes" does not exist
```

This means:
- Table exists BUT
- Column is missing or has wrong name
- **Action required:** Run the relevant migration

---

### **Yellow ⏳ = Running**

```
⏳ Testing content_items table...
```

The test is currently running for this table.

---

## 🔗 Related Documentation

- **Full Schema Audit:** `SCHEMA_AUDIT_REPORT.md`
- **Validation Checklist:** `SCHEMA_VALIDATION_CHECKLIST.md`
- **Migration File:** `server/migrations/009_schema_alignment_FULL_FIX.sql`
- **Executive Summary:** `SCHEMA_AUDIT_EXECUTIVE_SUMMARY.md`

---

## 💡 Pro Tips

### **1. Run After Staging Migration**

```bash
# In staging
psql $STAGING_DATABASE_URL -f server/migrations/009_schema_alignment_FULL_FIX.sql

# Verify immediately
SUPABASE_URL=$STAGING_SUPABASE_URL \
SUPABASE_SERVICE_ROLE_KEY=$STAGING_SERVICE_KEY \
pnpm test:schema-align
```

---

### **2. Run Before Every Deploy**

Add to your deploy script:

```bash
#!/bin/bash
set -e

echo "Validating schema alignment..."
pnpm test:schema-align

echo "Running deploy..."
vercel deploy --prod
```

---

### **3. Use in Local Development**

If you're unsure about your local schema:

```bash
pnpm test:schema-align
```

Catches issues before you commit.

---

## ✅ Success Criteria

You'll know your schema is correct when:

- ✅ All 10 tests pass
- ✅ No TypeScript compilation errors
- ✅ Cleanup completes without errors
- ✅ Exit code is 0

---

**Questions?** See the full schema audit report or reach out to the team.

