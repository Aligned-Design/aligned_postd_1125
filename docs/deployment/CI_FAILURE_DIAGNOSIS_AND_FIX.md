# CI Failure Diagnosis & Fix Guide
**Builder.io Integration + GitHub Actions Troubleshooting**

---

## 📊 Current Status & Critical Findings

### Critical Discovery
- **Local branch is 302 commits BEHIND origin/main**
- Recent merge from `orbit-haven` branch: 126 files changed, +12,171 insertions, -7,234 deletions
- Builder.io push introduced 6 CI job failures
- All changes must be synced before diagnosing failures

### Repository Status
```
Branch: main
Behind origin/main by: 302 commits
Working tree: CLEAN (no uncommitted changes)
```

### Recent Activity Timeline
1. **Nov 5, 3:03 PM** - `61c3a11` - Merge PR #1 (orbit-haven branch)
2. **Nov 5, 3:00 PM** - `8f8be93` - Builder.io bot fix for environment variables
3. **Nov 4** - `ed8d93d` - Major Builder.io setup, Sentry v10 migration, Node 22 runtime

---

## 🔍 Research Summary

### Builder.io Integration Details

**Configuration Files:**
```
✅ builder.json - Build configuration with Node 22 & pnpm >=9.0.0
✅ .env.example - Has Builder.io API keys
✅ .builder/rules/ - Rules for UI organization and deployment
✅ client/lib/builder.ts - Client-side initialization
✅ server/routes/builder.ts - Webhook handling
✅ client/components/BuilderPage.tsx - Builder page component
```

**Builder.json Content:**
```json
{
  "name": "aligned-ai",
  "publicApiKey": "your_builder_public_k39bfc067b694403ca329597d360f18f4",
  "runtime": {
    "node": "22",
    "pnpm": ">=9.0.0"
  },
  "build": {
    "entry": "client/main.tsx",
    "outDir": "dist",
    "target": "esnext"
  }
}
```

**Environment Variables Required:**
```
VITE_BUILDER_PUBLIC_KEY=your_builder_public_k39bfc067b694403ca329597d360f18f4
BUILDER_PRIVATE_KEY=bpk-6f8460db197449138778018fa9681efe
```

### Orbit-Haven Merge Impact
**Major Changes:**
- 126 files modified
- Added back marketing pages (About, Contact, Features, Support)
- TypeScript type changes: `unknown` → `any` in multiple files
- Prettier formatting applied across codebase
- Binary file diff in `client/utils/monitoring.ts` (6129 → 7835 bytes)

### GitHub Actions CI Pipeline

**6 Jobs Configuration:**
```
Job 1: Lint                    → continue-on-error: true  ⚠️ Non-blocking
Job 2: TypeScript Typecheck   → continue-on-error: true  ⚠️ Non-blocking
Job 3: Unit Tests            → continue-on-error: true  ⚠️ Non-blocking
Job 4: E2E Tests             → continue-on-error: true  ⚠️ Non-blocking
Job 5: Build                 → continue-on-error: false ❌ BLOCKING
Job 6: Status Aggregation    → Reports overall status
```

**Only the Build job is BLOCKING** - failure here fails the entire pipeline.

### MCP Server Status
**Current State: NOT CONFIGURED**
- No `.mcp` files found
- No MCP configuration in codebase
- Builder.io VSCode extension installed: `~/.vscode/extensions/builder.builder-0.2.22`
- Ready for setup once CI is fixed

---

## 📋 Execution Plan: 6 Phases

### Legend
- 🟩 Completed
- 🟦 In Progress
- 🟪 Pending
- ❌ Error/Issue

---

## PHASE 1: Sync with Remote Repository ⏱️ ~5 minutes

### Status: 🟪 PENDING

**Why This Step:**
- You're 302 commits behind origin/main
- Must have latest code to diagnose actual failures
- Builder.io changes are only on remote

### Step 1.1: Pull Remote Changes
```bash
# Show current status
git status

# Pull all 302 commits
git pull origin main

# Show what was pulled
git log --oneline -20
```

**Expected Output:**
- Fast-forward merge (no conflicts expected)
- New commits appear in local history
- Should see builder.io related commits

**Possible Issues & Fixes:**

| Issue | Solution |
|-------|----------|
| Merge conflicts | Resolve conflicts in each file, then `git add .` and `git commit` |
| Detached HEAD | Run `git checkout main` |
| Remote changes rejected | Check if local changes exist with `git diff` |

### Step 1.2: Verify Sync
```bash
# Should show 0 commits behind
git status

# Check recent commits
git log --oneline -10

# Verify no uncommitted changes
git diff --stat
```

**✅ Phase 1 Complete When:**
- `git status` shows "Your branch is up to date with 'origin/main'."
- No merge conflicts exist
- Can see builder.io commits in git log

---

## PHASE 2: Access GitHub Actions CI Failures ⏱️ ~10 minutes

### Status: 🟪 PENDING

**Objective:** See which of the 6 jobs actually failed and get specific error messages

### Option A: GitHub CLI (Recommended) ⭐

**Install GitHub CLI:**
```bash
# macOS
brew install gh

# Verify installation
gh --version
```

**Authenticate:**
```bash
# Login to GitHub
gh auth login

# Choose: GitHub.com
# Choose: HTTPS (not SSH)
# Choose: Y for git credential
```

**View Recent Workflow Runs:**
```bash
# List last 10 runs
gh run list --repo Aligned-Design/Aligned-20ai --limit 10

# Get details of most recent run
gh run view <RUN_ID> --repo Aligned-Design/Aligned-20ai

# Download failure logs
gh run view <RUN_ID> --repo Aligned-Design/Aligned-20ai --log-failed
```

**Find Failed Job Details:**
```bash
# This shows which of the 6 jobs failed
gh run view <RUN_ID> --repo Aligned-Design/Aligned-20ai --json jobs
```

### Option B: Browser Access

Navigate to: **https://github.com/Aligned-Design/Aligned-20ai/actions**

1. Click on most recent workflow run (at the top)
2. Look for red ❌ marks indicating failed jobs
3. Click on each failed job to see error logs
4. Note the specific error messages for Phase 4

### Option C: WebFetch (Limited Access)

If GitHub CLI not available and browser access limited, I can attempt to fetch workflow status via web if repository is public.

**Record Failed Jobs:**
Create a checklist of which jobs failed:

```markdown
- [ ] Job 1: Lint                  - Status: _____
- [ ] Job 2: TypeScript           - Status: _____
- [ ] Job 3: Unit Tests           - Status: _____
- [ ] Job 4: E2E Tests            - Status: _____
- [ ] Job 5: Build (BLOCKING)     - Status: _____
- [ ] Job 6: Status Aggregation   - Status: _____
```

**✅ Phase 2 Complete When:**
- You have access to GitHub Actions logs
- You can identify which jobs failed
- You have specific error messages for each failure

---

## PHASE 3: Reproduce CI Failures Locally ⏱️ ~20 minutes

### Status: 🟪 PENDING

**Objective:** Run each CI job locally to reproduce failures and understand issues

### Prerequisites
```bash
# Verify you have required tools
node --version      # Should be 22.x (Node 22)
pnpm --version      # Should be >=9.0.0
git --version       # Any recent version
```

### Run Each Job Locally

#### Job 1: Lint Check
```bash
# Install dependencies first (if not done)
pnpm install --frozen-lockfile

# Run lint
pnpm run lint

# If there are errors, auto-fix what you can
pnpm run lint --fix

# Re-run to verify fixes
pnpm run lint
```

**Possible Issues:**
- Prettier format conflicts
- ESLint rule violations
- Unused variables/imports

**Log Output Location:** Console output

---

#### Job 2: TypeScript Type Check
```bash
# Run type checking
pnpm run typecheck

# Show errors with line numbers
pnpm exec tsc --noEmit
```

**Expected Issues (from orbit-haven merge):**
- `unknown` type changed to `any` - may introduce new errors
- Missing type definitions
- Type mismatches from refactoring

**Log Output Location:** Console output

---

#### Job 3: Unit Tests
```bash
# Run tests in CI mode
pnpm run test:ci

# Or run in watch mode to debug
pnpm run test
```

**May take 2-3 minutes**

**Known Test Changes:**
- 271 lines changed in automation-e2e.test.ts
- 590 lines changed in phase-7-publishing.test.ts
- Client settings tests failing due to missing database table

**Log Output Location:** `./test-results/` directory

---

#### Job 4: Build (CRITICAL - BLOCKING JOB)
```bash
# Run build
pnpm run build

# Show build output
ls -la dist/

# Check build size
du -sh dist/
```

**⚠️ This is the job that fails the entire pipeline**

**Likely Issues:**
1. Binary file corruption in `client/utils/monitoring.ts`
2. Builder.io environment variable not set
3. TypeScript compilation errors
4. Missing dependencies

**Log Output Location:** Console output + `./dist/` directory

---

#### Job 5: E2E Tests (Optional - Non-blocking)
```bash
# First install Playwright browsers
pnpm exec playwright install

# Run E2E tests
pnpm run e2e
```

**May take 5+ minutes**

**Log Output Location:** `./playwright-report/` directory

---

### Record Issues Found

Create a document listing all errors encountered:

```markdown
## Issues Found Locally

### Job 1: Lint
- [ ] Error 1: _______________
- [ ] Error 2: _______________

### Job 2: TypeScript
- [ ] Error 1: _______________
- [ ] Error 2: _______________

### Job 3: Tests
- [ ] Error 1: _______________

### Job 4: Build (CRITICAL)
- [ ] Error 1: _______________
- [ ] Error 2: _______________

### Job 5: E2E Tests
- [ ] Error 1: _______________
```

**✅ Phase 3 Complete When:**
- All 6 jobs have been run locally
- All errors are documented
- You understand the root causes

---

## PHASE 4: Fix Identified Issues ⏱️ ~30-45 minutes

### Status: 🟪 PENDING

**Objective:** Apply fixes to pass all CI jobs

### Known Issues & Fixes

#### Issue 4.1: Binary File in Source Control (CRITICAL)
**File:** `client/utils/monitoring.ts`

**Problem:**
- Shows as binary diff (6129 → 7835 bytes)
- TypeScript files should never be binary
- Likely corrupted during builder.io push

**Diagnosis:**
```bash
# Check if file is actually text
file client/utils/monitoring.ts

# Check if git thinks it's binary
git diff --cached client/utils/monitoring.ts

# Look at file content
head -20 client/utils/monitoring.ts
```

**Fix Option A: Restore from Previous Commit**
```bash
# Find last good commit for this file
git log -1 --oneline -- client/utils/monitoring.ts

# Restore from that commit
git checkout <COMMIT_SHA> -- client/utils/monitoring.ts

# Mark as text file
git add -u client/utils/monitoring.ts
```

**Fix Option B: Regenerate from Source**
If the file is essential:
1. Check git history for the correct version
2. Copy it from a previous commit
3. Remove any binary data

---

#### Issue 4.2: Builder.io Environment Variables
**Problem:** Build may fail if environment variables not configured

**Diagnosis:**
```bash
# Check if .env file exists
ls -la .env

# Check if variables are set
echo $VITE_BUILDER_PUBLIC_KEY
echo $BUILDER_PRIVATE_KEY
```

**Fix:**
```bash
# Copy example to .env if missing
cp .env.example .env

# Edit .env with actual values
# Ensure these are set:
# VITE_BUILDER_PUBLIC_KEY=your_builder_public_k39bfc067b694403ca329597d360f18f4
# BUILDER_PRIVATE_KEY=bpk-6f8460db197449138778018fa9681efe

# For CI, these should be secrets in GitHub
# No need to commit .env
```

**For GitHub Actions:**
These must be set as GitHub Secrets:
1. Go to: Settings → Secrets and variables → Actions
2. Add: `VITE_BUILDER_PUBLIC_KEY`
3. Add: `BUILDER_PRIVATE_KEY`

---

#### Issue 4.3: TypeScript Errors from Type Changes
**Problem:** Recent commits changed `unknown` → `any` which may have introduced errors

**Diagnosis:**
```bash
pnpm run typecheck 2>&1 | tee typescript-errors.log
```

**Fix Strategy:**
1. Review each error from typecheck output
2. For each file with errors:
   ```bash
   # Edit the file
   code <FILE_PATH>
   # Fix the type issues
   # Save file
   ```
3. Re-run typecheck
4. Commit fixes

**Common Fixes:**
```typescript
// Before (too loose)
const data: any = await fetch(...);

// After (proper typing)
const data: unknown = await fetch(...);
if (typeof data === 'object' && data !== null) {
  const typedData = data as MyType;
}
```

---

#### Issue 4.4: Lint & Prettier Conflicts
**Problem:** Recently applied prettier formatting may conflict with ESLint rules

**Diagnosis:**
```bash
pnpm run lint 2>&1 | head -50
```

**Fix:**
```bash
# Auto-fix all fixable lint errors
pnpm run lint --fix

# Re-run to see remaining issues
pnpm run lint

# For each remaining issue, manually fix or add eslint-disable comment if intentional
```

---

#### Issue 4.5: Package Dependencies
**Problem:** Lock file may be out of sync

**Diagnosis:**
```bash
# Check for dependency warnings
pnpm install --frozen-lockfile 2>&1 | grep -i warn

# List peer dependency issues
pnpm install 2>&1 | grep -i peer
```

**Fix:**
```bash
# Update lock file if needed
pnpm install

# Or force use frozen lockfile (for CI)
pnpm install --frozen-lockfile
```

---

#### Issue 4.6: Test Failures
**Problem:** Tests may fail due to changes from orbit-haven merge

**For Each Failed Test:**

1. **Look at test output:**
   ```bash
   pnpm run test 2>&1 | grep -A 20 "FAIL"
   ```

2. **Either:**
   - **Option A:** Fix the code being tested
   - **Option B:** Update the test expectations (if intentional changes)
   - **Option C:** Skip test temporarily (last resort)

3. **Database-Related Failures:**
   If test complains about missing table `public.client_settings`:
   ```bash
   # This is expected in test environment
   # Add mock or skip test:
   it.skip('should retrieve client settings', ...);
   ```

---

### Systematic Fix Process

**For Each Issue Found:**

1. **Identify:** Which job? Which file?
2. **Understand:** What's the error message?
3. **Fix:** Apply the appropriate fix from above
4. **Test:** Re-run the job locally
5. **Verify:** Error is gone
6. **Stage:** `git add` the fixed files
7. **Document:** Note what was fixed

---

### Commands to Run Fixes in Order

```bash
# 1. Fix lint errors
pnpm run lint --fix

# 2. Check type errors
pnpm run typecheck

# 3. Manually fix any remaining TypeScript errors
# (edit files as needed)

# 4. Run tests locally
pnpm run test:ci

# 5. Build
pnpm run build

# 6. Stage all fixes
git add -A

# 7. Verify nothing else broke
git status
```

**✅ Phase 4 Complete When:**
- All jobs run successfully locally
- No errors in any of the 6 job types
- Build completes without errors

---

## PHASE 5: Builder.io MCP Setup (Optional) ⏱️ ~15 minutes

### Status: 🟪 PENDING

**Objective:** Connect Builder.io MCP server to Claude Desktop (optional, if needed for your workflow)

### Do You Need This?

**Use Builder.io MCP if:**
- ✅ You want Builder.io integration with Claude AI
- ✅ You want AI to help manage Builder.io content
- ✅ You want deployment automation via MCP

**Skip if:**
- You don't use Builder.io with Claude
- The VSCode extension is sufficient for you
- Focus is only on fixing CI

---

### Step 5.1: Install Claude Desktop (If Needed)

```bash
# Check if Claude Desktop is installed
ls -la /Applications/Claude.app

# If not installed, download from:
# https://claude.ai/download
```

---

### Step 5.2: Create MCP Configuration

**File Location:** `~/Library/Application Support/Claude/claude_desktop_config.json`

**Configuration:**
```json
{
  "mcpServers": {
    "builder": {
      "command": "npx",
      "args": ["-y", "@builder.io/sdk"],
      "env": {
        "BUILDER_PUBLIC_KEY": "your_builder_public_k39bfc067b694403ca329597d360f18f4",
        "BUILDER_PRIVATE_KEY": "bpk-6f8460db197449138778018fa9681efe"
      }
    }
  }
}
```

**Note:** The exact package name may be `@builder.io/sdk`, `@builder.io/mcp`, or similar. Check the latest Builder.io documentation.

---

### Step 5.3: Verify Configuration

```bash
# Check config syntax
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | python3 -m json.tool
```

---

### Step 5.4: Test Connection

1. Restart Claude Desktop
2. Open a new conversation
3. Look for Builder.io tools in the tool list
4. Try calling a Builder.io tool to verify it works

**Expected:** Builder.io tools should appear as available options

---

**✅ Phase 5 Complete When:**
- Builder.io MCP server configured (optional)
- Claude Desktop recognizes Builder.io tools (if enabled)

---

## PHASE 6: Verify & Push Fixes ⏱️ ~10 minutes

### Status: 🟪 PENDING

**Objective:** Run full CI locally, commit fixes, push to GitHub

### Step 6.1: Run Full Local CI

**Run all jobs in sequence:**
```bash
echo "=== Starting Full CI Run ===" && \
pnpm run lint && \
echo "✅ Lint passed" && \
pnpm run typecheck && \
echo "✅ TypeScript passed" && \
pnpm run test:ci && \
echo "✅ Tests passed" && \
pnpm run build && \
echo "✅ Build passed" && \
echo "=== ALL JOBS PASSED ==="
```

**Expected Output:**
```
✅ Lint passed
✅ TypeScript passed
✅ Tests passed
✅ Build passed
=== ALL JOBS PASSED ===
```

If anything fails, go back to Phase 4 and fix it.

---

### Step 6.2: Commit Fixes

```bash
# Review what changed
git status

# Show detailed changes
git diff --stat

# Commit all fixes
git commit -m "fix: resolve CI failures from builder.io integration and orbit-haven merge

- Fix builder environment variable handling
- Resolve TypeScript type errors from type changes
- Fix binary file corruption in monitoring.ts
- Resolve lint errors from prettier formatting
- Update tests for orbit-haven changes

Fixes 6 failing CI jobs:
✅ Lint job
✅ TypeScript job
✅ Unit tests job
✅ E2E tests job
✅ Build job (blocking)
✅ Status aggregation

All 6 GitHub Actions CI jobs now passing."
```

---

### Step 6.3: Push to GitHub

```bash
# Push changes
git push origin main

# Verify push succeeded
git log --oneline -5
```

**Expected:** No errors, push completes successfully

---

### Step 6.4: Monitor GitHub Actions

1. Go to: **https://github.com/Aligned-Design/Aligned-20ai/actions**
2. Click on the latest workflow run
3. Watch all 6 jobs:
   - 🟦 Jobs running (blue)
   - 🟩 Jobs passing (green)
4. Confirm all 6 jobs complete successfully

**⏱️ Estimated Time:** 5-10 minutes for full CI to complete

---

### Step 6.5: Troubleshoot if CI Still Fails

If GitHub Actions CI still fails after pushing:

```bash
# Check what's different
git diff HEAD~1

# View CI logs from GitHub:
# https://github.com/Aligned-Design/Aligned-20ai/actions

# Use GitHub CLI to get detailed logs
gh run view <LATEST_RUN_ID> --log-failed
```

**If CI fails on GitHub but passed locally:**
- May be due to environment differences
- Check that all secrets are set in GitHub Settings
- Verify Node.js version matches (22.x)
- Check pnpm version

---

**✅ Phase 6 Complete When:**
- ✅ All local jobs pass
- ✅ Fixes are committed
- ✅ Changes pushed to GitHub
- ✅ All 6 GitHub Actions jobs pass on remote

---

## Progress Tracking Checklist

### Overall Progress
```
🟪 Phase 1: Sync with Remote           [ ] Complete
🟪 Phase 2: Access GitHub Actions      [ ] Complete
🟪 Phase 3: Reproduce Failures         [ ] Complete
🟪 Phase 4: Fix Issues                 [ ] Complete
🟪 Phase 5: Builder.io MCP (Optional)  [ ] Complete
🟪 Phase 6: Verify & Push              [ ] Complete
```

### Detailed Checklist

**Phase 1:**
- [ ] `git pull origin main` completed
- [ ] No merge conflicts
- [ ] 302 commits pulled successfully
- [ ] `git status` shows up-to-date

**Phase 2:**
- [ ] GitHub CLI installed or browser access working
- [ ] Can view GitHub Actions workflow runs
- [ ] Identified which jobs failed
- [ ] Have error messages for each failure

**Phase 3:**
- [ ] `pnpm run lint` checked
- [ ] `pnpm run typecheck` checked
- [ ] `pnpm run test:ci` checked (may skip if time)
- [ ] `pnpm run build` checked
- [ ] All errors documented

**Phase 4:**
- [ ] Issue 4.1: Binary file fixed
- [ ] Issue 4.2: Environment variables set
- [ ] Issue 4.3: TypeScript errors fixed
- [ ] Issue 4.4: Lint errors fixed
- [ ] Issue 4.5: Dependencies updated
- [ ] Issue 4.6: Tests passing
- [ ] All local jobs pass again

**Phase 5 (Optional):**
- [ ] Claude Desktop installed (if needed)
- [ ] MCP config created
- [ ] Builder.io tools accessible

**Phase 6:**
- [ ] Full local CI runs successfully
- [ ] Fixes committed
- [ ] Changes pushed to GitHub
- [ ] All 6 GitHub Actions jobs pass

---

## Quick Reference Commands

```bash
# Sync with remote
git pull origin main

# Install dependencies
pnpm install --frozen-lockfile

# Run all CI checks locally
pnpm run lint && pnpm run typecheck && pnpm run test:ci && pnpm run build

# Fix auto-fixable issues
pnpm run lint --fix

# Check GitHub Actions status
gh run list --repo Aligned-Design/Aligned-20ai --limit 5
gh run view <RUN_ID> --log-failed

# Commit and push
git add -A
git commit -m "fix: resolve CI failures"
git push origin main
```

---

## Troubleshooting Guide

### "git pull" Shows Merge Conflicts
```bash
# View conflicts
git status

# Edit each conflicted file, keep desired changes
# Then resolve
git add <RESOLVED_FILES>
git commit -m "resolve merge conflicts"
```

### "pnpm install" Fails
```bash
# Clear cache
pnpm store prune

# Reinstall
pnpm install --force
```

### "pnpm run build" Fails with "Cannot find module"
```bash
# Rebuild lockfile
pnpm install --no-frozen-lockfile

# Then lock it again
pnpm install --frozen-lockfile
```

### GitHub Actions Still Fails After Local Success
```bash
# Check GitHub secrets are set
# Go to: Settings → Secrets and variables → Actions
# Verify:
# - VITE_BUILDER_PUBLIC_KEY exists
# - BUILDER_PRIVATE_KEY exists

# Check .github/workflows/ci.yml exists
cat .github/workflows/ci.yml | grep "runs-on:"
```

### "client/utils/monitoring.ts" is Still Binary
```bash
# Check actual content
file client/utils/monitoring.ts

# If still binary, reset to HEAD
git checkout HEAD -- client/utils/monitoring.ts

# Force as text
git add -f client/utils/monitoring.ts
git commit -m "fix: restore monitoring.ts as text file"
```

---

## Next Steps After CI Passes

Once all 6 CI jobs pass on GitHub:

1. **Merge to Production** (if applicable)
2. **Deploy** to staging/production environment
3. **Run Full Test Suite** in staging
4. **Monitor Logs** for any runtime errors
5. **Document Changes** in release notes
6. **Set Up Builder.io MCP** if desired for future work

---

## Contact & Support

- **Repository:** https://github.com/Aligned-Design/Aligned-20ai
- **Builder.io Docs:** https://builder.io/docs
- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **Claude Desktop Docs:** https://docs.claude.com

---

**Document Version:** 1.0
**Created:** November 5, 2025
**Last Updated:** November 5, 2025
**Status:** Ready for Execution

---

## How to Use This Document

1. **Read through each phase** to understand what needs to happen
2. **Check off boxes** as you complete each step
3. **Follow commands exactly** as written
4. **Document any errors** in the checklist
5. **Reference troubleshooting guide** if issues arise
6. **Update status** in the checklist as you progress
7. **Keep this file open** during entire troubleshooting session

**You can pause and resume** - this document persists across context windows!
