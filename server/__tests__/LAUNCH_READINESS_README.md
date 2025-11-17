# Backend Launch Readiness Test

Comprehensive validation script for backend launch readiness.

## Quick Start

### Option 1: Standalone Script (Recommended)

```bash
pnpm test:launch
```

This runs the standalone script at `server/scripts/launch-readiness.ts`.

### Option 2: Vitest Test Suite

```bash
pnpm test server/__tests__/launch-readiness.test.ts
```

## Prerequisites

1. **Environment Variables**
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Service role key (bypasses RLS)

   These should be in `.env.local` or `.env`:
   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **Server Running (for API tests)**
   - Start the dev server: `pnpm dev`
   - Or ensure production server is running on port 8080

## What It Tests

### 1. Supabase Schema Validation

**Check A - Required Tables Exist:**
- Verifies all 18 required tables exist
- Reports missing tables with clear error messages

**Check B - Basic Columns Exist:**
- Validates key columns on critical tables:
  - `brands`: id, name, tenant_id
  - `brand_members`: id, user_id, brand_id, role
  - `media_assets`: id, brand_id, path
  - `analytics_metrics`: id, brand_id, platform, date, metrics
  - `content_items`: id, brand_id, type, content

### 2. Insert + Select Test Data

- Inserts test tenant
- Inserts test brand
- Inserts test user membership
- Queries all three to confirm RLS allows service key access

### 3. API Endpoint Smoke Test

Tests these endpoints:
- `GET /api/health`
- `GET /api/brand-intelligence/:brandId`
- `GET /api/media/list`
- `GET /api/analytics/:brandId?days=30`
- `GET /api/brands/:brandId/posting-schedule`
- `GET /api/brands/:brandId/members`
- `GET /api/reviews/:brandId`
- `POST /api/media/upload` (validation only)
- `POST /api/media/track-usage` (validation only)

**Expected:**
- 200 or 204 responses for valid requests
- 400/401/403 for invalid/unauthorized requests
- 404 indicates missing route registration

### 4. Brand Access Test

- Tests with valid `brandId` → should succeed (or require auth)
- Tests with random `brandId` → should 403 (forbidden)

### 5. Advisor Validation Test

- Calls `POST /api/ai/advisor` with invalid body `{}`
- Expects HTTP 400 with structured Zod validation error
- Verifies error response has proper structure

## Output

The script produces a final report:

```
============================================================
LAUNCH READINESS SUMMARY
============================================================
✅ PASS - Supabase schema
✅ PASS - Test inserts
✅ PASS - Critical endpoints
✅ PASS - Brand access model
✅ PASS - Advisor validation
✅ PASS - Media service
✅ PASS - Required tables
✅ PASS - RLS behavior
============================================================
✅ ALL CHECKS PASSED - BACKEND IS LAUNCH READY
============================================================
```

## Fix Mode

If any checks fail:

1. **Missing Tables:**
   - Run the appropriate migration files
   - See `docs/SUPABASE_TABLES_REQUIRED.md` for table list

2. **Missing Routes:**
   - Check `server/index.ts` for route registration
   - Verify route handlers exist in `server/routes/`

3. **Validation Errors:**
   - Check Zod schemas in `shared/validation-schemas.ts`
   - Verify error handling in route handlers

4. **Brand Access Issues:**
   - Ensure `assertBrandAccess()` is called in brand-scoped routes
   - See `server/lib/brand-access.ts`

## Troubleshooting

### "Missing Supabase credentials"
- Check `.env.local` or `.env` file
- Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set

### "Server not running"
- API endpoint tests will be skipped
- Start server with `pnpm dev` to test endpoints

### "Table does not exist"
- Run migrations: `supabase/migrations/*.sql`
- See `docs/SUPABASE_TABLES_REQUIRED.md` for required tables

### "Route failing: 404"
- Check route registration in `server/index.ts`
- Verify route handler exists in `server/routes/`

## Related Documentation

- `docs/SUPABASE_TABLES_REQUIRED.md` - Complete table reference
- `docs/BACKEND_LAUNCH_AUDIT.md` - Full backend audit
- `BACKEND_LAUNCH_AUDIT_SUMMARY.md` - Executive summary

