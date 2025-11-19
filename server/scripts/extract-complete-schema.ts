#!/usr/bin/env tsx
/**
 * SCHEMA EXTRACTION AGENT
 * 
 * Scans the entire repository and extracts all information related to database schema:
 * - SQL migrations (CREATE TABLE, ALTER TABLE statements)
 * - TypeScript interfaces and types
 * - Runtime code that accesses columns
 * - Zod schemas and validation
 * 
 * Produces a consolidated report showing what the system expects for each table.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface ColumnInfo {
  name: string;
  type: string;
  nullable?: boolean;
  default?: string;
  source: string; // Which file this was found in
}

interface TableInfo {
  tableName: string;
  sqlColumns: ColumnInfo[];
  tsTypes: string[];
  codeReferences: string[];
  mismatches: string[];
}

const ROOT_DIR = process.cwd();
const MIGRATION_DIRS = [
  'server/migrations',
  'supabase/migrations',
];

const CODE_DIRS = [
  'server/lib',
  'server/routes',
  'server/types',
  'shared',
  'client/types',
  'client/lib',
];

const tables = new Map<string, TableInfo>();

/**
 * Extract CREATE TABLE and ALTER TABLE statements from SQL files
 */
function extractSQLSchema() {
  console.log('📂 Scanning SQL migrations...');
  
  for (const dir of MIGRATION_DIRS) {
    const dirPath = path.join(ROOT_DIR, dir);
    if (!fs.existsSync(dirPath)) continue;
    
    const files = fs.readdirSync(dirPath)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Extract CREATE TABLE statements
      const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)\s*\(([\s\S]*?)\);/gi;
      let match;
      
      while ((match = createTableRegex.exec(content)) !== null) {
        const tableName = match[1].toLowerCase();
        const columnsDef = match[2];
        
        if (!tables.has(tableName)) {
          tables.set(tableName, {
            tableName,
            sqlColumns: [],
            tsTypes: [],
            codeReferences: [],
            mismatches: [],
          });
        }
        
        const table = tables.get(tableName)!;
        
        // Parse columns
        const lines = columnsDef.split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.startsWith('--') && !l.startsWith('CONSTRAINT') && !l.startsWith('UNIQUE') && !l.startsWith('FOREIGN') && !l.startsWith('CHECK'));
        
        for (const line of lines) {
          if (line.startsWith('PRIMARY KEY') || line.startsWith('REFERENCES')) continue;
          
          const columnMatch = line.match(/^(\w+)\s+([A-Z][A-Z0-9\[\]()]*(?:\s+[A-Z][A-Z0-9]*)*)/i);
          if (columnMatch) {
            const colName = columnMatch[1];
            let colType = columnMatch[2].trim();
            
            // Extract NOT NULL, DEFAULT
            const notNull = line.includes('NOT NULL');
            const defaultMatch = line.match(/DEFAULT\s+([^,]+)/i);
            const defaultValue = defaultMatch ? defaultMatch[1].trim() : undefined;
            
            // Clean up type
            colType = colType.replace(/,.*$/, '').trim();
            
            table.sqlColumns.push({
              name: colName,
              type: colType,
              nullable: !notNull,
              default: defaultValue,
              source: `${dir}/${file}`,
            });
          }
        }
      }
      
      // Extract ALTER TABLE ... ADD COLUMN statements
      const alterTableRegex = /ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:public\.)?(\w+)\s+ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s+([^,;]+)/gi;
      
      while ((match = alterTableRegex.exec(content)) !== null) {
        const tableName = match[1].toLowerCase();
        const colName = match[2];
        let colDef = match[3].trim();
        
        if (!tables.has(tableName)) {
          tables.set(tableName, {
            tableName,
            sqlColumns: [],
            tsTypes: [],
            codeReferences: [],
            mismatches: [],
          });
        }
        
        const table = tables.get(tableName)!;
        
        // Extract type, NOT NULL, DEFAULT
        const typeMatch = colDef.match(/^([A-Z][A-Z0-9\[\]()]*(?:\s+[A-Z][A-Z0-9]*)*)/i);
        const colType = typeMatch ? typeMatch[1].trim() : 'UNKNOWN';
        const notNull = colDef.includes('NOT NULL');
        const defaultMatch = colDef.match(/DEFAULT\s+([^,]+)/i);
        const defaultValue = defaultMatch ? defaultMatch[1].trim().replace(/,$/, '') : undefined;
        
        // Check if column already exists in our list
        const existingCol = table.sqlColumns.find(c => c.name === colName);
        if (!existingCol) {
          table.sqlColumns.push({
            name: colName,
            type: colType,
            nullable: !notNull,
            default: defaultValue,
            source: `${dir}/${file}`,
          });
        }
      }
    }
  }
  
  console.log(`✅ Found ${tables.size} tables in SQL migrations`);
}

/**
 * Extract TypeScript interfaces and types
 */
function extractTypeScriptTypes() {
  console.log('📂 Scanning TypeScript types...');
  
  for (const dir of CODE_DIRS) {
    const dirPath = path.join(ROOT_DIR, dir);
    if (!fs.existsSync(dirPath)) continue;
    
    // Use grep to find interface/type definitions
    try {
      const result = execSync(
        `grep -r "interface.*Record\\|interface.*Response\\|interface.*Request\\|type.*Record" ${dirPath} --include="*.ts" --include="*.tsx" || true`,
        { encoding: 'utf-8', cwd: ROOT_DIR }
      );
      
      const lines = result.split('\n').filter(Boolean);
      
      for (const line of lines) {
        const [filePath, ...rest] = line.split(':');
        const typeDef = rest.join(':').trim();
        
        // Try to match to a table
        for (const [tableName, table] of tables.entries()) {
          const pattern = new RegExp(tableName.replace('_', ''), 'i');
          if (pattern.test(typeDef) || typeDef.toLowerCase().includes(tableName.replace('_', ''))) {
            table.tsTypes.push(`${typeDef} (${filePath})`);
          }
        }
      }
    } catch (error) {
      // Ignore grep errors
    }
  }
  
  console.log('✅ Extracted TypeScript types');
}

/**
 * Find code references to columns
 */
function extractCodeReferences() {
  console.log('📂 Scanning code for column references...');
  
  const criticalTables = [
    'brands',
    'brand_members',
    'media_assets',
    'storage_quotas',
    'content_items',
    'scheduled_content',
    'analytics_metrics',
    'milestones',
  ];
  
  for (const tableName of criticalTables) {
    if (!tables.has(tableName)) continue;
    
    const table = tables.get(tableName)!;
    const columns = table.sqlColumns.map(c => c.name);
    
    // Search for column references in code
    for (const col of columns) {
      try {
        // Search for this column in TypeScript code
        const result = execSync(
          `grep -r "${col}" server/ client/ shared/ --include="*.ts" --include="*.tsx" | head -10 || true`,
          { encoding: 'utf-8', cwd: ROOT_DIR }
        );
        
        const lines = result.split('\n').filter(Boolean);
        if (lines.length > 0) {
          table.codeReferences.push(`${col}: found in ${lines.length} locations`);
          
          // Sample one reference
          if (lines[0]) {
            const [filePath] = lines[0].split(':');
            table.codeReferences.push(`  → ${filePath.replace(ROOT_DIR + '/', '')}`);
          }
        }
      } catch (error) {
        // Ignore grep errors
      }
    }
  }
  
  console.log('✅ Extracted code references');
}

/**
 * Identify mismatches between SQL and code expectations
 */
function identifyMismatches() {
  console.log('📂 Identifying mismatches...');
  
  // For brands table specifically, check for known expected columns
  const brandsTable = tables.get('brands');
  if (brandsTable) {
    const expectedColumns = [
      'id', 'name', 'slug', 'tenant_id', 'workspace_id', 'created_by',
      'website_url', 'industry', 'description', 'logo_url', 'primary_color',
      'brand_kit', 'voice_summary', 'visual_summary', 'tone_keywords',
      'compliance_rules', 'intake_completed', 'intake_completed_at',
      'scraped_at', 'scraper_status', 'created_at', 'updated_at'
    ];
    
    const actualColumns = brandsTable.sqlColumns.map(c => c.name);
    
    for (const expected of expectedColumns) {
      if (!actualColumns.includes(expected)) {
        brandsTable.mismatches.push(`❌ Expected column missing: ${expected}`);
      }
    }
  }
  
  // For media_assets, check for size_bytes vs file_size
  const mediaTable = tables.get('media_assets');
  if (mediaTable) {
    const hasFileSize = mediaTable.sqlColumns.some(c => c.name === 'file_size');
    const hasSizeBytes = mediaTable.sqlColumns.some(c => c.name === 'size_bytes');
    
    if (hasFileSize && !hasSizeBytes) {
      mediaTable.mismatches.push('❌ Code expects size_bytes but schema has file_size');
    } else if (hasSizeBytes && !hasFileSize) {
      mediaTable.mismatches.push('✅ Correct: size_bytes exists (not file_size)');
    }
  }
  
  // For content_items, check for content vs body
  const contentTable = tables.get('content_items');
  if (contentTable) {
    const hasBody = contentTable.sqlColumns.some(c => c.name === 'body');
    const hasContent = contentTable.sqlColumns.some(c => c.name === 'content');
    
    if (hasBody && !hasContent) {
      contentTable.mismatches.push('❌ Code expects content (JSONB) but schema has body');
    } else if (hasContent && !hasBody) {
      contentTable.mismatches.push('✅ Correct: content (JSONB) exists');
    }
  }
  
  console.log('✅ Identified mismatches');
}

/**
 * Generate the final report
 */
function generateReport() {
  console.log('\n📝 Generating report...\n');
  
  let report = '# SCHEMA EXTRACTION REPORT (AUTO-GENERATED)\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `Total tables found: ${tables.size}\n\n`;
  report += '---\n\n';
  
  // Sort tables by importance (critical tables first)
  const criticalTables = [
    'brands',
    'brand_members',
    'media_assets',
    'storage_quotas',
    'content_items',
    'scheduled_content',
    'analytics_metrics',
    'milestones',
  ];
  
  const sortedTables = Array.from(tables.entries()).sort(([a], [b]) => {
    const aIndex = criticalTables.indexOf(a);
    const bIndex = criticalTables.indexOf(b);
    
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });
  
  for (const [tableName, table] of sortedTables) {
    report += `## TABLE: ${tableName}\n\n`;
    
    // SQL Columns
    report += `### Columns found in SQL migrations (${table.sqlColumns.length} total):\n\n`;
    
    if (table.sqlColumns.length === 0) {
      report += '_No columns found in migrations (table may be created elsewhere)_\n\n';
    } else {
      // Group by source file for clarity
      const columnsBySource = new Map<string, ColumnInfo[]>();
      for (const col of table.sqlColumns) {
        if (!columnsBySource.has(col.source)) {
          columnsBySource.set(col.source, []);
        }
        columnsBySource.get(col.source)!.push(col);
      }
      
      // List all unique columns (latest definition wins)
      const uniqueColumns = new Map<string, ColumnInfo>();
      for (const col of table.sqlColumns) {
        uniqueColumns.set(col.name, col); // Later definitions overwrite earlier ones
      }
      
      for (const [colName, col] of uniqueColumns.entries()) {
        const nullable = col.nullable ? 'NULL' : 'NOT NULL';
        const defaultStr = col.default ? ` DEFAULT ${col.default}` : '';
        report += `- **${colName}**: ${col.type} ${nullable}${defaultStr}\n`;
        report += `  - Source: ${col.source}\n`;
      }
      report += '\n';
    }
    
    // TypeScript Types
    report += `### TypeScript type definitions (${table.tsTypes.length} found):\n\n`;
    
    if (table.tsTypes.length === 0) {
      report += '_No TypeScript types found matching this table_\n\n';
    } else {
      for (const tsType of table.tsTypes.slice(0, 5)) {
        report += `- ${tsType}\n`;
      }
      if (table.tsTypes.length > 5) {
        report += `- _... and ${table.tsTypes.length - 5} more_\n`;
      }
      report += '\n';
    }
    
    // Code References
    report += `### Code references (${table.codeReferences.length} found):\n\n`;
    
    if (table.codeReferences.length === 0) {
      report += '_No code references found (table may not be used yet)_\n\n';
    } else {
      for (const ref of table.codeReferences.slice(0, 10)) {
        report += `- ${ref}\n`;
      }
      if (table.codeReferences.length > 10) {
        report += `- _... and ${table.codeReferences.length - 10} more_\n`;
      }
      report += '\n';
    }
    
    // Mismatches
    if (table.mismatches.length > 0) {
      report += `### ⚠️ Mismatches and issues:\n\n`;
      for (const mismatch of table.mismatches) {
        report += `${mismatch}\n`;
      }
      report += '\n';
    }
    
    report += '---\n\n';
  }
  
  // Write report
  const reportPath = path.join(ROOT_DIR, 'SCHEMA_EXTRACTION_REPORT.md');
  fs.writeFileSync(reportPath, report, 'utf-8');
  
  console.log(`✅ Report written to: SCHEMA_EXTRACTION_REPORT.md`);
  console.log(`\n📊 Summary:`);
  console.log(`   - Tables: ${tables.size}`);
  console.log(`   - Critical tables validated: ${criticalTables.filter(t => tables.has(t)).length}`);
  
  return reportPath;
}

/**
 * Main execution
 */
async function main() {
  console.log('🤖 SCHEMA EXTRACTION AGENT\n');
  console.log('Scanning repository for database schema information...\n');
  
  extractSQLSchema();
  extractTypeScriptTypes();
  extractCodeReferences();
  identifyMismatches();
  
  const reportPath = generateReport();
  
  console.log('\n✅ Schema extraction complete!');
  console.log(`\nTo view the report: cat ${reportPath}`);
}

main().catch((error) => {
  console.error('❌ Schema extraction failed:');
  console.error(error);
  process.exit(1);
});

