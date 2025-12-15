#!/usr/bin/env node
/**
 * Production Endpoint Smoke Test
 * 
 * Verifies critical endpoints are reachable (not 404) on deployed environment.
 * This script tests the endpoints that were previously failing in production.
 * 
 * Usage:
 *   node scripts/smoke-prod-endpoints.mjs <base-url>
 * 
 * Example:
 *   node scripts/smoke-prod-endpoints.mjs https://your-app.vercel.app
 *   node scripts/smoke-prod-endpoints.mjs http://localhost:3000
 * 
 * Exit codes:
 *   0 - All endpoints reachable (no 404s)
 *   1 - One or more endpoints returned 404 or failed
 */

const ENDPOINTS = [
  {
    method: "POST",
    path: "/api/analytics/log",
    description: "Frontend logging endpoint",
    acceptableStatuses: [200, 202, 400, 401, 403], // Anything but 404
    testPayload: {
      type: "telemetry",
      timestamp: new Date().toISOString(),
      event: "smoke_test",
    },
  },
  {
    method: "POST",
    path: "/api/auth/signup",
    description: "User registration endpoint",
    acceptableStatuses: [200, 201, 400, 401, 422], // Anything but 404
    testPayload: {
      email: "smoke-test@example.com",
      password: "test",
    },
  },
  {
    method: "POST",
    path: "/api/crawl/start",
    description: "Brand crawler trigger",
    acceptableStatuses: [200, 201, 400, 401, 403], // Auth required, but not 404
    testPayload: {
      brandId: "test",
      url: "https://example.com",
    },
  },
  {
    method: "GET",
    path: "/health",
    description: "Health check endpoint",
    acceptableStatuses: [200],
  },
];

async function testEndpoint(baseUrl, endpoint) {
  const url = `${baseUrl}${endpoint.path}`;
  const options = {
    method: endpoint.method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (endpoint.method !== "GET" && endpoint.testPayload) {
    options.body = JSON.stringify(endpoint.testPayload);
  }

  try {
    const response = await fetch(url, options);
    const status = response.status;

    const is404 = status === 404;
    const isAcceptable = endpoint.acceptableStatuses.includes(status);
    const passed = !is404 && (isAcceptable || status < 500);

    return {
      endpoint: endpoint.path,
      method: endpoint.method,
      status,
      is404,
      passed,
      message: is404
        ? "❌ FAIL: Endpoint not found (404)"
        : passed
          ? `✅ PASS: ${status} (endpoint exists)`
          : `⚠️  WARN: ${status} (unexpected but not 404)`,
    };
  } catch (error) {
    return {
      endpoint: endpoint.path,
      method: endpoint.method,
      status: null,
      is404: false,
      passed: false,
      message: `❌ FAIL: ${error.message}`,
    };
  }
}

async function main() {
  const baseUrl = process.argv[2];

  if (!baseUrl) {
    console.error("Usage: node smoke-prod-endpoints.mjs <base-url>");
    console.error("");
    console.error("Example:");
    console.error("  node smoke-prod-endpoints.mjs https://your-app.vercel.app");
    console.error("  node smoke-prod-endpoints.mjs http://localhost:3000");
    process.exit(1);
  }

  console.log("");
  console.log("═".repeat(70));
  console.log("  PRODUCTION ENDPOINT SMOKE TEST");
  console.log("═".repeat(70));
  console.log("");
  console.log(`Testing endpoints at: ${baseUrl}`);
  console.log("");

  const results = [];

  for (const endpoint of ENDPOINTS) {
    console.log(`Testing: ${endpoint.method.padEnd(6)} ${endpoint.path}`);
    console.log(`         ${endpoint.description}`);

    const result = await testEndpoint(baseUrl, endpoint);
    results.push(result);

    console.log(`         ${result.message}`);
    console.log("");
  }

  console.log("─".repeat(70));
  console.log("  SUMMARY");
  console.log("─".repeat(70));
  console.log("");

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const found404s = results.filter((r) => r.is404).length;

  console.log(`Total endpoints tested: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`404s found: ${found404s}`);
  console.log("");

  if (failed > 0) {
    console.log("❌ SMOKE TEST FAILED");
    console.log("");
    console.log("Failed endpoints:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(
          `  ${r.method} ${r.endpoint} - Status: ${r.status || "ERROR"}`,
        );
      });
    console.log("");
    process.exit(1);
  }

  console.log("✅ SMOKE TEST PASSED");
  console.log("   All critical endpoints are reachable (no 404s)");
  console.log("");
  process.exit(0);
}

main();

