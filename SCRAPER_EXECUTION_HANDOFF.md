# SCRAPER STAGING GATE - AI TO HUMAN HANDOFF

**Date:** 2025-12-12  
**Status:** ⚠️ **AWAITING HUMAN EXECUTION**

---

## What the AI Did ✅

### 1. Code Fixes Applied

- ✅ **Fixed blocker:** Safe merge strategy prevents data loss on re-scrapes (`server/routes/crawler.ts:992-1052`)
- ✅ **Added observability:** Merge preservation now logged (`crawler.ts:1068-1070`)
- ✅ **Added test coverage:** Regression test created (`server/__tests__/crawler-merge-behavior.test.ts`)

### 2. Documentation Created

| File | Purpose | Status |
|------|---------|--------|
| `docs/SCRAPER_STAGING_GATE_EXECUTION_GUIDE.md` | Step-by-step commands for 5 scenarios | ✅ Ready |
| `docs/SCRAPER_STAGING_GATE_RESULTS.md` | Template to fill during execution | ✅ Ready |
| `docs/SCRAPER_PROD_FIRST_5_MONITORING.md` | Production monitoring plan | ✅ Ready |
| `SCRAPER_STAGING_GATE_CHECKLIST.md` | Original checklist | ✅ Ready |
| `SCRAPER_AUDIT_FINAL_REPORT.md` | Complete audit report | ✅ Ready |
| `SCRAPER_AUDIT_SKEPTICAL_RESPONSE.md` | Response to feedback | ✅ Ready |

### 3. Audit Completed

- ✅ Phase 0: Contract identified
- ✅ Phase 1: Execution path mapped
- ✅ Phase 2: Adversarial failures hunted
- ✅ Phase 3: Environment assessed (no execution possible)
- ✅ Phase 4: Blocker fixed + observability added
- ✅ Phase 5: Final report delivered

---

## What the Human MUST Do ⚠️

### Critical: The AI Cannot Execute Commands

**Why:** The AI operates in a sandbox with:
- ❌ No terminal access to your machine
- ❌ No Supabase credentials
- ❌ No network access to external services
- ❌ No ability to run servers or trigger HTTP requests

**Therefore:** ALL staging gate scenarios must be executed by YOU.

---

## Your Action Items (In Order)

### ☐ Step 0: Prepare Environment (10 minutes)

**Choose ONE:**

- [ ] **Option A: Local Supabase** (Recommended)
  - Run: `supabase start`
  - Create `.env.local` with credentials from output
  - Run: `pnpm install && pnpm dev`

- [ ] **Option B: Staging Supabase**
  - Get staging credentials from team
  - Create `.env.staging`
  - Run: `pnpm dev`

**Verification:**

```bash
curl http://localhost:8080/api/ping
# Expected: {"message":"pong",...}
```

**If this fails:** Environment not ready, troubleshoot before proceeding.

---

### ☐ Step 1: Execute 5 Staging Scenarios (30 minutes)

**Follow:** `docs/SCRAPER_STAGING_GATE_EXECUTION_GUIDE.md`

**For each scenario:**

1. Copy-paste command from guide
2. Run in your terminal
3. Capture output (logs + HTTP response)
4. Run DB verification query
5. Paste results into `docs/SCRAPER_STAGING_GATE_RESULTS.md`

**Scenarios:**

- [ ] 1. Fast Site (baseline)
- [ ] 2. JS-Heavy Site (Playwright test)
- [ ] 3. Slow Site (timeout handling)
- [ ] 4. Re-scrape Merge ⭐ **CRITICAL** (must see `🛡️ Preserved...` log)
- [ ] 5. No AI Key (fallback)

**CRITICAL:** Scenario 4 must pass. If merge preservation log is missing or data is wiped, **STOP** and investigate.

---

### ☐ Step 2: Document Results (10 minutes)

**Fill in:** `docs/SCRAPER_STAGING_GATE_RESULTS.md`

**For each scenario, paste:**

- Command used
- HTTP response
- Key log lines
- DB query result
- Pass/fail status

**Sign-off section at bottom.**

---

### ☐ Step 3: Evaluate Results

**If ALL 5 scenarios passed:**

- ✅ Mark staging gate as COMPLETE
- ✅ Proceed to production deployment
- ✅ Begin production monitoring (first 5 scrapes)

**If ANY scenario failed:**

- ❌ **DO NOT deploy to production**
- Investigate root cause
- Apply minimal fix
- Re-run ONLY the failed scenario
- Document fix in results doc

**If Scenario 4 (merge) failed:**

- ❌ **BLOCKER** - This is the critical fix we made
- Check if observability log is present
- Check if manual edits were preserved in DB
- If wiped, something is wrong with the merge logic

---

### ☐ Step 4: Production Deployment

**After staging gate passes:**

```bash
# 1. Merge code to main (if not already)
git add server/routes/crawler.ts server/__tests__/crawler-merge-behavior.test.ts
git commit -m "fix: add safe merge strategy for repeated scrapes + observability"
git push origin main

# 2. Deploy to production
# (follow your deployment process - Vercel, Netlify, etc.)

# 3. Verify deployment
curl https://production-url.com/api/ping
```

---

### ☐ Step 5: Monitor First 5 Production Scrapes

**Follow:** `docs/SCRAPER_PROD_FIRST_5_MONITORING.md`

**For each scrape:**

1. Watch logs in real-time
2. Run DB verification queries
3. Check for customer complaints
4. Fill in monitoring checklist

**Pass threshold:** ≥4 out of 5 must succeed

**If <4 succeed:** Roll back deployment and investigate

---

## Quick Reference: What to Look For

### ✅ SUCCESS Indicators

**In logs:**

```
[Crawler] ✅ BrandKit saved directly to database
[ScrapedImages] ✅ Persistence complete
[Crawler] 🛡️ Preserved X existing brand field(s): ... (if re-scrape)
```

**In database:**

```sql
-- All legacy columns should be NULL
voice_summary   |  (null)
visual_summary  |  (null)
tone_keywords   |  (null)

-- brand_kit should be populated
has_brand_kit   |  t
color_count     |  3
```

---

### ❌ FAILURE Indicators

**In logs:**

```
[Crawler] ❌ Failed to save brandKit
[ScrapedImages] ❌ CRITICAL: Found X image(s) but NONE were persisted
ERROR: timeout
500 Internal Server Error
```

**In database:**

```sql
-- BLOCKER if ANY legacy column is populated
voice_summary   |  {"tone": [...]}  ← ❌ BLOCKER
visual_summary  |  {"colors": [...]} ← ❌ BLOCKER
tone_keywords   |  {professional}    ← ❌ BLOCKER

-- BLOCKER if brand_kit is null after scrape
has_brand_kit   |  f  ← ❌ BLOCKER
```

---

## Troubleshooting

### Issue: "Missing environment variables"

**Fix:**

```bash
# Verify .env.local exists
ls -la .env.local

# Check required vars are set
grep SUPABASE_URL .env.local
grep SUPABASE_SERVICE_ROLE_KEY .env.local
grep OPENAI_API_KEY .env.local  # OR ANTHROPIC_API_KEY
```

---

### Issue: "Connection refused" or "ECONNREFUSED"

**Fix:**

1. Check server is running: `curl http://localhost:8080/api/ping`
2. Check port is correct: `echo $PORT` (should be 8080)
3. Restart server: `pnpm dev`

---

### Issue: Scenario 4 fails (merge not preserving)

**Symptoms:**

- No `🛡️ Preserved...` log line
- DB query shows manual values are gone

**Fix:**

1. Check if `server/routes/crawler.ts` has the merge fix (lines 992-1052)
2. Check if `preservedFields` array is being populated
3. Check if logs are being emitted (line 1068-1070)
4. If still failing, escalate to engineering

---

### Issue: AI key is invalid

**Symptoms:**

```
[Crawler] ❌ AI brand kit generation failed: 401 Unauthorized
```

**Fix:**

1. Verify API key is correct
2. Check key has credits/quota
3. Try fallback: Temporarily disable AI key to test fallback path (Scenario 5)

---

## Timeline Estimate

| Task | Duration | Cumulative |
|------|----------|------------|
| Step 0: Setup env | 10 min | 10 min |
| Step 1: Run 5 scenarios | 30 min | 40 min |
| Step 2: Document results | 10 min | 50 min |
| Step 3: Evaluate | 5 min | 55 min |
| Step 4: Deploy to prod | 10 min | 65 min |
| Step 5: Monitor first scrape | 15 min | 80 min |

**Total:** ~1-1.5 hours (including prod monitoring)

---

## Success Criteria (Final Checklist)

- [ ] All 5 staging scenarios executed
- [ ] All 5 staging scenarios passed (especially #4)
- [ ] Results documented in `docs/SCRAPER_STAGING_GATE_RESULTS.md`
- [ ] Code merged to main
- [ ] Deployed to production
- [ ] First production scrape monitored
- [ ] No legacy writes detected
- [ ] No customer complaints

**When all checked:** ✅ **SCRAPER IS PRODUCTION-PROVEN**

---

## Who to Contact if Stuck

**Environment issues:** DevOps team  
**Supabase access:** Database admin  
**Code issues:** Engineering lead  
**API keys:** Platform team

---

## Final Notes

**The AI has done everything it can without terminal/network access.**

**The rest is up to you (the human).**

**Good luck! 🚀**

---

**PREPARED BY AI - EXECUTION REQUIRED BY HUMAN**

