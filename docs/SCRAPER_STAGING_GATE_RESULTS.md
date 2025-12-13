# SCRAPER STAGING GATE RESULTS

**Date:** [TO BE FILLED]  
**Executed by:** [YOUR NAME]  
**Environment:** [Local Supabase / Staging]  
**Status:** ⏳ IN PROGRESS / ✅ COMPLETE / ❌ BLOCKED

---

## Environment Setup

**Option Used:** [ ] A: Local Supabase / [ ] B: Staging Supabase

**System Info:**

```bash
node --version  # [PASTE]
pnpm --version  # [PASTE]
supabase --version  # [PASTE IF LOCAL]
```

**Env Vars Confirmed:**

- [ ] VITE_SUPABASE_URL present
- [ ] SUPABASE_SERVICE_ROLE_KEY present
- [ ] AI Provider: [ ] OpenAI / [ ] Anthropic / [ ] Both
- [ ] Server started successfully on port 8080

**Verification:**

```bash
curl http://localhost:8080/api/ping
# [PASTE RESPONSE]
```

---

## Scenario 1: Fast Site

**URL:** https://example.com  
**Brand ID:** 11111111-1111-1111-1111-111111111111  
**Date/Time:** [FILL]

**Command:**

```bash
[PASTE EXACT COMMAND USED]
```

**Result:** [ ] ✅ PASS / [ ] ❌ FAIL

**HTTP Response:**

```
Status: [PASTE]
Latency: [PASTE]
Body (first 100 lines):
[PASTE]
```

**Logs (key lines):**

```
[PASTE LOGS - Look for]:
- "[Crawler] ✅ BrandKit saved directly to database"
- "[ScrapedImages] ✅ Persistence complete"
- "imagesPersisted: X"
```

**DB Verification Query:**

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
WHERE id = '11111111-1111-1111-1111-111111111111';
```

**DB Result:**

```
[PASTE QUERY OUTPUT]
```

**Verification Checklist:**

- [ ] HTTP 200 response
- [ ] `has_brand_kit = true`
- [ ] `color_count >= 2`
- [ ] `voice_summary = NULL` ✅
- [ ] `visual_summary = NULL` ✅
- [ ] `tone_keywords = NULL` ✅
- [ ] Completed in < 60s

**Issues Found:** [none / describe]

**Screenshots/Attachments:** [optional]

---

## Scenario 2: JS-Heavy Site (Squarespace/Wix)

**URL:** [FILL]  
**Brand ID:** 22222222-2222-2222-2222-222222222222  
**Date/Time:** [FILL]

**Command:**

```bash
[PASTE]
```

**Result:** [ ] ✅ PASS / [ ] ❌ FAIL

**Logs (host detection):**

```
[PASTE LINE]: "[Crawler] Host-aware extraction" with "host: squarespace"
[PASTE LINE]: "imagesPersisted: X"
```

**DB Verification Query:**

```sql
SELECT 
  category,
  COUNT(*) as image_count
FROM media_assets
WHERE brand_id = '22222222-2222-2222-2222-222222222222'
  AND (path LIKE 'http%' OR path LIKE 'https%')
GROUP BY category;
```

**DB Result:**

```
[PASTE]
```

**Verification Checklist:**

- [ ] Host detected correctly (squarespace/wix/etc)
- [ ] Images persisted > 0
- [ ] Both logos and images categories present

**Issues Found:** [none / describe]

---

## Scenario 3: Slow/Heavy Site

**URL:** [FILL]  
**Brand ID:** 33333333-3333-3333-3333-333333333333  
**Date/Time:** [FILL]

**Command:**

```bash
[PASTE]
```

**Result:** [ ] ✅ PASS / [ ] ❌ FAIL

**Logs (timeout handling):**

```
[PASTE LINES showing]:
- Retry attempts (if any)
- Partial page count
- Final "BrandKit saved" confirmation
```

**Verification Checklist:**

- [ ] Scrape completed (didn't hang)
- [ ] Retry logic visible in logs (or not needed)
- [ ] brand_kit written (even if partial)
- [ ] No 500 errors

**Issues Found:** [none / describe]

---

## Scenario 4: Re-scrape Merge Preservation ⭐ **CRITICAL**

**Brand ID:** 11111111-1111-1111-1111-111111111111 (re-using Scenario 1)  
**Date/Time:** [FILL]

**Step 1: Manual Edit (BEFORE re-scrape)**

```sql
UPDATE brands
SET brand_kit = jsonb_set(
  jsonb_set(
    brand_kit,
    '{identity,values}',
    '["MANUAL_VALUE_1", "MANUAL_VALUE_2", "MANUAL_VALUE_3"]'
  ),
  '{identity,sampleHeadlines}',
  '["MANUAL_HEADLINE_1", "MANUAL_HEADLINE_2"]'
)
WHERE id = '11111111-1111-1111-1111-111111111111';
```

**Verification of manual edit:**

```sql
SELECT 
  brand_kit->'identity'->>'values' as values,
  brand_kit->'identity'->>'sampleHeadlines' as headlines
FROM brands 
WHERE id = '11111111-1111-1111-1111-111111111111';
```

**Result BEFORE re-scrape:**

```
[PASTE - should show MANUAL_VALUE_1, MANUAL_HEADLINE_1]
```

**Step 2: Re-scrape**

```bash
[PASTE COMMAND]
```

**Result:** [ ] ✅ PASS / [ ] ❌ FAIL

**CRITICAL: Preservation Log**

```
[PASTE THIS LINE - MUST BE PRESENT]:
"[Crawler] 🛡️ Preserved X existing brand field(s) during merge: identity.values, identity.sampleHeadlines"
```

**Step 3: Verification AFTER re-scrape**

```sql
SELECT 
  brand_kit->'identity'->>'values' as values_after,
  brand_kit->'identity'->>'sampleHeadlines' as headlines_after
FROM brands 
WHERE id = '11111111-1111-1111-1111-111111111111';
```

**Result AFTER re-scrape:**

```
[PASTE - MUST STILL SHOW MANUAL_VALUE_1, MANUAL_HEADLINE_1]
```

**Verification Checklist (ALL MUST PASS):**

- [ ] Preservation log present: `🛡️ Preserved...`
- [ ] DB shows: `values_after` contains "MANUAL_VALUE_1"
- [ ] DB shows: `headlines_after` contains "MANUAL_HEADLINE_1"

**❌ BLOCKER if manual edits were wiped!**

**Issues Found:** [none / BLOCKER]

---

## Scenario 5: No AI Key Fallback

**URL:** https://example.com  
**Brand ID:** 44444444-4444-4444-4444-444444444444  
**Date/Time:** [FILL]

**Command (with AI keys disabled):**

```bash
OPENAI_API_KEY="" ANTHROPIC_API_KEY="" \
[PASTE REST OF COMMAND]
```

**Result:** [ ] ✅ PASS / [ ] ❌ FAIL

**Logs (fallback behavior):**

```
[PASTE LINES showing]:
- AI generation failure (expected)
- Fallback path used
- "BrandKit saved" confirmation
```

**DB Verification:**

```sql
SELECT 
  brand_kit->'voiceAndTone'->>'tone' as tone
FROM brands 
WHERE id = '44444444-4444-4444-4444-444444444444';
```

**Result:**

```
[PASTE - should be ["professional", "trustworthy"]]
```

**Verification Checklist:**

- [ ] Scraper didn't crash
- [ ] brand_kit written
- [ ] tone = ["professional", "trustworthy"] (fallback)

**Issues Found:** [none / describe]

---

## Summary

| Scenario | Status | Critical? | Issues |
|----------|--------|-----------|--------|
| 1. Fast Site | [ ] ✅ / [ ] ❌ | No | [none / describe] |
| 2. JS-Heavy | [ ] ✅ / [ ] ❌ | No | [none / describe] |
| 3. Slow Site | [ ] ✅ / [ ] ❌ | No | [none / describe] |
| 4. Merge Preservation | [ ] ✅ / [ ] ❌ | **YES** ⭐ | [none / BLOCKER] |
| 5. Fallback | [ ] ✅ / [ ] ❌ | No | [none / describe] |

**Overall Result:**

- [ ] ✅ **ALL PASS** - Ready for production deployment
- [ ] ⚠️ **PARTIAL** - Non-critical issues found, can proceed with monitoring
- [ ] ❌ **BLOCKED** - Critical failures, must fix before prod

**Blockers (if any):**

1. [None / List]

**Warnings (if any):**

1. [None / List]

---

## Fixes Applied (if any failures)

### Fix #1: [Issue Description]

**Root Cause:** [Describe]

**Fix Applied:**

```bash
[PASTE FILE CHANGED + DIFF]
```

**Re-test Result:**

```
[PASTE RE-RUN OUTPUT - MUST PASS]
```

---

## Sign-Off

**Executed by:** ________________  
**Date:** ________________  
**Approval:** ________________

**Next Steps:**

- [ ] Merge code to main (if changes made)
- [ ] Deploy to production
- [ ] Begin production monitoring (first 5 scrapes)
- [ ] Update docs (photography style drift)

---

**TEMPLATE - FILL IN DURING EXECUTION**

