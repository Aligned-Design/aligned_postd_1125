# RBAC System Consolidation: Role Mapping

**Document:** Migration guide from legacy role systems to canonical RBAC  
**Effective Date:** 2025-11-12  
**Status:** In Progress (Phase 2)

---

## Overview

The POSTD platform previously used **5+ overlapping role systems** across different parts of the codebase:

1. **Server RBAC** (`server/middleware/rbac.ts`) - Full permission enum system
2. **Server Auth Context** (`server/lib/auth-context.ts`) - Hierarchy-based system
3. **Client Onboarding** (`client/contexts/AuthContext.tsx`) - Onboarding flow roles
4. **Client Simple** (`client/hooks/useAuth.ts`) - Simplified auth hook
5. **Workspace Context** (`client/contexts/WorkspaceContext.tsx`) - Team member roles

This document maps all legacy roles to the new **canonical RBAC system** defined in `config/permissions.json`.

---

## Canonical Role System

### New Roles (Source of Truth)

```
SUPERADMIN
  ↓
AGENCY_ADMIN
  ↓
BRAND_MANAGER
  ↓
CREATOR
  ↓
ANALYST (read-only analytics)
  ↓
CLIENT_APPROVER (clients who approve content)
  ↓
VIEWER (read-only access)
```

### Scope-Based Permissions

Each role is mapped to scopes in `config/permissions.json`:

```json
{
  "SUPERADMIN": ["*"],
  "AGENCY_ADMIN": ["brand:manage", "user:invite", "billing:manage", ...],
  "BRAND_MANAGER": ["brand:edit", "content:create", ...],
  "CREATOR": ["content:create", "content:edit", ...],
  "ANALYST": ["analytics:read", "analytics:export"],
  "CLIENT_APPROVER": ["content:approve", "comment:create"],
  "VIEWER": ["brand:view", "content:view", "analytics:read"]
}
```

---

## Legacy → Canonical Mapping

### server/lib/auth-context.ts (UserRole enum)

| Legacy Role | Canonical Role  | Notes                           |
| ----------- | --------------- | ------------------------------- |
| `OWNER`     | `SUPERADMIN`    | Full system access              |
| `ADMIN`     | `AGENCY_ADMIN`  | Agency/organization level admin |
| `EDITOR`    | `BRAND_MANAGER` | Brand-level management          |
| `VIEWER`    | `VIEWER`        | Read-only access                |
| `GUEST`     | `VIEWER`        | Least privileged role           |

**Migration Path:**

- `validateAuthContext(context, { minRole: UserRole.ADMIN })` → `requireScope('user:manage')`
- `hasPermission(context, UserRole.EDITOR)` → `useCan('content:edit')`

**File to Update:** `server/lib/auth-context.ts`  
**Action:** Deprecate; use `requireScope` middleware instead

---

### server/middleware/rbac.ts (Role enum)

| Legacy Role     | Canonical Role               | Notes                             |
| --------------- | ---------------------------- | --------------------------------- |
| `SUPERADMIN`    | `SUPERADMIN`                 | Unchanged                         |
| `AGENCY_ADMIN`  | `AGENCY_ADMIN`               | Unchanged                         |
| `BRAND_MANAGER` | `BRAND_MANAGER`              | Unchanged                         |
| `CREATOR`       | `CREATOR`                    | Unchanged (now also in canonical) |
| `CLIENT_VIEWER` | `CLIENT_APPROVER` / `VIEWER` | Split based on approval rights    |

**Migration Path:**

- `requireRole(Role.CREATOR)` → `requireScope('content:create')`
- `requirePermission(Permission.CREATE_CONTENT)` → `requireScope('content:create')`

**File Status:** This system is closest to canonical; update references to use `config/permissions.json`

---

### client/contexts/AuthContext.tsx

**Legacy Structure:**

```typescript
interface OnboardingUser {
  role: "agency" | "single_business";
}
```

| Legacy Role         | Canonical Role  | Notes                    |
| ------------------- | --------------- | ------------------------ |
| `"agency"`          | `AGENCY_ADMIN`  | If user is account owner |
| `"agency"`          | `BRAND_MANAGER` | If user is team member   |
| `"single_business"` | `BRAND_MANAGER` | Single business account  |

**Migration Path:**

```typescript
// Before
const { user } = useAuth(); // from context
if (user.role === "agency") {
  /* ... */
}

// After
const { role } = useAuth(); // from unified hook
if (useCan("brand:manage")) {
  /* ... */
}
```

**File to Update:**

- `client/contexts/AuthContext.tsx` - Store normalized `role` field
- All components using this context - switch to `useCan()` hook

---

### client/hooks/useAuth.ts (Simple Hook)

**Legacy Structure:**

```typescript
interface User {
  role: "agency" | "client";
}
```

| Legacy Role | Canonical Role                    | Notes                     |
| ----------- | --------------------------------- | ------------------------- |
| `"agency"`  | `AGENCY_ADMIN` or `BRAND_MANAGER` | Context-dependent         |
| `"client"`  | `CLIENT_APPROVER` or `VIEWER`     | Approval rights dependent |

**Migration Path:**

```typescript
// This hook is being DEPRECATED
// Use the new unified hook instead
import { useAuth, useCan } from "@/lib/auth";

// Before
const { userRole } = useAuth();
if (userRole === "agency") {
  /* ... */
}

// After
const { role } = useAuth();
const canManageBrand = useCan("brand:manage");
if (canManageBrand) {
  /* ... */
}
```

**File Status:** DEPRECATED - Remove after Phase 3 migration

---

### client/contexts/WorkspaceContext.tsx

**Legacy Structure:**

```typescript
interface WorkspaceMember {
  role: "Admin" | "Manager" | "Contributor" | "Viewer";
}
```

| Legacy Role     | Canonical Role                    | Notes                    |
| --------------- | --------------------------------- | ------------------------ |
| `"Admin"`       | `BRAND_MANAGER` or `AGENCY_ADMIN` | Based on workspace scope |
| `"Manager"`     | `BRAND_MANAGER`                   | Team-level manager       |
| `"Contributor"` | `CREATOR`                         | Can create content       |
| `"Viewer"`      | `VIEWER`                          | Read-only team member    |

**Migration Path:**

```typescript
// Before
const { currentWorkspace } = useWorkspace();
const isAdmin = currentWorkspace.members.some((m) => m.role === "Admin");

// After
const { useCan } = useAuth();
const canManage = useCan("workflow:manage");
```

**File to Update:** Continue using for team collaboration; map to scopes

---

### Domain-Specific Type Definitions

Several files define local `UserRole` types:

#### shared/workflow.ts

```typescript
type UserRole = "creator" | "internal_reviewer" | "client" | "admin";
```

| Legacy                | Canonical         |
| --------------------- | ----------------- |
| `'creator'`           | `CREATOR`         |
| `'internal_reviewer'` | `BRAND_MANAGER`   |
| `'client'`            | `CLIENT_APPROVER` |
| `'admin'`             | `AGENCY_ADMIN`    |

#### shared/analytics.ts

```typescript
type UserRole = "admin" | "manager" | "client";
```

| Legacy      | Canonical       |
| ----------- | --------------- |
| `'admin'`   | `AGENCY_ADMIN`  |
| `'manager'` | `BRAND_MANAGER` |
| `'client'`  | `VIEWER`        |

#### client/types/dashboard.ts

```typescript
type UserRole =
  | "admin"
  | "strategy_manager"
  | "brand_manager"
  | "approver"
  | "viewer";
```

| Legacy               | Canonical         |
| -------------------- | ----------------- |
| `"admin"`            | `AGENCY_ADMIN`    |
| `"strategy_manager"` | `BRAND_MANAGER`   |
| `"brand_manager"`    | `BRAND_MANAGER`   |
| `"approver"`         | `CLIENT_APPROVER` |
| `"viewer"`           | `VIEWER`          |

**Migration Path:** Replace all with imports from canonical system

```typescript
// Before
import type { UserRole } from "@/types/dashboard";

// After
import type { Role } from "@/lib/auth";
import { useCan } from "@/lib/auth";
```

---

## Supabase RLS Policies

### Current RLS Role References

Database policies reference roles from `brand_members.role`:

```sql
WHERE brand_members.role IN ('owner', 'admin', 'editor', 'creator')
```

### Mapping to Canonical System

| DB Role     | Canonical Role                 |
| ----------- | ------------------------------ |
| `'owner'`   | `AGENCY_ADMIN` or `SUPERADMIN` |
| `'admin'`   | `BRAND_MANAGER`                |
| `'editor'`  | `CREATOR`                      |
| `'creator'` | `CREATOR`                      |

**Migration Strategy:**

1. **Phase 1:** Keep DB roles as-is (backward compatible)
2. **Phase 2:** Add normalization function in API layer
3. **Phase 3:** Update all DB policies to align with canonical names
4. **Phase 4:** Sync DB roles with JWT token roles

---

## Implementation Roadmap

### Phase 1: Setup (✅ Complete)

- ✅ Define canonical roles in `config/permissions.json`
- ✅ Create `client/lib/auth/useAuth.ts` (unified hook)
- ✅ Create `client/lib/auth/useCan.ts` (permission check)
- ✅ Create `server/middleware/requireScope.ts` (API middleware)
- ✅ Create this mapping document

### Phase 2: Client-Side Migration (Week 1-2)

- [ ] Update `client/contexts/AuthContext.tsx` to normalize roles
- [ ] Replace all inline role checks with `useCan(scope)`
- [ ] Update UI components (AppLayout, Navigation, Dashboard)
- [ ] Deprecate `client/hooks/useAuth.ts`
- [ ] Fix TypeScript imports

**Commands:**

```bash
# Find all inline role checks
grep -r "role.*==\|'agency'\|'client'" client --include="*.tsx" --include="*.ts"

# Replace with useCan
# Example: if (user.role === 'agency') → if (useCan('brand:manage'))
```

### Phase 3: Server-Side Migration (Week 2-3)

- [ ] Apply `requireScope` middleware to critical routes
- [ ] Update `server/routes/approvals.ts` (done in Phase 1 example)
- [ ] Update `server/routes/publishing.ts`
- [ ] Update `server/routes/billing.ts`
- [ ] Remove inline role string checks
- [ ] Deprecate `server/lib/auth-context.ts` in favor of `requireScope`

**Priority Routes:**

1. `approvals` - Replace with `requireScope('content:approve')`
2. `publishing` - Replace with `requireScope('publish:now')`
3. `workflow` - Replace with `requireScope('workflow:manage')`
4. `billing` - Replace with `requireScope('billing:manage')`
5. `integrations` - Replace with `requireScope('integrations:manage')`

### Phase 4: Database Alignment (Week 3-4)

- [ ] Audit all RLS policies
- [ ] Create normalization function for DB → API role mapping
- [ ] Update critical tables' RLS policies
- [ ] Add migrations for role standardization

### Phase 5: Testing & Cleanup (Week 4-5)

- [ ] Unit tests for `useCan()` permission matrix
- [ ] Integration tests for `requireScope` middleware
- [ ] RLS smoke tests (cross-brand access blocked)
- [ ] Remove deprecated code
- [ ] Update documentation

---

## Code Examples

### Client-Side: Before & After

**Before:**

```typescript
// client/components/ApprovalButton.tsx
const { user } = useAuth(); // from context

if (user.role === 'agency' && post.status === 'pending') {
  return <Button onClick={approve}>Approve</Button>;
}
return null;
```

**After:**

```typescript
// client/components/ApprovalButton.tsx
import { useCan } from '@/lib/auth';

export function ApprovalButton({ post }: Props) {
  const canApprove = useCan('content:approve');

  if (!canApprove || post.status !== 'pending') {
    return null;
  }

  return <Button onClick={approve}>Approve</Button>;
}
```

### Server-Side: Before & After

**Before:**

```typescript
// server/routes/approvals.ts
const userRole = req.user?.role || req.headers["x-user-role"];
if (!["client", "agency", "admin"].includes(userRole)) {
  throw new AppError(ErrorCode.FORBIDDEN, "Invalid role");
}

const canApprove =
  userRole === "client" ||
  userRole === "admin" ||
  (userRole === "agency" && action === "approve");
if (!canApprove) {
  throw new AppError(ErrorCode.FORBIDDEN, "Cannot approve");
}
```

**After:**

```typescript
// server/routes/approvals.ts
import { requireScope } from "../middleware/requireScope";

router.post(
  "/bulk",
  authenticateUser,
  requireScope("content:approve"),
  bulkApproveContent,
);
```

---

## Testing Checklist

- [ ] `useCan('content:approve')` returns true for BRAND_MANAGER
- [ ] `useCan('billing:manage')` returns false for CREATOR
- [ ] `requireScope('publish:now')` rejects VIEWER (403)
- [ ] RLS: CREATOR cannot SELECT posts from other brands
- [ ] RLS: AGENCY_ADMIN can manage all brands in organization
- [ ] Token payload includes normalized canonical role

---

## References

- `config/permissions.json` - Canonical permission mapping
- `client/lib/auth/useAuth.ts` - Unified client hook
- `client/lib/auth/useCan.ts` - Permission checker
- `server/middleware/requireScope.ts` - API scope enforcement
- `docs/ROLE_ACCESS_CONTROL_AUDIT.md` - Original audit findings
