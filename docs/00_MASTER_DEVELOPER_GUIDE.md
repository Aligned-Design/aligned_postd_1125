# POSTD Master Developer Guide

**Version:** 1.0  
**Last Updated:** 2025-01-20  
**Status:** ✅ Active

---

## Purpose

This guide explains how Cursor AI agents and human developers work together using the POSTD Command Center as the single source of truth for all development rules, patterns, and workflows.

---

## Why Section 0 Matters

The **POSTD Master Execution Rules** (Section 0 in `00_MASTER_CURSOR_COMMAND_CENTER.md`) establish foundational principles that apply to **every task** in the repository:

- **Prevents duplication** - Forces search before creation
- **Ensures consistency** - Standardizes naming, patterns, and structure
- **Maintains safety** - Enforces RLS, brandId, and tenantId rules
- **Guarantees documentation** - Requires comprehensive audit trails

These rules are not optional—they are the foundation for all work in POSTD.

---

## How Cursor + Human Developers Interact

### Workflow Overview

```
Human Developer
  ↓
  Requests task (e.g., "Add feature X")
  ↓
Cursor Agent
  ↓
  1. Reads Section 0 (Master Execution Rules)
  2. Reads Section 1 (Master Behavior Profile)
  3. Searches repo for existing code/docs
  4. Proposes changes with full context
  5. Waits for approval
  6. Applies changes
  7. Updates documentation
  8. Provides QA instructions
  ↓
Human Developer
  ↓
  Reviews → Approves → Tests → Merges
```

### Key Interaction Points

1. **Task Initiation**: Human provides context; Cursor reads Section 0 first
2. **Proposal Phase**: Cursor shows diffs and explains changes
3. **Approval Gate**: Human reviews before any code changes
4. **Documentation**: Cursor updates relevant MVP docs automatically
5. **QA Handoff**: Cursor provides testing checklist for human verification

---

## Expected Workflow: Audit → Update → Document → Test

### 1. Audit Phase

**Cursor's Role:**
- Search repository for existing implementations
- Identify related files, patterns, and dependencies
- Map current state (file map, flow diagrams)
- Document findings in audit report

**Human's Role:**
- Provide context and requirements
- Review audit findings
- Approve scope of work

### 2. Update Phase

**Cursor's Role:**
- Propose changes with full diffs
- Explain rationale for each change
- Wait for explicit approval
- Apply changes one file at a time

**Human's Role:**
- Review proposed changes
- Request clarifications if needed
- Approve or request modifications

### 3. Document Phase

**Cursor's Role:**
- Update relevant MVP documentation:
  - `docs/MVP#_AUDIT_REPORT.md`
  - `docs/MVP#_FILE_MAP.md`
  - `docs/MVP#_IMPLEMENTATION_NOTES.md`
  - `docs/MVP#_TEST_RESULTS.md`
- Include purpose, file map, flow diagrams, before/after notes

**Human's Role:**
- Review documentation for accuracy
- Request additions if needed

### 4. Test Phase

**Cursor's Role:**
- Provide testing instructions
- List modified files
- Note assumptions made
- Provide QA checklist

**Human's Role:**
- Execute tests
- Verify functionality
- Report any issues
- Approve for merge

---

## Directory Structure Overview

```
POSTD/
├── docs/
│   ├── 00_MASTER_DEVELOPER_GUIDE.md      ← You are here
│   ├── 00_MASTER_CURSOR_COMMAND_CENTER.md  ← Master rules source
│   ├── MVP#_AUDIT_REPORT.md              ← Audit findings
│   ├── MVP#_FILE_MAP.md                  ← File inventory
│   ├── MVP#_IMPLEMENTATION_NOTES.md      ← Implementation details
│   └── MVP#_TEST_RESULTS.md               ← Test outcomes
├── client/                                ← React frontend
├── server/                                ← Express backend
│   ├── routes/                           ← API endpoints
│   └── lib/                              ← Utilities & helpers
├── shared/                                ← Shared types
├── supabase/                             ← Database & migrations
└── commands/                             ← MVP command files (if created)
```

### Key Directories

- **`docs/`** - All documentation lives here
- **`docs/00_MASTER_*`** - Global master documents
- **`docs/MVP#_*`** - MVP-specific documentation
- **`server/routes/`** - API route handlers
- **`server/lib/`** - Shared server utilities
- **`supabase/migrations/`** - Database schema changes

---

## When to Run MVP Command Files

MVP command files (if created in `commands/` directory) are task-specific execution guides that reference the Command Center.

### When to Use MVP Commands

- **New MVP implementation** - Use MVP command file for structured execution
- **Major feature addition** - Follow MVP command workflow
- **System-wide refactoring** - Use MVP command for phased approach

### MVP Command File Structure

Each MVP command file should:

1. **Reference Section 0** at the top:
   ```markdown
   BEFORE EXECUTION:
   Cursor MUST follow the global Master Execution Rules found in:
   docs/00_MASTER_CURSOR_COMMAND_CENTER.md
   ```

2. **Define MVP-specific tasks** - Step-by-step instructions
3. **Reference existing patterns** - Link to similar implementations
4. **Include validation steps** - How to verify completion

---

## How to Create New Command Files

### Step 1: Determine if Command File is Needed

- **Yes**: Complex, multi-step MVP implementation
- **No**: Simple bug fix or single-file change

### Step 2: Create Command File

1. **Location**: `commands/MVP#_FEATURE_NAME.md`
2. **Header**: Include Section 0 reference
3. **Structure**: Follow existing MVP command patterns
4. **Tasks**: Break down into sequential steps

### Step 3: Link to Command Center

- Reference `docs/00_MASTER_CURSOR_COMMAND_CENTER.md` in header
- Use Section 0 rules as foundation
- Reference relevant sections (1-16) as needed

### Example Command File Structure

```markdown
# MVP# - Feature Name

BEFORE EXECUTION:
Cursor MUST follow the global Master Execution Rules found in:
docs/00_MASTER_CURSOR_COMMAND_CENTER.md

## Overview
Brief description of MVP feature.

## Prerequisites
- Existing files to review
- Dependencies to understand

## Tasks
1. Task 1 - Description
2. Task 2 - Description
...

## Validation
- How to verify completion
- Testing checklist
```

---

## How to Run End-to-End QA

### QA Checklist (After Any Change)

1. **Code Quality**
   - [ ] TypeScript compiles without errors (`pnpm typecheck`)
   - [ ] Linting passes (`pnpm lint`)
   - [ ] No console errors in browser

2. **Functionality**
   - [ ] Feature works as expected
   - [ ] No regressions in related features
   - [ ] Error handling works correctly

3. **Security**
   - [ ] brandId checks in place
   - [ ] tenantId validation present
   - [ ] RLS policies enforced
   - [ ] No data leakage risks

4. **Documentation**
   - [ ] MVP docs updated
   - [ ] Code comments added where needed
   - [ ] Flow diagrams accurate

5. **Testing**
   - [ ] Manual testing completed
   - [ ] Edge cases tested
   - [ ] Error scenarios verified

### Running QA

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Build verification
pnpm build

# Start dev server
pnpm dev

# Manual testing in browser
# Follow testing checklist from Cursor output
```

---

## How to Maintain the Command Center

The Command Center (`docs/00_MASTER_CURSOR_COMMAND_CENTER.md`) is the **single source of truth**. Here's how to keep it current:

### When to Update Command Center

1. **New patterns emerge** - Add to Section 7 (Common Patterns)
2. **New rules needed** - Add to Section 0 (Master Execution Rules)
3. **New red flags found** - Add to Section 8 (Red Flags)
4. **Process improvements** - Update relevant sections

### Update Process

1. **Identify need** - Pattern/rule/process missing or outdated
2. **Propose change** - Show diff with explanation
3. **Get approval** - Human reviews proposed update
4. **Apply change** - Update Command Center
5. **Notify team** - Document what changed and why

### What NOT to Do

- ❌ Create duplicate rule files
- ❌ Move Command Center to different location
- ❌ Create competing master documents
- ❌ Skip Section 0 when adding new rules

### Version Control

- **Version number** - Increment when making significant changes
- **Last Updated** - Update date when making changes
- **Changelog** - Consider adding changelog section for major updates

---

## Common Scenarios

### Scenario 1: Adding a New Feature

1. Human: "Add feature X"
2. Cursor: Reads Section 0 → Searches repo → Proposes plan
3. Human: Reviews → Approves
4. Cursor: Implements → Documents → Provides QA checklist
5. Human: Tests → Merges

### Scenario 2: Fixing a Bug

1. Human: "Fix bug Y"
2. Cursor: Reads Section 0 → Searches for related code → Identifies root cause
3. Cursor: Proposes fix with diff
4. Human: Reviews → Approves
5. Cursor: Applies fix → Updates docs
6. Human: Verifies fix works

### Scenario 3: Refactoring

1. Human: "Refactor component Z"
2. Cursor: Reads Section 0 → Maps dependencies → Proposes refactor plan
3. Human: Reviews impact analysis
4. Cursor: Applies changes incrementally
5. Human: Tests after each increment
6. Cursor: Updates all related documentation

---

## Quick Reference

### For Cursor Agents

1. **Always start with Section 0** - Master Execution Rules
2. **Search before creating** - Never duplicate
3. **Show diffs first** - Get approval before changes
4. **Update docs** - Every change needs documentation
5. **Provide QA checklist** - Help humans verify work

### For Human Developers

1. **Reference Command Center** - Single source of truth
2. **Review proposals** - Don't auto-approve
3. **Test thoroughly** - Use provided QA checklists
4. **Update Command Center** - When patterns/rules change
5. **Maintain consistency** - Follow established patterns

---

## Related Documentation

- **[00_MASTER_CURSOR_COMMAND_CENTER.md](./00_MASTER_CURSOR_COMMAND_CENTER.md)** - Master rules source
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Development environment setup
- **[ARCHITECTURE_QUICK_REFERENCE.md](../ARCHITECTURE_QUICK_REFERENCE.md)** - System architecture
- **[TECH_STACK_GUIDE.md](../TECH_STACK_GUIDE.md)** - Technology stack reference

---

**Remember**: The Command Center is the foundation. Section 0 rules apply to everything. When in doubt, search the repo, read existing patterns, and maintain consistency.

