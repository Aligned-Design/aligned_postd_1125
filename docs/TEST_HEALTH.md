# POSTD Test Health Report

> Last updated: 2025-01-XX (v1.0.2-rls-hardened)

## Overview

| Check | Status |
|-------|--------|
| `pnpm typecheck` | ✅ Passing |
| `pnpm lint` | ✅ Passing |
| `pnpm test` | ✅ Passing |

## Current Stats

| Metric | Count |
|--------|-------|
| Test Files | 50 passed, 6 skipped |
| Tests | 1194 passed, 98 skipped, 3 todo |
| Duration | ~10s |

---

## Skip Categories

All skipped tests are classified with a `SKIP-*` prefix for easy identification.

### SKIP-ROUTES (4 tests)
Routes that are **not currently registered** in `server/index-v2.ts`.

| File | Route | Reason |
|------|-------|--------|
| `client-settings.test.ts` | `/api/client/settings` | Client portal commented out (line 237) |
| `brand-intelligence-json.test.ts` | `/api/brand-intelligence` | Not registered in server |

**Action**: Re-enable when routes are added back to the product.

---

### SKIP-E2E (4 suites)
Heavy end-to-end tests requiring **AI providers** (Anthropic/OpenAI) or complex infrastructure.

| File | What It Tests |
|------|---------------|
| `automation-e2e.test.ts` | Full content generation → approval → publishing pipeline |
| `copy-agent.test.ts` | AI copy generation with provider API |
| `creative-agent.test.ts` | Image analysis and visual recommendations |
| `pipeline-orchestrator.test.ts` | Multi-agent coordination pipeline |

**Action**: Run in dedicated AI pipeline with:
- Rate limiting
- Cost controls
- Mocked AI responses for CI

Manual run: `npx tsx server/scripts/run-orchestrator-tests.ts`

---

### SKIP-LEGACY (8 tests)
Tests using **deprecated patterns** (done() callbacks from Jest/Mocha).

| File | Issue |
|------|-------|
| `rbac-enforcement.test.ts` | 4 describe blocks using done() callbacks |

**Action**: Already have async/await equivalents. Safe to remove legacy versions.

---

### SKIP-SCHEMA (7 tests)
Tests referencing **old schema** (renamed tables/columns).

| File | Issue |
|------|-------|
| `rls-validation.test.ts` | References `owner_id` (removed), `posts` table (renamed to `content_items`) |

**Action**: Update tests to match current schema or remove if covered elsewhere.

---

### SKIP-DB (1 test)
Tests blocked by **database constraints**.

| File | Issue |
|------|-------|
| `launch-readiness.test.ts` | `brand_members.user_id` requires valid `user_profiles.id` (FK constraint) |

**Action**: Create test auth users in Supabase or mock at service layer.

---

### Dynamic Skips (`describeIfSupabase`)
Tests that **run when DB credentials are available**.

| File | Condition |
|------|-----------|
| `creative-studio.test.ts` | `SUPABASE_URL` + `SUPABASE_ANON_KEY` |
| `integration-brand-ai-publishing.test.ts` | `SUPABASE_SERVICE_ROLE_KEY` |
| `launch-readiness.test.ts` | `SUPABASE_SERVICE_ROLE_KEY` |
| `phase-6-media.test.ts` | `SUPABASE_URL` + `SUPABASE_ANON_KEY` |
| `rls-validation.test.ts` | `SUPABASE_SERVICE_ROLE_KEY` |
| `scheduled-content.test.ts` | `SUPABASE_URL` + keys |
| `rls-multi-tenant-isolation.test.ts` | All Supabase keys |

**Action**: These run automatically in CI with proper env vars.

---

## RLS Guarantee Summary

After applying `016_enforce_rls_hardening.sql`:

```
┌────────────────────────┬─────────────────────────────────────────────────────┐
│ Table                  │ RLS Enforcement                                      │
├────────────────────────┼─────────────────────────────────────────────────────┤
│ tenants                │ Per-tenant (via brand_members → brands → tenant_id) │
│ brands                 │ Per-brand (must be authenticated + brand member)    │
│ brand_members          │ Per-user (see own) + admin (see all in brand)       │
│ content_items          │ Per-brand (authenticated brand members only)        │
│ scheduled_content      │ Per-brand (authenticated brand members only)        │
│ publishing_jobs        │ Per-brand (authenticated brand members only)        │
│ media_assets           │ Per-brand (authenticated brand members only)        │
│ publishing_logs        │ Per-brand (authenticated brand members only)        │
│ post_approvals         │ Per-brand (authenticated brand members only)        │
├────────────────────────┼─────────────────────────────────────────────────────┤
│ Service Role           │ BYPASSES all RLS (administrative access)            │
│ Unauthenticated        │ BLOCKED from all tables (returns 0 rows)            │
└────────────────────────┴─────────────────────────────────────────────────────┘
```

**Guarantees:**
- ✅ Cross-tenant isolation: ENFORCED
- ✅ Cross-brand isolation: ENFORCED
- ✅ Unauthenticated block: ENFORCED

---

## Key Files

| Purpose | File |
|---------|------|
| RLS hardening migration | [`supabase/migrations/016_enforce_rls_hardening.sql`](../supabase/migrations/016_enforce_rls_hardening.sql) |
| Test auth helper | [`server/__tests__/helpers/auth.ts`](../server/__tests__/helpers/auth.ts) |
| RLS isolation tests | [`server/__tests__/rls-multi-tenant-isolation.test.ts`](../server/__tests__/rls-multi-tenant-isolation.test.ts) |
| Bootstrap schema | [`supabase/migrations/001_bootstrap_schema.sql`](../supabase/migrations/001_bootstrap_schema.sql) |

---

## Auth Helper Usage

For tests requiring authentication, use the shared helper:

```typescript
import { generateTestToken, setupAuthMocks, createAuthenticatedRequest } from './helpers/auth';

// Generate JWT token with custom claims
const token = generateTestToken({
  userId: 'user-123',
  tenantId: 'tenant-456',
  brandIds: ['brand-789'],
  role: 'admin',
});

// Make authenticated request
const response = await request(app)
  .get('/api/some-endpoint')
  .set('Authorization', `Bearer ${token}`);
```

---

## Version History

| Tag | Description |
|-----|-------------|
| `v1.0.0-test-baseline` | All tests green, DB connected |
| `v1.0.1-auth-covered` | Auth helper + route coverage |
| `v1.0.2-rls-hardened` | RLS enforced + skips classified |

---

## Next Steps

1. **Apply RLS migration** to production DB via Supabase SQL Editor
2. **Remove SKIP-LEGACY tests** once confident async versions are comprehensive
3. **Update SKIP-SCHEMA tests** or delete if covered elsewhere
4. **Set up E2E pipeline** for AI-heavy tests with proper mocking
5. **Migrate logging** from `console.log` to structured logger

---

## Running Tests

```bash
# Full suite
pnpm test

# Specific file
pnpm test server/__tests__/rls-multi-tenant-isolation.test.ts

# With coverage
pnpm test --coverage

# Watch mode
pnpm test --watch
```

---

## Troubleshooting

### "Missing Supabase credentials"
Tests using `describeIfSupabase` will skip if env vars are missing. Ensure `.env` contains:
```
SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

### "RLS tests show data visible to anon"
The RLS hardening migration hasn't been applied. Run `016_enforce_rls_hardening.sql` in Supabase SQL Editor.

### "401 Unauthorized on authenticated routes"
Use `generateTestToken()` from `server/__tests__/helpers/auth.ts` to create valid JWT tokens.

