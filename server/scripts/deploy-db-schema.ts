/**
 * Database Schema Deployment Script
 * Deploys API connector infrastructure schema to Supabase
 *
 * Usage: npx tsx server/scripts/deploy-db-schema.ts
 *
 * Prerequisites:
 * - SUPABASE_ACCESS_TOKEN environment variable set
 * - supabase CLI installed
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface DeploymentResult {
  timestamp: string;
  status: 'success' | 'partial' | 'failed';
  deployed_tables: string[];
  deployed_views: string[];
  deployed_functions: string[];
  errors: string[];
  duration_ms: number;
}

const MIGRATION_FILE = path.join(process.cwd(), 'supabase/migrations/20241111_api_connector_schema.sql');

async function deploySchema(): Promise<DeploymentResult> {
  const startTime = Date.now();
  const result: DeploymentResult = {
    timestamp: new Date().toISOString(),
    status: 'success',
    deployed_tables: [],
    deployed_views: [],
    deployed_functions: [],
    errors: [],
    duration_ms: 0,
  };

  try {
    console.log('🚀 Starting database schema deployment...\n');

    // Check if migration file exists
    if (!fs.existsSync(MIGRATION_FILE)) {
      throw new Error(`Migration file not found: ${MIGRATION_FILE}`);
    }
    console.log(`✓ Migration file found: ${MIGRATION_FILE}\n`);

    // Check Supabase CLI
    console.log('📋 Checking Supabase CLI...');
    try {
      execSync('supabase --version', { stdio: 'pipe' });
      console.log('✓ Supabase CLI available\n');
    } catch (e) {
      throw new Error('Supabase CLI not installed. Run: npm install -g supabase');
    }

    // Check access token
    const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('SUPABASE_ACCESS_TOKEN environment variable not set');
    }
    console.log('✓ Supabase access token configured\n');

    // Push migration using Supabase CLI
    console.log('🔄 Pushing migration to Supabase...');
    try {
      execSync('supabase db push', {
        env: { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken },
        stdio: 'inherit',
      });
      console.log('\n✓ Migration pushed successfully\n');
    } catch (e) {
      result.errors.push(`Migration push failed: ${e}`);
      result.status = 'partial';
      console.error('❌ Migration push failed');
    }

    // Parse migration file to extract table names
    const migrationContent = fs.readFileSync(MIGRATION_FILE, 'utf-8');

    const tableMatches = migrationContent.match(/CREATE TABLE.*?(\w+)\s*\(/gi) || [];
    result.deployed_tables = tableMatches.map(m =>
      m.replace(/CREATE TABLE IF NOT EXISTS\s+/i, '').split(/\s*\(/)[0].trim()
    );

    const viewMatches = migrationContent.match(/CREATE OR REPLACE VIEW\s+(\w+)/gi) || [];
    result.deployed_views = viewMatches.map(m =>
      m.replace(/CREATE OR REPLACE VIEW\s+/i, '').trim()
    );

    const functionMatches = migrationContent.match(/CREATE OR REPLACE FUNCTION\s+(\w+)/gi) || [];
    result.deployed_functions = functionMatches.map(m =>
      m.replace(/CREATE OR REPLACE FUNCTION\s+/i, '').split(/\s*\(/)[0].trim()
    );

    console.log('📊 Deployment Summary:');
    console.log(`  Tables: ${result.deployed_tables.length}`);
    result.deployed_tables.forEach(t => console.log(`    - ${t}`));
    console.log(`\n  Views: ${result.deployed_views.length}`);
    result.deployed_views.forEach(v => console.log(`    - ${v}`));
    console.log(`\n  Functions: ${result.deployed_functions.length}`);
    result.deployed_functions.forEach(f => console.log(`    - ${f}`));

    if (result.errors.length === 0) {
      console.log('\n✅ Database schema deployment successful!');
      result.status = 'success';
    } else {
      console.log('\n⚠️ Deployment completed with warnings:');
      result.errors.forEach(e => console.log(`  - ${e}`));
      result.status = 'partial';
    }

  } catch (error) {
    result.status = 'failed';
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.errors.push(errorMessage);
    console.error(`\n❌ Deployment failed: ${errorMessage}`);
  }

  result.duration_ms = Date.now() - startTime;
  return result;
}

async function saveDeploymentReport(result: DeploymentResult): Promise<void> {
  const reportPath = path.join(process.cwd(), 'logs', 'db-deployment.json');

  // Create logs directory if it doesn't exist
  const logsDir = path.dirname(reportPath);
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
  console.log(`\n📁 Deployment report saved to: ${reportPath}`);
}

async function main(): Promise<void> {
  try {
    const result = await deploySchema();
    await saveDeploymentReport(result);

    const exitCode = result.status === 'success' ? 0 : result.status === 'partial' ? 1 : 2;
    process.exit(exitCode);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(2);
  }
}

main();
