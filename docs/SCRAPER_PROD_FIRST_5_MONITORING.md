# SCRAPER PRODUCTION - FIRST 5 SCRAPES MONITORING

**Purpose:** Monitor first 5 production customer scrapes to catch issues early.  
**Owner:** DevOps / Engineering Lead  
**Duration:** Ongoing until 5 scrapes completed  
**Trigger:** After staging gate passes + prod deployment

---

## Critical Success Metrics

**PASS THRESHOLD:** ≥4 out of 5 scrapes must succeed

**Definition of SUCCESS:**
- HTTP 200 response
- `brand_kit` written to database (not null)
- No legacy column writes (`voice_summary`, `visual_summary`, `tone_keywords` remain null)
- At least 1 image persisted (if site has images)
- No customer complaints about data loss

**Definition of FAILURE:**
- HTTP 500 error
- `brand_kit` is null after scrape
- Legacy columns written (CRITICAL regression)
- Customer reports missing images or wiped data

---

## Monitoring Plan

### 1. Log Monitoring (Real-Time)

**Where:** Production log aggregator (e.g., Vercel logs, Cloudflare, Datadog)

**Search queries:**

```bash
# Success indicators
"[Crawler] ✅ BrandKit saved directly to database"
"[ScrapedImages] ✅ Persistence complete"

# Merge preservation (if re-scrape)
"[Crawler] 🛡️ Preserved"

# Failure indicators
"[Crawler] ❌ Failed to save brandKit"
"[ScrapedImages] ❌ CRITICAL"
"[Crawler] CRITICAL: tenantId is required"
```

**What to capture for each scrape:**

```json
{
  "brandId": "<uuid>",
  "url": "<scraped URL>",
  "tenantId": "<tenant uuid>",
  "timestamp": "2025-XX-XX HH:MM:SS",
  "status": "success | failure",
  "logs": {
    "crawlStarted": true,
    "imagesPersisted": 5,
    "logoFound": true,
    "brandKitSaved": true,
    "preservedFields": [] // Only if re-scrape
  },
  "timing": {
    "totalCrawlTimeMs": 12345,
    "persistenceTimeMs": 234
  }
}
```

---

### 2. Database Verification (Post-Scrape)

**Run after each scrape completes:**

```sql
-- Query 1: Verify brand_kit written + no legacy writes
SELECT 
  id,
  name,
  brand_kit IS NOT NULL as has_brand_kit,
  brand_kit->'identity'->>'name' as extracted_name,
  jsonb_array_length(brand_kit->'visualIdentity'->'colors') as color_count,
  voice_summary,   -- ⚠️ MUST BE NULL
  visual_summary,  -- ⚠️ MUST BE NULL
  tone_keywords,   -- ⚠️ MUST BE NULL
  updated_at
FROM brands 
WHERE id = '<brand_id_from_scrape>'
ORDER BY updated_at DESC;
```

**Expected output (SUCCESS):**

```
 id                  | name      | has_brand_kit | extracted_name | color_count | voice_summary | visual_summary | tone_keywords | updated_at
---------------------+-----------+---------------+----------------+-------------+---------------+----------------+---------------+---------------------------
 <uuid>              | Test Co   | t             | Test Co        |           3 |               |                |               | 2025-01-XX XX:XX:XX
```

**CRITICAL CHECKS:**

- [x] `has_brand_kit = true` (t)
- [x] `color_count >= 2`
- [x] `voice_summary` is **empty** or **NULL** ✅
- [x] `visual_summary` is **empty** or **NULL** ✅
- [x] `tone_keywords` is **empty** or **NULL** ✅

**❌ BLOCKER if any legacy column is populated!**

---

**Query 2: Verify images persisted**

```sql
SELECT 
  brand_id,
  category,
  COUNT(*) as image_count,
  COUNT(*) FILTER (WHERE path LIKE 'http%' OR path LIKE 'https%') as scraped_count
FROM media_assets
WHERE brand_id = '<brand_id_from_scrape>'
GROUP BY brand_id, category;
```

**Expected output (SUCCESS):**

```
 brand_id            | category | image_count | scraped_count
---------------------+----------+-------------+---------------
 <uuid>              | logos    |           1 |             1
 <uuid>              | images   |          10 |            10
```

**PASS if:**

- [x] `scraped_count > 0` (at least some images persisted)
- [x] Both logos and images categories present (if site has both)

**⚠️ WARNING if `scraped_count = 0` but site has images (investigate)**

---

### 3. Customer Feedback Monitoring

**Channels to watch:**

- Support tickets (keyword: "missing", "lost", "disappeared")
- Customer onboarding chat
- Email inbox
- Slack #customer-success channel

**Red flags:**

- "My images disappeared after re-scanning"
- "Brand Guide is empty"
- "All my custom values are gone"

**Action:** If ANY customer reports data loss:

1. Immediately pull logs for that brandId
2. Query DB to confirm data state
3. Escalate to engineering
4. Roll back scraper if confirmed regression

---

## Monitoring Dashboard (Recommended)

Create a simple dashboard with:

```
┌─────────────────────────────────────────┐
│ SCRAPER PROD - FIRST 5 SCRAPES          │
├─────────────────────────────────────────┤
│ Total Scrapes: 3 / 5                    │
│ Success Rate: 100% (3/3)                │
│ Avg Duration: 15.2s                     │
│                                          │
│ ✅ Scrape 1: Brand XYZ (12s)            │
│ ✅ Scrape 2: Brand ABC (18s)            │
│ ✅ Scrape 3: Brand DEF (16s)            │
│ ⏳ Scrape 4: Pending...                 │
│ ⏳ Scrape 5: Pending...                 │
│                                          │
│ Legacy Writes: 0 ✅                     │
│ Image Failures: 0 ✅                    │
│ Customer Complaints: 0 ✅               │
└─────────────────────────────────────────┘
```

---

## Monitoring Checklist (Per Scrape)

For each of the first 5 production scrapes, complete this checklist:

### Scrape #1

- [ ] **Brand ID:** ________________
- [ ] **URL:** ________________
- [ ] **Timestamp:** ________________

**Logs:**
- [ ] `[Crawler] ✅ BrandKit saved` present
- [ ] `[ScrapedImages] ✅ Persistence complete` present
- [ ] No errors in logs

**DB Verification:**
- [ ] `has_brand_kit = true`
- [ ] `voice_summary = NULL` ✅
- [ ] `visual_summary = NULL` ✅
- [ ] `tone_keywords = NULL` ✅
- [ ] Images persisted: _____ (count)

**Customer Feedback:**
- [ ] No complaints received (check 24h after scrape)

**Overall:** ✅ PASS / ❌ FAIL

**Notes:** ________________

---

### Scrape #2

[Repeat checklist]

---

### Scrape #3

[Repeat checklist]

---

### Scrape #4

[Repeat checklist]

---

### Scrape #5

[Repeat checklist]

---

## Final Assessment (After 5 Scrapes)

**Total Scrapes:** 5  
**Successful:** ___ / 5  
**Failed:** ___ / 5

**Success Rate:** ___% (must be ≥80% for PASS)

**Critical Issues Found:**

- [ ] None ✅
- [ ] Legacy writes detected (BLOCKER)
- [ ] Data loss reports (BLOCKER)
- [ ] Other: ________________

**Decision:**

- [ ] ✅ **APPROVED** - Scraper is production-stable, continue normal operation
- [ ] ⚠️ **MONITORING** - Continue monitoring next 10 scrapes
- [ ] ❌ **ROLLBACK** - Critical issues found, revert to previous version

**Sign-off:**

- Engineering Lead: ________________ Date: ______
- Product Owner: ________________ Date: ______

---

## Rollback Procedure (If Needed)

If ≥2 scrapes fail OR any BLOCKER found:

1. **Immediate:**
   ```bash
   # Disable scraper endpoint (circuit breaker)
   # Add to server/routes/crawler.ts:
   router.post("/start", (req, res) => {
     res.status(503).json({ error: "Scraper temporarily disabled for maintenance" });
   });
   ```

2. **Investigate:**
   - Pull logs for ALL failed scrapes
   - Query DB to identify pattern
   - Review recent code changes

3. **Fix + Re-test:**
   - Apply minimal fix
   - Re-run staging gate (all 5 scenarios)
   - Deploy fix

4. **Re-enable:**
   - Remove circuit breaker
   - Resume monitoring from scrape #1

---

## Post-Monitoring Actions (After 5 Scrapes Pass)

1. ✅ Document any minor issues found (non-blocking)
2. ✅ Update docs (photography style drift if not done)
3. ✅ Archive monitoring data
4. ✅ Switch to normal production monitoring (sampling, not 100%)
5. ✅ Celebrate! 🎉

---

## Appendix: Quick Reference Commands

**View recent scrape logs (Vercel):**

```bash
vercel logs <deployment-url> --since 1h --filter "Crawler"
```

**Query last 5 scrapes (DB):**

```sql
SELECT 
  id,
  name,
  brand_kit IS NOT NULL as has_kit,
  updated_at
FROM brands 
WHERE brand_kit IS NOT NULL
ORDER BY updated_at DESC 
LIMIT 5;
```

**Check for legacy writes (CRITICAL):**

```sql
SELECT 
  id,
  name,
  voice_summary IS NOT NULL as has_voice_summary,
  visual_summary IS NOT NULL as has_visual_summary,
  tone_keywords IS NOT NULL as has_tone_keywords,
  updated_at
FROM brands 
WHERE updated_at > NOW() - INTERVAL '24 hours'
  AND (voice_summary IS NOT NULL OR visual_summary IS NOT NULL OR tone_keywords IS NOT NULL);

-- ⚠️ If this returns ANY rows, BLOCKER!
```

---

**PREPARED BY AI - READY FOR HUMAN EXECUTION**

