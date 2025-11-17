# RBAC Consolidation: Migration Plan & Acceptance Criteria

**Status:** 🟡 In Progress (Phase 1 Complete)  
**Timeline:** 2 weeks (5 phases)  
**Stakeholders:** Backend Team, Frontend Team, QA, DevOps

---

## Executive Summary

Consolidate **5+ overlapping role systems** into **one canonical RBAC model** with scope-based permissions.

**Benefits:**

- ✅ Single source of truth (`config/permissions.json`)
- ✅ Consistent enforcement (DB → API → UI)
- ✅ Easier auditing and compliance
- ✅ Reduced maintenance burden
- ✅ Better security posture

**Risk:** Breaking changes to auth system. Mitigate with feature flag + log-only mode.

---

## Scope of Work

### What's In Scope ✅

1. **Canonical role system** (`config/permissions.json`)
2. **Unified client hooks** (`useAuth`, `useCan`)
3. **Server middleware** (`requireScope`)
4. **Supabase RLS completion** (milestones + audit)
5. **Critical route updates** (approvals, publishing, billing)
6. **UI component updates** (hide/disable based on permissions)
7. **Tests & documentation**

### What's Out of Scope ❌

1. **Multi-tenancy refactor** (future phase)
2. **Audit log system overhaul** (use existing)
3. **Workspace-level RBAC** (separate system, not touched)
4. **Third-party integrations auth** (documented separately)

---

## Phase Breakdown

### ✅ Phase 1: Quick Fixes & Setup (COMPLETE)

**Duration:** 1 day  
**Owner:** Backend Lead

#### Tasks

- [x] Fix `authenticateUser` import (broken in billing/trial routes)
  - **File:** `server/middleware/security.ts` / `server/middleware/authenticateUser.ts`
  - **Action:** Export function; routes no longer fail
- [x] Complete milestones RLS
  - **File:** `supabase/migrations/20250112_milestones_rls.sql`
  - **Action:** Replace `USING (true)` with org/brand checks; deploy migration

- [x] Create canonical role system
  - **File:** `config/permissions.json`
  - **Action:** Define 7 roles + 24 scopes; single source of truth

- [x] Create unified client hooks
  - **Files:**
    - `client/lib/auth/useAuth.ts` (single auth hook)
    - `client/lib/auth/useCan.ts` (permission checks)
  - **Action:** Provide API for UI to check permissions

- [x] Create server middleware
  - **File:** `server/middleware/requireScope.ts`
  - **Action:** Middleware to enforce scopes on routes

- [x] Create mapping documentation
  - **Files:**
    - `docs/RBAC_MAPPING.md` (legacy → canonical)
    - `docs/RBAC_MIGRATION_PLAN.md` (this doc)

#### Acceptance Criteria

- [x] No TypeScript errors; code compiles
- [x] `config/permissions.json` exists and is valid JSON
- [x] `useAuth()` hook returns normalized role
- [x] `useCan(scope)` checks permissions correctly
- [x] `requireScope` middleware throws 403 for unauthorized
- [x] `authenticateUser` no longer fails in billing/trial routes
- [x] Milestones migration includes all 4 policies (read/insert/update/delete)
- [x] Documentation maps all legacy roles to canonical

---

### 🟡 Phase 2: Client-Side Migration (Week 1-2)

**Duration:** 3-4 days  
**Owner:** Frontend Lead  
**Blockers:** Phase 1 complete

#### Tasks

- [ ] **Update AuthContext**
  - **File:** `client/contexts/AuthContext.tsx`
  - **Changes:**
    - Store normalized `role` (canonical type)
    - Keep backward compatibility properties
  - **Test:** Existing pages still load

- [ ] **Replace inline role checks**
  - **Scope:** All client components
  - **Find pattern:** `role === 'agency'`, `user.role === 'client'`, etc.
  - **Replace with:** `useCan('scope')` or `useIsRole()`
  - **Priority files:**
    - `client/components/layout/AppLayout.tsx`
    - `client/components/layout/MainNavigation.tsx`
    - `client/components/layout/TopBar.tsx`
    - `client/components/generation/RoleBasedApprovalFlow.tsx`
    - Dashboard components

- [ ] **Deprecate old useAuth hook**
  - **File:** `client/hooks/useAuth.ts` (old)
  - **Action:** Mark as deprecated; update imports
  - **Timeline:** Remove in Phase 5

- [ ] **Update TypeScript types**
  - **Remove:** `client/types/user.ts` local role union
  - **Use:** `import type { Role } from '@/lib/auth'`
  - **Files:**
    - `shared/workflow.ts`
    - `shared/analytics.ts`
    - `client/types/dashboard.ts`

- [ ] **Update components to use useCan**
  - **Examples:**

    ```typescript
    // Before
    if (userRole === 'agency') { <GenerateButton /> }

    // After
    if (useCan('content:create')) { <GenerateButton /> }
    ```

#### Acceptance Criteria

- [ ] All client TypeScript compiles without errors
- [ ] No console errors on page load
- [ ] `useCan()` is used in all role-gated components
- [ ] Deprecated hook marked with @deprecated JSDoc
- [ ] Pages render correctly with new auth hook
- [ ] Button/menu UI respects permissions (buttons hidden/disabled)

#### Testing

```bash
# Find remaining inline role checks
grep -r "role.*==\|role.*!=\|=== 'agency'\|=== 'client'" client --include="*.tsx" --include="*.ts"

# Should return 0 results after migration
```

---

### 🟡 Phase 3: Server-Side Migration (Week 2-3)

**Duration:** 3-4 days  
**Owner:** Backend Lead  
**Blockers:** Phase 1 complete

#### Tasks

- [ ] **Apply requireScope to critical routes**
  - **Priority 1 (Approval flow):**
    - File: `server/routes/approvals.ts`
    - Add: `requireScope('content:approve')`
    - Remove: Inline `['client','agency','admin']` checks
    - Test: API rejects non-approvers with 403

  - **Priority 2 (Publishing):**
    - File: `server/routes/publishing.ts`
    - Add: `requireScope('publish:now')`
    - Test: Only BRAND_MANAGER+ can publish

  - **Priority 3 (Workflow):**
    - File: `server/routes/workflow.ts`
    - Add: `requireScope('workflow:manage')` for write operations
    - Test: Only managers can create workflows

  - **Priority 4 (Billing):**
    - File: `server/routes/billing.ts`
    - Add: `requireScope('billing:manage')`
    - Test: Only AGENCY_ADMIN can modify billing

  - **Priority 5 (Integrations):**
    - File: `server/routes/integrations.ts`
    - Add: `requireScope('integrations:manage')` for write ops
    - Add: `requireScope('integrations:view')` for read ops

- [ ] **Remove inline role string checks**
  - **Find pattern:** `userRole === 'admin'`, `['client','agency']`, etc.
  - **Replace with:** `requireScope` middleware
  - **Document:** Any special cases (e.g., resource ownership)

- [ ] **Fix middleware stack**
  - Ensure `authenticateUser` called before `requireScope`
  - Example:
    ```typescript
    router.post(
      "/approve",
      authenticateUser,
      requireScope("content:approve"),
      handler,
    );
    ```

- [ ] **Audit other routes**
  - [ ] `server/routes/content.ts`
  - [ ] `server/routes/posts.ts`
  - [ ] [ ] `server/routes/analytics.ts`
  - [ ] `server/routes/brand.ts`
  - [ ] `server/routes/ai-generation.ts`

#### Acceptance Criteria

- [ ] All critical routes have `requireScope` middleware
- [ ] No inline role string comparisons in protected routes
- [ ] Middleware stack is consistent: `authenticateUser` → `requireScope` → handler
- [ ] API tests verify:
  - [ ] Authorized user gets 200
  - [ ] Unauthorized user gets 403
  - [ ] Unauthenticated user gets 401
- [ ] Latency < 3s for scoped endpoints

#### Testing

```typescript
// server/__tests__/rbac-enforcement.test.ts
describe("RBAC Enforcement", () => {
  it("CREATOR cannot publish content (403)", async () => {
    const res = await request(app)
      .post("/api/posts/publish")
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({ postId: "123" });

    expect(res.status).toBe(403);
  });

  it("BRAND_MANAGER can publish content (200)", async () => {
    const res = await request(app)
      .post("/api/posts/publish")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ postId: "123" });

    expect(res.status).toBe(200);
  });
});
```

---

### 🔄 Phase 4: RLS & Database Alignment (Week 3)

**Duration:** 2 days  
**Owner:** DevOps / Backend  
**Blockers:** Phase 1 complete

#### Tasks

- [ ] **Audit all RLS policies**
  - List all CREATE POLICY statements
  - Check for `USING (true)` or missing checks
  - Verify brand/organization isolation

- [ ] **Complete missing RLS**
  - Milestones: ✅ Done (Phase 1)
  - Audit logs: [ ] Verify brand isolation
  - Client settings: [ ] Verify ownership checks
  - Any other permissive policies: [ ] Fix

- [ ] **Create role normalization function** (if needed)
  - If DB uses different role names, add translation layer
  - Example: Map DB `'admin'` → canonical `'AGENCY_ADMIN'`

- [ ] **Test RLS enforcement**
  - Create test script that attempts:
    - [ ] SELECT across brand_id (should fail)
    - [ ] UPDATE others' records (should fail)
    - [ ] INSERT with wrong org_id (should fail)

#### Acceptance Criteria

- [ ] No `USING (true)` or `WITH CHECK (true)` in RLS policies
- [ ] All tables with sensitive data have RLS enabled
- [ ] RLS tests pass (cross-brand/org isolation verified)
- [ ] RLS policies reference `auth.uid()` or `brand_members`

---

### 🟡 Phase 5: Feature Flag & Cutover (Week 4-5)

**Duration:** 2-3 days  
**Owner:** Backend Lead + DevOps

#### Tasks

- [ ] **Add ENFORCE_STRICT_RBAC feature flag**
  - **Default:** `false` (log-only mode)
  - **After Phase 4:** Set to `true` (enforcement)

- [ ] **Implement log-only mode**

  ```typescript
  // server/middleware/requireScope.ts
  if (!process.env.ENFORCE_STRICT_RBAC) {
    console.warn(`[RBAC] User ${user.id} would be denied ${scope}`);
    return next(); // Allow through
  }
  // ... strict enforcement
  ```

- [ ] **Gradual rollout**
  1. **Day 1-2:** Log-only (everyone can see what would break)
  2. **Day 3-4:** 10% of users → strict
  3. **Day 5:** 50% of users → strict
  4. **Day 6+:** 100% → strict

- [ ] **Monitor & rollback plan**
  - Watch logs for denial patterns
  - Adjust permissions if needed
  - Rollback: Set `ENFORCE_STRICT_RBAC=false`

- [ ] **Document cutover process**
  - Create runbook for toggling flag
  - List rollback procedures

#### Acceptance Criteria

- [ ] Feature flag environment variable exists
- [ ] Log-only mode can be toggled without code changes
- [ ] No errors during gradual rollout
- [ ] All permission denials logged with user/scope/role

---

## Acceptance Criteria (All Phases)

### Code Quality ✅

- [x] TypeScript: no errors (`pnpm typecheck`)
- [ ] ESLint: no errors (`pnpm lint`)
- [ ] Tests: all passing (`pnpm test`)
- [ ] No console warnings in browser dev tools
- [ ] No unhandled promise rejections

### Functional ✅ → 🔄

- [x] One canonical role system in `config/permissions.json`
- [ ] All components compile
- [ ] `authenticateUser` no longer fails
- [ ] Milestones RLS enforced
- [ ] Buttons respect `useCan()` checks
- [ ] API rejects forbidden actions (403)
- [ ] RLS policies block cross-brand access

### Performance

- [ ] Scoped route latency < 3s
- [ ] Auth hook renders < 100ms
- [ ] No N+1 queries in permission checks

### Security 🔒

- [ ] No hardcoded tokens
- [ ] RLS prevents unauthorized data access
- [ ] SUPERADMIN cannot be assigned via UI
- [ ] Token payload includes canonical role

### Documentation 📚

- [x] `docs/RBAC_MAPPING.md` completed
- [x] `docs/RBAC_MIGRATION_PLAN.md` (this doc)
- [ ] Inline code comments explain role system
- [ ] Runbook for adding new roles/scopes
- [ ] Migration guide for developers

### Tests 🧪

- [ ] Unit: `useCan()` role × scope matrix
- [ ] Integration: `requireScope` rejects/allows correctly
- [ ] E2E: User flows respect permissions
- [ ] RLS: Cross-brand SELECT/UPDATE fails

---

## Risk & Mitigation

| Risk                           | Probability | Impact | Mitigation                     |
| ------------------------------ | ----------- | ------ | ------------------------------ |
| **Breaking change**            | High        | High   | Feature flag (log-only first)  |
| **Forgot to apply middleware** | Medium      | Medium | Code review checklist          |
| **RLS locks data**             | Medium      | High   | Pre-test migrations in staging |
| **Token payload mismatch**     | Low         | High   | Integration tests              |
| **Performance regression**     | Low         | Medium | Latency tests before cutover   |

---

## Runbook: Adding New Role

If a new role is needed (e.g., `SUPERVISOR`):

1. **Update `config/permissions.json`:**

   ```json
   "SUPERVISOR": ["brand:view", "content:view", "analytics:read"]
   ```

2. **Update role type in `client/lib/auth/useAuth.ts`:**

   ```typescript
   export type Role = 'SUPERADMIN' | ... | 'SUPERVISOR';
   ```

3. **Update docs:**
   - Add to `docs/RBAC_MAPPING.md`
   - Document which legacy roles map to it

4. **Test:**
   - Create user with new role
   - Verify `useCan()` works
   - Verify API enforcement

---

## Rollback Plan

If issues arise during deployment:

1. **Immediate:** Set `ENFORCE_STRICT_RBAC=false`
2. **Within 1 hour:** Revert migrations (if DB-related)
3. **Within 4 hours:** Roll back code to previous version
4. **Communication:** Notify stakeholders; document root cause

---

## Success Metrics

- ✅ Zero permission-related incidents in production
- ✅ 100% of protected routes using `requireScope`
- ✅ 100% of UI role checks using `useCan()`
- ✅ RLS tests passing
- ✅ Performance metrics unchanged

---

## Contact & Questions

- **Backend:** [Backend Lead]
- **Frontend:** [Frontend Lead]
- **Database:** [DevOps Lead]
- **Security:** [Security Officer]
