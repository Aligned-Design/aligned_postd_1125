#!/usr/bin/env tsx
/**
 * Test script for /api/crawl/start endpoint
 * 
 * Usage:
 *   pnpm tsx scripts/test-crawl-endpoint.ts
 * 
 * This script:
 * 1. Generates a valid JWT token
 * 2. Tests the crawl endpoint with the provided URL
 * 3. Displays the response
 */

import "dotenv/config";
import { generateTokenPair } from "../server/lib/jwt-auth";
import { Role } from "../server/middleware/rbac";

// Test configuration
const TEST_URL = "https://sdirawealth.com";
const TEST_BRAND_ID = `brand_${Date.now()}`;
const TEST_WORKSPACE_ID = "00000000-0000-0000-0000-000000000000"; // Test UUID
const API_BASE = process.env.API_BASE || "http://localhost:8080";

async function testCrawlEndpoint() {
  console.log("🧪 Testing /api/crawl/start endpoint\n");
  console.log("Configuration:");
  console.log(`  URL: ${TEST_URL}`);
  console.log(`  Brand ID: ${TEST_BRAND_ID}`);
  console.log(`  Workspace ID: ${TEST_WORKSPACE_ID}`);
  console.log(`  API Base: ${API_BASE}\n`);

  // Generate JWT token
  console.log("📝 Generating JWT token...");
  const { accessToken } = generateTokenPair({
    userId: "test-user-crawl",
    email: "test@example.com",
    role: Role.ADMIN,
    brandIds: [TEST_BRAND_ID],
    tenantId: TEST_WORKSPACE_ID,
  });
  console.log(`✅ Token generated (length: ${accessToken.length})\n`);

  // Prepare request
  const url = `${API_BASE}/api/crawl/start?sync=true`;
  const body = JSON.stringify({
    url: TEST_URL,
    brandId: TEST_BRAND_ID,
    workspaceId: TEST_WORKSPACE_ID,
  });

  console.log("🚀 Making request...");
  console.log(`  Endpoint: ${url}`);
  console.log(`  Method: POST`);
  console.log(`  Body: ${body}\n`);

  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body,
    });

    const latency = Date.now() - startTime;
    const responseText = await response.text();
    
    console.log("📥 Response received:");
    console.log(`  Status: ${response.status} ${response.statusText}`);
    console.log(`  Latency: ${latency}ms`);
    console.log(`  Headers:`, Object.fromEntries(response.headers.entries()));
    console.log(`\n  Body:`);
    
    // Try to parse as JSON, otherwise show raw text
    try {
      const json = JSON.parse(responseText);
      console.log(JSON.stringify(json, null, 2));
    } catch {
      console.log(responseText);
    }

    if (response.ok) {
      console.log("\n✅ Request succeeded!");
    } else {
      console.log("\n❌ Request failed!");
      process.exitCode = 1;
    }
  } catch (error) {
    console.error("\n❌ Error making request:");
    console.error(error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    process.exitCode = 1;
  }
}

// Run the test
testCrawlEndpoint().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

