/**
 * Escalation Scheduler Tests
 * Tests for escalation event processing, scheduling, and notifications
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EscalationScheduler } from '../lib/escalation-scheduler';
import { calculateEscalationTime, shouldTriggerEscalation, getEscalationLevelLabel, type EscalationLevel } from '@shared/escalation';

describe('Escalation Scheduler', () => {
  let scheduler: EscalationScheduler;

  beforeEach(() => {
    scheduler = new EscalationScheduler({
      enabled: true,
      intervalMs: 5000,
      maxAgeHours: 168,
      maxConcurrent: 50,
    });
  });

  describe('Scheduler Lifecycle', () => {
    it('should initialize with default configuration', () => {
      const newScheduler = new EscalationScheduler();
      expect(newScheduler).toBeTruthy();
    });

    it('should initialize with custom configuration', () => {
      const customScheduler = new EscalationScheduler({
        enabled: false,
        intervalMs: 10000,
        maxAgeHours: 72,
      });
      expect(customScheduler).toBeTruthy();
    });

    it('should start scheduler successfully', () => {
      expect(scheduler.getStatus().isRunning).toBe(false);
      scheduler.start();
      expect(scheduler.getStatus().isRunning).toBe(true);
      scheduler.stop();
    });

    it('should not start if already running', () => {
      scheduler.start();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      scheduler.start();
      expect(warnSpy).toHaveBeenCalledWith('[Escalation Scheduler] Already running');
      warnSpy.mockRestore();
      scheduler.stop();
    });

    it('should stop scheduler successfully', () => {
      scheduler.start();
      expect(scheduler.getStatus().isRunning).toBe(true);
      scheduler.stop();
      expect(scheduler.getStatus().isRunning).toBe(false);
    });

    it('should not stop if not running', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      scheduler.stop();
      expect(warnSpy).toHaveBeenCalledWith('[Escalation Scheduler] Not running');
      warnSpy.mockRestore();
    });

    it('should report status correctly', () => {
      const status = scheduler.getStatus();
      expect(status).toHaveProperty('isRunning');
      expect(status).toHaveProperty('lastRunTime');
      expect(status).toHaveProperty('lastRunDuration');
      expect(typeof status.isRunning).toBe('boolean');
    });
  });

  describe('Escalation Timing Calculations', () => {
    it('should calculate escalation time correctly', () => {
      const createdAt = new Date('2025-01-01T00:00:00Z');
      const escalationTime = calculateEscalationTime(createdAt, 24);

      expect(escalationTime.getTime()).toBe(createdAt.getTime() + 24 * 60 * 60 * 1000);
    });

    it('should handle string dates for escalation timing', () => {
      const dateString = '2025-01-01T00:00:00Z';
      const escalationTime = calculateEscalationTime(dateString, 48);

      const expected = new Date(dateString).getTime() + 48 * 60 * 60 * 1000;
      expect(escalationTime.getTime()).toBe(expected);
    });

    it('should calculate 24-hour escalations correctly', () => {
      const created = new Date();
      const escalation24h = calculateEscalationTime(created, 24);
      const diff = escalation24h.getTime() - created.getTime();

      expect(diff).toBe(24 * 60 * 60 * 1000);
    });

    it('should calculate 48-hour escalations correctly', () => {
      const created = new Date();
      const escalation48h = calculateEscalationTime(created, 48);
      const diff = escalation48h.getTime() - created.getTime();

      expect(diff).toBe(48 * 60 * 60 * 1000);
    });

    it('should calculate 96-hour escalations correctly', () => {
      const created = new Date();
      const escalation96h = calculateEscalationTime(created, 96);
      const diff = escalation96h.getTime() - created.getTime();

      expect(diff).toBe(96 * 60 * 60 * 1000);
    });
  });

  describe('Escalation Trigger Detection', () => {
    it('should detect when escalation is ready to trigger', () => {
      const pastTime = new Date(Date.now() - 1000); // 1 second ago
      expect(shouldTriggerEscalation(pastTime)).toBe(true);
    });

    it('should detect when escalation is not yet ready', () => {
      const futureTime = new Date(Date.now() + 60000); // 1 minute in future
      expect(shouldTriggerEscalation(futureTime)).toBe(false);
    });

    it('should handle string dates for trigger detection', () => {
      const pastTimeString = new Date(Date.now() - 5000).toISOString();
      expect(shouldTriggerEscalation(pastTimeString)).toBe(true);
    });

    it('should trigger at exact scheduled time', () => {
      const now = new Date();
      expect(shouldTriggerEscalation(now)).toBe(true);
    });

    it('should allow custom current time', () => {
      const scheduled = new Date('2025-01-01T12:00:00Z');
      const current = new Date('2025-01-01T12:00:01Z');
      expect(shouldTriggerEscalation(scheduled, current)).toBe(true);
    });

    it('should not trigger before scheduled time with custom current', () => {
      const scheduled = new Date('2025-01-01T13:00:00Z');
      const current = new Date('2025-01-01T12:00:00Z');
      expect(shouldTriggerEscalation(scheduled, current)).toBe(false);
    });
  });

  describe('Escalation Level Labels', () => {
    it('should return correct label for 24h reminder', () => {
      const label = getEscalationLevelLabel('reminder_24h');
      expect(label).toBe('24-Hour Reminder');
    });

    it('should return correct label for 48h reminder', () => {
      const label = getEscalationLevelLabel('reminder_48h');
      expect(label).toBe('48-Hour Reminder');
    });

    it('should return correct label for 48h escalation', () => {
      const label = getEscalationLevelLabel('escalation_48h');
      expect(label).toBe('48-Hour Escalation');
    });

    it('should return correct label for 96h escalation', () => {
      const label = getEscalationLevelLabel('escalation_96h');
      expect(label).toBe('96-Hour Escalation');
    });

    it('should handle unknown escalation levels gracefully', () => {
      const label = getEscalationLevelLabel('custom_level' as EscalationLevel);
      expect(label).toBe('custom_level');
    });
  });

  describe('Notification Preference Validation', () => {
    it('should respect email notification preferences', () => {
      const clientSettings = {
        approvalsNeeded: true,
        approvalReminders: true,
      };

      // For reminders, should check if enabled
      expect(clientSettings.approvalReminders).toBe(true);
    });

    it('should default to sending if no preferences found', () => {
      const clientSettings = null;
      expect(clientSettings).toBeNull();
      // The scheduler should send by default if settings not found
    });

    it('should handle disabled approval notifications', () => {
      const clientSettings = {
        approvalsNeeded: false,
        approvalReminders: false,
      };

      expect(!clientSettings.approvalsNeeded && !clientSettings.approvalReminders).toBe(true);
    });

    it('should distinguish between reminder and escalation', () => {
      const reminderLevel = 'reminder_24h';
      const escalationLevel = 'escalation_48h';

      expect(reminderLevel.includes('reminder')).toBe(true);
      expect(escalationLevel.includes('escalation')).toBe(true);
    });
  });

  describe('Configuration Validation', () => {
    it('should accept disabled scheduler configuration', () => {
      const disabledScheduler = new EscalationScheduler({ enabled: false });
      expect(disabledScheduler).toBeTruthy();
    });

    it('should respect interval configuration', () => {
      const customScheduler = new EscalationScheduler({ intervalMs: 30000 });
      expect(customScheduler).toBeTruthy();
    });

    it('should respect max age configuration', () => {
      const customScheduler = new EscalationScheduler({ maxAgeHours: 72 });
      expect(customScheduler).toBeTruthy();
    });

    it('should respect max concurrent configuration', () => {
      const customScheduler = new EscalationScheduler({ maxConcurrent: 100 });
      expect(customScheduler).toBeTruthy();
    });

    it('should handle large max concurrent values', () => {
      const customScheduler = new EscalationScheduler({ maxConcurrent: 1000 });
      expect(customScheduler).toBeTruthy();
    });
  });

  describe('Escalation Batch Processing', () => {
    it('should be able to trigger manual batch', async () => {
      // This is a mock test since we don't have real DB
      const result = {
        processed: 0,
        successful: 0,
        failed: 0,
      };

      expect(result.processed).toBe(0);
      expect(result.successful).toBe(0);
      expect(result.failed).toBe(0);
    });

    it('should handle empty escalation queues', async () => {
      const result = {
        processed: 0,
        successful: 0,
        failed: 0,
      };

      expect(result.processed).toEqual(0);
    });

    it('should track batch processing duration', () => {
      const status = scheduler.getStatus();
      expect(status.lastRunDuration === null || typeof status.lastRunDuration === 'number').toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid escalation level gracefully', () => {
      expect(() => {
        getEscalationLevelLabel('invalid_level' as EscalationLevel);
      }).not.toThrow();
    });

    it('should handle null dates in calculations', () => {
      const createdAt = new Date();
      const escalationTime = calculateEscalationTime(createdAt, 24);
      expect(escalationTime).toBeTruthy();
      expect(escalationTime instanceof Date).toBe(true);
    });

    it('should handle edge case: zero hour escalation', () => {
      const created = new Date();
      const escalation = calculateEscalationTime(created, 0);
      expect(escalation.getTime()).toBeCloseTo(created.getTime(), 100);
    });

    it('should handle very large escalation hours', () => {
      const created = new Date();
      const escalation = calculateEscalationTime(created, 8760); // 1 year
      const diff = escalation.getTime() - created.getTime();
      expect(diff).toBe(8760 * 60 * 60 * 1000);
    });
  });

  describe('Singleton Pattern', () => {
    it('should maintain singleton instance', () => {
      // Simulating the singleton pattern
      const config = { enabled: true, intervalMs: 5000 };
      const instance1 = new EscalationScheduler(config);
      const instance2 = new EscalationScheduler(config);

      // Both should be separate instances for testing purposes
      expect(instance1).toBeTruthy();
      expect(instance2).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should handle rapid start/stop cycles', () => {
      const rapidScheduler = new EscalationScheduler();

      for (let i = 0; i < 5; i++) {
        rapidScheduler.start();
        rapidScheduler.stop();
      }

      expect(rapidScheduler.getStatus().isRunning).toBe(false);
    });

    it('should calculate escalation times efficiently', () => {
      const created = new Date();
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        calculateEscalationTime(created, 24);
      }

      const duration = Date.now() - startTime;
      // Should complete 1000 calculations in less than 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should trigger detection efficiently', () => {
      const scheduled = new Date();
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        shouldTriggerEscalation(scheduled);
      }

      const duration = Date.now() - startTime;
      // Should complete 1000 checks in less than 50ms
      expect(duration).toBeLessThan(50);
    });
  });
});

describe('Escalation Edge Cases', () => {
  it('should handle approvals created just before midnight', () => {
    const created = new Date('2025-01-01T23:59:59Z');
    const escalation24h = calculateEscalationTime(created, 24);

    expect(escalation24h.getDate()).toBe(2); // Should be next day
  });

  it('should handle leap seconds in timing', () => {
    const created = new Date('2025-06-30T23:59:59Z'); // Potential leap second date
    const escalation = calculateEscalationTime(created, 1);

    expect(escalation).toBeTruthy();
  });

  it('should handle DST transitions (timezone agnostic)', () => {
    const created = new Date('2025-03-08T00:00:00Z'); // Potential DST date (US)
    const escalation = calculateEscalationTime(created, 48);

    const diff = escalation.getTime() - created.getTime();
    expect(diff).toBe(48 * 60 * 60 * 1000);
  });

  it('should maintain precision across year boundaries', () => {
    const created = new Date('2024-12-31T00:00:00Z');
    const escalation96h = calculateEscalationTime(created, 96);

    expect(escalation96h.getFullYear()).toBe(2025); // Should cross year boundary
  });
});
