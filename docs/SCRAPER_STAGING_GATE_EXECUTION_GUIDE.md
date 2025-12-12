# SCRAPER STAGING GATE - EXECUTION GUIDE

**Purpose:** Real execution of 5 staging scenarios to prove scraper is production-ready.  
**Owner:** YOU (the human running these commands)  
**Duration:** ~30-45 minutes  
**Prerequisites:** Local dev environment OR staging Supabase access

---

## ⚠️ IMPORTANT: AI Cannot Execute These Commands

**The AI prepared this guide but CANNOT run these commands for you.**

You must:
1. Copy-paste commands into your terminal
2. Capture outputs (logs + DB results)
3. Paste results back to validate
4. Fix any failures and re-run

---

## STEP 0: Prepare Environment

### Option A: Local Supabase (Recommended for Testing)

**Why:** Fastest, no prod data risk, full control

**Setup:**

```bash
# 1. Install Supabase CLI if not present
# See: https://supabase.com/docs/guides/cli/getting-started

# 2. Start local Supabase
supabase start
# ✅ This will output local credentials - copy them!

# 3. Run migrations
supabase db reset

# 4. Create .env.local
cat > .env.local << 'EOF'
# Supabase (from `supabase start` output)
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<from supabase start output>
SUPABASE_SERVICE_ROLE_KEY=<from supabase start output>
SUPABASE_URL=http://127.0.0.1:54321

# Application
NODE_ENV=development
PORT=8080
VITE_APP_URL=http://localhost:8080
VITE_API_BASE_URL=http://localhost:8080/api

# AI (REQUIRED for scraper)
OPENAI_API_KEY=sk-your-openai-key
# OR
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
AI_PROVIDER=auto

# Optional (for better extraction)
CRAWL_MAX_PAGES=10
CRAWL_TIMEOUT_MS=60000
EOF

# 5. Install dependencies
pnpm install

# 6. Start dev server (in separate terminal)
pnpm dev
# Server will be at http://localhost:8080

# 7. Verify server is running
curl http://localhost:8080/api/ping
# Expected: {"message":"pong",...}
```

**Verification Checklist:**

- [ ] `supabase start` succeeded
- [ ] `.env.local` created with correct credentials
- [ ] `pnpm dev` running without errors
- [ ] `curl http://localhost:8080/api/ping` returns 200

---

### Option B: Staging Supabase

**Why:** Tests against real staging data

**Setup:**

```bash
# 1. Get staging credentials from team/secrets manager
# Required env vars:
# - VITE_SUPABASE_URL (staging URL)
# - SUPABASE_SERVICE_ROLE_KEY (staging service role key)
# - OPENAI_API_KEY or ANTHROPIC_API_KEY

# 2. Create .env.staging
cat > .env.staging << 'EOF'
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=<staging anon key>
SUPABASE_SERVICE_ROLE_KEY=<staging service role key>
SUPABASE_URL=https://your-staging-project.supabase.co

NODE_ENV=staging
PORT=8080

OPENAI_API_KEY=<your openai key>
# OR
ANTHROPIC_API_KEY=<your anthropic key>
EOF

# 3. Start server with staging env
NODE_ENV=staging pnpm dev

# 4. Verify staging connection
curl http://localhost:8080/api/ping
```

---

## STEP 1: Run 5 Staging Scenarios

### Scenario 1: Fast Site (Baseline Success)

**Goal:** Confirm success path under easy conditions

**URL to test:** `https://example.com` (or any fast-loading site)

**Commands:**

```bash
# Create test brand in DB first
pnpm tsx scripts/seed-minimal-postd.ts
# ☝️ This creates a test tenant + brand, outputs brandId

# OR manually via SQL:
psql $SUPABASE_URL -c "
INSERT INTO tenants (id, name) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Test Tenant')
  ON CONFLICT (id) DO NOTHING;

INSERT INTO brands (id, tenant_id, name, created_at, updated_at) VALUES 
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Test Brand 1', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
"

# Run scrape via test script
SCRAPER_TEST_URL=https://example.com \
SCRAPER_TEST_BRAND_ID=11111111-1111-1111-1111-111111111111 \
pnpm tsx scripts/test-crawl-endpoint.ts

# ⬆️ Capture this output!
```

**What to verify in output:**

```
✅ Look for:
- "✅ Request succeeded!"
- Status: 200
- Response body includes: { "success": true, "brandKit": {...} }

📋 Copy these values:
- brandId: <the UUID used>
- Response latency: <milliseconds>
- brandKit.identity.name: <should be "Example Domain" or similar>
- brandKit.visualIdentity.colors: <array of hex colors>
```

**DB Verification:**

```bash
# Query 1: Check brand_kit was written
psql $SUPABASE_URL -c "
SELECT 
  id,
  brand_kit IS NOT NULL as has_brand_kit,
  brand_kit->'identity'->>'name' as brand_name,
  jsonb_array_length(brand_kit->'visualIdentity'->'colors') as color_count,
  voice_summary,  -- Should be NULL
  visual_summary, -- Should be NULL
  tone_keywords   -- Should be NULL
FROM brands 
WHERE id = '11111111-1111-1111-1111-111111111111';
"

# Expected output:
#  id                                   | has_brand_kit | brand_name     | color_count | voice_summary | visual_summary | tone_keywords
# --------------------------------------+---------------+----------------+-------------+---------------+----------------+---------------
#  11111111-1111-1111-1111-111111111111 | t             | Example Domain |           3 |               |                |
```

**PASS CRITERIA:**

- [x] HTTP 200 response
- [x] `has_brand_kit = true`
- [x] `color_count >= 2`
- [x] `voice_summary`, `visual_summary`, `tone_keywords` all NULL ✅
- [x] Scrape completed in < 60s

**📸 CAPTURE FOR REPORT:**

```
Paste here:
- Command output (first 50 lines)
- DB query result
- Any errors/warnings
```

---

### Scenario 2: JS-Heavy Site (Squarespace/Wix)

**Goal:** Confirm Playwright handles lazy-loaded images

**URL to test:** A Squarespace or Wix site (pick one from client list OR use https://www.squarespace.com)

**Commands:**

```bash
# Create brand #2
psql $SUPABASE_URL -c "
INSERT INTO brands (id, tenant_id, name, created_at, updated_at) VALUES 
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'Test Brand 2 JS-Heavy', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
"

# Run scrape
SCRAPER_TEST_URL=https://www.squarespace.com \
SCRAPER_TEST_BRAND_ID=22222222-2222-2222-2222-222222222222 \
pnpm tsx scripts/test-crawl-endpoint.ts
```

**What to verify in logs:**

```
✅ Look for:
- "[Crawler] Host-aware extraction" with "host: squarespace"
- "[ScrapedImages] ✅ Persistence complete"
- "imagesPersisted: X" (X > 0)
```

**DB Verification:**

```bash
# Check images were persisted
psql $SUPABASE_URL -c "
SELECT 
  category,
  COUNT(*) as image_count
FROM media_assets
WHERE brand_id = '22222222-2222-2222-2222-222222222222'
  AND (path LIKE 'http%' OR path LIKE 'https%')  -- Scraped images have HTTP URLs
GROUP BY category;
"

# Expected:
#  category | image_count
# ----------+-------------
#  logos    |           1-2
#  images   |           5-15
```

**PASS CRITERIA:**

- [x] Host detected: `host: squarespace` (or wix)
- [x] Images persisted > 0
- [x] No errors about missing images

**📸 CAPTURE FOR REPORT:**

```
Paste:
- Host detection log line
- Image count from DB query
```

---

### Scenario 3: Slow/Heavy Site (Timeout Handling)

**Goal:** Confirm retry logic + graceful degradation

**URL to test:** A known slow site OR use a large e-commerce site

**Commands:**

```bash
# Create brand #3
psql $SUPABASE_URL -c "
INSERT INTO brands (id, tenant_id, name, created_at, updated_at) VALUES 
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'Test Brand 3 Slow', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
"

# Run scrape (may take 30-60s)
SCRAPER_TEST_URL=https://www.amazon.com \
SCRAPER_TEST_BRAND_ID=33333333-3333-3333-3333-333333333333 \
pnpm tsx scripts/test-crawl-endpoint.ts
```

**What to verify in logs:**

```
✅ Look for:
- Retry messages: "[Crawler] Failed to load page... retrying"
- Partial success: "[Crawler] Crawl complete: X pages crawled" (X < 10)
- "[Crawler] ✅ BrandKit saved" (even with partial data)
```

**PASS CRITERIA:**

- [x] Scrape completes (doesn't hang forever)
- [x] Retry logic visible in logs
- [x] brand_kit written (even if partial)
- [x] No 500 errors

**📸 CAPTURE FOR REPORT:**

```
Paste:
- Retry log lines
- Final "BrandKit saved" log
```

---

### Scenario 4: Re-scrape Merge Preservation ⭐ **CRITICAL**

**Goal:** PROVE user edits are preserved (this is the blocker we fixed!)

**Steps:**

```bash
# 1. Re-use brand from Scenario 1
BRAND_ID=11111111-1111-1111-1111-111111111111

# 2. Manually edit brand_kit to simulate user changes
psql $SUPABASE_URL -c "
UPDATE brands
SET brand_kit = jsonb_set(
  jsonb_set(
    brand_kit,
    '{identity,values}',
    '[\"MANUAL_VALUE_1\", \"MANUAL_VALUE_2\", \"MANUAL_VALUE_3\"]'
  ),
  '{identity,sampleHeadlines}',
  '[\"MANUAL_HEADLINE_1\", \"MANUAL_HEADLINE_2\"]'
)
WHERE id = '$BRAND_ID';
"

# 3. Verify manual edits were saved
psql $SUPABASE_URL -c "
SELECT 
  brand_kit->'identity'->>'values' as values,
  brand_kit->'identity'->>'sampleHeadlines' as headlines
FROM brands 
WHERE id = '$BRAND_ID';
"
# Expected:
#  values                                                    | headlines
# -----------------------------------------------------------+---------------------------------------
#  ["MANUAL_VALUE_1", "MANUAL_VALUE_2", "MANUAL_VALUE_3"]  | ["MANUAL_HEADLINE_1", "MANUAL_HEADLINE_2"]

# 4. Re-run scrape (same URL as Scenario 1)
SCRAPER_TEST_URL=https://example.com \
SCRAPER_TEST_BRAND_ID=$BRAND_ID \
pnpm tsx scripts/test-crawl-endpoint.ts

# 5. Check logs for preservation message ⭐
# Look for: "[Crawler] 🛡️ Preserved 2 existing brand field(s) during merge: identity.values, identity.sampleHeadlines"
```

**DB Verification (CRITICAL):**

```bash
# Query after re-scrape
psql $SUPABASE_URL -c "
SELECT 
  brand_kit->'identity'->>'values' as values_after,
  brand_kit->'identity'->>'sampleHeadlines' as headlines_after
FROM brands 
WHERE id = '$BRAND_ID';
"

# EXPECTED (user edits preserved):
#  values_after                                              | headlines_after
# -----------------------------------------------------------+---------------------------------------
#  ["MANUAL_VALUE_1", "MANUAL_VALUE_2", "MANUAL_VALUE_3"]  | ["MANUAL_HEADLINE_1", "MANUAL_HEADLINE_2"]

# ❌ FAILURE if values/headlines are empty or different!
```

**PASS CRITERIA (ALL MUST PASS):**

- [x] Log shows: `🛡️ Preserved X existing brand field(s)`
- [x] DB shows: `values_after` still contains "MANUAL_VALUE_1"
- [x] DB shows: `headlines_after` still contains "MANUAL_HEADLINE_1"

**📸 CAPTURE FOR REPORT:**

```
CRITICAL - Paste:
- The "🛡️ Preserved..." log line (MUST be present!)
- DB query result showing manual values preserved
```

---

### Scenario 5: No AI Key Fallback

**Goal:** Confirm scraper completes without AI

**Steps:**

```bash
# 1. Create brand #4
psql $SUPABASE_URL -c "
INSERT INTO brands (id, tenant_id, name, created_at, updated_at) VALUES 
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', 'Test Brand 4 Fallback', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
"

# 2. Temporarily disable AI keys (ONLY for this test!)
# Edit .env.local:
# Comment out: # OPENAI_API_KEY=...
# Comment out: # ANTHROPIC_API_KEY=...

# OR use env override:
OPENAI_API_KEY="" ANTHROPIC_API_KEY="" \
SCRAPER_TEST_URL=https://example.com \
SCRAPER_TEST_BRAND_ID=44444444-4444-4444-4444-444444444444 \
pnpm tsx scripts/test-crawl-endpoint.ts

# 3. Restore AI keys after test!
```

**What to verify in logs:**

```
✅ Look for:
- "[Crawler] ❌ AI brand kit generation failed" OR similar
- "[Crawler] ✅ BrandKit saved" (fallback succeeded)
- voiceAndTone.tone should have fallback: ["professional", "trustworthy"]
```

**DB Verification:**

```bash
psql $SUPABASE_URL -c "
SELECT 
  brand_kit->'voiceAndTone'->>'tone' as tone
FROM brands 
WHERE id = '44444444-4444-4444-4444-444444444444';
"

# Expected (fallback tone):
#  tone
# --------------------------------
#  ["professional", "trustworthy"]
```

**PASS CRITERIA:**

- [x] Scraper doesn't crash
- [x] brand_kit written (with fallback data)
- [x] tone = ["professional", "trustworthy"]

**📸 CAPTURE FOR REPORT:**

```
Paste:
- AI failure log line
- "BrandKit saved" log
- Fallback tone from DB
```

---

## STEP 2: Create Staging Gate Results Report

After running all 5 scenarios, create: `docs/SCRAPER_STAGING_GATE_RESULTS.md`

**Template:**

```markdown
# SCRAPER STAGING GATE RESULTS

**Date:** YYYY-MM-DD  
**Executed by:** [Your Name]  
**Environment:** [Local Supabase / Staging]  
**Supabase Version:** [from `supabase --version`]

---

## Environment Setup

**Option Used:** [A: Local Supabase / B: Staging]

**Env Vars:**
- VITE_SUPABASE_URL: <redacted>
- SUPABASE_SERVICE_ROLE_KEY: <present: yes/no>
- AI Provider: [OpenAI / Anthropic / Both]

**Server Version:**
```bash
node --version  # vX.Y.Z
pnpm --version  # X.Y.Z
```

**Commands run:**
```bash
supabase start  # (if local)
pnpm dev
```

---

## Scenario 1: Fast Site

**URL:** https://example.com  
**Brand ID:** 11111111-1111-1111-1111-111111111111

**Command:**
```bash
[paste exact command]
```

**Result:** ✅ PASS / ❌ FAIL

**Logs (first 50 lines):**
```
[paste]
```

**DB Query Result:**
```
[paste]
```

**Issues:** [none / list any]

---

## Scenario 2: JS-Heavy Site

[repeat template]

---

## Scenario 3: Slow Site

[repeat template]

---

## Scenario 4: Re-scrape Merge ⭐ CRITICAL

[repeat template - MUST include preservation log + DB proof]

---

## Scenario 5: No AI Key

[repeat template]

---

## Summary

| Scenario | Status | Critical? | Notes |
|----------|--------|-----------|-------|
| 1. Fast Site | ✅ / ❌ | No | |
| 2. JS-Heavy | ✅ / ❌ | No | |
| 3. Slow Site | ✅ / ❌ | No | |
| 4. Merge Preservation | ✅ / ❌ | **YES** | ⭐ Must pass! |
| 5. Fallback | ✅ / ❌ | No | |

**Overall:** ✅ ALL PASS / ❌ X FAILURES

**Blocker:** [none / list]

**Sign-off:** ________________ Date: ______
```

---

## STEP 3: If Any Scenario Fails

**DO NOT PROCEED TO PROD**

1. **Identify root cause:**
   - Check logs for error messages
   - Check DB for missing data
   - Check network issues

2. **Apply minimal fix:**
   - Fix code
   - Re-run ONLY the failing scenario
   - Capture proof of fix

3. **Re-run staging gate:**
   - All 5 scenarios must pass before prod

---

## Next Steps After Staging Gate Passes

1. ✅ Merge code to main (if not already)
2. ✅ Deploy to production
3. ✅ Follow `SCRAPER_PROD_FIRST_5_MONITORING.md` for first prod scrapes
4. ✅ Update docs (photography style drift)

---

**PREPARED BY AI - MUST BE EXECUTED BY HUMAN**

