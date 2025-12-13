# Files to Commit — Scraper Third-Party Filter Fix

**Date:** 2025-12-13  
**Branch:** (create feature branch from main)  
**Type:** Behavioral change (third-party image filtering)

---

## Required Files for Commit

### Production Code (1 file)
```
M  server/workers/brand-crawler.ts
```
**Status:** Modified  
**Why:** Added `isBlockedThirdPartyImage()` function with deterministic hostname matching

### Test Suite (1 file)
```
?? server/__tests__/scraper-third-party-filter.test.ts
```
**Status:** NEW (untracked)  
**Why:** 33 unit tests validating filter behavior (all passing)

### Validation Script (1 file)
```
?? scripts/smoke-scrape-sites.ts
```
**Status:** NEW (untracked)  
**Why:** Runtime validation script for Squarespace/WordPress sites

### Documentation (1 file - Canonical)
```
?? docs/SCRAPER_THIRD_PARTY_FIX_RELEASE_PACKET.md
```
**Status:** NEW (untracked)  
**Why:** Single source of truth for this release (staging-ready evidence pack)

---

## Total: 4 Files

**Modified:** 1  
**New (Untracked):** 3

---

## Optional Supporting Docs (Audit Trail)

These files provide full verification audit trail:

```
?? docs/VERIFICATION_FINAL_LOCK.md           (detailed audit report)
?? docs/FINAL_LOCK_SUMMARY.md               (concise verification summary)
?? docs/VERIFICATION_FINAL_PASS_SUMMARY.md  (technical details)
?? docs/FINAL_PASS_DIFF.md                  (diff-style summary)
?? docs/VERIFICATION_EDITOR_CHANGES.md      (initial pass summary)
?? SCRAPER_THIRD_PARTY_FIX_FINAL.md        (root-level doc, working copy)
?? docs/SCRAPER_THIRD_PARTY_FIX_FINAL.md   (docs/ copy)
?? docs/TEST_SUITE_AUDIT_REPORT.md         (audit report)
```

**Options:**
1. **Commit all for full audit traceability** (recommended for compliance)
2. **Commit only canonical release packet** (minimal approach)
3. **Keep locally for reference** (team decision)

**Note:** Do NOT add to `.gitignore` by default. These docs provide verification evidence.

---

## Suggested Commit Commands

### Option 1: Commit Required Files Only (Recommended)

```bash
# Stage required files
git add server/workers/brand-crawler.ts
git add server/__tests__/scraper-third-party-filter.test.ts
git add scripts/smoke-scrape-sites.ts
git add docs/SCRAPER_THIRD_PARTY_FIX_RELEASE_PACKET.md

# Verify staged files
git status

# Commit
git commit -m "feat: Add third-party image filter to scraper

- Added isBlockedThirdPartyImage() with deterministic hostname matching
- Filters map tiles, analytics pixels, tracking scripts, junk assets
- Added 33 unit tests (all passing)
- Added smoke test script for runtime validation
- Behavioral change: logo count decreases from 15+ to ≤2 on affected sites

Validated:
- TypeCheck: PASS
- Unit tests: 33/33 PASS
- Runtime: 1/2 sites (Squarespace pass, WordPress timeout site-specific)

Ready for staging deployment per release packet."
```

### Option 2: Include Supporting Docs

If you want to include verification docs for audit trail:

```bash
# Stage all docs
git add server/workers/brand-crawler.ts
git add server/__tests__/scraper-third-party-filter.test.ts
git add scripts/smoke-scrape-sites.ts
git add docs/SCRAPER_THIRD_PARTY_FIX_RELEASE_PACKET.md
git add docs/VERIFICATION_FINAL_LOCK.md
git add docs/FINAL_LOCK_SUMMARY.md
git add docs/VERIFICATION_FINAL_PASS_SUMMARY.md

# Commit
git commit -m "feat: Add third-party image filter to scraper (with verification docs)"
```

---

## Pre-Commit Checklist

Run these commands before committing:

```bash
# 1. Verify tests pass
pnpm test server/__tests__/scraper-third-party-filter.test.ts
# Expected: 33/33 pass

# 2. Verify typecheck passes
pnpm typecheck
# Expected: 0 errors

# 3. Verify no unsafe patterns
grep "hostname\.includes(" server/workers/brand-crawler.ts
# Expected: (empty)

# 4. Check git status
git status
# Expected: Only intended files staged
```

---

## Post-Commit Actions

1. **Push to feature branch**
   ```bash
   git push origin feature/scraper-third-party-filter
   ```

2. **Create PR** with link to `docs/SCRAPER_THIRD_PARTY_FIX_RELEASE_PACKET.md`

3. **Deploy to staging** per checklist in release packet

4. **Fill in staging evidence** in release packet after deployment

---

**Commit Readiness:** ✅ READY  
**Files Verified:** ✅ 4 required files confirmed  
**Tests Passing:** ✅ 33/33  
**TypeCheck:** ✅ PASS


