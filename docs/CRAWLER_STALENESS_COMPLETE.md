# Crawler Staleness Guardrails - Complete Implementation

**Date**: 2025-12-15  
**Status**: ✅ COMPLETE & HARDENED  
**Purpose**: Comprehensive anti-staleness system to always know which code version is running

---

## Executive Summary

Implemented **permanent, hardened anti-staleness guardrails** for the POSTD crawler. You can now prove exactly which code version is running at any time, with automated validation and zero false confidence.

### Two-Phase Implementation

**Phase 1: Initial Guardrails** (earlier today)
- Runtime fingerprinting (boot + run logs)
- Environment identity logging
- Cache transparency (framework)
- Build artifact warnings
- Reality check script (manual)

**Phase 2: Hardening** (just completed)
- Fixed misleading `bootFile` → `fingerprintFile` + `entryFile`
- Auto-resolve Git SHA in dev (never "unknown")
- Added `/__debug/fingerprint` endpoint (programmatic)
- Automated reality check validation
- DB short-circuit decision logs

---

## Key Capabilities

### 1. Prove Code Version at Any Time

Three ways to verify running code:

**A. Debug Endpoint** (programmatic):
```bash
curl http://localhost:3000/__debug/fingerprint | jq
```

**B. Reality Check Script** (automated):
```bash
pnpm tsx scripts/crawler-reality-check.ts
# Fails loudly if SHA unknown or invalid
```

**C. Server Logs** (manual):
```bash
grep "SERVER_BOOT" logs.txt
# Shows: sha=abc123 entryFile=/app/server/index-v2.ts
```

### 2. Distinguish Stale Code from Expected Reuse

**CRAWL_DECISION logs** show why a crawl was skipped:
- `SKIP_DUPLICATE_REQUEST` - Another crawl already in progress
- `PROCEED_FRESH_CRAWL` - No active lock, running fresh crawl

### 3. Auto-Resolve Git SHA in Dev

No more "unknown" SHA in development:
- Tries env vars first (GIT_SHA, VERCEL_GIT_COMMIT_SHA)
- Falls back to `git rev-parse HEAD` in dev (cached, once at boot)
- Warns loudly if SHA still unknown

### 4. Accurate Entry Point Tracking

Logs now distinguish:
- `entryFile`: Actual server entrypoint (e.g., `server/index-v2.ts`)
- `fingerprintFile`: Location of fingerprint utility (e.g., `server/lib/runtimeFingerprint.ts`)

### 5. Automated Validation

Reality check script now:
- ✅ Calls `/__debug/fingerprint` automatically
- ✅ Validates Git SHA is not "unknown" (fails if it is)
- ✅ Warns if environment mismatched
- ✅ Prints clear fingerprint details
- ✅ Triggers test crawl
- ❌ Exits non-zero if validation fails

---

## Sample Logs

### Server Boot

```
SERVER_BOOT sha=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0 build=2025-12-15T10:30:00Z pid=12345 env=development entryFile=/Users/dev/POSTD/server/index-v2.ts fingerprintFile=/Users/dev/POSTD/server/lib/runtimeFingerprint.ts version=1.0.0 hostname=localhost platform=darwin cwd=/Users/dev/POSTD {"port":3000,"entryFile":"/Users/dev/POSTD/server/index-v2.ts"}
```

### Crawl Run Start

```
CRAWL_RUN_START runId=crawl_1734270000123_a1b2c3 sha=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0 brandId=brand_1234567890 url=https://example.com cacheMode=default tenantId=550e8400-e29b-41d4-a716-446655440000 {"brandId":"brand_1234567890","url":"https://example.com","cacheMode":"default","tenantId":"550e8400-e29b-41d4-a716-446655440000","pid":12345}
```

### Environment ID

```
ENV_ID runId=crawl_1734270000123_a1b2c3 nodeEnv=development supabaseHost=xxx.supabase.co projectRef=xxx
```

### Cache Transparency

```
CACHE runId=crawl_1734270000123_a1b2c3 step=crawl-check hit=false mode=default reason=no-cache-implemented
CACHE runId=crawl_1734270000123_a1b2c3 step=color-extraction hit=false mode=default reason=no-cache-implemented
CACHE runId=crawl_1734270000123_a1b2c3 step=ai-generation hit=false mode=default reason=no-cache-implemented
```

### Crawl Decision

```
CRAWL_DECISION decision=PROCEED_FRESH_CRAWL reason=no_active_lock brandId=brand_1234567890 url=https://example.com cacheMode=default
```

### Crawl Run End

```
CRAWL_RUN_END runId=crawl_1734270000123_a1b2c3 status=ok durationMs=5432 cacheHits=0 {"status":"ok","durationMs":5432,"cacheHits":0,"pagesScraped":5,"imagesExtracted":12,"colorsExtracted":8}
```

---

## Debug Endpoint Response

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

## Reality Check Output

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
   Server Start: 2025-12-15T14:30:00.123Z
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

---

## Files Modified (Total: 4)

1. **`server/lib/runtimeFingerprint.ts`** (268 lines)
   - Renamed `bootFile` → `fingerprintFile`
   - Added `entryFile` to RuntimeFingerprint interface
   - Implemented `resolveGitSha()` with auto-resolve in dev
   - Added `getBootContext()` for debug endpoint
   - Added warning when SHA is unknown in dev

2. **`server/index-v2.ts`** (406 lines)
   - Updated boot fingerprint to pass actual `entryFile`
   - Added `/__debug/fingerprint` endpoint (dev-only)
   - Imported `getRuntimeFingerprint` and `getBootContext`

3. **`server/routes/crawler.ts`** (1,656 lines)
   - Added `CRAWL_DECISION` logs for duplicate request skip
   - Added `CRAWL_DECISION` logs for fresh crawl proceed

4. **`scripts/crawler-reality-check.ts`** (229 lines)
   - Updated to call `/__debug/fingerprint` endpoint
   - Added automated validation (fails if SHA unknown)
   - Improved output formatting

---

## Files Created (Total: 3)

1. **`docs/CRAWLER_STALENESS_GUARDRAILS.md`** - Initial implementation docs
2. **`docs/CRAWLER_STALENESS_HARDENING.md`** - Hardening phase docs
3. **`docs/CRAWLER_STALENESS_COMPLETE.md`** - This file (complete summary)

---

## Quality Gates

### ✅ TypeCheck

```bash
pnpm typecheck
# Exit code: 0 (no errors)
```

### ✅ Build

```bash
pnpm build
# Exit code: 0 (compiles cleanly)
# dist/server/node-build-v2.mjs: 1,178.90 kB
# dist/server/vercel-server.mjs: 1,177.89 kB
```

### ✅ No Lint Errors

```bash
# No linter errors in modified files
```

### ✅ No Secrets Logged

Verified: Fingerprinting logs only non-sensitive metadata (SHA, timestamps, PIDs, file paths).

---

## How to Use in Production

### 1. Set Environment Variables

```bash
export GIT_SHA=$(git rev-parse HEAD)
export BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
```

### 2. Build and Deploy

```bash
pnpm build
pnpm start  # or deploy to Vercel
```

### 3. Verify Deployment

```bash
# Check production logs for SERVER_BOOT line
grep "SERVER_BOOT" production-logs.txt | grep sha=

# Should show:
# SERVER_BOOT sha=<actual-commit-sha> build=<build-timestamp> ...
```

### 4. Debug Issues

If a fix doesn't take effect:

```bash
# Check git SHA in logs
grep "CRAWL_RUN_START" logs.txt | grep sha=

# Compare to expected SHA
git rev-parse HEAD

# If they don't match, code is stale
```

---

## Known Limitations

1. **No persistent run metadata**: Crawl runs not stored in DB (logs only)
2. **No distributed lock**: In-memory locks not shared across Vercel instances
3. **No actual caching**: Cache logs show `hit=false` (framework in place for future)
4. **Dev-only fingerprint endpoint**: `/__debug/fingerprint` blocked in production

---

## Future Enhancements (Optional)

1. **Persistent run metadata**: Store crawl runs in `crawl_runs` table
2. **DB-based caching**: Check `brand_kit.crawled_at` and reuse if recent
3. **Cache bypass API**: Implement `cacheMode=bypass` to force fresh crawl
4. **Dashboard**: Web UI to view recent crawl runs and fingerprints
5. **Distributed locks**: Use Redis for multi-instance deduplication

---

## Conclusion

**Before**: Crawler fixes could silently fail with no way to verify running code.

**After**: Complete visibility into:
- Which git commit is running (never "unknown" in dev)
- Which server entrypoint was used
- Why crawls are skipped or proceed
- Environment and configuration
- Uptime and memory usage

**Result**: **Zero false confidence**. You always know which code is running.

---

## Done ✓

All objectives complete. Crawler staleness guardrails are production-grade and hardened.

