# 🚀 POSTD — CURSOR COMMAND CENTER

> **Status:** ✅ Active – This is an active engineering playbook for Cursor agents working on POSTD.  
> **Last Updated:** 2025-01-20

**The Complete Engineering Playbook for Cursor Agents Working on POSTD**

---

## 📋 Purpose

This Command Center defines how any Cursor AI Agent must behave when operating inside the POSTD repository. Use this to run deep audits, fix API↔UI↔DB issues, analyze RLS/schemas, and perform safe production-grade changes.

## 👥 Audience

- **Cursor AI Agents** - Primary users of this document
- **Engineers onboarding to POSTD** - Reference guide for repository structure
- **Anyone conducting deep repo-wide audits** - Step-by-step audit process

---

## 🎯 SECTION 0 — POSTD MASTER EXECUTION RULES (AI + CURSOR)

> **NOTE:** This section contains the foundational rules that apply to ALL tasks. Every section below (1-16) must be executed in combination with these global rules.

---

# POSTD MASTER EXECUTION RULES (AI + CURSOR)

Before performing ANY task, Cursor MUST:

## 1. SEARCH THE REPO FIRST

- Search for existing files, docs, utilities, helpers
- Search for similarly named files or previous audits
- DO NOT create duplicates
- ALWAYS update, never recreate

## 2. FILE CREATION RULES

Only create a new file if:

- No file exists already
- The task explicitly requires a new file

If a file exists:

- UPDATE it in place
- Preserve formatting
- Preserve headings
- Append new sections under correct headers

## 3. NAMING CONVENTIONS

Follow POSTD naming conventions:

- Commands: `commands/NAME.md`
- MVP docs: `docs/MVP#_NAME.md`
- Global docs: `docs/00_MASTER_*`
- Server files: `server/routes/*.ts`, `server/lib/*.ts`
- Edge functions: `supabase/functions/*`
- Tests: `__tests__/*.test.ts`

## 4. BEFORE WRITING ANY CODE

Cursor MUST:

- Read all related files
- Match existing patterns
- Reuse existing helpers
- Follow existing types
- Respect current architecture

NEVER:

- Invent new frameworks
- Add unrelated dependencies
- Change DB structures without explicit instruction

## 5. DB & TENANT SAFETY RULES

All code MUST:

- Use existing RLS patterns
- Include brandId + workspaceId
- Use helper functions (e.g., `assertBrandAccess`)
- NEVER bypass RLS manually

## 6. BRAND GUIDE INTEGRATION RULES

Every agent, generator, or scraper MUST:

- Load Brand Guide via `getCurrentBrandGuide()`
- Validate required fields exist
- Use tone, pillars, rules, visual identity
- Avoid phrases listed in `voiceAndTone.avoidPhrases`
- Follow BFS evaluation rules

## 7. DOCUMENTATION RULES

Every audit or implementation MUST update:

- `docs/MVP#_AUDIT_REPORT.md`
- `docs/MVP#_FILE_MAP.md`
- `docs/MVP#_IMPLEMENTATION_NOTES.md`
- `docs/MVP#_TEST_RESULTS.md`

ALL docs must include:

- Purpose
- File map
- Flow diagram (text-based)
- Before/after code notes
- Testing instructions
- Final validation summary

## 8. NO SILENT FALLBACKS

- No fake data
- No stubs unless explicitly allowed
- Return structured errors with consistent formatting

## 9. REQUIRED OUTPUT FOR EVERY TASK

Cursor MUST output:

- List of modified files
- Summary of changes
- Notes on assumptions
- Updated flow diagrams (if needed)
- Instructions for manual QA

## 10. PROMPT CONSISTENCY

All agents must:

- Follow existing prompt builder structure
- Use system + user + retry prompts
- Apply BFS scoring & retry logic
- Reference Brand Guide fields consistently

---

## 🎛️ SECTION 1 — MASTER BEHAVIOR PROFILE

> NOTE: This section must be executed in combination with the global rules found in Section 0.

**Paste this FIRST into any new Cursor chat.**

```
You are the POSTD Integration Engineer.

Your behavior requirements:
- Never auto-fix anything until you present a complete report.
- Never modify more than one file per step unless explicitly authorized.
- Always show full diffs BEFORE writing any code.
- Always stop and request approval before applying changes.
- Never infer missing context—search the repository instead.
- Always surface uncertainty instead of guessing.
- Each audit must be exhaustive and technical.
- Each fix must be atomic, reversible, and low-risk.
- All RLS, Supabase, API, and UI assumptions must be validated from code, not memory.
- All changes must be consistent with the current schema, brandId safety, and tenantId boundaries.

Your mission:
Execute POSTD integration tasks: ensure API → App → Supabase alignment, correctness, security, and stability.
```

---

## 🌐 SECTION 2 — THE PRIMARY PROMPTS

> NOTE: This section must be executed in combination with the global rules found in Section 0.

These are the exact prompts to run in order. **Run each prompt in its own Cursor message.**

---

### 🧭 PROMPT 1 — Full Repo Scan + TODO MAP

**Copy and paste this prompt:**

```
Run a full repository scan and build a comprehensive TODO MAP.

Tasks:
1. Identify ALL API endpoints & server functions.
2. Document tables, fields, RLS checks, auth dependencies.
3. Trace UI → API → DB flows.
4. Identify schema mismatches, naming mismatches, field shape mismatches.
5. Identify deprecated tables, fields, or endpoints.
6. Map cross-brand or cross-tenant risk.
7. Identify anywhere brandId or tenantId is missing, optional, or unsafe.

Deliverables:
- FULL ENDPOINT MAP
- FINDINGS LIST (severity: Critical → Low)
- DEPENDENCY CHAIN MAP (UI → API → DB)
- TODO MAP

Do NOT modify code yet.
Stop after producing these four outputs.
```

**Expected Output:**
- Complete endpoint inventory
- Severity-ranked findings list
- Visual dependency map
- Prioritized TODO list

---

### 🧭 PROMPT 2 — Critical Endpoint Fix Plan (Zero Changes Yet)

**Copy and paste this prompt:**

```
From the TODO MAP, isolate only the Critical issues.

For each:
- File path
- Code snippet causing the issue
- Why it is critical
- Expected correct behavior
- Proposed fix
- Dependencies impacted
- Frontend components affected

Stop here. Do NOT apply changes.
```

**Expected Output:**
- Detailed critical issues breakdown
- Proposed fixes with code examples
- Impact analysis per issue
- Dependencies map

---

### 🧭 PROMPT 3 — Apply One Critical Fix at a Time

**Copy and paste this prompt:**

```
Apply only the first critical fix.

Rules:
- Show a full unified diff first.
- Explain the diff line-by-line.
- Wait for explicit approval.
- After applying, run a sanity check for:
  - brandId propagation
  - tenantId propagation
  - RLS compliance
  - Schema alignment
  - Cross-brand safety

Stop. Wait for "next fix".
```

**Expected Output:**
- Complete diff for first fix
- Line-by-line explanation
- Sanity check results
- Ready for approval

---

### 🧭 PROMPT 4 — RLS & brandId Safety Audit

**Copy and paste this prompt:**

```
Conduct a complete RLS/brandId/tenantId safety audit.

Tasks:
- Trace brandId sourcing everywhere.
- Trace tenantId sourcing everywhere.
- Confirm no unsafe fallbacks.
- Confirm no cross-brand leakage.
- Confirm RLS policies are correctly enforced.
- Identify any endpoints bypassing RLS.

Deliverables:
- RLS Risk Report
- brandId propagation diagram
- tenantId propagation diagram
- Fix recommendations (do NOT apply fixes yet)
```

**Expected Output:**
- Complete RLS risk assessment
- brandId/tenantId flow diagrams
- Security gap analysis
- Recommended fixes (not applied)

---

### 🧭 PROMPT 5 — E2E UI → API → DB Verification

**Copy and paste this prompt:**

```
Perform a full end-to-end trace for each major page:

- Dashboard
- Brand Guide
- Creative Studio
- Campaigns
- Content Queue
- Settings
- Publishing Jobs

For each:
- UI component → API call → DB table
- Expected field shapes
- Actual returned field shapes
- Mismatches
- Risk assessment

Stop after the report.
```

**Expected Output:**
- Complete E2E flow maps per page
- Field shape comparison tables
- Mismatch identification
- Risk assessment per flow

---

### 🧭 PROMPT 6 — Dead Code & Legacy Path Audit

**Copy and paste this prompt:**

```
Scan the entire repository for dead or unused code.

Flag:
- Endpoints never called
- Components unused
- Supabase tables no longer in schema
- Deprecated flows
- Duplicate functions
- Legacy job queue logic
- Old AI agent endpoints
- Console logs

Deliver:
- Dead Code Report (path + reason to delete)
- Recommended archival list

Do not delete anything yet.
```

**Expected Output:**
- Complete dead code inventory
- Unused endpoint list
- Deprecated component list
- Archival recommendations

---

### 🧭 PROMPT 7 — Generate POSTD_API_CONTRACT.md

**Copy and paste this prompt:**

```
Create POSTD_API_CONTRACT.md.

For every endpoint:
- Method
- Path
- Auth requirement
- brandId rules
- tenantId rules
- Request body (TS + JSON example)
- Response body (TS + JSON example)
- Error cases
- RLS expectations
- Supabase tables touched
- Notes on any schema constraints

Stop after generating the file.
```

**Expected Output:**
- Complete API contract document
- All endpoints documented
- TypeScript types included
- Error handling documented

---

### 🧭 PROMPT 8 — Final Integration Verification

**Copy and paste this prompt:**

```
Run a full system verification:

Categories:
- API correctness
- API ↔ UI alignment
- RLS correctness
- brandId & tenantId safety
- Supabase schema alignment
- No deprecated references
- No dangerous fallbacks
- No cross-brand risks
- No untyped server responses

Deliver:
- PASS/FAIL per category
- Final GO / NO-GO recommendation
- Final remaining TODO list
- Confirm repository is safe for production launch

Stop after producing the report.
```

**Expected Output:**
- Complete verification report
- Category-by-category status
- Final readiness verdict
- Remaining action items

---

## 🏁 SECTION 3 — HOW TO USE THIS FILE

> NOTE: This section must be executed in combination with the global rules found in Section 0.

### Quick Start Guide

1. **Open a new Cursor chat**
2. **Copy Section 0 (POSTD Master Execution Rules)** and paste it as your first message
3. **Copy Section 1 (Master Behavior Profile)** and paste it as your second message
4. **Run PROMPT 1** - Wait for all outputs
5. **Proceed sequentially** through PROMPTS 2–8
6. **Review each output** before proceeding to the next prompt

### Workflow Rules

✅ **DO:**
- Run prompts in sequence
- Wait for complete outputs before proceeding
- Review findings before applying fixes
- Request approval before code changes
- Document all changes

❌ **DON'T:**
- Skip prompts
- Apply fixes without approval
- Make assumptions about schema
- Modify multiple files simultaneously
- Bypass the approval process

### Session Structure

```
Session Start
  ↓
[Section 0] POSTD Master Execution Rules
  ↓
[Section 1] Master Behavior Profile
  ↓
[PROMPT 1] Full Repo Scan
  ↓
[PROMPT 2] Critical Fix Plan
  ↓
[PROMPT 3] Apply First Fix (with approval)
  ↓
[PROMPT 4] RLS Safety Audit
  ↓
[PROMPT 5] E2E Verification
  ↓
[PROMPT 6] Dead Code Audit
  ↓
[PROMPT 7] API Contract Generation
  ↓
[PROMPT 8] Final Verification
  ↓
Session Complete
```

---

## 🧱 SECTION 4 — GUARANTEED OUTCOMES

> NOTE: This section must be executed in combination with the global rules found in Section 0.

Running the entire Command Center will produce:

### ✅ Repository-Wide Mapping
- Complete endpoint inventory
- Database schema map
- UI component inventory
- Dependency graphs

### ✅ Full Mismatch List
- Schema mismatches (API ↔ DB)
- Field name mismatches
- Type mismatches
- Missing validations

### ✅ Fixed API Layer
- All endpoints aligned with schema
- Proper error handling
- Consistent response formats
- Complete type safety

### ✅ Fully Aligned Supabase Schema
- All tables documented
- RLS policies verified
- Foreign keys validated
- Indexes optimized

### ✅ Clean brandId & tenantId Propagation
- All flows traced
- No unsafe fallbacks
- No cross-brand leakage
- Complete audit trail

### ✅ Updated API Contract
- Complete endpoint documentation
- TypeScript types
- Error codes
- Usage examples

### ✅ Cleaned Dead Code
- Unused endpoints identified
- Deprecated components flagged
- Legacy code archived
- Repository cleaned

### ✅ Final Readiness Verification
- Production readiness assessment
- Security audit complete
- Performance validated
- Documentation updated

---

## 📚 SECTION 5 — REFERENCE DOCUMENTS

> NOTE: This section must be executed in combination with the global rules found in Section 0.

When working through integration tasks, reference these documents:

### Core Documentation
- `POSTD_PHASE2_AUDIT_REPORT.md` - Complete audit findings
- `POSTD_REPOSITORY_FORENSIC_AUDIT.md` - Repository structure audit
- `POSTD_SUPABASE_SMOKE_TEST_REPORT.md` - Supabase connection verification
- `supabase/migrations/001_bootstrap_schema.sql` - Authoritative schema
- `SUPABASE_SCHEMA_MAP.md` - Schema reference guide

### Architecture Documents
- `ARCHITECTURE_QUICK_REFERENCE.md` - System architecture
- `DATABASE-STRUCTURE.md` - Database overview
- `ROUTING_AUDIT.md` - Routing structure
- `SECURITY.md` - Security guidelines

### API Documentation
- `API_DOCUMENTATION.md` - API overview
- `API_INTEGRATION_STRATEGY.md` - Integration strategy
- `POSTD_API_CONTRACT.md` - Complete API contract (generated)

### Onboarding & Brand Guide Verification
- `POSTD_ONBOARDING_ALIGNMENT_VERIFICATION.md` - Canonical verification of onboarding flow, Brand Guide integration, and content generation behavior

---

## 🔒 SECTION 6 — CRITICAL RULES

> NOTE: This section must be executed in combination with the global rules found in Section 0.

### Schema Alignment Rules

1. **Always verify column names** against `001_bootstrap_schema.sql`
2. **Never assume** column names - check the schema first
3. **Use JSONB correctly** - don't stringify/parse unnecessarily
4. **Respect foreign keys** - don't break referential integrity

### Security Rules

1. **Always check brandId** before database queries
2. **Use `assertBrandAccess()`** for brand-scoped operations
3. **Never bypass RLS** without explicit authorization
4. **Validate tenantId** on all multi-tenant operations

### Code Change Rules

1. **One file per change** unless explicitly authorized
2. **Show diff first** - always preview before applying
3. **Request approval** - never auto-apply critical fixes
4. **Test after changes** - verify schema alignment

### Audit Rules

1. **Exhaustive searches** - don't assume, search the repo
2. **Document findings** - all issues must be documented
3. **Severity ranking** - Critical → High → Medium → Low
4. **Impact analysis** - always assess downstream effects

---

## 🎯 SECTION 7 — COMMON PATTERNS

> NOTE: This section must be executed in combination with the global rules found in Section 0.

### Pattern: Schema Verification

```typescript
// ✅ CORRECT: Verify schema before using
// 1. Check 001_bootstrap_schema.sql for column names
// 2. Use correct column names
// 3. Use correct data types

const { data } = await supabase
  .from("content_items")
  .insert({
    type: "creative_studio",  // ✅ Correct: 'type' not 'content_type'
    content: {                 // ✅ Correct: JSONB not 'body' string
      format: designData.format,
      items: designData.items,
    },
  });
```

### Pattern: Brand Access Check

```typescript
// ✅ CORRECT: Always verify brand access
await assertBrandAccess(req, brandId, true, true);

const { data } = await supabase
  .from("content_items")
  .select("*")
  .eq("brand_id", brandId);
```

### Pattern: Error Handling

```typescript
// ✅ CORRECT: Proper error handling
try {
  const { data, error } = await supabase.from("table").select();
  if (error) {
    throw new AppError(
      ErrorCode.DATABASE_ERROR,
      "Operation failed",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      { details: error.message }
    );
  }
} catch (error) {
  next(error);
}
```

---

## 🚨 SECTION 8 — RED FLAGS

> NOTE: This section must be executed in combination with the global rules found in Section 0.

**Stop immediately if you encounter:**

1. **Schema Mismatches** - Column names don't match schema
2. **Missing brandId Checks** - Queries without access verification
3. **RLS Bypasses** - Service role used without manual checks
4. **Type Mismatches** - JSONB treated as string
5. **Cross-Brand Risks** - Potential data leakage between brands
6. **Unsafe Fallbacks** - Default values that could cause issues
7. **Missing Validations** - No input validation on critical endpoints
8. **Deprecated References** - Code referencing removed tables/columns

**When you see a red flag:**
1. Document it immediately
2. Assess severity
3. Propose fix
4. Wait for approval before applying

---

## 📊 SECTION 9 — METRICS & TRACKING

> NOTE: This section must be executed in combination with the global rules found in Section 0.

### Audit Metrics to Track

- **Total Endpoints Audited**: [Count]
- **Schema Mismatches Found**: [Count]
- **Security Issues Found**: [Count]
- **Fixes Applied**: [Count]
- **Tests Added**: [Count]
- **Documentation Updated**: [Count]

### Progress Tracking

Use this checklist to track integration progress:

- [ ] PROMPT 1 Complete - Full Repo Scan
- [ ] PROMPT 2 Complete - Critical Fix Plan
- [ ] PROMPT 3 Complete - First Fix Applied
- [ ] PROMPT 4 Complete - RLS Safety Audit
- [ ] PROMPT 5 Complete - E2E Verification
- [ ] PROMPT 6 Complete - Dead Code Audit
- [ ] PROMPT 7 Complete - API Contract Generated
- [ ] PROMPT 8 Complete - Final Verification

---

## 🎓 SECTION 10 — LEARNING RESOURCES

> NOTE: This section must be executed in combination with the global rules found in Section 0.

### Understanding POSTD Architecture

1. **Read** `ARCHITECTURE_QUICK_REFERENCE.md` first
2. **Study** `supabase/migrations/001_bootstrap_schema.sql`
3. **Review** `POSTD_PHASE2_AUDIT_REPORT.md` for common issues
4. **Examine** `server/lib/brand-access.ts` for access patterns

### Common Issues Reference

| Issue | Location | Fix |
|-------|----------|-----|
| `content_type` vs `type` | `creative-studio.ts` | Use `type` |
| `body` vs `content` JSONB | `creative-studio.ts` | Use `content` JSONB |
| Missing brand access | `dashboard.ts` | Add `assertBrandAccess()` |
| RLS bypass | Multiple | Add manual checks |

---

## 🔄 SECTION 11 — ITERATION WORKFLOW

> NOTE: This section must be executed in combination with the global rules found in Section 0.

### For Each Critical Fix:

```
1. Identify Issue
   ↓
2. Propose Fix (with diff)
   ↓
3. Request Approval
   ↓
4. Apply Fix (if approved)
   ↓
5. Run Sanity Check
   ↓
6. Document Change
   ↓
7. Move to Next Issue
```

### For Each Audit:

```
1. Run Audit Prompt
   ↓
2. Collect Findings
   ↓
3. Rank by Severity
   ↓
4. Document All Issues
   ↓
5. Propose Fixes
   ↓
6. Wait for Approval
   ↓
7. Apply Fixes Sequentially
```

---

## ✅ SECTION 12 — SUCCESS CRITERIA

> NOTE: This section must be executed in combination with the global rules found in Section 0.

Integration tasks are complete when:

- ✅ All schema mismatches fixed
- ✅ All security issues resolved
- ✅ All brandId/tenantId flows verified
- ✅ All RLS policies verified
- ✅ API contract complete and accurate
- ✅ Dead code removed or archived
- ✅ Final verification passes
- ✅ Documentation updated
- ✅ Tests passing
- ✅ Production readiness confirmed

---

## 🎯 SECTION 13 — NEXT STEPS AFTER INTEGRATION

> NOTE: This section must be executed in combination with the global rules found in Section 0.

Once integration tasks are complete:

1. **Generate Next Phase Plan** - Next integration priorities
2. **Update Documentation** - Keep docs in sync
3. **Create Test Suite** - Automated integration tests
4. **Performance Audit** - Query optimization
5. **Security Hardening** - Additional security measures

---

## 📝 SECTION 14 — NOTES & BEST PRACTICES

> NOTE: This section must be executed in combination with the global rules found in Section 0.

### Best Practices

1. **Always start with Section 0** - POSTD Master Execution Rules
2. **Then use Section 1** - Master Behavior Profile
3. **Run prompts sequentially** - Don't skip steps
4. **Document everything** - All findings and fixes
5. **Test after changes** - Verify fixes work
6. **Request approval** - Never auto-apply critical fixes

### Common Mistakes to Avoid

1. ❌ Assuming schema structure
2. ❌ Skipping brand access checks
3. ❌ Applying multiple fixes at once
4. ❌ Not testing after changes
5. ❌ Not documenting findings

### Tips for Success

1. ✅ Use codebase_search for exhaustive searches
2. ✅ Read schema files before making assumptions
3. ✅ Check existing patterns in similar files
4. ✅ Test with real database queries
5. ✅ Document all assumptions

---

## 🏆 SECTION 15 — FINAL CHECKLIST

> NOTE: This section must be executed in combination with the global rules found in Section 0.

Before marking integration complete:

- [ ] All prompts 1-8 executed
- [ ] All critical issues fixed
- [ ] All high-priority issues addressed
- [ ] RLS safety verified
- [ ] Schema alignment confirmed
- [ ] API contract generated
- [ ] Dead code removed
- [ ] Documentation updated
- [ ] Tests passing
- [ ] Final verification complete
- [ ] Production readiness confirmed

---

## 📞 SECTION 16 — SUPPORT & ESCALATION

> NOTE: This section must be executed in combination with the global rules found in Section 0.

### When to Escalate

- **Critical security issues** found
- **Data loss risks** identified
- **Breaking changes** required
- **Unclear requirements** encountered
- **Conflicting documentation** found

### How to Escalate

1. Document the issue clearly
2. Assess impact and severity
3. Propose solutions
4. Request human review
5. Wait for guidance before proceeding

---

**END OF COMMAND CENTER**

---

## 📋 Quick Reference Card

**Copy this for quick access:**

```
POSTD Command Center Quick Start:

1. Paste Master Execution Rules (Section 0)
2. Paste Master Behavior Profile (Section 1)
3. Run PROMPT 1 - Full Repo Scan
4. Run PROMPT 2 - Critical Fix Plan
5. Run PROMPT 3 - Apply First Fix (with approval)
6. Run PROMPT 4 - RLS Safety Audit
7. Run PROMPT 5 - E2E Verification
8. Run PROMPT 6 - Dead Code Audit
9. Run PROMPT 7 - API Contract
10. Run PROMPT 8 - Final Verification

Rules:
- Never auto-fix
- Show diffs first
- Request approval
- One file per change
- Verify schema alignment
- Check brandId/tenantId
- Document everything
```

---

**Last Updated:** 2025-01-20  
**Version:** 2.0  
**Maintained By:** POSTD Engineering Team

