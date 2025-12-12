# Documentation Meta Directory

**Purpose:** This directory contains metadata, logs, and guidelines for maintaining POSTD documentation.

---

## Documentation Principles

### 1. Archive, Don't Delete

**Rule:** Never delete historical documentation unless it contains sensitive data or is demonstrably wrong.

**Process:**
- Move outdated docs to `docs/07_archive/`
- Add a redirect banner to the archived file
- Preserve original date/context in archive

**Example Banner:**
```markdown
> 🗄️ **ARCHIVED:** This document was archived on YYYY-MM-DD
> **Reason:** Superseded by [New Doc](../path/to/new-doc.md)
> **Original Date:** YYYY-MM-DD
```

---

### 2. Redirect Banners

**Rule:** When a document is moved, superseded, or no longer canonical, add a redirect banner.

**Banner Types:**

#### Superseded Document
```markdown
> ⚠️ **SUPERSEDED:** This document has been replaced
> **Current Version:** [New Doc](../path/to/new-doc.md)
> **Last Updated:** YYYY-MM-DD
```

#### Moved Document (Stub File)
```markdown
> 🔀 **MOVED:** This document has been relocated
> **New Location:** [New Path](../path/to/new-location.md)
> **Moved On:** YYYY-MM-DD
```

#### Canonical Reference
```markdown
> ⚠️ **Canonical Reference Notice**
> This document contains historical or partial information.
> **Canonical:** [Source of Truth Doc](../path/to/canonical.md)
> **Last Verified:** YYYY-MM-DD
```

#### Scope Limitation
```markdown
> ℹ️ **SCOPE:** This document covers [specific scope only]
> **Not covered:** [what's excluded]
> **See also:** [Related Docs](../path/to/related.md)
```

---

### 3. Choosing Canonical Documents

**Precedence Rules** (when docs conflict, trust this order):

1. **Schema Migrations** (`supabase/migrations/`) — Ultimate truth for database structure
2. **Shared Types/Enums** (`shared/*.ts`) — Truth for data contracts used across client/server
3. **API Contract** (`POSTD_API_CONTRACT.md`) — Truth for API endpoints and request/response schemas
4. **Workflow Docs** (`docs/02_workflows/`) — Truth for user journeys and business processes
5. **Audit Docs** (`docs/06_audits/`) — Historical snapshots, not current truth

**How to Choose:**
- **Date:** Newer is better (if both are maintained)
- **Scope:** More specific beats more general
- **Authority:** Code > Docs; Docs > Comments
- **Maintenance:** Actively updated > abandoned

---

### 4. File Organization

**Folder Structure:**

```
docs/
├── 00_start_here/         # Entry points, quick start guides
├── 01_architecture/       # System design, schemas, contracts
├── 02_workflows/          # User journeys, business processes
├── 03_operations/         # Deployment, monitoring, runbooks
├── 04_contributing/       # Dev guides, style guides, governance
├── 05_client_success/     # Client-facing docs, onboarding
├── 06_audits/             # Historical audits, validation reports
├── 07_archive/            # Superseded, outdated, or completed docs
└── _meta/                 # This directory (maintenance docs)
```

**Naming Conventions:**
- Use `SCREAMING_SNAKE_CASE.md` for important/canonical docs
- Use `kebab-case.md` for supporting/workflow docs
- Add date prefixes for audits: `YYYY_MM_DD_AUDIT_NAME.md`
- Use `00_`, `01_` prefixes to control sort order within folders

---

### 5. Link Maintenance

**After moving a file:**
1. Search for all references: `grep -r "old-filename.md" .`
2. Update inbound links OR leave a redirect stub
3. Verify links still work: `pnpm link-check` (if available)

**Relative Paths:**
- Use relative paths for internal links: `../02_workflows/onboarding.md`
- Absolute paths for external links: `https://example.com`

---

## Reorganization Process

### Small Batches (5-20 files max)

**Why:** Easier to verify, revert if needed, and track changes

### Verification Loop (Required After Each Batch)

1. **Tests:** `pnpm test`
2. **Linting:** `pnpm lint`
3. **Build:** `pnpm build` (if available)
4. **Link Scan:** `grep -r "](\.\." docs/` (look for broken relative links)
5. **Duplicate Check:** Ensure no two files claim same canonical authority

### Log Every Change

Update `docs/_meta/DOC_REORG_LOG.md` after each batch with:
- Files created/moved/updated
- Tests run + results
- Risks discovered
- Next batch plan

---

## Contact

**Questions?** See the main [Documentation Index](../../DOCS_INDEX.md) or [README](../../README.md)

