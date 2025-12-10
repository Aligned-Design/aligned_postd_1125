/**
 * Test Authentication Helper
 * 
 * Provides centralized auth mocking for route tests.
 * 
 * Two approaches available:
 * 1. generateTestToken() - Generate real JWT tokens for integration tests
 * 2. setupAuthMocks() - Mock the auth middleware entirely for unit tests
 * 
 * Usage:
 * ```typescript
 * import { generateTestToken, mockTestUser, setupAuthMocks } from './helpers/auth';
 * 
 * // For integration tests - use real JWT tokens
 * const token = generateTestToken();
 * await request(app).get('/api/endpoint').set('Authorization', `Bearer ${token}`);
 * 
 * // For unit tests - mock the middleware
 * beforeEach(() => {
 *   setupAuthMocks();
 * });
 * ```
 */

import { vi, beforeEach, afterEach } from "vitest";
import { generateTokenPair } from "../../lib/jwt-auth";
import { Role } from "../../middleware/rbac";

// ============================================================================
// TEST USER DATA
// ============================================================================

export interface TestUser {
  userId: string;
  email: string;
  role: Role;
  brandIds: string[];
  tenantId: string;
}

/**
 * Default test user with admin privileges
 * Has access to all common routes
 */
export const mockTestUser: TestUser = {
  userId: "test-user-123",
  email: "test@example.com",
  role: Role.ADMIN,
  brandIds: ["brand-123", "550e8400-e29b-41d4-a716-446655440000"],
  tenantId: "tenant-123",
};

/**
 * Test user with superadmin privileges
 * Can access all routes and bypass permission checks
 */
export const mockSuperAdmin: TestUser = {
  userId: "superadmin-user-001",
  email: "superadmin@example.com",
  role: Role.SUPERADMIN,
  brandIds: ["*"], // Superadmin has access to all brands
  tenantId: "tenant-admin",
};

/**
 * Test user with owner privileges
 */
export const mockOwner: TestUser = {
  userId: "owner-user-001",
  email: "owner@example.com",
  role: Role.OWNER,
  brandIds: ["brand-123", "brand-456"],
  tenantId: "tenant-123",
};

/**
 * Test user with creator privileges (limited permissions)
 */
export const mockCreator: TestUser = {
  userId: "creator-user-001",
  email: "creator@example.com",
  role: Role.CREATOR,
  brandIds: ["brand-123"],
  tenantId: "tenant-123",
};

/**
 * Test user with brand manager privileges
 */
export const mockBrandManager: TestUser = {
  userId: "brand-manager-001",
  email: "manager@example.com",
  role: Role.BRAND_MANAGER,
  brandIds: ["brand-123"],
  tenantId: "tenant-123",
};

// ============================================================================
// JWT TOKEN GENERATION
// ============================================================================

/**
 * Generate a valid JWT access token for testing
 * 
 * @param user - Optional user data to use (defaults to mockTestUser)
 * @returns Valid JWT access token string
 * 
 * @example
 * const token = generateTestToken(); // Uses default admin user
 * const ownerToken = generateTestToken(mockOwner);
 */
export function generateTestToken(user: TestUser = mockTestUser): string {
  const tokenPair = generateTokenPair({
    userId: user.userId,
    email: user.email,
    role: user.role,
    brandIds: user.brandIds,
    tenantId: user.tenantId,
  });
  return tokenPair.accessToken;
}

/**
 * Generate Authorization header value for testing
 * 
 * @param user - Optional user data to use (defaults to mockTestUser)
 * @returns Authorization header value "Bearer <token>"
 */
export function getAuthHeader(user: TestUser = mockTestUser): string {
  return `Bearer ${generateTestToken(user)}`;
}

/**
 * Create a custom test user with specific properties
 * 
 * @param overrides - Properties to override from mockTestUser
 * @returns New TestUser object
 */
export function createTestUser(overrides: Partial<TestUser>): TestUser {
  return {
    ...mockTestUser,
    ...overrides,
  };
}

// ============================================================================
// MIDDLEWARE MOCKING (for unit tests)
// ============================================================================

/**
 * Setup auth middleware mocks for unit tests
 * 
 * This mocks the authenticateUser middleware to inject a test user
 * without requiring a real JWT token.
 * 
 * Call this in beforeEach() for unit test suites that need auth.
 * 
 * @param user - Optional user data to inject (defaults to mockTestUser)
 */
export function setupAuthMocks(user: TestUser = mockTestUser): void {
  // Mock the authenticateUser middleware
  vi.mock("../../middleware/authenticateUser", () => ({
    authenticateUser: vi.fn((req, _res, next) => {
      req.auth = {
        userId: user.userId,
        email: user.email,
        role: user.role,
        brandIds: user.brandIds,
        tenantId: user.tenantId,
      };
      req.user = {
        id: user.userId,
        email: user.email,
        role: user.role,
        brandId: user.brandIds[0],
        brandIds: user.brandIds,
        tenantId: user.tenantId,
      };
      next();
    }),
    authenticateUserLegacy: vi.fn((req, _res, next) => {
      req.auth = {
        userId: user.userId,
        email: user.email,
        role: user.role,
        brandIds: user.brandIds,
        tenantId: user.tenantId,
      };
      next();
    }),
  }));

  // Mock the jwtAuth middleware
  vi.mock("../../lib/jwt-auth", async (importOriginal) => {
    const original = await importOriginal<typeof import("../../lib/jwt-auth")>();
    return {
      ...original,
      jwtAuth: vi.fn((req, _res, next) => {
        req.auth = {
          userId: user.userId,
          email: user.email,
          role: user.role,
          brandIds: user.brandIds,
          tenantId: user.tenantId,
        };
        next();
      }),
    };
  });
}

/**
 * Reset all auth mocks
 * Call this in afterEach() to clean up
 */
export function resetAuthMocks(): void {
  vi.restoreAllMocks();
}

// ============================================================================
// TEST SETUP HELPERS
// ============================================================================

/**
 * Standard auth test setup
 * 
 * Use this to set up authenticated tests with automatic cleanup.
 * 
 * @param user - Optional user data to use
 * 
 * @example
 * describe('My Route Tests', () => {
 *   setupAuthenticatedTestUser();
 *   
 *   it('should work with auth', async () => {
 *     // Tests run with mockTestUser authenticated
 *   });
 * });
 */
export function setupAuthenticatedTestUser(user: TestUser = mockTestUser): void {
  beforeEach(() => {
    setupAuthMocks(user);
  });

  afterEach(() => {
    resetAuthMocks();
  });
}

// ============================================================================
// TEST BRAND IDS (common UUIDs for testing)
// ============================================================================

export const TEST_BRAND_ID = "550e8400-e29b-41d4-a716-446655440000";
export const TEST_BRAND_ID_2 = "550e8400-e29b-41d4-a716-446655440001";
export const TEST_USER_ID = "test-user-123";
export const TEST_TENANT_ID = "tenant-123";
export const TEST_CONTENT_ID = "content-123";

// ============================================================================
// REQUEST HELPER
// ============================================================================

/**
 * Helper to add auth headers to supertest request
 * 
 * @param requestObj - supertest request object
 * @param user - Optional user to authenticate as
 * @returns Request object with auth header set
 * 
 * @example
 * const response = await withAuth(request(app).get('/api/endpoint'));
 */
export function withAuth<T extends { set: (key: string, value: string) => T }>(
  requestObj: T,
  user: TestUser = mockTestUser
): T {
  return requestObj.set("Authorization", getAuthHeader(user));
}

