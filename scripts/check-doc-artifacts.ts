#!/usr/bin/env tsx
/**
 * Check for process artifact documentation files
 * Fails CI if any process artifact docs are found in active code
 * 
 * Usage:
 *   pnpm check:docs
 *   
 * Exit codes:
 *   0 - No violations found
 *   1 - Process artifact docs found
 */

import { execSync } from "child_process";
import { join } from "path";

const ARTIFACT_PATTERNS = [
  { pattern: "REPORT", name: "Report documents" },
  { pattern: "AUDIT", name: "Audit documents" },
  { pattern: "CHECKLIST", name: "Checklist documents" },
  { pattern: "PHASE[0-9]", name: "Phase documents" },
  { pattern: "GATE", name: "Gate documents" },
  { pattern: "SWEEP", name: "Sweep documents" },
  { pattern: "_SUMMARY", name: "Summary documents" },
];

// Canonical docs (always allowed)
const CANONICAL_DOCS = [
  "docs/ARCHITECTURE.md",
  "docs/DEVELOPMENT.md",
  "docs/MIGRATIONS_AND_DECISIONS.md",
];

// Legitimate docs (allowed anywhere)
const ALLOWED_DOCS = [
  "README.md",
  "CHANGELOG.md",
  "SECURITY.md",
  "CONTRIBUTING.md",
  ...CANONICAL_DOCS,
];

// Paths to exclude from scanning
const EXCLUDED_PATHS = [
  "node_modules",
  "dist",
  ".git",
  "docs/archive", // Allow archived docs
  "docs/07_archive", // Allow archived docs
  "docs/reports", // Allow historical reports
];

// Only scan docs/ directory for artifacts (avoid false positives in code comments)
const SCAN_PATHS = ["docs/"];

interface Violation {
  file: string;
  pattern: string;
}

function searchPattern(pattern: string): string {
  try {
    // Build grep exclude arguments
    const excludeArgs = EXCLUDED_PATHS.map((path) => `--exclude-dir=${path}`).join(" ");

    // Use ripgrep if available (faster), fallback to grep
    // Only scan docs/ directory to avoid false positives in code/comments
    let cmd: string;
    try {
      execSync("which rg", { stdio: "ignore" });
      const excludeGlobs = EXCLUDED_PATHS.map((path) => `--glob '!${path}/**'`).join(" ");
      cmd = `rg --files ${excludeGlobs} docs/ | grep -E '${pattern}\\.md$' || true`;
    } catch {
      const scanPaths = SCAN_PATHS.join(" ");
      cmd = `find ${scanPaths} -type f -name "*${pattern}*.md" ${EXCLUDED_PATHS.map((p) => `-not -path "*/${p}/*"`).join(" ")} || true`;
    }

    return execSync(cmd, { encoding: "utf-8", cwd: join(__dirname, "..") });
  } catch (error) {
    return "";
  }
}

function parseResults(output: string, pattern: string): Violation[] {
  if (!output.trim()) return [];

  return output
    .trim()
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .filter((file) => {
      // Exclude allowed docs
      const normalized = file.replace(/^\.\//, "");
      return !ALLOWED_DOCS.includes(normalized);
    })
    .map((file) => ({
      file: file.trim(),
      pattern,
    }));
}

function main() {
  console.log("🔍 Checking for process artifact documentation in docs/...\n");

  const allViolations: Violation[] = [];

  for (const artifact of ARTIFACT_PATTERNS) {
    console.log(`Checking: ${artifact.name}...`);
    const output = searchPattern(artifact.pattern);
    const violations = parseResults(output, artifact.name);

    if (violations.length > 0) {
      allViolations.push(...violations);
      console.log(`  ❌ Found ${violations.length} violation(s)`);
    } else {
      console.log(`  ✅ No violations`);
    }
  }

  console.log("\n" + "=".repeat(60));

  if (allViolations.length === 0) {
    console.log("✅ SUCCESS: No process artifact docs found in docs/!");
    console.log("\nCanonical docs:");
    CANONICAL_DOCS.forEach((doc) => console.log(`  - ${doc}`));
    console.log("\nScanned: docs/ directory");
    console.log("Excluded: docs/archive, docs/07_archive, docs/reports");
    console.log("=".repeat(60));
    process.exit(0);
  }

  console.log(`❌ FAIL: ${allViolations.length} process artifact doc(s) found\n`);
  
  allViolations.forEach((v) => {
    console.log(`  ${v.file}`);
    console.log(`  Pattern: ${v.pattern}`);
    console.log();
  });

  console.log("=".repeat(60));
  console.log("\n❌ Process artifact docs are not allowed.");
  console.log("\nOnly these 3 canonical docs should exist:");
  ALLOWED_DOCS.forEach((doc) => console.log(`  - ${doc}`));
  console.log("\nIf you need to document a decision, add it to:");
  console.log("  docs/MIGRATIONS_AND_DECISIONS.md");
  console.log("\nIf you need to document architecture, add it to:");
  console.log("  docs/ARCHITECTURE.md");
  console.log("\nIf you need to document development process, add it to:");
  console.log("  docs/DEVELOPMENT.md");

  process.exit(1);
}

main();

