# MVP Database Table Audit Report

**Date**: 2025-01-20  
**Auditor**: Internal Audit Agent  
**Status**: ✅ READ-ONLY AUDIT COMPLETE

---

## 1. Overview

### Purpose
This audit verifies that all MVP features have their required database tables properly defined, migrated, wired into TypeScript, and secured with RLS policies.

### Summary
This audit examined **5 core MVPs** and **50+ database tables** across the POSTD/Aligned-20AI codebase. The audit confirms:

- ✅ **Most tables exist** in SQL migrations (`supabase/migrations/001_bootstrap_schema.sql`)
- ✅ **RLS is enabled** on all brand-scoped tables
- ⚠️ **Some gaps** in TypeScript type coverage and route wiring
- ⚠️ **Some tables** referenced in code but not fully utilized
- ❌ **Some spec entities** mentioned in docs but missing table definitions

**Overall Health**: 🟡 **PARTIALLY COMPLETE** - Core infrastructure is solid, but some MVP-specific tables need completion.

---

## 2. Section 1 – MVP Inventory

| MVP Name | Description | Main Doc/Spec Path | Status |
|----------|-------------|-------------------|--------|
| **Brand Guide Builder** | Brand intake form, Brand Guide editor, version history tracking | `docs/phases/PHASE_3_AUDIT_REPORT.md`, `BRAND_GUIDE_PHASE3_COMPLETION_SUMMARY.md` | ✅ Active |
| **AI Content Generator** | Multi-agent content generation (Doc, Design, Advisor), content packages, BFS scoring | `AUDIT_SUMMARY.md`, `docs/architecture/ALIGNED_20AI_ROADMAP.md` | ✅ Active |
| **Creative Studio** | Canvas-based design editor with templates, brand kit integration | `CODEBASE_ARCHITECTURE_OVERVIEW.md`, `client/app/(postd)/studio/page.tsx` | ✅ Active |
| **Scheduler** | Content calendar, scheduled posts, publishing queue, platform connections | `FEATURE_AUDIT_QUICK_REFERENCE.txt`, `server/lib/publishing-queue.ts` | ✅ Active |
| **MVP1: Website Scraper** | Brand intake with website scraping, image extraction, brand kit auto-population | `docs/MVP1_SUMMARY.md` | ✅ Active |

---

## 3. Section 2 – MVP → Tables Matrix

### 3.1 Brand Guide Builder MVP

| Table Name | Purpose | Where Defined | Brand/Tenant Scoped? | Key Relationships |
|------------|---------|--------------|---------------------|-------------------|
| `brands` | Main brand entity, stores brand_kit JSONB | `001_bootstrap_schema.sql:100` | ✅ Yes (tenant_id, brand_members) | → tenants, → auth.users (created_by) |
| `brand_guide_versions` | Version history for Brand Guide changes | `002_create_brand_guide_versions.sql:9` | ✅ Yes (brand_id) | → brands, → auth.users (changed_by) |
| `brand_members` | Brand access control (RBAC) | `001_bootstrap_schema.sql:125` | ✅ Yes (brand_id) | → brands, → auth.users |
| `media_assets` | Scraped images and uploaded assets | `001_bootstrap_schema.sql:552` | ✅ Yes (brand_id, tenant_id) | → brands, → tenants |
| `user_profiles` | User identity and preferences | `001_bootstrap_schema.sql:74` | ⚠️ Partial (no brand_id, but used via brand_members) | → auth.users |

**Notes**:
- ✅ `brands.brand_kit` (JSONB) stores full Brand Guide structure
- ✅ `brands.voice_summary` (JSONB) stores voice & tone data
- ✅ `brands.visual_summary` (JSONB) stores visual identity data
- ✅ `brand_guide_versions` tracks all changes with field-level diffs
- ⚠️ Brand Guide data is stored in JSONB fields, not normalized tables

---

### 3.2 AI Content Generator MVP

| Table Name | Purpose | Where Defined | Brand/Tenant Scoped? | Key Relationships |
|------------|---------|--------------|---------------------|-------------------|
| `content_packages` | AI-generated content packages (Doc + Design collaboration) | `001_bootstrap_schema.sql:639` | ✅ Yes (brand_id TEXT) | → brands (via brand_id TEXT) |
| `content_items` | Individual content items (posts, captions, etc.) | `001_bootstrap_schema.sql:167` | ✅ Yes (brand_id UUID) | → brands, → auth.users (created_by) |
| `strategy_briefs` | Advisor-generated strategy briefs | `001_bootstrap_schema.sql:624` | ✅ Yes (brand_id TEXT) | → brands (via brand_id TEXT) |
| `brand_history` | AI learning loop - brand decision history | `001_bootstrap_schema.sql:657` | ✅ Yes (brand_id TEXT) | → brands (via brand_id TEXT) |
| `brand_success_patterns` | Learned success patterns per brand | `001_bootstrap_schema.sql:673` | ✅ Yes (brand_id TEXT) | → brands (via brand_id TEXT) |
| `collaboration_logs` | Multi-agent collaboration audit trail | `001_bootstrap_schema.sql:685` | ✅ Yes (brand_id TEXT) | → brands (via brand_id TEXT) |
| `performance_logs` | Post-publish analytics and performance | `001_bootstrap_schema.sql:700` | ✅ Yes (brand_id TEXT) | → brands (via brand_id TEXT) |
| `platform_insights` | Platform-specific performance insights | `001_bootstrap_schema.sql:716` | ✅ Yes (brand_id TEXT) | → brands (via brand_id TEXT) |
| `advisor_review_audits` | Advisor scoring and feedback | `001_bootstrap_schema.sql:760` | ✅ Yes (brand_id TEXT) | → brands (via brand_id TEXT) |
| `weekly_summaries` | Weekly performance summaries | `001_bootstrap_schema.sql:745` | ✅ Yes (brand_id TEXT) | → brands (via brand_id TEXT) |
| `generation_logs` | AI generation audit trail | `archived/20250117_create_agent_safety_tables.sql:20` | ✅ Yes (brand_id) | → brands |
| `prompt_templates` | Versioned AI prompt templates | `archived/20250117_create_agent_safety_tables.sql:48` | ⚠️ Global (no brand_id) | None |
| `agent_cache` | 24h cache for Advisor outputs | `archived/20250117_create_agent_safety_tables.sql:62` | ✅ Yes (brand_id) | → brands |
| `content_review_queue` | Human-in-the-loop review queue | `archived/20250117_create_agent_safety_tables.sql:77` | ✅ Yes (brand_id) | → brands |

**Notes**:
- ⚠️ **CRITICAL**: `content_packages` uses `brand_id TEXT` (not UUID), inconsistent with `content_items.brand_id UUID`
- ⚠️ Many persistence schema tables use `brand_id TEXT` instead of `brand_id UUID` (legacy design)
- ✅ `content_items` is properly UUID-scoped and used in routes
- ⚠️ `generation_logs`, `prompt_templates`, `agent_cache`, `content_review_queue` are in `archived/` - may not be active

---

### 3.3 Creative Studio MVP

| Table Name | Purpose | Where Defined | Brand/Tenant Scoped? | Key Relationships |
|------------|---------|--------------|---------------------|-------------------|
| `content_items` | Design drafts and canvas states | `001_bootstrap_schema.sql:167` | ✅ Yes (brand_id UUID) | → brands, → auth.users |
| `media_assets` | Design assets, images, templates | `001_bootstrap_schema.sql:552` | ✅ Yes (brand_id, tenant_id) | → brands, → tenants |
| `brand_assets` | Brand-specific assets (logos, etc.) | `001_bootstrap_schema.sql:581` | ✅ Yes (brand_id) | → brands |
| `assets` | General asset library | `001_bootstrap_schema.sql:595` | ✅ Yes (brand_id) | → brands |

**Notes**:
- ⚠️ Creative Studio appears to use `content_items` for design state (via `content JSONB`)
- ✅ Media assets are properly scoped and used
- ⚠️ No dedicated `designs` or `canvas_states` table - designs stored in `content_items.content` JSONB

---

### 3.4 Scheduler MVP

| Table Name | Purpose | Where Defined | Brand/Tenant Scoped? | Key Relationships |
|------------|---------|--------------|---------------------|-------------------|
| `scheduled_content` | Calendar entries, scheduled posts | `001_bootstrap_schema.sql:186` | ✅ Yes (brand_id UUID) | → brands, → content_items |
| `publishing_jobs` | Async publishing queue jobs | `001_bootstrap_schema.sql:199` | ✅ Yes (brand_id, tenant_id) | → brands, → tenants |
| `publishing_logs` | Per-platform publish audit trail | `001_bootstrap_schema.sql:212` | ✅ Yes (brand_id) | → publishing_jobs, → brands |
| `platform_connections` | OAuth tokens and platform accounts | `001_bootstrap_schema.sql:403` | ✅ Yes (brand_id) | → brands |
| `platform_sync_logs` | Analytics sync tracking | `001_bootstrap_schema.sql:423` | ✅ Yes (brand_id) | → brands |
| `webhook_events` | Incoming webhook events | `001_bootstrap_schema.sql:435` | ✅ Yes (brand_id) | → brands |
| `webhook_attempts` | Webhook retry attempts | `001_bootstrap_schema.sql:447` | ✅ Yes (via event_id) | → webhook_events |
| `monthly_content_plans` | Advisor-generated monthly plans | `archived/20250118_create_content_calendar_tables.sql:16` | ✅ Yes (brand_id) | → brands |
| `weekly_summaries` | Weekly performance summaries | `001_bootstrap_schema.sql:745` | ✅ Yes (brand_id TEXT) | → brands (via brand_id TEXT) |

**Notes**:
- ✅ Core scheduling tables are properly defined and scoped
- ✅ `publishing_jobs` and `publishing_logs` support async queue processing
- ⚠️ `monthly_content_plans` is in `archived/` - may not be active
- ✅ `platform_connections` properly stores OAuth tokens with expiration

---

### 3.5 MVP1: Website Scraper

| Table Name | Purpose | Where Defined | Brand/Tenant Scoped? | Key Relationships |
|------------|---------|--------------|---------------------|-------------------|
| `brands` | Stores scraped data in `brand_kit` JSONB | `001_bootstrap_schema.sql:100` | ✅ Yes | → tenants |
| `media_assets` | Scraped images with `source='scrape'` | `001_bootstrap_schema.sql:552` | ✅ Yes (brand_id, tenant_id) | → brands, → tenants |
| `brand_assets` | Brand-specific scraped assets | `001_bootstrap_schema.sql:581` | ✅ Yes (brand_id) | → brands |

**Notes**:
- ✅ Scraper persists to `brands.brand_kit` JSONB and `media_assets` table
- ✅ `media_assets` uses `source` field to distinguish scraped vs uploaded
- ✅ Scraper requires `tenant_id` for proper image persistence

---

## 4. Section 3 – Table Health

### 4.1 Core Identity & Access Tables

#### `tenants`
- **Where Defined**: `001_bootstrap_schema.sql:65`
- **MVPs Using**: All (foundation table)
- **RLS Status**: ✅ Enabled (`001_bootstrap_schema.sql:1192`)
- **Policies**: Users can view their own tenant
- **TS Type**: ⚠️ Not found in `server/types/database.ts`
- **Zod Schema**: ❌ Not found
- **Notes**: Foundation table, used by all MVPs

#### `brands`
- **Where Defined**: `001_bootstrap_schema.sql:100`
- **MVPs Using**: All (Brand Guide, AI Content, Creative Studio, Scheduler, Scraper)
- **RLS Status**: ✅ Enabled (`001_bootstrap_schema.sql:1247`)
- **Policies**: Users can view brands they're members of (via `brand_members`)
- **TS Type**: ✅ Found in `server/types/database.ts` (partial)
- **Zod Schema**: ⚠️ Partial (used in routes but not comprehensive)
- **Notes**: Core table, stores Brand Guide in JSONB fields (`brand_kit`, `voice_summary`, `visual_summary`)

#### `brand_members`
- **Where Defined**: `001_bootstrap_schema.sql:125`
- **MVPs Using**: All (access control)
- **RLS Status**: ✅ Enabled (`001_bootstrap_schema.sql:1273`)
- **Policies**: Users can view their own memberships
- **TS Type**: ✅ Found in `client/lib/supabase.ts` as `BrandMember`
- **Zod Schema**: ❌ Not found
- **Notes**: RBAC foundation, properly scoped

---

### 4.2 Brand Guide Tables

#### `brand_guide_versions`
- **Where Defined**: `002_create_brand_guide_versions.sql:9`
- **MVPs Using**: Brand Guide Builder
- **RLS Status**: ✅ Enabled (`002_create_brand_guide_versions.sql:29`)
- **Policies**: 
  - ✅ SELECT: Users can view versions for brands they're members of
  - ✅ INSERT: Service role only (via API)
  - ❌ UPDATE: Blocked (append-only)
  - ❌ DELETE: Blocked (audit trail)
- **TS Type**: ⚠️ Not found in `server/types/database.ts`
- **Zod Schema**: ❌ Not found
- **Notes**: ✅ Properly secured, append-only audit trail

---

### 4.3 Content & AI Tables

#### `content_items`
- **Where Defined**: `001_bootstrap_schema.sql:167`
- **MVPs Using**: AI Content Generator, Creative Studio, Scheduler
- **RLS Status**: ✅ Enabled (`001_bootstrap_schema.sql:1336`)
- **Policies**: Users can view content for brands they're members of
- **TS Type**: ✅ Found in `server/types/database.ts` as `ContentItem`
- **Zod Schema**: ⚠️ Partial (used in routes)
- **Notes**: ✅ Properly scoped with `brand_id UUID`, used in routes

#### `content_packages`
- **Where Defined**: `001_bootstrap_schema.sql:639`
- **MVPs Using**: AI Content Generator
- **RLS Status**: ✅ Enabled (`001_bootstrap_schema.sql:2008`)
- **Policies**: Users can view packages for brands they're members of (via `is_brand_member_text()`)
- **TS Type**: ⚠️ Found in `shared/aiContent.ts` (partial)
- **Zod Schema**: ⚠️ Partial
- **Notes**: ⚠️ **CRITICAL**: Uses `brand_id TEXT` (not UUID) - inconsistent with other tables

#### `strategy_briefs`
- **Where Defined**: `001_bootstrap_schema.sql:624`
- **MVPs Using**: AI Content Generator (Advisor Agent)
- **RLS Status**: ✅ Enabled (`001_bootstrap_schema.sql:1956`)
- **Policies**: Users can view briefs for brands they're members of (via `is_brand_member_text()`)
- **TS Type**: ⚠️ Found in `shared/collaboration-artifacts.ts` (partial)
- **Zod Schema**: ⚠️ Partial
- **Notes**: ⚠️ Uses `brand_id TEXT` (not UUID)

---

### 4.4 Publishing & Scheduling Tables

#### `scheduled_content`
- **Where Defined**: `001_bootstrap_schema.sql:186`
- **MVPs Using**: Scheduler
- **RLS Status**: ✅ Enabled (`001_bootstrap_schema.sql:1359`)
- **Policies**: Users can view scheduled content for brands they're members of
- **TS Type**: ⚠️ Not found in `server/types/database.ts`
- **Zod Schema**: ❌ Not found
- **Notes**: ✅ Properly scoped, used in calendar routes

#### `publishing_jobs`
- **Where Defined**: `001_bootstrap_schema.sql:199`
- **MVPs Using**: Scheduler
- **RLS Status**: ✅ Enabled (`001_bootstrap_schema.sql:1382`)
- **Policies**: Users can view jobs for brands they're members of
- **TS Type**: ✅ Found in `server/lib/publishing-db-service.ts` as `PublishingJobRecord`
- **Zod Schema**: ⚠️ Partial
- **Notes**: ✅ Properly scoped, used in `server/lib/publishing-queue.ts`

#### `publishing_logs`
- **Where Defined**: `001_bootstrap_schema.sql:212`
- **MVPs Using**: Scheduler
- **RLS Status**: ✅ Enabled (`001_bootstrap_schema.sql:1395`)
- **Policies**: Users can view logs for brands they're members of
- **TS Type**: ✅ Found in `server/lib/publishing-db-service.ts` as `PublishingLogRecord`
- **Zod Schema**: ❌ Not found
- **Notes**: ✅ Properly scoped, audit trail for publishing

#### `platform_connections`
- **Where Defined**: `001_bootstrap_schema.sql:403`
- **MVPs Using**: Scheduler (OAuth connections)
- **RLS Status**: ✅ Enabled (`001_bootstrap_schema.sql:1668`)
- **Policies**: Users can view connections for brands they're members of
- **TS Type**: ✅ Found in `server/types/database.ts` as `PlatformConnectionRecord`
- **Zod Schema**: ⚠️ Partial
- **Notes**: ✅ Stores OAuth tokens with expiration, properly secured

---

### 4.5 Media & Assets Tables

#### `media_assets`
- **Where Defined**: `001_bootstrap_schema.sql:552`
- **MVPs Using**: Brand Guide Builder, Creative Studio, MVP1 Scraper
- **RLS Status**: ✅ Enabled (`001_bootstrap_schema.sql:1887`)
- **Policies**: Users can view assets for brands they're members of
- **TS Type**: ✅ Found in `server/types/database.ts` as `MediaAssetRowDB`
- **Zod Schema**: ⚠️ Partial
- **Notes**: ✅ Properly scoped, stores scraped images with `source='scrape'`

---

### 4.6 Persistence Schema Tables (AI Learning Loop)

**Note**: These tables use `brand_id TEXT` instead of `brand_id UUID` (legacy design).

#### `brand_history`
- **Where Defined**: `001_bootstrap_schema.sql:657`
- **MVPs Using**: AI Content Generator
- **RLS Status**: ✅ Enabled (`001_bootstrap_schema.sql:2052`)
- **Policies**: Users can view history for brands they're members of (via `is_brand_member_text()`)
- **TS Type**: ⚠️ Not found
- **Zod Schema**: ❌ Not found
- **Notes**: ⚠️ Uses `brand_id TEXT`

#### `brand_success_patterns`
- **Where Defined**: `001_bootstrap_schema.sql:673`
- **MVPs Using**: AI Content Generator
- **RLS Status**: ✅ Enabled (`001_bootstrap_schema.sql:2088`)
- **Policies**: Users can view patterns for brands they're members of (via `is_brand_member_text()`)
- **TS Type**: ⚠️ Not found
- **Zod Schema**: ❌ Not found
- **Notes**: ⚠️ Uses `brand_id TEXT`

#### `collaboration_logs`
- **Where Defined**: `001_bootstrap_schema.sql:685`
- **MVPs Using**: AI Content Generator
- **RLS Status**: ✅ Enabled (`001_bootstrap_schema.sql:2110`)
- **Policies**: Users can view logs for brands they're members of (via `is_brand_member_text()`)
- **TS Type**: ⚠️ Found in `shared/collaboration-artifacts.ts` (partial)
- **Zod Schema**: ⚠️ Partial
- **Notes**: ⚠️ Uses `brand_id TEXT`

#### `performance_logs`
- **Where Defined**: `001_bootstrap_schema.sql:700`
- **MVPs Using**: AI Content Generator
- **RLS Status**: ✅ Enabled (`001_bootstrap_schema.sql:2129`)
- **Policies**: Users can view logs for brands they're members of (via `is_brand_member_text()`)
- **TS Type**: ⚠️ Not found
- **Zod Schema**: ❌ Not found
- **Notes**: ⚠️ Uses `brand_id TEXT`

---

### 4.7 Archived Tables (May Not Be Active)

**Note**: These tables are in `archived/` directory - verify if they're actually used.

#### `generation_logs`
- **Where Defined**: `archived/20250117_create_agent_safety_tables.sql:20`
- **MVPs Using**: AI Content Generator (potentially)
- **RLS Status**: ✅ Enabled
- **TS Type**: ⚠️ Not found
- **Zod Schema**: ❌ Not found
- **Notes**: ⚠️ In `archived/` - may not be active

#### `monthly_content_plans`
- **Where Defined**: `archived/20250118_create_content_calendar_tables.sql:16`
- **MVPs Using**: Scheduler (potentially)
- **RLS Status**: ✅ Enabled
- **TS Type**: ⚠️ Not found
- **Zod Schema**: ❌ Not found
- **Notes**: ⚠️ In `archived/` - may not be active

---

## 5. Section 4 – Findings & Gaps

### 5.1 Critical for Launch

#### ❌ **CRITICAL: `brand_id` Type Inconsistency**
- **Issue**: `content_packages`, `strategy_briefs`, `brand_history`, `brand_success_patterns`, `collaboration_logs`, `performance_logs`, `platform_insights`, `token_health`, `weekly_summaries`, `advisor_review_audits` all use `brand_id TEXT` instead of `brand_id UUID`
- **Impact**: Cannot use foreign key constraints, requires custom RLS helper functions (`is_brand_member_text()`)
- **Location**: `001_bootstrap_schema.sql` (persistence schema section)
- **Recommendation**: Migrate to `brand_id UUID` with proper foreign keys, or document this as intentional design

#### ⚠️ **Missing TypeScript Types**
- **Issue**: Many tables lack TypeScript types in `server/types/database.ts`:
  - `brand_guide_versions`
  - `scheduled_content`
  - `brand_history`
  - `brand_success_patterns`
  - `performance_logs`
  - `platform_insights`
  - `token_health`
  - `weekly_summaries`
  - `advisor_review_audits`
- **Impact**: Type safety gaps, potential runtime errors
- **Recommendation**: Add TypeScript types for all tables

#### ⚠️ **Archived Tables Status Unclear**
- **Issue**: Tables in `archived/` directory may or may not be active:
  - `generation_logs`
  - `prompt_templates`
  - `agent_cache`
  - `content_review_queue`
  - `monthly_content_plans`
- **Impact**: Unclear if these are used or deprecated
- **Recommendation**: Verify if these tables are actually used, or remove from migrations if deprecated

---

### 5.2 Important but Not Blocking

#### ⚠️ **Missing Zod Schemas**
- **Issue**: Many tables lack comprehensive Zod validation schemas
- **Impact**: Input validation gaps, potential security issues
- **Recommendation**: Add Zod schemas for all table inserts/updates

#### ⚠️ **Creative Studio Design Storage**
- **Issue**: Creative Studio designs stored in `content_items.content` JSONB (no dedicated `designs` table)
- **Impact**: May be fine, but unclear if this is the intended design
- **Recommendation**: Document design storage strategy, or create dedicated `designs` table if needed

#### ⚠️ **No Dedicated Publishing Queue Table**
- **Issue**: `publishing_jobs` serves as queue, but no explicit `publishing_queue` table mentioned in specs
- **Impact**: May be fine if `publishing_jobs` is the queue
- **Recommendation**: Clarify if `publishing_jobs` is the queue, or if a separate queue table is needed

---

### 5.3 Nice to Have / Cleanup

#### ⚠️ **Duplicate/Similar Tables**
- **Issue**: Multiple asset tables (`media_assets`, `brand_assets`, `assets`) - unclear distinction
- **Impact**: Confusion about which table to use
- **Recommendation**: Document purpose of each table, or consolidate if redundant

#### ⚠️ **Missing Indexes**
- **Issue**: Some tables may benefit from additional indexes (e.g., `content_packages.brand_id TEXT` needs index)
- **Impact**: Potential performance issues
- **Recommendation**: Review and add indexes for frequently queried columns

---

## 6. Section 5 – Recommended Next Steps

### 6.1 Immediate Actions (Critical)

1. **Resolve `brand_id` Type Inconsistency**
   - **Action**: Decide on `brand_id TEXT` vs `brand_id UUID` for persistence schema tables
   - **Location**: `supabase/migrations/` (new migration)
   - **Impact**: High - affects foreign keys, RLS policies, type safety

2. **Add Missing TypeScript Types**
   - **Action**: Add types for all tables in `server/types/database.ts`
   - **Priority Tables**: `brand_guide_versions`, `scheduled_content`, persistence schema tables
   - **Location**: `server/types/database.ts`

3. **Verify Archived Tables Status**
   - **Action**: Check if `archived/` tables are actually used in code
   - **Location**: Search codebase for references to `generation_logs`, `monthly_content_plans`, etc.
   - **Decision**: Either move to active migrations or remove if unused

---

### 6.2 Short-Term Actions (Important)

4. **Add Comprehensive Zod Schemas**
   - **Action**: Create Zod schemas for all table inserts/updates
   - **Location**: `shared/validation-schemas.ts` or per-route validation
   - **Priority**: Tables used in public API routes

5. **Document Table Purposes**
   - **Action**: Add comments to SQL migrations explaining each table's purpose
   - **Location**: `supabase/migrations/001_bootstrap_schema.sql`
   - **Benefit**: Reduces confusion about which table to use

6. **Add Missing Indexes**
   - **Action**: Review query patterns and add indexes for frequently queried columns
   - **Location**: `supabase/migrations/` (new migration)
   - **Priority**: `content_packages.brand_id`, `strategy_briefs.brand_id` (TEXT columns)

---

### 6.3 Long-Term Actions (Nice to Have)

7. **Consolidate Asset Tables**
   - **Action**: Review `media_assets`, `brand_assets`, `assets` - consolidate if redundant
   - **Location**: `supabase/migrations/` (new migration)
   - **Benefit**: Simplifies codebase

8. **Create Design Storage Strategy**
   - **Action**: Document or create dedicated `designs` table for Creative Studio
   - **Location**: `supabase/migrations/` (if new table needed)
   - **Benefit**: Clear separation of concerns

9. **Add Table Usage Documentation**
   - **Action**: Document which routes/services use which tables
   - **Location**: `docs/` directory
   - **Benefit**: Easier onboarding and maintenance

---

## 7. Appendix: Table Reference Quick Lookup

### Tables by MVP

**Brand Guide Builder**:
- `brands`, `brand_guide_versions`, `brand_members`, `media_assets`, `user_profiles`

**AI Content Generator**:
- `content_packages`, `content_items`, `strategy_briefs`, `brand_history`, `brand_success_patterns`, `collaboration_logs`, `performance_logs`, `platform_insights`, `advisor_review_audits`, `weekly_summaries`, `generation_logs` (archived), `prompt_templates` (archived), `agent_cache` (archived), `content_review_queue` (archived)

**Creative Studio**:
- `content_items`, `media_assets`, `brand_assets`, `assets`

**Scheduler**:
- `scheduled_content`, `publishing_jobs`, `publishing_logs`, `platform_connections`, `platform_sync_logs`, `webhook_events`, `webhook_attempts`, `monthly_content_plans` (archived), `weekly_summaries`

**MVP1: Website Scraper**:
- `brands`, `media_assets`, `brand_assets`

---

### Tables by RLS Status

**✅ RLS Enabled (All brand-scoped tables)**:
- All tables in `001_bootstrap_schema.sql` have RLS enabled
- All tables in `002_create_brand_guide_versions.sql` have RLS enabled
- All archived tables have RLS enabled

**⚠️ RLS Policies Vary**:
- Most tables use `brand_members` check
- Persistence schema tables use `is_brand_member_text()` helper
- Some tables (e.g., `prompt_templates`) are global (no brand_id)

---

### Tables by TypeScript Coverage

**✅ Has Types**:
- `brands` (partial)
- `content_items`
- `publishing_jobs`
- `publishing_logs`
- `platform_connections`
- `media_assets`

**❌ Missing Types**:
- `brand_guide_versions`
- `scheduled_content`
- `brand_history`
- `brand_success_patterns`
- `performance_logs`
- `platform_insights`
- `token_health`
- `weekly_summaries`
- `advisor_review_audits`
- Most archived tables

---

---

## 8. Database Changes Applied (2025-01-20)

### Migration Files Created

#### `003_fix_brand_id_persistence_schema.sql`
- **Purpose**: Step 1 of 2-step migration to fix `brand_id TEXT` → `brand_id UUID` inconsistency
- **Changes**:
  - Added `brand_id_uuid UUID` column to 10 persistence schema tables
  - Backfilled UUID values from existing TEXT columns (where valid UUID format)
  - Added indexes on new UUID columns for performance
- **Tables Affected**:
  - `strategy_briefs`, `content_packages`, `brand_history`, `brand_success_patterns`
  - `collaboration_logs`, `performance_logs`, `platform_insights`, `token_health`
  - `weekly_summaries`, `advisor_review_audits`
- **Status**: ✅ Step 1 complete - Step 2 (FKs, RLS updates, deprecation) pending

#### `004_activate_generation_logs_table.sql`
- **Purpose**: Activate `generation_logs` table from archived migrations
- **Changes**:
  - Created `generation_logs` table with proper UUID `brand_id` (not TEXT)
  - Added indexes and RLS policies
- **Status**: ✅ Active - table is used in `server/routes/agents.ts`

### TypeScript Types Added

**File**: `server/types/database.ts`

Added types for 9 previously missing tables:
- ✅ `BrandGuideVersionRow`
- ✅ `ScheduledContentRow`
- ✅ `StrategyBriefRow`
- ✅ `ContentPackageRow`
- ✅ `BrandHistoryRow`
- ✅ `BrandSuccessPatternRow`
- ✅ `CollaborationLogRow`
- ✅ `PerformanceLogRow`
- ✅ `PlatformInsightRow`
- ✅ `TokenHealthRow`
- ✅ `WeeklySummaryRow`
- ✅ `AdvisorReviewAuditRow`

**Note**: All persistence schema types include both `brandId` (TEXT legacy) and `brandIdUuid` (UUID new) fields.

### Zod Schemas Added

**File**: `shared/validation-schemas.ts`

Added validation schemas for priority tables:
- ✅ `BrandGuideVersionSchema`
- ✅ `ScheduledContentSchema`
- ✅ `StrategyBriefSchema`
- ✅ `ContentPackageDBSchema`

### Documentation Created

**File**: `docs/DATABASE_ARCHIVED_TABLES_STATUS.md`

- ✅ Documented status of all archived tables
- ✅ Confirmed `generation_logs` is ACTIVE (moved to migration 004)
- ✅ Confirmed 4 tables are DEPRECATED (not found in codebase)

### Open TODOs

1. **Step 2 of brand_id Migration** (Future):
   - Add foreign key constraints: `brand_id_uuid REFERENCES brands(id)`
   - Update RLS policies to use `brand_id_uuid` instead of `is_brand_member_text()`
   - Update application code to use `brand_id_uuid`
   - Mark `brand_id TEXT` columns as deprecated
   - Eventually drop `brand_id TEXT` columns (after full migration)

2. **Additional Zod Schemas** (Future):
   - Add schemas for remaining persistence schema tables
   - Add schemas for `generation_logs` table

3. **Index Optimization** (Future):
   - Review query patterns and add indexes for frequently queried columns
   - Consider composite indexes for common query patterns

---

## 9. Phase 2 Changes Applied (2025-01-20)

### Migration Files Created

#### `005_finalize_brand_id_uuid_migration.sql`
- **Purpose**: Step 2 of 2-step migration to finalize `brand_id TEXT` → `brand_id_uuid UUID` transition
- **Changes**:
  - ✅ Added foreign key constraints: `brand_id_uuid REFERENCES brands(id)` for all 10 tables
  - ✅ Updated all RLS policies (30+ policies) to use `brand_id_uuid` instead of `is_brand_member_text(brand_id)`
  - ✅ Marked `brand_id TEXT` columns as deprecated (with comments)
  - ✅ Added documentation for future drop steps (Phase 3)
- **Tables Affected**: All 10 persistence schema tables
- **Status**: ✅ Step 2 complete - UUID migration finalized
- **Note**: `brand_id TEXT` columns remain for backward compatibility (will be dropped in Phase 3)

### TypeScript Types Updated

**File**: `server/types/database.ts`

**Changes**:
- ✅ Updated all 10 persistence schema types to make `brandIdUuid` required (not nullable)
- ✅ Changed `brandId` from required to optional (deprecated)
- ✅ Added comments indicating migration 005 adds FK constraints

**Updated Types**:
- `StrategyBriefRow` - brandIdUuid now required
- `ContentPackageRow` - brandIdUuid now required
- `BrandHistoryRow` - brandIdUuid now required
- `BrandSuccessPatternRow` - brandIdUuid now required
- `CollaborationLogRow` - brandIdUuid now required
- `PerformanceLogRow` - brandIdUuid now required
- `PlatformInsightRow` - brandIdUuid now required
- `TokenHealthRow` - brandIdUuid now required
- `WeeklySummaryRow` - brandIdUuid now required
- `AdvisorReviewAuditRow` - brandIdUuid now required

### Zod Schemas Added/Updated

**File**: `shared/validation-schemas.ts`

**New Schemas Added** (7):
- ✅ `BrandHistorySchema` - with brandIdUuid required
- ✅ `BrandSuccessPatternSchema` - with brandIdUuid required
- ✅ `PerformanceLogSchema` - with brandIdUuid required
- ✅ `PlatformInsightSchema` - with brandIdUuid required
- ✅ `TokenHealthSchema` - with brandIdUuid required
- ✅ `WeeklySummarySchema` - with brandIdUuid required
- ✅ `AdvisorReviewAuditSchema` - with brandIdUuid required
- ✅ `GenerationLogSchema` - for generation_logs table (UUID brand_id)

**Updated Schemas** (2):
- ✅ `StrategyBriefSchema` - now requires brandIdUuid (not optional)
- ✅ `ContentPackageDBSchema` - now requires brandIdUuid (not optional)

**Total Zod Schemas**: 11 schemas for persistence schema tables + generation_logs

### RLS Policies Updated

**All 10 persistence schema tables now use `brand_id_uuid` in RLS policies:**

1. ✅ `strategy_briefs` - 4 policies updated
2. ✅ `content_packages` - 4 policies updated
3. ✅ `brand_history` - 4 policies updated
4. ✅ `brand_success_patterns` - 2 policies updated
5. ✅ `collaboration_logs` - 4 policies updated
6. ✅ `performance_logs` - 4 policies updated
7. ✅ `platform_insights` - 2 policies updated
8. ✅ `token_health` - 2 policies updated
9. ✅ `weekly_summaries` - 2 policies updated
10. ✅ `advisor_review_audits` - 4 policies updated

**Total**: ~30 RLS policies updated to use direct `brand_members` check on UUID instead of `is_brand_member_text()` helper

**Benefits**:
- ✅ Better performance (direct FK lookup vs TEXT conversion)
- ✅ Foreign key constraint enforcement
- ✅ Type safety improvements
- ✅ Consistent with other brand-scoped tables

### Foreign Key Constraints Added

**All 10 tables now have FK constraints:**
- ✅ `fk_strategy_briefs_brand_id_uuid` → `brands(id)`
- ✅ `fk_content_packages_brand_id_uuid` → `brands(id)`
- ✅ `fk_brand_history_brand_id_uuid` → `brands(id)`
- ✅ `fk_brand_success_patterns_brand_id_uuid` → `brands(id)`
- ✅ `fk_collaboration_logs_brand_id_uuid` → `brands(id)`
- ✅ `fk_performance_logs_brand_id_uuid` → `brands(id)`
- ✅ `fk_platform_insights_brand_id_uuid` → `brands(id)`
- ✅ `fk_token_health_brand_id_uuid` → `brands(id)`
- ✅ `fk_weekly_summaries_brand_id_uuid` → `brands(id)`
- ✅ `fk_advisor_review_audits_brand_id_uuid` → `brands(id)`

**All FKs use `ON DELETE CASCADE` for data integrity**

### Documentation Updated

**File**: `docs/DATABASE_ARCHIVED_TABLES_STATUS.md`
- ✅ No changes needed (archived tables status unchanged)

**File**: `MVP_DATABASE_TABLE_AUDIT_REPORT.md`
- ✅ Added Section 9: Phase 2 Changes Applied

### Open TODOs (Phase 3 - Future)

1. **Drop brand_id TEXT Columns** (After application code migration):
   - Verify no application code references `brand_id TEXT` columns
   - Drop `brand_id TEXT` columns from all 10 tables
   - Optionally drop `is_brand_member_text()` helper function if unused
   - Optionally rename `brand_id_uuid` to `brand_id` for cleaner API

2. **Application Code Updates** (Gradual migration):
   - Update all routes/services to use `brand_id_uuid` for writes
   - Update all queries to prefer `brand_id_uuid` over `brand_id TEXT`
   - Remove any code that still writes to `brand_id TEXT`

3. **Index Optimization** (Future):
   - Review query patterns and add composite indexes if needed
   - Consider indexes on frequently queried columns

4. **Additional Validation** (Future):
   - Add more comprehensive Zod schemas for edge cases
   - Add validation for JSONB fields within schemas

---

## 10. Phase 4 Changes Applied (2025-01-20)

### Migration File Created

#### `006_drop_legacy_brand_id_text_columns.sql`
- **Purpose**: Drop legacy `brand_id TEXT` columns from all 10 persistence schema tables
- **Changes**:
  - ✅ Dropped 10 indexes on `brand_id TEXT` columns
  - ✅ Dropped `brand_id TEXT` columns from all 10 tables
  - ✅ Dropped `is_brand_member_text(TEXT)` helper function
- **Tables Affected**: All 10 persistence schema tables
- **Status**: ✅ Complete - UUID-only design enforced

### Verification

**✅ No Remaining Code Usage**:
- Searched for all `.eq("brand_id"`, `.insert({ brand_id:`, `.update({ brand_id:` patterns
- Confirmed no application code references `brand_id TEXT` on persistence tables
- All queries/inserts/updates use `brand_id_uuid` (verified in Phase 3)

### TypeScript Types Updated

**File**: `server/types/database.ts`

**Changes**:
- ✅ Updated all 10 persistence schema types to mark `brandId` as deprecated with migration 006 reference
- ✅ Added `@deprecated` JSDoc comments indicating column was dropped

### Current State

**All 10 persistence schema tables now use only `brand_id_uuid` (UUID)**:
- ✅ `strategy_briefs` - `brand_id TEXT` dropped
- ✅ `content_packages` - `brand_id TEXT` dropped
- ✅ `brand_history` - `brand_id TEXT` dropped
- ✅ `brand_success_patterns` - `brand_id TEXT` dropped
- ✅ `collaboration_logs` - `brand_id TEXT` dropped
- ✅ `performance_logs` - `brand_id TEXT` dropped
- ✅ `platform_insights` - `brand_id TEXT` dropped
- ✅ `token_health` - `brand_id TEXT` dropped
- ✅ `weekly_summaries` - `brand_id TEXT` dropped
- ✅ `advisor_review_audits` - `brand_id TEXT` dropped

**Legacy helper function dropped**:
- ✅ `is_brand_member_text(TEXT)` - No longer needed (RLS policies use `brand_id_uuid` directly)

**UUID-first design is now enforced end-to-end for these persistence tables** ✅

---

**End of Report**

