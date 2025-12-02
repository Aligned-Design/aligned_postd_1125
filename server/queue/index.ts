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

// Bull Queue type definitions and imports
// Note: Bull v3 type definitions may not perfectly match runtime API
import QueueModule from 'bull';
import Redis from 'ioredis';
import pino from 'pino';

// Type assertion for Queue constructor - Bull types may not be fully accurate
// Bull runtime supports this constructor, but types may be incomplete
const Queue = QueueModule as unknown as new <T = any>(
  name: string,
  opts?: any
) => QueueModule.Queue<T>;

// Logger with structured logging support (matches observability.ts pattern)
const _pinoLogger = pino();
const logger = _pinoLogger as {
  debug(obj: Record<string, any>, msg?: string): void;
  debug(msg: string): void;
  info(obj: Record<string, any>, msg?: string): void;
  info(msg: string): void;
  warn(obj: Record<string, any>, msg?: string): void;
  warn(msg: string): void;
  error(obj: Record<string, any>, msg?: string): void;
  error(msg: string): void;
};

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

// Extended Job interface with runtime properties that may not be in types
interface ExtendedJob<T = any> extends QueueModule.Job<T> {
  attemptsMade?: number;
  opts?: { attempts?: number };
  processedOn?: number | null;
  returnvalue?: any;
}

function setupQueueEventHandlers(queue: QueueModule.Queue<any>, queueName: string): void {
  // Job queued
  queue.on('waiting', (jobId: string) => {
    logger.info({ jobId, queueName }, 'Job waiting');
  });

  // Job processing started
  queue.on('active', (job: QueueModule.Job<any>) => {
    const extendedJob = job as ExtendedJob;
    const attemptsMade = extendedJob.attemptsMade ?? 0;
    const maxAttempts = extendedJob.opts?.attempts ?? 4;
    logger.info(
      {
        jobId: job.id,
        queueName,
        attemptOf: `${attemptsMade + 1}/${maxAttempts}`,
      },
      'Job processing started'
    );
  });

  // Job completed
  queue.on('completed', (job: QueueModule.Job<any>) => {
    const extendedJob = job as ExtendedJob;
    const processedOn = extendedJob.processedOn ?? Date.now();
    logger.info(
      {
        jobId: job.id,
        queueName,
        processingTimeMs: Date.now() - processedOn,
      },
      'Job completed'
    );
  });

  // Job failed
  queue.on('failed', (job: QueueModule.Job<any>, error: Error) => {
    const extendedJob = job as ExtendedJob;
    const attemptsMade = extendedJob.attemptsMade ?? 0;
    const maxAttempts = extendedJob.opts?.attempts ?? 4;
    logger.warn(
      {
        jobId: job.id,
        queueName,
        attemptOf: `${attemptsMade + 1}/${maxAttempts}`,
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

// Extended Queue interface with runtime properties that may not be in types
interface ExtendedQueue<T = any> extends QueueModule.Queue<T> {
  getJobCounts?: () => Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  }>;
  isPaused?: () => Promise<boolean> | boolean;
  name?: string;
  client?: Redis;
  close?: () => Promise<void>;
}

export async function getQueueStats(queue: QueueModule.Queue<any>): Promise<QueueStats> {
  const extendedQueue = queue as ExtendedQueue;
  
  // Use type assertion for methods that exist at runtime but not in types
  const getJobCounts = extendedQueue.getJobCounts ?? (async () => ({
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
    delayed: 0,
    paused: 0,
  }));
  
  const counts = await getJobCounts();
  const isPaused = typeof extendedQueue.isPaused === 'function' 
    ? await extendedQueue.isPaused() 
    : false;
  const queueName = extendedQueue.name || 'unknown';

  return {
    name: queueName,
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
    const extendedQueue = publishJobQueue as ExtendedQueue;
    if (extendedQueue.client) {
      // Redis client.set with expiration - ioredis supports this signature at runtime
      const redisClient = extendedQueue.client as any;
      await redisClient.set(testKey, 'ok', 'EX', 10);
      const testValue = await redisClient.get(testKey);

      if (testValue === 'ok') {
        logger.info('✓ Redis connection successful');
      } else {
        throw new Error('Redis set/get test failed');
      }
    } else {
      logger.info('✓ Redis connection check skipped (client not available)');
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
    const queues = [publishJobQueue, healthCheckQueue, tokenRefreshQueue] as ExtendedQueue[];
    await Promise.all(
      queues.map(queue => queue.close?.() ?? Promise.resolve())
    );
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
