# GitHub Issues Creation Guide

## Overview

This guide helps you automatically create all 85 GitHub issues from the Audit Report (November 7, 2025).

**Total Issues:** 85
- **P1 (Critical):** 5 issues
- **P2 (High):** 18 issues
- **P3 (Medium):** 9 issues
- **P4 (Deferred):** 13 issues (Phase 10+)

---

## Prerequisites

### 1. GitHub CLI Installation

Install GitHub CLI from: https://cli.github.com

**macOS:**
```bash
brew install gh
```

**Linux:**
```bash
type -p curl >/dev/null || (sudo apt update && sudo apt install curl -y)
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update && sudo apt install gh -y
```

**Windows:**
```bash
choco install gh
```

Verify installation:
```bash
gh --version
```

### 2. GitHub Personal Access Token

Create a token with `repo` and `admin:repo_hook` scopes:

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. **Token name:** `github-issues-creation`
4. **Expiration:** 90 days (or your preference)
5. **Scopes:**
   - ✅ `repo` (full control of private repositories)
   - ✅ `admin:repo_hook` (write access to hooks)
6. Click "Generate token"
7. **Copy the token** (you won't be able to see it again!)

### 3. Create GitHub Milestone

Before running the script, create the milestone in GitHub:

1. Go to: https://github.com/Aligned-Design/Aligned-20ai/milestones
2. Click "New Milestone"
3. **Title:** `Audit Remediation Sprint`
4. **Description:** `Issues identified in the November 7, 2025 Audit Report`
5. **Due Date:** (Optional - set based on your sprint schedule)
6. Click "Create Milestone"

---

## Quick Start

### Option 1: Interactive Authentication (Recommended)

```bash
# Step 1: Authenticate with GitHub
gh auth login

# Follow prompts:
# - What account do you want to log into? → github.com
# - What is your preferred protocol? → HTTPS
# - Authenticate Git with your GitHub credentials? → Yes
# - How would you like to authenticate GitHub CLI? → Paste token

# Step 2: Run the script
cd /path/to/Aligned-20ai
bash scripts/create-github-issues.sh
```

### Option 2: Direct Token (Non-interactive)

```bash
# Set token as environment variable
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Run script
cd /path/to/Aligned-20ai
bash scripts/create-github-issues.sh
```

### Option 3: One-liner

```bash
GITHUB_TOKEN=ghp_xxxx bash /path/to/Aligned-20ai/scripts/create-github-issues.sh
```

---

## Running the Script

### Basic Execution

```bash
# From project root
bash scripts/create-github-issues.sh
```

### With Output to File

```bash
# Capture output for review
bash scripts/create-github-issues.sh | tee github-issues-creation.log
```

### Dry Run (Check Issues Only)

```bash
# View what would be created
gh issue list --repo Aligned-Design/Aligned-20ai --limit 100
```

---

## Script Output

The script will display:

```
==========================================
GitHub Issues Batch Creator
===========================================

Repository: Aligned-Design/Aligned-20ai
Milestone: Audit Remediation Sprint

Creating Priority 1 Issues (Critical Blockers)

Creating issue #1: [Phase 1] OAuth State Validation – Fix CSRF Vulnerability... ✓
Creating issue #2: [Phase 1] Request Input Validation – Add Zod/Joi Schema... ✓
...

===========================================
Issue Creation Complete!
===========================================

Issues Created: 85
Issues Failed: 0

Next steps:
1. Review issues at: https://github.com/Aligned-Design/Aligned-20ai/issues
2. Organize by milestone: Audit Remediation Sprint
3. Assign team members
4. Begin Sprint 1
```

---

## Verification

After running the script, verify the issues were created:

### Check in GitHub Web UI
https://github.com/Aligned-Design/Aligned-20ai/issues

### Check via CLI
```bash
# List all issues with Audit Remediation milestone
gh issue list --repo Aligned-Design/Aligned-20ai \
  --search "milestone:\"Audit Remediation Sprint\"" \
  --limit 100

# Count by priority
gh issue list --repo Aligned-Design/Aligned-20ai \
  --label P1 --limit 100 | wc -l

gh issue list --repo Aligned-Design/Aligned-20ai \
  --label P2 --limit 100 | wc -l

gh issue list --repo Aligned-Design/Aligned-20ai \
  --label P3 --limit 100 | wc -l
```

---

## Troubleshooting

### "gh not found"
Install GitHub CLI: https://cli.github.com

### "Error: authentication required"
Your token is missing or invalid. Either:
- Run `gh auth login` for interactive auth
- Or set `GITHUB_TOKEN` environment variable

### "GITHUB_TOKEN environment variable not set"
Set the token before running:
```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
bash scripts/create-github-issues.sh
```

### "Error: HTTP 422 Unprocessable Entity"
Usually means:
- Milestone doesn't exist (create it first)
- Labels don't exist (script will create them, but verify milestone exists)
- Repository path is incorrect

### "Error: permission denied"
Make sure your token has `repo` and `admin:repo_hook` scopes:
1. Go to https://github.com/settings/tokens
2. Click on your token
3. Verify scopes are checked
4. Click "Update token"

### Script runs but issues fail to create
Check:
1. ✅ You're authenticated: `gh auth status`
2. ✅ Milestone exists: https://github.com/Aligned-Design/Aligned-20ai/milestones
3. ✅ Repository is correct: `gh repo view`
4. ✅ Token has correct scopes

---

## Manual Creation (If Script Fails)

If the script fails, you can create issues manually:

1. Go to: https://github.com/Aligned-Design/Aligned-20ai/issues/new
2. Copy issue title from `/docs/reports/github-issues-batch-create.md`
3. Copy body from batch creation guide
4. Add labels:
   - Phase label: `phase-1` through `phase-10`
   - Priority label: `P1`, `P2`, `P3`, or `P4`
   - Type labels: `backend`, `frontend`, `database`, `security`, etc.
5. Set milestone: `Audit Remediation Sprint`
6. Click "Create"

Repeat for all 85 issues (or focus on P1 first: 5 issues)

---

## Post-Creation Steps

### 1. Organize Issues (5 min)

Create a GitHub Project Board:
1. Go to: https://github.com/Aligned-Design/Aligned-20ai/projects
2. Click "New project"
3. **Name:** `Audit Remediation`
4. **Template:** Table or Board (your preference)
5. Add columns: `To Do`, `In Progress`, `In Review`, `Done`
6. Add all issues to the project

### 2. Assign Team Members (10 min)

For each P1 issue:
1. Open the issue
2. Click "Assignees"
3. Assign to team member

**Recommended assignments:**
- #1.5 (CSRF Fix) → Most senior/security developer
- #1.1 (Input Validation) → Backend lead
- #1.2 (Error Standardization) → Backend lead
- #1.3 (Auth Context) → Security/Backend developer
- #1.4 (Database) → DBA / Senior backend

### 3. Schedule Sprint 1 (15 min)

Set milestone dates:
1. Go to: https://github.com/Aligned-Design/Aligned-20ai/milestones
2. Click `Audit Remediation Sprint`
3. Set **Due Date** to end of Week 2
4. Save

### 4. Create Sprint Labels (5 min)

Add sprint labels for tracking:
```bash
# Via CLI
gh label create sprint-1 --repo Aligned-Design/Aligned-20ai --color "1f883d"
gh label create sprint-2 --repo Aligned-Design/Aligned-20ai --color "256099"
gh label create sprint-3 --repo Aligned-Design/Aligned-20ai --color "bf8700"
gh label create sprint-4 --repo Aligned-Design/Aligned-20ai --color "6e40aa"
```

### 5. Begin Sprint 1

Start with the 5 P1 issues:
1. Move issues to "In Progress"
2. Create PR for each
3. Link PR to issue (in PR description: `Closes #123`)

---

## Checking Token Scopes

```bash
# Verify token has correct scopes
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user

# Should show your GitHub username
# Then check full token info:
gh api user
```

---

## Need Help?

1. **Script not running?**
   - Check GitHub CLI is installed: `gh --version`
   - Check token is set: `echo $GITHUB_TOKEN`
   - Check milestone exists

2. **Issues not being created?**
   - Run one issue manually to test auth
   - Check token scopes at: https://github.com/settings/tokens
   - Check permission on repo (should be admin)

3. **Want to debug?**
   - Run with verbose output: `bash -x scripts/create-github-issues.sh 2>&1 | head -100`
   - Check individual issue creation: `gh issue create --title "Test" --body "Test"`

4. **Want to delete test issues?**
   ```bash
   # Close an issue (doesn't delete, but hides from list)
   gh issue close 1 --repo Aligned-Design/Aligned-20ai

   # Reopen if needed
   gh issue reopen 1 --repo Aligned-Design/Aligned-20ai
   ```

---

## Reference Files

All issue details are in:
- **Full Audit Report:** `/docs/reports/todo-audit-2025-11-07.md`
- **Batch Creation Guide:** `/docs/reports/github-issues-batch-create.md`
- **Summary & Sprint Plan:** `/docs/reports/todo-audit-summary-latest.md`
- **Creation Script:** `/scripts/create-github-issues.sh`

---

## Example: Complete Flow

```bash
# 1. Create milestone in GitHub (web UI)
# https://github.com/Aligned-Design/Aligned-20ai/milestones

# 2. Get token
# https://github.com/settings/tokens

# 3. Set token and run
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
cd ~/Documents/GitHub/Aligned-20ai
bash scripts/create-github-issues.sh

# 4. Verify
gh issue list --repo Aligned-Design/Aligned-20ai \
  --search "milestone:\"Audit Remediation Sprint\"" \
  --limit 100

# 5. Create project board (web UI)
# https://github.com/Aligned-Design/Aligned-20ai/projects

# 6. Assign team members and start Sprint 1!
```

---

**Questions?** Check the FAQ or run `gh help issue` for CLI help.

---

**Created:** November 7, 2025
**Status:** Ready to execute
**Target Issues:** 85 total
