# Supabase Wiring Summary

## Canonical Supabase Clients

### Client-Side (Browser/UI)
**File:** `client/lib/supabase.ts`

**Environment Variables:**
- `VITE_SUPABASE_URL` (required)
- `VITE_SUPABASE_ANON_KEY` (required)

**Features:**
- URL normalization (handles typos like `hhttps://`)
- URL validation
- Throws error if env vars are missing
- Exports `supabase` client instance

**Usage:**
```typescript
import { supabase } from "@/lib/supabase";
```

### Server-Side (Service Role)
**Primary File:** `server/lib/supabase.ts`

**Environment Variables:**
- `SUPABASE_URL` (primary, fallback: `VITE_SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY` (required)

**Features:**
- Service role key validation (checks JWT payload for `role: 'service_role'`)
- Throws error if env vars are missing
- Auth settings: `autoRefreshToken: false`, `persistSession: false`
- Exports `supabase` client instance and `ensureBrandBucket()` helper

**Usage:**
```typescript
import { supabase } from "../lib/supabase";
```

**Secondary File:** `server/lib/dbClient.ts`

**Environment Variables:**
- `SUPABASE_URL` (primary, fallback: `VITE_SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY` (required)

**Features:**
- Same client initialization as `server/lib/supabase.ts`
- Provides database service wrappers for Phase 9 features:
  - `clientSettings`
  - `postApprovals`
  - `auditLogs`
  - `webhookEvents` / `webhookAttempts`
  - `escalationRules` / `escalationEvents`
- Exports `supabase` client instance and service methods

**Usage:**
```typescript
import { supabase, clientSettings, postApprovals } from "../lib/dbClient";
```

**Note:** Both `server/lib/supabase.ts` and `server/lib/dbClient.ts` create service role clients. They serve different purposes:
- `server/lib/supabase.ts` - General server operations (auth, storage, etc.)
- `server/lib/dbClient.ts` - Phase 9 database service layer with error handling

## Environment Variable Requirements

### Client (Browser)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Server
```bash
SUPABASE_URL=https://your-project.supabase.co  # or VITE_SUPABASE_URL as fallback
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Test Configuration

**File:** `vitest.setup.ts`

**Environment Variables (with fallbacks):**
- `TEST_SUPABASE_URL` → falls back to `http://localhost:54321`
- `TEST_SUPABASE_ANON_KEY` → falls back to `'test-anon-key'`
- `TEST_SUPABASE_SERVICE_ROLE_KEY` → falls back to empty string

**Note:** Test setup uses safe fallbacks for local testing. Production code should never use these fallbacks.

## Migration Structure

**Active Migration:**
- `supabase/migrations/001_bootstrap_schema.sql` - Single canonical bootstrap migration

**Archived Migrations:**
- `supabase/migrations/_legacy/` - Legacy migration files (not active)
- `supabase/migrations/archived/` - Archived migration files (not active)

**No shadow migrations found** outside `supabase/migrations/` directory.

## Findings

### ✅ Correct / Clean

1. **Single client-side client** - `client/lib/supabase.ts` is the only active client-side Supabase client
2. **No hardcoded URLs/keys in active code** - All Supabase URLs and keys come from environment variables
3. **Clean migration structure** - Only `001_bootstrap_schema.sql` is active, all others are archived
4. **Proper env var usage** - Client uses `VITE_*` prefix, server uses `SUPABASE_*` prefix
5. **Test setup is safe** - Uses env vars with localhost fallbacks only for tests
6. **Frontend imports are consistent** - All client code imports from `@/lib/supabase`

### ⚠️ Minor Issues (Acceptable)

1. **Two server clients** - `server/lib/supabase.ts` and `server/lib/dbClient.ts` both create service role clients, but serve different purposes (general vs. Phase 9 services)
2. **Test/script files create their own clients** - Test files and utility scripts create their own clients (acceptable for isolation)
3. **Connector files create their own clients** - OAuth connector implementations create their own clients (acceptable for isolation)

### ❌ Issues Fixed

1. **✅ Fixed: Duplicate clients in service files:**
   - `server/lib/connections-db-service.ts` - Now uses `server/lib/supabase.ts`
   - `server/lib/job-recovery.ts` - Now uses `server/lib/supabase.ts`

## Vercel/Supabase Environment Checklist

When deploying to Vercel, ensure these environment variables are set:

### Required Variables

- [ ] `VITE_SUPABASE_URL` - Your Supabase project URL (e.g., `https://xxx.supabase.co`)
- [ ] `VITE_SUPABASE_ANON_KEY` - Your Supabase anon/public key
- [ ] `SUPABASE_URL` - Same as `VITE_SUPABASE_URL` (or can use `VITE_SUPABASE_URL` as fallback)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service_role key (keep secret!)

### Verification Steps

1. **Check Supabase Dashboard:**
   - Go to https://app.supabase.com → Your Project → Settings → API
   - Verify `VITE_SUPABASE_URL` matches "Project URL"
   - Verify `VITE_SUPABASE_ANON_KEY` matches "anon public" key
   - Verify `SUPABASE_SERVICE_ROLE_KEY` matches "service_role secret" key

2. **Verify No Hardcoded Values:**
   - Search codebase for `nsrlgwimixkgwlqrpbxq` (old project ID) - should only appear in docs
   - Search for `supabase.co` in `.ts`/`.tsx` files - should only appear in env var usage

3. **Test Connection:**
   - Deploy to Vercel
   - Check server logs for Supabase initialization messages
   - Verify no "Missing Supabase environment variables" errors

4. **Verify Client Connection:**
   - Open browser console on deployed app
   - Verify no Supabase connection errors
   - Test a simple query (e.g., fetch brands)

## Recommendations

1. **Consolidate duplicate clients** - Update `connections-db-service.ts` and `job-recovery.ts` to use `server/lib/supabase.ts`
2. **Consider unifying server clients** - Evaluate if `server/lib/supabase.ts` and `server/lib/dbClient.ts` can be merged, or document why both are needed
3. **Add env var validation** - Consider adding startup validation that checks all required env vars are present and valid

