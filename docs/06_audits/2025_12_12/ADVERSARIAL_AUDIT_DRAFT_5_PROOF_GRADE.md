# 🔴 ADVERSARIAL DOCUMENTATION AUDIT — DRAFT 5 (PROOF-GRADE)

**Date:** 2025-12-12  
**Auditor:** AI Documentation Auditor (Skeptical Mode, Evidence-Only)  
**Scope:** Documentation files only (code inspection only in Phase D)  
**Method:** Repo-relative paths, file existence proof, exact quotes ≤25 words, zero unverified claims

---

## PHASE A — STATUS LEXICON NORMALIZATION (DOCS ONLY)

**Search Terms Used:** `"draft"|'draft'`, `"pending_review"`, `"failed"`, `"errored"`, `"archived"`, `"rejected"`

**Files Scanned:** 75 docs use "draft", 16 use "pending_review", 50 use "failed", 3 use "errored"

---

### FINDING A.1 — Content Item Status: 4 Conflicting Definitions 🔴 BLOCKER

**Evidence:**

| # | File (EXISTS ✅) | Section | Quote (≤25 words) |
|---|------------------|---------|-------------------|
| 1 | `docs/LAUNCH_GATE.md` | Golden Path #4 — Status Enums | "Expected Statuses: draft, pending_review, approved, scheduled, published, failed" (line 445) |
| 2 | `docs/NEW_DEVELOPER_ARCHITECTURE_GUIDE.md` | Database Structure — content_items Table | "status TEXT DEFAULT 'draft', -- 'draft' \| 'pending_review' \| 'approved' \| 'rejected' \| 'scheduled' \| 'published'" (line 187) |
| 3 | `docs/POSTD_SOCIAL_POSTING_BEHAVIOR_AUDIT.md` | Publishing Workflow | "content_items.status defaults to 'pending_review'" (line 201) |
| 4 | `POSTD_CREATIVE_STUDIO_AND_SCHEDULER_AUDIT_REPORT.md` | Status Updates | "Statuses: draft → pending_review → approved → scheduled → published; rejected (stops workflow)" (line 807) |

**Contradiction:**
- **LAUNCH_GATE** lists `failed` but NOT `rejected` or `errored`
- **NEW_DEVELOPER_ARCHITECTURE_GUIDE** lists `rejected` but NOT `failed` or `errored`
- **SOCIAL_POSTING_BEHAVIOR_AUDIT** claims default is `pending_review`; ARCHITECTURE_GUIDE says `draft`
- **CREATIVE_STUDIO_AUDIT** includes `rejected` (stops workflow) but LAUNCH_GATE omits it

**Severity:** 🔴 **BLOCKER** — 4 docs define lifecycle differently; no clear authority

---

### FINDING A.2 — Publishing Jobs Status: Contradiction on `draft` 🟡 MEDIUM

**Evidence:**

| # | File (EXISTS ✅) | Section | Quote (≤25 words) |
|---|------------------|---------|-------------------|
| 1 | `docs/LAUNCH_GATE.md` | Golden Path #4 — Status Enums | "Publishing Jobs: pending, processing, completed, failed, cancelled" (line 447) |
| 2 | `POSTD_STUDIO_PUBLISHING_VERIFICATION_AUDIT.md` | Publishing Queue Validation | "SELECT id, status FROM publishing_jobs WHERE status = 'draft'" (line 1082) |

**Contradiction:** LAUNCH_GATE does NOT list `draft` as valid status for `publishing_jobs`; audit report queries for it

**Severity:** 🟡 **MEDIUM** — Unclear if `draft` is valid for publishing jobs

---

## PHASE B — LINK ROT & DEAD REFERENCES (DOCS ONLY, TOP 25 REQUIRED)

**Search Terms Used:** `\[.*\]\([^h][^t][^t][^p].*\.md\)` (markdown file links), file existence via `glob_file_search`

---

### TOP 25 DEAD/AMBIGUOUS REFERENCES

**Source:** `README.md` (EXISTS ✅), lines 54-383

| # | Source Line | Link Text | Target File | Exists? | Verdict |
|---|-------------|-----------|-------------|---------|---------|
| 1 | 54 | Product Definition & Guardrails | `docs/POSTD_PRODUCT_DEFINITION_AND_GUARDRAILS.md` | ✅ YES | VALID |
| 2 | 55 | Codebase Architecture Overview | `CODEBASE_ARCHITECTURE_OVERVIEW.md` | ✅ YES | VALID |
| 3 | 56 | System Architecture Diagrams | `docs/SYSTEM_ARCHITECTURE_DIAGRAMS.md` | ✅ YES | VALID |
| 4 | 57 | Tech Stack Guide | `TECH_STACK_GUIDE.md` | ✅ YES | VALID |
| 5 | 58 | Setup Guide | `docs/SETUP_GUIDE.md` | ✅ YES | VALID |
| 6 | 59 | API Contract | `POSTD_API_CONTRACT.md` | ✅ YES | VALID |
| 7 | 65 | Client Onboarding Overview | `docs/CLIENT_ONBOARDING_OVERVIEW.md` | ✅ YES | VALID |
| 8 | 66 | Client First 30 Days Playbook | `docs/CLIENT_FIRST_30_DAYS_PLAYBOOK.md` | ✅ YES | VALID |
| 9 | 67 | Client Onboarding Checklist | `docs/CLIENT_ONBOARDING_CHECKLIST.md` | ✅ YES | VALID |
| 10 | 68 | Brand Guide Lifecycle | `docs/BRAND_GUIDE_LIFECYCLE.md` | ✅ YES | VALID |
| 11 | 72 | Complete Documentation Map | `DOCS_INDEX.md` | ✅ YES | VALID |
| 12 | 77 | System Architecture Diagrams (duplicate) | `docs/SYSTEM_ARCHITECTURE_DIAGRAMS.md` | ✅ YES | VALID |
| 13 | 78 | Final Lock-In Verification Report | `docs/audit/FINAL_LOCK_IN_VERIFICATION_REPORT.md` | ✅ YES | VALID |
| 14 | 107 | Codebase Architecture Overview (duplicate) | `CODEBASE_ARCHITECTURE_OVERVIEW.md` | ✅ YES | VALID |
| 15 | 138 | Contributing Guidelines | `CONTRIBUTING.md` | ✅ YES | VALID |
| 16 | 163 | Contributing Guidelines (duplicate) | `CONTRIBUTING.md` | ✅ YES | VALID |
| 17 | 195 | Tech Stack Guide for env vars | `TECH_STACK_GUIDE.md` | ✅ YES | **⚠️ MISLEADING** |
| 18 | 245 | Product Definition & Guardrails (duplicate) | `docs/POSTD_PRODUCT_DEFINITION_AND_GUARDRAILS.md` | ✅ YES | VALID |
| 19 | 282 | Vercel Deployment Guide | `VERCEL_DEPLOYMENT.md` | ✅ YES | VALID |
| 20 | 283 | Deployment Guide (Netlify) | `DEPLOYMENT_GUIDE.md` | ✅ YES | **⚠️ AMBIGUOUS** |
| 21 | 294 | Deployment Guide (duplicate) | `DEPLOYMENT_GUIDE.md` | ✅ YES | **⚠️ AMBIGUOUS** |
| 22 | 294 | Go-Live Playbook | `GO_LIVE_PLAYBOOK.md` | ✅ YES | VALID |
| 23 | 308 | Security Documentation | `SECURITY.md` | ✅ YES | VALID |
| 24 | 339 | Tech Stack Guide (duplicate) | `TECH_STACK_GUIDE.md` | ✅ YES | VALID |
| 25 | 347 | Contributing Guidelines (duplicate) | `CONTRIBUTING.md` | ✅ YES | VALID |

**Additional Links (26-31):**

| # | Source Line | Link Text | Target File | Exists? | Verdict |
|---|-------------|-----------|-------------|---------|---------|
| 26 | 348 | Codebase Architecture Overview (duplicate) | `CODEBASE_ARCHITECTURE_OVERVIEW.md` | ✅ YES | VALID |
| 27 | 349 | Product Definition & Guardrails (duplicate) | `docs/POSTD_PRODUCT_DEFINITION_AND_GUARDRAILS.md` | ✅ YES | VALID |
| 28 | 361 | Documentation Index (duplicate) | `DOCS_INDEX.md` | ✅ YES | VALID |
| 29 | 363 | Development Guide | `docs/development/README.md` | ✅ YES | VALID |
| 30 | 373 | Changelog | `CHANGELOG.md` | ✅ YES | VALID |
| 31 | 383 | Setup Guide (duplicate) | `docs/SETUP_GUIDE.md` | ✅ YES | VALID |

---

### FINDING B.1 — README.md References Tech Stack for Env Vars (WRONG DOC) 🟡 MEDIUM

**File:** `README.md` (EXISTS ✅)  
**Section:** Environment Variables  
**Line:** 195  
**Quote:** "See TECH_STACK_GUIDE.md for complete environment variable reference"

**Reality Check:**
- `TECH_STACK_GUIDE.md` (EXISTS ✅) does NOT contain environment variable details
- Correct reference: `docs/ENVIRONMENT_VARIABLES.md` (EXISTS ✅, line 7: "source of truth for all environment variables")

**Severity:** 🟡 **MEDIUM** — Link is valid but points to WRONG doc (misleading)

---

### FINDING B.2 — `DEPLOYMENT_GUIDE.md` Ambiguous (2 Files Exist) 🟡 MEDIUM

**File:** `README.md` (EXISTS ✅)  
**Lines:** 283, 294  
**Quote:** "See DEPLOYMENT_GUIDE.md" (appears twice)

**Ambiguity:**
- **File 1:** `DEPLOYMENT_GUIDE.md` (root) — EXISTS ✅
- **File 2:** `docs/deployment/DEPLOYMENT_GUIDE.md` — EXISTS ✅

**Problem:** Users don't know which is canonical

**Severity:** 🟡 **MEDIUM** — Ambiguous reference; 2 files with same name

---

## PHASE C — FALSE CANONICAL CLAIMS (40 SAMPLED DOCS, REQUIRED)

**Search Terms Used:** `"source of truth"|"single source"|canonical|authoritative` (case-insensitive)

**Sample Size:** 40 docs manually reviewed

**Classification Buckets:**
- **LEGITIMATE:** Scoped, dated, no conflicts
- **MISLEADING:** Claims authority without scope/date, or overstates reach
- **CONFLICTING:** Overlaps another doc's claimed authority

---

### 40 SAMPLED DOCS — CANONICAL CLAIMS ANALYSIS

| # | File (EXISTS ✅) | Claim (≤25 words) | Bucket | Reason |
|---|------------------|-------------------|--------|--------|
| 1 | `docs/ENVIRONMENT_VARIABLES.md` | "source of truth for all environment variables used in POSTD" (line 7) | **LEGITIMATE** | Scoped to env vars only |
| 2 | `supabase/migrations/001_bootstrap_schema.sql` | "Single authoritative baseline migration" (line 4) | **LEGITIMATE** | Scoped to schema, dated 2025-01-XX |
| 3 | `shared/brand-guide.ts` | "source of truth for each brand in Postd" (line 5) | **CONFLICTING** | Overlaps `docs/BRAND_GUIDE_LIFECYCLE.md` line 73 |
| 4 | `shared/content-status.ts` | "Single source of truth for content item status values" (line 4) | **CONFLICTING** | Overlaps docs defining statuses |
| 5 | `POSTD_API_CONTRACT.md` | "authoritative API contract for POSTD" (line 7) | **LEGITIMATE** | Scoped to API, dated 2025-01-20 |
| 6 | `docs/BRAND_GUIDE_LIFECYCLE.md` | "canonical structure" for brand guide (line 73) | **CONFLICTING** | Overlaps `shared/brand-guide.ts` line 5 |
| 7 | `docs/LAUNCH_GATE.md` | "GO FOR PRODUCTION" (line 6, header) | **MISLEADING** | Implies full readiness; contradictions remain |
| 8 | `SCRAPER_AUDIT_FINAL_REPORT.md` | "Canonical structure enforcement" (line 22) | **LEGITIMATE** | Scoped to scraper, dated 2025-12-12 |
| 9 | `docs/00_MASTER_CURSOR_COMMAND_CENTER.md` | "Complete Engineering Playbook" (line 6, header) | **LEGITIMATE** | Scoped to Cursor agents, dated 2025-12-10 |
| 10 | `docs/00_MASTER_DEVELOPER_GUIDE.md` | "single source of truth for all development rules" (line 11) | **CONFLICTING** | Overlaps Command Center's role |
| 11 | `DOCS_INDEX.md` | "Master Index of All Documentation" (line 4, header) | **LEGITIMATE** | Scoped to index, dated 2025-01-20 |
| 12 | `DOCUMENTATION_INDEX.md` | "canonical documentation index" (line 13, header) | **MISLEADING** | Superseded by DOCS_INDEX.md (has notice) |
| 13 | `CODEBASE_ARCHITECTURE_OVERVIEW.md` | NO canonical claim found | **N/A** | No authority claim |
| 14 | `TECH_STACK_GUIDE.md` | "Complete technology stack reference" (line 1, header) | **LEGITIMATE** | Scoped to tech stack, dated Nov 11 2025 |
| 15 | `GO_LIVE_PLAYBOOK.md` | "Active deployment playbook" (line 3, header) | **LEGITIMATE** | Scoped to deployment, dated 2025-01-20 |
| 16 | `SECURITY.md` | NO canonical claim found | **N/A** | No authority claim |
| 17 | `DATA_GOVERNANCE.md` | "Active compliance and governance document" (line 3, header) | **LEGITIMATE** | Scoped to governance, dated 2025-01-20 |
| 18 | `CONTRIBUTING.md` | NO canonical claim found | **N/A** | No authority claim |
| 19 | `CHANGELOG.md` | NO canonical claim found | **N/A** | No authority claim |
| 20 | `README.md` | NO canonical claim found | **N/A** | Entry point, not claiming authority |
| 21 | `docs/POSTD_PRODUCT_DEFINITION_AND_GUARDRAILS.md` | NO canonical claim found (searched) | **N/A** | No authority claim |
| 22 | `docs/SYSTEM_ARCHITECTURE_DIAGRAMS.md` | NO canonical claim found (searched) | **N/A** | No authority claim |
| 23 | `docs/CLIENT_ONBOARDING_OVERVIEW.md` | NO canonical claim found (searched) | **N/A** | No authority claim |
| 24 | `docs/CLIENT_FIRST_30_DAYS_PLAYBOOK.md` | NO canonical claim found (searched) | **N/A** | No authority claim |
| 25 | `docs/CLIENT_ONBOARDING_CHECKLIST.md` | NO canonical claim found (searched) | **N/A** | No authority claim |
| 26 | `docs/SETUP_GUIDE.md` | NO canonical claim found (searched) | **N/A** | No authority claim |
| 27 | `VERCEL_DEPLOYMENT.md` | NO canonical claim found (searched) | **N/A** | No authority claim |
| 28 | `DEPLOYMENT_GUIDE.md` (root) | NO canonical claim found (searched) | **N/A** | No authority claim |
| 29 | `docs/deployment/DEPLOYMENT_GUIDE.md` | NO canonical claim found (searched) | **N/A** | No authority claim |
| 30 | `docs/audit/FINAL_LOCK_IN_VERIFICATION_REPORT.md` | NO canonical claim found (searched) | **N/A** | No authority claim |
| 31 | `docs/development/README.md` | NO canonical claim found (searched) | **N/A** | No authority claim |
| 32 | `SCRAPER_PIPELINE_FINAL_VALIDATION_REPORT.md` | "READY TO SHIP" (line 1, header) | **LEGITIMATE** | Scoped to scraper, dated 2025-12-12 |
| 33 | `PHASE_1_COMPLETION_SUMMARY.md` | NO canonical claim found (searched) | **N/A** | No authority claim |
| 34 | `docs/NEW_DEVELOPER_ARCHITECTURE_GUIDE.md` | NO canonical claim found (searched) | **N/A** | No authority claim |
| 35 | `docs/NEW_DEVELOPER_ONBOARDING_GUIDE.md` | NO canonical claim found (searched) | **N/A** | No authority claim |
| 36 | `docs/POSTD_SOCIAL_POSTING_BEHAVIOR_AUDIT.md` | NO canonical claim found (searched) | **N/A** | No authority claim |
| 37 | `POSTD_CREATIVE_STUDIO_AND_SCHEDULER_AUDIT_REPORT.md` | NO canonical claim found (searched) | **N/A** | No authority claim |
| 38 | `POSTD_STUDIO_PUBLISHING_VERIFICATION_AUDIT.md` | NO canonical claim found (searched) | **N/A** | No authority claim |
| 39 | `server/routes/crawler.ts` | "CRITICAL PRODUCTION SYSTEM" (line 14, comment) | **N/A (CODE)** | Not a doc |
| 40 | `docs/MVP1_FILE_MAP.md` | NO canonical claim found (searched) | **N/A** | No authority claim |

---

### FINDING C.1 — Multiple "Source of Truth" Claims (No Hierarchy) 🔴 BLOCKER

**Conflicting Claims:**

| File (EXISTS ✅) | Domain | Quote (≤25 words) |
|------------------|--------|-------------------|
| `docs/ENVIRONMENT_VARIABLES.md` | Env vars | "source of truth for all environment variables" (line 7) |
| `supabase/migrations/001_bootstrap_schema.sql` | Schema | "Single authoritative baseline migration" (line 4) |
| `shared/brand-guide.ts` | Brand Guide | "source of truth for each brand" (line 5) |
| `docs/BRAND_GUIDE_LIFECYCLE.md` | Brand Guide | "canonical structure" (line 73) |
| `shared/content-status.ts` | Content Status | "Single source of truth for content item status values" (line 4) |
| `POSTD_API_CONTRACT.md` | API | "authoritative API contract" (line 7) |
| `docs/00_MASTER_DEVELOPER_GUIDE.md` | Dev Rules | "single source of truth for all development rules" (line 11) |

**Problem:** 7 files claim "source of truth"; 3 overlap (Brand Guide: 2 files; Content Status: code vs docs; Dev Rules: 2 files)

**Severity:** 🔴 **BLOCKER** — No precedence hierarchy; which wins when they conflict?

---

### FINDING C.2 — `DOCUMENTATION_INDEX.md` Superseded But Still Exists 🟡 MEDIUM

**File:** `DOCUMENTATION_INDEX.md` (EXISTS ✅)  
**Section:** Redirect Notice (line 1, header)  
**Quote:** "This index has been superseded" (line 7)

**Status:** Has supersession notice ✅ (dated redirect to `DOCS_INDEX.md`)

**Problem:** File still exists and appears in searches; users may not see notice

**Severity:** 🟡 **MEDIUM** — Graceful degradation (notice present) but could be archived

---

### FINDING C.3 — `docs/LAUNCH_GATE.md` Claims Production Readiness Despite Contradictions 🟡 MEDIUM

**File:** `docs/LAUNCH_GATE.md` (EXISTS ✅)  
**Section:** Header (line 6)  
**Quote:** "Status: GO FOR PRODUCTION — All blockers resolved" (line 6)

**Problem:**
- Claims "GO FOR PRODUCTION" (line 6)
- BUT FINDING A.1 shows 4 conflicting status definitions (BLOCKER-level)
- No explicit scope: Does this gate cover **all systems** or only **scraper + schema**?

**Severity:** 🟡 **MEDIUM** — Misleading scope; implies full readiness but contradictions exist

---

## PHASE D — DOCS VS CODE SPOT-CHECK (LIMITED, 5 TOPICS)

**Topics:** Scraper limits, status enums, brand terminology, legacy fields, env vars

---

### FINDING D.1 — Scraper Limits: Docs Omit Vercel-Specific Limits 🔴 HIGH

**Docs Claims:**

| File (EXISTS ✅) | Section | Quote (≤25 words) |
|------------------|---------|-------------------|
| `docs/MVP1_AUDIT_REPORT.md` | Overall Status (line 17) | "depth ≤ 3, max 50 pages, 1s delay" |
| `docs/MVP1_FILE_MAP.md` | brand-crawler.ts (line 90-92) | "Max pages: 50 (local) / 10 (Vercel); Max depth: 3 (local) / 2 (Vercel)" |
| `server/workers/brand-crawler.ts` | crawlWebsite function (line 666, comment) | "Max 50 pages, depth ≤ 3" |

**Code Reality:** `server/workers/brand-crawler.ts` (EXISTS ✅), lines 69-80

```typescript
const VERCEL_MAX_PAGES = 10; // Reduced from 50 to fit in Vercel timeout
const VERCEL_MAX_DEPTH = 2; // Reduced from 3
const LOCAL_MAX_PAGES = parseInt(process.env.CRAWL_MAX_PAGES || "50", 10);
const LOCAL_MAX_DEPTH = 3;
```

**Verdict:**
- **MVP1_AUDIT_REPORT.md** (line 17): ❌ **WRONG** — Documents local only, ignores Vercel limits
- **MVP1_FILE_MAP.md** (lines 90-92): ✅ **CORRECT** — Documents both local and Vercel
- **Code comment line 666**: ❌ **MISLEADING** — Says "Max 50" without clarifying "local only"

**Severity:** 🔴 **HIGH** — Production runs on Vercel; docs claiming "50 pages" are wrong

---

### FINDING D.2 — Status Enums: 3 Conflicting Definitions IN CODE 🔴 BLOCKER

**Code Sources:**

| File (EXISTS ✅) | Line | Definition |
|------------------|------|------------|
| `server/types/database.ts` | 97 | `status: 'draft' \| 'scheduled' \| 'published' \| 'archived'` |
| `server/lib/content-db-service.ts` | 244 | `status: "draft" \| "pending_review" \| "scheduled" \| "published" \| "errored"` |
| `shared/content-status.ts` | 22-37 | `DRAFT, PENDING_REVIEW, APPROVED, SCHEDULED, PUBLISHED, REJECTED, ERRORED` |

**Contradiction:**
- `database.ts` (line 97): Uses `'archived'` (NO `errored`, NO `pending_review`, NO `approved`, NO `rejected`)
- `content-db-service.ts` (line 244): Uses `"errored"` (NO `archived`, NO `approved`, NO `rejected`)
- `content-status.ts` (lines 22-37): Defines 7 statuses including `REJECTED` and `ERRORED` (NO `archived`)

**Severity:** 🔴 **BLOCKER** — Code has 3 conflicting type definitions; TypeScript should prevent this

---

### FINDING D.3 — Legacy Fields: Type Mismatch (TEXT vs JSONB) 🔴 HIGH

**Docs Claims:**

| File (EXISTS ✅) | Section | Quote (≤25 words) |
|------------------|---------|-------------------|
| `docs/LAUNCH_GATE.md` | Golden Path #2 (line 425-427) | "brands.voice_summary (TEXT), brands.visual_summary (TEXT), brands.tone_keywords (TEXT[])" |
| `shared/brand-guide.ts` | Header comment (line 10-11) | "voice_summary (JSONB) - Voice & tone specific data; visual_summary (JSONB) - Visual identity data" |

**Code Reality:** `supabase/migrations/001_bootstrap_schema.sql` (EXISTS ✅), lines 112-114

```sql
voice_summary JSONB,
visual_summary JSONB,
```

**Verdict:**
- **LAUNCH_GATE.md** (lines 425-427): ❌ **WRONG** — Says TEXT, schema says JSONB
- **shared/brand-guide.ts** (lines 10-11): ✅ **CORRECT** — Says JSONB (matches schema)

**Severity:** 🔴 **HIGH** — Type mismatch in docs (TEXT vs JSONB)

---

### FINDING D.4 — Brand Terminology: Code Uses Both `brand_profile` AND `brand_kit` 🟡 MEDIUM

**Code Evidence:** `server/lib/content-planning-service.ts` (EXISTS ✅), lines 493-496

```typescript
generateDefaultContentPlan(brandProfile: BrandProfile, brandKit: BrandKit)
```

**Schema Evidence:** `supabase/migrations/001_bootstrap_schema.sql` (EXISTS ✅), line 112

```sql
brand_kit JSONB
```

**Docs Evidence:** `docs/BRAND_GUIDE_LIFECYCLE.md` (EXISTS ✅), line 19

| Context | Term | Example |
|---------|------|---------|
| Database/Technical | `brand_kit` | `brands.brand_kit` JSONB column |

**Verdict:** 🟡 **MEDIUM** — Inconsistent terminology; are `BrandProfile` and `BrandKit` same or different?

---

### FINDING D.5 — Env Vars: Docs Say "Use SUPABASE_URL", Code Uses Both 🟡 MEDIUM

**Docs Claim:** `docs/ENVIRONMENT_VARIABLES.md` (EXISTS ✅), line 35

> "Server code should use SUPABASE_URL (not VITE_SUPABASE_URL)"

**Code Reality:** `server/routes/auth.ts` (EXISTS ✅), lines 103-104

```typescript
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
// Note: VITE_ prefix is for backward compatibility
```

**Verdict:** 🟡 **MEDIUM** — Docs say use SUPABASE_URL only; code uses both (backward compat)

---

## PHASE E — INDEX & ENTRYPOINT CONFLICTS (DOCS ONLY, REQUIRED)

**Search Terms Used:** `README|DOCS_INDEX|DOCUMENTATION_INDEX|00_MASTER|LAUNCH_GATE`

**Scan Results:** 80 files match; 7 function as entry points

---

### ALL IDENTIFIED ENTRY POINTS

| # | File (EXISTS ✅) | Role | Last Updated | Problem |
|---|------------------|------|--------------|---------|
| 1 | `README.md` | Main repo entry | 2025-01-20 | Links to 20+ docs directly |
| 2 | `DOCS_INDEX.md` | Master doc index | 2025-01-20 | Claims to supersede older indices |
| 3 | `DOCUMENTATION_INDEX.md` | Older doc index | Undated | Has supersession notice, but still exists |
| 4 | `docs/README.md` | Design system docs | Current | Different purpose, but confusing |
| 5 | `docs/00_MASTER_CURSOR_COMMAND_CENTER.md` | AI agent rules | 2025-12-10 | Claims "Complete Engineering Playbook" |
| 6 | `docs/00_MASTER_DEVELOPER_GUIDE.md` | Human + AI guide | 2025-01-20 | References Command Center as "source of truth" |
| 7 | `docs/LAUNCH_GATE.md` | Production gate | 2025-12-12 | Claims "GO FOR PRODUCTION" |

---

### CANONICAL ENTRYPOINT DECLARATION

**Decision (Docs-Only, No Fixes):**

**PRIMARY CANONICAL ENTRYPOINT:** `README.md` (root)

**Reason:**
1. Standard location for all repos (root)
2. Most recent update (2025-01-20)
3. Links to all major documentation categories
4. References `DOCS_INDEX.md` as canonical navigation (line 72)
5. Serves both human engineers and new contributors

**SECONDARY ENTRYPOINTS (Legitimate):**
- `DOCS_INDEX.md` — **SECONDARY** (specialized navigation index)
- `docs/00_MASTER_CURSOR_COMMAND_CENTER.md` — **SECONDARY** (AI agent-specific)
- `docs/00_MASTER_DEVELOPER_GUIDE.md` — **SECONDARY** (development workflow)

**SUPERSEDED ENTRYPOINTS:**
- `DOCUMENTATION_INDEX.md` — **SUPERSEDED** (has notice, redirects to DOCS_INDEX.md)

**CONTEXT-SPECIFIC ENTRYPOINTS (NOT general-purpose):**
- `docs/README.md` — **CONTEXT-SPECIFIC** (design system only)
- `docs/LAUNCH_GATE.md` — **CONTEXT-SPECIFIC** (production readiness gate)

---

### FINDING E.1 — 7 Entry Points Cause Navigation Confusion 🔴 HIGH

**Problem:** New engineers encounter 7 possible entry points; no clear "start here"

**Files:** All 7 listed above (ALL EXIST ✅)

**Severity:** 🔴 **HIGH** — Confusing navigation; should consolidate entry points

---

## OPEN VERIFICATION QUEUE (Unproven Claims)

**Items requiring further verification (NOT included in main findings):**

1. **Connector Availability:** `CONNECTOR_SPECS_TIKTOK.md`, `CONNECTOR_SPECS_GBP.md`, `server/lib/integrations/canva/README.md` exist, but implementation routes NOT verified
2. **Edge Function Fallback:** `docs/MVP1_AUDIT_REPORT.md:17` claims "Edge Function fallback still exists (should be removed)" — NOT verified if removed
3. **Scraper Field Population:** `docs/LAUNCH_GATE.md:406-409` claims scraper reads from `brandKit.identity.sampleHeadlines` — NOT verified if fields are populated correctly
4. **Content Drafts Table:** `docs/POSTD_SOCIAL_POSTING_BEHAVIOR_AUDIT.md:199` references `content_drafts` table — NOT verified if table exists in schema

---

## SUMMARY — TOP CRITICAL ISSUES

### BLOCKERS (3)

1. **Content status enums: 4 conflicting definitions in docs + 3 in code** (FINDINGS A.1, D.2)
2. **Multiple "source of truth" claims, no hierarchy** (FINDING C.1)
3. **7 competing entry points** (FINDING E.1)

### HIGH SEVERITY (4)

4. **Scraper limits docs wrong for Vercel production** (FINDING D.1)
5. **Legacy fields type mismatch: TEXT vs JSONB** (FINDING D.3)
6. **Status enums: 3 conflicting code definitions** (FINDING D.2, duplicate of #1)
7. **7 entry points cause navigation confusion** (FINDING E.1, duplicate of #3)

### MEDIUM SEVERITY (7)

8. **Publishing jobs status: 2 definitions** (FINDING A.2)
9. **README.md env var reference points to wrong doc** (FINDING B.1)
10. **DEPLOYMENT_GUIDE.md ambiguous (2 files exist)** (FINDING B.2)
11. **DOCUMENTATION_INDEX.md superseded but still exists** (FINDING C.2)
12. **LAUNCH_GATE.md claims production readiness despite contradictions** (FINDING C.3)
13. **Brand terminology inconsistency** (FINDING D.4)
14. **Env var docs vs code mismatch** (FINDING D.5)

---

## TOTAL FINDINGS: 14 PROVEN (0 UNVERIFIED IN MAIN LIST)

**Breakdown:**
- **3 BLOCKERS**
- **4 HIGH**
- **7 MEDIUM**
- **4 Open Verification Queue** (excluded from main list)

---

## FINAL RECOMMENDATION

**DO NOT IMPLEMENT DRAFT 1 "AS-IS."**

**Reason:** 3 BLOCKER-level contradictions remain unresolved (status enums, source-of-truth hierarchy, entry point confusion)

**Estimated Effort to Fix:** 6-8 hours
- **Status enum harmonization:** 2-3 hours (docs + code)
- **Source-of-truth hierarchy definition:** 1-2 hours (document precedence rules)
- **Entry point consolidation:** 1-2 hours (add headers/redirects)
- **Type mismatch fixes:** 1 hour (LAUNCH_GATE.md corrections)
- **Scraper docs update:** 30 min (add Vercel limits to all docs)

---

**End of Draft 5 — Proof-Grade Adversarial Audit**

