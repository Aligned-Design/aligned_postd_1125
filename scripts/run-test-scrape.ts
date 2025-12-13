#!/usr/bin/env tsx
/**
 * Run test scrape and verify results
 */

import "dotenv/config";
import { generateTokenPair } from "../server/lib/jwt-auth";
import { Role } from "../server/middleware/rbac";

const TEST_BRAND_ID = "11111111-2222-3333-4444-555555555555";
const TEST_TENANT_ID = "00000000-0000-0000-0000-000000000001";
const TEST_URL = "https://example.com"; // Simple, fast page for testing
const API_BASE = "http://localhost:8080";

async function main() {
  console.log("🚀 Running test scrape...\n");
  console.log(`URL: ${TEST_URL}`);
  console.log(`Brand ID: ${TEST_BRAND_ID}`);
  console.log(`Tenant ID: ${TEST_TENANT_ID}\n`);

  // Generate JWT token
  const { accessToken } = generateTokenPair({
    userId: "test-user",
    email: "test@example.com",
    role: Role.ADMIN,
    brandIds: [TEST_BRAND_ID],
    tenantId: TEST_TENANT_ID,
    workspaceId: TEST_TENANT_ID,
  });

  console.log("🔑 Generated auth token\n");

  // Trigger scrape
  const startTime = Date.now();
  console.log("⏱️  Starting scrape...\n");

  const response = await fetch(`${API_BASE}/api/crawl/start?sync=true`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      url: TEST_URL,
      brand_id: TEST_BRAND_ID,
      workspaceId: TEST_TENANT_ID,
      sync: true,
    }),
  });

  const latencyMs = Date.now() - startTime;
  const data = await response.json();

  console.log(`\n📥 Response: ${response.status} ${response.statusText}`);
  console.log(`⏱️  Latency: ${latencyMs}ms (${(latencyMs / 1000).toFixed(1)}s)\n`);

  if (!response.ok) {
    console.error("❌ Scrape failed:", data);
    process.exit(1);
  }

  console.log("✅ Scrape completed successfully\n");

  if (data.brandKit) {
    console.log("📋 Brand Kit Summary:");
    console.log(`   Name: ${data.brandKit.identity?.name || "N/A"}`);
    console.log(`   Colors: ${data.brandKit.visualIdentity?.colors?.length || data.brandKit.colors?.allColors?.length || 0}`);
    console.log(`   Host: ${data.brandKit.metadata?.host?.name || "unknown"}`);
    
    if (data.brandKit.visualIdentity?.colors) {
      console.log(`   Palette: ${data.brandKit.visualIdentity.colors.slice(0, 3).join(", ")}`);
    } else if (data.brandKit.colors?.allColors) {
      console.log(`   Palette: ${data.brandKit.colors.allColors.slice(0, 3).join(", ")}`);
    }
  }

  console.log("\n✅ Now run: pnpm tsx scripts/verify-scrape-results.ts");
}

main().catch(console.error);

