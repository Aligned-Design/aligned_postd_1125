#!/usr/bin/env tsx
/**
 * Port Check Script
 * 
 * Ensures port 3000 is free before starting dev server.
 * Prevents stale processes from blocking dev startup.
 */

import { execSync } from "child_process";

const PORT = process.env.PORT || 3000;

function checkPort(): { inUse: boolean; pid?: string; command?: string } {
  try {
    // Use lsof to check if port is in use
    const output = execSync(`lsof -ti:${PORT} 2>/dev/null || true`, {
      encoding: "utf-8",
    });

    const pid = output.trim();
    if (!pid) {
      return { inUse: false };
    }

    // Get process details
    try {
      const cmdOutput = execSync(`ps -p ${pid} -o command= 2>/dev/null || true`, {
        encoding: "utf-8",
      });
      return { inUse: true, pid, command: cmdOutput.trim() };
    } catch {
      return { inUse: true, pid };
    }
  } catch (error) {
    // If lsof fails, assume port is free
    return { inUse: false };
  }
}

function main() {
  console.log(`🔍 Checking if port ${PORT} is available...`);

  const result = checkPort();

  if (result.inUse) {
    console.error(`\n❌ ERROR: Port ${PORT} is already in use!`);
    console.error(`   PID: ${result.pid}`);
    if (result.command) {
      console.error(`   Command: ${result.command}`);
    }
    console.error(`\n   To fix this:`);
    console.error(`   1. Kill the process: kill ${result.pid}`);
    console.error(`   2. Or use a different port: PORT=3001 pnpm dev`);
    console.error(``);
    process.exit(1);
  }

  console.log(`✅ Port ${PORT} is free\n`);
  process.exit(0);
}

main();

