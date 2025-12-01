/**
 * Test script for /api/crawl/start deduplication
 * 
 * This script tests that duplicate concurrent crawl requests are properly
 * deduplicated and return a 409 Conflict response.
 */

import request from "supertest";
import { createServer } from "../server";
import { generateTokenPair } from "../server/lib/jwt-auth";
import { Role } from "../server/middleware/rbac";

// Set minimal env vars for testing
process.env.SUPABASE_URL =
  process.env.SUPABASE_URL || "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "service-key";

async function testCrawlDedup() {
  console.log("🧪 Testing /api/crawl/start deduplication...\n");

  const app = createServer();
  
  // Generate auth token
  const token = generateTokenPair({
    userId: "test-user-dedup",
    email: "test-dedup@example.com",
    role: Role.SUPERADMIN,
    brandIds: ["test-brand-123"],
    tenantId: "test-tenant-1",
  }).accessToken;

  const auth = { Authorization: `Bearer ${token}` };

  // Test parameters
  const testUrl = "https://example.com";
  const testBrandId = "test-brand-123";
  const testPayload = {
    url: testUrl,
    brand_id: testBrandId,
    workspaceId: "test-tenant-1",
    sync: false, // Use async mode to test deduplication without waiting for crawl
  };

  console.log("📋 Test Configuration:");
  console.log(`   URL: ${testUrl}`);
  console.log(`   Brand ID: ${testBrandId}`);
  console.log(`   Mode: async (sync=false)\n`);

  try {
    // First request - should succeed
    console.log("1️⃣  Sending first crawl request...");
    const firstRequest = request(app)
      .post("/api/crawl/start")
      .set(auth)
      .send(testPayload);

    // Second request - should be deduplicated (409 Conflict)
    console.log("2️⃣  Sending duplicate crawl request immediately...");
    const secondRequest = request(app)
      .post("/api/crawl/start")
      .set(auth)
      .send(testPayload);

    // Wait for both requests
    const [firstResponse, secondResponse] = await Promise.all([
      firstRequest,
      secondRequest,
    ]);

    console.log("\n📊 Results:\n");

    // Check first request
    console.log("First Request:");
    console.log(`   Status: ${firstResponse.status}`);
    if (firstResponse.status === 200) {
      console.log("   ✅ First request succeeded");
      const body = firstResponse.body;
      if (body.job_id) {
        console.log(`   Job ID: ${body.job_id}`);
      }
    } else {
      console.log(`   ❌ First request failed with status ${firstResponse.status}`);
      console.log(`   Response: ${JSON.stringify(firstResponse.body, null, 2)}`);
    }

    // Check second request (should be deduplicated)
    console.log("\nSecond Request (duplicate):");
    console.log(`   Status: ${secondResponse.status}`);
    
    if (secondResponse.status === 409) {
      console.log("   ✅ Deduplication working correctly - 409 Conflict returned");
      const body = secondResponse.body;
      if (body.errorCode === "CRAWL_IN_PROGRESS") {
        console.log("   ✅ Correct error code: CRAWL_IN_PROGRESS");
      } else {
        console.log(`   ⚠️  Unexpected error code: ${body.errorCode}`);
      }
      if (body.message) {
        console.log(`   Message: ${body.message}`);
      }
      if (body.details) {
        console.log(`   Details:`, body.details);
      }
    } else if (secondResponse.status === 200) {
      console.log("   ❌ Deduplication NOT working - second request succeeded");
      console.log("   This means duplicate crawls can run concurrently!");
      console.log(`   Response: ${JSON.stringify(secondResponse.body, null, 2)}`);
      process.exitCode = 1;
    } else {
      console.log(`   ⚠️  Unexpected status: ${secondResponse.status}`);
      console.log(`   Response: ${JSON.stringify(secondResponse.body, null, 2)}`);
      process.exitCode = 1;
    }

    // Summary
    console.log("\n📝 Summary:");
    if (firstResponse.status === 200 && secondResponse.status === 409) {
      console.log("   ✅ Deduplication test PASSED");
      console.log("   ✅ First request succeeded");
      console.log("   ✅ Second request correctly rejected with 409 Conflict");
    } else {
      console.log("   ❌ Deduplication test FAILED");
      process.exitCode = 1;
    }

  } catch (error) {
    console.error("\n❌ Test error:", error);
    process.exitCode = 1;
  }
}

// Run the test
testCrawlDedup().catch((error) => {
  console.error("Test failed:", error);
  process.exitCode = 1;
});

