#!/usr/bin/env tsx
/**
 * Environment Security Audit Script
 * 
 * Checks for:
 * - .env files tracked in git
 * - Hardcoded secrets in code
 * - Missing .env.example entries
 * - Exposed credentials in documentation
 */

import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";

const SECRET_PATTERNS = [
  // API Keys
  /sk-[a-zA-Z0-9]{20,}/g, // OpenAI
  /xoxb-[a-zA-Z0-9-]+/g, // Slack
  /ghp_[a-zA-Z0-9]{36}/g, // GitHub
  /AIza[0-9A-Za-z-_]{35}/g, // Google
  /AKIA[0-9A-Z]{16}/g, // AWS Access Key
  /[0-9a-zA-Z/+]{40}/g, // Generic base64 (potential secret)
  
  // OAuth Secrets
  /client_secret['":\s]*=[\s]*['"][^'"]{20,}['"]/gi,
  /CLIENT_SECRET['":\s]*=[\s]*['"][^'"]{20,}['"]/gi,
  
  // Database URLs with passwords
  /postgres:\/\/[^:]+:[^@]+@/g,
  /mongodb:\/\/[^:]+:[^@]+@/g,
  /mysql:\/\/[^:]+:[^@]+@/g,
  
  // JWT Secrets
  /JWT_SECRET['":\s]*=[\s]*['"][^'"]{20,}['"]/gi,
  /SECRET_KEY['":\s]*=[\s]*['"][^'"]{20,}['"]/gi,
];

const IGNORE_PATTERNS = [
  /\.env\.example/,
  /node_modules/,
  /\.git/,
  /dist/,
  /build/,
  /\.next/,
  /coverage/,
  /\.test\./,
  /\.spec\./,
  /YOUR_.*_HERE/,
  /placeholder/,
  /example/,
];

interface SecurityIssue {
  file: string;
  line: number;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

const issues: SecurityIssue[] = [];

function checkGitTrackedEnvFiles() {
  console.log("\n📋 Checking for .env files tracked in git...");
  try {
    const tracked = execSync("git ls-files | grep -E '\\.env$|\\.env\\.local$'", {
      encoding: "utf-8",
      stdio: "pipe",
    }).trim();
    
    if (tracked) {
      tracked.split("\n").forEach((file) => {
        issues.push({
          file,
          line: 0,
          type: "git-tracked-env",
          severity: "critical",
          message: ".env file is tracked in git - REMOVE IMMEDIATELY",
        });
      });
      console.log("❌ Found .env files tracked in git!");
    } else {
      console.log("✅ No .env files tracked in git");
    }
  } catch (error: any) {
    if (error.status === 1) {
      console.log("✅ No .env files tracked in git");
    } else {
      console.warn("⚠️  Could not check git:", error.message);
    }
  }
}

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);
  files.forEach((file) => {
    const filePath = join(dir, file);
    try {
      const stat = statSync(filePath);
      if (stat.isDirectory()) {
        if (!file.includes("node_modules") && !file.includes("dist") && !file.includes(".next") && !file.includes(".git")) {
          getAllFiles(filePath, fileList);
        }
      } else if (stat.isFile()) {
        if (file.endsWith(".ts") || file.endsWith(".tsx") || file.endsWith(".js") || file.endsWith(".jsx") || file.endsWith(".md") || file.endsWith(".json")) {
          fileList.push(filePath);
        }
      }
    } catch {
      // Skip files that can't be accessed
    }
  });
  return fileList;
}

function checkHardcodedSecrets() {
  console.log("\n🔍 Scanning for hardcoded secrets...");
  
  const filesToCheck: string[] = [];
  ["server", "client", "."].forEach((dir) => {
    if (existsSync(dir)) {
      getAllFiles(dir, filesToCheck);
    }
  });

  let checkedFiles = 0;
  let foundSecrets = 0;

  for (const file of filesToCheck) {
    if (IGNORE_PATTERNS.some((pattern) => pattern.test(file))) {
      continue;
    }

    try {
      const content = readFileSync(file, "utf-8");
      const lines = content.split("\n");
      
      lines.forEach((line, index) => {
        for (const pattern of SECRET_PATTERNS) {
          const matches = line.match(pattern);
          if (matches) {
            // Check if it's a placeholder
            if (line.includes("YOUR_") || line.includes("placeholder") || line.includes("example")) {
              continue;
            }
            
            foundSecrets++;
            issues.push({
              file,
              line: index + 1,
              type: "hardcoded-secret",
              severity: "critical",
              message: `Potential secret found: ${matches[0].substring(0, 20)}...`,
            });
          }
        }
      });
      
      checkedFiles++;
    } catch (error) {
      // Skip files that can't be read
    }
  }

  if (foundSecrets > 0) {
    console.log(`❌ Found ${foundSecrets} potential secrets in ${checkedFiles} files`);
  } else {
    console.log(`✅ No hardcoded secrets found (checked ${checkedFiles} files)`);
  }
}

function checkEnvExample() {
  console.log("\n📝 Checking .env.example...");
  
  if (!existsSync(".env.example")) {
    issues.push({
      file: ".env.example",
      line: 0,
      type: "missing-env-example",
      severity: "medium",
      message: ".env.example file is missing",
    });
    console.log("❌ .env.example file is missing");
    return;
  }

  const content = readFileSync(".env.example", "utf-8");
  
  // Check for real secrets (not placeholders)
  const hasRealSecrets = SECRET_PATTERNS.some((pattern) => {
    const matches = content.match(pattern);
    return matches && !matches.some((m) => 
      m.includes("YOUR_") || m.includes("placeholder") || m.includes("example")
    );
  });

  if (hasRealSecrets) {
    issues.push({
      file: ".env.example",
      line: 0,
      type: "real-secrets-in-example",
      severity: "critical",
      message: ".env.example contains real secrets (should only have placeholders)",
    });
    console.log("❌ .env.example contains real secrets!");
  } else {
    console.log("✅ .env.example looks safe (only placeholders)");
  }
}

function checkGitignore() {
  console.log("\n🔒 Checking .gitignore...");
  
  if (!existsSync(".gitignore")) {
    issues.push({
      file: ".gitignore",
      line: 0,
      type: "missing-gitignore",
      severity: "critical",
      message: ".gitignore file is missing",
    });
    console.log("❌ .gitignore file is missing");
    return;
  }

  const content = readFileSync(".gitignore", "utf-8");
  
  const requiredPatterns = [
    /\.env$/,
    /\.env\.local$/,
    /\.env\.\*\.local$/,
  ];

  const missing = requiredPatterns.filter((pattern) => !pattern.test(content));

  if (missing.length > 0) {
    issues.push({
      file: ".gitignore",
      line: 0,
      type: "incomplete-gitignore",
      severity: "high",
      message: ".gitignore missing required .env patterns",
    });
    console.log("❌ .gitignore missing some .env patterns");
  } else {
    console.log("✅ .gitignore properly excludes .env files");
  }
}

function checkDocumentation() {
  console.log("\n📚 Checking documentation for exposed secrets...");
  
  const docFiles: string[] = [];
  if (existsSync(".")) {
    getAllFiles(".", docFiles);
  }
  const mdFiles = docFiles.filter(f => f.endsWith(".md") && !f.includes("node_modules"));
  let foundInDocs = 0;

  for (const file of mdFiles) {
    try {
      const content = readFileSync(file, "utf-8");
      
      for (const pattern of SECRET_PATTERNS) {
        const matches = content.match(pattern);
        if (matches && !file.includes("CREDENTIALS") && !file.includes("SETUP")) {
          // Check if it's a placeholder
          const context = content.substring(
            Math.max(0, content.indexOf(matches[0]) - 50),
            content.indexOf(matches[0]) + 100
          );
          
          if (!context.includes("YOUR_") && !context.includes("placeholder") && !context.includes("example") && !context.includes("mock")) {
            foundInDocs++;
            issues.push({
              file,
              line: 0,
              type: "secret-in-docs",
              severity: "high",
              message: `Potential secret found in documentation: ${matches[0].substring(0, 20)}...`,
            });
          }
        }
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }

  if (foundInDocs > 0) {
    console.log(`❌ Found ${foundInDocs} potential secrets in documentation`);
  } else {
    console.log("✅ Documentation looks safe");
  }
}

function generateReport() {
  console.log("\n" + "=".repeat(60));
  console.log("ENVIRONMENT SECURITY AUDIT REPORT");
  console.log("=".repeat(60));

  const critical = issues.filter((i) => i.severity === "critical");
  const high = issues.filter((i) => i.severity === "high");
  const medium = issues.filter((i) => i.severity === "medium");
  const low = issues.filter((i) => i.severity === "low");

  console.log(`\n📊 Summary:`);
  console.log(`   Critical: ${critical.length}`);
  console.log(`   High: ${high.length}`);
  console.log(`   Medium: ${medium.length}`);
  console.log(`   Low: ${low.length}`);

  if (critical.length > 0) {
    console.log(`\n🚨 CRITICAL ISSUES:`);
    critical.forEach((issue) => {
      console.log(`   ❌ ${issue.file}:${issue.line} - ${issue.message}`);
    });
  }

  if (high.length > 0) {
    console.log(`\n⚠️  HIGH PRIORITY ISSUES:`);
    high.forEach((issue) => {
      console.log(`   ⚠️  ${issue.file}:${issue.line} - ${issue.message}`);
    });
  }

  if (medium.length > 0) {
    console.log(`\nℹ️  MEDIUM PRIORITY ISSUES:`);
    medium.forEach((issue) => {
      console.log(`   ℹ️  ${issue.file}:${issue.line} - ${issue.message}`);
    });
  }

  console.log("\n" + "=".repeat(60));

  if (critical.length === 0 && high.length === 0) {
    console.log("✅ Environment security audit PASSED");
    console.log("=".repeat(60) + "\n");
    process.exit(0);
  } else {
    console.log("❌ Environment security audit FAILED");
    console.log("=".repeat(60) + "\n");
    console.log("🔧 Recommended Actions:");
    console.log("   1. Remove any .env files from git: git rm --cached .env");
    console.log("   2. Remove hardcoded secrets from code");
    console.log("   3. Rotate any exposed credentials");
    console.log("   4. Update .env.example with placeholders only");
    console.log("   5. Review documentation for exposed secrets\n");
    process.exit(1);
  }
}

// Run audit
console.log("🔒 Starting Environment Security Audit...\n");

checkGitTrackedEnvFiles();
checkHardcodedSecrets();
checkEnvExample();
checkGitignore();
checkDocumentation();
generateReport();

