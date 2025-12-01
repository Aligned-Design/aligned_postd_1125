/**
 * RLS Phase 1 Verification Test Script
 * 
 * Purpose: Verify RLS policies for Phase 1 critical tables using supabase-js
 * Usage: Run with tsx: `tsx server/tests/rls_phase1_test.ts`
 * 
 * Environment Variables Required:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - SUPABASE_ANON_KEY
 * - USER1_ACCESS_TOKEN (optional - JWT token for user1)
 * - USER2_ACCESS_TOKEN (optional - JWT token for user2)
 * 
 * Note: If USER1_ACCESS_TOKEN and USER2_ACCESS_TOKEN are not provided,
 *       the script will use anon key and simulate user context via service role.
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const USER1_ACCESS_TOKEN = process.env.USER1_ACCESS_TOKEN;
const USER2_ACCESS_TOKEN = process.env.USER2_ACCESS_TOKEN;

// Test UUIDs (must match those in rls_phase1_verification.sql)
const TEST_USER1_ID = '33333333-3333-3333-3333-333333333333';
const TEST_USER2_ID = '44444444-4444-4444-4444-444444444444';
const TEST_BRAND_ID = '22222222-2222-2222-2222-222222222222';

// Colors for console output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function logSuccess(message: string) {
  console.log(`${GREEN}✅ ${message}${RESET}`);
}

function logError(message: string) {
  console.log(`${RED}❌ ${message}${RESET}`);
}

function logWarning(message: string) {
  console.log(`${YELLOW}⚠️  ${message}${RESET}`);
}

function logInfo(message: string) {
  console.log(`ℹ️  ${message}`);
}

async function main() {
  console.log('\n🔒 RLS Phase 1 Verification Test\n');
  console.log('=' .repeat(50));

  // Validate environment
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
    logError('Missing required environment variables:');
    console.log('  - SUPABASE_URL');
    console.log('  - SUPABASE_SERVICE_ROLE_KEY');
    console.log('  - SUPABASE_ANON_KEY');
    console.log('\nOptional:');
    console.log('  - USER1_ACCESS_TOKEN');
    console.log('  - USER2_ACCESS_TOKEN');
    process.exit(1);
  }

  // Create clients
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });

  // For user context, we'll use service role with manual user_id checks
  // In production, you'd use actual JWT tokens
  const user1Client = USER1_ACCESS_TOKEN
    ? createClient(SUPABASE_URL, USER1_ACCESS_TOKEN, {
        auth: { persistSession: false }
      })
    : serviceClient; // Fallback to service role for testing

  const user2Client = USER2_ACCESS_TOKEN
    ? createClient(SUPABASE_URL, USER2_ACCESS_TOKEN, {
        auth: { persistSession: false }
      })
    : serviceClient; // Fallback to service role for testing

  let passed = 0;
  let failed = 0;

  // Test 1: User1 can see their own payment_attempts
  logInfo('Test 1: User1 can see their own payment_attempts');
  try {
    const { data, error } = await user1Client
      .from('payment_attempts')
      .select('*')
      .eq('user_id', TEST_USER1_ID);

    if (error) {
      logError(`Unexpected error: ${error.message}`);
      failed++;
    } else if (data && data.length >= 1) {
      logSuccess(`User1 sees ${data.length} payment_attempt(s)`);
      passed++;
    } else {
      logError(`User1 should see at least 1 payment_attempt, but saw ${data?.length || 0}`);
      failed++;
    }
  } catch (err: any) {
    logError(`Exception: ${err.message}`);
    failed++;
  }

  // Test 2: User2 cannot see user1's payment_attempts
  logInfo('Test 2: User2 cannot see user1\'s payment_attempts');
  try {
    const { data, error } = await user2Client
      .from('payment_attempts')
      .select('*')
      .eq('user_id', TEST_USER1_ID);

    if (error) {
      // Permission denied is expected
      if (error.message.includes('permission') || error.message.includes('RLS')) {
        logSuccess('User2 blocked from viewing user1\'s payment_attempts');
        passed++;
      } else {
        logError(`Unexpected error: ${error.message}`);
        failed++;
      }
    } else if (data && data.length === 0) {
      logSuccess('User2 sees 0 payment_attempts (correct isolation)');
      passed++;
    } else {
      logError(`User2 should see 0 payment_attempts, but saw ${data?.length || 0}`);
      failed++;
    }
  } catch (err: any) {
    logError(`Exception: ${err.message}`);
    failed++;
  }

  // Test 3: User1 can see brand's strategy_briefs
  logInfo('Test 3: User1 (owner) can see brand\'s strategy_briefs');
  try {
    const { data, error } = await user1Client
      .from('strategy_briefs')
      .select('*')
      .eq('brand_id', TEST_BRAND_ID);

    if (error) {
      logError(`Unexpected error: ${error.message}`);
      failed++;
    } else if (data && data.length >= 1) {
      logSuccess(`User1 sees ${data.length} strategy_brief(s)`);
      passed++;
    } else {
      logError(`User1 should see at least 1 strategy_brief, but saw ${data?.length || 0}`);
      failed++;
    }
  } catch (err: any) {
    logError(`Exception: ${err.message}`);
    failed++;
  }

  // Test 4: User2 can see brand's strategy_briefs (member)
  logInfo('Test 4: User2 (member) can see brand\'s strategy_briefs');
  try {
    const { data, error } = await user2Client
      .from('strategy_briefs')
      .select('*')
      .eq('brand_id', TEST_BRAND_ID);

    if (error) {
      logError(`Unexpected error: ${error.message}`);
      failed++;
    } else if (data && data.length >= 1) {
      logSuccess(`User2 sees ${data.length} strategy_brief(s)`);
      passed++;
    } else {
      logError(`User2 should see at least 1 strategy_brief, but saw ${data?.length || 0}`);
      failed++;
    }
  } catch (err: any) {
    logError(`Exception: ${err.message}`);
    failed++;
  }

  // Test 5: User2 cannot insert strategy_briefs (non-admin)
  logInfo('Test 5: User2 (member) cannot insert strategy_briefs');
  try {
    const { data, error } = await user2Client
      .from('strategy_briefs')
      .insert({
        brand_id: TEST_BRAND_ID,
        request_id: 'test-req-blocked',
        cycle_id: 'test-cycle',
        version: 'v1',
        positioning: {},
        voice: {},
        visual: {},
        competitive: {}
      });

    if (error) {
      // Permission denied is expected
      if (error.message.includes('permission') || error.message.includes('RLS') || error.code === '42501') {
        logSuccess('User2 blocked from inserting strategy_briefs');
        passed++;
      } else {
        logError(`Unexpected error: ${error.message}`);
        failed++;
      }
    } else {
      logError('User2 was allowed to insert strategy_briefs (should be blocked)');
      failed++;
      // Cleanup if it somehow succeeded
      if (data) {
        await serviceClient
          .from('strategy_briefs')
          .delete()
          .eq('request_id', 'test-req-blocked');
      }
    }
  } catch (err: any) {
    // Exception is also acceptable (permission denied)
    if (err.message.includes('permission') || err.message.includes('RLS')) {
      logSuccess('User2 blocked from inserting strategy_briefs');
      passed++;
    } else {
      logError(`Exception: ${err.message}`);
      failed++;
    }
  }

  // Test 6: Service role can insert strategy_briefs
  logInfo('Test 6: Service role can insert strategy_briefs');
  try {
    const { data, error } = await serviceClient
      .from('strategy_briefs')
      .insert({
        brand_id: TEST_BRAND_ID,
        request_id: 'test-req-service',
        cycle_id: 'test-cycle',
        version: 'v1',
        positioning: {},
        voice: {},
        visual: {},
        competitive: {}
      })
      .select();

    if (error) {
      logError(`Service role insert failed: ${error.message}`);
      failed++;
    } else if (data && data.length > 0) {
      logSuccess('Service role can insert strategy_briefs');
      passed++;
      // Cleanup
      await serviceClient
        .from('strategy_briefs')
        .delete()
        .eq('request_id', 'test-req-service');
    } else {
      logError('Service role insert returned no data');
      failed++;
    }
  } catch (err: any) {
    logError(`Exception: ${err.message}`);
    failed++;
  }

  // Test 7: User1 can see brand's content_packages
  logInfo('Test 7: User1 can see brand\'s content_packages');
  try {
    const { data, error } = await user1Client
      .from('content_packages')
      .select('*')
      .eq('brand_id', TEST_BRAND_ID);

    if (error) {
      logError(`Unexpected error: ${error.message}`);
      failed++;
    } else if (data && data.length >= 1) {
      logSuccess(`User1 sees ${data.length} content_package(s)`);
      passed++;
    } else {
      logError(`User1 should see at least 1 content_package, but saw ${data?.length || 0}`);
      failed++;
    }
  } catch (err: any) {
    logError(`Exception: ${err.message}`);
    failed++;
  }

  // Test 8: Immutable logs cannot be updated (brand_history)
  logInfo('Test 8: Immutable logs (brand_history) cannot be updated');
  try {
    const { error } = await user1Client
      .from('brand_history')
      .update({ action: 'modified' })
      .eq('brand_id', TEST_BRAND_ID)
      .limit(1);

    if (error) {
      // Permission denied is expected
      if (error.message.includes('permission') || error.message.includes('RLS') || error.code === '42501') {
        logSuccess('brand_history update blocked (immutable)');
        passed++;
      } else {
        logError(`Unexpected error: ${error.message}`);
        failed++;
      }
    } else {
      logError('brand_history update was allowed (should be blocked)');
      failed++;
    }
  } catch (err: any) {
    // Exception is also acceptable
    if (err.message.includes('permission') || err.message.includes('RLS')) {
      logSuccess('brand_history update blocked (immutable)');
      passed++;
    } else {
      logError(`Exception: ${err.message}`);
      failed++;
    }
  }

  // Test 9: Immutable logs cannot be deleted (collaboration_logs)
  logInfo('Test 9: Immutable logs (collaboration_logs) cannot be deleted');
  try {
    const { error } = await user1Client
      .from('collaboration_logs')
      .delete()
      .eq('brand_id', TEST_BRAND_ID)
      .limit(1);

    if (error) {
      // Permission denied is expected
      if (error.message.includes('permission') || error.message.includes('RLS') || error.code === '42501') {
        logSuccess('collaboration_logs delete blocked (immutable)');
        passed++;
      } else {
        logError(`Unexpected error: ${error.message}`);
        failed++;
      }
    } else {
      logError('collaboration_logs delete was allowed (should be blocked)');
      failed++;
    }
  } catch (err: any) {
    // Exception is also acceptable
    if (err.message.includes('permission') || err.message.includes('RLS')) {
      logSuccess('collaboration_logs delete blocked (immutable)');
      passed++;
    } else {
      logError(`Exception: ${err.message}`);
      failed++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Test Results:');
  console.log(`   ${GREEN}Passed: ${passed}${RESET}`);
  console.log(`   ${RED}Failed: ${failed}${RESET}`);
  console.log(`   Total: ${passed + failed}`);

  if (failed === 0) {
    console.log(`\n${GREEN}🎉 All tests passed!${RESET}\n`);
    process.exit(0);
  } else {
    console.log(`\n${RED}❌ Some tests failed. Please review the output above.${RESET}\n`);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export { main };

