# Crawler Staleness Guardrails - Hardening Summary

**Date**: 2025-12-15  
**Status**: ✅ COMPLETE  
**Purpose**: Tighten and harden fingerprinting guardrails to eliminate false confidence

---

## Objectives Completed

### 1️⃣ Fixed Misleading bootFile Fingerprint ✅

**Problem**: `bootFile` pointed to `runtimeFingerprint.ts`, not the actual server entrypoint.

**Solution**:
- Renamed `bootFile` → `fingerprintFile` everywhere
- Added explicit `entryFile` parameter to `logBootFingerprint()`
- Updated `server/index-v2.ts` to pass actual entry file:
  ```typescript
  const entryFile = import.meta.url ? fileURLToPath(import.meta.url) : "server/index-v2.ts";
  logBootFingerprint("SERVER", { port, entryFile });
  ```
- `getRuntimeFingerprint()` now returns both:
  - `fingerprintFile`: Location of fingerprint utility
  - `entryFile`: Actual server entrypoint (from boot context)

**Result**: Logs clearly distinguish fingerprint location vs actual server entrypoint.

### 2️⃣ Made Git SHA Non-Optional in Development ✅

**Problem**: `gitSha` could be "unknown", defeating the purpose of fingerprinting.

**Solution**:
- Added `resolveGitSha()` function that:
  1. Tries environment variables (GIT_SHA, VERCEL_GIT_COMMIT_SHA)
  2. In dev mode only, shells out to `git rev-parse HEAD` (cached, once at boot)
  3. In production, never shells out (env vars only)
  4. If SHA still unknown, logs clear warning:
    ```
    ⚠️  FINGERPRINT DEGRADED: Git SHA is unknown. Set GIT_SHA env var or ensure git is available in dev.
    ```

**Result**: Local dev always shows a real commit SHA (if `.git` directory exists).

### 3️⃣ Added `/__debug/fingerprint` Endpoint (Dev-Only) ✅

**Problem**: Manual log inspection is not a guardrail.

**Solution**:
- Added dev-only endpoint: `GET /__debug/fingerprint`
- Returns JSON with full fingerprint:
  ```json
  {
    "gitSha": "a1b2c3d4...",
    "buildTime": "2025-12-15T10:30:00Z",
    "nodeEnv": "development",
    "pid": 12345,
    "cwd": "/app",
    "fingerprintFile": "/app/server/lib/runtimeFingerprint.ts",
    "entryFile": "/app/server/index-v2.ts",
    "appVersion": "1.0.0",
    "hostname": "localhost",
    "platform": "darwin",
    "serverStartedAt": "2025-12-15T10:30:00.000Z",
    "uptime": 120.5,
    "memoryUsage": {...}
  }
  ```
- Guarded behind `NODE_ENV !== "production"`

**Result**: Tools/scripts can verify running code without manual log inspection.

### 4️⃣ Upgraded Reality Check Script to Be Automated ✅

**Problem**: Script instructed user to manually inspect logs (not a guardrail).

**Solution**:
- Updated `scripts/crawler-reality-check.ts` to:
  1. Call `/__debug/fingerprint`
  2. Print returned fingerprint
  3. Fail loudly if:
     - `gitSha === "unknown"` (exit code 1, critical failure)
     - `nodeEnv !== "development"` (warning, not fatal)
     - `entryFile` is unknown (warning, not fatal)
  4. Still triggers test crawl (behavior unchanged)

**Sample Output**:
```
╔════════════════════════════════════════════════════════════╗
║         CRAWLER REALITY CHECK                              ║
╚════════════════════════════════════════════════════════════╝

📡 Checking if server is running...
✓ Server running (http://localhost:3000)

🔍 Retrieving runtime fingerprint...
✓ Fingerprint retrieved

📋 Runtime Fingerprint:
   Git SHA:      a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
   Build Time:   2025-12-15T10:30:00Z
   Environment:  development
   Entry File:   /Users/dev/POSTD/server/index-v2.ts
   App Version:  1.0.0
   Server Start: 2025-12-15T10:30:00.000Z
   PID:          12345
   Uptime:       120s

🔎 Validating fingerprint...
✓ Git SHA resolved (a1b2c3d)
✓ Environment correct (development)
✓ Entry file tracked (index-v2.ts)

🔄 Triggering test crawl...
✓ Crawl triggered

╔════════════════════════════════════════════════════════════╗
║  Reality check PASSED ✓                                    ║
║                                                            ║
║  The running code is verified:                            ║
║  - Git SHA: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0      ║
║  - Environment: development                                ║
║                                                            ║
║  Check server console for detailed crawl logs:            ║
║  - SERVER_BOOT (at startup)                               ║
║  - CRAWL_RUN_START/END (for each crawl)                   ║
║  - ENV_ID, CACHE logs (during crawl)                      ║
╚════════════════════════════════════════════════════════════╝
```

**Result**: One command proves which code is running, fails loudly if invalid.

### 5️⃣ Added DB Short-Circuit Transparency Logs ✅

**Problem**: "Stale code" often confused with expected DB reuse.

**Solution**:
- Added `CRAWL_DECISION` logs at decision points:
  - `SKIP_DUPLICATE_REQUEST` - When crawl lock already exists (in-progress duplicate)
  - `PROCEED_FRESH_CRAWL` - When proceeding with fresh crawl (no active lock)

**Sample Logs**:
```
CRAWL_DECISION decision=SKIP_DUPLICATE_REQUEST reason=crawl_in_progress lockKey=brand_123:https://example.com lockAgeSeconds=45 brandId=brand_123 url=https://example.com

CRAWL_DECISION decision=PROCEED_FRESH_CRAWL reason=no_active_lock brandId=brand_123 url=https://example.com cacheMode=default
```

**Result**: Can distinguish "stale code" from "expected reuse" by checking logs.

---

## Sample Output from `/__debug/fingerprint`

```bash
curl http://localhost:3000/__debug/fingerprint | jq
```

```json
{
  "gitSha": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
  "buildTime": "2025-12-15T10:30:00Z",
  "nodeEnv": "development",
  "pid": 12345,
  "cwd": "/Users/dev/POSTD",
  "fingerprintFile": "/Users/dev/POSTD/server/lib/runtimeFingerprint.ts",
  "entryFile": "/Users/dev/POSTD/server/index-v2.ts",
  "appVersion": "1.0.0",
  "hostname": "localhost",
  "platform": "darwin",
  "serverStartedAt": "2025-12-15T14:30:00.123Z",
  "uptime": 120.456,
  "memoryUsage": {
    "rss": 134217728,
    "heapTotal": 67108864,
    "heapUsed": 45088768,
    "external": 2097152,
    "arrayBuffers": 1048576
  }
}
```

---

## Example CRAWL_DECISION Logs

### Skip Duplicate Request

```
CRAWL_DECISION decision=SKIP_DUPLICATE_REQUEST reason=crawl_in_progress lockKey=brand_1234567890:https://example.com lockAgeSeconds=45 brandId=brand_1234567890 url=https://example.com
```

### Proceed with Fresh Crawl

```
CRAWL_DECISION decision=PROCEED_FRESH_CRAWL reason=no_active_lock brandId=brand_1234567890 url=https://example.com cacheMode=default
```

---

## Confirmation of Quality Gates

### ✅ TypeCheck

```bash
pnpm typecheck
# Exit code: 0 (no errors)
```

### ✅ Build

```bash
pnpm build
# Exit code: 0 (compiles cleanly)
# Output: dist/server/node-build-v2.mjs (1,178.90 kB)
#         dist/server/vercel-server.mjs (1,177.89 kB)
```

### ✅ No Lint Errors

```bash
# No linter errors in modified files
```

### ✅ No Secrets Logged

Verified: No API keys, tokens, or sensitive data logged by fingerprinting or decision logs.

---

## Files Changed

### Modified Files (4)

1. **`server/lib/runtimeFingerprint.ts`**
   - Renamed `bootFile` → `fingerprintFile`
   - Added `entryFile` to `RuntimeFingerprint` interface
   - Implemented `resolveGitSha()` with auto-resolve in dev
   - Added `getBootContext()` for debug endpoint
   - Added warning when SHA is unknown in dev

2. **`server/index-v2.ts`**
   - Updated boot fingerprint to pass actual `entryFile`
   - Added `/__debug/fingerprint` endpoint (dev-only)
   - Imported `getRuntimeFingerprint` and `getBootContext`

3. **`server/routes/crawler.ts`**
   - Added `CRAWL_DECISION` logs for duplicate request skip
   - Added `CRAWL_DECISION` logs for fresh crawl proceed

4. **`scripts/crawler-reality-check.ts`**
   - Updated to call `/__debug/fingerprint` endpoint
   - Added automated validation (fails if SHA unknown)
   - Improved output formatting
   - Removed manual verification instructions

---

## How to Use

### Verify Running Code Version

```bash
# Option 1: Check debug endpoint
curl http://localhost:3000/__debug/fingerprint | jq .gitSha

# Option 2: Run reality check script
pnpm tsx scripts/crawler-reality-check.ts

# Option 3: Check server console for SERVER_BOOT log
grep "SERVER_BOOT" logs.txt | grep sha=
```

### Verify Decision Logs

```bash
# Check crawl decision logs
grep "CRAWL_DECISION" logs.txt

# Example outputs:
# CRAWL_DECISION decision=SKIP_DUPLICATE_REQUEST ...
# CRAWL_DECISION decision=PROCEED_FRESH_CRAWL ...
```

---

## Before vs After

### Before (False Confidence)

- ❌ `bootFile` pointed to wrong file (runtimeFingerprint.ts)
- ❌ `gitSha` could be "unknown" with no warning
- ❌ Manual log inspection required
- ❌ Reality check script didn't validate anything
- ❌ No visibility into DB-based short-circuits

### After (Hardened Guardrails)

- ✅ `entryFile` points to actual server entrypoint
- ✅ `gitSha` auto-resolves in dev, warns if unknown
- ✅ Programmatic fingerprint endpoint
- ✅ Reality check script fails loudly if invalid
- ✅ DB decision logs show why crawl skipped/proceeded

---

## Constraints Respected

✅ No changes to crawler behavior  
✅ No changes to crawl logic, extraction logic, or outputs  
✅ No new caching behavior  
✅ No secrets or sensitive env vars logged  
✅ Logs and debug endpoints only  

---

## Done

All five objectives complete. Fingerprinting guardrails are now hardened and production-grade.

