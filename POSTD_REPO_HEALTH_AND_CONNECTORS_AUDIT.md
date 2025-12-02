# POSTD Repository Health & Connectors Audit

**Generated**: 2025-01-20  
**Auditor**: POSTD Full-Stack Repo Health Auditor  
**Repository**: POSTD Platform (Aligned-20ai.posted)  
**Scope**: Full repository health audit including CI, connectors, stale code, docs, and cleanup roadmap

---

## Executive Summary

### Overall Health Score: **7.5/10** (Good, with significant cleanup needed)

**Key Strengths:**
- ✅ CI workflows are functional and properly configured
- ✅ Core connectors (Meta, LinkedIn, TikTok, Twitter) are implemented
- ✅ Comprehensive environment variable validation exists
- ✅ Well-structured database migrations
- ✅ Strong documentation foundation (Command Center, API contracts)

**Key Risks:**
- 🔴 **34+ orphaned page components** (6,000+ lines of dead code)
- 🔴 **Missing `.env.example` file** (critical for onboarding)
- 🟠 **Incomplete connectors** (GBP, Mailchimp scaffolded but not implemented)
- 🟠 **Legacy server entry point** (`index.ts` vs `index-v2.ts` - unclear which is primary)
- 🟠 **Old branding references** ("Aligned", "aligned-20ai") still present in code
- 🟡 **Documentation bloat** (100+ docs, many outdated/duplicate)

**Critical Issues Count**: 5  
**High Priority Issues**: 8  
**Medium Priority Issues**: 12  
**Low Priority Issues**: 15

---

## PART 1 — CI & QUALITY GATES

### 1.1 CI Workflow Analysis

#### Workflow Files
- `.github/workflows/ci.yml` - Main CI pipeline
- `.github/workflows/customer-facing-validation.yml` - Customer experience validation

#### Main CI Workflow (`ci.yml`)

**Status**: ✅ **HEALTHY**

**Configuration:**
- **Triggers**: Push/PR to `main`, `develop`, `integration-v2`
- **Node Version**: 24 ✅ (matches package.json)
- **Package Manager**: pnpm 10.20.0 ✅
- **Jobs**:
  1. `lint` - ESLint (blocking)
  2. `typecheck` - TypeScript (blocking)
  3. `test` - Unit tests (non-blocking, `continue-on-error: true`)
  4. `e2e` - Playwright E2E (non-blocking, `continue-on-error: true`)
  5. `build` - Production build (blocking)
  6. `status` - Final status check (fails if lint/typecheck/build fail)

**Assessment**: Well-configured with appropriate blocking vs non-blocking jobs.

#### Customer-Facing Validation Workflow

**Status**: ⚠️ **NEEDS FIXES** (Fixed in previous audit, verify current state)

**Previous Issues (from REPO_HEALTH_AUDIT.md):**
- Node version mismatch (22 vs 24) - **FIXED** ✅
- Missing `integration-v2` trigger - **FIXED** ✅
- References non-existent `pulse-nest` branch - **FIXED** ✅
- Inconsistent pnpm setup - **FIXED** ✅

**Current Configuration:**
- Node: 24 ✅
- Triggers: `main`, `integration-v2` ✅
- Scripts: All present ✅

**Verification Needed**: Confirm fixes are in current codebase.

### 1.2 Scripts & Tooling

#### Package.json Scripts Analysis

**Status**: ✅ **MOSTLY HEALTHY** with minor issues

**Working Scripts:**
- ✅ `dev` - Development server (concurrently)
- ✅ `build` - Production build (client + server + vercel-server)
- ✅ `test` / `test:ci` - Vitest unit tests
- ✅ `e2e` - Playwright E2E tests (added in previous audit)
- ✅ `typecheck` - TypeScript validation
- ✅ `lint` / `lint:fix` - ESLint (max-warnings: 500)
- ✅ `format` / `format.fix` - Prettier
- ✅ `validate:env` - Environment validation
- ✅ `verify:supabase` - Supabase connection check
- ✅ `security:check` - Security audit
- ✅ `predeploy` - Pre-deployment checks

**Issues Found:**

1. **ESLint Max Warnings: 500** ⚠️
   - **Location**: `package.json` line 34
   - **Issue**: Very high threshold may hide real issues
   - **Recommendation**: Gradually reduce to 100, then 50, then 0
   - **Priority**: 🟡 Medium

2. **TypeScript Strict Mode Disabled** ⚠️
   - **Location**: `tsconfig.json`
   - **Issue**: `strict: false` - intentional for v1 launch
   - **Recommendation**: Enable incrementally post-launch
   - **Priority**: 🟡 Medium

3. **Test Scripts Non-Blocking in CI** ⚠️
   - **Location**: `.github/workflows/ci.yml` lines 58, 79
   - **Issue**: Tests can fail silently (`continue-on-error: true`)
   - **Recommendation**: Make tests blocking for critical paths
   - **Priority**: 🟠 High

### 1.3 Quality Gate Summary

**Strengths:**
- ✅ Comprehensive script coverage
- ✅ Proper TypeScript configuration
- ✅ ESLint well-structured with environment-specific overrides
- ✅ Test tooling configured (Vitest + Playwright)
- ✅ Pre-deployment validation script

**Issues:**
- ⚠️ Tests are non-blocking in CI (may hide failures)
- ⚠️ ESLint max-warnings too high (500)
- ⚠️ TypeScript strict mode disabled (intentional, but should be enabled post-launch)

**Recommendations:**
1. Make unit tests blocking in CI (remove `continue-on-error` for critical tests)
2. Reduce ESLint max-warnings gradually (500 → 100 → 50 → 0)
3. Plan TypeScript strict mode enablement post-launch
4. Add test coverage reporting to CI

---

## PART 2 — CONNECTORS & INTEGRATIONS HEALTH

### 2.1 Connector Inventory

#### Implemented Connectors

1. **Meta (Facebook/Instagram)** ✅
   - **Status**: Production-ready
   - **File**: `server/connectors/meta/implementation.ts`
   - **Features**: OAuth, publishing, analytics, webhooks
   - **Env Vars**: `META_CLIENT_ID`, `META_CLIENT_SECRET`, `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`

2. **LinkedIn** ✅
   - **Status**: Production-ready
   - **File**: `server/connectors/linkedin/implementation.ts`
   - **Features**: OAuth, publishing, analytics
   - **Env Vars**: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_ORGANIZATION_ID`, `LINKEDIN_ACCESS_TOKEN`

3. **TikTok** ✅
   - **Status**: Production-ready
   - **File**: `server/connectors/tiktok/index.ts`
   - **Features**: OAuth, chunked upload, status polling
   - **Env Vars**: `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI`, `TIKTOK_BUSINESS_ACCOUNT_ID`, `TIKTOK_ACCESS_TOKEN`

4. **Twitter/X** ✅
   - **Status**: Production-ready
   - **File**: `server/connectors/twitter/implementation.ts`
   - **Features**: OAuth, publishing
   - **Env Vars**: `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET`, `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_BEARER_TOKEN`, `TWITTER_ACCOUNT_ID`

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
   - **Priority**: 🟠 High (scaffold should be removed or clearly marked as TODO)

7. **Mailchimp** ❌
   - **Status**: Scaffold only - throws error in manager
   - **File**: `server/connectors/mailchimp/index.ts` (exists but not imported)
   - **Issues**: Manager throws `Error('Mailchimp connector not yet implemented')`
   - **Env Vars**: Not documented
   - **Priority**: 🟠 High (scaffold should be removed or clearly marked as TODO)

### 2.2 Environment Variable Mapping

#### Core Services (Required)
- ✅ `VITE_SUPABASE_URL` - Documented, validated
- ✅ `VITE_SUPABASE_ANON_KEY` - Documented, validated
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Documented, validated

#### AI Providers (Optional)
- ✅ `OPENAI_API_KEY` - Documented, validated
- ✅ `ANTHROPIC_API_KEY` - Documented, validated
- ✅ `AI_PROVIDER` - Documented (auto/openai/anthropic)

#### Connector OAuth Credentials (Optional)
- ✅ Meta: `META_CLIENT_ID`, `META_CLIENT_SECRET`, `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`
- ✅ LinkedIn: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`
- ✅ TikTok: `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI`
- ✅ Twitter: `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET`
- ✅ Google: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- ⚠️ Mailchimp: **NOT DOCUMENTED** (connector not implemented)

#### Issues Found

1. **Missing `.env.example` File** 🔴
   - **Location**: Root directory
   - **Issue**: No template file for new developers
   - **Impact**: Onboarding friction, unclear required variables
   - **Priority**: 🔴 Critical
   - **Fix**: Create `.env.example` with all documented variables

2. **Inconsistent Env Var Naming** 🟠
   - **Issue**: Mix of `VITE_*` and non-prefixed variables
   - **Examples**: `VITE_SUPABASE_URL` vs `SUPABASE_SERVICE_ROLE_KEY`
   - **Impact**: Confusion about which vars are client-side vs server-side
   - **Priority**: 🟡 Medium (documentation issue, not breaking)

3. **Undocumented Connector Env Vars** 🟠
   - **Issue**: Mailchimp env vars not documented (connector not implemented)
   - **Priority**: 🟡 Low (connector not implemented anyway)

4. **Connector Manager Uses Wrong Env Vars** 🟠
   - **Location**: `server/connectors/manager.ts` lines 70-71, 78-79, etc.
   - **Issue**: Uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in server code
   - **Impact**: May work but violates VITE_* convention (client-side only)
   - **Priority**: 🟡 Medium
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
     - `server/connectors/manager.ts` lines 108-114 - Remove or implement

2. **Fix Env Var Usage in Manager** 🟡
   - **Action**: Replace `VITE_SUPABASE_URL` with `SUPABASE_URL` in server code
   - **Priority**: Medium
   - **File**: `server/connectors/manager.ts`

3. **Create `.env.example`** 🔴
   - **Action**: Create template with all documented variables
   - **Priority**: Critical
   - **Location**: Root directory

---

## PART 3 — STALE CODE, SCRIPTS & DEPENDENCIES

### 3.1 Orphaned Page Components

**Status**: 🔴 **CRITICAL ISSUE**

**Findings:**
- **Total Pages**: 56 files in `client/pages/`
- **Routed Pages**: 18 files (32%)
- **Orphaned Pages**: 34+ files (68%)
- **Dead Code**: ~6,000+ lines

#### Orphaned Pages by Category

**Marketing Pages (11 files - DELETE or MOVE):**
- `About.tsx`, `Contact.tsx`, `Features.tsx`, `Integrations.tsx`, `IntegrationsMarketing.tsx`
- `Legal.tsx`, `Pricing.tsx`, `Privacy.tsx`, `Support.tsx`, `Terms.tsx`, `HelpLibrary.tsx`
- **Action**: Move to separate landing site or delete
- **Priority**: 🟡 Medium

**Legacy Auth Pages (2 files - DELETE):**
- `Login.tsx`, `Signup.tsx`
- **Status**: Superseded by `AuthContext`
- **Action**: Delete after verifying no imports
- **Priority**: 🟡 Low

**Duplicate/Versioned Pages (8 files - CONSOLIDATE):**
- `NewDashboard.tsx` vs `Dashboard.tsx` (routed)
- `ContentDashboard.tsx` vs `Dashboard.tsx`
- `AnalyticsPortal.tsx` vs `Analytics.tsx` (routed)
- `MediaManager.tsx`, `MediaManagerV2.tsx` vs `Library.tsx` (routed)
- `ReviewQueue.tsx` vs `Approvals.tsx` (routed)
- **Action**: Consolidate to single version
- **Priority**: 🟠 High

**Stub/Minimal Pages (3 files - DELETE):**
- `Assets.tsx` (200 lines, stub)
- `Content.tsx` (40 lines, stub)
- `Media.tsx` (32 lines, stub)
- **Action**: Delete
- **Priority**: 🟡 Low

**Legacy Admin Pages (5 files - VERIFY):**
- `BrandIntake.tsx`, `BrandSnapshot.tsx`, `Brands.tsx`, `ClientSettings.tsx`, `Assets.tsx`
- **Status**: May be replaced by API endpoints or new structure
- **Action**: Verify usage, delete if unused
- **Priority**: 🟠 High

**Legacy Content Pages (4 files - VERIFY):**
- `ContentDashboard.tsx`, `ContentGenerator.tsx`, `CreatePost.tsx`, `TeamManagement.tsx`
- **Status**: May be replaced by new structure
- **Action**: Verify usage, delete if unused
- **Priority**: 🟠 High

**Miscellaneous:**
- `NeonNest.tsx` (10 lines, Builder.io wrapper) - Keep if needed
- `Demo.tsx` (687 lines) - Keep for dev/testing, document as dev-only

#### Impact
- **Bundle Bloat**: ~6,000+ lines of unused code
- **Developer Confusion**: Unclear which pages are current
- **Maintenance Burden**: Multiple versions to maintain
- **Testing Complexity**: Dead code not covered by tests

### 3.2 Legacy Server Entry Points

**Status**: 🟠 **HIGH PRIORITY ISSUE**

**Files:**
- `server/index.ts` - Legacy server (385 lines)
- `server/index-v2.ts` - Current server (239 lines, with Supabase validation)

**Usage:**
- `server/vercel-server.ts` imports from `index-v2.ts` ✅
- `server/node-build-v2.ts` imports from `index-v2.ts` ✅
- `package.json` `dev:server` uses `index-v2.ts` ✅
- `package.json` `start` uses `node-build.mjs` (legacy) ⚠️
- `package.json` `start:v2` uses `node-build-v2.mjs` (current) ✅

**Issues:**
1. **Two server entry points** - Unclear which is primary
2. **Legacy `start` script** - Uses old server
3. **No deprecation notice** - `index.ts` should be marked as legacy

**Recommendations:**
1. **Mark `index.ts` as deprecated** - Add deprecation notice
2. **Update `start` script** - Use `start:v2` or remove legacy
3. **Remove `index.ts`** - After verifying no usage (or archive)

**Priority**: 🟠 High

### 3.3 Stale Scripts

**Status**: ✅ **MOSTLY HEALTHY**

**Scripts Directory**: `scripts/` (24 files)

**Working Scripts:**
- ✅ `validate-customer-experience.ts` - Used in CI
- ✅ `customer-facing-audit.ts` - Used in CI
- ✅ `test-e2e-flow.ts` - E2E testing
- ✅ `smoke-agents.ts` - Agent testing
- ✅ Various test scripts (`.js` files) - Legacy but functional

**Potential Issues:**
- ⚠️ Mix of `.ts` and `.js` files (inconsistent)
- ⚠️ Some scripts may be legacy (`.js` files)
- ⚠️ No clear documentation of which scripts are active

**Recommendations:**
1. **Audit `.js` scripts** - Verify they're still needed
2. **Migrate to TypeScript** - Convert `.js` to `.ts` if keeping
3. **Document active scripts** - Create `scripts/README.md` with usage

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

**Recommendations:**
1. **Run `npm audit`** - Check for security vulnerabilities
2. **Update dependencies** - Keep up-to-date (but test thoroughly)
3. **Consider dependency audit tool** - Track unused dependencies

**Priority**: 🟢 Low

### 3.5 Old Branding References

**Status**: 🟠 **MEDIUM PRIORITY**

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
- **Priority**: 🟡 Medium

**Recommendations:**
1. **Update localStorage keys** - Change `aligned_*` to `postd_*`
2. **Update user agent** - Change `AlignedAIBot` to `POSTDBot`
3. **Update preview URLs** - Change `alignedai.com` to `postd.com` (if applicable)
4. **Update comments** - Change references in code comments

---

## PART 4 — DOCS & COMMAND CENTER ALIGNMENT

### 4.1 Documentation Inventory

**Status**: ⚠️ **BLOATED BUT FUNCTIONAL**

**Documentation Structure:**
- **Root Level**: 100+ markdown files
- **`docs/` Directory**: 100+ files
- **Total**: 200+ documentation files

**Key Documents:**
- ✅ `docs/00_MASTER_CURSOR_COMMAND_CENTER.md` - Master rules (well-maintained)
- ✅ `POSTD_API_CONTRACT.md` - API documentation
- ✅ `docs/ENVIRONMENT_SETUP.md` - Environment setup guide
- ✅ `docs/REPO_HEALTH_AUDIT.md` - Previous health audit
- ✅ Various audit reports and implementation summaries

**Issues Found:**

1. **Documentation Bloat** 🟡
   - **Issue**: 200+ files, many outdated/duplicate
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

4. **Missing Documentation** 🟠
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

**Legacy Server:**
- `server/index.ts` (after verifying no usage)

**Priority**: 🟠 High  
**Estimated Time**: 2-3 hours  
**Risk**: Low (verify no imports first)

#### Category 2: CLEANUP (Refactor/Rename)

**Connector Scaffolds:**
- `server/connectors/gbp/index.ts` - Remove or implement
- `server/connectors/mailchimp/index.ts` - Remove or implement
- `server/connectors/manager.ts` lines 108-114 - Remove or implement

**Env Var Usage:**
- `server/connectors/manager.ts` - Replace `VITE_*` with server vars

**Old Branding:**
- localStorage keys: `aligned_*` → `postd_*`
- User agent: `AlignedAIBot` → `POSTDBot`
- Preview URLs: `alignedai.com` → `postd.com`

**Priority**: 🟠 High  
**Estimated Time**: 3-4 hours  
**Risk**: Medium (test thoroughly)

#### Category 3: MERGE (Consolidate Duplicates)

**Duplicate Pages:**
- `NewDashboard.tsx` → `Dashboard.tsx`
- `ContentDashboard.tsx` → `Dashboard.tsx`
- `AnalyticsPortal.tsx` → `Analytics.tsx`
- `MediaManager.tsx`, `MediaManagerV2.tsx` → `Library.tsx`
- `ReviewQueue.tsx` → `Approvals.tsx`

**Priority**: 🟠 High  
**Estimated Time**: 4-5 hours  
**Risk**: Medium (verify functionality first)

#### Category 4: KEEP (Current & Necessary)

**Active Connectors:**
- Meta, LinkedIn, TikTok, Twitter, Canva

**Active Pages:**
- All routed pages in `client/app/(postd)/`
- Onboarding pages
- Public pages (blog, legal)

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

2. **Remove Connector Scaffolds** 🟠
   - **Time**: 1 hour
   - **Priority**: High
   - **Action**: Remove GBP/Mailchimp scaffolds or mark as TODO

3. **Fix Env Var Usage in Manager** 🟠
   - **Time**: 30 minutes
   - **Priority**: High
   - **Action**: Replace `VITE_*` with server vars

#### Phase 2: High Priority Cleanup (Week 2)

4. **Delete Orphaned Pages** 🟠
   - **Time**: 2-3 hours
   - **Priority**: High
   - **Action**: Delete marketing, legacy auth, stub pages

5. **Consolidate Duplicate Pages** 🟠
   - **Time**: 4-5 hours
   - **Priority**: High
   - **Action**: Merge duplicates, verify functionality

6. **Deprecate Legacy Server** 🟠
   - **Time**: 1 hour
   - **Priority**: High
   - **Action**: Mark `index.ts` as deprecated, update `start` script

#### Phase 3: Medium Priority (Week 3-4)

7. **Update Old Branding** 🟡
   - **Time**: 2-3 hours
   - **Priority**: Medium
   - **Action**: Update localStorage keys, user agent, URLs

8. **Archive Old Documentation** 🟡
   - **Time**: 2-3 hours
   - **Priority**: Medium
   - **Action**: Move outdated phase/audit docs to `docs/archive/`

9. **Consolidate Documentation** 🟡
   - **Time**: 3-4 hours
   - **Priority**: Medium
   - **Action**: Merge duplicate audit reports, update docs index

#### Phase 4: Low Priority (Ongoing)

10. **Reduce ESLint Max Warnings** 🟡
    - **Time**: Ongoing
    - **Priority**: Low
    - **Action**: Gradually reduce from 500 → 100 → 50 → 0

11. **Enable TypeScript Strict Mode** 🟡
    - **Time**: Ongoing
    - **Priority**: Low
    - **Action**: Enable incrementally post-launch

12. **Audit Legacy Scripts** 🟢
    - **Time**: 2-3 hours
    - **Priority**: Low
    - **Action**: Verify `.js` scripts are still needed, migrate to TS

---

## CRITICAL ISSUES (🔴)

### C1: Missing `.env.example` File

**File**: Root directory  
**Issue**: No template file for environment variables  
**Impact**: Onboarding friction, unclear required variables  
**Fix**: Create `.env.example` with all documented variables from `server/utils/validate-env.ts`  
**Priority**: 🔴 Critical  
**Time**: 30 minutes

### C2: 34+ Orphaned Page Components

**Location**: `client/pages/`  
**Issue**: 6,000+ lines of unused code  
**Impact**: Bundle bloat, developer confusion, maintenance burden  
**Fix**: Delete orphaned pages after verifying no imports  
**Priority**: 🔴 Critical  
**Time**: 2-3 hours

### C3: Incomplete Connector Scaffolds

**Files**: 
- `server/connectors/gbp/index.ts`
- `server/connectors/mailchimp/index.ts`
- `server/connectors/manager.ts` lines 108-114

**Issue**: Scaffolds throw errors but are not clearly marked as TODO  
**Impact**: Confusion about connector status, potential runtime errors  
**Fix**: Remove scaffolds or implement connectors  
**Priority**: 🔴 Critical  
**Time**: 1 hour

### C4: Legacy Server Entry Point

**Files**: `server/index.ts` (legacy) vs `server/index-v2.ts` (current)  
**Issue**: Two entry points, unclear which is primary  
**Impact**: Confusion, potential use of wrong server  
**Fix**: Mark `index.ts` as deprecated, update `start` script  
**Priority**: 🔴 Critical  
**Time**: 1 hour

### C5: Tests Non-Blocking in CI

**File**: `.github/workflows/ci.yml`  
**Issue**: Tests can fail silently (`continue-on-error: true`)  
**Impact**: Broken code may pass CI  
**Fix**: Make critical tests blocking  
**Priority**: 🔴 Critical  
**Time**: 15 minutes

---

## HIGH PRIORITY ISSUES (🟠)

### H1: Duplicate Page Components

**Location**: `client/pages/`  
**Issue**: Multiple versions of same page (Dashboard, Analytics, Media, Approvals)  
**Impact**: Confusion, maintenance burden  
**Fix**: Consolidate to single version  
**Priority**: 🟠 High  
**Time**: 4-5 hours

### H2: Wrong Env Vars in Connector Manager

**File**: `server/connectors/manager.ts`  
**Issue**: Uses `VITE_*` vars in server code  
**Impact**: Violates convention, may cause issues  
**Fix**: Replace with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`  
**Priority**: 🟠 High  
**Time**: 30 minutes

### H3: Legacy Admin/Content Pages

**Location**: `client/pages/`  
**Issue**: 9 legacy pages may be replaced by new structure  
**Impact**: Unclear which pages are current  
**Fix**: Verify usage, delete if unused  
**Priority**: 🟠 High  
**Time**: 2-3 hours

### H4: ESLint Max Warnings Too High

**File**: `package.json`  
**Issue**: Max warnings set to 500  
**Impact**: May hide real issues  
**Fix**: Gradually reduce to 0  
**Priority**: 🟠 High  
**Time**: Ongoing

### H5: Documentation Bloat

**Location**: Root and `docs/`  
**Issue**: 200+ documentation files, many outdated  
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
**Fix**: Create `scripts/README.md`  
**Priority**: 🟡 Medium  
**Time**: 1 hour

### M9: Branch Protection Not Verified

**Location**: GitHub settings  
**Issue**: Cannot verify branch protection on `main`  
**Impact**: Potential for force-push or direct commits  
**Fix**: Enable branch protection in GitHub  
**Priority**: 🟡 Medium  
**Time**: 15 minutes

### M10: No Dependency Audit Tool

**Location**: Package management  
**Issue**: No automated tracking of unused dependencies  
**Impact**: Potential for dead dependencies  
**Fix**: Add dependency audit tool  
**Priority**: 🟡 Medium  
**Time**: 1 hour

### M11: No Migration Validation Script

**Location**: `supabase/migrations/`  
**Issue**: Cannot verify migration idempotency  
**Impact**: Potential migration issues  
**Fix**: Add migration validation script  
**Priority**: 🟡 Medium  
**Time**: 2-3 hours

### M12: No API Versioning Strategy

**Location**: API routes  
**Issue**: No clear versioning strategy  
**Impact**: Potential breaking changes  
**Fix**: Document versioning strategy  
**Priority**: 🟡 Medium  
**Time**: 1 hour

---

## LOW PRIORITY ISSUES (🟢)

### L1: Backup Branches

**Location**: Git branches  
**Issue**: Backup branches may be outdated  
**Impact**: Repository clutter  
**Fix**: Delete after successful merge  
**Priority**: 🟢 Low  
**Time**: 15 minutes

### L2: Long-Lived Integration Branch

**Location**: `integration-v2`  
**Issue**: 18 commits ahead of main  
**Impact**: Potential divergence  
**Fix**: Plan regular merges to main  
**Priority**: 🟢 Low  
**Time**: Ongoing

### L3: No Conventional Commits

**Location**: Git commits  
**Issue**: Not consistently using conventional commits  
**Impact**: Less structured commit history  
**Fix**: Adopt conventional commits format  
**Priority**: 🟢 Low  
**Time**: Ongoing

### L4: No Changelog Automation

**Location**: `CHANGELOG.md`  
**Issue**: Manual changelog updates  
**Impact**: May miss changes  
**Fix**: Automate changelog generation  
**Priority**: 🟢 Low  
**Time**: 2-3 hours

### L5: No Pre-commit Hooks

**Location**: Git hooks  
**Issue**: No automated pre-commit checks  
**Impact**: Potential for committing broken code  
**Fix**: Add pre-commit hooks (lint, format, typecheck)  
**Priority**: 🟢 Low  
**Time**: 1 hour

### L6-L15: Various Minor Issues

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

**Priority**: 🟢 Low  
**Time**: Varies

---

## UNIFIED EXECUTION PLAN

### Week 1: Critical Fixes

**Day 1-2: Environment & Connectors**
1. Create `.env.example` (30 min)
2. Remove connector scaffolds (1 hour)
3. Fix env var usage in manager (30 min)
4. Make critical tests blocking in CI (15 min)

**Day 3-4: Server & Pages**
5. Deprecate legacy server (1 hour)
6. Delete orphaned pages (2-3 hours)
7. Verify no broken imports (1 hour)

**Day 5: Verification**
8. Run full test suite
9. Verify CI passes
10. Update documentation

**Total Time**: ~8-10 hours

### Week 2: High Priority Cleanup

**Day 1-2: Page Consolidation**
1. Consolidate duplicate pages (4-5 hours)
2. Verify functionality (2 hours)

**Day 3-4: Branding & Documentation**
3. Update old branding (2-3 hours)
4. Archive old documentation (2-3 hours)
5. Consolidate duplicate docs (2-3 hours)

**Day 5: Verification**
6. Run full test suite
7. Verify CI passes
8. Update documentation

**Total Time**: ~12-16 hours

### Week 3-4: Medium Priority

**Ongoing Tasks:**
1. Reduce ESLint max warnings (ongoing)
2. Enable TypeScript strict mode (ongoing)
3. Audit legacy scripts (2-3 hours)
4. Add test coverage reporting (1 hour)
5. Document active scripts (1 hour)
6. Add migration validation (2-3 hours)

**Total Time**: ~6-8 hours + ongoing

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
- [ ] Tests are blocking for critical paths
- [ ] ESLint max warnings reduced
- [ ] TypeScript typecheck passes
- [ ] Build succeeds

### Connectors & Integrations
- [ ] `.env.example` exists and is complete
- [ ] All connector env vars documented
- [ ] Connector scaffolds removed or implemented
- [ ] Env var usage fixed in manager
- [ ] All active connectors tested

### Stale Code
- [ ] Orphaned pages deleted
- [ ] Duplicate pages consolidated
- [ ] Legacy server deprecated
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
pnpm start                  # Start production server

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

