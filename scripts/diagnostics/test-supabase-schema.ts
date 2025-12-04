#!/usr/bin/env tsx
/**
 * Supabase Schema Diagnostic Utility
 * 
 * Tests:
 * - Connectivity to Supabase
 * - Ability to query brands.safety_config
 * - Whether schema cache is stale
 * - Whether brand_safety_configs table exists (should not)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface DiagnosticResult {
  test: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: DiagnosticResult[] = [];

async function runDiagnostics() {
  console.log('🔍 Supabase Schema Diagnostics\n');
  console.log(`URL: ${supabaseUrl}\n`);

  // Test 1: Connectivity
  console.log('1️⃣ Testing connectivity...');
  try {
    const { data, error } = await supabase.from('brands').select('id').limit(1);
    if (error) {
      results.push({
        test: 'Connectivity',
        passed: false,
        message: `Failed to connect: ${error.message}`,
        details: error,
      });
      console.log('   ❌ Failed:', error.message);
    } else {
      results.push({
        test: 'Connectivity',
        passed: true,
        message: 'Successfully connected to Supabase',
      });
      console.log('   ✅ Connected successfully');
    }
  } catch (error: any) {
    results.push({
      test: 'Connectivity',
      passed: false,
      message: `Connection error: ${error.message}`,
      details: error,
    });
    console.log('   ❌ Connection error:', error.message);
  }

  // Test 2: Check if brand_safety_configs table exists (should not)
  console.log('\n2️⃣ Checking for brand_safety_configs table (should not exist)...');
  try {
    const { error } = await supabase.from('brand_safety_configs').select('*').limit(1);
    if (error?.message?.includes('Could not find the table')) {
      results.push({
        test: 'brand_safety_configs table',
        passed: true,
        message: 'Table does not exist (correct)',
      });
      console.log('   ✅ Table does not exist (correct)');
    } else if (error) {
      // Other error means table might exist or schema cache issue
      results.push({
        test: 'brand_safety_configs table',
        passed: false,
        message: `Unexpected error: ${error.message}`,
        details: error,
      });
      console.log('   ⚠️  Unexpected error:', error.message);
    } else {
      results.push({
        test: 'brand_safety_configs table',
        passed: false,
        message: 'Table exists (should not!)',
      });
      console.log('   ❌ Table exists (should not!)');
    }
  } catch (error: any) {
    results.push({
      test: 'brand_safety_configs table',
      passed: false,
      message: `Error checking table: ${error.message}`,
      details: error,
    });
    console.log('   ❌ Error:', error.message);
  }

  // Test 3: Query brands.safety_config (should work)
  console.log('\n3️⃣ Testing brands.safety_config query...');
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('id, safety_config, brand_kit')
      .limit(1)
      .single();

    if (error) {
      const isSchemaCacheError = error.message?.includes('brand_safety_configs') ||
                                 error.message?.includes('Could not find the table') ||
                                 error.message?.includes('schema cache');

      if (isSchemaCacheError) {
        results.push({
          test: 'brands.safety_config query',
          passed: false,
          message: 'Schema cache error detected',
          details: {
            error: error.message,
            code: error.code,
            hint: 'PostgREST schema cache is stale. Reload schema in Supabase Dashboard.',
          },
        });
        console.log('   ❌ Schema cache error:', error.message);
        console.log('   💡 Fix: Reload schema in Supabase Dashboard → Settings → API');
      } else {
        results.push({
          test: 'brands.safety_config query',
          passed: false,
          message: `Query failed: ${error.message}`,
          details: error,
        });
        console.log('   ❌ Query failed:', error.message);
      }
    } else {
      results.push({
        test: 'brands.safety_config query',
        passed: true,
        message: 'Successfully queried brands.safety_config',
        details: {
          hasSafetyConfig: !!data?.safety_config,
          hasBrandKit: !!data?.brand_kit,
        },
      });
      console.log('   ✅ Query successful');
      console.log(`   📦 safety_config: ${data?.safety_config ? 'present' : 'null'}`);
      console.log(`   📦 brand_kit: ${data?.brand_kit ? 'present' : 'null'}`);
    }
  } catch (error: any) {
    results.push({
      test: 'brands.safety_config query',
      passed: false,
      message: `Error: ${error.message}`,
      details: error,
    });
    console.log('   ❌ Error:', error.message);
  }

  // Test 4: Query brands.safety_config with specific brand_id (if provided)
  const brandId = process.env.BRAND_ID;
  if (brandId) {
    console.log(`\n4️⃣ Testing brands.safety_config query for brand ${brandId}...`);
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('id, safety_config, brand_kit')
        .eq('id', brandId)
        .single();

      if (error) {
        const isSchemaCacheError = error.message?.includes('brand_safety_configs') ||
                                   error.message?.includes('Could not find the table') ||
                                   error.message?.includes('schema cache');

        if (isSchemaCacheError) {
          results.push({
            test: `brands.safety_config query (brand ${brandId})`,
            passed: false,
            message: 'Schema cache error detected',
            details: {
              error: error.message,
              code: error.code,
              hint: 'PostgREST schema cache is stale. Reload schema in Supabase Dashboard.',
            },
          });
          console.log('   ❌ Schema cache error:', error.message);
        } else {
          results.push({
            test: `brands.safety_config query (brand ${brandId})`,
            passed: false,
            message: `Query failed: ${error.message}`,
            details: error,
          });
          console.log('   ❌ Query failed:', error.message);
        }
      } else {
        results.push({
          test: `brands.safety_config query (brand ${brandId})`,
          passed: true,
          message: 'Successfully queried brands.safety_config for specific brand',
          details: {
            brandId: data?.id,
            hasSafetyConfig: !!data?.safety_config,
            hasBrandKit: !!data?.brand_kit,
          },
        });
        console.log('   ✅ Query successful');
        console.log(`   📦 safety_config: ${data?.safety_config ? 'present' : 'null'}`);
        console.log(`   📦 brand_kit: ${data?.brand_kit ? 'present' : 'null'}`);
      }
    } catch (error: any) {
      results.push({
        test: `brands.safety_config query (brand ${brandId})`,
        passed: false,
        message: `Error: ${error.message}`,
        details: error,
      });
      console.log('   ❌ Error:', error.message);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.test}: ${r.message}`);
      if (r.details?.hint) {
        console.log(`     💡 ${r.details.hint}`);
      }
    });
  }

  // Exit code
  process.exit(failed > 0 ? 1 : 0);
}

runDiagnostics().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

