# Pass 2: Runtime Smoke Tests

This document outlines runtime smoke tests to verify that the TypeScript fixes in Pass 2 haven't broken any functionality.

## Purpose

After fixing 108 TypeScript errors in server core, we need to verify:
1. No runtime errors (500s, crashes)
2. Database queries work correctly
3. API responses are properly formatted
4. Services can read/write data successfully

---

## Quick Verification

### 1. TypeScript Compilation ✅

```bash
# Should show 0 errors in server core
pnpm run typecheck 2>&1 | grep "error TS" | grep -E "(server/lib/|server/routes/|server/middleware/|server/workers/|api/)" | wc -l
# Expected: 0
```

### 2. Build Check

```bash
# Should build successfully (may fail on .env file permissions in sandbox, but TypeScript should pass)
pnpm run build
```

---

## Runtime Smoke Tests

### Test 1: Auth & Account Status

**Endpoints to Test:**
- `GET /api/auth/me`
- `POST /api/auth/signup` (if available)

**What to Check:**
- ✅ No 500 errors
- ✅ Response includes user object with `plan_status`, `past_due_since` fields
- ✅ JWT warnings are about missing `JWT_SECRET` config, not hard errors

**Example:**
```bash
# With valid auth token
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/auth/me

# Expected response structure:
{
  "user": {
    "id": "...",
    "email": "...",
    "plan_status": "active" | "trial" | "past_due" | "archived",
    "past_due_since": null | "2024-01-01T00:00:00Z"
  }
}
```

**Files Touched:**
- `server/middleware/account-status.ts` (fixed AppError constructors)
- `server/types/express.d.ts` (Pass 1 - added plan_status, past_due_since)

---

### Test 2: Brand Creation & Brand Guide

**Flow:**
1. Create a brand via UI or API
2. Trigger brand crawl: `POST /api/crawl/start` (if available)
3. Access brand guide: `GET /api/brand-guide/:id` or view in UI

**What to Check:**
- ✅ Brand creation succeeds
- ✅ Crawl starts without errors
- ✅ Brand guide loads (even if empty)
- ✅ Logos/photos save or show graceful warnings (not crashes)
- ✅ Scraper continues even if media download fails

**Files Touched:**
- `server/lib/metadata-processor.ts` (fixed EXIF property access)

---

### Test 3: Client Portal & Publishing Stats

**Endpoints to Test:**
- `GET /api/client-portal/content` (or equivalent)
- `GET /api/publishing/stats` (or equivalent)

**What to Check:**
- ✅ Client portal view loads
- ✅ Publishing stats endpoint returns data
- ✅ No 500 errors when accessing stats
- ✅ Response includes expected fields (platform stats, job counts, etc.)

**Example:**
```bash
# Get publishing stats for a brand
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/publishing/stats?brandId=$BRAND_ID"

# Expected: JSON with platform breakdown, status counts, etc.
```

**Files Touched:**
- `server/lib/publishing-db-service.ts` (fixed property access on unknown)
- `server/routes/publishing.ts` (fixed status comparisons, platform property)
- `server/lib/weekly-summary.ts` (fixed property access in aggregation)

---

### Test 4: Settings & Preferences

**Flow:**
1. Update client settings via UI or API
2. Update user preferences
3. Reload settings - verify they persist

**Endpoints to Test:**
- `GET /api/client-settings`
- `PUT /api/client-settings`
- `GET /api/preferences`
- `PUT /api/preferences`

**What to Check:**
- ✅ Settings save successfully
- ✅ Settings reload correctly
- ✅ Email preferences structure is valid
- ✅ Language/timezone settings persist
- ✅ No type conversion errors

**Example:**
```bash
# Update preferences
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notifications": {"emailNotifications": true}}' \
  "http://localhost:8080/api/preferences?brandId=$BRAND_ID"

# Verify update
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/preferences?brandId=$BRAND_ID"
```

**Files Touched:**
- `server/routes/client-settings.ts` (fixed property access on ClientSettingsRecord)
- `server/lib/preferences-db-service.ts` (fixed property access on unknown)

---

### Test 5: Publishing Workflow

**Flow:**
1. Create a publishing job
2. Check job status
3. Reschedule a job (if status is "scheduled" or "pending")

**Endpoints to Test:**
- `POST /api/publishing/schedule`
- `GET /api/publishing/jobs/:id`
- `PUT /api/publishing/reschedule/:id`

**What to Check:**
- ✅ Jobs create successfully
- ✅ Job status is one of: "pending" | "processing" | "published" | "failed" | "scheduled"
- ✅ Reschedule only works on "scheduled" or "pending" jobs (not "processing", "published", "failed")
- ✅ Platform array is correctly stored/retrieved

**Files Touched:**
- `server/routes/publishing.ts` (fixed status comparison, platform property)
- `server/lib/publishing-db-service.ts` (fixed property access)

---

### Test 6: Webhook Handling

**Endpoints to Test:**
- `POST /api/webhooks/stripe` (or other webhook endpoints)

**What to Check:**
- ✅ Webhook signature validation works
- ✅ No errors when processing webhook events
- ✅ Event attempt_count is tracked correctly

**Files Touched:**
- `server/lib/webhook-handler.ts` (fixed property access on unknown)
- `server/routes/webhooks/stripe.ts` (fixed AppError constructor)

---

### Test 7: AI Content Generation

**Endpoints to Test:**
- `POST /api/ai/generate`
- `GET /api/ai/providers`

**What to Check:**
- ✅ Content generation request succeeds (or fails gracefully)
- ✅ Provider status endpoint returns correct structure
- ✅ Response has `content` as string (not object)

**Files Touched:**
- `server/routes/ai.ts` (fixed type mismatches - AIGenerationOutput extraction, AIProviderStatus structure)

---

## Automated Test Suite

Run your existing test suite to catch any obvious issues:

```bash
# Run all tests
pnpm test

# Run only server tests
pnpm test server

# Run with coverage
pnpm test --coverage
```

**What to Look For:**
- ✅ No new test failures
- ✅ Route handlers still match expected signatures
- ✅ Service functions return expected types
- ✅ Mock data matches updated interfaces

---

## Error Log Review

After running smoke tests, check logs for:

1. **Type Errors in Runtime**: Should see none (TypeScript catches these now)
2. **Database Query Errors**: Check for column name mismatches
3. **Property Access Errors**: Should not see "Cannot read property X of undefined"
4. **Type Conversion Errors**: Watch for unexpected type coercions

**Common Patterns to Watch For:**
- `Property 'X' does not exist on type 'unknown'` → Should be caught at compile time now
- `Cannot read property 'X' of undefined` → Runtime error, check null handling
- `TypeError: X is not a function` → Function signature mismatch

---

## Success Criteria

✅ **All smoke tests pass:**
- No 500 errors on happy paths
- Data saves and loads correctly
- API responses match expected structure
- Type errors caught at compile time (not runtime)

✅ **Database schema aligns:**
- All accessed columns exist
- Column types match TypeScript interfaces
- JSON/jsonb structures are valid

✅ **Tests pass:**
- Existing test suite runs successfully
- No new failures introduced

---

## Troubleshooting

### If You See 500 Errors:

1. **Check logs** - Look for stack traces pointing to files we modified
2. **Verify database schema** - Run SQL queries from `PASS2_DATABASE_SCHEMA_VERIFICATION.md`
3. **Check type assertions** - Some `as unknown as X` might be too aggressive
4. **Review null handling** - We may have introduced stricter null checks

### If Database Queries Fail:

1. **Verify column names** - Snake_case in DB vs camelCase in code
2. **Check JSON structure** - Verify jsonb columns have expected shape
3. **Confirm enum values** - Status fields match database constraints

### If Type Mismatches Occur:

1. **Check shared types** - Ensure interfaces match between client/server
2. **Verify API responses** - Response types should match route handlers
3. **Review type guards** - Ensure proper narrowing of `unknown` types

---

## Notes

- These tests are **smoke tests**, not comprehensive integration tests
- Focus on **happy paths** - we're verifying nothing broke, not testing edge cases
- If tests pass, you can be confident the TypeScript fixes are safe
- Any failures should be investigated before proceeding to Pass 5

---

## Quick Test Checklist

Quick manual verification checklist:

- [ ] Typecheck passes (0 errors in server core)
- [ ] Build completes successfully
- [ ] Auth endpoints work (`/api/auth/me`)
- [ ] Client portal loads without errors
- [ ] Publishing stats endpoint returns data
- [ ] Settings can be saved and reloaded
- [ ] Publishing jobs can be created
- [ ] No unexpected 500 errors in logs
- [ ] Test suite passes
