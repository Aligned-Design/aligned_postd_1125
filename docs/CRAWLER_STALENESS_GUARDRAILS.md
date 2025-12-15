# Crawler Staleness Guardrails

**Date**: 2025-12-15  
**Status**: ✅ COMPLETE  
**Purpose**: Diagnose and prevent "stale code" issues where crawler fixes don't take effect.

---

## Executive Summary

This document describes the **anti-staleness guardrails** added to the POSTD crawler to ensure we always know exactly which code version is running.

### Problem Solved

When crawler fixes are deployed, it's difficult to verify:
- Which git commit is actually running
- Whether we're executing stale built artifacts
- What environment (dev/staging/prod) is being used
- Whether caching is masking new behavior

### Solution

Added comprehensive runtime fingerprinting and diagnostics:

1. **Boot Fingerprint** - Logs exact code version when server starts
2. **Run Fingerprint** - Logs exact code version for every crawler run
3. **Environment Identity** - Logs environment details to prevent confusion
4. **Cache Transparency** - Logs cache behavior (currently no caching)
5. **Build Artifact Check** - Warns if running stale dist/ in dev mode
6. **Reality Check Script** - One-command verification tool

---

## What Was Found: Crawler Execution Mode

| Mode | Entry File | How Started | Where Logs Appear |
|------|-----------|-------------|-------------------|
| **API (sync)** | `server/routes/crawler.ts`<br>`POST /api/crawl/start` | Dev: `pnpm dev:server` → `tsx server/index-v2.ts`<br>Prod: `pnpm start` → `node dist/server/node-build-v2.mjs`<br>Vercel: `api/[...all].ts` → `dist/server/vercel-server.mjs` | Dev: Terminal console<br>Prod/Vercel: Vercel logs |
| **Worker logic** | `server/workers/brand-crawler.ts`<br>`processBrandIntake()` → `crawlWebsite()` | Called directly by API endpoint (no queue) | Same as above |

**Key Finding**: No queue-based execution. Crawler runs synchronously via API endpoint.

---

## What Was Added

### 1. Runtime Fingerprint Utility

**File**: `server/lib/runtimeFingerprint.ts`

**Functions**:
- `getRuntimeFingerprint()` - Returns current runtime identity
  - Git SHA (from env `GIT_SHA`, `VERCEL_GIT_COMMIT_SHA`)
  - Build time (from env `BUILD_TIME`, `VERCEL_BUILD_TIME`)
  - Node environment, PID, CWD, boot file, app version
  - Hostname (from env `VERCEL_REGION` or `HOSTNAME`)
  - Platform (from `process.platform`)

- `logBootFingerprint(tag, extra?)` - Logs boot identity once at server start
  - Outputs: `SERVER_BOOT sha=... build=... pid=... env=... bootFile=... version=... hostname=... platform=... cwd=...`

- `generateCrawlRunId()` - Generates unique run ID (format: `crawl_<timestamp>_<random>`)

- `logCrawlRunStart(runId, context)` - Logs crawl run start
  - Outputs: `CRAWL_RUN_START runId=... sha=... brandId=... url=... cacheMode=... tenantId=...`

- `logCrawlRunEnd(runId, result)` - Logs crawl run end
  - Outputs: `CRAWL_RUN_END runId=... status=... durationMs=... cacheHits=... pagesScraped=...`

**Integration**:
- `server/index-v2.ts` - Calls `logBootFingerprint("SERVER", ...)` at startup
- `server/routes/crawler.ts` - Calls `logCrawlRunStart()` and `logCrawlRunEnd()` for every crawl

### 2. Environment Identity Logging

**File**: `server/routes/crawler.ts` (in `runCrawlJobSync()`)

**Outputs**:
```
ENV_ID runId=crawl_123_abc nodeEnv=development supabaseHost=xxx.supabase.co projectRef=xxx
```

**Purpose**: Prevents staging/prod/preview confusion by explicitly logging:
- Node environment (`NODE_ENV`)
- Supabase host (parsed from `SUPABASE_URL`)
- Supabase project ref (first part of hostname)

### 3. Cache Transparency Logging

**File**: `server/routes/crawler.ts` (in `runCrawlJobSync()`)

**Outputs**:
```
CACHE runId=crawl_123_abc step=crawl-check hit=false mode=default reason=no-cache-implemented
CACHE runId=crawl_123_abc step=color-extraction hit=false mode=default reason=no-cache-implemented
CACHE runId=crawl_123_abc step=ai-generation hit=false mode=default reason=no-cache-implemented
```

**Purpose**: Shows cache behavior for each step. Currently all steps show `hit=false` (no caching implemented).

**Added Parameter**: `cacheMode` (values: `default` | `bypass` | `refresh`)
- Available in API endpoint: `POST /api/crawl/start` body
- Passed through to `runCrawlJobSync()`
- Currently not enforced (no caching exists), but parameter is ready for future use

### 4. Build Artifact Correctness Check

**File**: `server/index-v2.ts` (at server startup)

**Warning Output** (if running from dist/ in dev):
```
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
⚠️  WARNING: Running from dist/ in development mode
⚠️  You may be executing STALE compiled code!
⚠️  Expected: tsx server/index-v2.ts (source)
⚠️  Actual:   node dist/server/... (built)
⚠️  Action:   Run 'pnpm dev:server' to use live source
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
```

**Purpose**: Alerts developers if they're accidentally running stale built artifacts in dev mode.

### 5. Reality Check Script

**File**: `scripts/crawler-reality-check.ts`

**Usage**:
```bash
pnpm tsx scripts/crawler-reality-check.ts
pnpm tsx scripts/crawler-reality-check.ts --url https://example.com
```

**What it does**:
1. Checks if dev server is running (port 3000)
2. Triggers a minimal test crawl
3. Instructs user to verify fingerprint logs in server console
4. Exits non-zero if checks fail

**Expected Output**:
```
✓ Server running (http://localhost:3000)
✓ Crawl triggered

📋 MANUAL VERIFICATION REQUIRED:
   → Open your server console/terminal
   → Look for the log lines above
   → Verify the git SHA matches your current commit
   → Verify the environment matches (development/production)

Reality check COMPLETED ✓
```

---

## How to Use

### During Development

1. **Start dev server** (ensures you're running live source):
   ```bash
   pnpm dev:server
   ```

2. **Check boot logs** (should see `SERVER_BOOT` line):
   ```
   SERVER_BOOT sha=abc123 build=2025-12-15T10:30:00Z pid=12345 env=development bootFile=/app/server/index-v2.ts version=1.0.0 hostname=localhost platform=darwin cwd=/app
   ```

3. **Run reality check** (triggers test crawl):
   ```bash
   pnpm tsx scripts/crawler-reality-check.ts
   ```

4. **Verify fingerprints** in server console:
   - `CRAWL_RUN_START` - Shows git SHA, brand ID, URL, cache mode
   - `ENV_ID` - Shows environment, Supabase host
   - `CACHE` - Shows cache behavior
   - `CRAWL_RUN_END` - Shows run status, duration

### During Deployment

1. **Set environment variables** (for fingerprinting):
   ```bash
   export GIT_SHA=$(git rev-parse HEAD)
   export BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
   ```

2. **Build and deploy**:
   ```bash
   pnpm build
   pnpm start  # or deploy to Vercel
   ```

3. **Check production logs** (should see `SERVER_BOOT` line with correct SHA):
   ```
   SERVER_BOOT sha=abc123 build=2025-12-15T10:30:00Z pid=12345 env=production bootFile=/app/dist/server/node-build-v2.mjs version=1.0.0 hostname=iad1 platform=linux cwd=/app
   ```

### Debugging Stale Code Issues

If a fix doesn't take effect:

1. **Check git SHA in logs**:
   ```bash
   grep "SERVER_BOOT" logs.txt | grep sha=
   grep "CRAWL_RUN_START" logs.txt | grep sha=
   ```
   - Does the SHA match your latest commit?
   - If not, you're running old code

2. **Check build artifact warning**:
   - If you see "WARNING: Running from dist/ in development mode", run `pnpm dev:server` instead

3. **Check environment**:
   ```bash
   grep "ENV_ID" logs.txt
   ```
   - Verify you're in the right environment (dev/staging/prod)
   - Verify Supabase project ref matches expected environment

4. **Check cache logs**:
   ```bash
   grep "CACHE" logs.txt | grep hit=true
   ```
   - If you see `hit=true`, caching may be masking new behavior
   - Currently all should show `hit=false` (no caching)

---

## Sample Log Lines

### Server Boot

```
SERVER_BOOT sha=a1b2c3d4 build=2025-12-15T10:30:00Z pid=12345 env=development bootFile=/Users/dev/POSTD/server/index-v2.ts version=1.0.0 hostname=localhost platform=darwin cwd=/Users/dev/POSTD {"port":3000,"entryPoint":"index-v2.ts"}
```

### Crawl Run Start

```
CRAWL_RUN_START runId=crawl_1734270000123_a1b2c3 sha=a1b2c3d4 brandId=brand_1234567890 url=https://example.com cacheMode=default tenantId=550e8400-e29b-41d4-a716-446655440000 {"brandId":"brand_1234567890","url":"https://example.com","cacheMode":"default","tenantId":"550e8400-e29b-41d4-a716-446655440000","pid":12345}
```

### Environment ID

```
ENV_ID runId=crawl_1734270000123_a1b2c3 nodeEnv=development supabaseHost=xxx.supabase.co projectRef=xxx
```

### Cache Logs

```
CACHE runId=crawl_1734270000123_a1b2c3 step=crawl-check hit=false mode=default reason=no-cache-implemented
CACHE runId=crawl_1734270000123_a1b2c3 step=color-extraction hit=false mode=default reason=no-cache-implemented
CACHE runId=crawl_1734270000123_a1b2c3 step=ai-generation hit=false mode=default reason=no-cache-implemented
```

### Crawl Run End

```
CRAWL_RUN_END runId=crawl_1734270000123_a1b2c3 status=ok durationMs=5432 cacheHits=0 {"status":"ok","durationMs":5432,"cacheHits":0,"pagesScraped":5,"imagesExtracted":12,"colorsExtracted":8}
```

---

## Verification Commands

### Typecheck (must pass)

```bash
pnpm typecheck
```

### Build (must pass)

```bash
pnpm build
```

### Tests (must pass)

```bash
pnpm test
```

### Reality Check (must pass)

```bash
pnpm tsx scripts/crawler-reality-check.ts
```

Expected: Server responds, crawl triggered, user manually verifies logs.

### Grep for Fingerprint Logs

```bash
# Check if SERVER_BOOT logs exist
grep "SERVER_BOOT" logs.txt

# Check if CRAWL_RUN_START logs exist
grep "CRAWL_RUN_START" logs.txt

# Check if ENV_ID logs exist
grep "ENV_ID" logs.txt

# Check if CACHE logs exist
grep "CACHE" logs.txt

# Check if CRAWL_RUN_END logs exist
grep "CRAWL_RUN_END" logs.txt
```

---

## Files Changed

### New Files

- `server/lib/runtimeFingerprint.ts` - Runtime fingerprinting utility
- `scripts/crawler-reality-check.ts` - Reality check script
- `docs/CRAWLER_STALENESS_GUARDRAILS.md` - This document

### Modified Files

- `server/index-v2.ts` - Added boot fingerprint logging + stale dist warning
- `server/routes/crawler.ts` - Added run fingerprinting, environment ID, cache transparency

---

## Known Limitations

1. **No queue staleness guard**: Not applicable (crawler doesn't use queues)
2. **No persistent cache**: Currently all crawls are fresh (no caching implemented)
3. **Manual log verification**: Reality check script requires user to check server console
4. **Vercel environment variables**: May need to set `GIT_SHA` and `BUILD_TIME` in Vercel dashboard
5. **Auth bypass in reality check**: Reality check script bypasses auth (dev only)

---

## Security

✅ **No secrets logged**: Fingerprinting does not log:
- API keys (OpenAI, Anthropic, Supabase service key)
- Tokens
- Passwords
- Sensitive environment variables

Only non-sensitive metadata is logged (git SHA, build time, PID, environment name, etc.).

---

## Next Steps (Optional Enhancements)

1. **Persistent caching**: Implement DB-based caching (check `brand_kit.crawled_at`)
2. **Cache bypass API**: Implement `cacheMode=bypass` to force fresh crawl
3. **Run metadata storage**: Store crawl runs in `crawl_runs` table
4. **Automated log verification**: Enhance reality check script to parse logs
5. **Vercel build integration**: Auto-set `GIT_SHA` and `BUILD_TIME` in build process
6. **Dashboard**: Web UI to view recent crawl runs and their fingerprints

---

## Conclusion

All required phases complete:

- ✅ Phase 0: Crawler entrypoints documented
- ✅ Phase 1: Boot & run fingerprints implemented
- ✅ Phase 2: Environment identity logging implemented
- ✅ Phase 3: Cache transparency implemented
- ✅ Phase 4: Queue staleness guard (N/A - no queue)
- ✅ Phase 5: Build artifact correctness checks implemented
- ✅ Phase 6: Reality check script created
- ✅ Phase 7: Quality gates passed (typecheck, tests, no secrets)

**Result**: You can now prove which code version is running at any time by checking logs for `SERVER_BOOT` and `CRAWL_RUN_START` lines.

