#!/usr/bin/env tsx
/**
 * Doc Agent Smoke Test
 * 
 * Tests the /api/agents/generate/doc endpoint with the canonical contract.
 * Verifies that:
 * - The endpoint accepts the canonical request format (brand_id + input)
 * - OpenAI is actually called and returns content
 * - The response contains generated content
 * 
 * Usage:
 *   pnpm tsx scripts/api-doc-agent-smoke.ts
 * 
 * Environment Variables:
 *   API_BASE - Base URL (default: http://localhost:8080)
 *   ACCESS_TOKEN - Bearer token for authentication (required)
 *   BRAND_ID - Brand ID to use for testing (required)
 */

const API_BASE = process.env.API_BASE || "http://localhost:8080";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const BRAND_ID = process.env.BRAND_ID;

interface TestResult {
  success: boolean;
  statusCode: number;
  hasContent: boolean;
  contentLength: number;
  error?: string;
  response?: any;
}

/**
 * Test doc agent with canonical contract
 */
async function testDocAgent(): Promise<TestResult> {
  if (!ACCESS_TOKEN) {
    throw new Error("ACCESS_TOKEN environment variable is required");
  }

  if (!BRAND_ID) {
    throw new Error("BRAND_ID environment variable is required");
  }

  console.log("🧪 Testing Doc Agent Endpoint");
  console.log(`   URL: ${API_BASE}/api/agents/generate/doc`);
  console.log(`   Brand ID: ${BRAND_ID}`);
  console.log("");

  const canonicalPayload = {
    brand_id: BRAND_ID,
    input: {
      topic: "Write a launch announcement with steps for my new product",
      platform: "linkedin",
      tone: "professional",
      format: "post",
      max_length: 2200,
      include_cta: true,
      cta_type: "link",
    },
  };

  console.log("📤 Sending request with canonical contract:");
  console.log(JSON.stringify(canonicalPayload, null, 2));
  console.log("");

  try {
    const startTime = Date.now();
    const response = await fetch(`${API_BASE}/api/agents/generate/doc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify(canonicalPayload),
    });

    const latencyMs = Date.now() - startTime;
    const data = await response.json();

    console.log(`📥 Response received (${latencyMs}ms):`);
    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.log("   Error Response:", JSON.stringify(data, null, 2));
      return {
        success: false,
        statusCode: response.status,
        hasContent: false,
        contentLength: 0,
        error: data.error?.message || data.message || "Unknown error",
        response: data,
      };
    }

    // Check if response has content
    const hasContent = !!(
      data.output?.body ||
      data.output?.headline ||
      data.variants?.length > 0 ||
      data.content
    );

    const contentLength =
      data.output?.body?.length ||
      data.variants?.[0]?.content?.length ||
      data.content?.length ||
      0;

    console.log(`   Success: ${data.success !== false ? "✅" : "❌"}`);
    console.log(`   Has Content: ${hasContent ? "✅" : "❌"}`);
    console.log(`   Content Length: ${contentLength} chars`);

    if (data.output) {
      console.log(`   Output Structure:`, Object.keys(data.output));
      if (data.output.body) {
        console.log(`   Body Preview: ${data.output.body.substring(0, 100)}...`);
      }
    }

    if (data.variants && data.variants.length > 0) {
      console.log(`   Variants: ${data.variants.length}`);
      console.log(`   First Variant Preview: ${data.variants[0].content?.substring(0, 100) || "N/A"}...`);
    }

    if (data.metadata) {
      console.log(`   Provider: ${data.metadata.provider || "unknown"}`);
      console.log(`   Latency: ${data.metadata.latencyMs || latencyMs}ms`);
      console.log(`   BFS Score: ${data.metadata.averageBrandFidelityScore || "N/A"}`);
    }

    return {
      success: response.ok && hasContent && contentLength > 0,
      statusCode: response.status,
      hasContent,
      contentLength,
      response: data,
    };
  } catch (error) {
    console.error("❌ Request failed:", error);
    return {
      success: false,
      statusCode: 0,
      hasContent: false,
      contentLength: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test backwards compatibility with legacy format
 */
async function testLegacyFormat(): Promise<TestResult> {
  if (!ACCESS_TOKEN || !BRAND_ID) {
    return {
      success: false,
      statusCode: 0,
      hasContent: false,
      contentLength: 0,
      error: "ACCESS_TOKEN and BRAND_ID required",
    };
  }

  console.log("\n🔄 Testing backwards compatibility (legacy format):");
  console.log("   Using brandId (camelCase) and top-level prompt/platform/tone");

  const legacyPayload = {
    brandId: BRAND_ID,
    prompt: "Write a launch announcement with steps for my new product",
    platform: "linkedin",
    tone: "professional",
  };

  console.log("📤 Sending request with legacy format:");
  console.log(JSON.stringify(legacyPayload, null, 2));
  console.log("");

  try {
    const response = await fetch(`${API_BASE}/api/agents/generate/doc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify(legacyPayload),
    });

    const data = await response.json();

    console.log(`📥 Response received:`);
    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        hasContent: false,
        contentLength: 0,
        error: data.error?.message || data.message || "Unknown error",
        response: data,
      };
    }

    const hasContent = !!(
      data.output?.body ||
      data.output?.headline ||
      data.variants?.length > 0
    );

    return {
      success: response.ok && hasContent,
      statusCode: response.status,
      hasContent,
      contentLength: data.output?.body?.length || 0,
      response: data,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: 0,
      hasContent: false,
      contentLength: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("=".repeat(60));
  console.log("🚀 DOC AGENT SMOKE TEST");
  console.log("=".repeat(60));
  console.log("");

  try {
    // Test canonical format
    const canonicalResult = await testDocAgent();

    console.log("\n" + "-".repeat(60));
    if (canonicalResult.success) {
      console.log("✅ CANONICAL FORMAT TEST: PASSED");
      console.log(`   Status: ${canonicalResult.statusCode}`);
      console.log(`   Content: ${canonicalResult.contentLength} chars`);
    } else {
      console.log("❌ CANONICAL FORMAT TEST: FAILED");
      console.log(`   Status: ${canonicalResult.statusCode}`);
      console.log(`   Error: ${canonicalResult.error || "No content returned"}`);
    }

    // Test legacy format (optional)
    if (process.env.TEST_LEGACY !== "false") {
      const legacyResult = await testLegacyFormat();
      console.log("\n" + "-".repeat(60));
      if (legacyResult.success) {
        console.log("✅ LEGACY FORMAT TEST: PASSED");
        console.log(`   Status: ${legacyResult.statusCode}`);
      } else {
        console.log("⚠️  LEGACY FORMAT TEST: FAILED");
        console.log(`   Status: ${legacyResult.statusCode}`);
        console.log(`   Error: ${legacyResult.error || "No content returned"}`);
        console.log("   Note: Legacy format may not be fully supported");
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 SUMMARY");
    console.log("=".repeat(60));
    console.log(`Canonical Format: ${canonicalResult.success ? "✅ PASS" : "❌ FAIL"}`);
    if (canonicalResult.success) {
      console.log("\n✅ Doc agent is working correctly!");
      console.log("   - Endpoint is reachable");
      console.log("   - Request contract is correct");
      console.log("   - Content is being generated");
      if (canonicalResult.response?.metadata?.provider) {
        console.log(`   - Using provider: ${canonicalResult.response.metadata.provider}`);
      }
    } else {
      console.log("\n❌ Doc agent test failed!");
      console.log(`   Error: ${canonicalResult.error || "Unknown error"}`);
      console.log("\n   Troubleshooting:");
      console.log("   1. Check that the server is running");
      console.log("   2. Verify ACCESS_TOKEN is valid");
      console.log("   3. Verify BRAND_ID exists and user has access");
      console.log("   4. Check server logs for detailed error messages");
      process.exit(1);
    }

    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("\n❌ Smoke test failed:", error);
    console.error("\nUsage:");
    console.error("  ACCESS_TOKEN=your_token BRAND_ID=your_brand_id pnpm tsx scripts/api-doc-agent-smoke.ts");
    process.exit(1);
  }
}

main();

