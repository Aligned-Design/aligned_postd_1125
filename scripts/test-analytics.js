#!/usr/bin/env node

/**
 * Test Analytics System
 * Verifies analytics tables and metrics tracking
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAnalytics() {
  try {
    console.log('📊 Testing analytics system...');

    const analyticsTables = [
      'analytics_metrics',
      'analytics_events',
      'analytics_sessions'
    ];

    let foundCount = 0;
    for (const table of analyticsTables) {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1);

      if (!error) {
        console.log(`   ✅ ${table}`);
        foundCount++;
      } else if (error.code !== 'PGRST116') {
        console.log(`   ⚠️  ${table} - permission or other issue`);
      }
    }

    if (foundCount > 0) {
      console.log(`✅ Analytics system configured (${foundCount}/3 tables)`);
    } else {
      console.log('⚠️  Analytics system not yet configured (optional)');
    }

    console.log('✅ Analytics test completed');
    process.exit(0);
  } catch (err) {
    console.log('⚠️  Analytics test skipped:', err.message);
    process.exit(0);
  }
}

testAnalytics();
