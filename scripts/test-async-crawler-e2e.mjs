#!/usr/bin/env node
/**
 * End-to-End Test Script for Async Crawler System
 * 
 * Purpose: Verify the entire crawler lifecycle works correctly
 * 
 * Usage:
 *   # Local dev:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/test-async-crawler-e2e.mjs
 * 
 *   # Production (Vercel):
 *   Set CRAWLER_TEST_URL env var in Vercel dashboard, then run manually
 * 
 * Exit codes:
 *   0  = Success (crawl completed)
 *   1  = Environment missing
 *   2  = Job creation failed
 *   3  = Worker failed to process
 *   4  = Timeout (job stuck)
 *   5  = DB verification failed
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// Configuration
// ============================================================================

const TEST_URL = process.env.CRAWLER_TEST_URL || 'https://stripe.com';
const BRAND_ID = `test-brand-${Date.now()}`;
const MAX_POLL_ATTEMPTS = 300; // 5 minutes
const POLL_INTERVAL_MS = 1000; // 1 second

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ============================================================================
// Helpers
// ============================================================================

function log(category, message, data = {}) {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({
    timestamp,
    category,
    message,
    ...data
  }));
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Phase 0: Environment Check
// ============================================================================

log('INIT', 'Starting async crawler E2E test', {
  testUrl: TEST_URL,
  brandId: BRAND_ID,
  maxPollAttempts: MAX_POLL_ATTEMPTS,
});

if (!SUPABASE_URL || !SUPABASE_KEY) {
  log('ERROR', 'Missing required environment variables', {
    hasSupabaseUrl: !!SUPABASE_URL,
    hasSupabaseKey: !!SUPABASE_KEY,
  });
  log('ERROR', 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================================
// Phase 1: Create Crawl Job
// ============================================================================

log('PHASE1', 'Creating crawl job via DB insert');
const startTime = Date.now();

const { data: job, error: createError } = await supabase
  .from('crawl_runs')
  .insert({
    brand_id: BRAND_ID,
    url: TEST_URL,
    status: 'pending',
    progress: 0,
    crawl_options: {
      test: true,
      created_by_script: true,
    },
  })
  .select()
  .single();

if (createError || !job) {
  log('ERROR', 'Failed to create crawl job', {
    error: createError?.message,
    code: createError?.code,
  });
  process.exit(2);
}

const runId = job.id;

log('PHASE1', 'Crawl job created', {
  runId,
  brandId: BRAND_ID,
  url: TEST_URL,
  initialStatus: job.status,
});

// ============================================================================
// Phase 2: Verify Job is in DB
// ============================================================================

log('PHASE2', 'Verifying job exists in database');

const { data: verifyJob, error: verifyError } = await supabase
  .from('crawl_runs')
  .select('id, status, progress, created_at')
  .eq('id', runId)
  .single();

if (verifyError || !verifyJob) {
  log('ERROR', 'Job not found in DB after creation', {
    runId,
    error: verifyError?.message,
  });
  process.exit(5);
}

log('PHASE2', 'Job verified in DB', {
  runId,
  status: verifyJob.status,
  progress: verifyJob.progress,
});

// ============================================================================
// Phase 3: Wait for Worker to Process (or manually trigger if needed)
// ============================================================================

log('PHASE3', 'Waiting for worker to claim and process job');
log('PHASE3', 'NOTE: If running locally, you need to manually trigger the worker:');
log('PHASE3', '  curl -X POST http://localhost:8080/api/crawl/process-jobs \\');
log('PHASE3', '    -H "x-cron-secret: YOUR_SECRET"');
log('PHASE3', '');
log('PHASE3', 'Or on Vercel, the cron job should trigger automatically every minute');
log('PHASE3', '');

// Poll status until completed or failed
let currentStatus = 'pending';
let pollAttempts = 0;
let lastProgress = 0;
const timeline = [];

while (pollAttempts < MAX_POLL_ATTEMPTS) {
  await sleep(POLL_INTERVAL_MS);
  pollAttempts++;

  const { data: statusData, error: statusError } = await supabase
    .from('crawl_runs')
    .select('id, status, progress, error_message, finished_at, updated_at, started_at, runtime_info')
    .eq('id', runId)
    .single();

  if (statusError) {
    log('WARN', 'Failed to poll status', {
      runId,
      attempt: pollAttempts,
      error: statusError.message,
    });
    continue;
  }

  if (!statusData) {
    log('ERROR', 'Job disappeared from DB', { runId });
    process.exit(5);
  }

  // Log status changes
  if (statusData.status !== currentStatus) {
    const elapsed = Date.now() - startTime;
    log('STATUS_CHANGE', `${currentStatus} → ${statusData.status}`, {
      runId,
      fromStatus: currentStatus,
      toStatus: statusData.status,
      elapsedMs: elapsed,
      elapsedFormatted: formatDuration(elapsed),
      progress: statusData.progress,
    });
    timeline.push({
      status: statusData.status,
      elapsedMs: elapsed,
      progress: statusData.progress,
    });
    currentStatus = statusData.status;
  }

  // Log significant progress changes
  if (statusData.progress !== lastProgress && statusData.progress % 25 === 0) {
    log('PROGRESS', `Progress update: ${statusData.progress}%`, {
      runId,
      progress: statusData.progress,
      status: statusData.status,
    });
    lastProgress = statusData.progress;
  }

  // Check for terminal status
  if (statusData.status === 'completed') {
    const totalDuration = Date.now() - startTime;
    log('SUCCESS', 'Crawl completed successfully', {
      runId,
      durationMs: totalDuration,
      durationFormatted: formatDuration(totalDuration),
      progress: statusData.progress,
      hasError: !!statusData.error_message,
      pollAttempts,
      runtimeInfo: statusData.runtime_info,
    });
    
    // ✅ Verify brand_kit exists
    if (job.brand_kit) {
      const imageCount = job.brand_kit.images?.length || 0;
      log('SUCCESS', 'Brand kit generated', {
        imageCount,
        hasColors: !!job.brand_kit.colors,
        hasFonts: !!job.brand_kit.typography,
      });
    }
    
    break;
  }

  if (statusData.status === 'failed') {
    const totalDuration = Date.now() - startTime;
    log('FAILURE', 'Crawl failed', {
      runId,
      durationMs: totalDuration,
      durationFormatted: formatDuration(totalDuration),
      errorMessage: statusData.error_message,
      pollAttempts,
    });
    
    log('ERROR', 'Job failed - check Vercel logs for CRAWL_JOB_PROCESS_FAIL');
    process.exit(3);
  }

  // Log if stuck in pending for too long
  if (statusData.status === 'pending' && pollAttempts > 30) {
    log('WARN', 'Job stuck in pending - worker may not be running', {
      runId,
      status: statusData.status,
      pollAttempts,
      elapsedSeconds: Math.floor((Date.now() - startTime) / 1000),
    });
    
    if (pollAttempts === 60) {
      log('ERROR', 'Job stuck in pending for 60 seconds');
      log('ERROR', 'Possible causes:');
      log('ERROR', '  1. Cron job not configured in Vercel');
      log('ERROR', '  2. CRON_SECRET missing or incorrect');
      log('ERROR', '  3. Worker endpoint not deployed');
      log('ERROR', '');
      log('ERROR', 'To debug:');
      log('ERROR', '  - Check Vercel Dashboard → Cron Jobs');
      log('ERROR', '  - Check Vercel logs for "CRAWL_JOB_CLAIM_ATTEMPT"');
      log('ERROR', '  - Manually trigger: POST /api/crawl/process-jobs');
    }
  }
}

if (pollAttempts >= MAX_POLL_ATTEMPTS) {
  log('ERROR', 'Timeout - job did not complete', {
    runId,
    currentStatus,
    lastProgress,
    pollAttempts,
    timeoutSeconds: (MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000,
  });
  
  // Query final state
  const { data: finalState } = await supabase
    .from('crawl_runs')
    .select('*')
    .eq('id', runId)
    .single();
  
  log('ERROR', 'Final job state', {
    status: finalState?.status,
    progress: finalState?.progress,
    startedAt: finalState?.started_at,
    updatedAt: finalState?.updated_at,
    runtimeInfo: finalState?.runtime_info,
  });
  
  process.exit(4);
}

// ============================================================================
// Phase 4: DB Verification
// ============================================================================

log('PHASE4', 'Verifying final DB state');

const { data: finalJob, error: finalError } = await supabase
  .from('crawl_runs')
  .select('*')
  .eq('id', runId)
  .single();

if (finalError || !finalJob) {
  log('ERROR', 'Failed to verify final job state', {
    runId,
    error: finalError?.message,
  });
  process.exit(5);
}

log('PHASE4', 'Final job state verified', {
  runId,
  status: finalJob.status,
  progress: finalJob.progress,
  hasStartedAt: !!finalJob.started_at,
  hasFinishedAt: !!finalJob.finished_at,
  hasBrandKit: !!finalJob.brand_kit,
  runtimeInfo: finalJob.runtime_info,
});

// Check brand_kit_versions if versioning is enabled
const { data: versions, error: versionsError } = await supabase
  .from('brand_kit_versions')
  .select('id, version_number, source, validated, created_at')
  .eq('brand_id', BRAND_ID)
  .order('version_number', { ascending: false });

if (!versionsError && versions && versions.length > 0) {
  log('PHASE4', 'Brand kit versions created', {
    count: versions.length,
    latestVersion: versions[0].version_number,
    source: versions[0].source,
  });
} else {
  log('WARN', 'No brand kit versions found', {
    brandId: BRAND_ID,
    error: versionsError?.message,
  });
}

// ============================================================================
// Summary
// ============================================================================

const totalDuration = Date.now() - startTime;

log('SUMMARY', 'Async crawler E2E test completed', {
  result: 'SUCCESS',
  runId,
  brandId: BRAND_ID,
  url: TEST_URL,
  totalDurationMs: totalDuration,
  totalDurationFormatted: formatDuration(totalDuration),
  pollAttempts,
  timeline: timeline.map(t => ({
    status: t.status,
    elapsed: formatDuration(t.elapsedMs),
    progress: t.progress,
  })),
});

log('SUCCESS', '✅ All phases passed');
log('SUCCESS', '');
log('SUCCESS', 'Timeline:');
timeline.forEach((t, i) => {
  log('SUCCESS', `  ${i + 1}. ${t.status} at ${formatDuration(t.elapsedMs)} (${t.progress}%)`);
});

process.exit(0);

