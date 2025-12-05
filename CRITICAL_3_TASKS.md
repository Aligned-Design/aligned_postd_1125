# Critical 3 Tasks - Environment, RLS, Types

**Status**: ⏳ PENDING  
**Priority**: 🔴 CRITICAL

These three tasks must be completed to ensure the system is properly wired and secure.

---

## Task 1: Environment Variables in Vercel

### Checklist

**Supabase Configuration** (REQUIRED):
- [ ] `VITE_SUPABASE_URL` - Set in Vercel
- [ ] `VITE_SUPABASE_ANON_KEY` - Set in Vercel
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Set in Vercel
- [ ] `SUPABASE_URL` - Set in Vercel (server-side, same as VITE_SUPABASE_URL)

**AI Provider Configuration** (REQUIRED for AI features):
- [ ] `ANTHROPIC_API_KEY` - Set in Vercel
- [ ] `ANTHROPIC_MODEL` - Set in Vercel (optional, defaults to claude-3-5-sonnet-latest)
- [ ] `OPENAI_API_KEY` - Set in Vercel (optional, if using OpenAI)

**Application URLs** (REQUIRED):
- [ ] `VITE_APP_URL` - Set in Vercel (e.g., https://aligned-20ai.vercel.app)
- [ ] `VITE_API_BASE_URL` - Set in Vercel (same as VITE_APP_URL)

**Other Required**:
- [ ] `NODE_ENV` - Set to "production" in Vercel

### How to Verify

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Compare with `server/utils/validate-env.ts` validators
3. Run validation script:
   ```bash
   npm run validate:env
   ```

### Reference

- `VERCEL_ENV_CHECKLIST.md` - Detailed checklist
- `server/utils/validate-env.ts` - Validation script

---

## Task 2: RLS Verification

### SQL Query to Check RLS Status

Run this in Supabase SQL Editor:

```sql
-- Check which tables have RLS enabled
SELECT 
  tablename, 
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Expected Results

All brand/tenant-scoped tables should have `RLS Enabled = true`:
- ✅ `brands`
- ✅ `brand_members`
- ✅ `content_items`
- ✅ `media_assets`
- ✅ `scheduled_content`
- ✅ `publishing_jobs`
- ✅ `analytics_data`
- ✅ `approval_requests`
- ✅ All other tenant-scoped tables

### Manual Verification Steps

1. **Check RLS is enabled**:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('brands', 'media_assets', 'content_items');
   ```

2. **Test with logged-in user**:
   - Log in as a test user
   - Try to query brands table
   - Should only see brands user has access to

3. **Verify brand_id policies**:
   ```sql
   -- Check policies on brands table
   SELECT 
     schemaname,
     tablename,
     policyname,
     permissive,
     roles,
     cmd,
     qual
   FROM pg_policies
   WHERE tablename = 'brands';
   ```

### Reference

- `supabase/migrations/001_bootstrap_schema.sql` - RLS policies
- `supabase/migrations/010_ensure_rls_policies_use_brand_id_uuid.sql` - UUID migration

---

## Task 3: Regenerate Supabase Types

### Steps

1. **Get your Supabase Project ID**:
   - Go to Supabase Dashboard → Project Settings → General
   - Copy the "Reference ID"

2. **Generate types**:
   ```bash
   npx supabase gen types typescript --project-id <YOUR_PROJECT_ID> > shared/supabase-types.ts
   ```

3. **Verify types**:
   ```bash
   pnpm typecheck
   ```

4. **Fix any type issues**:
   - Review generated types
   - Update code if types changed
   - Commit updated types

### Expected Output

The `shared/supabase-types.ts` file should contain:
- Type definitions for all tables
- Type definitions for all columns
- JSONB type definitions for brand_kit, content, etc.

### Verification

After generating types:
1. Run TypeScript check: `pnpm typecheck`
2. Check for type errors in IDE
3. Verify imports work: `import type { Database } from '@shared/supabase-types'`

---

## Completion Checklist

- [ ] All environment variables set in Vercel
- [ ] Environment validation script passes
- [ ] RLS enabled on all brand/tenant tables
- [ ] RLS policies verified
- [ ] Supabase types regenerated
- [ ] TypeScript check passes
- [ ] All type errors resolved

---

## Notes

- These tasks should be done in order (env vars → RLS → types)
- After completing, run full test suite
- Document any issues found during verification

