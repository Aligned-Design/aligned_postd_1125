# Audit Reports & Validation Documents

**Purpose:** This directory contains historical audit reports, validation checklists, and verification documents that capture point-in-time assessments of POSTD systems.

---

## What Belongs Here

✅ **Include:**
- Audit reports (system, security, performance, etc.)
- Validation reports (pipeline, schema, API, etc.)
- Verification checklists (launch gates, staging gates, etc.)
- Point-in-time assessment documents
- Compliance audit trails

❌ **Exclude:**
- Current/active documentation (goes in `docs/01_architecture/`, `docs/02_workflows/`, etc.)
- Ongoing task lists (goes in project management tools)
- Code-level test reports (goes in test output directories)

---

## Naming Convention

**Pattern:** `YYYY_MM_DD/<original_filename>`

**Examples:**
- `2025_12_12/SCRAPER_AUDIT_FINAL_REPORT.md`
- `2025_12_12/PHASE3_VALIDATION_REPORT.md`
- `2025_11_15/MVP_DATABASE_TABLE_AUDIT_REPORT.md`

**Rationale:**
- Date folder groups audits by time period
- Original filename preserved for traceability
- Easy to find "audits from December 2025"

---

## Stub Redirects

When an audit is moved from its original location (e.g., root directory), a **stub file** is left behind to redirect users.

**Stub Format:**
```markdown
> 🔀 **MOVED:** This document has been relocated  
> **New Location:** [docs/06_audits/YYYY_MM_DD/FILENAME.md](docs/06_audits/YYYY_MM_DD/FILENAME.md)  
> **Moved On:** YYYY-MM-DD  
> **Reason:** Archived as historical audit report

# [Original Title]

This audit report has been moved to the audits archive.

**See:** [docs/06_audits/YYYY_MM_DD/FILENAME.md](docs/06_audits/YYYY_MM_DD/FILENAME.md)
```

---

## How to Use Dates

**Date Source Priority:**
1. Explicit date in filename (e.g., `2025_12_12_scraper_audit.md`)
2. "Date:" or "Last Updated:" field in document header
3. Git commit date of document creation
4. Move date (if unable to determine original date)

**Date Format:** `YYYY_MM_DD` (ISO 8601 sortable format)

---

## Audit Lifecycle

```
1. Audit Created (in root or relevant folder)
   ↓
2. Audit Completed & Report Published
   ↓
3. Recommendations Implemented (tracked elsewhere)
   ↓
4. [Time Passes - audit becomes historical]
   ↓
5. Audit Moved to docs/06_audits/YYYY_MM_DD/
   ↓
6. Stub left at original location for discoverability
```

---

## Related Documentation

- **Active Docs:** See [DOCS_INDEX.md](../../DOCS_INDEX.md) for current documentation
- **Reorganization Log:** See [docs/_meta/DOC_REORG_LOG.md](../_meta/DOC_REORG_LOG.md) for move history
- **Precedence Rules:** When audits conflict with current docs, see `DOCS_INDEX.md` precedence rules

---

**Questions?** See [docs/_meta/README.md](../_meta/README.md) or [DOCS_INDEX.md](../../DOCS_INDEX.md)

