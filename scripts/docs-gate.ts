#!/usr/bin/env tsx
/**
 * POSTD Constitution: Docs Gate Enforcement (Mode B - Scoped)
 *
 * MODE B (Non-Destructive): Only enforces docs gate within /docs folder.
 * Legacy markdown files elsewhere in the repo are allowed temporarily.
 *
 * Enforces:
 * 1. /docs folder contains ONLY the 5 allowed markdown files
 * 2. All 5 required docs exist in /docs
 * 3. No other markdown files in /docs
 *
 * Allowed files in /docs:
 * - README.md
 * - POSTD_CONSTITUTION.md
 * - ARCHITECTURE.md
 * - DATA_MODEL.md
 * - MVP_FLOWS.md
 *
 * Future: Expand to repo-wide enforcement when legacy docs are migrated.
 */

import { readdir } from "fs/promises";
import { join } from "path";

const REPO_ROOT = process.cwd();
const DOCS_DIR = join(REPO_ROOT, "docs");

const REQUIRED_DOCS = [
  "README.md",
  "POSTD_CONSTITUTION.md",
  "ARCHITECTURE.md",
  "DATA_MODEL.md",
  "MVP_FLOWS.md",
] as const;

interface ValidationResult {
  missing: string[];
  unauthorized: string[];
}

async function getDocsMarkdownFiles(): Promise<string[]> {
  try {
    const entries = await readdir(DOCS_DIR, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory() && entry.name.endsWith(".md")) {
        files.push(entry.name);
      }
    }

    return files;
  } catch (error) {
    // /docs directory doesn't exist
    return [];
  }
}

async function validateDocs(): Promise<ValidationResult> {
  const result: ValidationResult = {
    missing: [],
    unauthorized: [],
  };

  // Find markdown files in /docs
  const docsMarkdownFiles = await getDocsMarkdownFiles();

  // Check for missing required docs in /docs
  for (const required of REQUIRED_DOCS) {
    if (!docsMarkdownFiles.includes(required)) {
      result.missing.push(required);
    }
  }

  // Check for unauthorized markdown files in /docs
  for (const file of docsMarkdownFiles) {
    if (!REQUIRED_DOCS.includes(file as any)) {
      result.unauthorized.push(file);
    }
  }

  return result;
}

async function main() {
  console.log("🔍 POSTD Docs Gate (Mode B): Validating /docs folder...\n");

  const result = await validateDocs();
  let hasErrors = false;

  // Report missing files
  if (result.missing.length > 0) {
    hasErrors = true;
    console.error("❌ Missing required documentation files in /docs:");
    for (const file of result.missing) {
      console.error(`   - docs/${file}`);
    }
    console.error();
    console.error("   Create these files in the /docs directory.");
    console.error();
  }

  // Report unauthorized files
  if (result.unauthorized.length > 0) {
    hasErrors = true;
    console.error("❌ Unauthorized markdown files found in /docs:");
    console.error("   Only the following files are allowed in /docs:");
    for (const allowed of REQUIRED_DOCS) {
      console.error(`   - ${allowed}`);
    }
    console.error("\n   Unauthorized files in /docs:");
    for (const file of result.unauthorized) {
      console.error(`   - docs/${file}`);
    }
    console.error();
    console.error("   These files must be moved or removed from /docs.");
    console.error();
  }

  if (hasErrors) {
    console.error("❌ Docs gate validation FAILED");
    console.error();
    console.error("Note: Mode B only checks /docs folder.");
    console.error("Legacy markdown files elsewhere are allowed temporarily.");
    process.exit(1);
  }

  console.log("✅ Docs gate validation PASSED");
  console.log(
    `   Found ${REQUIRED_DOCS.length} required documentation files in /docs`,
  );
  console.log("   No unauthorized markdown files in /docs");
  console.log();
  console.log("Note: Mode B - only /docs folder is enforced.");
  console.log("Legacy docs elsewhere in repo are allowed temporarily.");
  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Docs gate validation error:", error);
  process.exit(1);
});
