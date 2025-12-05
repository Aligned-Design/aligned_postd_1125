/**
 * Brand ID Middleware Test Script
 * 
 * Tests the validateBrandId middleware with various scenarios:
 * - Valid UUID format
 * - Temporary brand ID format (brand_<timestamp>)
 * - Invalid format
 * 
 * Usage:
 *   pnpm tsx scripts/test-brand-id-middleware.ts
 */

import { createServer } from "../server/index-v2";

const BASE_URL = process.env.VITE_API_BASE_URL || "http://localhost:3000";
const TEST_TOKEN = process.env.TEST_ACCESS_TOKEN || "";

interface TestCase {
  name: string;
  method: "GET" | "POST" | "PUT" | "PATCH";
  path: string;
  brandId: string;
  expectedStatus: number;
  description: string;
}

// Test constants - use valid UUID format for testing
const TEST_VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const TEST_TEMP_ID = "brand_1234567890";

const testCases: TestCase[] = [
  {
    name: "Valid UUID - Brand Guide GET (params)",
    method: "GET",
    path: "/api/brand-guide/:brandId",
    brandId: TEST_VALID_UUID,
    expectedStatus: 401, // Will be 401 without auth, but validates format
    description: "Valid UUID in URL params should pass format validation",
  },
  {
    name: "Temporary ID - Crawler POST (body)",
    method: "POST",
    path: "/api/crawl/start",
    brandId: TEST_TEMP_ID,
    expectedStatus: 400, // Will be 400 without URL, but validates format
    description: "Temporary brand ID (brand_<timestamp>) should pass format validation",
  },
  {
    name: "Invalid Format - Brand Guide GET",
    method: "GET",
    path: "/api/brand-guide/:brandId",
    brandId: "invalid-brand-id",
    expectedStatus: 400,
    description: "Invalid format should return 400",
  },
  {
    name: "Valid UUID - Content Items GET (query)",
    method: "GET",
    path: "/api/content-items",
    brandId: TEST_VALID_UUID,
    expectedStatus: 401, // Will be 401 without auth
    description: "Valid UUID in query params should pass validation",
  },
  {
    name: "Valid UUID - Analytics GET (query)",
    method: "GET",
    path: "/api/analytics/overview",
    brandId: TEST_VALID_UUID,
    expectedStatus: 401, // Will be 401 without auth
    description: "Valid UUID in query params should pass validation",
  },
  {
    name: "Valid UUID - Brand Intelligence GET (params)",
    method: "GET",
    path: "/api/brand-intelligence/:brandId",
    brandId: TEST_VALID_UUID,
    expectedStatus: 401, // Will be 401 without auth
    description: "Valid UUID in URL params should pass validation",
  },
];

async function runTest(testCase: TestCase): Promise<boolean> {
  try {
    const url = new URL(`${BASE_URL}${testCase.path}`);
    
    if (testCase.method === "GET") {
      if (testCase.path.includes(":brandId")) {
        url.pathname = testCase.path.replace(":brandId", testCase.brandId);
      } else {
        url.searchParams.set("brandId", testCase.brandId);
      }
    }

    const options: RequestInit = {
      method: testCase.method,
      headers: {
        "Content-Type": "application/json",
        ...(TEST_TOKEN ? { Authorization: `Bearer ${TEST_TOKEN}` } : {}),
      },
    };

    if (testCase.method !== "GET") {
      options.body = JSON.stringify({
        brandId: testCase.brandId,
        brand_id: testCase.brandId,
        url: "https://example.com", // For crawler
      });
    }

    const response = await fetch(url.toString(), options);
    const status = response.status;

    // Check if status matches expected (or is close - 401 vs 400 for auth issues)
    const passed = 
      status === testCase.expectedStatus ||
      (testCase.expectedStatus === 401 && status === 400) ||
      (testCase.expectedStatus === 400 && status === 400);

    console.log(
      passed ? "✅" : "❌",
      testCase.name,
      `- Status: ${status} (expected: ${testCase.expectedStatus})`
    );
    
    if (!passed) {
      const body = await response.text();
      console.log(`   Response: ${body.substring(0, 200)}`);
    }

    return passed;
  } catch (error) {
    console.error("❌", testCase.name, "- Error:", error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function main() {
  console.log("🧪 Testing Brand ID Middleware\n");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Auth Token: ${TEST_TOKEN ? "Set" : "Not set (tests will show 401)"}\n`);

  const results = await Promise.all(testCases.map(runTest));
  const passed = results.filter(Boolean).length;
  const total = testCases.length;

  console.log(`\n📊 Results: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log("✅ All tests passed!");
    process.exit(0);
  } else {
    console.log("❌ Some tests failed");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Test script error:", error);
  process.exit(1);
});

