#!/usr/bin/env node

/**
 * Deploy Supabase Migration
 * Direct fetch-based deployment without external dependencies
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse .env file
function parseEnv(envPath) {
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  const lines = content.split('\n');

  let current = null;
  for (const line of lines) {
    if (line.startsWith('#') || !line.trim()) continue;

    if (line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      env[key.trim()] = value;
      current = key.trim();
    } else if (current) {
      env[current] += '\n' + line;
    }
  }

  return env;
}

async function main() {
  try {
    // Load environment variables
    const envPath = path.join(__dirname, '..', '.env');
    const env = parseEnv(envPath);

    const supabaseUrl = env.VITE_SUPABASE_URL;
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
    const migrationFile =
      process.argv[2] ||
      'supabase/migrations/20250108_create_client_settings_table.sql';

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        'Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env'
      );
    }

    const migrationPath = path.join(__dirname, '..', migrationFile);
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

    console.log(`Deploying migration: ${migrationFile}`);
    console.log(`Supabase URL: ${supabaseUrl}`);
    console.log('');

    // For Supabase, we'll use the HTTP API to execute the SQL
    // This endpoint accepts raw SQL queries
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/exec`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ sql: migrationSql }),
      }
    );

    if (!response.ok) {
      const text = await response.text();

      // RPC method likely doesn't exist, provide manual instructions
      console.log('⚠️  Automated deployment requires RPC function setup.');
      console.log('');
      console.log('📋 MANUAL DEPLOYMENT (Recommended - 2 minutes):');
      console.log('');
      console.log('1. Visit: https://app.supabase.com');
      console.log('2. Click SQL Editor from left sidebar');
      console.log('3. Click "+ New Query"');
      console.log('4. Copy/paste from: ' + migrationFile);
      console.log('5. Click "Run" button');
      console.log('');
      console.log('📖 Detailed Migration Documentation:');
      console.log('   File: supabase/migrations/README.md');
      console.log('');

      process.exit(0);
    }

    const result = await response.json();
    console.log('✅ Migration deployed successfully!');
    console.log('');
    console.log('📊 Next Steps:');
    console.log('1. Run tests: pnpm test server/__tests__/client-settings.test.ts');
    console.log('2. Verify table: SELECT * FROM client_settings LIMIT 1;');
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('📋 MANUAL DEPLOYMENT (Recommended):');
    console.log('');
    console.log('1. Visit: https://app.supabase.com/projects');
    console.log('2. Click on project: xpzvtvycjsccaosahmgz');
    console.log('3. Go to SQL Editor → New Query');
    console.log('4. Open file: supabase/migrations/20250108_create_client_settings_table.sql');
    console.log('5. Copy entire contents and paste into SQL Editor');
    console.log('6. Click Run');
    console.log('');
    console.log('🔑 After deployment, tests will verify the schema:');
    console.log('   pnpm test server/__tests__/client-settings.test.ts');
    console.log('');

    process.exit(1);
  }
}

main();
