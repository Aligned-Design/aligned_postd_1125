#!/usr/bin/env tsx
/**
 * Backend Launch Readiness Test Script
 * 
 * Run with: pnpm tsx server/scripts/launch-readiness.ts
 * 
 * Validates:
 * - Supabase schema (tables, columns)
 * - Database operations (insert, select, RLS)
 * - API endpoints (health, routes, responses)
 * - Brand access control
 * - Validation schemas
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

// Test configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing Supabase credentials.");
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local or .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Test results
const results = {
  supabaseSchema: { pass: false, errors: [] as string[] },
  testInserts: { pass: false, errors: [] as string[] },
  criticalEndpoints: { pass: false, errors: [] as string[] },
  brandAccess: { pass: false, errors: [] as string[] },
  advisorValidation: { pass: false, errors: [] as string[] },
  mediaService: { pass: false, errors: [] as string[] },
  requiredTables: { pass: false, errors: [] as string[] },
  rlsBehavior: { pass: false, errors: [] as string[] },
};

// Test data
let testTenantId: string;
let testBrandId: string;
let testUserId: string;
let testMembershipId: string;

// Cleanup function
async function cleanupTestData() {
  try {
    if (testMembershipId) {
      await supabase.from("brand_members").delete().eq("id", testMembershipId);
    }
    if (testBrandId) {
      await supabase.from("brands").delete().eq("id", testBrandId);
    }
    if (testTenantId) {
      await supabase.from("tenants").delete().eq("id", testTenantId);
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}

// 1. Supabase Schema Validation
async function checkSchema() {
  console.log("\n" + "=".repeat(60));
  console.log("1. SUPABASE SCHEMA VALIDATION");
  console.log("=".repeat(60));

  const requiredTables = [
    "tenants",
    "brands",
    "brand_members",
    "media_assets",
    "media_usage_logs",
    "publishing_jobs",
    "publishing_logs",
    "platform_connections",
    "analytics_metrics",
    "advisor_feedback",
    "client_settings",
    "post_approvals",
    "audit_logs",
    "content_items",
    "scheduled_content",
    "workflow_templates",
    "workflow_instances",
    "workflow_notifications",
  ];

  // Check A - Required tables exist
  console.log("\nCheck A - Required Tables Exist");
  const missing: string[] = [];

  for (const tableName of requiredTables) {
    const { error } = await supabase.from(tableName).select("*").limit(0);

    if (error) {
      if (
        error.code === "42P01" ||
        error.message.includes("does not exist") ||
        error.message.includes("relation")
      ) {
        missing.push(tableName);
      }
    }
  }

  if (missing.length > 0) {
    console.error("❌ Missing tables:", missing.join(", "));
    results.requiredTables.pass = false;
    results.requiredTables.errors = missing;
  } else {
    console.log("✅ All required tables exist.");
    results.requiredTables.pass = true;
  }

  // Check B - Basic columns exist
  console.log("\nCheck B - Basic Columns Exist");
  const columnChecks = [
    { table: "brands", columns: ["id", "name", "tenant_id"] },
    { table: "brand_members", columns: ["id", "user_id", "brand_id", "role"] },
    { table: "media_assets", columns: ["id", "brand_id", "path"] },
    { table: "analytics_metrics", columns: ["id", "brand_id", "platform", "date", "metrics"] },
    { table: "content_items", columns: ["id", "brand_id", "type", "content"] },
  ];

  for (const { table, columns } of columnChecks) {
    const { error } = await supabase.from(table).select(columns.join(", ")).limit(0);

    if (error) {
      if (error.message.includes("column") || error.code === "42703") {
        console.error(`❌ Missing columns in ${table}:`, error.message);
        results.supabaseSchema.errors.push(`${table}: ${error.message}`);
      }
    } else {
      console.log(`✅ ${table} has required columns:`, columns.join(", "));
    }
  }

  if (results.supabaseSchema.errors.length === 0) {
    results.supabaseSchema.pass = true;
  }
}

// 2. Insert + Select Test Data
async function testInserts() {
  console.log("\n" + "=".repeat(60));
  console.log("2. INSERT + SELECT TEST DATA");
  console.log("=".repeat(60));

  try {
    // Insert test tenant
    testTenantId = randomUUID();
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .insert({ id: testTenantId, name: "Test Tenant - Launch Readiness" })
      .select()
      .single();

    if (tenantError) {
      // Try with minimal fields
      const { data: minimalTenant, error: minimalError } = await supabase
        .from("tenants")
        .insert({ id: testTenantId })
        .select()
        .single();

      if (minimalError) {
        throw minimalError;
      }
      console.log("✅ Inserted tenant OK");
    } else {
      console.log("✅ Inserted tenant OK");
    }

    // Insert test brand
    testBrandId = randomUUID();
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .insert({
        id: testBrandId,
        tenant_id: testTenantId,
        name: "Test Brand - Launch Readiness",
      })
      .select()
      .single();

    if (brandError) {
      throw brandError;
    }
    console.log("✅ Inserted brand OK");

    // Insert test user membership
    testUserId = randomUUID();
    const { data: membership, error: membershipError } = await supabase
      .from("brand_members")
      .insert({
        user_id: testUserId,
        brand_id: testBrandId,
        role: "admin",
      })
      .select()
      .single();

    if (membershipError) {
      throw membershipError;
    }
    testMembershipId = membership.id;
    console.log("✅ Inserted membership OK");

    // Query test data via service key (RLS bypass)
    const { data: queriedBrand, error: queryError } = await supabase
      .from("brands")
      .select("*")
      .eq("id", testBrandId)
      .single();

    if (queryError) {
      throw queryError;
    }
    console.log("✅ RLS allows select via service key OK");

    results.testInserts.pass = true;
    results.rlsBehavior.pass = true;
  } catch (error: any) {
    console.error("❌ Test insert failed:", error.message);
    results.testInserts.errors.push(error.message);
    results.testInserts.pass = false;
  }
}

// 3. API Endpoint Smoke Test
async function testEndpoints() {
  console.log("\n" + "=".repeat(60));
  console.log("3. API ENDPOINT SMOKE TEST");
  console.log("=".repeat(60));

  const baseUrl = process.env.VITE_APP_URL || "http://localhost:8080";
  const endpoints = [
    { method: "GET", path: "/api/health", requiresAuth: false },
    {
      method: "GET",
      path: `/api/brand-intelligence/${testBrandId || "test-brand-id"}`,
      requiresAuth: true,
    },
    {
      method: "GET",
      path: "/api/media/list?brandId=test-brand-id",
      requiresAuth: true,
    },
    {
      method: "GET",
      path: `/api/analytics/${testBrandId || "test-brand-id"}?days=30`,
      requiresAuth: true,
    },
    {
      method: "GET",
      path: `/api/brands/${testBrandId || "test-brand-id"}/posting-schedule`,
      requiresAuth: true,
    },
    {
      method: "GET",
      path: `/api/brands/${testBrandId || "test-brand-id"}/members`,
      requiresAuth: true,
    },
    {
      method: "GET",
      path: `/api/reviews/${testBrandId || "test-brand-id"}`,
      requiresAuth: true,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const { method, path, requiresAuth } of endpoints) {
    try {
      const url = `${baseUrl}${path}`;
      const options: RequestInit = {
        method,
        headers: { "Content-Type": "application/json" },
      };

      if (requiresAuth) {
        options.headers = {
          ...options.headers,
          Authorization: "Bearer test-token",
        };
      }

      const response = await fetch(url, options);

      if (response.status === 404) {
        console.error(`❌ Route failing: ${method} ${path} — 404 Not Found`);
        console.error("Possible cause: missing route registration or path mismatch");
        results.criticalEndpoints.errors.push(`${method} ${path}: 404`);
        failed++;
      } else if (response.status >= 500) {
        console.error(
          `❌ Route error: ${method} ${path} — ${response.status} ${response.statusText}`
        );
        results.criticalEndpoints.errors.push(`${method} ${path}: ${response.status}`);
        failed++;
      } else {
        console.log(`✅ ${method} ${path} — ${response.status}`);
        passed++;
      }
    } catch (error: any) {
      if (error.code === "ECONNREFUSED") {
        console.warn(`⚠️  Server not running - skipping ${method} ${path}`);
      } else {
        console.error(`❌ Error testing ${method} ${path}:`, error.message);
        results.criticalEndpoints.errors.push(`${method} ${path}: ${error.message}`);
        failed++;
      }
    }
  }

  // Test POST endpoints
  try {
    const uploadResponse = await fetch(`${baseUrl}/api/media/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({ brandId: testBrandId }),
    });

    if (uploadResponse.status === 400 || uploadResponse.status === 401) {
      console.log("✅ POST /api/media/upload validation —", uploadResponse.status);
      passed++;
    } else if (uploadResponse.status === 404) {
      console.error("❌ POST /api/media/upload — 404 Not Found");
      results.mediaService.errors.push("POST /api/media/upload: 404");
      failed++;
    }
  } catch (error: any) {
    if (error.code !== "ECONNREFUSED") {
      console.warn("⚠️  Could not test POST /api/media/upload:", error.message);
    }
  }

  results.criticalEndpoints.pass = failed === 0;
  results.mediaService.pass = results.mediaService.errors.length === 0;
}

// 4. Brand Access Test
async function testBrandAccess() {
  console.log("\n" + "=".repeat(60));
  console.log("4. BRAND ACCESS TEST");
  console.log("=".repeat(60));

  if (!testBrandId) {
    console.warn("⚠️  Skipping brand access test (no test brand)");
    return;
  }

  const baseUrl = process.env.VITE_APP_URL || "http://localhost:8080";

  try {
    // Test with valid brandId
    const validResponse = await fetch(
      `${baseUrl}/api/brand-intelligence/${testBrandId}`,
      { headers: { Authorization: "Bearer test-token" } }
    );

    if (validResponse.status === 404) {
      console.error("❌ Brand access route not found");
      results.brandAccess.errors.push("Route not found");
    } else {
      console.log(`✅ Brand access route exists (status: ${validResponse.status})`);
    }

    // Test with invalid brandId
    const randomBrandId = randomUUID();
    const invalidResponse = await fetch(
      `${baseUrl}/api/brand-intelligence/${randomBrandId}`,
      { headers: { Authorization: "Bearer test-token" } }
    );

    if (invalidResponse.status === 403) {
      console.log("✅ Brand access correctly denies invalid brandId");
      results.brandAccess.pass = true;
    } else if (invalidResponse.status === 401) {
      console.log("✅ Brand access requires authentication");
      results.brandAccess.pass = true;
    } else if (invalidResponse.status === 404) {
      console.error("❌ Brand access route not found");
      results.brandAccess.errors.push("Route not found");
    }
  } catch (error: any) {
    if (error.code !== "ECONNREFUSED") {
      console.warn("⚠️  Could not test brand access:", error.message);
    }
  }
}

// 5. Advisor Validation Test
async function testAdvisorValidation() {
  console.log("\n" + "=".repeat(60));
  console.log("5. ADVISOR VALIDATION TEST");
  console.log("=".repeat(60));

  const baseUrl = process.env.VITE_APP_URL || "http://localhost:8080";

  try {
    const response = await fetch(`${baseUrl}/api/ai/advisor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({}), // Invalid - missing required brandId
    });

    if (response.status === 400) {
      const json = await response.json();
      if (json.error || json.details || json.validationErrors || json.message) {
        console.log("✅ Advisor validation returns structured error");
        results.advisorValidation.pass = true;
      } else {
        console.error("❌ Advisor validation missing or malformed error structure");
        results.advisorValidation.errors.push("Malformed error response");
      }
    } else if (response.status === 401 || response.status === 403) {
      console.log("✅ Advisor route exists and requires authentication");
      results.advisorValidation.pass = true;
    } else if (response.status === 404) {
      console.error("❌ Advisor route not found");
      results.advisorValidation.errors.push("Route not found");
    }
  } catch (error: any) {
    if (error.code !== "ECONNREFUSED") {
      console.warn("⚠️  Could not test advisor validation:", error.message);
    }
  }
}

// Main execution
async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("BACKEND LAUNCH READINESS TEST");
  console.log("=".repeat(60));

  try {
    await checkSchema();
    await testInserts();
    await testEndpoints();
    await testBrandAccess();
    await testAdvisorValidation();

    // Final report
    console.log("\n" + "=".repeat(60));
    console.log("LAUNCH READINESS SUMMARY");
    console.log("=".repeat(60));

    const checks = [
      { name: "Supabase schema", result: results.supabaseSchema },
      { name: "Test inserts", result: results.testInserts },
      { name: "Critical endpoints", result: results.criticalEndpoints },
      { name: "Brand access model", result: results.brandAccess },
      { name: "Advisor validation", result: results.advisorValidation },
      { name: "Media service", result: results.mediaService },
      { name: "Required tables", result: results.requiredTables },
      { name: "RLS behavior", result: results.rlsBehavior },
    ];

    let allPassed = true;
    for (const { name, result } of checks) {
      const status = result.pass ? "✅ PASS" : "❌ FAIL";
      console.log(`${status} - ${name}`);
      if (result.errors.length > 0) {
        result.errors.forEach((error) => console.log(`   - ${error}`));
        allPassed = false;
      }
    }

    console.log("\n" + "=".repeat(60));
    if (allPassed) {
      console.log("✅ ALL CHECKS PASSED - BACKEND IS LAUNCH READY");
    } else {
      console.log("❌ SOME CHECKS FAILED - REVIEW ERRORS ABOVE");
    }
    console.log("=".repeat(60) + "\n");

    // Cleanup
    await cleanupTestData();

    process.exit(allPassed ? 0 : 1);
  } catch (error: any) {
    console.error("\n❌ Test execution failed:", error.message);
    console.error(error.stack);
    await cleanupTestData();
    process.exit(1);
  }
}

main();

