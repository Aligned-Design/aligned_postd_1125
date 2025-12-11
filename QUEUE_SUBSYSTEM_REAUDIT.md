# Queue Subsystem & Schedule Endpoint Re-Audit

**Date**: December 11, 2025  
**Scope**: Focused re-audit after implementing patches for queue bypass and error code semantics  
**Previous Status**: ⚠️ PARTIAL

---

## Summary of Changes Implemented

### 1. Error Code Semantics Fix

**Issue**: Schedule endpoint used `ErrorCode.VALIDATION_ERROR` for no-connected-accounts error.

**Fix Applied**: Added proper `ErrorCode.NO_ACCOUNTS_CONNECTED` error code.

```60:60:server/lib/error-responses.ts
  NO_ACCOUNTS_CONNECTED = "NO_ACCOUNTS_CONNECTED", // No social accounts connected for publishing
```

**Also Added**: Error scenario helper for consistent error responses:

```typescript
noAccountsConnected: (platforms?: string[]) => ({
  statusCode: HTTP_STATUS.BAD_REQUEST,
  code: ErrorCode.NO_ACCOUNTS_CONNECTED,
  message: "No connected social accounts found",
  severity: "warning" as ErrorSeverity,
  details: platforms ? { requestedPlatforms: platforms } : undefined,
  suggestion: "Connect Facebook or Instagram in Settings → Linked Accounts before scheduling for auto-publish.",
}),
```

**Schedule endpoint now uses correct error code**:

```504:511:server/routes/creative-studio.ts
            throw new AppError(
              ErrorCode.NO_ACCOUNTS_CONNECTED,
              "No connected social accounts found",
              HTTP_STATUS.BAD_REQUEST,
              "warning",
              { missingPlatforms, requestedPlatforms },
              "You don't have any connected social accounts. Connect Facebook or Instagram in Settings → Linked Accounts before scheduling this design for auto-publish."
            );
```

✅ **PASS**: Error code semantics now correct.

---

### 2. Queue Bypass Fix — Single Source of Truth

**Issue**: Creative Studio's schedule endpoint directly inserted into `publishing_jobs` table, bypassing `publishingQueue.addJob()`. Jobs created this way never entered the in-memory queue.

**Fix Applied**: Created `publishingQueue.createJobFromStudio()` method as the **single source of truth**:

```903:978:server/lib/publishing-queue.ts
  /**
   * Create a publishing job from Creative Studio context.
   * This is the SINGLE SOURCE OF TRUTH for job creation.
   * 
   * - Inserts into publishing_jobs table
   * - For scheduled/autoPublish jobs, adds to in-memory queue
   * - For draft jobs (autoPublish=false), only persists to DB
   * 
   * @returns The created job record from the database
   */
  async createJobFromStudio(params: {
    brandId: string;
    designId: string;
    platforms: string[];
    scheduledAt: string;
    autoPublish: boolean;
    userId: string;
    designContent?: Record<string, unknown>;
  }): Promise<...> {
    // ... implementation
  }
```

**Schedule endpoint now routes through this helper**:

```544:558:server/routes/creative-studio.ts
      // ✅ SINGLE SOURCE OF TRUTH: Create job through publishingQueue
      // This ensures:
      // - Job is inserted into publishing_jobs table
      // - For autoPublish=true, job is also added to in-memory queue
      // - For autoPublish=false (draft), job stays only in DB
      try {
        const job = await publishingQueue.createJobFromStudio({
          brandId,
          designId,
          platforms: scheduleData.scheduledPlatforms,
          scheduledAt,
          autoPublish: scheduleData.autoPublish || false,
          userId,
          designContent,
        });
```

✅ **PASS**: Queue bypass eliminated. Single source of truth established.

---

### 3. Draft vs Scheduled Logic

**Verification**: The new `createJobFromStudio()` method correctly handles both modes:

```931:958:server/lib/publishing-queue.ts
    // Determine job status based on autoPublish flag
    const jobStatus = autoPublish ? "scheduled" : "draft";
    
    // Insert into database
    const { data: job, error: jobError } = await supabase
      .from("publishing_jobs")
      .insert({
        brand_id: brandId,
        content: { ... },
        platforms,
        scheduled_at: scheduledAt,
        status: jobStatus,  // ← "scheduled" or "draft"
      })
      ...

    // For scheduled jobs (autoPublish=true), add to in-memory queue
    // Draft jobs stay only in DB until user explicitly publishes
    if (autoPublish && job) {
      // Create PublishingJob and call this.addJob()
    }
```

- **autoPublish=true**: Creates job with `status="scheduled"` and adds to in-memory queue
- **autoPublish=false**: Creates job with `status="draft"` and does NOT enqueue

✅ **PASS**: Draft vs scheduled logic correctly implemented.

---

### 4. No Double-Processing

**Verification**: The implementation avoids double-processing:

1. **DB insert happens once** in `createJobFromStudio()` (lines 935-950)
2. **Queue addition happens conditionally** only for `autoPublish=true` (lines 958-998)
3. **The queue's `addJob()` method** handles job status and prevents re-processing of already-processing jobs (existing logic in lines 157-158)

✅ **PASS**: No double-processing risk introduced.

---

## Test Results

All 8 tests in `creative-studio-schedule.test.ts` passed:

| Test | Status |
|------|--------|
| autoPublish=true with NO connected accounts → NO_ACCOUNTS_CONNECTED | ✅ PASS |
| autoPublish=true with connected accounts → job created via publishingQueue | ✅ PASS |
| autoPublish=false → job created as draft, NOT enqueued | ✅ PASS |
| processJob respects scheduled_at and defers processing | ✅ PASS |
| createJobFromStudio does not call addJob for draft jobs | ✅ PASS |
| createJobFromStudio calls addJob for scheduled jobs | ✅ PASS |
| NO_ACCOUNTS_CONNECTED exists in ErrorCode enum | ✅ PASS |
| noAccountsConnected error scenario exists | ✅ PASS |

```
✓ server/__tests__/creative-studio-schedule.test.ts (8 tests) 3759ms
```

---

## Re-Audit Verdicts

### Queue Subsystem

| Requirement | Previous | Current | Evidence |
|-------------|----------|---------|----------|
| Jobs from Creative Studio reach publishing_jobs table | ✅ PASS | ✅ PASS | Lines 935-950 in `publishing-queue.ts` |
| Jobs are added to in-memory queue | ⚠️ PARTIAL (bypassed) | ✅ PASS | Lines 958-998 in `publishing-queue.ts` |
| Drafts do NOT enter queue | ⚠️ UNKNOWN | ✅ PASS | Line 958: `if (autoPublish && job)` |
| Queue processor checks scheduled_at | ✅ PASS | ✅ PASS | Existing logic in `processJob()` |
| Single source of truth for job creation | ❌ FAIL | ✅ PASS | `createJobFromStudio()` method |

**Queue Subsystem Status: ✅ PASS** (upgraded from ⚠️ PARTIAL)

### Schedule Endpoint

| Requirement | Previous | Current | Evidence |
|-------------|----------|---------|----------|
| Validates platform connections for autoPublish=true | ✅ PASS | ✅ PASS | Lines 479-523 in `creative-studio.ts` |
| Uses correct error code NO_ACCOUNTS_CONNECTED | ⚠️ PARTIAL (used VALIDATION_ERROR) | ✅ PASS | Line 505: `ErrorCode.NO_ACCOUNTS_CONNECTED` |
| Draft mode bypasses connection check | ✅ PASS | ✅ PASS | Line 479: `if (scheduleData.autoPublish)` |
| Routes through publishingQueue | ❌ FAIL (direct insert) | ✅ PASS | Lines 550-558: `publishingQueue.createJobFromStudio()` |
| Includes all required job fields | ✅ PASS | ✅ PASS | Lines 551-557 |

**Schedule Endpoint Status: ✅ PASS** (upgraded from ⚠️ PARTIAL)

---

## Final Answers

### "Is the queue subsystem still ⚠️ PARTIAL, or now ✅ PASS?"

**✅ PASS**

The queue subsystem is now fully wired:
1. Creative Studio schedule endpoint routes all job creation through `publishingQueue.createJobFromStudio()`
2. This method serves as the single source of truth for job creation
3. It correctly handles both autoPublish and draft modes
4. Jobs are properly persisted to DB and conditionally added to the in-memory queue
5. Error codes are semantically correct

### "Did we introduce any new drift or inconsistencies?"

**No drift or inconsistencies introduced.**

Verification:
- The `createJobFromStudio()` method is additive; it doesn't modify existing queue logic
- Existing `addJob()`, `processJob()`, and `checkContentApprovalStatus()` remain unchanged
- The schedule endpoint's connection validation logic is preserved
- Error handling flows remain consistent
- The DB schema and job payload structure are unchanged

---

## Files Modified

| File | Changes |
|------|---------|
| `server/lib/error-responses.ts` | Added `NO_ACCOUNTS_CONNECTED` error code and `noAccountsConnected` scenario helper |
| `server/lib/publishing-queue.ts` | Added `createJobFromStudio()` method (lines 903-1015) |
| `server/routes/creative-studio.ts` | Updated schedule endpoint to use `publishingQueue.createJobFromStudio()` and correct error code |
| `server/__tests__/creative-studio-schedule.test.ts` | New test file covering all schedule endpoint scenarios |

---

## Conclusion

Both the **Queue Subsystem** and **Schedule Endpoint** have been upgraded from ⚠️ PARTIAL to **✅ PASS**.

The implementation now follows best practices:
- Single source of truth for job creation
- Correct error code semantics
- Proper separation of draft vs scheduled jobs
- No double-processing risks
- Comprehensive test coverage

**Is POSTD Social Posting Fully Wired? YES** (for the queue/schedule subsystems)

