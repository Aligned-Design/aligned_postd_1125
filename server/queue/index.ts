/**
 * Bull Queue Configuration & Initialization
 *
 * Provides:
 * - publishJobQueue: Main queue for content publishing jobs
 * - Retry logic with exponential backoff + jitter (1s, 3s, 9s, 27s)
 * - Health monitoring & metrics
 * - Job event handlers (queued, active, completed, failed, etc.)
 *
 * Usage:
 * import { publishJobQueue, initializeQueues } from './queue';
 *
 * await initializeQueues();
 *
 * // Add job
 * const job = await publishJobQueue.add('publish', { ... }, {
 *   jobId: 'idempotency-key',
 *   removeOnComplete: true,
 * });
 *
 * // Listen to events
 * job.on('completed', () => { ... });
 */

import Queue from 'bull';
import Redis from 'ioredis';
import pino from 'pino';

const logger = pino();

// ============================================================================
// QUEUE CONFIGURATION
// ============================================================================

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null, // Required for blocking commands
  enableReadyCheck: false,
};

// Retry settings with exponential backoff + jitter
const RETRY_CONFIG = {
  maxAttempts: 4,
  baseDelayMs: 1000, // 1 second
  multiplier: 3, // 1s, 3s, 9s, 27s
  maxDelayMs: 60000, // 60 second cap
  jitterMs: 1000, // 0-1000ms jitter
};

// ============================================================================
// QUEUE INSTANCES
// ============================================================================

export const publishJobQueue = new Queue('publish_jobs', {
  redis: REDIS_CONFIG,
  settings: {
    stalledInterval: 5000, // Check for stalled jobs every 5s
    maxStalledCount: 2, // Mark as stalled after 2 checks
    lockDuration: 30000, // Lock duration: 30 seconds
    lockRenewTime: 15000, // Renew lock every 15s
    maxRetriesPerRequest: null, // Required for blocking
  },
  defaultJobOptions: {
    attempts: RETRY_CONFIG.maxAttempts,
    backoff: {
      type: 'exponential',
      delay: RETRY_CONFIG.baseDelayMs,
    },
    removeOnComplete: {
      age: 3600, // Remove completed jobs after 1 hour
      isPattern: false,
    },
    removeOnFail: false, // Keep failed jobs for inspection
  },
});

export const healthCheckQueue = new Queue('health_checks', {
  redis: REDIS_CONFIG,
  settings: {
    stalledInterval: 10000,
    maxStalledCount: 2,
    lockDuration: 30000,
  },
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
  },
});

export const tokenRefreshQueue = new Queue('token_refresh', {
  redis: REDIS_CONFIG,
  settings: {
    stalledInterval: 10000,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
  },
});

// ============================================================================
// QUEUE EVENT HANDLERS
// ============================================================================

function setupQueueEventHandlers(queue: Queue.Queue<any>, queueName: string): void {
  // Job queued
  queue.on('waiting', (jobId: string) => {
    logger.info({ jobId, queueName }, 'Job waiting');
  });

  // Job processing started
  queue.on('active', (job: Queue.Job<any>) => {
    logger.info(
      {
        jobId: job.id,
        queueName,
        attemptOf: `${job.attemptsMade + 1}/${job.opts.attempts}`,
      },
      'Job processing started'
    );
  });

  // Job completed
  queue.on('completed', (job: Queue.Job<any>) => {
    logger.info(
      {
        jobId: job.id,
        queueName,
        processingTimeMs: Date.now() - job.processedOn!,
      },
      'Job completed'
    );
  });

  // Job failed
  queue.on('failed', (job: Queue.Job<any>, error: Error) => {
    logger.warn(
      {
        jobId: job.id,
        queueName,
        attemptOf: `${job.attemptsMade + 1}/${job.opts.attempts}`,
        error: error.message,
      },
      'Job failed'
    );
  });

  // Job stalled
  queue.on('stalled', (jobId: string) => {
    logger.error({ jobId, queueName }, 'Job stalled (worker may have crashed)');
  });

  // Queue error
  queue.on('error', (error: Error) => {
    logger.error({ queueName, error: error.message }, 'Queue error');
  });
}

// ============================================================================
// RETRY LOGIC WITH EXPONENTIAL BACKOFF
// ============================================================================

export function calculateRetryDelay(attemptNumber: number): number {
  /**
   * Calculate delay for retry attempt
   * Formula: baseDelay × multiplier^attemptNumber + jitter
   *
   * Attempt 0 (1st try): ~1000ms
   * Attempt 1 (2nd try): ~3000ms
   * Attempt 2 (3rd try): ~9000ms
   * Attempt 3 (4th try): ~27000ms
   */
  const exponentialDelay = RETRY_CONFIG.baseDelayMs * Math.pow(RETRY_CONFIG.multiplier, attemptNumber);
  const jitter = Math.random() * RETRY_CONFIG.jitterMs;
  const totalDelay = Math.min(exponentialDelay + jitter, RETRY_CONFIG.maxDelayMs);

  return Math.round(totalDelay);
}

// ============================================================================
// QUEUE MONITORING & HEALTH
// ============================================================================

export interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
  isPaused: boolean;
}

export async function getQueueStats(queue: Queue.Queue<any>): Promise<QueueStats> {
  const counts = await queue.getJobCounts();
  const isPaused = queue.isPaused();

  return {
    name: queue.name,
    waiting: counts.waiting,
    active: counts.active,
    completed: counts.completed,
    failed: counts.failed,
    delayed: counts.delayed,
    paused: counts.paused,
    isPaused,
  };
}

export async function getQueueHealth(): Promise<{
  status: 'healthy' | 'warning' | 'critical';
  queues: QueueStats[];
  totalJobs: number;
  failedJobs: number;
}> {
  const queues = [publishJobQueue, healthCheckQueue, tokenRefreshQueue];
  const stats = await Promise.all(queues.map(getQueueStats));

  const totalJobs = stats.reduce((sum, s) => sum + s.waiting + s.active, 0);
  const failedJobs = stats.reduce((sum, s) => sum + s.failed, 0);

  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (failedJobs > 100) status = 'critical';
  else if (failedJobs > 10) status = 'warning';

  return { status, queues: stats, totalJobs, failedJobs };
}

// ============================================================================
// QUEUE INITIALIZATION
// ============================================================================

let queuesInitialized = false;

export async function initializeQueues(): Promise<void> {
  if (queuesInitialized) {
    logger.debug('Queues already initialized');
    return;
  }

  try {
    logger.info(`Initializing Bull queues with Redis at ${REDIS_CONFIG.host}:${REDIS_CONFIG.port}`);

    // Setup event handlers
    setupQueueEventHandlers(publishJobQueue, 'publish_jobs');
    setupQueueEventHandlers(healthCheckQueue, 'health_checks');
    setupQueueEventHandlers(tokenRefreshQueue, 'token_refresh');

    // Test Redis connection
    const testKey = 'bull-queue-test-' + Date.now();
    await publishJobQueue.client.set(testKey, 'ok', 'EX', 10);
    const testValue = await publishJobQueue.client.get(testKey);

    if (testValue === 'ok') {
      logger.info('✓ Redis connection successful');
    } else {
      throw new Error('Redis set/get test failed');
    }

    // Log queue initialization
    logger.info(
      {
        retry: RETRY_CONFIG,
        redis: `${REDIS_CONFIG.host}:${REDIS_CONFIG.port}`,
      },
      '✓ Bull queues initialized successfully'
    );

    queuesInitialized = true;
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : String(error) },
      '❌ Queue initialization failed'
    );
    throw error;
  }
}

// ============================================================================
// QUEUE CLEANUP (For graceful shutdown)
// ============================================================================

export async function closeQueues(): Promise<void> {
  try {
    logger.info('Closing Bull queues...');
    await Promise.all([
      publishJobQueue.close(),
      healthCheckQueue.close(),
      tokenRefreshQueue.close(),
    ]);
    logger.info('✓ Queues closed successfully');
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Error closing queues'
    );
  }
}

// ============================================================================
// GRACEFUL SHUTDOWN HANDLER
// ============================================================================

export function registerShutdownHandlers(): void {
  const handleShutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully...`);
    await closeQueues();
    process.exit(0);
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

export default {
  publishJobQueue,
  healthCheckQueue,
  tokenRefreshQueue,
  initializeQueues,
  closeQueues,
  registerShutdownHandlers,
  getQueueHealth,
  calculateRetryDelay,
};
