/**
 * Bull Queue Workers - Job Processing
 *
 * Processes jobs from the publish_jobs queue:
 * - publish: Publish content to platform
 * - retry: Retry failed publish job
 * - health_check: Verify connection health
 * - token_refresh: Refresh authentication tokens
 *
 * Usage:
 * import { startWorkers } from './workers';
 * await startWorkers();
 */

import Queue from 'bull';
import pino from 'pino';
import { publishJobQueue, healthCheckQueue, tokenRefreshQueue, calculateRetryDelay } from './index';

const logger = pino();

// ============================================================================
// JOB TYPES & INTERFACES
// ============================================================================

export interface PublishJobData {
  jobId: string;
  tenantId: string;
  connectionId: string;
  platform: string;
  contentType: string;
  title: string;
  body: string;
  mediaUrls?: string[];
  scheduledFor?: string;
  idempotencyKey: string;
}

export interface HealthCheckJobData {
  connectionId: string;
  tenantId: string;
  platform: string;
}

export interface TokenRefreshJobData {
  connectionId: string;
  tenantId: string;
  platform: string;
}

// ============================================================================
// PUBLISH JOB WORKER
// ============================================================================

async function processPublishJob(job: Queue.Job<PublishJobData>): Promise<any> {
  const { jobId, tenantId, connectionId, platform, body, scheduledFor } = job.data;

  logger.info(
    {
      jobId,
      tenantId,
      connectionId,
      platform,
      attempt: `${job.attemptsMade + 1}/${job.opts.attempts}`,
    },
    'Processing publish job'
  );

  try {
    // Future work: Implement actual platform publishing logic
    // This is a placeholder that simulates the publishing process

    // Step 1: Load encrypted token from vault
    // const token = await vault.retrieveSecret(tenantId, connectionId, 'access_token');

    // Step 2: Validate token is not expired
    // if (isTokenExpired(token)) {
    //   // Queue token refresh job and retry after
    //   throw new Error('TOKEN_EXPIRED');
    // }

    // Step 3: Call platform API
    // const result = await platformApis[platform].publish(token, job.data);

    // Step 4: Store result in database
    // await supabase.from('publish_jobs').update({
    //   status: 'published',
    //   platform_post_id: result.postId,
    // }).eq('id', jobId);

    // Simulate processing
    logger.debug({ jobId }, 'Publishing to platform...');
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true,
      postId: `post_${Date.now()}`,
      platform,
      publishedAt: new Date().toISOString(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = extractErrorCode(errorMessage);
    const isRetryable = isRetryableError(errorCode);

    logger.error(
      {
        jobId,
        platform,
        error: errorMessage,
        errorCode,
        isRetryable,
        attempt: `${job.attemptsMade + 1}/${job.opts.attempts}`,
      },
      'Publish job failed'
    );

    // Store error in database
    // await supabase.from('publish_job_errors').insert({
    //   publish_job_id: jobId,
    //   error_code: errorCode,
    //   error_message: errorMessage,
    //   is_retryable: isRetryable,
    //   retry_attempt_number: job.attemptsMade,
    // });

    if (!isRetryable || job.attemptsMade >= (job.opts.attempts || 4) - 1) {
      // Move to DLQ
      await publishJobQueue.add(
        'dlq',
        {
          ...job.data,
          dlqReason: isRetryable ? 'Max retries exceeded' : 'Unretryable error: ' + errorCode,
          originalError: errorMessage,
        },
        {
          jobId: `dlq_${jobId}_${Date.now()}`,
          removeOnComplete: false,
          removeOnFail: false,
        }
      );

      logger.error({ jobId, errorCode }, 'Job moved to DLQ');
      throw error; // Bull will mark as failed
    } else {
      // Bull will auto-retry with exponential backoff
      throw error;
    }
  }
}

// ============================================================================
// HEALTH CHECK WORKER
// ============================================================================

async function processHealthCheck(job: Queue.Job<HealthCheckJobData>): Promise<any> {
  const { connectionId, tenantId, platform } = job.data;

  logger.info(
    {
      connectionId,
      platform,
    },
    'Running health check'
  );

  try {
    // Future work: Implement platform-specific health check
    // 1. Get token from vault
    // 2. Call platform /me or equivalent endpoint
    // 3. Update connection.last_health_check and connection.health_status
    // 4. Log result to connection_health_log

    // Simulate health check
    await new Promise(resolve => setTimeout(resolve, 50));

    return {
      status: 'healthy',
      latencyMs: 45,
      platform,
    };
  } catch (error) {
    logger.error(
      {
        connectionId,
        platform,
        error: error instanceof Error ? error.message : String(error),
      },
      'Health check failed'
    );
    throw error;
  }
}

// ============================================================================
// TOKEN REFRESH WORKER
// ============================================================================

async function processTokenRefresh(job: Queue.Job<TokenRefreshJobData>): Promise<any> {
  const { connectionId, tenantId, platform } = job.data;

  logger.info(
    {
      connectionId,
      platform,
    },
    'Refreshing access token'
  );

  try {
    // Future work: Implement token refresh
    // 1. Get refresh token from vault
    // 2. Call platform OAuth /token endpoint
    // 3. Get new access token
    // 4. Encrypt and store in vault
    // 5. Update connection.last_token_refresh and token_expires_at

    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true,
      expiresIn: 3600,
      platform,
    };
  } catch (error) {
    logger.error(
      {
        connectionId,
        platform,
        error: error instanceof Error ? error.message : String(error),
      },
      'Token refresh failed'
    );

    // Mark connection as requiring reconnect
    // await supabase.from('connections').update({
    //   status: 'attention',
    //   requires_reconnect: true,
    // }).eq('id', connectionId);

    throw error;
  }
}

// ============================================================================
// DLQ HANDLER (Dead Letter Queue)
// ============================================================================

async function processDLQJob(job: Queue.Job<any>): Promise<any> {
  const { jobId, dlqReason, originalError } = job.data;

  logger.error(
    {
      jobId,
      dlqReason,
      originalError,
    },
    'Job in DLQ awaiting manual intervention'
  );

  // Future work: Implement Dead Letter Queue (DLQ) handling for failed jobs
  // 1. Update publish_jobs.status = 'dlq'
  // 2. Send alert to #engineering-alerts in Slack
  // 3. Log to DLQ dashboard in Datadog

  return {
    dlqProcessed: true,
    jobId,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// ERROR CLASSIFICATION & RETRY LOGIC
// ============================================================================

function extractErrorCode(errorMessage: string): string {
  const codeMatch = errorMessage.match(/\b(AUTH_FAILED|RATE_LIMIT_EXCEEDED|TIMEOUT|SERVER_ERROR|NETWORK_ERROR|VALIDATION_ERROR|TOKEN_EXPIRED|PERMISSION_DENIED)\b/);
  return codeMatch ? codeMatch[1] : 'UNKNOWN_ERROR';
}

function isRetryableError(errorCode: string): boolean {
  const retryableErrors = ['RATE_LIMIT_EXCEEDED', 'TIMEOUT', 'SERVER_ERROR', 'NETWORK_ERROR', 'TOKEN_EXPIRED'];
  return retryableErrors.includes(errorCode);
}

// ============================================================================
// WORKER REGISTRATION
// ============================================================================

export async function registerWorkers(): Promise<void> {
  logger.info('Registering Bull queue workers...');

  // Publish job worker
  publishJobQueue.process('publish', 5, processPublishJob); // 5 concurrent jobs
  publishJobQueue.process('dlq', 1, processDLQJob);

  // Health check worker
  healthCheckQueue.process('health_check', 10, processHealthCheck); // 10 concurrent

  // Token refresh worker
  tokenRefreshQueue.process('token_refresh', 5, processTokenRefresh); // 5 concurrent

  logger.info('✓ All workers registered');
}

// ============================================================================
// WORKER EVENT LISTENERS
// ============================================================================

export function setupWorkerListeners(): void {
  // Publish job events
  publishJobQueue.on('completed', (job: Queue.Job<PublishJobData>) => {
    logger.info(
      {
        jobId: job.id,
        result: job.returnvalue,
      },
      'Publish job completed'
    );
  });

  publishJobQueue.on('failed', (job: Queue.Job<PublishJobData>, error: Error) => {
    logger.error(
      {
        jobId: job.id,
        error: error.message,
      },
      'Publish job failed'
    );
  });

  // Health check events
  healthCheckQueue.on('completed', (job: Queue.Job<HealthCheckJobData>) => {
    logger.debug(
      {
        connectionId: job.data.connectionId,
        result: job.returnvalue,
      },
      'Health check completed'
    );
  });

  // Token refresh events
  tokenRefreshQueue.on('completed', (job: Queue.Job<TokenRefreshJobData>) => {
    logger.info(
      {
        connectionId: job.data.connectionId,
      },
      'Token refresh completed'
    );
  });

  tokenRefreshQueue.on('failed', (job: Queue.Job<TokenRefreshJobData>, error: Error) => {
    logger.error(
      {
        connectionId: job.data.connectionId,
        error: error.message,
      },
      'Token refresh failed'
    );
  });
}

// ============================================================================
// START WORKERS
// ============================================================================

export async function startWorkers(): Promise<void> {
  await registerWorkers();
  setupWorkerListeners();
  logger.info('🚀 Bull queue workers started');
}

export default {
  registerWorkers,
  setupWorkerListeners,
  startWorkers,
};
