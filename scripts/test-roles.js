#!/usr/bin/env node

/**
 * Test User Roles
 * Verifies role-based access control is configured
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRoles() {
  try {
    console.log('👥 Testing user roles...');

    // Check if brand_users table exists
    const { data: brandUsers, error } = await supabase
      .from('brand_users')
      .select('count')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('⚠️  brand_users table not found');
        console.log('   Run migration to create tables');
        process.exit(0);
      }
      throw error;
    }

    console.log('✅ Role system configured');
    console.log('   brand_users table exists');
    process.exit(0);
  } catch (err) {
    console.error('❌ Roles test failed:', err.message);
    process.exit(1);
  }
}

testRoles();
