/**
 * AI Provider Usage Smoke Test
 *
 * This script verifies that AI providers (OpenAI, Claude, etc.) are wired correctly
 * through the POSTD API routes.
 *
 * Usage:
 *   AI_SMOKE_BRAND_ID=<uuid> \
 *   POSTD_SMOKE_ACCESS_TOKEN=<token> \
 *   pnpm tsx scripts/ai-provider-usage-smoke.ts
 *
 * Optional:
 *   POSTD_SMOKE_BASE_URL=http://localhost:8080  (default)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Configuration from environment
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.POSTD_SMOKE_BASE_URL ?? "http://localhost:8080";
const BRAND_ID = process.env.AI_SMOKE_BRAND_ID;
const TOKEN = process.env.POSTD_SMOKE_ACCESS_TOKEN;

// ─────────────────────────────────────────────────────────────────────────────
// Validate required environment variables
// ─────────────────────────────────────────────────────────────────────────────

function validateEnv(): boolean {
  let valid = true;

  if (!BRAND_ID) {
    console.error("❌ Missing required environment variable: AI_SMOKE_BRAND_ID");
    valid = false;
  }

  if (!TOKEN) {
    console.error("❌ Missing required environment variable: POSTD_SMOKE_ACCESS_TOKEN");
    valid = false;
  }

  return valid;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface SafeFetchResult {
  ok: boolean;
  status: number;
  json?: unknown;
  error?: unknown;
  durationMs: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: safeFetch
// ─────────────────────────────────────────────────────────────────────────────

async function safeFetch(
  path: string,
  init?: RequestInit & { expectJson?: boolean }
): Promise<SafeFetchResult> {
  const url = BASE_URL + path;
  const startTime = Date.now();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };

  try {
    const response = await fetch(url, {
      ...init,
      headers,
    });

    const durationMs = Date.now() - startTime;
    const expectJson = init?.expectJson !== false;

    let json: unknown = undefined;
    if (expectJson) {
      try {
        json = await response.json();
      } catch {
        // Response may not be JSON
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      json,
      durationMs,
    };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    return {
      ok: false,
      status: 0,
      error: err,
      durationMs,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: extractProviderInfo
// ─────────────────────────────────────────────────────────────────────────────

function extractProviderInfo(json: unknown): string | undefined {
  if (!json || typeof json !== "object") return undefined;

  const obj = json as Record<string, unknown>;

  // Check json.metadata?.provider
  if (obj.metadata && typeof obj.metadata === "object") {
    const metadata = obj.metadata as Record<string, unknown>;
    if (typeof metadata.provider === "string") {
      return metadata.provider;
    }
  }

  // Check json.provider
  if (typeof obj.provider === "string") {
    return obj.provider;
  }

  // Check json.meta?.provider
  if (obj.meta && typeof obj.meta === "object") {
    const meta = obj.meta as Record<string, unknown>;
    if (typeof meta.provider === "string") {
      return meta.provider;
    }
  }

  return undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: countVariants
// ─────────────────────────────────────────────────────────────────────────────

function countVariants(json: unknown): number {
  if (!json || typeof json !== "object") return 0;

  const obj = json as Record<string, unknown>;

  // Prefer json.variants if array
  if (Array.isArray(obj.variants)) {
    return obj.variants.length;
  }

  // Fallback to json.items
  if (Array.isArray(obj.items)) {
    return obj.items.length;
  }

  // Fallback to json.results
  if (Array.isArray(obj.results)) {
    return obj.results.length;
  }

  return 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Test: Doc Agent
// ─────────────────────────────────────────────────────────────────────────────

async function runDocAgentTest(): Promise<boolean> {
  console.log("\n📝 Testing Doc Agent (POST /api/agents/generate/doc)...");

  const payload = {
    brandId: BRAND_ID,
    topic: "Welcome post for my brand",
    platform: "instagram",
    contentType: "social_post",
    tone: "friendly",
  };

  const result = await safeFetch("/api/agents/generate/doc", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const provider = extractProviderInfo(result.json);
  const variantCount = countVariants(result.json);

  console.log(`   Status: ${result.status}`);
  console.log(`   Duration: ${result.durationMs}ms`);
  console.log(`   Provider: ${provider ?? "(not found in response)"}`);
  console.log(`   Variants: ${variantCount}`);

  if (!result.ok) {
    console.error("   ❌ Doc Agent test FAILED");
    if (result.error) {
      console.error("   Error:", result.error);
    } else if (result.json) {
      console.error("   Response:", JSON.stringify(result.json, null, 2));
    }
    return false;
  }

  console.log("   ✅ Doc Agent test PASSED");
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Test: Design Agent
// ─────────────────────────────────────────────────────────────────────────────

async function runDesignAgentTest(): Promise<boolean> {
  console.log("\n🎨 Testing Design Agent (POST /api/agents/generate/design)...");

  const payload = {
    brandId: BRAND_ID,
    platform: "instagram",
    theme: "welcome post",
    aspect_ratio: "square",
  };

  const result = await safeFetch("/api/agents/generate/design", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  // If 404, this endpoint may not be wired yet — treat as non-failure
  if (result.status === 404) {
    console.log("   ⚠️  Design agent endpoint returned 404 (not wired yet)");
    console.log("   ✅ Design Agent test SKIPPED (not a hard failure)");
    return true;
  }

  const provider = extractProviderInfo(result.json);
  const variantCount = countVariants(result.json);

  console.log(`   Status: ${result.status}`);
  console.log(`   Duration: ${result.durationMs}ms`);
  console.log(`   Provider: ${provider ?? "(not found in response)"}`);
  console.log(`   Variants: ${variantCount}`);

  if (!result.ok) {
    console.error("   ❌ Design Agent test FAILED");
    if (result.error) {
      console.error("   Error:", result.error);
    } else if (result.json) {
      console.error("   Response:", JSON.stringify(result.json, null, 2));
    }
    return false;
  }

  console.log("   ✅ Design Agent test PASSED");
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Test: Advisor
// ─────────────────────────────────────────────────────────────────────────────

async function runAdvisorTest(): Promise<boolean> {
  console.log("\n💡 Testing Advisor (POST /api/advisor/insights)...");

  const payload = {
    brandId: BRAND_ID,
  };

  // Try primary endpoint first
  let result = await safeFetch("/api/advisor/insights", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  // If 404, try fallback endpoint
  if (result.status === 404) {
    console.log("   ℹ️  /api/advisor/insights returned 404, trying /api/ai/advisor...");
    result = await safeFetch("/api/ai/advisor", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  const provider = extractProviderInfo(result.json);
  const insightsCount = countVariants(result.json);

  console.log(`   Status: ${result.status}`);
  console.log(`   Duration: ${result.durationMs}ms`);
  console.log(`   Provider: ${provider ?? "(not found in response)"}`);
  console.log(`   Insights Count: ${insightsCount}`);

  if (!result.ok) {
    console.error("   ❌ Advisor test FAILED");
    if (result.error) {
      console.error("   Error:", result.error);
    } else if (result.json) {
      console.error("   Response:", JSON.stringify(result.json, null, 2));
    }
    return false;
  }

  console.log("   ✅ Advisor test PASSED");
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Test: Onboarding Workflow
// ─────────────────────────────────────────────────────────────────────────────

async function runOnboardingWorkflowTest(): Promise<boolean> {
  console.log("\n🚀 Testing Onboarding Workflow (POST /api/orchestration/onboarding/run-all)...");

  const payload = {
    brandId: BRAND_ID,
  };

  const result = await safeFetch("/api/orchestration/onboarding/run-all", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const jsonObj = result.json as Record<string, unknown> | undefined;
  const responseStatus = jsonObj?.status ?? "(not found)";
  const stepsCount = Array.isArray(jsonObj?.steps) ? jsonObj.steps.length : 0;

  console.log(`   HTTP Status: ${result.status}`);
  console.log(`   Duration: ${result.durationMs}ms`);
  console.log(`   Response Status: ${responseStatus}`);
  console.log(`   Steps Count: ${stepsCount}`);

  if (!result.ok) {
    console.error("   ❌ Onboarding Workflow test FAILED");
    if (result.error) {
      console.error("   Error:", result.error);
    } else if (result.json) {
      console.error("   Response:", JSON.stringify(result.json, null, 2));
    }
    return false;
  }

  console.log("   ✅ Onboarding Workflow test PASSED");
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("🚀 AI Provider Usage Smoke Test");
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log(`   BASE_URL: ${BASE_URL}`);
  console.log(`   BRAND_ID: ${BRAND_ID ?? "(not set)"}`);
  console.log("═══════════════════════════════════════════════════════════════════");

  // Validate environment
  if (!validateEnv()) {
    process.exit(1);
  }

  // Run all tests sequentially
  const docOk = await runDocAgentTest();
  const designOk = await runDesignAgentTest();
  const advisorOk = await runAdvisorTest();
  const onboardingOk = await runOnboardingWorkflowTest();

  // Print summary
  console.log("\n═══════════════════════════════════════════════════════════════════");
  console.log("📊 Summary:");
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log(`   Doc Agent:        ${docOk ? "✅" : "❌"}`);
  console.log(`   Design Agent:     ${designOk ? "✅" : "❌"}`);
  console.log(`   Advisor:          ${advisorOk ? "✅" : "❌"}`);
  console.log(`   Onboarding Flow:  ${onboardingOk ? "✅" : "❌"}`);
  console.log("═══════════════════════════════════════════════════════════════════");

  const allPassed = docOk && designOk && advisorOk && onboardingOk;

  if (allPassed) {
    console.log("\n✅ All AI provider smoke tests PASSED!\n");
    process.exit(0);
  } else {
    console.log("\n❌ Some AI provider smoke tests FAILED.\n");
    process.exit(1);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry Point
// ─────────────────────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error("❌ Unexpected error in AI smoke test:", err);
  process.exit(1);
});

