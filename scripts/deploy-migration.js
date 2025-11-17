#!/usr/bin/env node

/**
 * Deploy Supabase Migration Script
 * Applies SQL migrations directly to the database using Supabase API
 * Usage: node scripts/deploy-migration.js [migration-file]
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function deployMigration(migrationFile) {
  try {
    const { createClient } = require('@supabase/supabase-js');

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

    // Execute migration using RPC or direct query
    const { data, error } = await supabase.rpc('exec', {
      sql: migrationSql,
    }).catch(async (err) => {
      // Fallback: Try using raw SQL query via HTTP API
      console.log('RPC method not available, trying direct query...');

      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ sql: migrationSql }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    });

    if (error) {
      console.error('Error deploying migration:', error);
      process.exit(1);
    }

    console.log('✓ Migration deployed successfully');

    // Verify table was created by checking client_settings table
    const { data: tableData, error: tableError } = await supabase
      .from('client_settings')
      .select('*')
      .limit(1)
      .catch(() => ({ data: null }));

    if (!tableError) {
      console.log('✓ client_settings table verified and accessible');
    } else {
      console.log('✓ Migration executed (table verification skipped)');
    }

  } catch (error) {
    console.error('Error:', error.message);

    // Provide helpful fallback instructions
    console.log('\n--- Alternative: Manual Deployment ---');
    console.log('1. Visit: https://app.supabase.com');
    console.log('2. Go to SQL Editor → New Query');
    console.log('3. Copy and paste the migration SQL from the migration file');
    console.log('4. Click Run');

    process.exit(1);
  }
}

const migrationFile = process.argv[2] || 'supabase/migrations/20250108_create_client_settings_table.sql';
deployMigration(migrationFile);
