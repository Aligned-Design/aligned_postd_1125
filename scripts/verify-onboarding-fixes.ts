#!/usr/bin/env tsx
/**
 * Verification script for first-run onboarding/crawler fixes
 * 
 * Tests:
 * 1. Analytics log endpoint (POST /api/analytics/log)
 * 2. Auth signup endpoint (POST /api/auth/signup)
 * 3. Onboarding run-all endpoint (POST /api/orchestration/onboarding/run-all)
 * 4. Permission configuration (ai:generate for OWNER role)
 */

import permissionsMap from "../config/permissions.json";

console.log("🔍 Verifying First-Run Onboarding Fixes...\n");

// ============================================================================
// Test 1: Verify permissions.json has ai:generate for critical roles
// ============================================================================
console.log("✅ Test 1: Checking ai:generate permission...");
const rolesToCheck = ["OWNER", "ADMIN", "AGENCY_ADMIN", "BRAND_MANAGER"];
let permissionCheckPassed = true;

for (const role of rolesToCheck) {
  const permissions = permissionsMap[role as keyof typeof permissionsMap] || [];
  const hasAiGenerate = permissions.includes("ai:generate");
  
  if (hasAiGenerate) {
    console.log(`  ✓ ${role} has ai:generate permission`);
  } else {
    console.log(`  ✗ ${role} MISSING ai:generate permission`);
    permissionCheckPassed = false;
  }
}

if (permissionCheckPassed) {
  console.log("✅ Permission check PASSED\n");
} else {
  console.log("❌ Permission check FAILED\n");
  process.exit(1);
}

// ============================================================================
// Test 2: Verify analytics router has /log endpoint
// ============================================================================
console.log("✅ Test 2: Checking analytics router for /log endpoint...");
const analyticsRouterPath = "./server/routes/analytics.ts";
try {
  const fs = await import("fs");
  const analyticsContent = fs.readFileSync(analyticsRouterPath, "utf-8");
  
  const hasLogHandler = /const logEvent:.*RequestHandler/s.test(analyticsContent);
  const hasLogRoute = /analyticsRouter\.post\(["']\/log["']/s.test(analyticsContent);
  
  if (hasLogHandler && hasLogRoute) {
    console.log("  ✓ Analytics router has logEvent handler");
    console.log("  ✓ Analytics router registers POST /log route");
    console.log("✅ Analytics router check PASSED\n");
  } else {
    console.log(`  ✗ Missing logEvent handler: ${hasLogHandler}`);
    console.log(`  ✗ Missing POST /log route: ${hasLogRoute}`);
    console.log("❌ Analytics router check FAILED\n");
    process.exit(1);
  }
} catch (error) {
  console.error("❌ Failed to read analytics router:", error);
  process.exit(1);
}

// ============================================================================
// Test 3: Verify auth router exports and has /signup
// ============================================================================
console.log("✅ Test 3: Checking auth router for /signup endpoint...");
const authRouterPath = "./server/routes/auth.ts";
try {
  const fs = await import("fs");
  const authContent = fs.readFileSync(authRouterPath, "utf-8");
  
  const hasSignupRoute = /router\.post\(["']\/signup["']/s.test(authContent);
  const hasDefaultExport = /export default router/s.test(authContent);
  
  if (hasSignupRoute && hasDefaultExport) {
    console.log("  ✓ Auth router has POST /signup route");
    console.log("  ✓ Auth router has default export");
    console.log("✅ Auth router check PASSED\n");
  } else {
    console.log(`  ✗ Missing POST /signup route: ${hasSignupRoute}`);
    console.log(`  ✗ Missing default export: ${hasDefaultExport}`);
    console.log("❌ Auth router check FAILED\n");
    process.exit(1);
  }
} catch (error) {
  console.error("❌ Failed to read auth router:", error);
  process.exit(1);
}

// ============================================================================
// Test 4: Verify server mounts all routers
// ============================================================================
console.log("✅ Test 4: Checking server router mounts...");
const serverPath = "./server/index-v2.ts";
try {
  const fs = await import("fs");
  const serverContent = fs.readFileSync(serverPath, "utf-8");
  
  const hasAuthMount = /app\.use\(["']\/api\/auth["'],\s*authRouter\)/s.test(serverContent);
  const hasAnalyticsMount = /app\.use\(["']\/api\/analytics["'],\s*analyticsRouter\)/s.test(serverContent);
  const hasOrchestrationMount = /app\.use\(["']\/api\/orchestration["'].*orchestrationRouter\)/s.test(serverContent);
  
  if (hasAuthMount && hasAnalyticsMount && hasOrchestrationMount) {
    console.log("  ✓ Server mounts /api/auth router");
    console.log("  ✓ Server mounts /api/analytics router");
    console.log("  ✓ Server mounts /api/orchestration router");
    console.log("✅ Server mount check PASSED\n");
  } else {
    console.log(`  ✗ Missing /api/auth mount: ${hasAuthMount}`);
    console.log(`  ✗ Missing /api/analytics mount: ${hasAnalyticsMount}`);
    console.log(`  ✗ Missing /api/orchestration mount: ${hasOrchestrationMount}`);
    console.log("❌ Server mount check FAILED\n");
    process.exit(1);
  }
} catch (error) {
  console.error("❌ Failed to read server file:", error);
  process.exit(1);
}

// ============================================================================
// Summary
// ============================================================================
console.log("═".repeat(70));
console.log("🎉 All static checks PASSED!");
console.log("═".repeat(70));
console.log("\n📋 Next Steps:");
console.log("1. Start the dev server: pnpm dev");
console.log("2. Test endpoints with curl:");
console.log("   curl -X POST http://localhost:3000/api/analytics/log \\");
console.log("     -H 'Content-Type: application/json' \\");
console.log("     -d '{\"type\":\"telemetry\",\"timestamp\":\"2025-12-15T00:00:00Z\",\"event\":\"test\"}'");
console.log("\n   curl -X POST http://localhost:3000/api/auth/signup \\");
console.log("     -H 'Content-Type: application/json' \\");
console.log("     -d '{\"email\":\"test@example.com\",\"password\":\"password123\"}'");
console.log("\n3. Test onboarding flow in UI with OWNER role user");
console.log("4. Verify crawler persists assets to media_assets table");
console.log("\n✅ Code fixes are ready for runtime testing!");

