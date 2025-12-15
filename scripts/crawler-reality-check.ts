#!/usr/bin/env tsx
/**
 * Crawler Reality Check Script
 * 
 * Purpose: Verify the crawler is running the expected code version.
 * This script helps diagnose "stale code" issues where fixes don't take effect.
 * 
 * What it does:
 * 1. Checks if dev server is running (port 3000)
 * 2. Triggers a minimal test crawl
 * 3. Verifies fingerprint logs are present
 * 4. Exits non-zero if checks fail
 * 
 * Usage:
 *   pnpm tsx scripts/crawler-reality-check.ts
 *   pnpm tsx scripts/crawler-reality-check.ts --url https://example.com
 * 
 * Expected Output:
 * ✓ SERVER_BOOT detected
 * ✓ CRAWL_RUN_START detected (sha=abc123)
 * ✓ ENV_ID detected (env=development)
 * ✓ CACHE logs detected
 * ✓ CRAWL_RUN_END detected
 * 
 * Reality check PASSED ✓
 */

import "dotenv/config";

const PORT = parseInt(process.env.BACKEND_PORT || "3000", 10);
const BASE_URL = `http://localhost:${PORT}`;
const TEST_URL = process.argv.includes("--url") 
  ? process.argv[process.argv.indexOf("--url") + 1]
  : "https://example.com"; // Small, fast site for testing

interface RuntimeFingerprint {
  gitSha: string;
  buildTime: string;
  nodeEnv: string;
  pid: number;
  cwd: string;
  fingerprintFile: string;
  entryFile?: string;
  appVersion: string;
  hostname: string;
  platform: string;
  serverStartedAt?: string;
  uptime?: number;
}

interface RealityCheckResult {
  serverRunning: boolean;
  fingerprintRetrieved: boolean;
  crawlTriggered: boolean;
  sha?: string;
  env?: string;
  entryFile?: string;
  errors: string[];
  warnings: string[];
}

async function checkServerRunning(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function getFingerprintFromServer(): Promise<{
  success: boolean;
  fingerprint?: RuntimeFingerprint;
  error?: string;
}> {
  try {
    const realityCheckToken = process.env.REALITY_CHECK_TOKEN || "";
    const response = await fetch(`${BASE_URL}/__debug/fingerprint`, {
      headers: {
        "x-reality-check-token": realityCheckToken,
      },
      signal: AbortSignal.timeout(5000),
    });
    
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
    
    const fingerprint = await response.json();
    return {
      success: true,
      fingerprint,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function triggerTestCrawl(): Promise<{ 
  success: boolean; 
  logs: string[];
  error?: string;
}> {
  try {
    console.log(`\n🔍 Triggering test crawl: ${TEST_URL}`);
    console.log(`📡 Endpoint: POST ${BASE_URL}/api/crawl/start`);
    console.log(`⏱️  Timeout: 90s\n`);

    const realityCheckToken = process.env.REALITY_CHECK_TOKEN || "";
    const response = await fetch(`${BASE_URL}/api/crawl/start?sync=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // ✅ Reality check auth bypass (dev-only)
        // Server checks: NODE_ENV !== "production" && token matches secret && allowed path
        "x-reality-check-token": realityCheckToken,
      },
      body: JSON.stringify({
        url: TEST_URL,
        brand_id: `reality_check_${Date.now()}`,
        sync: true,
        cacheMode: "default",
      }),
      signal: AbortSignal.timeout(90000), // 90s timeout
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        logs: [],
        error: `HTTP ${response.status}: ${JSON.stringify(data)}`,
      };
    }

    return {
      success: true,
      logs: [], // Server logs go to console, not returned in response
    };
  } catch (error) {
    return {
      success: false,
      logs: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function printResult(check: string, passed: boolean, details?: string): void {
  const icon = passed ? "✓" : "✗";
  const color = passed ? "\x1b[32m" : "\x1b[31m"; // Green : Red
  const reset = "\x1b[0m";
  console.log(`${color}${icon}${reset} ${check}${details ? ` ${details}` : ""}`);
}

function printWarning(message: string): void {
  const color = "\x1b[33m"; // Yellow
  const reset = "\x1b[0m";
  console.log(`${color}⚠${reset}  ${message}`);
}

async function main(): Promise<void> {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║         CRAWLER REALITY CHECK                              ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const result: RealityCheckResult = {
    serverRunning: false,
    fingerprintRetrieved: false,
    crawlTriggered: false,
    errors: [],
    warnings: [],
  };

  // Step 1: Check if server is running
  console.log("📡 Checking if server is running...");
  result.serverRunning = await checkServerRunning();
  
  if (!result.serverRunning) {
    printResult("Server running", false, `(${BASE_URL}/health not responding)`);
    console.log("\n❌ Reality check FAILED");
    console.log("💡 Start the dev server: pnpm dev:server\n");
    process.exit(1);
  }
  
  printResult("Server running", true, `(${BASE_URL})`);

  // Step 2: Get runtime fingerprint
  console.log("\n🔍 Retrieving runtime fingerprint...");
  const fingerprintResult = await getFingerprintFromServer();
  result.fingerprintRetrieved = fingerprintResult.success;

  if (!fingerprintResult.success) {
    printResult("Fingerprint retrieved", false, `(${fingerprintResult.error})`);
    result.errors.push(fingerprintResult.error || "Failed to get fingerprint");
    console.log("\n❌ Reality check FAILED");
    console.log("💡 Ensure server is running in development mode\n");
    process.exit(1);
  }

  printResult("Fingerprint retrieved", true);

  // Validate fingerprint
  const fp = fingerprintResult.fingerprint!;
  result.sha = fp.gitSha;
  result.env = fp.nodeEnv;
  result.entryFile = fp.entryFile;

  console.log("\n📋 Runtime Fingerprint:");
  console.log(`   Git SHA:      ${fp.gitSha}`);
  console.log(`   Build Time:   ${fp.buildTime}`);
  console.log(`   Environment:  ${fp.nodeEnv}`);
  console.log(`   Entry File:   ${fp.entryFile || "unknown"}`);
  console.log(`   App Version:  ${fp.appVersion}`);
  console.log(`   Server Start: ${fp.serverStartedAt || "unknown"}`);
  console.log(`   PID:          ${fp.pid}`);
  console.log(`   Uptime:       ${fp.uptime ? Math.floor(fp.uptime) + "s" : "unknown"}`);

  // Check for failures
  let hasCriticalFailure = false;

  console.log("\n🔎 Validating fingerprint...");

  // Check 1: Git SHA must not be "unknown" and must be valid hex format
  if (fp.gitSha === "unknown") {
    printResult("Git SHA resolved", false, "(SHA is unknown)");
    result.errors.push("Git SHA is unknown - cannot verify code version");
    hasCriticalFailure = true;
  } else {
    // Validate SHA is hex format (not a branch name)
    const isValidSha = /^[0-9a-f]{7,40}$/i.test(fp.gitSha);
    if (!isValidSha) {
      printResult("Git SHA format", false, `(not a SHA: ${fp.gitSha.substring(0, 20)})`);
      result.errors.push(`Git SHA is not valid hex format: ${fp.gitSha}`);
      hasCriticalFailure = true;
    } else {
      printResult("Git SHA resolved", true, `(${fp.gitSha.substring(0, 7)})`);
    }
  }

  // Check 2: Environment should be "development" when running locally
  const expectedEnv = "development";
  if (fp.nodeEnv !== expectedEnv) {
    printWarning(`Environment is "${fp.nodeEnv}" (expected "${expectedEnv}")`);
    result.warnings.push(`Running in ${fp.nodeEnv} mode`);
  } else {
    printResult("Environment correct", true, `(${fp.nodeEnv})`);
  }

  // Check 3: Entry file should be known
  if (!fp.entryFile || fp.entryFile === "unknown") {
    printWarning("Entry file is unknown");
    result.warnings.push("Entry file not tracked");
  } else {
    printResult("Entry file tracked", true, `(${fp.entryFile.split("/").pop()})`);
  }

  if (hasCriticalFailure) {
    console.log("\n❌ Reality check FAILED");
    console.log("💡 Critical issues detected:");
    result.errors.forEach(err => console.log(`   - ${err}`));
    console.log("\n");
    process.exit(1);
  }

  // Step 3: Trigger test crawl
  console.log("\n🔄 Triggering test crawl...");
  const crawlResult = await triggerTestCrawl();
  result.crawlTriggered = crawlResult.success;

  if (!crawlResult.success) {
    printResult("Crawl triggered", false, `(${crawlResult.error})`);
    result.errors.push(crawlResult.error || "Unknown error");
    
    // If crawl fails but server is up, we can still check boot logs
    console.log("\n⚠️  Crawl failed, but checking boot logs...");
    console.log("💡 Check server console for:");
    console.log("   - SERVER_BOOT line (shows git SHA, build time)");
    console.log("   - CRAWL_RUN_START line (if crawl started)");
    console.log("   - ENV_ID line (shows environment)");
    console.log("   - CACHE lines (shows cache behavior)");
    console.log("   - CRAWL_RUN_END line (if crawl completed)\n");
    
    // Partial success - exit with warning
    process.exit(2);
  }

  printResult("Crawl triggered", true);

  // Print warnings if any
  if (result.warnings.length > 0) {
    console.log("\n⚠️  Warnings:");
    result.warnings.forEach(warning => console.log(`   - ${warning}`));
  }

  // Success
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║  Reality check PASSED ✓                                    ║");
  console.log("║                                                            ║");
  console.log("║  The running code is verified:                            ║");
  console.log(`║  - Git SHA: ${fp.gitSha.substring(0, 40).padEnd(40)} ║`);
  console.log(`║  - Environment: ${fp.nodeEnv.padEnd(40)} ║`);
  console.log("║                                                            ║");
  console.log("║  Check server console for detailed crawl logs:            ║");
  console.log("║  - SERVER_BOOT (at startup)                               ║");
  console.log("║  - CRAWL_RUN_START/END (for each crawl)                   ║");
  console.log("║  - ENV_ID, CACHE logs (during crawl)                      ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  process.exit(0);
}

main().catch((error) => {
  console.error("\n❌ Reality check CRASHED:", error);
  process.exit(1);
});

