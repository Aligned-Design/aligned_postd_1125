#!/usr/bin/env tsx
/**
 * Check for banned/deprecated terms in the codebase
 * Fails CI if any banned terms are found in active code
 * 
 * Usage:
 *   pnpm check:banned
 *   
 * Exit codes:
 *   0 - No violations found
 *   1 - Violations found
 */

import { execSync } from "child_process";
import { join } from "path";

const BANNED_PATTERNS = [
  // Old product branding
  {
    pattern: "aligned-20|aligned20|Aligned-20AI|Aligned Design",
    name: "Old product name (Aligned-20AI)",
    severity: "error",
  },
  // Removed dependencies
  {
    pattern: "@builder\\.io|builder\\.io",
    name: "Builder.io (removed dependency)",
    severity: "error",
  },
  {
    pattern: "BUILDER_|VITE_BUILDER",
    name: "Builder.io environment variables",
    severity: "error",
  },
  // Deprecated table references (if you want to enforce specific patterns)
  // Uncomment if you want to ban direct usage of legacy patterns:
  // {
  //   pattern: "from\\s+['\"]content['\"]",
  //   name: "Ambiguous 'content' table (use 'content_items')",
  //   severity: "warning",
  // },
];

const EXCLUDED_PATHS = [
  "node_modules",
  "dist",
  ".git",
  "*.md", // Allow in documentation
  "*.txt",
  "CHANGELOG*",
  "docs/", // Allow in docs for historical reference
  "src_ARCHIVED/", // Archived code
  ".env*", // Env files (not committed anyway)
  "pnpm-lock.yaml",
  "package-lock.json",
];

interface Violation {
  file: string;
  line: number;
  content: string;
  pattern: string;
  severity: string;
}

function searchPattern(pattern: string): string {
  try {
    // Build grep exclude arguments
    const excludeArgs = EXCLUDED_PATHS.map((path) => `--exclude-dir=${path}`).join(" ");

    // Use ripgrep if available (faster), fallback to grep
    let cmd: string;
    try {
      execSync("which rg", { stdio: "ignore" });
      cmd = `rg -n "${pattern}" --type-not markdown --glob '!docs/**' --glob '!*.md' --glob '!*.txt' --glob '!CHANGELOG*' --glob '!src_ARCHIVED/**' --glob '!.env*' .`;
    } catch {
      cmd = `grep -rn -E "${pattern}" ${excludeArgs} --exclude="*.md" --exclude="*.txt" --exclude="CHANGELOG*" --exclude=".env*" . || true`;
    }

    return execSync(cmd, { encoding: "utf-8", cwd: join(__dirname, "..") });
  } catch (error) {
    // Command might fail if no matches found
    return "";
  }
}

function parseGrepOutput(output: string, pattern: string, severity: string): Violation[] {
  if (!output.trim()) return [];

  return output
    .trim()
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const match = line.match(/^([^:]+):(\d+):(.+)$/);
      if (!match) {
        console.warn(`Could not parse line: ${line}`);
        return null;
      }
      const [, file, lineNum, content] = match;
      return {
        file: file.trim(),
        line: parseInt(lineNum, 10),
        content: content.trim(),
        pattern,
        severity,
      };
    })
    .filter((v): v is Violation => v !== null);
}

function main() {
  console.log("🔍 Checking for banned terms in codebase...\n");

  const allViolations: Violation[] = [];

  for (const banned of BANNED_PATTERNS) {
    console.log(`Checking: ${banned.name}...`);
    const output = searchPattern(banned.pattern);
    const violations = parseGrepOutput(output, banned.name, banned.severity);

    if (violations.length > 0) {
      allViolations.push(...violations);
      console.log(`  ❌ Found ${violations.length} violation(s)`);
    } else {
      console.log(`  ✅ No violations`);
    }
  }

  console.log("\n" + "=".repeat(60));

  if (allViolations.length === 0) {
    console.log("✅ SUCCESS: No banned terms found!");
    console.log("=".repeat(60));
    process.exit(0);
  }

  // Group by severity
  const errors = allViolations.filter((v) => v.severity === "error");
  const warnings = allViolations.filter((v) => v.severity === "warning");

  if (errors.length > 0) {
    console.log(`❌ ERRORS: ${errors.length} banned term(s) found\n`);
    errors.forEach((v) => {
      console.log(`  ${v.file}:${v.line}`);
      console.log(`  Pattern: ${v.pattern}`);
      console.log(`  > ${v.content}`);
      console.log();
    });
  }

  if (warnings.length > 0) {
    console.log(`⚠️  WARNINGS: ${warnings.length} deprecated term(s) found\n`);
    warnings.forEach((v) => {
      console.log(`  ${v.file}:${v.line}`);
      console.log(`  Pattern: ${v.pattern}`);
      console.log(`  > ${v.content}`);
      console.log();
    });
  }

  console.log("=".repeat(60));

  if (errors.length > 0) {
    console.log("\n❌ FAIL: Banned terms found. Please remove them before committing.");
    process.exit(1);
  } else {
    console.log("\n⚠️  Warnings found but passing. Consider cleaning up deprecated terms.");
    process.exit(0);
  }
}

main();

