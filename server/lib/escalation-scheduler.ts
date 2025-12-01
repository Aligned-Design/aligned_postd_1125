/**
 * Escalation Scheduler
 * Background task scheduler for processing escalation events
 * Handles reminders and escalations based on configured rules
 */

import {
  escalationRules,
  escalationEvents,
  postApprovals,
  clientSettings,
} from "./dbClient";
import {
  DEFAULT_ESCALATION_CONFIG,
  type EscalationConfig,
} from "@shared/escalation";

// ==================== ESCALATION SCHEDULER ====================

export class EscalationScheduler {
  private config: EscalationConfig;
  private schedulerId: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private lastRunTime: number | null = null;
  private lastRunDuration: number | null = null;

  constructor(config?: Partial<EscalationConfig>) {
    this.config = { ...DEFAULT_ESCALATION_CONFIG, ...config };
  }

  /**
   * Start the escalation scheduler
   */
  public start(): void {
    if (this.isRunning) {
      console.warn("[Escalation Scheduler] Already running");
      return;
    }

    if (!this.config.enabled) {
      console.log("[Escalation Scheduler] Disabled in configuration");
      return;
    }

    this.isRunning = true;
    console.log(
      `[Escalation Scheduler] Starting (interval: ${this.config.intervalMs}ms, maxAge: ${this.config.maxAgeHours}h)`,
    );

    // Schedule immediate first run
    this.runEscalationBatch().catch((error) => {
      console.error("[Escalation Scheduler] First run error:", error);
    });

    // Schedule recurring runs
    this.schedulerId = setInterval(() => {
      this.runEscalationBatch().catch((error) => {
        console.error(
          "[Escalation Scheduler] Error in escalation batch:",
          error,
        );
      });
    }, this.config.intervalMs);
  }

  /**
   * Stop the escalation scheduler
   */
  public stop(): void {
    if (!this.isRunning) {
      console.warn("[Escalation Scheduler] Not running");
      return;
    }

    if (this.schedulerId) {
      clearInterval(this.schedulerId);
      this.schedulerId = null;
    }

    this.isRunning = false;
    console.log("[Escalation Scheduler] Stopped");
  }

  /**
   * Get scheduler status
   */
  public getStatus(): {
    isRunning: boolean;
    lastRunTime: number | null;
    lastRunDuration: number | null;
  } {
    return {
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime,
      lastRunDuration: this.lastRunDuration,
    };
  }

  /**
   * Run a single escalation batch
   * Main processing loop for pending escalation events
   */
  private async runEscalationBatch(): Promise<{
    processed: number;
    successful: number;
    failed: number;
  }> {
    const startTime = Date.now();

    try {
      // Query pending escalations that are ready to send
      const pendingEscalations = await escalationEvents.getPendingForDelivery(
        this.config.maxAgeHours,
        this.config.maxConcurrent,
      );

      let successful = 0;
      let failed = 0;

      // Process each escalation
      for (const escalation of pendingEscalations) {
        try {
          await this.processEscalation(escalation);
          successful++;
        } catch (error) {
          console.error(
            `[Escalation Scheduler] Failed to process escalation ${escalation.id}:`,
            error,
          );
          failed++;

          // Log failure
          await escalationEvents.logAttemptFailure(
            escalation.id,
            error instanceof Error ? error.message : "Unknown error",
          );
        }
      }

      const duration = Date.now() - startTime;
      this.lastRunTime = startTime;
      this.lastRunDuration = duration;

      if (successful > 0 || failed > 0) {
        console.log(
          `[Escalation Scheduler] Batch complete (duration: ${duration}ms, processed: ${pendingEscalations.length}, successful: ${successful}, failed: ${failed})`,
        );
      }

      return {
        processed: pendingEscalations.length,
        successful,
        failed,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.lastRunDuration = duration;
      console.error(
        `[Escalation Scheduler] Batch error (duration: ${duration}ms):`,
        error,
      );

      return {
        processed: 0,
        successful: 0,
        failed: 1,
      };
    }
  }

  /**
   * Process a single escalation event
   */
  // Define minimal escalation event shape used by scheduler
  private async processEscalation(escalation: {
    id: string;
    approval_id?: string;
    post_id?: string;
    rule_id: string;
    brand_id: string;
    escalation_level: string;
    notification_type?: string;
    escalated_to_user_id?: string;
  }): Promise<void> {
    // Get approval details if present
    let approval: unknown = null;
    if (escalation.approval_id) {
      approval = await postApprovals.getById(escalation.approval_id);
      if (!approval) {
        // If approval_id provided but missing, log and continue (some escalations may target posts instead)
        console.warn(
          `Approval not found for escalation ${escalation.id}: ${escalation.approval_id}`,
        );
      }
    }

    // Get escalation rule for context
    const rule = await escalationRules.getById(escalation.rule_id);
    if (!rule) {
      throw new Error(`Escalation rule not found: ${escalation.rule_id}`);
    }

    // Get brand for notification preferences
    const clientSettingsData = await clientSettings.getByBrandId(
      escalation.brand_id,
    );

    // Check notification preferences
    if (
      !this.shouldSendNotification(
        escalation.escalation_level,
        clientSettingsData,
      )
    ) {
      console.log(
        `[Escalation Scheduler] Skipping escalation ${escalation.id} (notification disabled by user)`,
      );
      await escalationEvents.markAsResolved(
        escalation.id,
        "system",
        "Skipped due to user preferences",
      );
      return;
    }

    // Send notification
    // Database records may have additional properties not in type definitions
    const ruleRecord = rule as unknown as Record<string, unknown>;
    const ruleHasEmail = rule && ruleRecord.send_email;
    if (
      escalation.notification_type === "email" ||
      ruleHasEmail
    ) {
      await this.sendEmailNotification(
        escalation as any,
        approval as any,
        rule as any,
        clientSettingsData,
      );
    }

    // Type assertion: Database records may have send_slack property not in type definitions
    const ruleHasSlack = ruleRecord.send_slack;
    if (
      escalation.notification_type === "slack" ||
      (ruleHasSlack && escalation.notification_type !== "email")
    ) {
      await this.sendSlackNotification(
        escalation as any,
        approval as any,
        rule as any,
      ).catch((err: unknown) => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.warn(
          `[Escalation Scheduler] Failed to send Slack notification: ${errorMessage}`,
        );
      });
    }

    // Mark as sent
    await escalationEvents.markAsSent(escalation.id);
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    escalation: {
      id: string;
      escalated_to_user_id?: string;
      escalation_level: string;
    },
    approval: { post_id?: string; status?: string; created_at?: string },
    rule: { trigger_hours?: number },
    clientSettingsData: unknown,
  ): Promise<void> {
    const recipient = escalation.escalated_to_user_id;
    if (!recipient) {
      throw new Error("No escalation recipient specified");
    }

    try {
      // Determine email template based on escalation level
      const isEscalation = escalation.escalation_level.includes("escalation");
      const subject = isEscalation
        ? `⚠️ Escalation: Approval pending for ${approval.post_id}`
        : `📌 Reminder: Approval pending for ${approval.post_id}`;

      const message = `
Your attention is required. An approval has been pending for ${rule.trigger_hours} hours.

Post ID: ${approval.post_id}
Status: ${approval.status}
Created: ${approval.created_at}
Escalation Level: ${escalation.escalation_level}

Please review and take action at your earliest convenience.
      `.trim();

      // Log email notification (actual sending would use emailService)
      console.log(
        `[Escalation Scheduler] Would send email to ${recipient} for escalation ${escalation.id}:`,
        { subject, message },
      );
    } catch (error) {
      throw new Error(
        `Email notification failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(
    escalation: { id: string },
    _approval: unknown,
    _rule: unknown,
  ): Promise<void> {
    // This would integrate with Slack service (not implemented in this phase)
    // Placeholder for future Slack integration
    console.log(
      `[Escalation Scheduler] Would send Slack notification for escalation ${escalation.id} (not yet implemented)`,
    );
  }

  /**
   * Check if notification should be sent based on user preferences
   */
  private shouldSendNotification(
    escalationLevel: string,
    clientSettings: unknown,
  ): boolean {
    if (!clientSettings) {
      // Default: send if no preferences found
      return true;
    }

    // Type assertion: clientSettings may have approval-related properties
    const settings = clientSettings as Record<string, unknown> | null;
    if (!settings) {
      return true;
    }

    // Check if approval reminders are enabled
    const approvalsNeeded = settings.approvalsNeeded as number | undefined;
    const approvalReminders = settings.approvalReminders as boolean | undefined;
    if (approvalsNeeded === undefined && approvalReminders === undefined) {
      // No preferences set, default to sending
      return true;
    }

    // For escalations (not reminders), always send
    if (escalationLevel.includes("escalation")) {
      return true;
    }

    // For reminders, check if reminder notifications are enabled
    if (escalationLevel.includes("reminder")) {
      return approvalReminders !== false;
    }

    return true;
  }

  /**
   * Manual trigger for immediate escalation processing
   */
  public async triggerEscalationBatch(): Promise<{
    processed: number;
    successful: number;
    failed: number;
  }> {
    console.log("[Escalation Scheduler] Manual escalation batch triggered");
    const result = await this.runEscalationBatch();
    console.log(
      `[Escalation Scheduler] Manual batch result: processed=${result.processed}, successful=${result.successful}, failed=${result.failed}`,
    );
    return result;
  }
}

// ==================== SINGLETON INSTANCE ====================

let schedulerInstance: EscalationScheduler | null = null;

/**
 * Get or create escalation scheduler instance
 */
export function getEscalationScheduler(
  config?: Partial<EscalationConfig>,
): EscalationScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new EscalationScheduler(config);
  }
  return schedulerInstance;
}

/**
 * Initialize and start the escalation scheduler
 * Call this during application startup
 */
export function initializeEscalationScheduler(
  config?: Partial<EscalationConfig>,
): EscalationScheduler {
  const scheduler = getEscalationScheduler(config);

  // Only start if not already running
  if (!scheduler.getStatus().isRunning) {
    scheduler.start();
  }

  return scheduler;
}

/**
 * Graceful shutdown of escalation scheduler
 * Call this during application shutdown
 */
export function shutdownEscalationScheduler(): void {
  if (schedulerInstance) {
    schedulerInstance.stop();
    schedulerInstance = null;
  }
}
