#!/usr/bin/env node

/**
 * Test Brand System
 * Verifies brands and brand_users tables are configured
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBrandSystem() {
  try {
    console.log('🏢 Testing brand system...');

    // Check brands table
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('count')
      .limit(1);

    if (brandsError && brandsError.code === 'PGRST116') {
      console.log('❌ brands table not found');
      console.log('   Run: pnpm run test:auth-setup');
      process.exit(1);
    }

    // Check brand_users table
    const { data: brandUsers, error: usersError } = await supabase
      .from('brand_users')
      .select('count')
      .limit(1);

    if (usersError && usersError.code === 'PGRST116') {
      console.log('❌ brand_users table not found');
      console.log('   Run: pnpm run test:auth-setup');
      process.exit(1);
    }

    console.log('✅ Brand system configured');
    console.log('   brands table: OK');
    console.log('   brand_users table: OK');
    process.exit(0);
  } catch (err) {
    console.error('❌ Brand test failed:', err.message);
    process.exit(1);
  }
}

testBrandSystem();
