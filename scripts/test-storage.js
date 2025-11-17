#!/usr/bin/env node

/**
 * Test Storage Configuration
 * Verifies Supabase Storage buckets are accessible
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorage() {
  try {
    console.log('📦 Testing storage configuration...');

    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('❌ Storage test failed:', error.message);
      process.exit(1);
    }

    console.log('✅ Storage accessible');
    console.log(`   Available buckets: ${buckets.length}`);

    if (buckets.length > 0) {
      buckets.forEach(b => console.log(`   - ${b.name}`));
    } else {
      console.log('   ⚠️  No buckets found (create with: pnpm run test:auth-setup)');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Storage error:', err.message);
    process.exit(1);
  }
}

testStorage();
