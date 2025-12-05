#!/usr/bin/env tsx
/**
 * API V2 Smoke Test
 *
 * Quick sanity check for critical v2 endpoints:
 * - Analytics v2
 * - Approvals v2
 * - Media v2
 * - Reviews
 * - Webhooks
 *
 * Usage:
 *   API_BASE_URL=http://localhost:8080 API_TOKEN=xxx TEST_BRAND_ID=xxx pnpm tsx scripts/api-v2-smoke.ts
 */

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8080";
const API_TOKEN = process.env.API_TOKEN || "";
const TEST_BRAND_ID = process.env.TEST_BRAND_ID || "550e8400-e29b-41d4-a716-446655440000";

interface TestResult {
  status: "OK" | "WARN" | "FAIL";
  method: string;
  path: string;
  statusCode: number;
  message: string;
}

const results: TestResult[] = [];

/**
 * Helper to call an endpoint and log the result
 */
async function call(
  method: string,
  path: string,
  options: {
    body?: unknown;
    headers?: Record<string, string>;
    expectedStatus?: number | number[];
  } = {},
): Promise<void> {
  const { body, headers = {}, expectedStatus } = options;

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      ...(body && { body: JSON.stringify(body) }),
    });

    const statusCode = response.status;
    const isExpected =
      expectedStatus === undefined
        ? statusCode >= 200 && statusCode < 300
        : Array.isArray(expectedStatus)
          ? expectedStatus.includes(statusCode)
          : statusCode === expectedStatus;

    let status: "OK" | "WARN" | "FAIL";
    let message: string;

    if (isExpected) {
      status = statusCode >= 200 && statusCode < 300 ? "OK" : "WARN";
      message = `${statusCode}${expectedStatus ? " (expected)" : ""}`;
    } else {
      status = "FAIL";
      message = `${statusCode} (unexpected)`;
    }

    const result: TestResult = {
      status,
      method,
      path,
      statusCode,
      message,
    };

    results.push(result);

    const icon = status === "OK" ? "✅" : status === "WARN" ? "⚠️" : "❌";
    console.log(
      `[${status}] ${method} ${path} → ${message} ${icon}`,
    );
  } catch (error) {
    const result: TestResult = {
      status: "FAIL",
      method,
      path,
      statusCode: 0,
      message: error instanceof Error ? error.message : String(error),
    };

    results.push(result);
    console.log(`[FAIL] ${method} ${path} → Error: ${result.message} ❌`);
  }
}

/**
 * Run all smoke tests
 */
async function runSmokeTests() {
  console.log("🧪 API V2 Smoke Test\n");
  console.log(`Base URL: ${API_BASE_URL}`);
  console.log(`Brand ID: ${TEST_BRAND_ID}`);
  console.log(`Token: ${API_TOKEN ? "✅ Provided" : "❌ Missing"}\n`);
  console.log("=".repeat(60) + "\n");

  // Authenticated endpoints
  console.log("📊 Testing Analytics v2 endpoints...");
  await call("GET", "/api/analytics/overview", {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  await call("GET", "/api/analytics/engagement-trend", {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });

  console.log("\n📁 Testing Media v2 endpoints...");
  await call("GET", "/api/media?limit=1", {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  await call("GET", `/api/media/storage-usage?brandId=${TEST_BRAND_ID}`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });

  console.log("\n✅ Testing Approvals v2 endpoints...");
  await call("GET", "/api/approvals/pending", {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });

  console.log("\n💬 Testing Reviews endpoint...");
  await call("GET", `/api/reviews/${TEST_BRAND_ID}`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });

  // Webhook endpoints (no auth, but with x-brand-id)
  console.log("\n🔗 Testing Webhook endpoints...");
  await call("POST", "/api/webhooks/zapier", {
    body: { action: "test_smoke", data: {} },
    headers: { "x-brand-id": TEST_BRAND_ID },
    expectedStatus: [200, 400, 422], // May fail validation but route should exist
  });
  await call("GET", "/api/webhooks/status/non-existent-id", {
    headers: { "x-brand-id": TEST_BRAND_ID },
    expectedStatus: [404, 400], // Expected for fake ID
  });

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 SUMMARY");
  console.log("=".repeat(60));

  const total = results.length;
  const ok = results.filter((r) => r.status === "OK").length;
  const warn = results.filter((r) => r.status === "WARN").length;
  const fail = results.filter((r) => r.status === "FAIL").length;

  console.log(`\nTotal endpoints tested: ${total}`);
  console.log(`✅ OK:   ${ok}`);
  console.log(`⚠️  WARN: ${warn}`);
  console.log(`❌ FAIL: ${fail}`);

  if (fail > 0) {
    console.log("\n❌ Failed endpoints:");
    results
      .filter((r) => r.status === "FAIL")
      .forEach((r) => {
        console.log(`   ${r.method} ${r.path} → ${r.message}`);
      });
  }

  console.log("\n" + "=".repeat(60) + "\n");

  // Exit with appropriate code
  process.exit(fail > 0 ? 1 : 0);
}

// Run tests
runSmokeTests().catch((error) => {
  console.error("❌ Smoke test failed:", error);
  process.exit(1);
});

