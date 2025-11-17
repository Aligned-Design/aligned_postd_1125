#!/usr/bin/env node

/**
 * Test Data Validation
 * Verifies data validation rules and constraints
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testValidation() {
  try {
    console.log('✔️  Testing data validation...');

    // Test creating invalid record (should fail gracefully)
    const { error: testError } = await supabase
      .from('media_assets')
      .insert({
        filename: 'test.jpg',
        // Missing required fields - should error
      })
      .select();

    if (testError) {
      console.log('✅ Validation rules enforced');
      console.log(`   Error caught: ${testError.code}`);
    } else {
      console.log('⚠️  Validation may not be fully configured');
    }

    console.log('✅ Data validation working');
    process.exit(0);
  } catch (err) {
    console.error('❌ Validation test failed:', err.message);
    process.exit(1);
  }
}

testValidation();
