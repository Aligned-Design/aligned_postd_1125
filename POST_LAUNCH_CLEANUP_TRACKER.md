# Post-Launch Cleanup Tracker

**Created:** January 2025  
**Status:** Post-Launch Hardening Pass  
**Priority:** Low (Non-Blocking)

This document tracks the remaining non-blocking TypeScript and type safety improvements to be addressed after initial launch.

---

## Overview

All critical paths are verified and functional. The items below are type safety improvements and minor refinements that don't affect runtime behavior.

---

## 1. Realtime Hooks Type Safety

**Files:**
- `client/hooks/useRealtimeNotifications.ts`
- `client/hooks/useRealtimeAnalytics.ts`
- `client/hooks/useRealtimeJob.ts`

**Issue:**
WebSocket message payloads are typed as `unknown`, causing TypeScript errors when accessing properties.

**Current Errors:**
- `Property 'syncId' does not exist on type 'unknown'`
- `Property 'eventType' does not exist on type 'unknown'`
- `Property 'message' does not exist on type 'unknown'`
- Similar errors for notification properties (id, type, title, message, severity, etc.)

**Fix Required:**
1. Define explicit interfaces for WebSocket message payloads:
   ```typescript
   interface SyncEventData {
     syncId: string;
     eventType: string;
     platform: string;
     progress: number;
     recordsProcessed: number;
     totalRecords: number;
     currentMetric: string;
     timestamp: string;
   }
   
   interface NotificationMessage {
     id: string;
     type: string;
     title: string;
     message: string;
     severity: string;
     brandId: string;
     actionUrl?: string;
     timestamp: string;
   }
   ```
2. Type WebSocket event handlers with these interfaces
3. Add runtime validation if needed

**Estimated Effort:** 1-2 hours

**Priority:** Low (runtime works correctly)

---

## 2. Approvals Page Type Mismatches

**File:**
- `client/app/(postd)/approvals/page.tsx`

**Issue:**
`ReviewItem` interface doesn't match the actual data structure from the API.

**Current Errors:**
- `Property 'log_id' does not exist on type 'ReviewItem'`
- `Property 'brand_id' does not exist on type 'ReviewItem'`
- `Property 'agent' does not exist on type 'ReviewItem'`
- `Property 'input' does not exist on type 'ReviewItem'`
- `Property 'output' does not exist on type 'ReviewItem'`
- `Property 'bfs' does not exist on type 'ReviewItem'`
- `Property 'linter_results' does not exist on type 'ReviewItem'`
- `Property 'timestamp' does not exist on type 'ReviewItem'`
- `Property 'created_at' does not exist on type 'ReviewItem'`
- `Property 'error' does not exist on type 'ReviewItem'`

**Fix Required:**
1. Check actual API response structure from `/api/approvals`
2. Update `ReviewItem` interface in shared types to match backend
3. Or create a separate type for the API response and map it to `ReviewItem`

**Estimated Effort:** 30 minutes - 1 hour

**Priority:** Low (page works, just type mismatches)

---

## 3. Component Prop Type Mismatches

**Files:**
- `client/components/dashboard/ReportSettingsModal.tsx`
- `client/components/retention/WinCelebration.tsx`

**Issues:**

### ReportSettingsModal.tsx
- Line 343: `AlignedAISummaryProps` doesn't accept `summary`, `onSummaryChange`, `readOnly` props
- Fix: Update `AlignedAISummaryProps` interface or adjust prop usage

### WinCelebration.tsx
- Line 257: Type mismatch - `Element` not assignable to `string & ReactNode`
- Fix: Adjust type definition or component usage

**Estimated Effort:** 30 minutes

**Priority:** Low (components render correctly)

---

## 4. Test File Type Errors

**File:**
- `client/lib/auth/__tests__/useCan.test.ts`

**Issue:**
- Missing module: `@/config/permissions.json`
- Various `unknown` type errors in test assertions

**Fix Required:**
1. Create missing `permissions.json` file or mock it in tests
2. Add proper type assertions in test cases

**Estimated Effort:** 30 minutes

**Priority:** Very Low (tests are excluded from production build)

---

## 5. Server-Side Type Errors (If Frontend Team Owns)

**Files:**
- `server/lib/client-portal-db-service.ts`

**Issues:**
- Lines 588-593: Properties on `unknown` type
- Lines 776-778: Properties on `unknown` type

**Note:** These are server-side files. Only fix if frontend team owns this code.

**Estimated Effort:** 30 minutes

**Priority:** Low (server code, separate from frontend)

---

## Summary

| Category | Files | Estimated Effort | Priority |
|----------|-------|------------------|----------|
| Realtime Hooks | 3 files | 1-2 hours | Low |
| Approvals Page | 1 file | 30 min - 1 hour | Low |
| Component Props | 2 files | 30 minutes | Low |
| Test Files | 1 file | 30 minutes | Very Low |
| Server Code | 1 file | 30 minutes | Low (if applicable) |

**Total Estimated Effort:** 3-5 hours

---

## Implementation Plan

### Phase 1: Quick Wins (1-2 hours)
1. Fix component prop type mismatches
2. Fix approvals page type mismatches

### Phase 2: Type Safety Improvements (1-2 hours)
1. Add explicit types to realtime hooks
2. Add runtime validation if needed

### Phase 3: Cleanup (30 minutes)
1. Fix test file imports
2. Document any remaining intentional `unknown` types

---

## Notes

- All items are **non-blocking** for production
- Runtime behavior is correct - these are type safety improvements only
- Can be addressed incrementally post-launch
- No user-facing impact

---

**Last Updated:** January 2025

