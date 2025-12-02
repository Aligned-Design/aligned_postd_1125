#!/usr/bin/env tsx
/**
 * Generate a test JWT token for API testing
 * 
 * Usage:
 *   pnpm tsx scripts/generate-test-token.ts
 * 
 * This will output a token that can be used in curl commands:
 *   curl -H "Authorization: Bearer <token>" ...
 */

import "dotenv/config";
import { generateTokenPair } from "../server/lib/jwt-auth";
import { Role } from "../server/middleware/rbac";

// Generate token with test credentials
const { accessToken } = generateTokenPair({
  userId: "test-user-crawl",
  email: "test@example.com",
  role: Role.ADMIN,
  brandIds: ["brand_test"],
  tenantId: "00000000-0000-0000-0000-000000000000",
});

console.log("Test JWT Token:");
console.log(accessToken);
console.log("\nUse this token in your curl command:");
console.log(`curl -X POST "http://localhost:8080/api/crawl/start?sync=true" \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -H "Authorization: Bearer ${accessToken}" \\`);
console.log(`  -d '{"url": "https://sdirawealth.com", "brandId": "brand_test", "workspaceId": "00000000-0000-0000-0000-000000000000"}'`);

