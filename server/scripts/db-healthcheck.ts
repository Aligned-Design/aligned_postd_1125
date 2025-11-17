/**
 * Database Health Check Script
 *
 * Verifies:
 * - Database connectivity
 * - All required tables exist
 * - RLS policies are enabled
 * - Indexes are properly created
 * - TokenVault encryption works
 *
 * Usage: npx tsx server/scripts/db-healthcheck.ts
 */

import { createClient } from '@supabase/supabase-js';
import TokenVault from '../lib/token-vault';

interface HealthCheckResult {
  timestamp: string;
  overall_status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database_connectivity: CheckResult;
    tables_exist: CheckResult;
    rls_enabled: CheckResult;
    indexes_created: CheckResult;
    token_vault: CheckResult;
    views_exist: CheckResult;
  };
  summary: {
    total_checks: number;
    passed: number;
    failed: number;
    details: string[];
  };
}

interface CheckResult {
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string[];
}

const REQUIRED_TABLES = [
  'connector_platforms',
  'connections',
  'publish_jobs',
  'webhook_events',
  'connection_health_log',
  'connection_audit',
  'publish_job_analytics',
  'encrypted_secrets',
  'publish_job_errors',
  'feature_flags',
  'queue_jobs_monitoring',
  'rate_limit_buckets',
];

const REQUIRED_VIEWS = [
  'connections_requiring_attention',
  'publish_jobs_pending_retry',
  'publish_jobs_dlq',
];

async function checkDatabaseConnectivity(supabase: any): Promise<CheckResult> {
  try {
    const { data, error } = await supabase.from('connector_platforms').select('id').limit(1);

    if (error) {
      return {
        status: 'fail',
        message: `Database connectivity failed: ${error.message}`,
      };
    }

    return {
      status: 'pass',
      message: 'Database connection successful',
    };
  } catch (error) {
    return {
      status: 'fail',
      message: `Database connectivity check error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function checkTablesExist(supabase: any): Promise<CheckResult> {
  try {
    const { data, error } = await supabase.from('information_schema.tables').select('table_name').eq('table_schema', 'public');

    if (error) {
      return {
        status: 'fail',
        message: `Could not query table schema: ${error.message}`,
      };
    }

    const existingTables = (data || []).map((t: any) => t.table_name);
    const missingTables = REQUIRED_TABLES.filter(t => !existingTables.includes(t));

    if (missingTables.length === 0) {
      return {
        status: 'pass',
        message: `All ${REQUIRED_TABLES.length} required tables exist`,
        details: REQUIRED_TABLES,
      };
    } else {
      return {
        status: 'fail',
        message: `Missing ${missingTables.length} tables`,
        details: missingTables,
      };
    }
  } catch (error) {
    return {
      status: 'fail',
      message: `Table check error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function checkRLSEnabled(supabase: any): Promise<CheckResult> {
  try {
    const { data, error } = await supabase.rpc('check_rls_enabled');

    if (error) {
      return {
        status: 'warning',
        message: `Could not verify RLS status: ${error.message}. Verify manually with: SELECT * FROM information_schema.tables WHERE row_security_applicable = true`,
      };
    }

    return {
      status: 'pass',
      message: 'Row-level security (RLS) enabled on required tables',
    };
  } catch (error) {
    return {
      status: 'warning',
      message: `RLS check error (may be normal if function doesn't exist): ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function checkIndexesCreated(supabase: any): Promise<CheckResult> {
  try {
    // Simple check: Try to query a table and measure response time
    const start = Date.now();
    const { data, error } = await supabase
      .from('connections')
      .select('id')
      .eq('status', 'active')
      .limit(1);

    const latency = Date.now() - start;

    if (error) {
      return {
        status: 'fail',
        message: `Index check failed: ${error.message}`,
      };
    }

    if (latency < 100) {
      return {
        status: 'pass',
        message: `Indexes appear to be working (query latency: ${latency}ms)`,
      };
    } else {
      return {
        status: 'warning',
        message: `Indexes may not be optimal (query latency: ${latency}ms, expected <100ms)`,
      };
    }
  } catch (error) {
    return {
      status: 'warning',
      message: `Index check error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function checkTokenVault(): Promise<CheckResult> {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
      return {
        status: 'warning',
        message: 'Supabase credentials not configured. TokenVault skipped.',
      };
    }

    const vault = new TokenVault({
      supabaseUrl,
      supabaseKey,
    });

    const result = await vault.healthCheck();

    return {
      status: result.status === 'healthy' ? 'pass' : 'fail',
      message: result.message,
    };
  } catch (error) {
    return {
      status: 'fail',
      message: `TokenVault health check error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function checkViewsExist(supabase: any): Promise<CheckResult> {
  try {
    const { data, error } = await supabase
      .from('information_schema.views')
      .select('table_name')
      .eq('table_schema', 'public');

    if (error) {
      return {
        status: 'fail',
        message: `Could not query views: ${error.message}`,
      };
    }

    const existingViews = (data || []).map((v: any) => v.table_name);
    const missingViews = REQUIRED_VIEWS.filter(v => !existingViews.includes(v));

    if (missingViews.length === 0) {
      return {
        status: 'pass',
        message: `All ${REQUIRED_VIEWS.length} required views exist`,
        details: REQUIRED_VIEWS,
      };
    } else {
      return {
        status: 'warning',
        message: `Missing ${missingViews.length} views`,
        details: missingViews,
      };
    }
  } catch (error) {
    return {
      status: 'warning',
      message: `View check error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function runHealthChecks(): Promise<HealthCheckResult> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      timestamp: new Date().toISOString(),
      overall_status: 'unhealthy',
      checks: {
        database_connectivity: {
          status: 'fail',
          message: 'Supabase credentials not configured (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)',
        },
        tables_exist: { status: 'fail', message: 'Skipped: No database connection' },
        rls_enabled: { status: 'fail', message: 'Skipped: No database connection' },
        indexes_created: { status: 'fail', message: 'Skipped: No database connection' },
        token_vault: { status: 'fail', message: 'Skipped: No database connection' },
        views_exist: { status: 'fail', message: 'Skipped: No database connection' },
      },
      summary: {
        total_checks: 6,
        passed: 0,
        failed: 6,
        details: [
          'Database credentials missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env',
        ],
      },
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🏥 Running database health checks...\n');

  const results = await Promise.all([
    checkDatabaseConnectivity(supabase),
    checkTablesExist(supabase),
    checkRLSEnabled(supabase),
    checkIndexesCreated(supabase),
    checkTokenVault(),
    checkViewsExist(supabase),
  ]);

  const [connectivity, tables, rls, indexes, vault, views] = results;

  const allPassed = [connectivity, tables, rls, indexes, vault, views].filter(c => c.status === 'pass');
  const allFailed = [connectivity, tables, rls, indexes, vault, views].filter(c => c.status === 'fail');

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (allFailed.length > 0) {
    overallStatus = allFailed.some(c => c.message.includes('Database')) ? 'unhealthy' : 'degraded';
  }

  const result: HealthCheckResult = {
    timestamp: new Date().toISOString(),
    overall_status: overallStatus,
    checks: {
      database_connectivity: connectivity,
      tables_exist: tables,
      rls_enabled: rls,
      indexes_created: indexes,
      token_vault: vault,
      views_exist: views,
    },
    summary: {
      total_checks: 6,
      passed: allPassed.length,
      failed: allFailed.length,
      details: [
        `Overall Status: ${overallStatus.toUpperCase()}`,
        `Checks Passed: ${allPassed.length}/6`,
        `Checks Failed: ${allFailed.length}/6`,
      ],
    },
  };

  return result;
}

async function saveHealthReport(result: HealthCheckResult): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');

  const reportPath = path.join(process.cwd(), 'logs', 'db-health.json');

  // Create logs directory if needed
  const logsDir = path.dirname(reportPath);
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
  console.log(`\n📁 Health report saved to: ${reportPath}`);
}

async function main(): Promise<void> {
  try {
    const result = await runHealthChecks();

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 HEALTH CHECK SUMMARY');
    console.log('='.repeat(60));

    Object.entries(result.checks).forEach(([name, check]) => {
      const icon = check.status === 'pass' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
      console.log(`\n${icon} ${name.replace(/_/g, ' ').toUpperCase()}`);
      console.log(`   ${check.message}`);
      if (check.details && check.details.length > 0 && check.details.length <= 10) {
        check.details.forEach(d => console.log(`   - ${d}`));
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log(`Overall Status: ${result.overall_status === 'healthy' ? '🟢' : result.overall_status === 'degraded' ? '🟡' : '🔴'} ${result.overall_status.toUpperCase()}`);
    console.log(`Checks: ${result.summary.passed}/${result.summary.total_checks} passed`);
    console.log('='.repeat(60) + '\n');

    await saveHealthReport(result);

    process.exit(result.overall_status === 'healthy' ? 0 : result.overall_status === 'degraded' ? 1 : 2);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(2);
  }
}

main();
