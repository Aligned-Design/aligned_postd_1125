# Documentation Move Gate — Verification Checklist

**Purpose:** Prevent stub-archiving mistakes. Use this checklist BEFORE moving any documentation to archive.

---

## Move Gate Rules (ALL must pass)

A file is eligible to move to archive ONLY if:

### ✅ Rule 1: File is Tracked

**Command:**
```bash
git ls-files --error-unmatch <path>
```

**Requirement:** File must exist in git (exit code 0).

**Why:** Untracked files have no history to preserve. Track them first (git add + commit) before moving.

---

### ✅ Rule 2: File is Not Already a Stub

**Check A — Minimum Line Count:**
```bash
wc -l <path>
# Must be >= 80 lines (unless clearly a short doc like a checklist or template)
```

**Check B — No Redirect Marker:**
```bash
head -10 <path> | grep -E "MOVED TO:|🔀 MOVED|> 🔀|Redirect:"
# Must return NO matches (exit code 1)
```

**Requirement:** File must have substantive content AND not contain a redirect banner.

**Why:** If file is already a stub, moving it creates stub-of-stub. If < 80 lines AND contains redirect marker, it's a stub.

---

### ✅ Rule 3: File Has Meaningful Header

**Command:**
```bash
head -30 <path> | grep "^#"
```

**Requirement:** Must find at least one markdown heading (`# Title`) in first 30 lines.

**Why:** Files without headers are likely fragments, templates, or broken docs.

---

## Move Process (Only If All Gates Pass)

### Step 1: Create Archive Location
```bash
mkdir -p docs/06_audits/YYYY_MM_DD/  # or docs/07_archive/
```

### Step 2: Copy (Not Move) First
```bash
cp <original-path> <archive-path>
```

### Step 3: Verify Archive Has Full Content
```bash
diff <original-path> <archive-path>
# Must show NO differences (exit code 0)

wc -l <archive-path>
# Must match original line count
```

### Step 4: ONLY THEN Create Stub at Original Path
```bash
# Overwrite original with stub redirect
cat > <original-path> <<'EOF'
> 🔀 **MOVED:** This document has been relocated
> **New Location:** [<archive-path>](<archive-path>)
> **Moved On:** YYYY-MM-DD
> **Reason:** [why archived]

# [Original Title]

This document has been moved to the archive.

**See:** [<archive-path>](<archive-path>)
EOF
```

### Step 5: Verify Stub is Small
```bash
wc -l <original-path>
# Must be <= 25 lines
```

### Step 6: Update References
```bash
grep -r "<filename>" . --include="*.md" --include="*.ts" | grep -v "node_modules"
# Update any references that should point to current docs (not historical quotes)
```

### Step 7: Test
```bash
pnpm typecheck
pnpm test  # if applicable
```

---

## Example: Moving an Audit Report

```bash
# File: SCRAPER_AUDIT_FINAL_REPORT.md (assume it passes Move Gate)

# ✅ Gate 1: Tracked?
git ls-files --error-unmatch SCRAPER_AUDIT_FINAL_REPORT.md
# Exit code 0 → PASS

# ✅ Gate 2: Not a stub?
wc -l SCRAPER_AUDIT_FINAL_REPORT.md
# Output: 271 SCRAPER_AUDIT_FINAL_REPORT.md → PASS (>= 80 lines)

head -10 SCRAPER_AUDIT_FINAL_REPORT.md | grep "MOVED TO:"
# No matches → PASS

# ✅ Gate 3: Has header?
head -30 SCRAPER_AUDIT_FINAL_REPORT.md | grep "^#"
# Output: # SCRAPER AUDIT FINAL REPORT → PASS

# ALL GATES PASSED → Proceed with move

mkdir -p docs/06_audits/2025_12_12/
cp SCRAPER_AUDIT_FINAL_REPORT.md docs/06_audits/2025_12_12/
diff SCRAPER_AUDIT_FINAL_REPORT.md docs/06_audits/2025_12_12/SCRAPER_AUDIT_FINAL_REPORT.md
# No differences → Archive verified

# NOW create stub
cat > SCRAPER_AUDIT_FINAL_REPORT.md <<'EOF'
> 🔀 **MOVED:** This document has been relocated  
> **New Location:** [docs/06_audits/2025_12_12/SCRAPER_AUDIT_FINAL_REPORT.md](docs/06_audits/2025_12_12/SCRAPER_AUDIT_FINAL_REPORT.md)  
> **Moved On:** 2025-12-12  
> **Reason:** Archived as historical audit report (dated 2025-12-12)

# SCRAPER AUDIT FINAL REPORT

This audit report has been moved to the audits archive.

**See:** [docs/06_audits/2025_12_12/SCRAPER_AUDIT_FINAL_REPORT.md](docs/06_audits/2025_12_12/SCRAPER_AUDIT_FINAL_REPORT.md)
EOF

wc -l SCRAPER_AUDIT_FINAL_REPORT.md
# Output: 14 → PASS (<= 25 lines)

pnpm typecheck
# PASS → Commit changes
```

---

## Failed Move Gate Example

```bash
# File: MY_DOC.md (doesn't pass gates)

wc -l MY_DOC.md
# Output: 12 MY_DOC.md → FAIL (< 80 lines, check if stub)

head -10 MY_DOC.md | grep "MOVED TO:"
# Output: > 🔀 MOVED TO: docs/archive/MY_DOC.md → FAIL (already a stub!)

# GATES FAILED → DO NOT MOVE
# Either investigate why it's a stub, or skip it
```

---

## When to Skip the Move

**Skip if:**
- File is already a stub (fails Gate 2)
- File is actively referenced in current code (grep shows imports/requires)
- File is part of current workflow (e.g., LAUNCH_GATE.md still relevant)
- Uncertain if file is historical vs current

**When in doubt:** Leave it in place. Archive only when certain it's historical.

---

**Related:** See [docs/_meta/README.md](README.md) for general documentation principles.

