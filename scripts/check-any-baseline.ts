#!/usr/bin/env tsx
/**
 * TypeScript any Baseline Guardrail (Production Code Only)
 * 
 * Prevents regression in TypeScript type safety by blocking increases in any usage.
 * Scans client and server PRODUCTION code only (excludes tests).
 * 
 * Patterns tracked: any type annotations and casts
 * 
 * Excludes test files and scripts from baseline count
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

const BASELINE_FILE = join(process.cwd(), "tools/any-baseline.json");
const SCAN_DIRS = ["client", "server"];

function getCurrentAnyCount(): number {
  try {
    // Count 'any' usage patterns across TypeScript files (production code only)
    // Patterns: : any, as any, <any>, any[]
    const patterns = [
      ": any\\b",
      "as any\\b",
      "<any>",
      "any\\[\\]",
    ];

    let totalCount = 0;

    for (const dir of SCAN_DIRS) {
      if (!existsSync(dir)) {
        continue;
      }

      for (const pattern of patterns) {
        try {
          // Exclude test files from count
          const output = execSync(
            `find ${dir} -type f \\( -name "*.ts" -o -name "*.tsx" \\) ` +
            `-not -path "*/__tests__/*" ` +
            `-not -name "*.test.ts" ` +
            `-not -name "*.test.tsx" ` +
            `-not -name "*.spec.ts" ` +
            `-not -name "*.spec.tsx" ` +
            `-exec grep -o "${pattern}" {} \\; 2>/dev/null | wc -l || echo 0`,
            { encoding: "utf-8" }
          );

          const count = parseInt(output.trim(), 10) || 0;
          totalCount += count;
        } catch (error) {
          // Pattern not found or command failed, continue
        }
      }
    }

    return totalCount;
  } catch (error) {
    console.error("Error counting 'any' usage:", error);
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
  console.log("🔍 Checking TypeScript 'any' usage baseline (production code only)...\n");

  const currentCount = getCurrentAnyCount();
  const baseline = loadBaseline();

  if (!baseline) {
    console.error("❌ FAIL: Baseline file not found");
    console.error(`   Expected: ${BASELINE_FILE}`);
    console.error(`\n   Create baseline with current count (${currentCount}):`);
    console.error(`   echo '{"count": ${currentCount}, "lastUpdated": "${new Date().toISOString()}", "note": "Initial baseline (production code only)"}' > tools/any-baseline.json`);
    process.exit(1);
  }

  console.log(`   Current 'any' count: ${currentCount}`);
  console.log(`   Baseline count:      ${baseline.count}`);
  console.log(`   Scope:               Production code (excludes tests)`);
  console.log(`   Last updated:        ${baseline.lastUpdated}`);

  if (currentCount > baseline.count) {
    const increase = currentCount - baseline.count;
    console.error(`\n❌ FAIL: 'any' usage increased by ${increase}`);
    console.error(`\n   Current: ${currentCount}`);
    console.error(`   Baseline: ${baseline.count}`);
    console.error(`\n   Please remove 'any' types or update baseline if intentional.`);
    console.error(`   To see where 'any' is used in production code, run:`);
    console.error(`   find client server -name "*.ts*" -not -path "*/__tests__/*" -not -name "*.test.*" -not -name "*.spec.*" -exec grep -n "\\b(: any\\b|as any\\b)" {} +`);
    process.exit(1);
  }

  if (currentCount < baseline.count) {
    const decrease = baseline.count - currentCount;
    console.log(`\n✅ IMPROVEMENT: 'any' usage decreased by ${decrease}!`);
    console.log(`   Consider updating the baseline:`);
    console.log(`   echo '{"count": ${currentCount}, "lastUpdated": "${new Date().toISOString()}", "note": "Reduced any usage in production"}' > tools/any-baseline.json`);
  } else {
    console.log(`\n✅ PASS: 'any' usage within baseline`);
  }

  process.exit(0);
}

main();

