#!/usr/bin/env node
/**
 * Test brand_guide_versions table existence
 * Uses service role to bypass RLS and check if table exists
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkTableExists() {
  try {
    console.log('🔍 Checking if brand_guide_versions table exists...\n');

    // Try to query the table directly
    const { data, error } = await supabase
      .from('brand_guide_versions')
      .select('count')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') {
        console.log('❌ Table does NOT exist');
        console.log('   Error code:', error.code);
        console.log('   Error message:', error.message);
        return false;
      } else {
        console.log('⚠️  Unexpected error:', error.message);
        return false;
      }
    }

    console.log('✅ Table EXISTS');
    console.log('   Sample query successful');
    return true;
  } catch (err) {
    console.error('❌ Error checking table:', err);
    return false;
  }
}

checkTableExists().then((exists) => {
  process.exit(exists ? 0 : 1);
});

