/**
 * Integration Health Check Script
 *
 * Comprehensive health check of all Week 1 infrastructure components:
 * - Database connectivity and schema
 * - Redis/Bull queue status
 * - TokenVault encryption
 * - Datadog metrics collection
 * - Feature flags configuration
 *
 * Usage: npx tsx server/scripts/integration-health.ts
 * Output: JSON report to /logs/system-health.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';
import pino from 'pino';
import TokenVault from '../lib/token-vault';
import { getFeatureFlagsManager, initializeFeatureFlags } from '../lib/feature-flags';
import { publishJobQueue, healthCheckQueue, tokenRefreshQueue } from '../queue';

const logger = pino();

// ============================================================================
// HEALTH CHECK INTERFACES
// ============================================================================

interface ComponentHealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

interface SystemHealthReport {
  timestamp: string;
  overallStatus: 'healthy' | 'degraded' | 'critical';
  components: ComponentHealthCheck[];
  summary: {
    totalComponents: number;
    healthy: number;
    warnings: number;
    critical: number;
  };
  environment: {
    nodeVersion: string;
    nodeEnv: string;
    appVersion: string;
  };
}

// ============================================================================
// INDIVIDUAL HEALTH CHECKS
// ============================================================================

async function checkDatabaseHealth(): Promise<ComponentHealthCheck> {
  const startTime = Date.now();

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return {
        name: 'Database',
        status: 'critical',
        message: 'Supabase credentials not configured',
        timestamp: new Date().toISOString(),
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test query
    const { data, error } = await supabase.from('connector_platforms').select('id').limit(1);

    if (error) {
      return {
        name: 'Database',
        status: 'critical',
        message: `Database query failed: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
    }

    const latency = Date.now() - startTime;

    return {
      name: 'Database',
      status: latency < 500 ? 'healthy' : 'warning',
      message: 'Database connection and schema verified',
      details: {
        latencyMs: latency,
        schemaStatus: 'verified',
        recordCount: data?.length || 0,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'Database',
      status: 'critical',
      message: `Health check error: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString(),
    };
  }
}

async function checkRedisHealth(): Promise<ComponentHealthCheck> {
  const startTime = Date.now();

  try {
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    });

    const testKey = 'health-check-' + Date.now();
    // Type assertions for redis methods - ioredis supports these at runtime
    const redisClient = redis as any;
    await redisClient.set(testKey, 'ok', 'EX', 60);
    const value = await redisClient.get(testKey);
    await redisClient.del(testKey);
    if (typeof redisClient.disconnect === 'function') {
      await redisClient.disconnect();
    }

    const latency = Date.now() - startTime;

    if (value !== 'ok') {
      return {
        name: 'Redis',
        status: 'critical',
        message: 'Redis get/set/del test failed',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      name: 'Redis',
      status: latency < 100 ? 'healthy' : 'warning',
      message: 'Redis connection and basic operations working',
      details: {
        latencyMs: latency,
        testResult: 'passed',
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'Redis',
      status: 'critical',
      message: `Redis health check failed: ${error instanceof Error ? error.message : String(error)}`,
      details: {
        hint: 'Ensure Redis is running. Run: docker-compose up redis',
      },
      timestamp: new Date().toISOString(),
    };
  }
}

async function checkBullQueueHealth(): Promise<ComponentHealthCheck> {
  try {
    // Test queue operations
    // Type assertion for queue.add with 3 args - Bull runtime supports this
    const queueAdd = publishJobQueue.add as any;
    const testJob = await queueAdd(
      'health_check',
      { test: true },
      { removeOnComplete: true }
    );

    // Type assertion for queue.getJob - exists at runtime
    const extendedQueue = publishJobQueue as any;
    const jobData = await extendedQueue.getJob(testJob.id);

    if (!jobData) {
      return {
        name: 'Bull Queue',
        status: 'critical',
        message: 'Failed to retrieve queued job',
        timestamp: new Date().toISOString(),
      };
    }

    // Clean up
    await testJob.remove();

    return {
      name: 'Bull Queue',
      status: 'healthy',
      message: 'Bull queue job operations working',
      details: {
        // Type assertions for queue methods - exist at runtime
        jobsQueued: (await extendedQueue.count?.()) || 0,
        jobsActive: (await extendedQueue.getActiveCount?.()) || 0,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'Bull Queue',
      status: 'critical',
      message: `Bull queue health check failed: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString(),
    };
  }
}

async function checkTokenVaultHealth(): Promise<ComponentHealthCheck> {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return {
        name: 'TokenVault',
        status: 'warning',
        message: 'Skipped: Supabase not configured',
        timestamp: new Date().toISOString(),
      };
    }

    const vault = new TokenVault({
      supabaseUrl,
      supabaseKey,
    });

    const result = await vault.healthCheck();

    return {
      name: 'TokenVault',
      status: result.status === 'healthy' ? 'healthy' : 'critical',
      message: result.message,
      details: {
        encryptionAlgorithm: 'AES-256-GCM',
        testResult: result.status,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'TokenVault',
      status: 'critical',
      message: `TokenVault health check failed: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString(),
    };
  }
}

async function checkDatadogHealth(): Promise<ComponentHealthCheck> {
  try {
    const apiKey = process.env.DATADOG_API_KEY;

    if (!apiKey) {
      return {
        name: 'Datadog',
        status: 'warning',
        message: 'Datadog API key not configured (optional)',
        timestamp: new Date().toISOString(),
      };
    }

    const site = process.env.DATADOG_SITE || 'datadoghq.com';

    // Test API connectivity
    const response = await fetch(`https://api.${site}/api/v1/validate`, {
      method: 'GET',
      headers: {
        'DD-API-KEY': apiKey,
      },
    });

    const status = response.ok ? 'healthy' : 'warning';
    const message = response.ok ? 'Datadog API connection verified' : 'Datadog API returned error';

    return {
      name: 'Datadog',
      status,
      message,
      details: {
        site,
        apiKeyConfigured: true,
        responseStatus: response.status,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'Datadog',
      status: 'warning',
      message: `Datadog connectivity check inconclusive: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString(),
    };
  }
}

async function checkFeatureFlagsHealth(): Promise<ComponentHealthCheck> {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return {
        name: 'Feature Flags',
        status: 'warning',
        message: 'Skipped: Supabase not configured',
        timestamp: new Date().toISOString(),
      };
    }

    const flags = await initializeFeatureFlags(supabaseUrl, supabaseKey);

    // Check a test flag
    const testTenant = 'test-tenant-' + Date.now();
    const isEnabled = await flags.isEnabled('integration_meta', testTenant);

    return {
      name: 'Feature Flags',
      status: 'healthy',
      message: 'Feature flags initialized and accessible',
      details: {
        flagsConfigured: true,
        testFlagReadable: true,
        sampleResult: { flagName: 'integration_meta', isEnabled },
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'Feature Flags',
      status: 'warning',
      message: `Feature flags check failed: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString(),
    };
  }
}

async function checkConnectorScaffoldHealth(): Promise<ComponentHealthCheck> {
  try {
    const connectorDirs = [
      'server/connectors/meta',
      'server/connectors/linkedin',
      'server/connectors/tiktok',
      'server/connectors/gbp',
      'server/connectors/mailchimp',
    ];

    const existingDirs = connectorDirs.filter(dir =>
      fs.existsSync(path.join(process.cwd(), dir))
    );

    const status = existingDirs.length === connectorDirs.length ? 'healthy' : 'warning';
    const message = existingDirs.length === connectorDirs.length
      ? 'All connector scaffolds created'
      : `${connectorDirs.length - existingDirs.length} connector scaffold(s) missing`;

    return {
      name: 'Connector Scaffolds',
      status,
      message,
      details: {
        totalConnectors: connectorDirs.length,
        existingConnectors: existingDirs.length,
        missing: connectorDirs.filter(d => !fs.existsSync(path.join(process.cwd(), d))),
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'Connector Scaffolds',
      status: 'warning',
      message: `Connector scaffold check failed: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================================================
// MAIN HEALTH CHECK
// ============================================================================

async function runAllHealthChecks(): Promise<SystemHealthReport> {
  logger.info('🏥 Running comprehensive system health checks...\n');

  const checks = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
    checkBullQueueHealth(),
    checkTokenVaultHealth(),
    checkDatadogHealth(),
    checkFeatureFlagsHealth(),
    checkConnectorScaffoldHealth(),
  ]);

  const healthy = checks.filter(c => c.status === 'healthy').length;
  const warnings = checks.filter(c => c.status === 'warning').length;
  const critical = checks.filter(c => c.status === 'critical').length;

  let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
  if (critical > 0) overallStatus = 'critical';
  else if (warnings > 0) overallStatus = 'degraded';

  const report: SystemHealthReport = {
    timestamp: new Date().toISOString(),
    overallStatus,
    components: checks,
    summary: {
      totalComponents: checks.length,
      healthy,
      warnings,
      critical,
    },
    environment: {
      nodeVersion: process.version,
      nodeEnv: process.env.NODE_ENV || 'development',
      appVersion: process.env.APP_VERSION || 'unknown',
    },
  };

  return report;
}

async function saveHealthReport(report: SystemHealthReport): Promise<void> {
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const reportPath = path.join(logsDir, 'system-health.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`\n📁 Health report saved to: ${reportPath}`);
}

function printHealthReport(report: SystemHealthReport): void {
  console.log('\n' + '='.repeat(70));
  console.log('🏥 SYSTEM HEALTH CHECK REPORT');
  console.log('='.repeat(70));
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Overall Status: ${report.overallStatus === 'healthy' ? '✅ HEALTHY' : report.overallStatus === 'degraded' ? '⚠️  DEGRADED' : '❌ CRITICAL'}`);
  console.log('');
  console.log('Component Status:');
  report.components.forEach(component => {
    const icon = component.status === 'healthy' ? '✅' : component.status === 'warning' ? '⚠️ ' : '❌';
    console.log(`  ${icon} ${component.name.padEnd(20)} ${component.message}`);
    if (component.details) {
      Object.entries(component.details).forEach(([key, value]) => {
        console.log(`     • ${key}: ${JSON.stringify(value)}`);
      });
    }
  });
  console.log('');
  console.log(`Summary: ${report.summary.healthy}/${report.summary.totalComponents} healthy, ${report.summary.warnings} warnings, ${report.summary.critical} critical`);
  console.log('='.repeat(70) + '\n');
}

async function main(): Promise<void> {
  try {
    const report = await runAllHealthChecks();
    printHealthReport(report);
    await saveHealthReport(report);

    const exitCode = report.overallStatus === 'healthy' ? 0 : report.overallStatus === 'degraded' ? 1 : 2;
    process.exit(exitCode);
  } catch (error) {
    logger.error('Fatal error:', error);
    process.exit(2);
  }
}

main();
