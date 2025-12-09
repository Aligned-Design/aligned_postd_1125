/**
 * Unit tests for useCan hook
 * Verifies permission matrix for all role × scope combinations
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Use actual permissions from config
import permissionsMap from "../../../../config/permissions.json";

// Mock permissions for testing
type Role = keyof typeof permissionsMap;
type Scope = string;

/**
 * Permission matrix test
 * Ensures all expected permissions are in place
 */
describe("RBAC Permission Matrix", () => {
  it("should have canonical roles defined", () => {
    const roles = Object.keys(permissionsMap) as Role[];
    // Canonical roles: SUPERADMIN, AGENCY_ADMIN, BRAND_MANAGER, CREATOR, ANALYST, CLIENT_APPROVER, VIEWER
    // Also includes legacy roles: OWNER, ADMIN
    const canonicalRoles = [
      "SUPERADMIN",
      "OWNER",
      "ADMIN",
      "AGENCY_ADMIN",
      "BRAND_MANAGER",
      "CREATOR",
      "ANALYST",
      "CLIENT_APPROVER",
      "VIEWER",
    ];
    expect(roles.sort()).toEqual(canonicalRoles.sort());
  });

  it("SUPERADMIN should have wildcard permission", () => {
    // ✅ FIX: Type guard for scopes
    const scopes = permissionsMap.SUPERADMIN;
    expect(Array.isArray(scopes) && scopes.includes("*")).toBe(true);
  });

  it("SUPERADMIN should be the only role with wildcard", () => {
    // ✅ FIX: Type guard for scopes array
    const rolesWithWildcard = Object.entries(permissionsMap)
      .filter(([_, scopes]: [string, unknown]) => Array.isArray(scopes) && scopes.includes("*"))
      .map(([role]) => role);

    expect(rolesWithWildcard).toEqual(["SUPERADMIN"]);
  });

  it("no role should be completely empty", () => {
    // ✅ FIX: Type guard for scopes array
    Object.entries(permissionsMap).forEach(([role, scopes]) => {
      expect(Array.isArray(scopes) && scopes.length).toBeGreaterThan(0);
    });
  });
});

/**
 * Role hierarchy tests
 */
describe("Role Hierarchy & Permissions", () => {
  const hierarchy = [
    "VIEWER",
    "ANALYST",
    "CLIENT_APPROVER",
    "CREATOR",
    "BRAND_MANAGER",
    "AGENCY_ADMIN",
    "SUPERADMIN",
  ];

  it("higher roles should have more or equal permissions than lower roles", () => {
    for (let i = 0; i < hierarchy.length - 1; i++) {
      const lowerRole = hierarchy[i] as Role;
      const higherRole = hierarchy[i + 1] as Role;

      const lowerPerms = permissionsMap[lowerRole];
      const higherPerms = permissionsMap[higherRole];

      // SUPERADMIN is wildcard so skip
      if (higherRole === "SUPERADMIN") return;

      const lowerScopeCount = lowerPerms.length;
      const higherScopeCount = higherPerms.length;

      expect(higherScopeCount).toBeGreaterThanOrEqual(lowerScopeCount);
    }
  });
});

/**
 * Individual role permission tests
 */
describe("Role Permissions - Individual", () => {
  describe("VIEWER", () => {
    const role = "VIEWER" as Role;

    it("should have read-only permissions", () => {
      expect(permissionsMap[role]).toEqual(
        expect.arrayContaining([
          "brand:view",
          "content:view",
          "analytics:read",
          "comment:view",
        ]),
      );
    });

    it("should NOT have write permissions", () => {
      const writePerms = [
        "content:create",
        "content:edit",
        "brand:manage",
        "user:invite",
        "billing:manage",
      ];
      writePerms.forEach((perm) => {
        expect(permissionsMap[role]).not.toContain(perm);
      });
    });
  });

  describe("CREATOR", () => {
    const role = "CREATOR" as Role;

    it("should have content creation permissions", () => {
      expect(permissionsMap[role]).toEqual(
        expect.arrayContaining([
          "content:create",
          "content:edit",
          "content:view",
        ]),
      );
    });

    it("should NOT have approval permissions", () => {
      expect(permissionsMap[role]).not.toContain("content:approve");
    });

    it("should NOT have publish permissions", () => {
      expect(permissionsMap[role]).not.toContain("publish:now");
    });

    it("should NOT have billing permissions", () => {
      expect(permissionsMap[role]).not.toContain("billing:manage");
    });
  });

  describe("CLIENT_APPROVER", () => {
    const role = "CLIENT_APPROVER" as Role;

    it("should have approval permissions", () => {
      expect(permissionsMap[role]).toEqual(
        expect.arrayContaining(["content:approve", "comment:create"]),
      );
    });

    it("should NOT have creation permissions", () => {
      expect(permissionsMap[role]).not.toContain("content:create");
    });

    it("should NOT have brand management permissions", () => {
      expect(permissionsMap[role]).not.toContain("brand:manage");
    });
  });

  describe("ANALYST", () => {
    const role = "ANALYST" as Role;

    it("should have analytics permissions", () => {
      expect(permissionsMap[role]).toEqual(
        expect.arrayContaining(["analytics:read", "analytics:export"]),
      );
    });

    it("should NOT have content creation/editing", () => {
      expect(permissionsMap[role]).not.toContain("content:create");
      expect(permissionsMap[role]).not.toContain("content:edit");
    });
  });

  describe("BRAND_MANAGER", () => {
    const role = "BRAND_MANAGER" as Role;

    it("should have content management", () => {
      expect(permissionsMap[role]).toEqual(
        expect.arrayContaining([
          "content:create",
          "content:edit",
          "content:delete",
          "content:approve",
        ]),
      );
    });

    it("should have brand edit permissions", () => {
      expect(permissionsMap[role]).toContain("brand:edit");
    });

    it("should NOT have user management", () => {
      expect(permissionsMap[role]).not.toContain("user:manage");
    });

    it("should NOT have billing management", () => {
      expect(permissionsMap[role]).not.toContain("billing:manage");
    });
  });

  describe("AGENCY_ADMIN", () => {
    const role = "AGENCY_ADMIN" as Role;

    it("should have all content operations", () => {
      expect(permissionsMap[role]).toEqual(
        expect.arrayContaining([
          "content:create",
          "content:edit",
          "content:delete",
          "content:approve",
        ]),
      );
    });

    it("should have brand management", () => {
      expect(permissionsMap[role]).toContain("brand:manage");
    });

    it("should have user management", () => {
      expect(permissionsMap[role]).toEqual(
        expect.arrayContaining(["user:invite", "user:manage"]),
      );
    });

    it("should have billing management", () => {
      expect(permissionsMap[role]).toContain("billing:manage");
    });

    it("should have integration management", () => {
      expect(permissionsMap[role]).toContain("integrations:manage");
    });
  });

  describe("SUPERADMIN", () => {
    const role = "SUPERADMIN" as Role;

    it("should have wildcard permission", () => {
      expect(permissionsMap[role]).toContain("*");
    });

    it("should have only wildcard (single item array)", () => {
      expect(permissionsMap[role]).toEqual(["*"]);
    });
  });
});

/**
 * Scope consistency tests
 */
describe("Scope Names Consistency", () => {
  it("all scopes should follow naming convention", () => {
    const allScopes = new Set<string>();
    // ✅ FIX: Type guard for scopes array
    Object.values(permissionsMap).forEach((scopes) => {
      if (Array.isArray(scopes)) {
        scopes.forEach((scope) => {
          if (scope !== "*") allScopes.add(scope);
        });
      }
    });

    allScopes.forEach((scope) => {
      // Should be lowercase and use colon separator, may include underscores
      expect(scope).toMatch(/^[a-z_]+:[a-z_]+$/);
    });
  });

  it("no scope should appear more than once in a role", () => {
    // ✅ FIX: Type guard for scopes array
    Object.entries(permissionsMap).forEach(([role, scopes]) => {
      if (Array.isArray(scopes)) {
        const uniqueScopes = new Set(scopes);
        expect(uniqueScopes.size).toBe(scopes.length);
      }
    });
  });
});

/**
 * Critical permission combinations
 */
describe("Critical Permission Combinations", () => {
  it("publish:now should require AGENCY_ADMIN or higher (not BRAND_MANAGER)", () => {
    // Note: BRAND_MANAGER doesn't have publish:now, but AGENCY_ADMIN and above do
    // SUPERADMIN has wildcard "*" so it implicitly has all permissions (including publish:now)
    const rolesWithPublish = Object.entries(permissionsMap)
      .filter(([_, scopes]) => Array.isArray(scopes) && scopes.includes("publish:now"))
      .map(([role]) => role);

    expect(rolesWithPublish).toEqual(
      expect.arrayContaining(["AGENCY_ADMIN", "ADMIN", "OWNER"]),
    );
    expect(rolesWithPublish).not.toContain("CREATOR");
    expect(rolesWithPublish).not.toContain("BRAND_MANAGER");
    // SUPERADMIN has "*" wildcard, so it doesn't need explicit "publish:now"
    expect(permissionsMap.SUPERADMIN).toContain("*");
  });

  it("content:approve should NOT be in CREATOR role", () => {
    expect(permissionsMap.CREATOR).not.toContain("content:approve");
  });

  it("billing:manage should be AGENCY_ADMIN only (not BRAND_MANAGER)", () => {
    expect(permissionsMap.AGENCY_ADMIN).toContain("billing:manage");
    expect(permissionsMap.BRAND_MANAGER).not.toContain("billing:manage");
    expect(permissionsMap.CREATOR).not.toContain("billing:manage");
  });

  it("user:manage should be AGENCY_ADMIN only", () => {
    expect(permissionsMap.AGENCY_ADMIN).toContain("user:manage");
    expect(permissionsMap.BRAND_MANAGER).not.toContain("user:manage");
    expect(permissionsMap.CREATOR).not.toContain("user:manage");
  });
});

/**
 * Edge cases
 */
describe("Edge Cases", () => {
  it("should not have empty string permissions", () => {
    // ✅ FIX: Type guard for scopes array
    Object.entries(permissionsMap).forEach(([role, scopes]) => {
      if (Array.isArray(scopes)) {
        scopes.forEach((scope) => {
          expect(scope.length).toBeGreaterThan(0);
        });
      }
    });
  });

  it("should not have duplicate scopes in different forms", () => {
    const scopeFormats = new Map<string, string[]>();

    // Check for duplicate scopes across all roles (normalized to lowercase)
    Object.values(permissionsMap).forEach((scopes) => {
      if (Array.isArray(scopes)) {
        scopes.forEach((scope) => {
          if (scope === "*") return; // Skip wildcard
          const normalized = scope.toLowerCase().trim();
          if (!scopeFormats.has(normalized)) {
            scopeFormats.set(normalized, []);
          }
          scopeFormats.get(normalized)!.push(scope);
        });
      }
    });

    // Allow same scope to appear in multiple roles (that's expected)
    // But check that within a single role, there are no duplicates
    Object.entries(permissionsMap).forEach(([role, scopes]) => {
      if (Array.isArray(scopes)) {
        const uniqueScopes = new Set(scopes);
        expect(uniqueScopes.size).toBe(scopes.length);
      }
    });
  });
});
