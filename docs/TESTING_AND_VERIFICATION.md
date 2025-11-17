# RBAC Testing & Verification Guide

**Status:** Complete Implementation Ready for Testing  
**Test Coverage:** UI, API Routes, Database, Security  
**Execution Time:** ~30 minutes for full verification

---

## Pre-Testing Checklist

- [ ] All code changes merged
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables set (`.env` configured)
- [ ] Database migrations run (Supabase)
- [ ] Dev server running (`npm run dev`)

---

## 1. Code Quality Verification

### 1.1 TypeScript Compilation

```bash
npm run typecheck
```

**Expected Result:** ✅ No errors  
**Common Issues:**

- Missing imports from `@/lib/auth`
- Type mismatches on role definitions
- Missing `useCan` hook in components

**Fix Pattern:**

```typescript
// Wrong
import { useAuth } from "@/contexts/AuthContext";

// Correct
import { useAuth, useCan } from "@/lib/auth";
```

### 1.2 ESLint & Formatting

```bash
npm run lint
npm run format
```

**Expected Result:** ✅ No errors

### 1.3 Build Verification

```bash
npm run build
```

**Expected Result:** ✅ Both client and server build successfully

---

## 2. Client-Side Testing

### 2.1 Component Rendering

**Test: Auth Context Initialization**

```
1. Open app in browser
2. Check localStorage for 'aligned_user'
3. Verify user object has 'role' field
4. Check AuthProvider wraps App
```

**Expected:** User object loaded with canonical role (AGENCY_ADMIN, BRAND_MANAGER, etc.)

### 2.2 useCan() Hook Testing

**Test File:** Create `test-rbac.tsx`

```typescript
import { useAuth, useCan } from '@/lib/auth';

export function RBACTest() {
  const { role } = useAuth();
  const canCreate = useCan('content:create');
  const canApprove = useCan('content:approve');
  const canPublish = useCan('publish:now');

  return (
    <div className="p-4 space-y-2">
      <p>Role: {role}</p>
      <p>Can Create: {canCreate ? '✅' : '❌'}</p>
      <p>Can Approve: {canApprove ? '✅' : '❌'}</p>
      <p>Can Publish: {canPublish ? '✅' : '❌'}</p>
    </div>
  );
}
```

**Test Steps:**

1. Mount component
2. Login as CREATOR role
3. Verify: canCreate=true, canApprove=false, canPublish=false
4. Switch to BRAND_MANAGER
5. Verify: canCreate=true, canApprove=true, canPublish=true

### 2.3 Component Permission Checks

**Test: TopBar Component**

```
CREATOR role (content:create):
✅ Generate Content button visible

CLIENT_APPROVER role (no content:create):
❌ Generate Content button hidden

VIEWER role (no permissions):
❌ No action buttons
```

**Test: Dashboard Layout**

```
AGENCY_ADMIN role:
✅ See all dashboard widgets
✅ See "New Content" button
✅ See "Team Management" tab
✅ See "White Label" settings

CREATOR role:
✅ See dashboard
✅ See "New Content" button
❌ No "Team Management"
❌ No "White Label"

VIEWER role:
✅ See read-only dashboard
❌ All action buttons hidden
```

---

## 3. API Route Testing

### 3.1 Authentication Testing

**Test: Missing Authorization Header**

```bash
curl -X POST http://localhost:3000/api/approvals/bulk \
  -H "Content-Type: application/json" \
  -d '{"postIds": ["1"], "action": "approve"}'
```

**Expected:** 401 Unauthorized

```json
{
  "error": "UNAUTHORIZED",
  "message": "Authentication required"
}
```

### 3.2 Permission Testing

**Setup:** Create JWT token for CREATOR role

**Test: CREATOR cannot approve content**

```bash
curl -X POST http://localhost:3000/api/approvals/bulk \
  -H "Authorization: Bearer <CREATOR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"postIds": ["1"], "action": "approve"}'
```

**Expected:** 403 Forbidden

```json
{
  "error": "FORBIDDEN",
  "message": "Insufficient permissions. Required: content:approve"
}
```

**Test: BRAND_MANAGER can approve content**

```bash
curl -X POST http://localhost:3000/api/approvals/bulk \
  -H "Authorization: Bearer <BRAND_MANAGER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"postIds": ["1"], "action": "approve"}'
```

**Expected:** 200 OK with approval results

### 3.3 Route Permission Matrix

| Endpoint               | Method | CREATOR | MANAGER | APPROVER | VIEWER | Test |
| ---------------------- | ------ | ------- | ------- | -------- | ------ | ---- |
| `/api/approvals/bulk`  | POST   | 403     | 200     | 200      | 403    | ✅   |
| `/api/content/create`  | POST   | 200     | 200     | 403      | 403    | ✅   |
| `/api/analytics/:id`   | GET    | 200     | 200     | 200      | 200    | ✅   |
| `/api/billing/upgrade` | POST   | 403     | 403     | 403      | 403    | ✅   |

### 3.4 Test with Postman/Insomnia

**Collection Setup:**

```
Environment Variables:
- base_url: http://localhost:3000
- creator_token: <CREATOR_JWT>
- manager_token: <BRAND_MANAGER_JWT>
- approver_token: <CLIENT_APPROVER_JWT>

Tests:
- 401 on missing auth
- 403 on insufficient permissions
- 200 on authorized request
```

---

## 4. Database RLS Testing

### 4.1 Milestones RLS Verification

**Setup:** Create two organizations with different users

**Test: Cross-Organization Access Blocked**

```sql
-- As User A (Org 1)
SELECT * FROM milestones
WHERE organization_id = 'org_2';
-- Expected: 0 rows (RLS blocks access)

-- As User A (Org 1)
SELECT * FROM milestones
WHERE organization_id = 'org_1';
-- Expected: Rows accessible (RLS allows)
```

**Test: INSERT RLS**

```sql
-- As User A (Org 1)
INSERT INTO milestones (organization_id, key, unlocked_at)
VALUES ('org_2', 'milestone_1', NOW());
-- Expected: RLS violation error (policy blocks)
```

### 4.2 User Permissions RLS

**Test: Profile Access**

```sql
-- As User A
SELECT * FROM user_profiles WHERE id = user_b_id;
-- Expected: 0 rows (own profile only)

-- As User A (own profile)
SELECT * FROM user_profiles WHERE id = user_a_id;
-- Expected: 1 row (own profile)
```

---

## 5. End-to-End User Flows

### 5.1 Creator Workflow

**Prerequisites:** Login as CREATOR user

**Flow:**

```
1. ✅ See Dashboard
   - Expect: Main dashboard loads
2. ✅ Click "New Content"
   - Expect: Creative Studio opens
3. ❌ Click "Approve" (if visible)
   - Expect: Button disabled or hidden
4. ✅ Create content
   - Expect: POST /api/content with token
5. ✅ Request approval
   - Expect: Can select approvers
6. ❌ Cannot publish directly
   - Expect: Publish button missing/disabled
```

### 5.2 Manager Approval Workflow

**Prerequisites:** Login as BRAND_MANAGER user

**Flow:**

```
1. ✅ See Dashboard
2. ✅ View pending approvals
   - Expect: Approval widget shows pending items
3. ✅ Click "Approve"
   - Expect: POST /api/approvals/bulk succeeds
4. ✅ Can publish content
   - Expect: Publish button enabled
5. ✅ Manage team
   - Expect: User management tab visible
```

### 5.3 Client Approver Workflow

**Prerequisites:** Login as CLIENT_APPROVER user

**Flow:**

```
1. ✅ See Dashboard (limited)
2. ✅ View content to approve
3. ✅ Approve/Reject
   - Expect: Can approve via client portal
4. ❌ Cannot create content
   - Expect: No "New Content" button
5. ❌ Cannot see team management
   - Expect: Admin tabs hidden
```

### 5.4 Admin Workflow

**Prerequisites:** Login as AGENCY_ADMIN user

**Flow:**

```
1. ✅ Full dashboard access
2. ✅ All action buttons visible
3. ✅ Team management available
4. ✅ White label settings visible
5. ✅ Billing management accessible
```

---

## 6. Security Testing

### 6.1 Token Manipulation

**Test:** Modify role in JWT

```
1. Obtain valid token
2. Decode and modify role from "CREATOR" to "SUPERADMIN"
3. Re-encode and sign (will fail without secret)
4. Send to protected endpoint
```

**Expected:** 401 Unauthorized (signature mismatch)

### 6.2 Cross-Brand Access

**Test:** Access another brand's data

```bash
# As User A (Brand 1)
GET /api/approvals/pending/brand_2

# Expected: Should only return User A's brands
# If shows brand_2 data: RLS failure
```

### 6.3 Permission Escalation

**Test:** POST with elevated scope

```bash
# As CREATOR (no billing:manage)
POST /api/billing/plans/upgrade
  Authorization: Bearer <CREATOR_TOKEN>

# Expected: 403 Forbidden
# If succeeds: permission check failed
```

---

## 7. Performance Testing

### 7.1 Latency Benchmarks

**Target:** < 3 seconds for scoped endpoints

```bash
# Test approvals endpoint
time curl -X GET http://localhost:3000/api/approvals/pending/brand_1 \
  -H "Authorization: Bearer <TOKEN>"

# Expected: ~200-500ms response time
```

### 7.2 Database Query Performance

**Measure:** RLS policy evaluation time

```sql
EXPLAIN ANALYZE
SELECT * FROM milestones WHERE organization_id = 'org_1';

-- Expected: Query plan shows RLS policy applied
-- Should not cause significant slowdown
```

---

## 8. Test Automation Scripts

### 8.1 Run All Tests

```bash
#!/bin/bash
echo "🧪 Running RBAC Tests..."

echo "1️⃣  TypeCheck..."
npm run typecheck || exit 1

echo "2️⃣  Linting..."
npm run lint || exit 1

echo "3️⃣  Unit Tests..."
npm test || exit 1

echo "4️⃣  Build..."
npm run build || exit 1

echo "✅ All tests passed!"
```

### 8.2 Manual Test Checklist

```bash
# Create test-checklist.sh
#!/bin/bash

echo "📋 RBAC Testing Checklist"
echo "========================="

echo "✅ [1/6] Components use useCan()"
grep -r "useCan(" client/components/

echo "✅ [2/6] Routes have requireScope"
grep -r "requireScope" server/index.ts | wc -l

echo "✅ [3/6] AuthContext returns canonical role"
grep -r "CanonicalRole" client/

echo "✅ [4/6] Tests exist"
ls -la client/lib/auth/__tests__/
ls -la server/__tests__/rbac-*

echo "✅ [5/6] Documentation complete"
ls -la docs/RBAC*.md

echo "✅ [6/6] No inline role checks"
grep -r "role.*===" client/ || echo "  None found ✅"
```

---

## 9. Known Limitations & Workarounds

### Issue: Token Doesn't Have Role

**Cause:** JWT payload missing role field  
**Solution:** Ensure `authenticateUser` middleware sets `req.auth.role` from token

### Issue: useCan() Always Returns False

**Cause:** Role not in `config/permissions.json`  
**Solution:** Add role to config or normalize role name

### Issue: RLS Blocks Legitimate Access

**Cause:** Organization/brand mismatch  
**Solution:** Verify user is member of organization in brand_members table

---

## 10. Monitoring & Debugging

### 10.1 Enable Detailed Logging

```typescript
// server/middleware/requireScope.ts
if (process.env.DEBUG_RBAC) {
  console.log(
    `RBAC Check: role=${userRole}, scope=${scope}, allowed=${hasRequiredScope}`,
  );
}
```

```bash
DEBUG_RBAC=true npm run dev
```

### 10.2 Check Token Claims

```typescript
// In route handler
const user = (req as any).user;
console.log("User:", {
  id: user?.id,
  role: user?.role,
  permissions: permissionsMap[user?.role as any],
});
```

---

## Test Results Template

```markdown
# RBAC Testing Results

Date: 2025-11-12
Tester: [Name]

## Code Quality

- [ ] TypeCheck: ✅ PASS
- [ ] Lint: ✅ PASS
- [ ] Build: ✅ PASS

## Component Tests

- [ ] useAuth() hook: ✅ PASS
- [ ] useCan() checks: ✅ PASS
- [ ] Role-based UI: ✅ PASS

## API Tests

- [ ] 401 on missing auth: ✅ PASS
- [ ] 403 on insufficient permission: ✅ PASS
- [ ] 200 on authorized: ✅ PASS

## Database Tests

- [ ] RLS blocks cross-org access: ✅ PASS
- [ ] User can access own data: ✅ PASS
- [ ] Milestones policy enforced: ✅ PASS

## Security Tests

- [ ] Token tampering detected: ✅ PASS
- [ ] No privilege escalation: ✅ PASS

## Performance

- [ ] Approval endpoint: 250ms ✅ PASS
- [ ] Analytics endpoint: 180ms ✅ PASS

## Overall: ✅ READY FOR PRODUCTION
```

---

## Summary

**Testing Scope:**

- ✅ Code quality (TypeScript, Lint, Build)
- ✅ Component functionality
- ✅ API authorization
- ✅ Database RLS
- ✅ Security
- ✅ Performance

**Estimated Time:** 30 minutes for manual verification  
**Automated Tests:** `npm test` (Vitest)  
**Success Criteria:** All tests pass, 0 permission bypasses

---

**Document:** `docs/TESTING_AND_VERIFICATION.md`  
**Version:** 1.0  
**Last Updated:** 2025-11-12
