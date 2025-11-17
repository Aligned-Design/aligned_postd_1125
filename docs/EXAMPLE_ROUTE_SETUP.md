# Example: Setting Up Routes with requireScope Middleware

This document shows how to apply the new RBAC enforcement to your Express routes.

---

## Pattern: Basic Route Protection

### Before (Old Pattern)

```typescript
// server/routes/approvals.ts
import { Router } from "express";

const router = Router();

router.post("/bulk", bulkApproveContent);
```

**Problem:** No permission enforcement; handler contains inline role checks

```typescript
export const bulkApproveContent = async (req, res, next) => {
  const userRole = req.user?.role || req.headers["x-user-role"];

  // ❌ Brittle string check
  if (!["client", "agency", "admin"].includes(userRole)) {
    throw new AppError(ErrorCode.FORBIDDEN, "Invalid role");
  }

  // ❌ Ad-hoc permission logic
  const canApprove =
    userRole === "client" ||
    userRole === "admin" ||
    (userRole === "agency" && action === "approve");
  if (!canApprove) throw error;

  // ... rest of handler
};
```

### After (New Pattern)

```typescript
// server/routes/approvals.ts
import { Router } from "express";
import { authenticateUser } from "../middleware/security";
import { requireScope } from "../middleware/requireScope";

const router = Router();

// ✅ Clear middleware stack
router.post(
  "/bulk",
  authenticateUser, // Verify JWT, attach req.auth
  requireScope("content:approve"), // Enforce scope
  bulkApproveContent, // Handler (permission guaranteed)
);

// Or multiple scopes (user needs at least one)
router.post(
  "/single/:postId",
  authenticateUser,
  requireScope(["content:approve", "content:manage"]),
  approveSingleContent,
);
```

**Handler is now simpler:**

```typescript
export const bulkApproveContent = async (req, res, next) => {
  try {
    const { postIds, action, note } = req.body;
    const userId = req.user?.id;
    const brandId = req.user?.brandId;

    // ✅ Permission already checked by middleware
    // Just validate input
    if (!postIds?.length) {
      throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, "...");
    }

    // ... rest of handler (no role checks)
  } catch (error) {
    next(error);
  }
};
```

---

## Pattern: Multi-Scope Routes

Some routes require multiple permissions:

```typescript
import { requireAllScopes } from "../middleware/requireScope";

// Route requires BOTH publishing AND scheduling
router.post(
  "/schedule-and-publish",
  authenticateUser,
  requireAllScopes(["publish:schedule", "publish:now"]),
  scheduleAndPublish,
);
```

---

## Pattern: Resource Ownership Check

Some scopes also require resource ownership (e.g., user can only edit own content):

```typescript
// First check scope (role-based)
// Then check ownership (in handler)

router.put(
  "/posts/:postId",
  authenticateUser,
  requireScope("content:edit"),
  editPost,
);

export const editPost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Get post
    const post = await postDB.getPost(postId);

    // ✅ Now check ownership (beyond scope)
    if (post.created_by !== userId && !useCan("content:manage")) {
      throw new AppError(ErrorCode.FORBIDDEN, "Cannot edit others' content");
    }

    // ... update post
  } catch (error) {
    next(error);
  }
};
```

---

## Pattern: Organization/Brand Scope

Some routes need to verify the user belongs to the organization/brand:

```typescript
// Check scope AND brand access

router.put(
  "/brands/:brandId/settings",
  authenticateUser,
  requireScope("brand:edit"),
  (req, res, next) => {
    // Additional check: user belongs to brand
    const brandId = req.params.brandId;
    const userBrandIds = req.user.brand_ids || [];

    if (!userBrandIds.includes(brandId)) {
      return res.status(403).json({
        error: "Access denied",
        message: "User does not have access to this brand",
      });
    }

    next();
  },
  updateBrandSettings,
);
```

---

## Real Examples

### Example 1: Approvals Route (From Audit)

**File:** `server/routes/approvals.ts`

```typescript
import { Router, RequestHandler } from "express";
import { authenticateUser } from "../middleware/security";
import { requireScope } from "../middleware/requireScope";
import {
  bulkApproveContent,
  approveSingleContent,
  rejectContent,
  getReminderStatus,
  sendApprovalReminder,
} from "./handlers/approvals";

const router = Router();

/**
 * POST /api/approvals/bulk
 * Bulk approve or reject posts
 */
router.post(
  "/bulk",
  authenticateUser,
  requireScope("content:approve"),
  bulkApproveContent,
);

/**
 * POST /api/approvals/:postId/approve
 * Approve single post
 */
router.post(
  "/:postId/approve",
  authenticateUser,
  requireScope("content:approve"),
  approveSingleContent,
);

/**
 * POST /api/approvals/:postId/reject
 * Reject single post
 */
router.post(
  "/:postId/reject",
  authenticateUser,
  requireScope("content:approve"),
  rejectContent,
);

/**
 * GET /api/approvals/reminders/:brandId
 * Get approval reminder status
 */
router.get(
  "/reminders/:brandId",
  authenticateUser,
  requireScope("content:view"), // Can view related content
  getReminderStatus,
);

/**
 * POST /api/approvals/reminders/send
 * Send approval reminder email
 */
router.post(
  "/reminders/send",
  authenticateUser,
  requireScope("content:approve"), // Must be able to approve
  sendApprovalReminder,
);

export default router;
```

---

### Example 2: Publishing Route

**File:** `server/routes/publishing.ts`

```typescript
import { Router } from "express";
import { authenticateUser } from "../middleware/security";
import { requireScope, requireAllScopes } from "../middleware/requireScope";
import {
  publishPost,
  schedulePost,
  unpublishPost,
} from "./handlers/publishing";

const router = Router();

/**
 * POST /api/posts/:postId/publish
 * Publish post immediately
 */
router.post(
  "/:postId/publish",
  authenticateUser,
  requireScope("publish:now"), // Must have publish permission
  publishPost,
);

/**
 * POST /api/posts/:postId/schedule
 * Schedule post for future publishing
 */
router.post(
  "/:postId/schedule",
  authenticateUser,
  requireScope("publish:schedule"),
  schedulePost,
);

/**
 * POST /api/posts/:postId/unpublish
 * Unpublish a post
 */
router.post(
  "/:postId/unpublish",
  authenticateUser,
  requireAllScopes(["publish:now"]), // Can publish (implies unpublish)
  unpublishPost,
);

export default router;
```

---

### Example 3: Billing Route (with org check)

**File:** `server/routes/billing.ts`

```typescript
import { Router } from "express";
import { authenticateUser } from "../middleware/security";
import { requireScope } from "../middleware/requireScope";
import {
  getBillingStatus,
  updatePlan,
  extendGracePeriod,
} from "./handlers/billing";

const router = Router();

/**
 * GET /api/billing/status
 * Get billing status (all users can view their own)
 */
router.get(
  "/status",
  authenticateUser,
  getBillingStatus, // No scope required; checks ownership in handler
);

/**
 * POST /api/billing/plans/:planId/upgrade
 * Upgrade subscription plan
 */
router.post(
  "/plans/:planId/upgrade",
  authenticateUser,
  requireScope("billing:manage"), // AGENCY_ADMIN only
  updatePlan,
);

/**
 * POST /api/billing/grace-period/extend
 * Extend payment grace period (admin only)
 */
router.post(
  "/grace-period/extend",
  authenticateUser,
  requireScope("billing:manage"), // AGENCY_ADMIN only
  extendGracePeriod,
);

export default router;
```

---

## Middleware Stack Order

**Always follow this order:**

```
1. authenticateUser       # Verify JWT, attach req.user/req.auth
2. requireScope           # Enforce permission
3. Custom checks          # Brand ownership, org isolation, etc.
4. Handler                # Route logic
```

**Bad order (Don't do this):**

```typescript
// ❌ Wrong
router.post(
  "/content",
  requireScope("content:create"), // Middleware expects req.user!
  authenticateUser, // Too late
  createContent,
);
```

**Good order:**

```typescript
// ✅ Correct
router.post(
  "/content",
  authenticateUser, // Sets req.user/req.auth
  requireScope("content:create"), // Uses req.user
  createContent,
);
```

---

## Testing Routes with requireScope

```typescript
// server/__tests__/approvals.test.ts
import request from "supertest";
import { app } from "../index";

describe("Approvals Routes", () => {
  it("CREATOR cannot approve content (403)", async () => {
    const creatorToken = generateToken({ role: "CREATOR" });

    const res = await request(app)
      .post("/api/approvals/bulk")
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({
        postIds: ["post1", "post2"],
        action: "approve",
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain("Forbidden");
  });

  it("BRAND_MANAGER can approve content (200)", async () => {
    const managerToken = generateToken({ role: "BRAND_MANAGER" });

    const res = await request(app)
      .post("/api/approvals/bulk")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        postIds: ["post1", "post2"],
        action: "approve",
      });

    expect(res.status).toBe(200);
  });

  it("Missing auth header returns 401", async () => {
    const res = await request(app)
      .post("/api/approvals/bulk")
      .send({
        postIds: ["post1"],
        action: "approve",
      });

    expect(res.status).toBe(401);
  });
});
```

---

## Troubleshooting

### Issue: "Middleware expects req.user but it's undefined"

**Cause:** `authenticateUser` not in middleware stack

```typescript
// ❌ Wrong
router.post("/api/approvals", requireScope("content:approve"), handler);

// ✅ Correct
router.post(
  "/api/approvals",
  authenticateUser,
  requireScope("content:approve"),
  handler,
);
```

### Issue: "requireScope doesn't recognize role"

**Cause:** Role in `config/permissions.json` doesn't match JWT token role

```typescript
// Check config/permissions.json has the role
{
  "BRAND_MANAGER": ["content:create", ...],
  // ^ Make sure this role exists
}

// Check JWT token includes role with exact name
{
  role: 'BRAND_MANAGER'  // Must match config exactly
}
```

### Issue: "User denied scope but should be allowed"

**Cause:** Permission not listed in `config/permissions.json`

```typescript
// In config/permissions.json, add the missing scope
{
  "BRAND_MANAGER": [
    ...,
    "content:approve",  // ← Add here
    ...
  ]
}
```

---

## Migration Checklist

For each route that needs RBAC:

- [ ] Add `authenticateUser` middleware
- [ ] Add `requireScope()` middleware with correct scope
- [ ] Remove inline role checks from handler
- [ ] Update handler comment to document required scope
- [ ] Add tests (authorized + unauthorized cases)
- [ ] Test in dev environment
- [ ] Code review (check middleware order)
- [ ] Deploy and monitor logs

---

## Summary

| Aspect               | Before                | After                        |
| -------------------- | --------------------- | ---------------------------- |
| **Permission Logic** | In handler            | In middleware                |
| **Role Checks**      | Inline strings        | requireScope()               |
| **Consistency**      | Variable              | Guaranteed by middleware     |
| **Testability**      | Hard (mixed concerns) | Easy (separate layers)       |
| **Clarity**          | Implicit              | Explicit in route definition |
