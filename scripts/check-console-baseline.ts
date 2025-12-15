#!/usr/bin/env tsx
/**
 * Console Usage Baseline Guardrail
 * 
 * Prevents regression in production code quality by blocking increases in console usage.
 * Scans server/routes for:
 * - console.log
 * - console.warn
 * - console.error
 * - console.info
 * - console.debug
 * 
 * Excludes: test files
 * 
 * Fails CI if current count exceeds baseline.
 */

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

interface Baseline {
  count: number;
  lastUpdated: string;
  note: string;
}

const BASELINE_FILE = join(process.cwd(), "tools/console-baseline.json");
const SCAN_DIR = "server/routes";
const EXCLUDE_PATTERNS = ["__tests__", "*.test.ts", "*.spec.ts"];

function getCurrentConsoleCount(): number {
  try {
    if (!existsSync(SCAN_DIR)) {
      return 0;
    }

    // Count console.* usage in production routes
    const excludeArgs = EXCLUDE_PATTERNS.map(p => `-not -path "*/${p}/*"`).join(" ");
    
    const patterns = [
      "console\\.log",
      "console\\.warn",
      "console\\.error",
      "console\\.info",
      "console\\.debug",
    ];

    let totalCount = 0;

    for (const pattern of patterns) {
      try {
        const output = execSync(
          `find ${SCAN_DIR} -type f -name "*.ts" ${excludeArgs} -exec grep -o "${pattern}" {} \\; 2>/dev/null | wc -l || echo 0`,
          { encoding: "utf-8" }
        );

        const count = parseInt(output.trim(), 10) || 0;
        totalCount += count;
      } catch (error) {
        // Pattern not found or command failed, continue
      }
    }

    return totalCount;
  } catch (error) {
    console.error("Error counting console usage:", error);
    return 0;
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
  console.log("🔍 Checking console usage baseline in production routes...\n");

  const currentCount = getCurrentConsoleCount();
  const baseline = loadBaseline();

  if (!baseline) {
    console.error("❌ FAIL: Baseline file not found");
    console.error(`   Expected: ${BASELINE_FILE}`);
    console.error(`\n   Create baseline with current count (${currentCount}):`);
    console.error(`   echo '{"count": ${currentCount}, "lastUpdated": "${new Date().toISOString()}", "note": "Initial baseline"}' > tools/console-baseline.json`);
    process.exit(1);
  }

  console.log(`   Current console count: ${currentCount}`);
  console.log(`   Baseline count:        ${baseline.count}`);
  console.log(`   Last updated:          ${baseline.lastUpdated}`);
  console.log(`   Scope:                 ${SCAN_DIR}`);

  if (currentCount > baseline.count) {
    const increase = currentCount - baseline.count;
    console.error(`\n❌ FAIL: Console usage increased by ${increase}`);
    console.error(`\n   Current: ${currentCount}`);
    console.error(`   Baseline: ${baseline.count}`);
    console.error(`\n   Please use logger instead of console in production routes.`);
    console.error(`   To see where console is used, run:`);
    console.error(`   find ${SCAN_DIR} -name "*.ts" -not -path "*/__tests__/*" -exec grep -n "console\\." {} +`);
    process.exit(1);
  }

  if (currentCount < baseline.count) {
    const decrease = baseline.count - currentCount;
    console.log(`\n✅ IMPROVEMENT: Console usage decreased by ${decrease}!`);
    console.log(`   Consider updating the baseline:`);
    console.log(`   echo '{"count": ${currentCount}, "lastUpdated": "${new Date().toISOString()}", "note": "Reduced console usage"}' > tools/console-baseline.json`);
  } else {
    console.log(`\n✅ PASS: Console usage within baseline`);
  }

  process.exit(0);
}

main();

