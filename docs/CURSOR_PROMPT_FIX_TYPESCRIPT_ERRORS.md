# Cursor Prompt: Fix Pre-Existing TypeScript Errors

You are working on a follow-up PR whose only purpose is to fix pre-existing TypeScript errors so CI passes again.

## Context from Previous CI Audit

The migration PR only touched SQL migrations + docs and did not modify any `.ts`/`.tsx`/`.js`/`.jsx` files.

CI failures are all TypeScript typecheck errors in tests and some page components.

**Example first error:**
- `TS2739` in `client/__tests__/studio/template-content-package.test.ts`
- Mock object for `Design` is missing required properties: `brandId`, `savedToLibrary`, etc.

**Similar issues likely exist in:**
- `client/__tests__/studio/upload-content-package.test.ts`
- Studio / content generator pages
- Possibly some server tests (`server/__tests__/oauth-csrf.test.ts`, etc.)

## Goal for This PR

Fix **ONLY** the type errors so `pnpm typecheck` and `pnpm build` pass.

**Do not change runtime behavior** beyond what is strictly necessary.

Keep changes small, obvious, and localized.

## Tasks

### 1. Run TypeScript Check and Capture Errors

Run `pnpm typecheck` and capture the full list of current TypeScript errors.

### 2. Group Errors by Theme

Group the errors into categories:

**a) Test mocks missing required fields**
- Example: `Design` needing `brandId`, `savedToLibrary`, etc.
- Files: `client/__tests__/studio/template-content-package.test.ts`, `client/__tests__/studio/upload-content-package.test.ts`

**b) Component props not matching defined types/interfaces**
- Example: Component prop types don't match interfaces
- Files: `client/app/(postd)/brand-intelligence/page.tsx`, `client/app/(postd)/content-generator/page.tsx`, etc.

**c) Server tests or helpers with incorrect typings**
- Example: Missing type annotations, unknown types
- Files: `server/__tests__/oauth-csrf.test.ts`, `server/__tests__/rbac-enforcement.test.ts`, etc.

### 3. Fix Test Mocks

**For test mocks missing required fields:**

- Update mock objects to fully satisfy the current type definitions
- Example: Add `brandId`, `savedToLibrary`, and any other required fields with reasonable dummy values
- Keep the mock values simple and realistic

**Example fix:**
```typescript
const mockTemplateDesign: Design = {
  id: "template-123",
  name: "Test Template",
  format: "social_square",
  width: 1080,
  height: 1080,
  backgroundColor: "#ffffff",
  brandId: mockBrandId,        // ← ADD required field
  savedToLibrary: false,      // ← ADD required field
  items: [...],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
```

### 4. Fix Component Prop Type Mismatches

**For page/component prop type mismatches:**

- **Prefer fixing the prop types and usage** so they match the shared interfaces (e.g. `Design`, `ContentPackage`, etc.) instead of loosening types
- If you must adjust an interface, do it in a backwards-compatible way and explain why in a comment
- Check that component props match the expected interface definitions

### 5. Fix Server Test Type Errors

**For server test type errors:**

- Add explicit types, helper types, or narrowings, rather than falling back to `any`
- Only use `as any` where absolutely necessary, and add a short comment explaining the edge case
- Ensure test fixtures and mocks have proper type annotations

### 6. Verify Fixes

Re-run `pnpm typecheck` and `pnpm build` until both pass with **0 new errors**.

## Constraints

- ❌ **Do not modify SQL migrations or docs in this PR**
- ❌ **Avoid large refactors**; make the smallest possible changes to satisfy the types while keeping behavior intact
- ✅ **Follow existing code style and patterns**
- ✅ **Keep changes localized** to the files with errors

## Deliverables

Provide a summary of:

1. **Files changed** - List all files modified
2. **Main categories of fixes** - Mocks, props, tests, etc.
3. **Any interfaces adjusted** - If any shared interfaces were modified, explain why
4. **Clean typecheck/build output** - Show that both commands pass with 0 errors

## Starting Point

Start by:
1. Locating the current `Design` type definition (likely in `shared/creative-studio.ts` or `client/types/creativeStudio.ts`)
2. Fixing the mocks in `client/__tests__/studio/template-content-package.test.ts`
3. Fixing similar issues in `client/__tests__/studio/upload-content-package.test.ts`
4. Proceeding through the remaining errors systematically

## Expected Error Categories (from CI audit)

1. **Design Type Mismatches** (12 errors)
   - Files: `client/__tests__/studio/template-content-package.test.ts`, `client/__tests__/studio/upload-content-package.test.ts`
   - Issue: Missing `brandId` and `savedToLibrary` properties

2. **Component Prop Type Errors** (5+ errors)
   - Files: `client/app/(postd)/brand-intelligence/page.tsx`, `client/app/(postd)/brand-snapshot/page.tsx`, `client/app/(postd)/content-generator/page.tsx`, etc.
   - Issue: Component prop types don't match expected interfaces

3. **Server Test Type Errors** (300+ errors)
   - Files: `server/__tests__/*.test.ts`
   - Issue: Various type mismatches in test files

**Total estimated fix time:** 4-7 hours

---

**Status:** Ready to start fixing TypeScript errors

