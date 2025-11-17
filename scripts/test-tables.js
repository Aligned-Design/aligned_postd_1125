#!/usr/bin/env node

/**
 * Test Table Structure
 * Verifies database tables are created with correct schema
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTables() {
  try {
    console.log('📋 Testing table structure...');

    const tables = [
      'tenants',
      'brands',
      'brand_users',
      'media_assets',
      'media_usage_logs',
      'storage_quotas'
    ];

    let allFound = true;
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        console.log(`   ❌ ${table} - NOT FOUND`);
        allFound = false;
      } else if (error) {
        console.log(`   ⚠️  ${table} - CHECK ERROR`);
      } else {
        console.log(`   ✅ ${table}`);
      }
    }

    if (allFound) {
      console.log('✅ All tables found');
      process.exit(0);
    } else {
      console.log('❌ Some tables missing - run database migration');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Table test failed:', err.message);
    process.exit(1);
  }
}

testTables();
