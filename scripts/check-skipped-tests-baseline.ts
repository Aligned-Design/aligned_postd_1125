#!/usr/bin/env tsx
/**
 * Skipped Tests Baseline Guardrail
 * 
 * Prevents test debt from accumulating by blocking increases in skipped tests.
 * 
 * Rules:
 * 1. Skipped test count cannot increase above baseline
 * 2. TODO tests are strictly forbidden (must be 0)
 * 
 * Fails CI if:
 * - Skipped count exceeds baseline
 * - Any it.todo() or test.todo() exists
 */

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

interface Baseline {
  skippedCount: number;
  lastUpdated: string;
  note: string;
}

const BASELINE_FILE = join(process.cwd(), "tools/skipped-tests-baseline.json");

function getSkippedTestCount(): number {
  try {
    // Run tests to get output with skipped count
    const output = execSync("pnpm vitest run 2>&1 || true", {
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    // Parse test results - look for "skipped" in the output
    // Format: "Test Files  X passed | Y skipped (Z)"
    const summaryMatch = output.match(/Test Files\s+\d+\s+passed\s+\|\s+(\d+)\s+skipped/);
    if (summaryMatch) {
      return parseInt(summaryMatch[1], 10);
    }

    // Fallback: no skipped tests found
    return 0;
  } catch (error) {
    console.error("Error running tests:", error);
    return 0;
  }
}

function checkForTodoTests(): { count: number; files: string[] } {
  try {
    // Search for it.todo() or test.todo() in test files
    const output = execSync(
      'find . -type f \\( -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" \\) ' +
      '-not -path "*/node_modules/*" ' +
      '-exec grep -l "\\(it\\.todo\\|test\\.todo\\)" {} \\; 2>/dev/null || true',
      { encoding: "utf-8" }
    );

    const files = output.trim().split("\n").filter(Boolean);
    return { count: files.length, files };
  } catch (error) {
    return { count: 0, files: [] };
  }
}

function loadBaseline(): Baseline | null {
  try {
    if (!existsSync(BASELINE_FILE)) {
      return null;
    }

    const content = readFileSync(BASELINE_FILE, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Error loading baseline:", error);
    return null;
  }
}

function main() {
  console.log("🔍 Checking skipped tests baseline...\n");

  const skippedCount = getSkippedTestCount();
  const todoTests = checkForTodoTests();
  const baseline = loadBaseline();

  if (!baseline) {
    console.error("❌ FAIL: Baseline file not found");
    console.error(`   Expected: ${BASELINE_FILE}`);
    console.error(`\n   Create baseline with current count (${skippedCount} skipped):`);
    console.error(`   echo '{"skippedCount": ${skippedCount}, "lastUpdated": "${new Date().toISOString()}", "note": "Initial baseline"}' > tools/skipped-tests-baseline.json`);
    process.exit(1);
  }

  console.log(`   Current skipped tests: ${skippedCount}`);
  console.log(`   Baseline:              ${baseline.skippedCount}`);
  console.log(`   TODO tests found:      ${todoTests.count}`);
  console.log(`   Last updated:          ${baseline.lastUpdated}`);

  let failed = false;

  // Check TODO tests (must be zero)
  if (todoTests.count > 0) {
    console.error(`\n❌ FAIL: TODO tests are not allowed (found ${todoTests.count})`);
    console.error(`\n   Files with TODO tests:`);
    for (const file of todoTests.files) {
      console.error(`   - ${file}`);
    }
    console.error(`\n   Please implement or delete TODO tests.`);
    failed = true;
  }

  // Check skipped count
  if (skippedCount > baseline.skippedCount) {
    const increase = skippedCount - baseline.skippedCount;
    console.error(`\n❌ FAIL: Skipped tests increased by ${increase}`);
    console.error(`\n   Current: ${skippedCount}`);
    console.error(`   Baseline: ${baseline.skippedCount}`);
    console.error(`\n   Please implement skipped tests or update baseline if intentional.`);
    failed = true;
  }

  if (failed) {
    process.exit(1);
  }

  if (skippedCount < baseline.skippedCount) {
    const decrease = baseline.skippedCount - skippedCount;
    console.log(`\n✅ IMPROVEMENT: Skipped tests decreased by ${decrease}!`);
    console.log(`   Consider updating the baseline:`);
    console.log(`   echo '{"skippedCount": ${skippedCount}, "lastUpdated": "${new Date().toISOString()}", "note": "Reduced skipped tests"}' > tools/skipped-tests-baseline.json`);
  } else {
    console.log(`\n✅ PASS: Skipped tests within baseline, no TODO tests`);
  }

  process.exit(0);
}

main();

