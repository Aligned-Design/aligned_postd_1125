# Pass 2: Server Core - Error Analysis Summary

**Date:** 2025-12-01  
**Status:** 🔍 Analysis Complete - Ready for Fixes

---

## STEP 1: TypeCheck Results - Server Core Errors

### Total Server Core Errors: **130 errors**

Filtered to only:
- `server/lib/**`
- `server/routes/**`
- `server/middleware/**`
- `server/workers/**`

---

## Top Files with Most Errors

| Rank | File | Error Count |
|------|------|-------------|
| 1 | `server/routes/client-portal.ts` | 25 errors |
| 2 | `server/lib/publishing-db-service.ts` | 14 errors |
| 3 | `server/lib/weekly-summary.ts` | 13 errors |
| 4 | `server/routes/client-settings.ts` | 12 errors |
| 5 | `server/lib/recovery/auto-pause.ts` | 12 errors |
| 6 | `server/lib/observability.ts` | 9 errors |
| 7 | `server/lib/integrations/wix-client.ts` | 7 errors |
| 8 | `server/lib/platform-apis.ts` | 5 errors |
| 9 | `server/middleware/account-status.ts` | 4 errors |
| 10 | `server/lib/preferences-db-service.ts` | 4 errors |
| 11 | `server/lib/metadata-processor.ts` | 4 errors |
| 12 | `server/routes/publishing.ts` | 3 errors |
| 13 | `server/routes/billing-reactivation.ts` | 3 errors |
| 14 | `server/lib/webhook-handler.ts` | 3 errors |
| 15 | `server/routes/ai.ts` | 2 errors |

---

## Main Error Patterns

### 1. Property Access on `unknown` Type (63 errors - 48%)

**Description:** Accessing properties on values typed as `unknown` without proper type narrowing.

**Examples:**
- `Property 'user' does not exist on type 'unknown'`
- `Property 'platform' does not exist on type 'unknown'`
- `Property 'attempt_count' does not exist on type 'unknown'`

**Common Locations:**
- Database query results from Supabase
- API response parsing
- JSON.parse() results
- Event payloads from webhooks

**Files Most Affected:**
- `server/routes/client-portal.ts` (many `unknown.user` accesses)
- `server/lib/publishing-db-service.ts` (aggregation results)
- `server/lib/preferences-db-service.ts` (DB query results)

**Fix Strategy:**
- Define proper interfaces for DB query results
- Use type guards for API responses
- Add proper type assertions with validation

---

### 2. Object Passed Where String Expected - Logger Calls (28 errors - 22%)

**Description:** Logger functions expecting `string` message but receiving object literals.

**Examples:**
- `Argument of type '{ tenantId: string; error: string; }' is not assignable to parameter of type 'string'`
- `Argument of type '{ jobId: string; queueName: string; }' is not assignable to parameter of type 'string'`

**Common Locations:**
- All logger.info(), logger.error(), logger.warn() calls
- Observability/metrics logging
- Queue logging

**Files Most Affected:**
- `server/lib/recovery/auto-pause.ts` (many logger calls)
- `server/lib/observability.ts` (structured logging)
- `server/lib/weekly-summary.ts`
- `server/queue/workers.ts`

**Fix Strategy:**
- Update logger signature to accept objects OR
- Convert objects to string messages with JSON.stringify() at call sites
- Check if logger utility should accept structured data

---

### 3. Missing Properties (5 errors - 4%)

**Description:** Type definitions missing required properties.

**Examples:**
- `Type '{}' is missing the following properties from type 'WixBlogPost': title, content`
- `Type '{ value: number; change: number; }' is missing the following properties from type 'PerformanceMetrics': metric, unit, status`

**Common Locations:**
- Type definitions in integrations (Wix, WordPress)
- Performance metrics objects

**Fix Strategy:**
- Add missing properties to type definitions
- Make properties optional if they're not always available
- Use type unions or partial types where appropriate

---

### 4. Type Incompatibility (7 errors - 5%)

**Description:** Type mismatches between interfaces or incompatible assignments.

**Examples:**
- `Interface 'AuthenticatedRequest' incorrectly extends interface 'Request'` (user property mismatch)
- `Type 'AIGenerationOutput' is not assignable to type 'string'`
- `Type '"request_changes"' is not assignable to type '"comment" | "approve" | "reject" | "reassign"'`

**Common Locations:**
- Route handler type definitions
- Express middleware types
- Status/enum value mismatches

**Fix Strategy:**
- Align interface definitions with Express types (from Pass 1)
- Update union types to include all valid values
- Fix return type mismatches

---

### 5. Other Issues

- **Missing module/imports:** `Cannot find module './error-taxonomy'`
- **Property doesn't exist:** `Property 'getJobCounts' does not exist on type 'Queue<any>'`
- **Number vs String:** `Argument of type 'number' is not assignable to parameter of type 'string'`
- **Comparison issues:** `This comparison appears to be unintentional because the types... have no overlap`

---

## Root Cause Analysis

### Pattern 1: Database Query Results (unknown type)

**Root Cause:** Supabase query results are typed as `unknown` because table schemas aren't strongly typed.

**Affected Files:**
- `server/routes/client-portal.ts`
- `server/lib/publishing-db-service.ts`
- `server/lib/preferences-db-service.ts`
- `server/lib/webhook-handler.ts`

**Fix Approach:**
- Define interfaces for database row types
- Use type assertions with runtime validation
- Create type guard functions

---

### Pattern 2: Logger Function Signature

**Root Cause:** Logger utility functions expect `string` messages, but code is passing structured objects.

**Affected Files:**
- All files with logging (28+ locations)

**Fix Approach:**
- Check logger utility signature in `server/lib/logger.ts` or `server/lib/observability.ts`
- Either update logger to accept objects OR fix all call sites
- Prefer updating logger to accept structured data (better for observability)

---

### Pattern 3: Express Request.user Type Mismatch

**Root Cause:** `AuthenticatedRequest` interface doesn't match the Express Request.user type defined in Pass 1.

**Affected Files:**
- `server/routes/creative-studio.ts`
- `server/routes/white-label.ts`

**Fix Approach:**
- Align `AuthenticatedRequest` with `server/types/express.d.ts` definition
- Ensure all required fields are present

---

## Recommended Fix Order

1. **Fix logger signature** (Pattern 2) - Will fix 28 errors at once
2. **Fix Express Request.user types** (Pattern 3) - Will fix interface mismatches
3. **Add type definitions for DB queries** (Pattern 1) - Will fix 60+ unknown property accesses
4. **Fix individual type incompatibilities** (Pattern 4) - Case by case
5. **Fix missing properties** (Pattern 3) - Add to type definitions

---

## Next Steps

1. ✅ Analysis complete
2. ⏳ Start fixing patterns at the root (logger, Express types)
3. ⏳ Fix shared types for DB queries
4. ⏳ Fix file-by-file issues
5. ⏳ Re-run typecheck until 0 errors

---

**Ready to begin fixing!**

