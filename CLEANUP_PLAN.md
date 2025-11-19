# Codebase Cleanup Plan

## Scope Analysis

- **Total TypeScript files**: ~799 files
- **Files with console statements**: ~60 files (client + server)
- **Files with TODO comments**: ~163 TODOs across 51 files
- **Comment lines**: ~1,580 comments across 247 files

## Proposed Cleanup Tasks (NON-DESTRUCTIVE)

### 1. ✅ Remove Console Statements (Priority: HIGH)
**Impact**: Cleaner production logs, better debugging infrastructure

**Files to clean** (~30 client files):
- `client/app/(postd)/client-portal/page.tsx`
- `client/app/(postd)/admin/page.tsx`
- `client/app/(postd)/campaigns/page.tsx`
- `client/app/(postd)/billing/page.tsx`
- `client/app/(postd)/approvals/page.tsx`
- `client/utils/monitoring.ts`
- `client/hooks/useRealtimeAnalytics.ts`
- `client/hooks/useRealtimeNotifications.ts`
- `client/hooks/useRealtimeJob.ts`
- `client/components/postd/studio/DocAiPanel.tsx`
- `client/components/postd/studio/DesignAiPanel.tsx`
- `client/lib/analytics.ts`
- `client/lib/stockImageApi.ts`
- `client/lib/onboarding-brand-sync.ts`
- And ~15 more files

**Server files** (~30 files):
- Keep strategic console statements in server for debugging
- Comment out or replace with logger where appropriate

**Strategy**:
- Replace `console.log` with existing `logInfo()` from `@/lib/logger`
- Replace `console.warn` with `logWarning()`
- Replace `console.error` with `logError()`
- Keep console statements in development-only blocks (`if (import.meta.env.DEV)`)

### 2. ✅ Remove Unused Imports (Priority: HIGH)
**Impact**: Faster builds, cleaner code

**Approach**:
- Use ESLint's `--fix` flag to auto-remove unused imports
- Manually review and remove obvious unused imports in critical files
- Focus on high-traffic files (pages, components, contexts)

**Target files** (~50 files with likely unused imports):
- All page files in `client/app/(postd)/`
- Component files in `client/components/`
- Hook files in `client/hooks/`
- Server route files in `server/routes/`

### 3. ✅ Clean Unnecessary Fragments & Wrappers (Priority: MEDIUM)
**Impact**: Cleaner JSX, better performance

**Patterns to fix**:
- Empty fragments: `<></>`  that wrap a single element
- Double wrappers: `<div><div>content</div></div>` where one div suffices
- Unnecessary fragments around single returns

**Files to review**:
- Focus on component files in `client/components/`
- Page files in `client/app/(postd)/`

### 4. ✅ Remove Dead Code & Commented Blocks (Priority: MEDIUM)
**Impact**: Reduced cognitive load

**Patterns to remove**:
- Large commented-out code blocks (>5 lines)
- Old implementation attempts left as comments
- Debug code that's commented out

**Exceptions** (KEEP):
- TODO comments that are actionable
- Comments explaining complex business logic
- Type definitions and interface comments
- JSDoc comments

### 5. ⚠️ Replace hasOwnProperty (Priority: LOW)
**Impact**: Better type safety

**Files already fixed**:
- ✅ `server/lib/preferences-db-service.ts`

**Additional files to check**:
- Search for `.hasOwnProperty(` in server/client code
- Replace with `Object.prototype.hasOwnProperty.call(obj, key)`

### 6. ⚠️ Trivial `any` Replacements (Priority: LOW)
**Impact**: Better type safety

**Strategy**: VERY CONSERVATIVE
- Only replace `any` where type is OBVIOUS and TRIVIAL
- Examples: `event: any` → `event: React.ChangeEvent<HTMLInputElement>`
- **DO NOT** replace `any` in:
  - API response types (may change)
  - Complex object shapes
  - Third-party library types
  - Type assertions that might break

**Estimated impact**: 5-10 trivial replacements max

### 7. ❌ NO Design Token Replacements (Deferred)
**Reason**: Too risky for cleanup pass
- Hardcoded colors often have specific UX reasons
- Design tokens might not cover all use cases
- Risk of breaking visual consistency
- **Decision**: Defer to dedicated design system audit

## Exclusions (DO NOT TOUCH)

### ❌ Files to SKIP:
1. **Test files** (`*.test.ts`, `*.test.tsx`, `*.spec.ts`)
   - May use mocks, console, and patterns that are acceptable in tests
2. **Documentation files** (`*.md`)
3. **Config files** (`*.config.ts`, `*.config.js`)
4. **Generated files** (`dist/`, `node_modules/`)
5. **Third-party integrations** that might have specific patterns
6. **Migration scripts** and one-off utilities

### ❌ Code patterns to PRESERVE:
1. Any code in onboarding flow (critical user path)
2. API client wrappers and authentication logic
3. Brand sync and content generation logic
4. Studio/canvas/creative components (complex state)
5. Analytics and reporting logic
6. Database queries and RLS policies

## Execution Plan

### Phase 1: Safe Automated Cleanup (15 minutes)
1. Run `pnpm lint --fix` to auto-remove unused imports
2. Run prettier/format on all files
3. Verify no new errors introduced

### Phase 2: Manual Console Statement Cleanup (30 minutes)
1. Start with client files (high priority for production)
2. Replace console.log/warn/error with logger
3. Keep dev-only console statements

### Phase 3: Manual Code Review (20 minutes)
1. Remove obvious dead code and large commented blocks
2. Clean unnecessary JSX fragments
3. Fix any remaining hasOwnProperty calls

### Phase 4: Verification (10 minutes)
1. Run `pnpm lint` - ensure no new errors
2. Run `pnpm typecheck` - ensure types still valid
3. Run `pnpm build` - ensure clean build
4. Spot-check a few pages in dev mode

## Success Criteria

✅ **No behavior changes**
✅ **No new lint/type errors**
✅ **Clean build**
✅ **Reduced console noise in production**
✅ **Cleaner codebase for next dev**

## Risk Assessment

**Low Risk**:
- Removing unused imports (auto-detected by tooling)
- Removing console statements (non-functional)
- Cleaning JSX fragments (visual no-op)

**Medium Risk**:
- Removing commented code (might be needed for reference)
- Replacing `any` types (might break inference)

**High Risk** (AVOID):
- Refactoring components
- Changing business logic
- Moving files
- Renaming exports

## Estimated Time
**Total**: ~75 minutes of focused work
**Impact**: Cleaner, more maintainable codebase with ZERO behavior changes

