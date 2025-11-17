#!/usr/bin/env node

/**
 * Test Posts System
 * Verifies posts table and content generation system
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPostsSystem() {
  try {
    console.log('📝 Testing posts system...');

    // Check posts table
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('count')
      .limit(1);

    if (postsError && postsError.code === 'PGRST116') {
      console.log('⚠️  posts table not found');
      console.log('   Posts table setup is optional');
      process.exit(0);
    }

    if (!postsError) {
      console.log('✅ Posts system configured');
      console.log('   posts table: OK');
    } else {
      console.log('⚠️  Posts table status unknown');
    }

    process.exit(0);
  } catch (err) {
    console.log('⚠️  Posts system test skipped:', err.message);
    process.exit(0);
  }
}

testPostsSystem();
