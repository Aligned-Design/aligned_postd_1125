# SCRAPER STAGING GATE CHECKLIST

**Purpose:** Pre-production validation of scraper pipeline with real Supabase + Chromium + live URLs.

**Owner:** DevOps / QA Lead  
**Before:** First production customer scrape  
**Duration:** ~30 minutes

---

## Prerequisites

- [ ] Staging environment has valid `.env`:
  - `SUPABASE_URL` (staging instance)
  - `SUPABASE_SERVICE_KEY` (staging service role key)
  - `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` (required for AI generation, optional for fallback test)

- [ ] Playwright browser installed:
  ```bash
  pnpm exec playwright install chromium
  ```

- [ ] Staging database migrated to latest schema:
  ```bash
  # Verify brands.brand_kit column exists and is JSONB
  # Verify voice_summary, visual_summary, tone_keywords exist (for legacy read fallback)
  ```

---

## Test 1: Fast Site (Baseline)

**URL:** `https://example.com` (or any fast-loading static site)

**Expected:** < 10s scrape time, 5-15 images, 3-6 colors, basic brand_kit

### Steps:

1. **Trigger scrape:**
   ```bash
   curl -X POST https://staging.postd.app/api/crawl/start \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <staging_token>" \
     -d '{
       "url": "https://example.com",
       "brand_id": "<test_brand_uuid>",
       "workspaceId": "<test_tenant_uuid>",
       "sync": true
     }'
   ```

2. **Capture logs:**
   - Look for: `[Crawler] ✅ BrandKit saved directly to database`
   - Look for: `[ScrapedImages] ✅ Persistence complete`
   - Look for: `[Crawler] 🛡️ Preserved X existing brand field(s)` (should be empty on first scrape)

3. **Verify database write:**
   ```sql
   SELECT 
     id,
     brand_kit IS NOT NULL as has_brand_kit,
     brand_kit->'identity'->>'name' as brand_name,
     jsonb_array_length(brand_kit->'visualIdentity'->'colors') as color_count,
     voice_summary,
     visual_summary,
     tone_keywords
   FROM brands 
   WHERE id = '<test_brand_uuid>';
   ```

   **Expected:**
   - `has_brand_kit = true`
   - `brand_name = "Example Domain"` (or similar)
   - `color_count >= 2`
   - `voice_summary = NULL` ✅ (no legacy write)
   - `visual_summary = NULL` ✅ (no legacy write)
   - `tone_keywords = NULL` ✅ (no legacy write)

4. **Verify images persisted:**
   ```sql
   SELECT COUNT(*) as image_count, category
   FROM media_assets
   WHERE brand_id = '<test_brand_uuid>'
     AND (path LIKE 'http%' OR path LIKE 'https%')  -- Scraped images have HTTP URLs
   GROUP BY category;
   ```

   **Expected:**
   - `logos: 1-2` (logo images)
   - `images: 5-15` (brand images)

5. **Verify readback via API:**
   ```bash
   curl https://staging.postd.app/api/brand-guide/<test_brand_uuid> \
     -H "Authorization: Bearer <staging_token>"
   ```

   **Expected JSON structure:**
   ```json
   {
     "identity": {
       "name": "...",
       "industryKeywords": [...],
       "sampleHeadlines": [...]
     },
     "voiceAndTone": {
       "tone": [...],
       "friendlinessLevel": 50,
       "formalityLevel": 50,
       "confidenceLevel": 50
     },
     "visualIdentity": {
       "colors": ["#...", "#..."]
     }
   }
   ```

**PASS CRITERIA:** ✅
- Scrape completes in < 20s
- `brand_kit` written to database
- No legacy writes (`voice_summary`, `visual_summary`, `tone_keywords` all NULL)
- At least 1 logo + 3 brand images persisted
- API readback returns canonical structure

---

## Test 2: Slow Site (Timeout Handling)

**URL:** A real-world site known to be slow (10-15s load time)

**Expected:** Retry logic engages, partial data returned, graceful degradation

### Steps:

1. **Trigger scrape** (same as Test 1, different URL)

2. **Monitor logs for:**
   - `[Crawler] Failed to load page <url>: timeout` (retry messages)
   - `[Crawler] Crawl complete: X pages crawled` (should be < max pages if timeout hit)
   - `[Crawler] ✅ BrandKit saved` (should still succeed with partial data)

3. **Verify database write:**
   - `brand_kit` should exist (even with partial data)
   - `identity.name` should be present
   - Colors may be fewer (but > 0)

**PASS CRITERIA:** ✅
- Scrape completes (doesn't hang forever)
- Retry logic visible in logs
- Partial data saved (not total failure)
- No 500 errors returned to client

---

## Test 3: Repeated Scrape (Merge Behavior)

**URL:** Same URL from Test 1

**Expected:** Existing data preserved when new scrape returns same/empty data

### Steps:

1. **Manually edit brand_kit** (simulate user edits):
   ```sql
   UPDATE brands
   SET brand_kit = jsonb_set(
     brand_kit,
     '{identity,values}',
     '["innovation", "trust", "quality"]'
   )
   WHERE id = '<test_brand_uuid>';
   ```

2. **Trigger scrape again** (same URL as Test 1)

3. **Check logs for merge preservation:**
   - Look for: `[Crawler] 🛡️ Preserved X existing brand field(s) during merge: identity.values` ✅

4. **Verify database:**
   ```sql
   SELECT 
     brand_kit->'identity'->>'values' as values
   FROM brands 
   WHERE id = '<test_brand_uuid>';
   ```

   **Expected:**
   - `values = ["innovation", "trust", "quality"]` ✅ (preserved, not overwritten)

**PASS CRITERIA:** ✅
- Log shows preserved fields
- User-edited data NOT wiped by repeated scrape
- New colors still updated (colors always refresh)

---

## Test 4: JS-Heavy Site (Lazy Loading)

**URL:** A Squarespace or Wix site (uses JS to load images)

**Expected:** Host detection works, lazy-loaded images extracted

### Steps:

1. **Trigger scrape**

2. **Check logs for host detection:**
   - Look for: `[Crawler] Host-aware extraction` with `host: squarespace` or `host: wix`

3. **Verify images:**
   ```sql
   SELECT COUNT(*) FROM media_assets
   WHERE brand_id = '<test_brand_uuid>';
   ```

   **Expected:**
   - Image count > 0 (lazy-loaded images successfully extracted)

**PASS CRITERIA:** ✅
- Host detected correctly
- Images extracted despite lazy loading
- No errors in logs about missing images

---

## Test 5: No AI Key (Fallback Path)

**URL:** Any site

**Expected:** Scraper uses heuristic fallback when AI unavailable

### Steps:

1. **Temporarily remove AI key from staging `.env`:**
   ```bash
   # Comment out or remove:
   # OPENAI_API_KEY=...
   # ANTHROPIC_API_KEY=...
   ```

2. **Trigger scrape**

3. **Check logs for fallback:**
   - Look for: `[Crawler] ❌ AI brand kit generation failed` (or similar)
   - Look for: `[Crawler] ✅ BrandKit saved` (should still succeed with heuristics)

4. **Verify database:**
   - `brand_kit` should exist
   - `voiceAndTone.tone` should have fallback values (`["professional", "trustworthy"]`)

5. **Restore AI key after test**

**PASS CRITERIA:** ✅
- Scraper doesn't crash without AI
- Fallback data written to database
- Logs clearly indicate fallback mode

---

## STAGING GATE SIGN-OFF

**All 5 tests passed:** ☐ YES / ☐ NO

**Issues found:** (list any failures or warnings)

**Sign-off:**
- QA Lead: ________________ Date: ______
- DevOps: ________________ Date: ______

**Decision:**
- ☐ **APPROVED FOR PRODUCTION** — All tests passed, scraper ready for customer use
- ☐ **BLOCKED** — Issues found, must fix before production rollout

---

## Post-Production Monitoring (First 5 Scrapes)

After deploying to production, monitor first 5 customer scrapes:

1. **Check logs for:**
   - `[Crawler] ✅ BrandKit saved` (success rate)
   - `[ScrapedImages] ✅ Persistence complete` (image persistence)
   - `[Crawler] 🛡️ Preserved X existing brand field(s)` (merge behavior on re-scrapes)
   - No 500 errors

2. **Query database:**
   ```sql
   SELECT 
     id,
     brand_kit IS NOT NULL as has_brand_kit,
     voice_summary IS NULL as legacy_clean,
     (SELECT COUNT(*) FROM media_assets WHERE brand_id = brands.id) as image_count
   FROM brands 
   WHERE created_at > NOW() - INTERVAL '1 day'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

   **Expected:**
   - `has_brand_kit = true` for all
   - `legacy_clean = true` for all (no legacy writes)
   - `image_count > 0` for most (some sites may have no images)

3. **Customer feedback:**
   - Any reports of missing images?
   - Any reports of data being wiped?
   - Any timeout/performance complaints?

**If any issues:** Roll back scraper, investigate, fix, re-test in staging.

---

**END OF STAGING GATE CHECKLIST**

