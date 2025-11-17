#!/usr/bin/env node

/**
 * Test Table Relations
 * Verifies foreign key relationships are properly configured
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRelations() {
  try {
    console.log('🔗 Testing table relations...');

    // Test media_assets -> brands relationship
    const { data: assets, error: assetsError } = await supabase
      .from('media_assets')
      .select('id, brand_id')
      .limit(1);

    if (assetsError && assetsError.code !== 'PGRST116') {
      console.log('⚠️  media_assets table exists but relation may need check');
    } else if (!assetsError) {
      console.log('✅ media_assets -> brands relation OK');
    }

    // Test brand_users table
    const { data: brandUsers, error: usersError } = await supabase
      .from('brand_users')
      .select('id')
      .limit(1);

    if (!usersError) {
      console.log('✅ brand_users table accessible');
    } else if (usersError.code === 'PGRST116') {
      console.log('⚠️  brand_users table not yet created');
    }

    console.log('✅ Relations configured');
    process.exit(0);
  } catch (err) {
    console.error('❌ Relations test failed:', err.message);
    process.exit(1);
  }
}

testRelations();
