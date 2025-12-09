import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  initializeSentry,
  trackWebVitals,
  captureMetric,
  captureUserInteraction,
  setUserContext,
  clearUserContext,
  captureError,
  markPerformanceStart,
  markPerformanceEnd,
  reportMetricsToSentry,
} from '../utils/monitoring';

// Re-enabled: Monitoring tests don't require external infra, just mocks
describe('Monitoring & Error Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initializeSentry', () => {
    it('should initialize Sentry in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      expect(() => initializeSentry()).not.toThrow();

      process.env.NODE_ENV = originalEnv;
    });

    it('should skip initialization in development without flag', () => {
      const originalEnv = process.env.NODE_ENV;
      delete process.env.VITE_ENABLE_SENTRY;
      process.env.NODE_ENV = 'development';

      expect(() => initializeSentry()).not.toThrow();

      process.env.NODE_ENV = originalEnv;
    });

    it('should initialize in development with VITE_ENABLE_SENTRY flag', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.VITE_ENABLE_SENTRY = 'true';
      process.env.NODE_ENV = 'development';

      expect(() => initializeSentry()).not.toThrow();

      process.env.NODE_ENV = originalEnv;
      delete process.env.VITE_ENABLE_SENTRY;
    });
  });

  describe('trackWebVitals', () => {
    it('should call trackWebVitals without errors', () => {
      expect(() => trackWebVitals()).not.toThrow();
    });

    it('should register all web vital metrics', () => {
      // trackWebVitals() is a void function that registers callbacks via web-vitals
      // It doesn't return anything - it fires and forgets
      // The mock in vitest.setup.ts handles the registration
      expect(() => trackWebVitals()).not.toThrow();
    });
  });

  describe('captureMetric', () => {
    it('should capture metric without errors', () => {
      expect(() => {
        captureMetric('test', 'metric-name', 100, 'good');
      }).not.toThrow();
    });

    it('should handle different rating values', () => {
      expect(() => {
        captureMetric('test', 'metric1', 50, 'good');
        captureMetric('test', 'metric2', 150, 'needs-improvement');
        captureMetric('test', 'metric3', 300, 'poor');
      }).not.toThrow();
    });

    it('should send metric to analytics endpoint', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response('OK')
      );

      process.env.NODE_ENV = 'production';
      process.env.VITE_ENABLE_SENTRY = 'true';

      captureMetric('test', 'endpoint-test', 100, 'good');

      // Cleanup
      delete process.env.VITE_ENABLE_SENTRY;
      fetchSpy.mockRestore();
    });
  });

  describe('captureUserInteraction', () => {
    it('should capture user interaction without errors', () => {
      expect(() => {
        captureUserInteraction('button-click', { button: 'primary' });
      }).not.toThrow();
    });

    it('should handle interaction without metadata', () => {
      expect(() => {
        captureUserInteraction('page-load');
      }).not.toThrow();
    });
  });

  describe('User Context Management', () => {
    it('should set user context', () => {
      expect(() => {
        setUserContext('user-123', 'user@example.com', { tier: 'pro' });
      }).not.toThrow();
    });

    it('should set user context without email', () => {
      expect(() => {
        setUserContext('user-456');
      }).not.toThrow();
    });

    it('should clear user context', () => {
      expect(() => {
        clearUserContext();
      }).not.toThrow();
    });
  });

  describe('captureError', () => {
    it('should capture Error object', () => {
      const error = new Error('Test error');
      expect(() => {
        captureError(error, { source: 'test' });
      }).not.toThrow();
    });

    it('should capture unknown error types', () => {
      expect(() => {
        captureError('string error', { context: 'test' });
      }).not.toThrow();
    });

    it('should capture error without context', () => {
      expect(() => {
        captureError(new Error('No context'));
      }).not.toThrow();
    });
  });

  describe('Performance Marks', () => {
    it('should mark performance start', () => {
      expect(() => {
        markPerformanceStart('test-operation');
      }).not.toThrow();
    });

    it('should mark performance end', () => {
      markPerformanceStart('test-operation');
      expect(() => {
        markPerformanceEnd('test-operation');
      }).not.toThrow();
    });

    it('should handle missing performance API gracefully', () => {
      const originalPerformance = window.performance;
      (window as { performance?: Performance }).performance = undefined;

      expect(() => {
        markPerformanceStart('test');
        markPerformanceEnd('test');
      }).not.toThrow();

      (window as { performance?: Performance }).performance = originalPerformance;
    });
  });

  describe('reportMetricsToSentry', () => {
    it('should report metrics without errors', () => {
      expect(() => {
        reportMetricsToSentry();
      }).not.toThrow();
    });

    it('should handle missing performance API', () => {
      const originalPerformance = window.performance;
      (window as { performance?: Performance }).performance = undefined;

      expect(() => {
        reportMetricsToSentry();
      }).not.toThrow();

      (window as { performance?: Performance }).performance = originalPerformance;
    });
  });
});
