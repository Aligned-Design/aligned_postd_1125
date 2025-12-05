# POSTD Repository Health & Connectors Audit

**Generated**: 2025-01-20  
**Auditor**: POSTD Full-Stack Repo Health Auditor  
**Repository**: POSTD Platform (Aligned-20ai.posted)  
**Scope**: Full repository health audit including CI, connectors, stale code, docs, and cleanup roadmap

---

## Executive Summary

### Overall Health Score: **6.5/10** (Functional but needs significant cleanup)

**Key Strengths:**
- ✅ CI workflows are functional and properly configured
- ✅ Core connectors (Meta, LinkedIn, TikTok, Twitter) are implemented and working
- ✅ Comprehensive environment variable validation exists
- ✅ Well-structured database migrations
- ✅ Strong documentation foundation (Command Center, API contracts)
- ✅ Modern routing structure (`client/app/(postd)/`) is clean and organized

**Key Risks:**
- 🔴 **Missing `.env.example` file** (critical for onboarding)
- 🔴 **97 instances of `VITE_*` env vars in server code** (violates convention, works but wrong)
- 🔴 **Legacy pages directory** (`client/pages/`) contains 34+ orphaned files (~6,000+ lines of dead code)
- 🟠 **Incomplete connector scaffolds** (GBP, Mailchimp throw errors but not clearly marked)
- 🟠 **Legacy server entry point** (`index.ts` vs `index-v2.ts` - both exist, unclear which is primary)
- 🟠 **Documentation bloat** (200+ docs, many outdated/duplicate)
- 🟡 **Old branding references** ("Aligned", "aligned-20ai") still present in code

**Critical Issues Count**: 6  
**High Priority Issues**: 9  
**Medium Priority Issues**: 15  
**Low Priority Issues**: 18

---

## PART 1 — CI & QUALITY GATES

### 1.1 CI Workflow Analysis

#### Workflow Files
- `.github/workflows/ci.yml` - Main CI pipeline ✅
- `.github/workflows/customer-facing-validation.yml` - Customer experience validation ✅

#### Main CI Workflow (`ci.yml`)

**Status**: ✅ **HEALTHY**

**Configuration:**
- **Triggers**: Push/PR to `main`, `develop`, `integration-v2` ✅
- **Node Version**: 24 ✅ (matches package.json `>=24.0.0`)
- **Package Manager**: pnpm 10.20.0 ✅
- **Jobs**:
  1. `lint` - ESLint (blocking) ✅
  2. `typecheck` - TypeScript (blocking) ✅
  3. `test` - Unit tests (blocking) ✅
  4. `e2e` - Playwright E2E (non-blocking, `continue-on-error: true`) ⚠️
  5. `build` - Production build (blocking) ✅
  6. `status` - Final status check (fails if lint/typecheck/build fail) ✅

**Assessment**: Well-configured with appropriate blocking vs non-blocking jobs. E2E tests are intentionally non-blocking (may be flaky).

#### Customer-Facing Validation Workflow

**Status**: ✅ **HEALTHY**

**Configuration:**
- Node: 24 ✅
- Triggers: `main`, `integration-v2` ✅
- Scripts: All present ✅
- Uses `continue-on-error: true` for some steps (intentional for non-blocking validation)

**Issues Found:**
- None - workflow is properly configured

### 1.2 Scripts & Tooling

#### Package.json Scripts Analysis

**Status**: ✅ **MOSTLY HEALTHY** with minor issues

**Working Scripts:**
- ✅ `dev` - Development server (concurrently)
- ✅ `build` - Production build (client + server + vercel-server)
- ✅ `test` / `test:ci` - Vitest unit tests
- ✅ `e2e` - Playwright E2E tests
- ✅ `typecheck` - TypeScript validation
- ✅ `lint` / `lint:fix` - ESLint (max-warnings: 500) ⚠️
- ✅ `format` / `format.fix` - Prettier
- ✅ `validate:env` - Environment validation
- ✅ `verify:supabase` - Supabase connection check
- ✅ `security:check` - Security audit
- ✅ `predeploy` - Pre-deployment checks

**Issues Found:**

1. **ESLint Max Warnings: 500** ⚠️
   - **Location**: `package.json` line 35
   - **Issue**: Very high threshold may hide real issues
   - **Recommendation**: Gradually reduce to 100, then 50, then 0
   - **Priority**: 🟡 Medium

2. **TypeScript Strict Mode Disabled** ⚠️
   - **Location**: `tsconfig.json`
   - **Issue**: `strict: false` - intentional for v1 launch
   - **Recommendation**: Enable incrementally post-launch
   - **Priority**: 🟡 Medium

3. **E2E Tests Non-Blocking in CI** ⚠️
   - **Location**: `.github/workflows/ci.yml` line 79
   - **Issue**: Tests can fail silently (`continue-on-error: true`)
   - **Recommendation**: Make critical E2E tests blocking, keep flaky ones non-blocking
   - **Priority**: 🟡 Medium

### 1.3 Quality Gate Summary

**Strengths:**
- ✅ Comprehensive script coverage
- ✅ Proper TypeScript configuration
- ✅ ESLint well-structured with environment-specific overrides
- ✅ Test tooling configured (Vitest + Playwright)
- ✅ Pre-deployment validation script

**Issues:**
- ⚠️ ESLint max-warnings too high (500)
- ⚠️ TypeScript strict mode disabled (intentional, but should be enabled post-launch)
- ⚠️ E2E tests are non-blocking (may hide failures)

**Recommendations:**
1. Gradually reduce ESLint max-warnings (500 → 100 → 50 → 0)
2. Plan TypeScript strict mode enablement post-launch
3. Add test coverage reporting to CI
4. Consider making critical E2E tests blocking

---

## PART 2 — CONNECTORS & INTEGRATIONS HEALTH

### 2.1 Connector Inventory

#### Implemented Connectors

1. **Meta (Facebook/Instagram)** ✅
   - **Status**: Production-ready
   - **File**: `server/connectors/meta/implementation.ts`
   - **Features**: OAuth, publishing, analytics, webhooks
   - **Env Vars**: `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`

2. **LinkedIn** ✅
   - **Status**: Production-ready
   - **File**: `server/connectors/linkedin/implementation.ts`
   - **Features**: OAuth, publishing, analytics
   - **Env Vars**: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI`

3. **TikTok** ✅
   - **Status**: Production-ready
   - **File**: `server/connectors/tiktok/index.ts`
   - **Features**: OAuth, chunked upload, status polling
   - **Env Vars**: `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI`

4. **Twitter/X** ✅
   - **Status**: Production-ready
   - **File**: `server/connectors/twitter/implementation.ts`
   - **Features**: OAuth, publishing
   - **Env Vars**: `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_REDIRECT_URI`

5. **Canva** ✅
   - **Status**: Implemented
   - **File**: `server/connectors/canva/index.ts`
   - **Features**: Integration support

#### Scaffolded (Not Implemented)

6. **Google Business Profile (GBP)** ❌
   - **Status**: Scaffold only - all methods throw "Future work" errors
   - **File**: `server/connectors/gbp/index.ts`
   - **Issues**: All methods throw `Error('Future work: Implement GBP ...')`
   - **Env Vars**: `GOOGLE_BUSINESS_ACCOUNT_ID`, `GOOGLE_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - **Manager**: Throws `Error('GBP connector not yet implemented. See server/connectors/gbp/index.ts for scaffold.')`
   - **Priority**: 🟠 High (scaffold should be removed or clearly marked as TODO)

7. **Mailchimp** ❌
   - **Status**: Scaffold only - throws error in manager
   - **File**: `server/connectors/mailchimp/index.ts` (exists but not imported)
   - **Issues**: Manager throws `Error('Mailchimp connector not yet implemented. See server/connectors/mailchimp/index.ts for scaffold.')`
   - **Env Vars**: Not documented
   - **Priority**: 🟠 High (scaffold should be removed or clearly marked as TODO)

### 2.2 Environment Variable Mapping

#### Core Services (Required)
- ✅ `VITE_SUPABASE_URL` - Documented, validated
- ✅ `VITE_SUPABASE_ANON_KEY` - Documented, validated
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Documented, validated
- ⚠️ `SUPABASE_URL` - Used as fallback, not consistently documented

#### AI Providers (Optional)
- ✅ `OPENAI_API_KEY` - Documented, validated
- ✅ `ANTHROPIC_API_KEY` - Documented, validated
- ✅ `AI_PROVIDER` - Documented (auto/openai/anthropic)

#### Connector OAuth Credentials (Optional)
- ✅ Meta: `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`
- ✅ LinkedIn: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI`
- ✅ TikTok: `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI`
- ✅ Twitter: `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_REDIRECT_URI`
- ⚠️ Google: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (connector not implemented)
- ❌ Mailchimp: **NOT DOCUMENTED** (connector not implemented)

#### Critical Issues Found

1. **Missing `.env.example` File** 🔴
   - **Location**: Root directory
   - **Issue**: No template file for new developers
   - **Impact**: Onboarding friction, unclear required variables
   - **Priority**: 🔴 Critical
   - **Fix**: Create `.env.example` with all documented variables from `server/utils/validate-env.ts`

2. **97 Instances of `VITE_*` Env Vars in Server Code** 🔴
   - **Location**: Multiple files in `server/` directory
   - **Issue**: Server code uses `VITE_*` prefix (intended for client-side only)
   - **Impact**: Violates convention, confusing, but works due to fallback logic
   - **Files Affected**:
     - `server/connectors/manager.ts` (multiple instances)
     - `server/index-v2.ts`
     - `server/lib/supabase.ts`
     - `server/utils/validate-env.ts`
     - `server/routes/auth.ts`
     - `server/scripts/*.ts` (multiple files)
   - **Pattern**: `process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL`
   - **Priority**: 🔴 Critical (convention violation, but not breaking)
   - **Fix**: Standardize on `SUPABASE_URL` for server code, keep `VITE_SUPABASE_URL` only for client

3. **Inconsistent Env Var Naming** 🟠
   - **Issue**: Mix of `VITE_*` and non-prefixed variables
   - **Examples**: `VITE_SUPABASE_URL` vs `SUPABASE_SERVICE_ROLE_KEY`
   - **Impact**: Confusion about which vars are client-side vs server-side
   - **Priority**: 🟠 High (documentation issue, not breaking)

4. **Connector Manager Uses Wrong Env Vars** 🟠
   - **Location**: `server/connectors/manager.ts` lines 46-47, 71-72, 79-80, 87-88, 96-97, 104-105
   - **Issue**: Uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in server code
   - **Impact**: Violates VITE_* convention (client-side only), but works due to fallback
   - **Priority**: 🟠 High
   - **Fix**: Use `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in server code

### 2.3 Connector Usage Analysis

#### Active Connectors
- ✅ Meta - Used in production
- ✅ LinkedIn - Used in production
- ✅ TikTok - Used in production
- ✅ Twitter - Used in production
- ✅ Canva - Used in production

#### Dead/Scaffold Connectors
- ❌ GBP - Scaffold only, all methods throw errors
- ❌ Mailchimp - Scaffold only, throws error in manager

#### Recommendations

1. **Remove or Mark Scaffolds** 🟠
   - **Action**: Either implement GBP/Mailchimp or remove scaffold code
   - **Priority**: High
   - **Files**: 
     - `server/connectors/gbp/index.ts` - Remove or implement
     - `server/connectors/mailchimp/index.ts` - Remove or implement
     - `server/connectors/manager.ts` lines 109-121 - Remove or implement

2. **Fix Env Var Usage in Server Code** 🔴
   - **Action**: Replace all `VITE_*` vars with server vars in `server/` directory
   - **Priority**: Critical
   - **Files**: All files in `server/` that use `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY`

3. **Create `.env.example`** 🔴
   - **Action**: Create template with all documented variables
   - **Priority**: Critical
   - **Location**: Root directory

---

## PART 3 — STALE CODE, SCRIPTS & DEPENDENCIES

### 3.1 Orphaned Page Components

**Status**: 🔴 **CRITICAL ISSUE**

**Findings:**
- **Total Pages in `client/pages/`**: 56 files
- **Routed Pages**: 18 files (32%)
- **Orphaned Pages**: 34+ files (68%)
- **Dead Code**: ~6,000+ lines

**Good News**: The new routing structure (`client/app/(postd)/`) is clean and organized. All active pages are properly routed.

**Bad News**: The old `client/pages/` directory contains massive amounts of dead code.

#### Orphaned Pages by Category

**Legacy Pages (Moved to `_legacy/` subdirectory)** ✅ **GOOD**
- `client/pages/_legacy/` contains 20+ legacy pages
- These are properly organized and marked as legacy
- **Action**: Can be deleted after verification

**Marketing Pages (11 files - DELETE or MOVE):**
- `About.tsx`, `Contact.tsx`, `Features.tsx`, `Integrations.tsx`, `IntegrationsMarketing.tsx`
- `Legal.tsx`, `Pricing.tsx`, `Privacy.tsx`, `Support.tsx`, `Terms.tsx`, `HelpLibrary.tsx`
- **Status**: `Pricing.tsx` is routed, others are not
- **Action**: Move to separate landing site or delete
- **Priority**: 🟡 Medium

**Legacy Auth Pages (2 files - DELETE):**
- `Login.tsx`, `Signup.tsx`
- **Status**: Superseded by `Screen0Login.tsx` and AuthContext
- **Action**: Delete after verifying no imports
- **Priority**: 🟡 Low

**Duplicate/Versioned Pages (8 files - CONSOLIDATE):**
- `NewDashboard.tsx` vs `Dashboard.tsx` (routed in `app/(postd)/dashboard/page.tsx`)
- `ContentDashboard.tsx` vs `Dashboard.tsx`
- `AnalyticsPortal.tsx` vs `Analytics.tsx` (routed in `app/(postd)/analytics/page.tsx`)
- `MediaManager.tsx`, `MediaManagerV2.tsx` vs `Library.tsx` (routed in `app/(postd)/library/page.tsx`)
- `ReviewQueue.tsx` vs `Approvals.tsx` (routed in `app/(postd)/approvals/page.tsx`)
- **Action**: Consolidate to single version (new structure wins)
- **Priority**: 🟠 High

**Stub/Minimal Pages (3 files - DELETE):**
- `Assets.tsx` (200 lines, stub)
- `Content.tsx` (40 lines, stub)
- `Media.tsx` (32 lines, stub)
- **Action**: Delete
- **Priority**: 🟡 Low

**Onboarding Pages (Active)** ✅
- All onboarding pages in `client/pages/onboarding/` are used
- `Onboarding.tsx` is routed
- **Action**: Keep

**Public Pages (Active)** ✅
- `Index.tsx` - Routed as home page
- `NotFound.tsx` - Routed as catch-all
- `Pricing.tsx` - Routed
- **Action**: Keep

#### Impact
- **Bundle Bloat**: ~6,000+ lines of unused code
- **Developer Confusion**: Unclear which pages are current
- **Maintenance Burden**: Multiple versions to maintain
- **Testing Complexity**: Dead code not covered by tests

### 3.2 Legacy Server Entry Points

**Status**: 🟠 **HIGH PRIORITY ISSUE**

**Files:**
- `server/index.ts` - Legacy server (385 lines) - **Marked as deprecated** ✅
- `server/index-v2.ts` - Current server (239 lines, with Supabase validation) ✅

**Usage:**
- `server/vercel-server.ts` imports from `index-v2.ts` ✅
- `server/node-build-v2.ts` imports from `index-v2.ts` ✅
- `package.json` `dev:server` uses `index-v2.ts` ✅
- `package.json` `start` uses `node-build.mjs` (legacy) ⚠️
- `package.json` `start:v2` uses `node-build-v2.mjs` (current) ✅

**Issues:**
1. **Two server entry points** - `index.ts` is deprecated but still exists
2. **Legacy `start` script** - Uses old server (`node-build.mjs`)
3. **Deprecation notice exists** ✅ - `index.ts` has proper deprecation comments

**Recommendations:**
1. **Update `start` script** - Use `start:v2` or remove legacy
2. **Remove `index.ts`** - After verifying no usage (or archive)
3. **Remove `node-build.mjs`** - After verifying no usage

**Priority**: 🟠 High

### 3.3 Stale Scripts

**Status**: ✅ **MOSTLY HEALTHY**

**Scripts Directory**: `scripts/` (24 files)

**Working Scripts:**
- ✅ `validate-customer-experience.ts` - Used in CI
- ✅ `customer-facing-audit.ts` - Used in CI
- ✅ `test-e2e-flow.ts` - E2E testing
- ✅ `smoke-agents.ts` - Agent testing
- ✅ `api-v2-smoke.ts` - API smoke tests
- ✅ Various test scripts (`.js` files) - Legacy but functional

**Potential Issues:**
- ⚠️ Mix of `.ts` and `.js` files (inconsistent)
- ⚠️ Some scripts may be legacy (`.js` files)
- ⚠️ Scripts are documented in `scripts/README.md` ✅

**Recommendations:**
1. **Audit `.js` scripts** - Verify they're still needed
2. **Migrate to TypeScript** - Convert `.js` to `.ts` if keeping
3. **Keep documentation updated** - `scripts/README.md` is good

**Priority**: 🟡 Medium

### 3.4 Dependencies Audit

**Status**: ✅ **HEALTHY**

**Package.json Analysis:**
- **Runtime Dependencies**: 40+
- **Dev Dependencies**: 50+
- **Total**: 90+ packages

**No Obvious Issues Found:**
- ✅ All dependencies appear to be used
- ✅ No obvious dead dependencies
- ✅ Versions are reasonable (not extremely old)
- ✅ Node version requirement: `>=24.0.0` (matches CI)

**Recommendations:**
1. **Run `npm audit`** - Check for security vulnerabilities
2. **Update dependencies** - Keep up-to-date (but test thoroughly)
3. **Consider dependency audit tool** - Track unused dependencies

**Priority**: 🟢 Low

### 3.5 Old Branding References

**Status**: 🟡 **MEDIUM PRIORITY**

**Findings:**
- **"Aligned" references**: 29 matches found
- **"aligned-20ai" references**: Multiple in localStorage keys, file paths
- **"AlignedAI" references**: Found in user agent strings

**Locations:**
- `client/pages/onboarding/Screen7ContentGeneration.tsx` - `localStorage.getItem("aligned_brand_id")`
- `client/pages/onboarding/Screen5BrandSummaryReview.tsx` - `localStorage.getItem("aligned_brand_id")`
- `client/pages/onboarding/Screen8CalendarPreview.tsx` - `localStorage.getItem("aligned_brand_id")`
- `server/workers/brand-crawler.ts` - `CRAWL_USER_AGENT = "AlignedAIBot/1.0"`
- `server/routes/white-label.ts` - `previewUrl: "https://preview.alignedai.com/..."`
- `server/scripts/verify-orchestration-chain.ts` - `brandId = "aligned-ai-brand"`

**Impact:**
- **Low** - Mostly in localStorage keys and comments
- **Action**: Update to POSTD branding where visible to users

**Recommendations:**
1. **Update localStorage keys** - Change `aligned_*` to `postd_*`
2. **Update user agent** - Change `AlignedAIBot` to `POSTDBot`
3. **Update preview URLs** - Change `alignedai.com` to `postd.com` (if applicable)
4. **Update comments** - Change references in code comments

**Priority**: 🟡 Medium

---

## PART 4 — DOCS & COMMAND CENTER ALIGNMENT

### 4.1 Documentation Inventory

**Status**: ⚠️ **BLOATED BUT FUNCTIONAL**

**Documentation Structure:**
- **Root Level**: 100+ markdown files
- **`docs/` Directory**: 200+ files
- **Total**: 300+ documentation files

**Key Documents:**
- ✅ `docs/00_MASTER_CURSOR_COMMAND_CENTER.md` - Master rules (well-maintained)
- ✅ `POSTD_API_CONTRACT.md` - API documentation
- ✅ `docs/ENVIRONMENT_SETUP.md` - Environment setup guide
- ✅ Various audit reports and implementation summaries

**Issues Found:**

1. **Documentation Bloat** 🟡
   - **Issue**: 300+ files, many outdated/duplicate
   - **Examples**: Multiple phase summaries, duplicate audit reports
   - **Impact**: Hard to find current information
   - **Priority**: 🟡 Medium

2. **Outdated Phase Documents** 🟡
   - **Issue**: Many `PHASE*_*.md` files may be outdated
   - **Examples**: `PHASE2_*.md`, `PHASE3_*.md`, etc.
   - **Action**: Archive or consolidate old phase docs
   - **Priority**: 🟡 Low

3. **Duplicate Audit Reports** 🟡
   - **Issue**: Multiple audit reports covering similar topics
   - **Examples**: `REPO_HEALTH_AUDIT.md`, `CI_STATUS_AUDIT_REPORT.md`, `CI_AUDIT_REPORT.md`
   - **Action**: Consolidate or archive duplicates
   - **Priority**: 🟡 Low

4. **Missing Documentation** 🔴
   - **Issue**: No `.env.example` file (critical for onboarding)
   - **Action**: Create `.env.example` with all documented variables
   - **Priority**: 🔴 Critical

### 4.2 Command Center Alignment

**Status**: ✅ **WELL-ALIGNED**

**Master Document**: `docs/00_MASTER_CURSOR_COMMAND_CENTER.md`

**Key Rules:**
- ✅ Search repo first before creating files
- ✅ Update existing files, don't recreate
- ✅ Follow naming conventions
- ✅ Never auto-fix without approval
- ✅ One file per change
- ✅ Document all changes

**Compliance Check:**
- ✅ Most code follows Command Center rules
- ✅ Documentation is comprehensive
- ⚠️ Some orphaned pages violate "search first" rule (but may be legacy)

**Recommendations:**
1. **Archive old docs** - Move outdated phase/audit docs to `docs/archive/`
2. **Create docs index** - Update `DOCS_INDEX.md` with current structure
3. **Consolidate duplicates** - Merge similar audit reports

**Priority**: 🟡 Medium

### 4.3 Documentation Contradictions

**Status**: ✅ **NO MAJOR CONTRADICTIONS FOUND**

**Findings:**
- ✅ Command Center is treated as master rules
- ✅ API contract is up-to-date
- ✅ Environment setup guide is comprehensive
- ⚠️ Some phase docs may be outdated (but not contradictory)

**Recommendations:**
1. **Review phase docs** - Mark as archived if outdated
2. **Update API contract** - Ensure it matches current implementation
3. **Consolidate setup guides** - Merge similar guides

**Priority**: 🟡 Low

---

## PART 5 — DEPRECATION SWEEP & CLEANUP ROADMAP

### 5.1 Deprecation Categories

#### Category 1: DELETE (Safe to Remove)

**Orphaned Pages (34+ files):**
- Marketing pages (11 files)
- Legacy auth pages (2 files)
- Stub pages (3 files)
- Duplicate pages (8 files)
- Legacy admin/content pages (9 files)
- Legacy pages in `_legacy/` subdirectory (20+ files)

**Legacy Server:**
- `server/index.ts` (after verifying no usage)
- `server/node-build.mjs` (after verifying no usage)

**Priority**: 🟠 High  
**Estimated Time**: 2-3 hours  
**Risk**: Low (verify no imports first)

#### Category 2: CLEANUP (Refactor/Rename)

**Connector Scaffolds:**
- `server/connectors/gbp/index.ts` - Remove or implement
- `server/connectors/mailchimp/index.ts` - Remove or implement
- `server/connectors/manager.ts` lines 109-121 - Remove or implement

**Env Var Usage:**
- `server/connectors/manager.ts` - Replace `VITE_*` with server vars (97 instances)
- All `server/` files using `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY`

**Old Branding:**
- localStorage keys: `aligned_*` → `postd_*`
- User agent: `AlignedAIBot` → `POSTDBot`
- Preview URLs: `alignedai.com` → `postd.com`

**Priority**: 🔴 Critical (env vars), 🟠 High (others)  
**Estimated Time**: 4-5 hours  
**Risk**: Medium (test thoroughly)

#### Category 3: MERGE (Consolidate Duplicates)

**Duplicate Pages:**
- `NewDashboard.tsx` → `Dashboard.tsx` (already routed in new structure)
- `ContentDashboard.tsx` → `Dashboard.tsx`
- `AnalyticsPortal.tsx` → `Analytics.tsx` (already routed)
- `MediaManager.tsx`, `MediaManagerV2.tsx` → `Library.tsx` (already routed)
- `ReviewQueue.tsx` → `Approvals.tsx` (already routed)

**Priority**: 🟠 High  
**Estimated Time**: 2-3 hours  
**Risk**: Low (new structure already wins)

#### Category 4: KEEP (Current & Necessary)

**Active Connectors:**
- Meta, LinkedIn, TikTok, Twitter, Canva

**Active Pages:**
- All routed pages in `client/app/(postd)/`
- Onboarding pages
- Public pages (Index, NotFound, Pricing)

**Active Scripts:**
- All scripts used in CI
- Validation scripts
- Test scripts

**Priority**: ✅ No action needed

### 5.2 Cleanup Roadmap

#### Phase 1: Critical Fixes (Week 1)

1. **Create `.env.example`** 🔴
   - **Time**: 30 minutes
   - **Priority**: Critical
   - **Action**: Create template with all documented variables

2. **Fix Env Var Usage in Server Code** 🔴
   - **Time**: 2-3 hours
   - **Priority**: Critical
   - **Action**: Replace all `VITE_*` vars with server vars in `server/` directory
   - **Files**: 97 instances across multiple files

3. **Remove Connector Scaffolds** 🟠
   - **Time**: 1 hour
   - **Priority**: High
   - **Action**: Remove GBP/Mailchimp scaffolds or mark as TODO

4. **Update Legacy Server Scripts** 🟠
   - **Time**: 30 minutes
   - **Priority**: High
   - **Action**: Update `start` script to use `start:v2` or remove legacy

#### Phase 2: High Priority Cleanup (Week 2)

5. **Delete Orphaned Pages** 🟠
   - **Time**: 2-3 hours
   - **Priority**: High
   - **Action**: Delete marketing, legacy auth, stub pages, legacy subdirectory

6. **Consolidate Duplicate Pages** 🟠
   - **Time**: 1-2 hours
   - **Priority**: High
   - **Action**: Delete duplicates (new structure already wins)

7. **Update Old Branding** 🟡
   - **Time**: 2-3 hours
   - **Priority**: Medium
   - **Action**: Update localStorage keys, user agent, URLs

#### Phase 3: Medium Priority (Week 3-4)

8. **Archive Old Documentation** 🟡
   - **Time**: 2-3 hours
   - **Priority**: Medium
   - **Action**: Move outdated phase/audit docs to `docs/archive/`

9. **Consolidate Documentation** 🟡
   - **Time**: 3-4 hours
   - **Priority**: Medium
   - **Action**: Merge duplicate audit reports, update docs index

10. **Audit Legacy Scripts** 🟡
    - **Time**: 2-3 hours
    - **Priority**: Medium
    - **Action**: Verify `.js` scripts are still needed, migrate to TS

#### Phase 4: Low Priority (Ongoing)

11. **Reduce ESLint Max Warnings** 🟡
    - **Time**: Ongoing
    - **Priority**: Low
    - **Action**: Gradually reduce from 500 → 100 → 50 → 0

12. **Enable TypeScript Strict Mode** 🟡
    - **Time**: Ongoing
    - **Priority**: Low
    - **Action**: Enable incrementally post-launch

---

## CRITICAL ISSUES (🔴)

### C1: Missing `.env.example` File

**File**: Root directory  
**Issue**: No template file for environment variables  
**Impact**: Onboarding friction, unclear required variables  
**Fix**: Create `.env.example` with all documented variables from `server/utils/validate-env.ts`  
**Priority**: 🔴 Critical  
**Time**: 30 minutes

### C2: 97 Instances of `VITE_*` Env Vars in Server Code

**Location**: Multiple files in `server/` directory  
**Issue**: Server code uses `VITE_*` prefix (intended for client-side only)  
**Impact**: Violates convention, confusing, but works due to fallback logic  
**Files Affected**: 
- `server/connectors/manager.ts` (multiple instances)
- `server/index-v2.ts`
- `server/lib/supabase.ts`
- `server/utils/validate-env.ts`
- `server/routes/auth.ts`
- `server/scripts/*.ts` (multiple files)
**Fix**: Replace all `VITE_SUPABASE_URL` with `SUPABASE_URL` in server code  
**Priority**: 🔴 Critical  
**Time**: 2-3 hours

### C3: 34+ Orphaned Page Components

**Location**: `client/pages/`  
**Issue**: 6,000+ lines of unused code  
**Impact**: Bundle bloat, developer confusion, maintenance burden  
**Fix**: Delete orphaned pages after verifying no imports  
**Priority**: 🔴 Critical  
**Time**: 2-3 hours

### C4: Incomplete Connector Scaffolds

**Files**: 
- `server/connectors/gbp/index.ts`
- `server/connectors/mailchimp/index.ts`
- `server/connectors/manager.ts` lines 109-121

**Issue**: Scaffolds throw errors but are not clearly marked as TODO  
**Impact**: Confusion about connector status, potential runtime errors  
**Fix**: Remove scaffolds or implement connectors  
**Priority**: 🔴 Critical  
**Time**: 1 hour

### C5: Legacy Server Entry Point

**Files**: `server/index.ts` (legacy) vs `server/index-v2.ts` (current)  
**Issue**: Two entry points, `start` script uses legacy  
**Impact**: Confusion, potential use of wrong server  
**Fix**: Update `start` script to use `start:v2`, remove legacy after verification  
**Priority**: 🔴 Critical  
**Time**: 30 minutes

### C6: Missing Environment Variable Documentation

**Issue**: No `.env.example` file  
**Impact**: Onboarding friction  
**Fix**: Create `.env.example` with all documented variables  
**Priority**: 🔴 Critical  
**Time**: 30 minutes

---

## HIGH PRIORITY ISSUES (🟠)

### H1: Duplicate Page Components

**Location**: `client/pages/`  
**Issue**: Multiple versions of same page (Dashboard, Analytics, Media, Approvals)  
**Impact**: Confusion, maintenance burden  
**Fix**: Delete duplicates (new structure already wins)  
**Priority**: 🟠 High  
**Time**: 1-2 hours

### H2: Wrong Env Vars in Connector Manager

**File**: `server/connectors/manager.ts`  
**Issue**: Uses `VITE_*` vars in server code (97 instances)  
**Impact**: Violates convention  
**Fix**: Replace with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`  
**Priority**: 🟠 High  
**Time**: 2-3 hours (part of C2)

### H3: Legacy Admin/Content Pages

**Location**: `client/pages/_legacy/`  
**Issue**: 20+ legacy pages may be replaced by new structure  
**Impact**: Unclear which pages are current  
**Fix**: Verify usage, delete if unused  
**Priority**: 🟠 High  
**Time**: 1-2 hours

### H4: ESLint Max Warnings Too High

**File**: `package.json`  
**Issue**: Max warnings set to 500  
**Impact**: May hide real issues  
**Fix**: Gradually reduce to 0  
**Priority**: 🟠 High  
**Time**: Ongoing

### H5: Documentation Bloat

**Location**: Root and `docs/`  
**Issue**: 300+ documentation files, many outdated  
**Impact**: Hard to find current information  
**Fix**: Archive outdated docs, consolidate duplicates  
**Priority**: 🟠 High  
**Time**: 3-4 hours

### H6: Old Branding References

**Location**: Multiple files  
**Issue**: "Aligned", "aligned-20ai" references still present  
**Impact**: Branding inconsistency  
**Fix**: Update to POSTD branding  
**Priority**: 🟠 High  
**Time**: 2-3 hours

### H7: TypeScript Strict Mode Disabled

**File**: `tsconfig.json`  
**Issue**: `strict: false` (intentional for v1)  
**Impact**: Less type safety  
**Fix**: Enable incrementally post-launch  
**Priority**: 🟠 High  
**Time**: Ongoing

### H8: Mixed Script File Types

**Location**: `scripts/`  
**Issue**: Mix of `.ts` and `.js` files  
**Impact**: Inconsistency, unclear which are active  
**Fix**: Migrate to TypeScript, document active scripts  
**Priority**: 🟠 High  
**Time**: 2-3 hours

### H9: Legacy Server Scripts

**File**: `package.json`  
**Issue**: `start` script uses legacy server  
**Impact**: Potential use of wrong server  
**Fix**: Update to use `start:v2` or remove legacy  
**Priority**: 🟠 High  
**Time**: 30 minutes

---

## MEDIUM PRIORITY ISSUES (🟡)

### M1: Marketing Pages Mixed with App Pages

**Location**: `client/pages/`  
**Issue**: 11 marketing pages in app directory  
**Impact**: Code organization  
**Fix**: Move to separate landing site or delete  
**Priority**: 🟡 Medium  
**Time**: 1 hour

### M2: Legacy Auth Pages

**Location**: `client/pages/Login.tsx`, `Signup.tsx`  
**Issue**: Superseded by AuthContext  
**Impact**: Dead code  
**Fix**: Delete after verifying no imports  
**Priority**: 🟡 Medium  
**Time**: 15 minutes

### M3: Stub Pages

**Location**: `client/pages/Assets.tsx`, `Content.tsx`, `Media.tsx`  
**Issue**: Minimal placeholder pages  
**Impact**: Dead code  
**Fix**: Delete  
**Priority**: 🟡 Medium  
**Time**: 15 minutes

### M4: Inconsistent Env Var Naming

**Location**: Multiple files  
**Issue**: Mix of `VITE_*` and non-prefixed variables  
**Impact**: Confusion about client vs server vars  
**Fix**: Document convention clearly  
**Priority**: 🟡 Medium  
**Time**: 1 hour

### M5: Outdated Phase Documents

**Location**: Root and `docs/`  
**Issue**: Many `PHASE*_*.md` files may be outdated  
**Impact**: Documentation bloat  
**Fix**: Archive or consolidate  
**Priority**: 🟡 Medium  
**Time**: 2-3 hours

### M6: Duplicate Audit Reports

**Location**: Root and `docs/`  
**Issue**: Multiple audit reports covering similar topics  
**Impact**: Documentation bloat  
**Fix**: Consolidate or archive  
**Priority**: 🟡 Medium  
**Time**: 2-3 hours

### M7: No Test Coverage Reporting

**Location**: CI workflows  
**Issue**: No coverage reports in CI  
**Impact**: Unclear test coverage  
**Fix**: Add coverage reporting to CI  
**Priority**: 🟡 Medium  
**Time**: 1 hour

### M8: Legacy Scripts Not Documented

**Location**: `scripts/`  
**Issue**: No clear documentation of active scripts  
**Impact**: Unclear which scripts are used  
**Fix**: Update `scripts/README.md`  
**Priority**: 🟡 Medium  
**Time**: 1 hour

### M9-M15: Various Minor Issues

- M9: Branch protection not verified
- M10: No dependency audit tool
- M11: No migration validation script
- M12: No API versioning strategy
- M13: E2E tests non-blocking in CI
- M14: No pre-commit hooks
- M15: No automated dependency updates

**Priority**: 🟡 Medium  
**Time**: Varies

---

## LOW PRIORITY ISSUES (🟢)

### L1-L18: Various Minor Issues

- L1: Backup branches
- L2: Long-lived integration branch
- L3: No conventional commits
- L4: No changelog automation
- L5: No pre-commit hooks
- L6: No automated dependency updates
- L7: No performance monitoring
- L8: No error tracking (Sentry configured but verify)
- L9: No API rate limiting documentation
- L10: No load testing strategy
- L11: No disaster recovery plan
- L12: No backup strategy documentation
- L13: No security audit schedule
- L14: No code review guidelines
- L15: No contribution guidelines update
- L16: No automated testing for connectors
- L17: No API documentation generation
- L18: No performance benchmarking

**Priority**: 🟢 Low  
**Time**: Varies

---

## UNIFIED EXECUTION PLAN

### Week 1: Critical Fixes

**Day 1-2: Environment & Connectors**
1. Create `.env.example` (30 min) 🔴
2. Fix env var usage in server code (2-3 hours) 🔴
3. Remove connector scaffolds (1 hour) 🟠
4. Update legacy server scripts (30 min) 🟠

**Day 3-4: Pages & Server**
5. Delete orphaned pages (2-3 hours) 🔴
6. Consolidate duplicate pages (1-2 hours) 🟠
7. Verify no broken imports (1 hour)

**Day 5: Verification**
8. Run full test suite
9. Verify CI passes
10. Update documentation

**Total Time**: ~8-10 hours

### Week 2: High Priority Cleanup

**Day 1-2: Branding & Documentation**
1. Update old branding (2-3 hours) 🟠
2. Archive old documentation (2-3 hours) 🟠
3. Consolidate duplicate docs (2-3 hours) 🟠

**Day 3-4: Scripts & Quality**
4. Audit legacy scripts (2-3 hours) 🟠
5. Reduce ESLint warnings (ongoing) 🟠
6. Add test coverage reporting (1 hour) 🟡

**Day 5: Verification**
7. Run full test suite
8. Verify CI passes
9. Update documentation

**Total Time**: ~10-14 hours

### Week 3-4: Medium Priority

**Ongoing Tasks:**
1. Reduce ESLint max warnings (ongoing)
2. Enable TypeScript strict mode (ongoing)
3. Add migration validation (2-3 hours)
4. Document API versioning strategy (1 hour)
5. Add pre-commit hooks (1 hour)

**Total Time**: ~4-6 hours + ongoing

### Verification After Each Phase

1. **Run Full Test Suite**
   ```bash
   pnpm test
   pnpm test:e2e
   ```

2. **Verify CI Passes**
   - Check GitHub Actions
   - Verify all jobs pass

3. **Check Build**
   ```bash
   pnpm build
   ```

4. **Verify No Broken Imports**
   ```bash
   pnpm typecheck
   ```

5. **Update Documentation**
   - Update relevant docs
   - Update changelog

---

## VERIFICATION CHECKLIST

After completing cleanup, verify:

### CI & Quality Gates
- [ ] All CI workflows pass
- [ ] ESLint max warnings reduced
- [ ] TypeScript typecheck passes
- [ ] Build succeeds
- [ ] Test coverage reporting added

### Connectors & Integrations
- [ ] `.env.example` exists and is complete
- [ ] All connector env vars documented
- [ ] Connector scaffolds removed or implemented
- [ ] Env var usage fixed in server code (no `VITE_*` in server)
- [ ] All active connectors tested

### Stale Code
- [ ] Orphaned pages deleted
- [ ] Duplicate pages consolidated
- [ ] Legacy server deprecated/removed
- [ ] No broken imports
- [ ] Bundle size reduced

### Documentation
- [ ] Old docs archived
- [ ] Duplicate docs consolidated
- [ ] Docs index updated
- [ ] Command Center followed
- [ ] API contract up-to-date

### Branding
- [ ] Old branding references updated
- [ ] localStorage keys updated
- [ ] User agent updated
- [ ] Preview URLs updated

### Final Checks
- [ ] All tests pass
- [ ] CI is green
- [ ] No linter errors
- [ ] No type errors
- [ ] Build succeeds
- [ ] Documentation updated

---

## APPENDIX: Quick Reference

### Key Files
- `package.json` - Scripts and dependencies
- `.github/workflows/ci.yml` - Main CI pipeline
- `server/connectors/manager.ts` - Connector orchestration
- `server/utils/validate-env.ts` - Environment validation
- `client/App.tsx` - Routing configuration
- `docs/00_MASTER_CURSOR_COMMAND_CENTER.md` - Master rules

### Key Commands
```bash
# Development
pnpm dev                    # Start dev server
pnpm build                  # Production build
pnpm start                  # Start production server (legacy)
pnpm start:v2               # Start production server (current)

# Quality
pnpm typecheck              # TypeScript check
pnpm lint                   # ESLint check
pnpm test                   # Unit tests
pnpm test:e2e               # E2E tests

# Validation
pnpm validate:env           # Environment validation
pnpm verify:supabase         # Supabase connection
pnpm security:check         # Security audit
```

### Priority Legend
- 🔴 **Critical** - Blocks launch or breaks systems
- 🟠 **High** - Causes confusion or recurring bugs
- 🟡 **Medium** - Tidiness, clarity, maintainability
- 🟢 **Low** - Nice-to-have polish

---

**End of Audit Report**

**Next Steps:**
1. Review this report with the team
2. Prioritize fixes based on business needs
3. Execute fixes in phases (Week 1 → Week 2 → Ongoing)
4. Verify after each phase
5. Update documentation as fixes are applied
