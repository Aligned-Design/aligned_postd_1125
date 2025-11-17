/**
 * Webhook Retry Scheduler
 * Background task scheduler for retrying failed webhook events with exponential backoff
 */

import { webhookHandler } from './webhook-handler';

// ==================== SCHEDULER CONFIGURATION ====================

interface SchedulerConfig {
  enabled: boolean;
  intervalMs: number; // How often to check for pending events
  maxAgeMinutes: number; // Only retry events created within this window
  maxConcurrent: number; // Max events to retry in one batch
}

const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  enabled: true,
  intervalMs: 30000, // Check every 30 seconds
  maxAgeMinutes: 120, // Retry events from last 2 hours
  maxConcurrent: 50, // Retry max 50 events per batch
};

// ==================== WEBHOOK RETRY SCHEDULER ====================

export class WebhookRetryScheduler {
  private config: SchedulerConfig;
  private schedulerId: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private lastRunTime: number | null = null;

  constructor(config?: Partial<SchedulerConfig>) {
    this.config = { ...DEFAULT_SCHEDULER_CONFIG, ...config };
  }

  /**
   * Start the retry scheduler
   */
  public start(): void {
    if (this.isRunning) {
      console.warn('[Webhook Scheduler] Already running');
      return;
    }

    if (!this.config.enabled) {
      console.log('[Webhook Scheduler] Disabled in configuration');
      return;
    }

    this.isRunning = true;
    console.log(
      `[Webhook Scheduler] Starting (interval: ${this.config.intervalMs}ms, maxAge: ${this.config.maxAgeMinutes}m)`
    );

    // Schedule immediate first run
    this.runRetryBatch().catch((error) => {
      console.error('[Webhook Scheduler] First run error:', error);
    });

    // Schedule recurring runs
    this.schedulerId = setInterval(() => {
      this.runRetryBatch().catch((error) => {
        console.error('[Webhook Scheduler] Error in retry batch:', error);
      });
    }, this.config.intervalMs);
  }

  /**
   * Stop the retry scheduler
   */
  public stop(): void {
    if (!this.isRunning) {
      console.warn('[Webhook Scheduler] Not running');
      return;
    }

    if (this.schedulerId) {
      clearInterval(this.schedulerId);
      this.schedulerId = null;
    }

    this.isRunning = false;
    console.log('[Webhook Scheduler] Stopped');
  }

  /**
   * Check if scheduler is running
   */
  public getStatus(): {
    isRunning: boolean;
    lastRunTime: number | null;
    lastRunDuration: number | null;
  } {
    return {
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime,
      lastRunDuration: this.lastRunTime ? Date.now() - this.lastRunTime : null,
    };
  }

  /**
   * Run a single retry batch
   * This is the main processing loop for retrying webhook events
   */
  private async runRetryBatch(): Promise<void> {
    const startTime = Date.now();

    try {
      const result = await webhookHandler.retryPendingEvents(this.config.maxAgeMinutes);

      const duration = Date.now() - startTime;
      this.lastRunTime = startTime;

      if (result.retried > 0 || result.failed > 0) {
        console.log(
          `[Webhook Scheduler] Batch complete (duration: ${duration}ms, retried: ${result.retried}, failed: ${result.failed})`
        );
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[Webhook Scheduler] Batch error (duration: ${duration}ms):`, error);
    }
  }

  /**
   * Manual trigger for immediate retry batch
   * Useful for testing or manual interventions
   */
  public async triggerRetryBatch(): Promise<{ retried: number; failed: number }> {
    console.log('[Webhook Scheduler] Manual retry batch triggered');
    const result = await webhookHandler.retryPendingEvents(this.config.maxAgeMinutes);
    console.log(`[Webhook Scheduler] Manual batch result: retried=${result.retried}, failed=${result.failed}`);
    return result;
  }
}

// ==================== SINGLETON INSTANCE ====================

let schedulerInstance: WebhookRetryScheduler | null = null;

/**
 * Get or create scheduler instance
 */
export function getWebhookRetryScheduler(config?: Partial<SchedulerConfig>): WebhookRetryScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new WebhookRetryScheduler(config);
  }
  return schedulerInstance;
}

/**
 * Initialize and start the webhook retry scheduler
 * Call this during application startup
 */
export function initializeWebhookRetryScheduler(config?: Partial<SchedulerConfig>): WebhookRetryScheduler {
  const scheduler = getWebhookRetryScheduler(config);

  // Only start if not already running
  if (!scheduler.getStatus().isRunning) {
    scheduler.start();
  }

  return scheduler;
}

/**
 * Graceful shutdown of webhook retry scheduler
 * Call this during application shutdown
 */
export function shutdownWebhookRetryScheduler(): void {
  if (schedulerInstance) {
    schedulerInstance.stop();
    schedulerInstance = null;
  }
}
