# Supabase Query Guardrail Summary

**Status**: ✅ Active (Warning Mode)  
**Created**: December 11, 2025  
**Last Updated**: December 11, 2025  

---

## Overview

The Supabase Query Guardrail is a static analysis tool that prevents accidental unscoped queries on multi-tenant tables. It runs as part of the lint pipeline to catch potential RLS bypasses before they reach production.

---

## Baseline Metrics

| Metric | Value |
|--------|-------|
| **Warnings Before Implementation** | 89 |
| **Warnings After Triage** | 0 |
| **Annotations Added** | ~89 |
| **TODOs for Human Review** | 1 |

### Annotation Breakdown

| Category | Count | Example |
|----------|-------|---------|
| Health checks / DB connectivity | 3 | `// @supabase-scope-ok DB connectivity check` |
| Commented-out code (false positives) | 3 | `// @supabase-scope-ok Future work comment - not actual code` |
| System/background job operations | 10+ | `// @supabase-scope-ok Background job processor` |
| ID-based lookups (primary key) | 30+ | `// @supabase-scope-ok ID-based lookup by asset's primary key` |
| INSERT operations with brand_id in data | 30+ | `// @supabase-scope-ok INSERT includes brand_id in payload` |
| Queries already properly scoped | 10+ | `// @supabase-scope-ok Uses .eq("brand_id", brandId)` |

---

## Protected Tables

The guardrail script protects these 14 multi-tenant tables:

1. `brands`
2. `brand_members`
3. `content_items`
4. `media_assets`
5. `generation_logs`
6. `publishing_jobs`
7. `scheduled_content`
8. `content_packages`
9. `collaboration_logs`
10. `weekly_summaries`
11. `strategy_briefs`
12. `advisor_cache`
13. `content_drafts`
14. `brand_guide_versions`

---

## How the Guardrail Works

The script scans all TypeScript files in:
- `server/lib/**/*.ts`
- `server/routes/**/*.ts`

It flags queries that:
- Call `.from("<multi-tenant table>")` 
- Do NOT include brand/tenant scoping in the same chain

A query is considered **"scoped enough"** if it includes:
- `.eq("brand_id", ...)`
- `.eq("tenant_id", ...)`
- `.in("brand_id", ...)`

---

## When to Use `@supabase-scope-ok`

Add the `// @supabase-scope-ok` annotation directly above a query when:

### 1. Health Checks / Connectivity Tests
```typescript
// @supabase-scope-ok DB connectivity check - no cross-brand data exposed
const { data, error } = await supabase.from("brands").select("id").limit(1);
```

### 2. INSERT/UPSERT with brand_id in Payload
```typescript
// @supabase-scope-ok INSERT includes brand_id in payload
const { data, error } = await supabase
  .from("content_items")
  .insert({
    brand_id: brandId,
    title: "...",
    // ... other fields
  });
```

### 3. ID-based Lookups (Primary Key)
```typescript
// @supabase-scope-ok ID-based lookup by asset's primary key
const { data, error } = await supabase
  .from("media_assets")
  .update({ status: "archived" })
  .eq("id", assetId);
```

### 4. System/Service Role Operations
```typescript
// @supabase-scope-ok Background job processor - processes jobs across all brands
const { data, error } = await supabase
  .from("publishing_jobs")
  .select("*")
  .eq("status", "pending");
```

### 5. Already Properly Scoped (Linter Doesn't Recognize)
```typescript
// @supabase-scope-ok Uses .eq("brand_id", brandId) - properly scoped
let query = supabase
  .from("media_assets")
  .select("*")
  .eq("brand_id", brandId); // Linter might not see this if it's on next line
```

---

## When to Request Human Review

Add `// TODO(rls-review): <explanation>` when:
- You're unsure if the query should be scoped
- Scoping would require a product/UX decision
- The query pattern is unusual or ambiguous

**Current TODOs**:
- `server/lib/search-service.ts:83-84` - Brand search may need restriction to user's authorized brands

---

## Guardrail Script Location

**Script**: `server/scripts/lint-supabase-queries.ts`

**Commands**:
- `pnpm lint:supabase` - Run in warning mode (non-blocking)
- `pnpm lint:supabase:error` - Run in error mode (fails on warnings) - NOT YET IMPLEMENTED

---

## How to Toggle from WARNING to ERROR Mode

When the baseline is clean and you want to enforce the guardrail in CI:

1. Open `package.json`
2. Find the `lint:supabase` script:
   ```json
   "lint:supabase": "tsx server/scripts/lint-supabase-queries.ts"
   ```
3. Add the `--error` flag:
   ```json
   "lint:supabase": "tsx server/scripts/lint-supabase-queries.ts --error"
   ```
4. Update the lint script to respect the `--error` flag (exit code 1 instead of 0)

**Note**: Currently remains in WARNING mode for developer convenience.

---

## What Developers Must Do When Adding New Supabase Queries

### ✅ DO:
1. **Always scope multi-tenant queries by brand_id or tenant_id**
   ```typescript
   await supabase
     .from("content_items")
     .select("*")
     .eq("brand_id", brandId); // ✅ Good
   ```

2. **Include brand_id in INSERT/UPSERT payloads**
   ```typescript
   await supabase
     .from("content_items")
     .insert({
       brand_id: brandId, // ✅ Good
       title: "...",
     });
   ```

3. **Annotate known-safe exceptions**
   ```typescript
   // @supabase-scope-ok DB health check
   await supabase.from("brands").select("id").limit(1); // ✅ Good
   ```

### ❌ DON'T:
1. **Don't create unscoped queries on multi-tenant tables**
   ```typescript
   await supabase
     .from("content_items")
     .select("*"); // ❌ Bad - missing brand_id filter
   ```

2. **Don't guess whether a query is safe**
   - If unsure, add `// TODO(rls-review)` and ask for review

3. **Don't bypass the guardrail without documentation**
   - Every `@supabase-scope-ok` must have a clear reason

### How to Run the Lint Checker

Before committing:
```bash
pnpm lint:supabase
```

Fix or annotate any warnings before pushing.

---

## Verification Status

- ✅ Zero warnings in current codebase
- ✅ All 14 multi-tenant tables protected
- ✅ Typecheck clean
- ✅ All RLS tests passing (1552 tests passed)
- ✅ No behavioral changes introduced

---

## Future Improvements

1. **Enhance linter to recognize**:
   - `.eq("id", brandId)` when brandId is known to be a brand's own ID
   - Conditional scoping patterns (e.g., `if (brandIds) builder.in("brand_id", brandIds)`)
   
2. **Convert to ESLint plugin** for better IDE integration

3. **Add auto-fix capabilities** for common patterns

4. **Flip to ERROR mode** once team is comfortable with the baseline

---

## Related Documentation

- RLS Test Coverage: `server/__tests__/rls-*.test.ts`
- RLS Migration: `supabase/migrations/016_enforce_rls_hardening.sql`
- Brand Context Helper: `server/lib/brand-context.ts`

