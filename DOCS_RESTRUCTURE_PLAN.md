# 📁 POSTD Documentation Restructure Plan

**Generated:** 2025-01-20  
**Status:** 🟡 **PROPOSAL** — Awaiting Approval  
**Engineer:** POSTD Phase 4 Consolidation & Stability Engineer

---

## 📋 EXECUTIVE SUMMARY

This plan proposes a clean, future-proof documentation structure for POSTD. The current documentation is scattered across the root directory with 200+ markdown files. This restructure organizes documentation by purpose, making it easier to find, maintain, and update.

**Current State:**
- 200+ markdown files in root directory
- Mixed categories (audits, summaries, guides, reports)
- Difficult to find authoritative sources
- Duplicate and superseded documents

**Proposed State:**
- Organized by category in `/docs` subdirectories
- Clear separation of active vs. archived docs
- Easy to find authoritative sources
- Clean, maintainable structure

---

## 🎯 PROPOSED STRUCTURE

```
/docs
├── architecture/          # System architecture and design
├── schemas/               # Database schema documentation
├── api/                   # API documentation and contracts
├── backend/               # Backend-specific documentation
├── frontend/              # Frontend-specific documentation
├── ai/                    # AI agents and orchestration
├── integrations/          # Third-party integrations and connectors
├── product/               # Product features and implementations
├── process/                # Development process and methodology
├── security/              # Security documentation
├── deployment/            # Deployment and operations
├── testing/               # Testing and QA documentation
└── archive/               # Historical and superseded documents
```

---

## 📂 DETAILED STRUCTURE

### `/docs/architecture/`

**Purpose:** System architecture, design decisions, and high-level system documentation.

**Files to Move:**
- `ARCHITECTURE_QUICK_REFERENCE.md` → `architecture/system-overview.md`
- `SYSTEM_ARCHITECTURE_AUDIT.md` → `archive/architecture/system-audit.md`
- `DATABASE-STRUCTURE.md` → `architecture/database-overview.md`
- `DATABASE-SCHEMA-DIAGRAM.md` → `schemas/diagram.md`
- `CODEBASE_ARCHITECTURE_OVERVIEW.md` → `archive/architecture/codebase-overview.md`

**New Files to Create:**
- `architecture/README.md` - Index of architecture docs
- `architecture/system-design.md` - Consolidated system design (merge multiple sources)

---

### `/docs/schemas/`

**Purpose:** Database schema documentation, migrations, and schema-related guides.

**Files to Move:**
- `SUPABASE_SCHEMA_MAP.md` → `schemas/schema-map.md`
- `SCHEMA_AUDIT_REPORT.md` → `archive/schemas/audit-report.md`
- `SCHEMA_EXTRACTION_REPORT.md` → `archive/schemas/extraction-report.md`
- `SCHEMA_AUDIT_EXECUTIVE_SUMMARY.md` → `archive/schemas/audit-summary.md`
- `SCHEMA_EXTRACTION_EXECUTIVE_SUMMARY.md` → `archive/schemas/extraction-summary.md`
- `SCHEMA_TYPE_MAPPING.md` → `schemas/type-mapping.md`
- `SCHEMA_VALIDATION_CHECKLIST.md` → `archive/schemas/validation-checklist.md`
- `SCHEMA_VERIFICATION.md` → `archive/schemas/verification.md`
- `SCHEMA_KEEP_LIST.md` → `archive/schemas/keep-list.md`
- `SCHEMA_DELETE_LIST.md` → `archive/schemas/delete-list.md`
- `SCHEMA_FINAL_PLAN.md` → `archive/schemas/final-plan.md`
- `SCHEMA_AUDIT_README.md` → `archive/schemas/audit-readme.md`
- `SCHEMA_CLEANUP_README.md` → `archive/schemas/cleanup-readme.md`
- `SCHEMA_SMOKE_TEST_README.md` → `archive/schemas/smoke-test-readme.md`
- `SCHEMA_DOCS_INDEX.md` → `archive/schemas/docs-index.md`
- `QUICK-DB-REFERENCE.md` → `schemas/quick-reference.md`

**New Files to Create:**
- `schemas/README.md` - Index of schema docs
- `schemas/migrations/` - Link to `supabase/migrations/` (or copy authoritative schema)

**Note:** The authoritative schema is `supabase/migrations/001_bootstrap_schema.sql` - keep this in place, reference from docs.

---

### `/docs/api/`

**Purpose:** API documentation, contracts, integration guides.

**Files to Move:**
- `API_DOCUMENTATION.md` → `api/overview.md`
- `API_INTEGRATION_STRATEGY.md` → `archive/api/integration-strategy.md`
- `API_INTEGRATION_COMPLETE_PACK.md` → `archive/api/integration-complete.md`
- `API_ALIGNMENT_FIXES_REPORT.md` → `archive/api/alignment-fixes.md`
- `API_CREDENTIALS_SETUP.md` → `api/credentials-setup.md`
- `API_CREDENTIALS_TODO.md` → `archive/api/credentials-todo.md` (or delete if completed)

**New Files to Create:**
- `api/README.md` - Index of API docs
- `api/contract.md` - Complete API contract (generate per Command Center Prompt 7)
- `api/endpoints.md` - Endpoint reference (extract from contract)

---

### `/docs/backend/`

**Purpose:** Backend-specific documentation, server configuration, routes.

**Files to Move:**
- `BACKEND_LAUNCH_SUMMARY.md` → `archive/backend/launch-summary.md`
- `BACKEND_LAUNCH_AUDIT_SUMMARY.md` → `archive/backend/launch-audit.md`
- `BACKEND_LAUNCH_AUDIT_FRONTEND_CHANGES.md` → `archive/backend/launch-frontend-changes.md`
- `BACKEND_PLATFORM_COMPLETE.md` → `archive/backend/platform-complete.md`

**New Files to Create:**
- `backend/README.md` - Index of backend docs
- `backend/routes.md` - Route documentation (extract from API contract)
- `backend/configuration.md` - Backend configuration guide

---

### `/docs/frontend/`

**Purpose:** Frontend-specific documentation, components, routing.

**Files to Move:**
- `CLIENT_ROUTING_MAP.md` → `frontend/routing-map.md`
- `CLIENT_ROUTING_DIAGRAMS.md` → `frontend/routing-diagrams.md`
- `CLIENT_ROUTING_QUICK_REFERENCE.md` → `frontend/routing-reference.md`
- `ROUTING_AUDIT.md` → `archive/frontend/routing-audit.md`
- `ROUTING_AUDIT_SUMMARY.md` → `archive/frontend/routing-audit-summary.md`
- `ROUTING_AUDIT_ISSUES.md` → `archive/frontend/routing-audit-issues.md`
- `ROUTING_AUDIT_INDEX.md` → `archive/frontend/routing-audit-index.md`
- `ROUTING_DOCUMENTATION_INDEX.md` → `archive/frontend/routing-docs-index.md`
- `FRONTEND_LAUNCH_AUDIT_REPORT.md` → `archive/frontend/launch-audit.md`
- `FRONTEND_LAUNCH_CHECKLIST.md` → `archive/frontend/launch-checklist.md`
- `FRONTEND_LAUNCH_READINESS.md` → `archive/frontend/launch-readiness.md`
- `FRONTEND_BACKEND_INTEGRATION_SUMMARY.md` → `archive/frontend/integration-summary.md`
- `COMPONENTS.md` → `frontend/components.md`
- `DESIGN_SYSTEM.md` → `frontend/design-system.md`
- `UX_UI_REVIEW_SUMMARY.md` → `archive/frontend/ux-review-summary.md`
- `UX_UI_REVIEW_DASHBOARD.md` → `archive/frontend/ux-review-dashboard.md`
- `UX_UI_REVIEW_BRAND_GUIDE.md` → `archive/frontend/ux-review-brand-guide.md`
- `UX_UI_REVIEW_CREATIVE_STUDIO.md` → `archive/frontend/ux-review-creative-studio.md`
- `FORM_INPUT_LIGHT_STYLING_AUDIT.md` → `archive/frontend/form-styling-audit.md`
- `BUTTON_SIZE_FIX_VERIFICATION.md` → `archive/frontend/button-fix.md`
- `TOP_NAV_BRAND_LOGIC_FIX.md` → `archive/frontend/top-nav-fix.md`
- `ONBOARDING_IMAGE_FIX.md` → `archive/frontend/onboarding-fix.md`
- `LAYOUT_FIXES_SUMMARY.md` → `archive/frontend/layout-fixes.md`

**New Files to Create:**
- `frontend/README.md` - Index of frontend docs
- `frontend/components-guide.md` - Component usage guide (expand from COMPONENTS.md)

---

### `/docs/ai/`

**Purpose:** AI agents, orchestration, and AI-related features.

**Files to Move:**
- `AGENTS.md` → `ai/agents.md`
- `AGENTS_IMPLEMENTATION_SUMMARY.md` → `archive/ai/agents-implementation.md`
- `AGENT_AUDIT_REPORT.md` → `archive/ai/agent-audit.md`
- `MULTI_AGENT_COLLABORATION_AUDIT.md` → `archive/ai/multi-agent-audit.md`
- `MULTI_AGENT_COLLABORATION_IMPLEMENTATION.md` → `archive/ai/multi-agent-implementation.md`
- `ORCHESTRATION_IMPLEMENTATION.md` → `archive/ai/orchestration-implementation.md`
- `CREATIVE_AGENT_AUDIT.md` → `archive/ai/creative-agent-audit.md`
- `CREATIVE_AGENT_UPGRADE_SUMMARY.md` → `archive/ai/creative-agent-upgrade.md`

**New Files to Create:**
- `ai/README.md` - Index of AI docs
- `ai/orchestration.md` - Orchestration guide (consolidate from implementation docs)

---

### `/docs/integrations/`

**Purpose:** Third-party integrations, connectors, and external services.

**Files to Move:**
- `CONNECTOR_IMPLEMENTATION_REPORT.md` → `archive/integrations/connector-implementation.md`
- `CONNECTOR_SCAFFOLD.md` → `integrations/connector-scaffold.md`
- `CONNECTOR_SPECS_GBP.md` → `integrations/specs/gbp.md`
- `CONNECTOR_SPECS_LINKEDIN.md` → `integrations/specs/linkedin.md`
- `CONNECTOR_SPECS_MAILCHIMP.md` → `integrations/specs/mailchimp.md`
- `CONNECTOR_SPECS_META.md` → `integrations/specs/meta.md`
- `CONNECTOR_SPECS_SHARED.md` → `integrations/specs/shared.md`
- `CONNECTOR_SPECS_TIKTOK.md` → `integrations/specs/tiktok.md`
- `LINKEDIN_CONNECTOR_SUMMARY.md` → `archive/integrations/linkedin-summary.md`

**New Files to Create:**
- `integrations/README.md` - Index of integration docs
- `integrations/overview.md` - Integration overview and patterns

---

### `/docs/product/`

**Purpose:** Product features, implementations, and feature-specific documentation.

**Files to Move:**
- `STOCK_IMAGE_IMPLEMENTATION.md` → `archive/product/stock-image.md`
- `STARTER_TEMPLATES_IMPLEMENTATION_SUMMARY.md` → `archive/product/starter-templates.md`
- `BILLING_UPDATE_COMPLETE.md` → `archive/product/billing-update.md`
- `PAYMENT_POLICY_COMPLETE.md` → `archive/product/payment-policy.md`
- `JOB_QUEUE_NOTIFICATIONS_COMPLETE.md` → `archive/product/job-queue-notifications.md`
- `BRAND_CLEANUP_REPORT.md` → `archive/product/brand-cleanup.md`
- `BRAND_CONTEXT_CONSISTENCY_AUDIT.md` → `archive/product/brand-consistency-audit.md`
- `BRAND_INTAKE_CRAWLER_STATUS.md` → `archive/product/brand-crawler-status.md`
- `CREATIVE_STUDIO_AUDIT_CHECKLIST.md` → `archive/product/creative-studio-checklist.md`
- `CREATIVE_STUDIO_AUDIT_REPORT.md` → `archive/product/creative-studio-audit.md`
- `CREATIVE_STUDIO_BACKEND_AUDIT.md` → `archive/product/creative-studio-backend-audit.md`
- `CREATIVE_STUDIO_BRAND_FIX.md` → `archive/product/creative-studio-brand-fix.md`
- `CREATIVE_STUDIO_ENTRY_REFINEMENT.md` → `archive/product/creative-studio-refinement.md`
- `CREATIVE_STUDIO_AUTOSAVE_STOCK_IMAGE_AUDIT.md` → `archive/product/creative-studio-autosave.md`
- `VISUAL_CONCEPTS_MODAL_QA_REPORT.md` → `archive/product/visual-concepts-qa.md`

**New Files to Create:**
- `product/README.md` - Index of product docs
- `product/features.md` - Feature overview (consolidate from implementation summaries)

---

### `/docs/process/`

**Purpose:** Development process, methodology, and workflow documentation.

**Files to Move:**
- `CONTRIBUTING.md` → `process/contributing.md`
- `TECH_STACK_GUIDE.md` → `process/tech-stack.md`
- `DATA_GOVERNANCE.md` → `process/data-governance.md`
- `MIGRATION_GUIDE.md` → `process/migration-guide.md`
- `REFACTOR_CHANGELOG.md` → `archive/process/refactor-changelog.md`
- `INTEGRATION_PRIORITY_MATRIX.md` → `archive/process/integration-priority.md`
- `THIS_WEEK_ACTION_PLAN.md` → `archive/process/weekly-action-plan.md` (or delete if outdated)

**New Files to Create:**
- `process/README.md` - Index of process docs
- `process/workflow.md` - Development workflow guide

---

### `/docs/security/`

**Purpose:** Security documentation, RLS, authentication, and security audits.

**Files to Move:**
- `SECURITY.md` → `security/overview.md`
- `SECURITY_SUMMARY.md` → `archive/security/security-summary.md`
- `SECURITY_IMPLEMENTATION.md` → `archive/security/implementation.md`
- `RLS_SECURITY_PLAN.md` → `archive/security/rls-plan.md`
- `RLS_PHASE1_IMPLEMENTATION_SUMMARY.md` → `archive/security/rls-implementation.md`
- `AUTH_VERIFICATION_GUIDE.md` → `archive/security/auth-verification.md`
- `ENV_SECURITY_REPORT.md` → `archive/security/env-report.md`
- `ENV_SECURITY_SUMMARY.md` → `archive/security/env-summary.md`
- `ENVIRONMENT_SECURITY_VALIDATION.md` → `archive/security/env-validation.md`
- `FINAL_SECURITY_AUDIT_REPORT.md` → `archive/security/final-audit.md`

**New Files to Create:**
- `security/README.md` - Index of security docs
- `security/rls-policies.md` - RLS policy documentation (extract from schema)
- `security/authentication.md` - Authentication guide (consolidate from multiple sources)

---

### `/docs/deployment/`

**Purpose:** Deployment guides, operations, and infrastructure documentation.

**Files to Move:**
- `DEPLOYMENT_GUIDE.md` → `deployment/guide.md`
- `DEPLOYMENT_READY.md` → `archive/deployment/ready.md`
- `DEPLOYMENT_READY_V2.md` → `archive/deployment/ready-v2.md`
- `DEPLOYMENT_STATUS.md` → `archive/deployment/status.md`
- `VERCEL_DEPLOYMENT.md` → `deployment/vercel.md`
- `VERCEL_ENV_CHECKLIST.md` → `deployment/vercel-env.md`
- `GO_LIVE_PLAYBOOK.md` → `deployment/go-live.md`
- `PRODUCTION_READINESS_SUMMARY.md` → `archive/deployment/production-readiness.md`
- `LAUNCH_READINESS_SUMMARY.md` → `archive/deployment/launch-readiness.md`
- `POST_LAUNCH_CLEANUP_TRACKER.md` → `archive/deployment/post-launch-cleanup.md`
- `POST_LAUNCH_MONITORING_CHECKLIST.md` → `archive/deployment/post-launch-monitoring.md`
- `NIGHT_BEFORE_LAUNCH_AUDIT_REPORT.md` → `archive/deployment/pre-launch-audit.md`
- `INFRA_DEPLOYMENT_MANIFEST.json` → `archive/deployment/infra-manifest.json`
- `INFRA_DEPLOYMENT_REPORT.md` → `archive/deployment/infra-report.md`
- `INFRA_LOADTEST_REPORT.md` → `archive/deployment/infra-loadtest.md`
- `README_PHASE1_INFRA.md` → `archive/deployment/phase1-infra.md`
- `SUPABASE_FINAL_READINESS.md` → `deployment/supabase-readiness.md`
- `SUPABASE_UI_SMOKE_TEST.md` → `deployment/supabase-ui-test.md`
- `SUPABASE_CONFIG_AUDIT.md` → `archive/deployment/supabase-config-audit.md`
- `SUPABASE_RUNTIME_REPORT.md` → `archive/deployment/supabase-runtime.md`
- `SUPABASE_WIRING.md` → `archive/deployment/supabase-wiring.md`
- `FIX_SUPABASE_KEYS.md` → `archive/deployment/supabase-keys-fix.md`

**New Files to Create:**
- `deployment/README.md` - Index of deployment docs
- `deployment/environment-setup.md` - Environment setup guide (consolidate from multiple sources)

---

### `/docs/testing/`

**Purpose:** Testing documentation, QA reports, and test guides.

**Files to Move:**
- `QA_QUICK_REFERENCE.md` → `testing/qa-reference.md`
- `BOOTSTRAP_MIGRATION_QA_REPORT.md` → `archive/testing/bootstrap-qa.md`
- `BOOTSTRAP_QA_QUICK_REFERENCE.md` → `archive/testing/bootstrap-qa-reference.md`
- `WORKFLOW_QA_REPORT.json` → `archive/testing/workflow-qa.json`

**New Files to Create:**
- `testing/README.md` - Index of testing docs
- `testing/guide.md` - Testing guide (consolidate from QA reports)

---

### `/docs/archive/`

**Purpose:** Historical documents, completed work logs, and superseded documentation.

**Files to Move:**
- All `*_SUMMARY.md` files (except authoritative ones)
- All `*_COMPLETE.md` files
- All `*_AUDIT_REPORT.md` files (except current ones)
- All `*_IMPLEMENTATION*.md` files
- All `*_FIXES*.md` files
- All `*_STATUS*.md` files
- All `*_CHECKLIST.md` files (except current ones)
- All `*_VERIFICATION*.md` files
- All `*_EXECUTIVE_SUMMARY.md` files
- All `*_MANIFEST.json` files
- All `*_REPORT.json` files

**Structure:**
```
/docs/archive/
├── phases/          # Phase-specific archives
├── audits/          # Audit reports
├── implementations/ # Implementation logs
├── fixes/           # Fix documentation
└── planning/        # Planning documents
```

---

## 📋 ROOT DIRECTORY CLEANUP

**Files to Keep in Root:**
- `README.md` - Main project readme
- `CHANGELOG.md` - Project changelog
- `LICENSE` - License file
- `package.json` - Package configuration
- `pnpm-lock.yaml` - Lock file
- Configuration files (`.json`, `.toml`, `.config.*`)

**Files to Move:**
- All documentation markdown files → `/docs/` structure
- All `.md` files except `README.md` and `CHANGELOG.md`

---

## 🎯 MIGRATION STRATEGY

### Phase 1: Create Structure (No File Moves)
1. Create `/docs/` directory structure
2. Create `README.md` in each subdirectory
3. Document the structure

### Phase 2: Move Active Documentation
1. Move authoritative documents first
2. Update references in code/docs
3. Verify links still work

### Phase 3: Archive Historical Documents
1. Move completed work logs to `/docs/archive/`
2. Move superseded audits to `/docs/archive/`
3. Organize by category within archive

### Phase 4: Cleanup and Consolidation
1. Consolidate duplicate documents
2. Remove truly obsolete files
3. Update all internal references

### Phase 5: Update References
1. Update all markdown links
2. Update code comments referencing docs
3. Update README.md to point to new structure

---

## ✅ VERIFICATION CHECKLIST

After restructure:
- [ ] All authoritative docs in correct locations
- [ ] All links updated and working
- [ ] README.md points to new structure
- [ ] No broken references
- [ ] Archive clearly separated from active docs
- [ ] Each category has README.md index

---

## 🚨 RISK ASSESSMENT

### Low Risk
- Moving files to organized structure
- Creating archive folder
- Adding README.md files

### Medium Risk
- Breaking links in documentation
- Missing references in code
- Losing track of file locations

### Mitigation
- Use git to track all moves
- Test all links after moves
- Update references incrementally
- Keep backup of original structure until verified

---

## 📝 IMPLEMENTATION NOTES

1. **Use Git for File Moves**
   - Git tracks file moves better than manual copy
   - Use `git mv` to preserve history
   - Commit after each category move

2. **Update Links Incrementally**
   - Move files first
   - Then update links in batches
   - Test after each batch

3. **Preserve History**
   - Don't delete files, move to archive
   - Keep archive organized for reference
   - Mark clearly as historical

4. **Create Index Files**
   - Each category should have README.md
   - Main `/docs/README.md` should index all categories
   - Update root README.md to point to `/docs/`

---

**END OF RESTRUCTURE PLAN**

**Status:** 🟡 **PROPOSAL**  
**Next Step:** Review and approve, then begin Phase 1 (structure creation)

