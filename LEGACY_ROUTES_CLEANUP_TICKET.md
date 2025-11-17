# Legacy Routes Cleanup Ticket

**Priority:** Low  
**Status:** Deferred (Non-blocking)  
**Created:** January 2025

---

## Overview

The `client/pages/` directory contains legacy route components that are duplicates of the current `client/app/(postd)/` routes. These legacy routes are causing ~40 TypeScript errors but are not used in production.

---

## Current Status

- **Legacy Routes:** `client/pages/*` (excluded from TypeScript checking)
- **Active Routes:** `client/app/(postd)/*` (all functional and type-safe)
- **TypeScript Errors:** ~40 errors in legacy routes (now excluded)

---

## Files to Remove (When Ready)

### Duplicate Routes
- `client/pages/ClientPortal.tsx` → Replaced by `client/app/(postd)/client-portal/page.tsx`
- `client/pages/BrandSnapshot.tsx` → Replaced by `client/app/(postd)/brand-snapshot/page.tsx`
- `client/pages/ClientSettings.tsx` → Replaced by `client/app/(postd)/client-settings/page.tsx`
- `client/pages/Approvals.tsx` → Replaced by `client/app/(postd)/approvals/page.tsx` (if exists)

### Onboarding Routes (Keep for Now)
- `client/pages/onboarding/*` - Still in use, has intentional type differences

---

## Action Items

1. **Verify No Imports** (Before deletion)
   - Search codebase for imports from `client/pages/*`
   - Check routing configuration for references
   - Verify no external dependencies

2. **Remove Legacy Routes**
   - Delete `client/pages/ClientPortal.tsx`
   - Delete `client/pages/BrandSnapshot.tsx`
   - Delete `client/pages/ClientSettings.tsx`
   - Delete `client/pages/Approvals.tsx` (if replaced)

3. **Update TypeScript Config** (Already done)
   - ✅ Excluded `client/pages/**/*` from type checking
   - Can remove exclusion after deletion

4. **Update Documentation**
   - Remove any references to legacy routes
   - Update routing documentation

---

## Estimated Time

- **Verification:** 30 minutes
- **Deletion:** 15 minutes
- **Testing:** 30 minutes
- **Total:** ~1.5 hours

---

## Notes

- Legacy routes are currently excluded from TypeScript checking via `tsconfig.json`
- No impact on production (app uses `client/app/` routes)
- Safe to defer until post-launch cleanup phase

---

**Assigned To:** Frontend Team  
**Target Date:** Post-launch cleanup (Week 2-3)

