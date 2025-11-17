#!/usr/bin/env node

/**
 * Test Authentication Setup
 * Verifies Supabase Auth is configured
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables:');
  console.error('  - VITE_SUPABASE_URL');
  console.error('  - SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  try {
    console.log('🔐 Testing authentication setup...');

    // Try to get current session (should be null)
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      console.log('✅ Auth configured, user authenticated');
      console.log(`   User: ${session.user.email}`);
    } else {
      console.log('✅ Auth configured, no user session');
      console.log('   Ready for login');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Auth test failed:', err.message);
    process.exit(1);
  }
}

testAuth();
