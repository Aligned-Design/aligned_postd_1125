/**
 * Runtime Fingerprint - Code Version Tracking
 * 
 * Purpose: Prove which code version is running at any given time.
 * This helps diagnose "stale code" issues where fixes don't take effect.
 * 
 * Key Capabilities:
 * - Boot fingerprint: Logs once when server/worker starts
 * - Run fingerprint: Logs for every crawler run
 * - Git SHA tracking: Shows exact commit being executed
 * - Build time tracking: Shows when code was built
 * - Process ID tracking: Helps identify which process is running
 * 
 * Usage:
 * - Call logBootFingerprint() once at server/worker startup
 * - Call getRuntimeFingerprint() at start of each crawler run
 * - Look for "CRAWLER_BOOT" and "CRAWL_RUN_START" in logs
 */

import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

// Cached git SHA (resolved once at boot)
let cachedGitSha: string | null = null;

// Boot context (captured once at server start)
let bootContext: {
  entryFile: string;
  serverStartedAt: string;
} | null = null;

export interface RuntimeFingerprint {
  gitSha: string;
  buildTime: string;
  nodeEnv: string;
  pid: number;
  cwd: string;
  fingerprintFile: string;
  appVersion: string;
  hostname: string;
  platform: string;
  entryFile?: string; // Actual server entrypoint (passed via logBootFingerprint)
}

/**
 * Validate if string looks like a git SHA (7-40 hex characters)
 */
function isValidSha(value: string): boolean {
  return /^[0-9a-f]{7,40}$/i.test(value.trim());
}

/**
 * Resolve git SHA from environment or git command
 * 
 * Priority:
 * 1. Environment variables (GIT_SHA, VERCEL_GIT_COMMIT_SHA) - only if valid SHA format
 * 2. In development only: git rev-parse HEAD
 * 3. "unknown" (with warning)
 */
function resolveGitSha(): string {
  // Try environment variables first (must be actual SHA, not branch/ref)
  const envSha = 
    process.env.GIT_SHA || 
    process.env.VERCEL_GIT_COMMIT_SHA || 
    process.env.VERCEL_GIT_COMMIT_REF;
  
  if (envSha && isValidSha(envSha)) {
    return envSha;
  }

  // In development, try to resolve from git
  const nodeEnv = process.env.NODE_ENV || "development";
  const isDev = nodeEnv === "development";
  
  if (isDev) {
    // Use cached value if available
    if (cachedGitSha) {
      return cachedGitSha;
    }

    // Try to resolve from git (dev-only, cached)
    try {
      const sha = execSync("git rev-parse HEAD", { 
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"], // Suppress stderr
        timeout: 5000, // 5s timeout
      }).trim();
      
      if (sha && sha.length >= 7) {
        cachedGitSha = sha;
        return sha;
      }
    } catch {
      // Git not available or failed - continue to warning
    }
  }

  // Could not resolve SHA
  console.warn(
    "⚠️  FINGERPRINT DEGRADED: Git SHA is unknown. Set GIT_SHA env var or ensure git is available in dev."
  );
  
  return "unknown";
}

/**
 * Get current runtime fingerprint
 * 
 * Captures:
 * - Git SHA (from env GIT_SHA or VERCEL_GIT_COMMIT_SHA, or git rev-parse in dev)
 * - Build time (from env BUILD_TIME or VERCEL_BUILD_TIME)
 * - Node environment (NODE_ENV)
 * - Process ID (process.pid)
 * - Current working directory (process.cwd())
 * - Fingerprint file (location of this utility)
 * - App version (from package.json)
 * - Hostname (from env VERCEL_REGION or os.hostname())
 * - Platform (from process.platform)
 */
export function getRuntimeFingerprint(): RuntimeFingerprint {
  // Git SHA: Try multiple sources (with auto-resolve in dev)
  const gitSha = resolveGitSha();

  // Build time: Try multiple sources
  const buildTime = 
    process.env.BUILD_TIME || 
    process.env.VERCEL_BUILD_TIME ||
    "unknown";

  // Node environment
  const nodeEnv = process.env.NODE_ENV || "development";

  // Process ID
  const pid = process.pid;

  // Current working directory
  const cwd = process.cwd();

  // Fingerprint file: Location where this fingerprint is generated
  // NOTE: This is NOT the server entrypoint - it's the location of this utility file
  let fingerprintFile = "unknown";
  try {
    // Try import.meta.url (ESM)
    if (typeof import.meta !== "undefined" && import.meta.url) {
      fingerprintFile = fileURLToPath(import.meta.url);
    }
    // Fallback to __filename (CommonJS) - may not work in ESM
    // else if (typeof __filename !== "undefined") {
    //   fingerprintFile = __filename;
    // }
  } catch {
    fingerprintFile = "unknown";
  }

  // App version: Read from package.json
  let appVersion = "unknown";
  try {
    const packageJsonPath = path.join(cwd, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      appVersion = packageJson.version || "unknown";
    }
  } catch {
    appVersion = "unknown";
  }

  // Hostname: Try multiple sources
  const hostname = 
    process.env.VERCEL_REGION || 
    process.env.HOSTNAME ||
    "localhost";

  // Platform
  const platform = process.platform;

  return {
    gitSha,
    buildTime,
    nodeEnv,
    pid,
    cwd,
    fingerprintFile,
    entryFile: bootContext?.entryFile, // From boot if captured
    appVersion,
    hostname,
    platform,
  };
}

/**
 * Log boot fingerprint (call once at server/worker start)
 * 
 * @param tag - Identifier for this boot (e.g., "SERVER", "WORKER", "CRAWLER")
 * @param extra - Additional context to log (optional)
 *                - entryFile: The actual server entrypoint (e.g., "server/index-v2.ts")
 * 
 * Example output:
 * CRAWLER_BOOT sha=abc123 build=2024-01-15T10:30:00Z pid=12345 env=production entryFile=server/index-v2.ts fingerprintFile=/app/server/lib/runtimeFingerprint.ts
 */
export function logBootFingerprint(tag: string, extra?: Record<string, any>): void {
  const fp = getRuntimeFingerprint();
  const entryFile = extra?.entryFile || "unknown";
  
  // Capture boot context for later retrieval
  bootContext = {
    entryFile,
    serverStartedAt: new Date().toISOString(),
  };
  
  console.log(
    `${tag}_BOOT sha=${fp.gitSha} build=${fp.buildTime} pid=${fp.pid} env=${fp.nodeEnv} entryFile=${entryFile} fingerprintFile=${fp.fingerprintFile} version=${fp.appVersion} hostname=${fp.hostname} platform=${fp.platform} cwd=${fp.cwd}`,
    extra ? JSON.stringify(extra) : ""
  );
}

/**
 * Get boot context (captured at server start)
 * Used by debug endpoints to show when server started and what entry file was used
 */
export function getBootContext(): typeof bootContext {
  return bootContext;
}

/**
 * Generate a crawler run ID (uuid v4 compatible)
 * 
 * Format: crawl_<timestamp>_<random>
 * Example: crawl_1704459000123_a1b2c3d4
 */
export function generateCrawlRunId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `crawl_${timestamp}_${random}`;
}

/**
 * Log crawl run start (call at start of each crawl)
 * 
 * @param runId - Unique run identifier (use generateCrawlRunId())
 * @param context - Crawl context (brandId, url, cacheMode, etc.)
 * 
 * Example output:
 * CRAWL_RUN_START runId=crawl_123_abc sha=def456 brandId=brand_789 url=https://example.com cacheMode=default
 */
export function logCrawlRunStart(
  runId: string, 
  context: {
    brandId: string;
    url: string;
    cacheMode?: string;
    tenantId?: string | null;
    [key: string]: any;
  }
): void {
  const fp = getRuntimeFingerprint();
  
  console.log(
    `CRAWL_RUN_START runId=${runId} sha=${fp.gitSha} brandId=${context.brandId} url=${context.url} cacheMode=${context.cacheMode || "default"} tenantId=${context.tenantId || "unknown"}`,
    JSON.stringify({ ...context, pid: fp.pid })
  );
}

/**
 * Log crawl run end (call at end of each crawl)
 * 
 * @param runId - Same run ID from logCrawlRunStart
 * @param result - Run result (status, duration, cache hits, etc.)
 * 
 * Example output:
 * CRAWL_RUN_END runId=crawl_123_abc status=ok durationMs=5432 cacheHits=3 pagesScraped=5
 */
export function logCrawlRunEnd(
  runId: string,
  result: {
    status: "ok" | "fail" | "partial";
    durationMs: number;
    cacheHits?: number;
    error?: string;
    [key: string]: any;
  }
): void {
  console.log(
    `CRAWL_RUN_END runId=${runId} status=${result.status} durationMs=${result.durationMs} cacheHits=${result.cacheHits || 0}`,
    JSON.stringify(result)
  );
}

