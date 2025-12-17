/**
 * Step-Based Crawler Job Processor (Vercel-Friendly)
 * 
 * DESIGN PRINCIPLES:
 * 1. Process ONE step per invocation
 * 2. Each step completes in <25 seconds
 * 3. No loops, no Promise.all across steps
 * 4. Clear failure modes with error codes
 * 
 * STEP FLOW:
 * fetch → render (if needed) → generate → completed
 *    └─────────────┴──────────────┴────────→ failed (at any point)
 */

import { supabase } from './supabase';
import { logger } from './logger';
import { CrawlStatus } from './crawl-status';
import { CrawlErrorCode, getErrorMessage, isRetryable } from './crawl-error-codes';
import {
  executeFetchStep,
  executeRenderStep,
  executeGenerateStep,
  type StepAResult,
  type StepBResult,
  type StepCResult,
  type StepError,
} from '../workers/crawl-steps';

// ============================================================================
// Constants
// ============================================================================

const MAX_STEP_ATTEMPTS = 3; // Retry failed steps up to 3 times
const BACKOFF_SECONDS = [0, 60, 300]; // 0s, 1min, 5min

// ============================================================================
// Types
// ============================================================================

interface CrawlJob {
  id: string;
  brand_id: string;
  tenant_id: string | null;
  url: string;
  status: string;
  step: string;
  step_attempt: number;
  progress: number;
  raw_data: any;
  rendered_data: any;
  step_timings: any;
  runtime_info: any;
}

// ============================================================================
// Main Entry Point - Process Pending Jobs
// ============================================================================

/**
 * Process pending jobs (called by Vercel Cron every minute)
 * 
 * CRITICAL: This function does ONE thing:
 * 1. Claim 1 job
 * 2. Execute its current step
 * 3. Update state
 * 4. Exit
 * 
 * No loops. No batching. One job, one step, done.
 */
export async function processPendingJobs(): Promise<void> {
  logger.info('[StepProcessor] Processing pending jobs');
  
  // Reap stale jobs first
  await reapStaleJobs();
  
  // Claim ONE job
  const job = await claimNextJob();
  
  if (!job) {
    logger.info('[StepProcessor] No pending jobs');
    return;
  }
  
  // Execute the job's current step
  await executeCurrentStep(job);
  
  logger.info('[StepProcessor] Job step completed', {
    runId: job.id,
    step: job.step,
    status: 'done',
  });
}

// ============================================================================
// Job Claiming (Atomic)
// ============================================================================

async function claimNextJob(): Promise<CrawlJob | null> {
  const workerId = `worker-${process.pid || Math.random().toString(36).substring(7)}`;
  const now = new Date().toISOString();
  
  // Find jobs ready to process
  const { data: candidates, error: selectError } = await supabase
    .from('crawl_runs')
    .select('*')
    .eq('status', CrawlStatus.PENDING)
    .in('step', ['fetch', 'render', 'generate'])
    .or(`next_run_at.is.null,next_run_at.lte.${now}`)
    .order('created_at', { ascending: true })
    .limit(1);
  
  if (selectError || !candidates || candidates.length === 0) {
    return null;
  }
  
  const candidate = candidates[0];
  
  // Atomic claim: set status=processing only if still pending
  const { data: claimed, error: claimError } = await supabase
    .from('crawl_runs')
    .update({
      status: CrawlStatus.PROCESSING,
      started_at: now,
      updated_at: now,
      runtime_info: { worker_id: workerId, claimed_at: now },
    })
    .eq('id', candidate.id)
    .eq('status', CrawlStatus.PENDING)
    .select('*')
    .single();
  
  if (claimError || !claimed) {
    logger.debug('[StepProcessor] Job already claimed', { runId: candidate.id });
    return null;
  }
  
  logger.info('[StepProcessor] Job claimed', {
    runId: claimed.id,
    step: claimed.step,
    attempt: claimed.step_attempt,
    workerId,
  });
  
  return claimed as CrawlJob;
}

// ============================================================================
// Step Execution Router
// ============================================================================

async function executeCurrentStep(job: CrawlJob): Promise<void> {
  const startTime = Date.now();
  
  logger.info('[StepProcessor] Executing step', {
    runId: job.id,
    step: job.step,
    attempt: job.step_attempt,
    url: job.url,
  });
  
  try {
    switch (job.step) {
      case 'fetch':
        await executeFetchStepForJob(job);
        break;
      
      case 'render':
        await executeRenderStepForJob(job);
        break;
      
      case 'generate':
        await executeGenerateStepForJob(job);
        break;
      
      default:
        throw new Error(`Unknown step: ${job.step}`);
    }
    
    const durationMs = Date.now() - startTime;
    logger.info('[StepProcessor] Step completed', {
      runId: job.id,
      step: job.step,
      durationMs,
    });
    
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    logger.error('[StepProcessor] Step failed', {
      runId: job.id,
      step: job.step,
      error: error.message,
      durationMs,
    });
    
    await handleStepFailure(job, {
      code: CrawlErrorCode.UNKNOWN_ERROR,
      message: error.message || 'Unknown error',
    });
  }
}

// ============================================================================
// Step A: Fetch (HTTP-only, fast)
// ============================================================================

async function executeFetchStepForJob(job: CrawlJob): Promise<void> {
  await updateProgress(job.id, 10, 'Fetching website...');
  
  const result = await executeFetchStep(job.url);
  
  // Check if it's an error
  if ('code' in result) {
    return await handleStepFailure(job, result as StepError);
  }
  
  const fetchResult = result as StepAResult;
  
  // Store raw data
  const { error: updateError } = await supabase
    .from('crawl_runs')
    .update({
      raw_data: fetchResult,
      step_timings: {
        ...job.step_timings,
        fetch: fetchResult.durationMs,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', job.id);
  
  if (updateError) {
    logger.error('[StepA] Failed to store results', { runId: job.id, error: updateError });
  }
  
  // Decide next step
  if (fetchResult.needsBrowser && fetchResult.logoCandidates.length < 2) {
    // Need browser render
    await advanceToStep(job.id, 'render', 30);
  } else {
    // Skip render, go straight to generate
    await advanceToStep(job.id, 'generate', 50);
  }
}

// ============================================================================
// Step B: Render (Browser, optional)
// ============================================================================

async function executeRenderStepForJob(job: CrawlJob): Promise<void> {
  await updateProgress(job.id, 40, 'Rendering website...');
  
  const rawData = job.raw_data as StepAResult;
  const result = await executeRenderStep(job.url, rawData);
  
  // Check if it's an error
  if ('code' in result) {
    // Render failed, but we can still proceed with just fetch data
    logger.warn('[StepB] Render failed, continuing with fetch data only', {
      runId: job.id,
      error: (result as StepError).code,
    });
    
    // Skip to generate
    await advanceToStep(job.id, 'generate', 50);
    return;
  }
  
  const renderResult = result as StepBResult;
  
  // Store rendered data
  const { error: updateError } = await supabase
    .from('crawl_runs')
    .update({
      rendered_data: renderResult,
      step_timings: {
        ...job.step_timings,
        render: renderResult.durationMs,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', job.id);
  
  if (updateError) {
    logger.error('[StepB] Failed to store results', { runId: job.id, error: updateError });
  }
  
  // Advance to generate
  await advanceToStep(job.id, 'generate', 60);
}

// ============================================================================
// Step C: Generate (AI)
// ============================================================================

async function executeGenerateStepForJob(job: CrawlJob): Promise<void> {
  await updateProgress(job.id, 70, 'Generating brand kit...');
  
  const rawData = job.raw_data as StepAResult;
  const renderedData = job.rendered_data as StepBResult | undefined;
  
  const result = await executeGenerateStep(job.url, rawData, renderedData);
  
  // Check if it's an error
  if ('code' in result) {
    return await handleStepFailure(job, result as StepError);
  }
  
  const generateResult = result as StepCResult;
  
  // Mark as completed
  await completeJob(job.id, job.brand_id, generateResult.brandKit, {
    ...job.step_timings,
    generate: generateResult.durationMs,
  });
}

// ============================================================================
// State Transitions
// ============================================================================

async function advanceToStep(runId: string, nextStep: string, progress: number): Promise<void> {
  const { error } = await supabase
    .from('crawl_runs')
    .update({
      step: nextStep,
      step_attempt: 0, // Reset attempt counter for new step
      progress,
      status: CrawlStatus.PENDING, // Back to pending for next cron tick
      updated_at: new Date().toISOString(),
    })
    .eq('id', runId);
  
  if (error) {
    logger.error('[StepProcessor] Failed to advance step', { runId, nextStep, error });
  } else {
    logger.info('[StepProcessor] Advanced to next step', { runId, nextStep, progress });
  }
}

async function completeJob(runId: string, brandId: string, brandKit: any, timings: any): Promise<void> {
  const now = new Date().toISOString();
  
  const { error } = await supabase
    .from('crawl_runs')
    .update({
      status: CrawlStatus.COMPLETED,
      step: 'completed',
      progress: 100,
      brand_kit: brandKit,
      step_timings: timings,
      finished_at: now,
      updated_at: now,
    })
    .eq('id', runId);
  
  if (error) {
    logger.error('[StepProcessor] Failed to complete job', { runId, error });
  } else {
    logger.info('[StepProcessor] Job completed', { runId, brandId });
  }
}

async function handleStepFailure(job: CrawlJob, stepError: StepError): Promise<void> {
  const canRetry = isRetryable(stepError.code) && job.step_attempt < MAX_STEP_ATTEMPTS - 1;
  
  if (canRetry) {
    // Retry with backoff
    const nextAttempt = job.step_attempt + 1;
    const backoffSeconds = BACKOFF_SECONDS[nextAttempt] || BACKOFF_SECONDS[BACKOFF_SECONDS.length - 1];
    const nextRunAt = new Date(Date.now() + backoffSeconds * 1000).toISOString();
    
    logger.warn('[StepProcessor] Step failed, will retry', {
      runId: job.id,
      step: job.step,
      attempt: job.step_attempt,
      nextAttempt,
      backoffSeconds,
      errorCode: stepError.code,
    });
    
    await supabase
      .from('crawl_runs')
      .update({
        status: CrawlStatus.PENDING,
        step_attempt: nextAttempt,
        next_run_at: nextRunAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id);
    
  } else {
    // Fail permanently
    logger.error('[StepProcessor] Step failed permanently', {
      runId: job.id,
      step: job.step,
      attempt: job.step_attempt,
      errorCode: stepError.code,
      errorMessage: stepError.message,
    });
    
    const now = new Date().toISOString();
    
    await supabase
      .from('crawl_runs')
      .update({
        status: CrawlStatus.FAILED,
        step: 'failed',
        error_code: stepError.code,
        error_message: getErrorMessage(stepError.code),
        finished_at: now,
        updated_at: now,
      })
      .eq('id', job.id);
  }
}

// ============================================================================
// Progress Updates (Heartbeat)
// ============================================================================

async function updateProgress(runId: string, progress: number, message?: string): Promise<void> {
  const { error } = await supabase
    .from('crawl_runs')
    .update({
      progress,
      updated_at: new Date().toISOString(),
    })
    .eq('id', runId);
  
  if (error) {
    logger.warn('[StepProcessor] Heartbeat failed', { runId, progress, error: error.message });
  } else {
    logger.info('[StepProcessor] Heartbeat', { runId, progress, message });
  }
}

// ============================================================================
// Stale Job Reaper
// ============================================================================

async function reapStaleJobs(): Promise<void> {
  const staleThresholdMinutes = 10;
  const staleThreshold = new Date(Date.now() - staleThresholdMinutes * 60 * 1000).toISOString();
  
  const { data: staleJobs, error: selectError } = await supabase
    .from('crawl_runs')
    .select('id, brand_id, url')
    .eq('status', CrawlStatus.PROCESSING)
    .lt('updated_at', staleThreshold);
  
  if (selectError || !staleJobs || staleJobs.length === 0) {
    return;
  }
  
  logger.warn('[StepProcessor] Found stale jobs', {
    count: staleJobs.length,
    threshold: staleThreshold,
  });
  
  const now = new Date().toISOString();
  
  for (const job of staleJobs) {
    await supabase
      .from('crawl_runs')
      .update({
        status: CrawlStatus.FAILED,
        step: 'failed',
        error_code: CrawlErrorCode.STALE_JOB_TIMEOUT,
        error_message: getErrorMessage(CrawlErrorCode.STALE_JOB_TIMEOUT),
        finished_at: now,
        updated_at: now,
      })
      .eq('id', job.id);
    
    logger.info('[StepProcessor] Reaped stale job', {
      runId: job.id,
      brandId: job.brand_id,
      url: job.url,
    });
  }
}

