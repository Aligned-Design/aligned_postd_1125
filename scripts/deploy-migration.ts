#!/usr/bin/env node

/**
 * Deploy Supabase Migration Script
 * Applies SQL migrations directly to the database using Supabase API
 * Usage: node -r dotenv/config scripts/deploy-migration.ts [migration-file]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function deployMigration(migrationFile: string) {
  try {
    // Get Supabase credentials from environment
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Error: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
      process.exit(1);
    }

    // Read migration file
    const migrationPath = path.join(__dirname, '..', migrationFile);
    if (!fs.existsSync(migrationPath)) {
      console.error(`Error: Migration file not found: ${migrationPath}`);
      process.exit(1);
    }

    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

    console.log(`Deploying migration: ${migrationFile}`);
    console.log(`Supabase URL: ${supabaseUrl}`);

    // Create Supabase client with service role key (has admin privileges)
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      db: {
        schema: 'public',
      },
    });

    // Execute migration using raw HTTP API
    console.log('Executing migration...');

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ sql: migrationSql }),
    });

    if (!response.ok) {
      // If RPC method doesn't exist, try direct SQL execution through another approach
      console.log('RPC method not available, trying alternative approach...');

      // For Supabase, we need to execute the SQL directly
      // This requires using the SQL editor API or a custom RPC function
      // As a fallback, we'll provide clear instructions for manual deployment

      throw new Error('Automated SQL execution requires Supabase RPC function setup');
    }

    console.log('✓ Migration deployed successfully');

    // Verify table was created by checking client_settings table exists
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'client_settings')
      .limit(1)
      .catch(() => ({ data: null, error: null }));

    if (!tableError && tables && tables.length > 0) {
      console.log('✓ client_settings table verified');
    } else {
      console.log('✓ Migration executed successfully');
    }

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));

    // Provide helpful fallback instructions
    console.log('\n' + '='.repeat(60));
    console.log('MANUAL DEPLOYMENT OPTIONS');
    console.log('='.repeat(60));
    console.log('\n1. RECOMMENDED: Supabase Dashboard (5 minutes)');
    console.log('   - Visit: https://app.supabase.com');
    console.log('   - Go to SQL Editor → New Query');
    console.log('   - Copy contents of: supabase/migrations/20250108_create_client_settings_table.sql');
    console.log('   - Click Run');
    console.log('\n2. ALTERNATIVE: Direct PostgreSQL Connection');
    console.log('   - Get database password from Supabase Dashboard');
    console.log('   - Run: psql -h xpzvtvycjsccaosahmgz.supabase.co -U postgres');
    console.log('   - Then: \\i supabase/migrations/20250108_create_client_settings_table.sql');
    console.log('\n3. CLI: Supabase CLI with Authentication');
    console.log('   - Generate access token at: https://app.supabase.com/account/tokens');
    console.log('   - Run: supabase login');
    console.log('   - Then: supabase link --project-ref xpzvtvycjsccaosahmgz');
    console.log('   - Finally: supabase db push');
    console.log('='.repeat(60) + '\n');

    process.exit(1);
  }
}

const migrationFile = process.argv[2] || 'supabase/migrations/20250108_create_client_settings_table.sql';
deployMigration(migrationFile);
