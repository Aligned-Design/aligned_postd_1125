# Codebase Cleanup Plan

## Overview
Safe, non-destructive cleanup pass focused on:
- Removing unused imports
- Replacing console statements with logger utilities
- Removing dead code and commented blocks
- Fixing simple lint issues
- Cleaning JSX structure

## Scope: CLIENT/ Directory

### 1. Console Statement Replacements
**Files to update (replace console.log/warn/error with logger):**

- `client/lib/fileUpload.ts` - Replace console.error with logError
- `client/lib/safeLocalStorage.ts` - Replace console.warn with logWarning
- `client/lib/seedUserBrands.ts` - Replace console.error with logError
- `client/lib/featureFlags.ts` - Replace console.error with logError
- `client/lib/stockImageApi.ts` - Replace console.error with logError
- `client/lib/analytics.ts` - Replace console.log with logTelemetry
- `client/components/ui/error-boundary.tsx` - Replace console.error with logError
- `client/pages/Campaigns.tsx` - Replace console.log with logTelemetry
- `client/app/(postd)/campaigns/page.tsx` - Replace console.log with logTelemetry
- `client/app/(postd)/client-portal/page.tsx` - Replace console.error with logError (multiple)
- `client/app/(postd)/admin/page.tsx` - Replace console.error with logError (multiple)
- `client/utils/monitoring.ts` - Replace console.log/warn with logTelemetry/logWarning
- `client/app/(postd)/billing/page.tsx` - Replace console.error with logError
- `client/app/(postd)/approvals/page.tsx` - Replace console.warn/error with logWarning/logError
- `client/hooks/useRealtimeAnalytics.ts` - Replace console.log/error with logTelemetry/logError
- `client/hooks/useRealtimeNotifications.ts` - Replace console.log/error with logTelemetry/logError
- `client/hooks/useRealtimeJob.ts` - Replace console.log/error with logTelemetry/logError
- `client/components/postd/studio/DocAiPanel.tsx` - Replace console.error with logError
- `client/components/postd/studio/DesignAiPanel.tsx` - Replace console.error with logError
- `client/app/(postd)/brands/page.tsx` - Replace console.error with logError
- `client/pages/Brands.tsx` - Replace console.error with logError
- `client/contexts/BrandContext.tsx` - Replace console.warn/log/error with logWarning/logTelemetry/logError
- `client/app/(postd)/queue/page.tsx` - Replace console.error with logError
- `client/app/(postd)/studio/page.tsx` - Replace console.error/log/warn with logError/logTelemetry/logWarning
- `client/components/settings/SchedulingPreferences.tsx` - Replace console.warn/error with logWarning/logError
- `client/hooks/useRescheduleContent.ts` - Replace console.warn/error with logWarning/logError
- `client/app/(postd)/reviews/page.tsx` - Replace console.warn/log/error with logWarning/logTelemetry/logError
- `client/components/dashboard/CreativeStudioCanvas.tsx` - Replace console.error with logError
- `client/components/dashboard/StockImageModal.tsx` - Replace console.error with logError
- `client/contexts/WorkspaceContext.tsx` - Replace console.error/log with logError/logTelemetry
- `client/pages/ClientPortal.tsx` - Replace console.error with logError (multiple)
- `client/pages/ClientSettings.tsx` - Replace console.error with logError (multiple)
- `client/hooks/use-paid-ads.ts` - Replace console.warn with logWarning
- `client/utils/performance.ts` - Replace console.warn/debug with logWarning/logTelemetry
- `client/components/dashboard/AnalyticsAdvisor.tsx` - Replace console.error with logError
- `client/components/dashboard/ActionableAdvisor.tsx` - Replace console.error with logError
- `client/app/(public)/blog/[slug]/page.tsx` - Replace console.error with logError
- `client/pages/Approvals.tsx` - Replace console.warn/error with logWarning/logError
- `client/hooks/useBrandIntelligence.ts` - Replace console.debug/error with logTelemetry/logError
- `client/components/media/MediaBrowser.tsx` - Replace console.error with logError
- `client/app/(postd)/content-generator/page.tsx` - Replace console.log with logTelemetry

### 2. Unused Imports
- Scan each file for unused imports and remove them
- Focus on: React imports, unused hooks, unused components, unused types

### 3. Dead Code Removal
- Remove commented-out code blocks that are no longer needed
- Remove unreachable code branches
- Remove unused variables

### 4. Simple Lint Fixes
- Add missing dependencies to useEffect hooks (only when safe)
- Replace hasOwnProperty checks with Object.prototype.hasOwnProperty.call when necessary
- Replace trivial `any` types only when trivially inferrable

### 5. JSX Cleanup
- Remove unnecessary fragments where single child exists
- Collapse unnecessary wrapper divs

## Scope: SERVER/ Directory

### Console Statement Replacements
**Files to update (replace with pino logger from observability.ts):**

**Production code only (NOT scripts):**
- `server/lib/media-db-service.ts` - Replace console.error/warn with logger
- `server/routes/media.ts` - Replace console.warn with logger
- `server/routes/brands.ts` - Replace console.log/warn/error with logger

**Note:** Scripts in `server/scripts/` are allowed to keep console statements as they are CLI tools.

### Unused Imports
- Scan production server files for unused imports

## Scope: SHARED/ Directory

### Unused Imports
- Scan shared files for unused imports

## Execution Order

1. ✅ Document plan (this file)
2. ⏳ Replace console statements in client/
3. ⏳ Replace console statements in server/ (production code only)
4. ⏳ Remove unused imports in client/
5. ⏳ Remove unused imports in server/
6. ⏳ Remove unused imports in shared/
7. ⏳ Remove dead code and commented blocks
8. ⏳ Fix simple lint issues
9. ⏳ Clean JSX structure
10. ⏳ Run lint fix and verify no errors

## Notes

- **NEVER** change business logic
- **NEVER** refactor components
- **NEVER** alter architecture
- **NEVER** remove code that might be used by onboarding, approvals, studio, API calls, or brand sync
- Only replace console statements in production code, not in scripts or test files
- Keep test files unchanged (they may intentionally use console for test output)
