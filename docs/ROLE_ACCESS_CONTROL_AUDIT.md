# POSTD Role & Access Control Audit Report

> **Status:** ✅ Completed – This audit has been completed. All RBAC systems have been documented.  
> **Last Updated:** 2025-01-20

**Generated:** 2025-11-12  
**Project:** POSTD Platform  
**Status:** 🔴 Multiple Role Systems Identified - Requires Consolidation

---

## Executive Summary

The POSTD application implements **multiple overlapping role-based access control (RBAC) systems** across frontend, backend, and database layers. While comprehensive security is in place, **inconsistent role naming and enforcement patterns** create maintenance challenges and potential security gaps.

### Key Findings

| Finding                                | Severity  | Impact                                      |
| -------------------------------------- | --------- | ------------------------------------------- |
| **3 Different Role Schemas**           | 🔴 High   | Confusion, potential security gaps          |
| **Dual Client Auth Systems**           | 🟡 Medium | Maintenance overhead, inconsistent behavior |
| **Comprehensive Supabase RLS**         | 🟢 Good   | Strong database-level security              |
| **Robust Backend RBAC**                | 🟢 Good   | Granular permission system                  |
| **Ad-hoc String Role Checks**          | 🟡 Medium | Brittle, error-prone                        |
| **Missing Enforcement in Some Routes** | 🔴 High   | Potential unauthorized access               |

---

## Role Systems Inventory

### System 1: Server RBAC (Canonical Permission-Based)

**Location:** `server/middleware/rbac.ts`

#### Roles Defined

```typescript
export enum Role {
  SUPERADMIN = "superadmin",
  AGENCY_ADMIN = "agency_admin",
  BRAND_MANAGER = "brand_manager",
  CREATOR = "creator",
  CLIENT_VIEWER = "client_viewer",
}
```

#### Permissions Defined

```typescript
export enum Permission {
  // Content permissions
  CREATE_CONTENT = "content:create",
  EDIT_CONTENT = "content:edit",
  DELETE_CONTENT = "content:delete",
  APPROVE_CONTENT = "content:approve",
  PUBLISH_CONTENT = "content:publish",
  VIEW_CONTENT = "content:view",

  // Brand permissions
  MANAGE_BRAND = "brand:manage",
  VIEW_BRAND = "brand:view",
  EDIT_BRAND_SETTINGS = "brand:settings",

  // User/Team permissions
  MANAGE_USERS = "users:manage",
  VIEW_USERS = "users:view",
  INVITE_USERS = "users:invite",

  // Integration permissions
  MANAGE_INTEGRATIONS = "integrations:manage",
  VIEW_INTEGRATIONS = "integrations:view",

  // Analytics permissions
  VIEW_ANALYTICS = "analytics:view",
  EXPORT_ANALYTICS = "analytics:export",

  // Billing permissions
  MANAGE_BILLING = "billing:manage",
  VIEW_BILLING = "billing:view",

  // Admin permissions
  MANAGE_WHITE_LABEL = "admin:white_label",
  VIEW_AUDIT_LOGS = "admin:audit_logs",
  MANAGE_SYSTEM = "admin:system",
}
```

#### Role-Permission Mapping

| Role              | Permissions                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| **SUPERADMIN**    | ALL permissions (full system access)                                                                                |
| **AGENCY_ADMIN**  | All content ops, brand management, user management, integrations, analytics, billing, white-label, audit logs       |
| **BRAND_MANAGER** | Content ops (CRUD+approve+publish), brand settings, view users, invite users, integrations, analytics, view billing |
| **CREATOR**       | Create/edit/view content, view brand, view integrations, view analytics                                             |
| **CLIENT_VIEWER** | View content, view brand, view analytics                                                                            |

**Enforcement:**

- `requireRole(...roles)` middleware - throws 401/403
- `requirePermission(...permissions)` middleware - checks rolePermissions mapping
- `requireBrandAccess()` - validates brand ownership
- `requireOwnership()` - validates resource ownership

---

### System 2: Server Auth Context (Hierarchy-Based)

**Location:** `server/lib/auth-context.ts`

#### Roles Defined

```typescript
export enum UserRole {
  OWNER = "owner",
  ADMIN = "admin",
  EDITOR = "editor",
  VIEWER = "viewer",
  GUEST = "guest",
}
```

#### Role Hierarchy

```
GUEST < VIEWER < EDITOR < ADMIN < OWNER
```

**Enforcement:**

- `validateAuthContext(context, { minRole })` - hierarchy check
- `hasPermission(context, requiredRole)` - index-based comparison
- `canAccessBrand(context, targetBrandId)` - Owner/Admin access all brands

**Middleware:**

- `extractAuthMiddleware` - reads headers, attaches `req.auth`
- `requireAuthMiddleware` - validates presence
- `requireRoleMiddleware(minRole)` - enforces minimum role
- `requireBrandAccessMiddleware` - brand ownership check

---

### System 3: Client-Side Roles (Multiple Variants)

#### Variant A: Onboarding Context

**Location:** `client/contexts/AuthContext.tsx`

```typescript
export interface OnboardingUser {
  role: "agency" | "single_business";
}
```

**Storage:** `localStorage['aligned_user']`

**Used By:** Onboarding flow, most dashboard pages

#### Variant B: Simpler Auth Hook

**Location:** `client/hooks/useAuth.ts`

```typescript
interface User {
  role: "agency" | "client";
}
```

**Storage:** `localStorage['auth-user']`

**Used By:** `client/components/auth/ProtectedRoute.tsx`, some standalone components

#### Variant C: User Context

**Location:** `client/contexts/UserContext.tsx`

```typescript
// Uses MOCK_AGENCY_ADMIN with derived booleans:
isAgency = user.accountType === "agency";
isAdmin = user.role === "admin";
isClient = user.role === "client";
canCustomize = isAgency && (isAdmin || user.role === "manager");
```

**Used By:** Dashboard components, settings

#### Variant D: Workspace Members

**Location:** `client/contexts/WorkspaceContext.tsx`

```typescript
export interface WorkspaceMember {
  role: "Admin" | "Manager" | "Contributor" | "Viewer";
}
```

**Used By:** Collaboration features, approval flows

#### Variant E: Domain-Specific Roles

**Multiple Locations:**

- `shared/workflow.ts`: `'creator' | 'internal_reviewer' | 'client' | 'admin'`
- `shared/analytics.ts`: `'admin' | 'manager' | 'client'`
- `client/types/user.ts`: `'admin' | 'manager' | 'client'`
- `client/types/dashboard.ts`: `'admin' | 'strategy_manager' | 'brand_manager' | 'approver' | 'viewer'`

---

### System 4: Database RLS Policies

**Location:** `supabase/migrations/*.sql`

#### Roles Referenced in Policies

- `'owner'`, `'admin'`, `'editor'`, `'creator'` (from `brand_members` table)
- `auth.uid()` for user identity
- `auth.role()` for session role ('authenticated', 'anon')
- JWT claims: `current_setting('jwt.claims.role')`, `current_setting('jwt.claims.brand_id')`
- Tenant isolation: `tenant_id = auth.uid()`

---

## Detailed Access Control Analysis

### 1. Content Operations

| Action              | RBAC Role      | Auth Context Role | DB Policy                | Enforcement          |
| ------------------- | -------------- | ----------------- | ------------------------ | -------------------- |
| **Create Content**  | CREATOR+       | EDITOR+           | brand_member w/ creator+ | ✅ Multi-layer       |
| **Edit Content**    | CREATOR+       | EDITOR+           | owner OR editor+         | ✅ Multi-layer       |
| **Delete Content**  | BRAND_MANAGER+ | ADMIN+            | owner/admin only         | ✅ Multi-layer       |
| **Approve Content** | BRAND_MANAGER+ | ADMIN+            | Route-level check        | ⚠️ Mixed enforcement |
| **Publish Content** | BRAND_MANAGER+ | ADMIN+            | Route + account status   | ⚠️ Multiple systems  |
| **View Content**    | ALL            | ALL               | brand_member OR client   | ✅ Multi-layer       |

**Gaps Identified:**

- Approval endpoint (`server/routes/approvals.ts`) uses **string checks** (`['client','agency','admin']`) instead of RBAC middleware
- Publish flow has **account status checks** (`checkCanPublish`) separate from role checks

---

### 2. Brand Management

| Action                  | RBAC Role      | Auth Context Role | DB Policy    | Enforcement    |
| ----------------------- | -------------- | ----------------- | ------------ | -------------- |
| **View Brand**          | ALL            | ALL               | brand_member | ✅ Multi-layer |
| **Edit Brand Settings** | BRAND_MANAGER+ | ADMIN+            | owner/admin  | ✅ Multi-layer |
| **Manage Brand**        | AGENCY_ADMIN+  | OWNER/ADMIN       | owner/admin  | ✅ Multi-layer |
| **Delete Brand**        | AGENCY_ADMIN+  | OWNER             | owner only   | ✅ Multi-layer |

**Enforcement:** Strong across all layers

---

### 3. User & Team Management

| Action           | RBAC Role      | Auth Context Role | DB Policy                   | Enforcement    |
| ---------------- | -------------- | ----------------- | --------------------------- | -------------- |
| **View Users**   | BRAND_MANAGER+ | VIEWER+           | brand_member                | ✅ Multi-layer |
| **Invite Users** | BRAND_MANAGER+ | ADMIN+            | owner/admin (brand_members) | ✅ Multi-layer |
| **Manage Users** | AGENCY_ADMIN+  | ADMIN+            | owner/admin                 | ✅ Multi-layer |
| **Assign Roles** | AGENCY_ADMIN+  | OWNER/ADMIN       | owner/admin                 | ✅ Multi-layer |

**Enforcement:** Strong

---

### 4. Integrations & Publishing

| Action                  | RBAC Role      | Auth Context Role | DB Policy                    | Enforcement        |
| ----------------------- | -------------- | ----------------- | ---------------------------- | ------------------ |
| **View Integrations**   | CREATOR+       | VIEWER+           | brand_member                 | ✅ Multi-layer     |
| **Manage Integrations** | BRAND_MANAGER+ | ADMIN+            | owner/admin                  | ✅ Multi-layer     |
| **Connect Platform**    | BRAND_MANAGER+ | ADMIN+            | token health check           | ⚠️ Mixed           |
| **Publish to Platform** | BRAND_MANAGER+ | ADMIN+            | connection + account + token | ⚠️ Multiple checks |

**Gaps:**

- `server/routes/publishing.ts` relies on connection existence, not explicit role checks
- Token health middleware separate from role enforcement

---

### 5. Analytics & Reporting

| Action               | RBAC Role      | Auth Context Role | DB Policy    | Enforcement    |
| -------------------- | -------------- | ----------------- | ------------ | -------------- |
| **View Analytics**   | ALL            | ALL               | brand_member | ✅ Multi-layer |
| **Export Analytics** | BRAND_MANAGER+ | ADMIN+            | owner/admin  | ✅ Multi-layer |
| **View Audit Logs**  | AGENCY_ADMIN+  | ADMIN+            | owner/admin  | ✅ Multi-layer |

**Enforcement:** Strong

---

### 6. Billing & Admin

| Action                  | RBAC Role      | Auth Context Role    | DB Policy               | Enforcement          |
| ----------------------- | -------------- | -------------------- | ----------------------- | -------------------- |
| **View Billing**        | BRAND_MANAGER+ | ADMIN+               | No RLS (service checks) | ⚠️ Backend only      |
| **Manage Billing**      | AGENCY_ADMIN+  | OWNER/ADMIN          | No RLS                  | ⚠️ Backend only      |
| **Extend Grace Period** | AGENCY_ADMIN+  | "admin" string check | N/A                     | ⚠️ String check only |
| **Manage White Label**  | AGENCY_ADMIN+  | N/A                  | agencyId check          | ⚠️ Partial           |

**Gaps:**

- Billing routes (`server/routes/billing.ts`, `billing-reactivation.ts`) import `authenticateUser` from `server/middleware/security` but **this export does not exist**
- Grace period extension uses inline `adminUser.role !== "admin"` check instead of middleware

---

## Frontend Route Protection

### Protected Routes Implementation

**Location:** `client/App.tsx`

```typescript
// Uses client/contexts/AuthContext (onboarding context)
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, onboardingStep } = useAuth();

  if (!isAuthenticated) return <Navigate to="/" />;
  if (onboardingStep) return <Navigate to="/onboarding" />;
  return <>{children}</>;
}
```

**Also:** `client/components/auth/ProtectedRoute.tsx`

```typescript
// Uses client/hooks/useAuth (simpler hook)
export default function ProtectedRoute({
  children,
  requiredRole
}: {
  children: React.ReactNode;
  requiredRole?: 'agency' | 'client';
}) {
  const { isAuthenticated, userRole } = useAuth();

  if (!isAuthenticated) return <LoginPage />;
  if (requiredRole && userRole !== requiredRole) return <AccessDenied />;
  return <>{children}</>;
}
```

**Issue:** Two different `ProtectedRoute` implementations using different auth hooks

---

### Role-Based UI Rendering

**Pattern:** Conditional rendering based on `userRole`

**Examples:**

1. **Navigation** (`client/components/layout/MainNavigation.tsx`)

```typescript
const navItems = userRole === "agency" ? agencyNavItems : clientNavItems;
// Search input only for agency
{userRole === "agency" && <Input placeholder="Search..." />}
```

2. **Approval Flow** (`client/components/generation/RoleBasedApprovalFlow.tsx`)

```typescript
interface Props {
  userRole: "admin" | "manager" | "creator" | "client";
}

// Conditional UI based on role
if (userRole === "creator" && !requiresApproval) {
  /* Schedule/Publish */
}
if (userRole === "creator" && requiresApproval) {
  /* Request Approval */
}
if (userRole === "admin" || userRole === "manager") {
  /* Approve/Publish */
}
if (userRole === "client") {
  /* Approve/Reject Only */
}
```

3. **Generate Content Button** (`client/components/layout/TopBar.tsx`)

```typescript
{userRole === "agency" && (
  <Button>Generate Content</Button>
)}
```

**Coverage:** ✅ Extensive role-based UI hiding across dashboard

---

## Backend Enforcement Patterns

### Pattern 1: RBAC Middleware (Best Practice)

**Location:** Routes using `server/middleware/rbac.ts`

```typescript
import {
  requireRole,
  requirePermission,
  Role,
  Permission,
} from "../middleware/rbac";

router.post(
  "/content",
  requireRole(Role.CREATOR, Role.BRAND_MANAGER, Role.AGENCY_ADMIN),
  requirePermission(Permission.CREATE_CONTENT),
  createContent,
);
```

**Used In:**

- ✅ Some content routes
- ✅ Some workflow routes

---

### Pattern 2: Auth Context Middleware (Hierarchy-Based)

**Location:** Routes using `server/lib/auth-middleware.ts`

```typescript
import { requireRoleMiddleware, UserRole } from "../lib/auth-middleware";

router.get(
  "/analytics",
  extractAuthMiddleware,
  requireAuthMiddleware,
  requireRoleMiddleware(UserRole.VIEWER),
  getAnalytics,
);
```

**Used In:**

- ✅ Some analytics routes
- ✅ Some brand routes

---

### Pattern 3: Inline String Checks (Anti-Pattern)

**Location:** `server/routes/approvals.ts`, billing routes, others

```typescript
const userRole = req.user?.role || req.headers["x-user-role"];

// ❌ Brittle string array check
if (!["client", "agency", "admin"].includes(userRole)) {
  throw new AppError(ErrorCode.FORBIDDEN, "Invalid user role");
}

// ❌ Ad-hoc permission logic
const canApprove =
  userRole === "client" ||
  userRole === "admin" ||
  (userRole === "agency" && action === "approve");
```

**Found In:**

- ❌ `server/routes/approvals.ts` (lines 39-80, 152-160)
- ❌ `server/routes/billing-reactivation.ts` (line ~148)
- ❌ `server/routes/workflow.ts` (various)
- ❌ Multiple other routes

---

### Pattern 4: Account Status Middleware (Separate System)

**Location:** `server/middleware/account-status.ts`

Enforces **plan-based restrictions** (not role-based):

```typescript
checkCanPublish; // Returns 403 if plan_status not 'active'
checkCanApprove; // Returns 403 if approval disabled
checkCanGenerateContent; // Returns 403/429 if limits reached
checkCanManageBrands; // Returns 403 if feature disabled
```

**Issue:** Separate from role checks; combined at route level

---

## Database RLS Policies Summary

### Tables with RLS Enabled

| Table                            | Policies | Key Conditions                        |
| -------------------------------- | -------- | ------------------------------------- |
| `user_profiles`                  | 2        | auth.uid() = id                       |
| `user_preferences`               | 3        | auth.uid() = user_id                  |
| `brands`                         | 2        | brand_members check                   |
| `brand_members`                  | 2        | role IN ('owner','admin')             |
| `brand_assets`                   | 4        | role IN ('owner','admin','editor')    |
| `content`                        | 4        | creator OR editor+                    |
| `posts`                          | 3        | brand_member                          |
| `post_approvals`                 | 2        | admin/client                          |
| `platform_connections`           | 2        | brand_member w/ owner/admin           |
| `integration_events`             | 2        | brand_member OR system UID            |
| `webhook_logs`                   | 2        | owner/admin OR system                 |
| `client_settings`                | 2        | client_id OR owner/admin              |
| `client_comments`                | 2        | client OR brand_member                |
| `client_media`                   | 2        | client + can_upload_media             |
| `audit_logs`                     | 3        | owner/admin (or JWT claim role=admin) |
| `connections`                    | 1        | tenant_id = auth.uid()                |
| `publish_jobs`                   | 1        | tenant_id = auth.uid()                |
| `storage.objects` (brand-assets) | 4        | authenticated + folder ownership      |

### Key RLS Patterns

1. **User Identity:** `auth.uid() = user_id`
2. **Brand Membership:** `EXISTS (SELECT 1 FROM brand_members WHERE user_id = auth.uid() AND brand_id = ...)`
3. **Role Enforcement:** `brand_members.role IN ('owner', 'admin', 'editor')`
4. **Tenant Isolation:** `tenant_id = auth.uid()`
5. **System Identity:** `auth.uid() = '00000000-0000-0000-0000-000000000000'`
6. **JWT Claims:** `current_setting('jwt.claims.role') = 'admin'`

### RLS Gaps

⚠️ **Milestones Table** (`supabase/migrations/20250120_create_milestones_table.sql`):

```sql
CREATE POLICY "Users can read own workspace milestones"
  ON milestones FOR SELECT
  USING (true); -- TODO: Add proper workspace auth check
```

- All policies use `USING (true)` - **NO ENFORCEMENT**
- TODO comments indicate this is incomplete

---

## Security Gaps & Mismatches

### 🔴 Critical Issues

| #   | Issue                                 | Location                                                       | Impact                                  | Recommendation                              |
| --- | ------------------------------------- | -------------------------------------------------------------- | --------------------------------------- | ------------------------------------------- |
| 1   | **Missing `authenticateUser` export** | `server/middleware/security.ts`                                | Billing routes may not enforce auth     | Verify imports, add export or update routes |
| 2   | **Milestones RLS allows all**         | `supabase/migrations/20250120_create_milestones_table.sql`     | Any user can read/modify all milestones | Implement proper workspace checks           |
| 3   | **Inline string role checks**         | `server/routes/approvals.ts`, `billing-reactivation.ts`        | Brittle, error-prone                    | Migrate to RBAC middleware                  |
| 4   | **Dual client auth hooks**            | `client/contexts/AuthContext.tsx` vs `client/hooks/useAuth.ts` | Inconsistent behavior                   | Consolidate to single source                |
| 5   | **Publishing route lacks role check** | `server/routes/publishing.ts`                                  | Relies on connection, not explicit role | Add `requireRole` middleware                |

---

### 🟡 Medium Priority Issues

| #   | Issue                                  | Location                                    | Impact                           | Recommendation               |
| --- | -------------------------------------- | ------------------------------------------- | -------------------------------- | ---------------------------- |
| 6   | **3 different server role enums**      | `rbac.ts`, `auth-context.ts`, route strings | Confusion, maintenance burden    | Create canonical mapping     |
| 7   | **Mixed req.user / req.auth**          | Multiple routes                             | Inconsistent access patterns     | Standardize on `req.auth`    |
| 8   | **No unified role hierarchy**          | Client + server                             | Hard to reason about permissions | Document canonical hierarchy |
| 9   | **Account status separate from roles** | `account-status.ts`                         | Multiple enforcement systems     | Integrate with RBAC          |
| 10  | **System UID hardcoded**               | RLS policies (`00000000-0000-...`)          | Magic value, not documented      | Create constant, document    |

---

## File Reference Index

### Server-Side Auth & RBAC

| File                                           | Purpose                        | Roles Used                                                      | Lines of Interest                   |
| ---------------------------------------------- | ------------------------------ | --------------------------------------------------------------- | ----------------------------------- |
| `server/middleware/rbac.ts`                    | Primary RBAC system            | SUPERADMIN, AGENCY_ADMIN, BRAND_MANAGER, CREATOR, CLIENT_VIEWER | 8-117 (enums), 149-312 (middleware) |
| `server/lib/auth-context.ts`                   | Hierarchy-based auth           | OWNER, ADMIN, EDITOR, VIEWER, GUEST                             | 13-19 (enum), 87-241 (helpers)      |
| `server/lib/auth-middleware.ts`                | Middleware composition         | Uses UserRole from auth-context                                 | 33-191 (all)                        |
| `server/lib/jwt-auth.ts`                       | JWT verification               | Uses Role from rbac.ts                                          | 196-250 (jwtAuth middleware)        |
| `server/middleware/security.ts`                | CSRF, rate limiting, IP filter | N/A                                                             | Missing `authenticateUser` export   |
| `server/middleware/account-status.ts`          | Plan/account restrictions      | N/A (plan-based)                                                | 22-217 (all)                        |
| `server/middleware/trial.ts`                   | Trial limits                   | N/A (plan-based)                                                | 20-62                               |
| `server/middleware/token-health-middleware.ts` | OAuth token health             | N/A                                                             | 24-101                              |

### Route Files with Role Checks

| File                                    | Pattern Used                         | Issues              |
| --------------------------------------- | ------------------------------------ | ------------------- |
| `server/routes/approvals.ts`            | ❌ Inline string checks              | Use RBAC middleware |
| `server/routes/billing.ts`              | ❌ Import missing `authenticateUser` | Fix import          |
| `server/routes/billing-reactivation.ts` | ❌ Inline admin check                | Use RBAC middleware |
| `server/routes/publishing.ts`           | ⚠️ Connection-based                  | Add role middleware |
| `server/routes/integrations.ts`         | ⚠️ Brand/auth checks                 | Good                |
| `server/routes/workflow.ts`             | ⚠️ Auth context required             | Add role checks     |
| `server/routes/white-label.ts`          | ⚠️ AgencyId check                    | Add role middleware |

### Client-Side Auth

| File                                        | Purpose                       | Roles Used                                        |
| ------------------------------------------- | ----------------------------- | ------------------------------------------------- |
| `client/contexts/AuthContext.tsx`           | Onboarding flow auth          | "agency" \| "single_business"                     |
| `client/hooks/useAuth.ts`                   | Simpler auth hook             | "agency" \| "client"                              |
| `client/contexts/UserContext.tsx`           | User state & derived booleans | "admin" \| "manager" \| "client"                  |
| `client/contexts/WorkspaceContext.tsx`      | Team members                  | "Admin" \| "Manager" \| "Contributor" \| "Viewer" |
| `client/components/auth/ProtectedRoute.tsx` | Route guard                   | Uses `useAuth` from hooks                         |
| `client/App.tsx`                            | Route definitions             | Uses `useAuth` from context                       |

### Client-Side Role-Based UI

| File                                                     | Role Check Pattern                                  |
| -------------------------------------------------------- | --------------------------------------------------- |
| `client/components/layout/AppLayout.tsx`                 | `userRole === "agency"` for nav items               |
| `client/components/layout/MainNavigation.tsx`            | `agencyNavItems` vs `clientNavItems`                |
| `client/components/layout/TopBar.tsx`                    | Hide "Generate Content" for non-agency              |
| `client/components/generation/RoleBasedApprovalFlow.tsx` | 4-way role branching (creator/admin/manager/client) |

### Database Policies

| File                                                       | Tables                                                     | Patterns                         |
| ---------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------- |
| `supabase/migrations/001_auth_and_users.sql`               | user_profiles, user_preferences                            | auth.uid() = id                  |
| `supabase/migrations/005_integrations.sql`                 | platform_connections, integration_events, webhook_logs     | brand_members + role             |
| `supabase/migrations/007_client_portal_and_audit.sql`      | client_settings, client_comments, client_media, audit_logs | client OR owner/admin            |
| `supabase/migrations/20241111_api_connector_schema.sql`    | connections, publish_jobs, webhook_events, etc.            | tenant_id = auth.uid()           |
| `supabase/migrations/20250120_enhanced_security_rls.sql`   | brands, content, posts, approvals, analytics, etc.         | brand_members + roles            |
| `supabase/migrations/20250120_create_milestones_table.sql` | milestones                                                 | ⚠️ USING (true) - NO ENFORCEMENT |
| `supabase/storage/brand-assets-policies.sql`               | storage.objects                                            | folder-based brand ownership     |

---

## Role Mapping Matrix

### Canonical Role Hierarchy (Recommended)

```
Level 1: SUPERADMIN / OWNER
   │
Level 2: AGENCY_ADMIN / ADMIN
   │
Level 3: BRAND_MANAGER / MANAGER
   │
Level 4: CREATOR / EDITOR
   │
Level 5: CLIENT_VIEWER / VIEWER / GUEST
```

### Cross-System Role Equivalence

| RBAC (rbac.ts) | Auth Context (auth-context.ts) | Client UI          | DB RLS (brand_members)       |
| -------------- | ------------------------------ | ------------------ | ---------------------------- |
| SUPERADMIN     | OWNER                          | N/A (backend-only) | owner                        |
| AGENCY_ADMIN   | ADMIN                          | "agency" (admin)   | admin                        |
| BRAND_MANAGER  | EDITOR                         | "agency" (manager) | editor                       |
| CREATOR        | EDITOR                         | "creator"          | creator                      |
| CLIENT_VIEWER  | VIEWER                         | "client"           | (client via client_settings) |
| N/A            | GUEST                          | N/A                | N/A                          |

**Note:** Workspace roles (Admin/Manager/Contributor/Viewer) are UI-specific and map to permissions at the team level, not system-wide.

---

## Enforcement Summary Table

| Role              | Access Scope                                            | Restricted Pages/Endpoints         | Enforcement Location                                             |
| ----------------- | ------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------- |
| **SUPERADMIN**    | Full system access                                      | None                               | Backend RBAC middleware, RLS bypass for some operations          |
| **OWNER**         | All brands, all operations                              | None                               | Auth context hierarchy, RLS policies (`role = 'owner'`)          |
| **AGENCY_ADMIN**  | Agency-level: all brands, users, billing, white-label   | Admin settings, billing            | Backend RBAC (`requireRole`), JWT role claim                     |
| **ADMIN**         | Brand-level: manage brand, users, content, integrations | System admin features              | Backend hierarchy (`UserRole.ADMIN`), RLS (`role = 'admin'`)     |
| **BRAND_MANAGER** | Brand operations, content approval, analytics export    | User management, billing           | Backend RBAC, RLS (`role IN owner/admin`)                        |
| **EDITOR**        | Content creation, editing                               | Publish, approvals, brand settings | Auth context hierarchy, RLS (`role = 'editor'`)                  |
| **CREATOR**       | Content creation, viewing                               | Edit others' content, approvals    | Backend RBAC (`Role.CREATOR`), UI approval flow                  |
| **VIEWER**        | Read-only: content, analytics, brand                    | All write operations               | Auth context (`UserRole.VIEWER`), RLS brand_member check         |
| **CLIENT_VIEWER** | Client portal: view/comment on content                  | Create content, integrations       | Backend RBAC, RLS (`client_settings` table)                      |
| **CLIENT** (UI)   | View content, approve (if enabled), view analytics      | Generate content, brand settings   | UI conditional rendering (`userRole === "client"`), route guards |

---

## Best Practice Recommendations

### 1. Consolidate Role Systems

**Current State:** 3+ different role schemas across codebase

**Recommended Action:**

1. **Choose one canonical system:** Use `server/middleware/rbac.ts` as the source of truth
2. **Create mapping layer:** Document equivalence between systems
3. **Migrate gradually:** Update routes to use RBAC middleware
4. **Remove duplicates:** Deprecate ad-hoc string checks

**Implementation:**

```typescript
// shared/roles.ts - Single source of truth
export enum Role {
  SUPERADMIN = "superadmin",
  AGENCY_ADMIN = "agency_admin",
  BRAND_MANAGER = "brand_manager",
  CREATOR = "creator",
  CLIENT_VIEWER = "client_viewer",
}

// Mapping for backward compatibility
export const RoleHierarchy: Record<Role, number> = {
  [Role.CLIENT_VIEWER]: 1,
  [Role.CREATOR]: 2,
  [Role.BRAND_MANAGER]: 3,
  [Role.AGENCY_ADMIN]: 4,
  [Role.SUPERADMIN]: 5,
};

export function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
  return RoleHierarchy[userRole] >= RoleHierarchy[requiredRole];
}
```

---

### 2. Unify Client Auth Hooks

**Current State:** Two `useAuth` implementations with different interfaces

**Recommended Action:**

```typescript
// client/hooks/useAuth.ts - Unified hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

// Deprecate client/hooks/useAuth.ts
// Update ProtectedRoute to use context-based hook
```

---

### 3. Standardize Backend Enforcement

**Current State:** Mix of RBAC middleware, auth-context checks, inline strings

**Recommended Pattern:**

```typescript
// Apply to ALL protected routes
router.post(
  "/content",
  jwtAuth, // JWT verification
  requireRole(Role.CREATOR), // Role check
  requirePermission(Permission.CREATE_CONTENT), // Permission check
  requireBrandAccess, // Brand ownership
  createContentHandler,
);
```

**Migration Checklist:**

- [ ] Update `server/routes/approvals.ts` to use `requireRole`
- [ ] Fix `authenticateUser` import in billing routes
- [ ] Add role middleware to `server/routes/publishing.ts`
- [ ] Replace string checks in `workflow.ts`, `white-label.ts`
- [ ] Audit all routes for consistent middleware stack

---

### 4. Complete Database RLS Policies

**Priority 1:** Fix milestones table

```sql
-- Replace in 20250120_create_milestones_table.sql
CREATE POLICY "Users can read own workspace milestones"
  ON milestones FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces
      WHERE owner_id = auth.uid()
      OR id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );
```

**Priority 2:** Document system UID pattern

```sql
-- Add to migrations documentation
-- System service account for automated operations
CREATE OR REPLACE FUNCTION is_system_user() RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid()::text = '00000000-0000-0000-0000-000000000000';
END;
$$ LANGUAGE plpgsql;

-- Use in policies
USING (is_system_user() OR <other_conditions>)
```

---

### 5. Implement Centralized Permission Checker

**Create:** `server/lib/permissions.ts`

```typescript
import { Role, Permission, rolePermissions } from "../middleware/rbac";
import { UserRole } from "./auth-context";

export class PermissionChecker {
  /**
   * Check if role has permission
   */
  static hasPermission(role: Role, permission: Permission): boolean {
    return rolePermissions[role]?.includes(permission) ?? false;
  }

  /**
   * Check if user meets minimum role requirement
   */
  static meetsMinimumRole(userRole: UserRole, minRole: UserRole): boolean {
    const hierarchy = [
      UserRole.GUEST,
      UserRole.VIEWER,
      UserRole.EDITOR,
      UserRole.ADMIN,
      UserRole.OWNER,
    ];
    return hierarchy.indexOf(userRole) >= hierarchy.indexOf(minRole);
  }

  /**
   * Map UserRole to RBAC Role
   */
  static mapToRBACRole(userRole: UserRole): Role {
    const mapping: Record<UserRole, Role> = {
      [UserRole.OWNER]: Role.SUPERADMIN,
      [UserRole.ADMIN]: Role.AGENCY_ADMIN,
      [UserRole.EDITOR]: Role.BRAND_MANAGER,
      [UserRole.VIEWER]: Role.CLIENT_VIEWER,
      [UserRole.GUEST]: Role.CLIENT_VIEWER,
    };
    return mapping[userRole];
  }
}
```

---

### 6. Add Automated Security Tests

**Create:** `server/__tests__/rbac-security.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { Role, Permission, rolePermissions } from "../middleware/rbac";

describe("RBAC Security Tests", () => {
  it("SUPERADMIN should have all permissions", () => {
    const allPermissions = Object.values(Permission);
    expect(rolePermissions[Role.SUPERADMIN]).toEqual(allPermissions);
  });

  it("CLIENT_VIEWER should not have write permissions", () => {
    const writePermissions = [
      Permission.CREATE_CONTENT,
      Permission.EDIT_CONTENT,
      Permission.DELETE_CONTENT,
      Permission.MANAGE_BRAND,
    ];

    writePermissions.forEach((perm) => {
      expect(rolePermissions[Role.CLIENT_VIEWER]).not.toContain(perm);
    });
  });

  it("CREATOR should not have approval permissions", () => {
    expect(rolePermissions[Role.CREATOR]).not.toContain(
      Permission.APPROVE_CONTENT,
    );
  });
});
```

---

### 7. Page/Feature Access Matrix

**Document:** Create `docs/ROLE_PAGE_MATRIX.md`

| Page/Feature     | Superadmin | Agency Admin | Brand Manager | Creator   | Client       |
| ---------------- | ---------- | ------------ | ------------- | --------- | ------------ |
| Dashboard        | ✅         | ✅           | ✅            | ✅        | ✅           |
| Generate Content | ✅         | ✅           | ✅            | ✅        | ❌           |
| Content Editor   | ✅         | ✅           | ✅            | ✅ (own)  | ❌           |
| Approvals        | ✅         | ✅           | ✅            | ❌        | ✅ (limited) |
| Publishing       | ✅         | ✅           | ✅            | ❌        | ❌           |
| Brand Settings   | ✅         | ✅           | ✅            | ❌        | ❌           |
| Team Management  | ✅         | ✅           | ✅ (view)     | ❌        | ❌           |
| Integrations     | ✅         | ✅           | ✅            | ❌        | ❌           |
| Analytics        | ✅         | ✅           | ✅            | ✅ (view) | ✅ (view)    |
| Billing          | ✅         | ✅           | ❌            | ❌        | ❌           |
| White Label      | ✅         | ✅           | ❌            | ❌        | ❌           |
| Audit Logs       | ✅         | ✅           | ❌            | ❌        | ❌           |

---

## Implementation Roadmap

### Phase 1: Critical Fixes (Week 1)

- [ ] Fix `authenticateUser` import issue in billing routes
- [ ] Complete milestones RLS policies
- [ ] Replace inline role checks in `approvals.ts` with RBAC middleware
- [ ] Add role checks to `publishing.ts`

### Phase 2: Consolidation (Week 2)

- [ ] Create `shared/roles.ts` with canonical role definitions
- [ ] Unify client auth hooks (deprecate duplicate `useAuth`)
- [ ] Document role mapping matrix
- [ ] Create centralized `PermissionChecker` utility

### Phase 3: Migration (Week 3-4)

- [ ] Update all route files to use RBAC middleware consistently
- [ ] Standardize on `req.auth` (remove `req.user` usage)
- [ ] Add missing middleware to workflow, white-label routes
- [ ] Audit and update client-side role checks

### Phase 4: Testing & Documentation (Week 5)

- [ ] Implement automated RBAC security tests
- [ ] Create role-page access matrix documentation
- [ ] Add integration tests for permission enforcement
- [ ] Document system UID and service account pattern

### Phase 5: Monitoring (Ongoing)

- [ ] Add logging for permission denials
- [ ] Track unauthorized access attempts
- [ ] Monitor role usage patterns
- [ ] Regular security audits

---

## Conclusion

The POSTD platform has **strong security fundamentals** with comprehensive RLS policies, robust RBAC middleware, and extensive role-based UI controls. However, **multiple overlapping role systems** create maintenance complexity and potential security gaps.

### Key Strengths ✅

- Comprehensive Supabase RLS policies
- Well-designed RBAC permission system
- Multi-layer enforcement (DB + API + UI)
- JWT-based authentication
- Brand/tenant isolation

### Key Weaknesses ❌

- 3 different role schemas (RBAC, AuthContext, client strings)
- Inconsistent middleware usage (some routes use RBAC, others use strings)
- Dual client auth hooks causing confusion
- Missing role checks in some routes (publishing, workflow)
- Incomplete RLS policies (milestones table)
- Missing `authenticateUser` export

### Risk Assessment

| Risk Category            | Current State | Recommended Target |
| ------------------------ | ------------- | ------------------ |
| Unauthorized Data Access | 🟡 Medium     | 🟢 Low             |
| Privilege Escalation     | 🟡 Medium     | 🟢 Low             |
| Role Confusion           | 🔴 High       | 🟢 Low             |
| Maintenance Burden       | 🔴 High       | 🟡 Medium          |
| Audit Readiness          | 🟡 Medium     | 🟢 High            |

**Overall Security Grade:** B+ (Strong foundation, needs standardization)

---

## Next Steps

1. **Immediate:** Fix critical gaps (authenticateUser, milestones RLS)
2. **Short-term:** Consolidate role systems, standardize enforcement
3. **Medium-term:** Complete migration to RBAC middleware across all routes
4. **Long-term:** Automated testing, monitoring, regular security audits

For questions or implementation support, refer to:

- `docs/AGENT_REVALIDATION_REPORT.md` for agent-specific security
- `SECURITY.md` for overall security practices
- `server/middleware/rbac.ts` for RBAC implementation details
