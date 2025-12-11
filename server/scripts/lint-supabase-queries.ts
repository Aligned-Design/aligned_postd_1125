#!/usr/bin/env tsx
/**
 * Supabase Query Scope Linter
 * 
 * GUARDRAIL: Prevents accidental unscoped queries on multi-tenant tables.
 * 
 * PURPOSE:
 * - Catch queries that access multi-tenant data without brand/tenant filtering
 * - Prevent future RLS regressions by flagging potential footguns at development time
 * - Run as part of the lint pipeline (warning-level, non-blocking)
 * 
 * WHAT IT CHECKS:
 * - Looks for .from("<multi-tenant table>") calls (14 protected tables)
 * - Verifies the method chain includes brand_id/tenant_id scoping
 * - Reports warnings for unscoped queries
 * 
 * DEVELOPER WORKFLOW:
 * - Run `pnpm lint:supabase` before committing
 * - For known-safe exceptions, add: // @supabase-scope-ok <reason>
 * - For uncertain cases, add: // TODO(rls-review) <question>
 * 
 * MULTI-TENANT TABLES PROTECTED:
 * - brands, brand_members, content_items, media_assets
 * - generation_logs, publishing_jobs, scheduled_content
 * - content_packages, collaboration_logs, weekly_summaries
 * - strategy_briefs, advisor_cache, content_drafts, brand_guide_versions
 * 
 * SCOPE FILTERS RECOGNIZED:
 * - .eq("brand_id", ...) / .eq("tenant_id", ...)
 * - .in("brand_id", ...) / .in("tenant_id", ...)
 * - .match({ brand_id: ... }) / .match({ tenant_id: ... })
 * - .or(...brand_id...) patterns
 * 
 * USAGE:
 *   pnpm lint:supabase       # Run the lint check
 *   pnpm lint:supabase --fix # Not supported (manual review only)
 * 
 * EXIT CODES:
 *   0 - No warnings (or warnings-only mode)
 *   1 - Error mode enabled and unscoped queries found
 * 
 * @see server/tests/supabase_bootstrap_rls.test.ts for RLS enforcement tests
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================

// Tables that require brand/tenant scoping
const MULTI_TENANT_TABLES = [
  'brands',
  'brand_members',
  'content_items',
  'media_assets',
  'generation_logs',
  'publishing_jobs',
  'scheduled_content',
  'content_packages',
  'collaboration_logs',
  'weekly_summaries',
  'strategy_briefs',
  'advisor_cache',
  'content_drafts',
  'brand_guide_versions',
] as const;

// Patterns that indicate the query is properly scoped
const SCOPE_PATTERNS = [
  // Direct filters
  /\.eq\s*\(\s*["']brand_id["']/,
  /\.eq\s*\(\s*["']tenant_id["']/,
  /\.eq\s*\(\s*["']brand_id_uuid["']/,
  /\.in\s*\(\s*["']brand_id["']/,
  /\.in\s*\(\s*["']tenant_id["']/,
  /\.in\s*\(\s*["']brand_id_uuid["']/,
  /\.match\s*\(\s*\{[^}]*brand_id/,
  /\.match\s*\(\s*\{[^}]*tenant_id/,
  /\.or\s*\([^)]*brand_id/,
  /\.or\s*\([^)]*tenant_id/,
  
  // ID-based lookups (implied scoping via primary key)
  /\.eq\s*\(\s*["']id["']/,
  
  // RPC calls (assumed to handle scoping internally)
  /\.rpc\s*\(/,
];

// Comment patterns that indicate intentional bypass
const BYPASS_COMMENTS = [
  /\/\/\s*@supabase-scope-ok/i,
  /\/\/\s*RLS:\s*service.?role/i,
  /\/\/\s*Admin\s+access/i,
  /\/\/\s*Service\s+role/i,
  /\/\*\s*@supabase-scope-ok\s*\*\//i,
];

// Directories to scan
const SCAN_DIRS = [
  'server/lib',
  'server/routes',
];

// File extensions to check
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// ============================================================================
// TYPES
// ============================================================================

interface LintWarning {
  file: string;
  line: number;
  column: number;
  table: string;
  query: string;
  message: string;
}

interface ScanResult {
  warnings: LintWarning[];
  filesScanned: number;
  tablesChecked: string[];
}

// ============================================================================
// CORE LOGIC
// ============================================================================

function findFromCalls(content: string, filePath: string): LintWarning[] {
  const warnings: LintWarning[] = [];
  const lines = content.split('\n');
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const lineNumber = lineIndex + 1;
    
    // Check for .from("<table>") pattern
    const fromMatch = line.match(/\.from\s*\(\s*["']([^"']+)["']\s*\)/);
    if (!fromMatch) continue;
    
    const tableName = fromMatch[1];
    
    // Skip if not a multi-tenant table
    if (!MULTI_TENANT_TABLES.includes(tableName as any)) continue;
    
    // Check if there's a bypass comment on this line or within 5 lines above
    // (comments may be placed before the full statement, not just immediately before .from())
    const hasBypassComment = BYPASS_COMMENTS.some(pattern => {
      if (pattern.test(line)) return true;
      // Check up to 5 lines above to catch comments before multi-line statements
      for (let i = 1; i <= 5 && lineIndex - i >= 0; i++) {
        if (pattern.test(lines[lineIndex - i])) return true;
      }
      return false;
    });
    if (hasBypassComment) continue;
    
    // Extract the full method chain (look ahead up to 20 lines)
    let methodChain = '';
    for (let i = lineIndex; i < Math.min(lineIndex + 20, lines.length); i++) {
      methodChain += lines[i] + '\n';
      // Stop at semicolon, closing brace, or return statement
      if (/[;{}]/.test(lines[i]) && i > lineIndex) break;
      if (/\breturn\b/.test(lines[i]) && i > lineIndex) break;
    }
    
    // Check if the chain has proper scoping
    const hasScope = SCOPE_PATTERNS.some(pattern => pattern.test(methodChain));
    if (hasScope) continue;
    
    // This is an unscoped query - report it
    const column = line.indexOf('.from') + 1;
    const queryPreview = line.trim().substring(0, 80) + (line.length > 80 ? '...' : '');
    
    warnings.push({
      file: filePath,
      line: lineNumber,
      column,
      table: tableName,
      query: queryPreview,
      message: `Supabase query on multi-tenant table "${tableName}" without brand/tenant scoping. ` +
               `Add .eq("brand_id", ...) or similar filter, or add "// @supabase-scope-ok" if intentionally unscoped.`,
    });
  }
  
  return warnings;
}

function scanFile(filePath: string): LintWarning[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return findFromCalls(content, filePath);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

function scanDirectory(dirPath: string): LintWarning[] {
  const warnings: LintWarning[] = [];
  
  if (!fs.existsSync(dirPath)) {
    return warnings;
  }
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules and hidden directories
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      warnings.push(...scanDirectory(fullPath));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (FILE_EXTENSIONS.includes(ext)) {
        warnings.push(...scanFile(fullPath));
      }
    }
  }
  
  return warnings;
}

function formatWarning(warning: LintWarning): string {
  return `  ${warning.file}:${warning.line}:${warning.column}\n` +
         `    ⚠️  ${warning.message}\n` +
         `    Query: ${warning.query}\n`;
}

function run(): ScanResult {
  console.log('🔍 Supabase Query Scope Linter\n');
  console.log('Checking for unscoped queries on multi-tenant tables...\n');
  
  const allWarnings: LintWarning[] = [];
  let filesScanned = 0;
  
  // Get the project root (parent of server directory)
  const projectRoot = path.resolve(__dirname, '../..');
  
  for (const dir of SCAN_DIRS) {
    const fullDir = path.join(projectRoot, dir);
    console.log(`📁 Scanning: ${dir}`);
    const warnings = scanDirectory(fullDir);
    allWarnings.push(...warnings);
    
    // Count files
    const countFiles = (d: string): number => {
      if (!fs.existsSync(d)) return 0;
      let count = 0;
      const entries = fs.readdirSync(d, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          count += countFiles(path.join(d, entry.name));
        } else if (entry.isFile() && FILE_EXTENSIONS.includes(path.extname(entry.name))) {
          count++;
        }
      }
      return count;
    };
    filesScanned += countFiles(fullDir);
  }
  
  console.log('');
  
  if (allWarnings.length === 0) {
    console.log('✅ No unscoped Supabase queries detected!\n');
  } else {
    console.log(`⚠️  Found ${allWarnings.length} unscoped query warning(s):\n`);
    
    // Group by file
    const byFile = new Map<string, LintWarning[]>();
    for (const warning of allWarnings) {
      const existing = byFile.get(warning.file) || [];
      existing.push(warning);
      byFile.set(warning.file, existing);
    }
    
    for (const [file, warnings] of byFile) {
      console.log(`\n${file}:`);
      for (const warning of warnings) {
        console.log(formatWarning(warning));
      }
    }
  }
  
  console.log('─'.repeat(60));
  console.log(`📊 Summary: ${filesScanned} files scanned, ${allWarnings.length} warnings`);
  console.log(`📋 Tables protected: ${MULTI_TENANT_TABLES.join(', ')}`);
  console.log('');
  
  if (allWarnings.length > 0) {
    console.log('💡 To suppress a warning, add one of these comments above the query:');
    console.log('   // @supabase-scope-ok - Query intentionally unscoped');
    console.log('   // RLS: service role - Uses service_role key');
    console.log('   // Admin access - Administrative operation');
    console.log('');
  }
  
  return {
    warnings: allWarnings,
    filesScanned,
    tablesChecked: [...MULTI_TENANT_TABLES],
  };
}

// ============================================================================
// CLI
// ============================================================================

const args = process.argv.slice(2);
const errorMode = args.includes('--error');

const result = run();

// In warning mode (default), always exit 0
// In error mode (--error), exit 1 if warnings found
if (errorMode && result.warnings.length > 0) {
  console.log('❌ Exiting with error (--error flag enabled)\n');
  process.exit(1);
} else {
  if (result.warnings.length > 0) {
    console.log('ℹ️  Warnings are non-blocking. Use --error to fail on warnings.\n');
  }
  process.exit(0);
}

