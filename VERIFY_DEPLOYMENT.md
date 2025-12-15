# Crawler Staleness Guardrails - Deployment Verification

**Commit**: `30e9d8e`  
**Deployed**: 2025-12-15  
**Status**: ✅ Shipped to main

---

## Pre-Verification Setup

### 1. Set Reality Check Token (Dev Only)

Add to `.env` (never commit):
```bash
REALITY_CHECK_TOKEN=your-secret-dev-token-here
```

**Generate a secure token**:
```bash
# Option 1: Random hex string
openssl rand -hex 32

# Option 2: UUID
uuidgen

# Option 3: Base64
openssl rand -base64 32
```

---

## Local Development Verification

### Quick Verification (Automated)

```bash
# Terminal 1: Start server
pnpm dev:server

# Terminal 2: Run verification
./scripts/verify-staleness-guardrails.sh
```

**Expected Output**:
```
✅ PASS: Rejected without token (HTTP 401/403)
✅ PASS: Fingerprint retrieved successfully
   Git SHA: abc1234
   Node ENV: development
   Entry File: index-v2.ts
✅ PASS: Reality check script succeeded
```

---

### Manual Verification Steps

#### Test 1: Fingerprint Without Token (Should Fail)
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/__debug/fingerprint
```
**Expected**: `401` or `403`

---

#### Test 2: Fingerprint With Token (Should Succeed)
```bash
curl -H "x-reality-check-token: $REALITY_CHECK_TOKEN" \
  http://localhost:3000/__debug/fingerprint | jq
```

**Expected Output**:
```json
{
  "gitSha": "30e9d8e...",
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
  "uptime": 120.456
}
```

**Verify**:
- ✅ `gitSha` is not "unknown"
- ✅ `gitSha` matches `git rev-parse HEAD`
- ✅ `gitSha` is valid hex format (7-40 chars)
- ✅ `entryFile` contains "index-v2.ts"
- ✅ `nodeEnv` is "development"

---

#### Test 3: Reality Check Script
```bash
pnpm tsx scripts/crawler-reality-check.ts
echo $?
```

**Expected**: Exit code `0`

**Check Output For**:
```
✓ Server reachable
✓ Git SHA resolved (30e9d8e)
✓ Environment correct (development)
✓ Entry file tracked (index-v2.ts)
```

---

#### Test 4: CRAWL_DECISION Logs

**Trigger Two Crawls (Same Brand + URL)**:
```bash
# First crawl (fresh)
curl -X POST "http://localhost:3000/api/crawl/start?sync=true" \
  -H "Content-Type: application/json" \
  -H "x-reality-check-token: $REALITY_CHECK_TOKEN" \
  -d '{"url": "https://example.com", "brand_id": "test_verify", "cacheMode": "default"}'

# Second crawl (cached)
curl -X POST "http://localhost:3000/api/crawl/start?sync=true" \
  -H "Content-Type: application/json" \
  -H "x-reality-check-token: $REALITY_CHECK_TOKEN" \
  -d '{"url": "https://example.com", "brand_id": "test_verify", "cacheMode": "default"}'
```

**Check Server Console For**:

**First Crawl (Fresh)**:
```
SERVER_BOOT sha=30e9d8e... entryFile=server/index-v2.ts
CRAWL_RUN_START runId=crawl_... sha=30e9d8e... brandId=test_verify url=https://example.com
ENV_ID runId=crawl_... nodeEnv=development supabaseHost=...
CRAWL_DECISION decision=PROCEED_FRESH_CRAWL reason=no_active_lock ...
CRAWL_DECISION decision=PROCEED_ASSET_EXTRACTION reason=no_assets_persisted count=0 ...
CRAWL_DECISION decision=PROCEED_IMAGE_PERSISTENCE reason=no_assets_found count=0 ...
CRAWL_DECISION decision=PROCEED_BRANDKIT_UPDATE reason=missing_fields ...
CRAWL_RUN_END runId=crawl_... status=ok durationMs=... imagesExtracted=...
```

**Second Crawl (Cached)**:
```
CRAWL_RUN_START runId=crawl_... sha=30e9d8e... brandId=test_verify url=https://example.com
CRAWL_DECISION decision=SKIP_ASSET_EXTRACTION reason=assets_persisted count=12 ...
CRAWL_RUN_END runId=crawl_... status=ok durationMs=... cached=true
```

**Or (if extraction proceeded but persistence skipped)**:
```
CRAWL_DECISION decision=PROCEED_ASSET_EXTRACTION reason=no_assets_persisted ...
CRAWL_DECISION decision=SKIP_IMAGE_PERSISTENCE reason=assets_exist count=12 ...
CRAWL_DECISION decision=SKIP_BRANDKIT_UPDATE reason=fields_populated fields=["about_blurb","colors"] ...
```

---

## Production/Staging Verification

### Prerequisites

**Production does NOT have**:
- ❌ `/__debug/fingerprint` endpoint (blocked in production)
- ❌ Reality check auth bypass (requires dev mode)

**Production DOES have**:
- ✅ `SERVER_BOOT` logs
- ✅ `CRAWL_RUN_START/END` logs
- ✅ `CRAWL_DECISION` logs
- ✅ `ENV_ID` logs

---

### Verification via Logs

#### 1. Verify Fingerprint Logs

**Command** (adjust for your logging service):
```bash
# Vercel
vercel logs --filter "SERVER_BOOT"

# CloudWatch
aws logs filter-log-events --log-group-name /aws/lambda/crawler --filter-pattern "SERVER_BOOT"

# Local file
grep "SERVER_BOOT" /var/log/app.log
```

**Expected Output**:
```
SERVER_BOOT sha=30e9d8e... build=2025-12-15T10:30:00Z pid=1 env=production entryFile=dist/server/vercel-server.mjs version=1.0.0 hostname=sfo1 platform=linux cwd=/var/task
```

**Verify**:
- ✅ `sha=30e9d8e` (matches deployed commit)
- ✅ `env=production`
- ✅ `build=<recent-timestamp>`

---

#### 2. Verify Crawl Run Logs

**Command**:
```bash
grep "CRAWL_RUN_START" logs.txt | head -5
grep "CRAWL_RUN_END" logs.txt | head -5
```

**Expected Output**:
```
CRAWL_RUN_START runId=crawl_abc123 sha=30e9d8e brandId=brand_123 url=https://example.com cacheMode=default
CRAWL_RUN_END runId=crawl_abc123 status=ok durationMs=3456 pagesScraped=1 imagesExtracted=12 colorsExtracted=6
```

**Verify**:
- ✅ `sha=30e9d8e` (matches deployed commit)
- ✅ `runId` is unique per crawl
- ✅ Every `START` has matching `END`

---

#### 3. Verify Decision Logs

**Command**:
```bash
grep "CRAWL_DECISION" logs.txt | tail -20
```

**Expected Patterns**:
```
CRAWL_DECISION decision=PROCEED_FRESH_CRAWL reason=no_active_lock brandId=...
CRAWL_DECISION decision=SKIP_DUPLICATE_REQUEST reason=crawl_in_progress lockAgeSeconds=45 ...
CRAWL_DECISION decision=PROCEED_ASSET_EXTRACTION reason=no_assets_persisted count=0 ...
CRAWL_DECISION decision=SKIP_ASSET_EXTRACTION reason=assets_persisted count=12 ...
CRAWL_DECISION decision=PROCEED_IMAGE_PERSISTENCE reason=no_assets_found count=0 ...
CRAWL_DECISION decision=SKIP_IMAGE_PERSISTENCE reason=assets_exist count=12 ...
CRAWL_DECISION decision=PROCEED_BRANDKIT_UPDATE reason=missing_fields fields=[...] ...
CRAWL_DECISION decision=SKIP_BRANDKIT_UPDATE reason=fields_populated fields=[...] ...
```

**Verify**:
- ✅ 7 different decision types present
- ✅ Skip decisions only when expected (duplicate, cache exists)
- ✅ Proceed decisions for fresh crawls

---

#### 4. Verify Environment Identity

**Command**:
```bash
grep "ENV_ID" logs.txt | head -5
```

**Expected Output**:
```
ENV_ID runId=crawl_... nodeEnv=production supabaseHost=abcdefg.supabase.co projectRef=abcdefg
```

**Verify**:
- ✅ `nodeEnv=production` (not development)
- ✅ `supabaseHost` matches your production Supabase
- ✅ `projectRef` is correct

---

## Troubleshooting

### Issue: "Git SHA is unknown"

**Symptoms**:
```
SERVER_BOOT sha=unknown ...
```

**Cause**: Neither `GIT_SHA` nor `VERCEL_GIT_COMMIT_SHA` env vars set, and git not available in production.

**Fix**:
1. **Vercel**: SHA auto-set, check deployment logs
2. **Other**: Set `GIT_SHA` in CI/CD:
   ```bash
   export GIT_SHA=$(git rev-parse HEAD)
   ```

---

### Issue: "Reality check bypass not working"

**Symptoms**:
```
curl: HTTP 401 (with token)
```

**Check**:
1. Is `REALITY_CHECK_TOKEN` set in `.env`?
   ```bash
   echo $REALITY_CHECK_TOKEN
   ```
2. Is server in dev mode?
   ```bash
   grep "nodeEnv=development" server-output.txt
   ```
3. Is token correct in curl command?
   ```bash
   curl -H "x-reality-check-token: $REALITY_CHECK_TOKEN" ...
   ```

---

### Issue: "No CRAWL_DECISION logs"

**Symptoms**:
```
grep "CRAWL_DECISION" logs.txt
# (no output)
```

**Check**:
1. Is this commit deployed?
   ```bash
   grep "SERVER_BOOT.*sha=30e9d8e" logs.txt
   ```
2. Have any crawls run since deployment?
   ```bash
   grep "CRAWL_RUN_START" logs.txt
   ```
3. Are logs being captured?
   ```bash
   grep "Crawler" logs.txt | head -20
   ```

---

### Issue: "Cache not working (always fresh)"

**Symptoms**:
```
# Second crawl still shows PROCEED (not SKIP)
CRAWL_DECISION decision=PROCEED_ASSET_EXTRACTION reason=no_assets_persisted ...
```

**Expected**: This is correct! Cache only activates after successful first crawl + asset persistence.

**Verify assets persisted**:
```sql
SELECT COUNT(*) FROM media_assets 
WHERE brand_id = 'test_brand' 
  AND metadata->>'source' = 'scrape';
```

If count = 0, first crawl failed to persist. Check:
1. `tenantId` present in request?
2. Persistence logs show errors?
   ```bash
   grep "CRITICAL.*Cannot persist images" logs.txt
   ```

---

## Success Criteria

✅ **Local Dev**:
- [ ] Automated verification script passes
- [ ] Fingerprint endpoint works with token, fails without
- [ ] Reality check script exits 0
- [ ] Second crawl shows SKIP decisions

✅ **Production**:
- [ ] `SERVER_BOOT` logs show correct SHA
- [ ] `CRAWL_RUN_START/END` logs present
- [ ] `CRAWL_DECISION` logs show 7 decision types
- [ ] `ENV_ID` logs show production environment

✅ **Functionality**:
- [ ] Can identify which code version handled any crawl
- [ ] Can see why crawls skip vs proceed
- [ ] Can force fresh crawl with `cacheMode=bypass`
- [ ] Can debug staleness issues from logs alone

---

## Next Steps After Verification

1. **Add to runbook**: Document these verification steps
2. **Set up monitoring**: Alert on `sha=unknown` or missing logs
3. **Train team**: Show how to use `grep "runId=..."` for debugging
4. **Iterate**: Add more decision points as needed

---

**Questions?** Check audit packet: `docs/CRAWLER_STALENESS_HARDENING_AUDIT_PACKET.md`

