/**
 * Datadog Observability Integration
 *
 * Provides:
 * - Structured logging with context (CycleId, RequestId, tenant_id, etc.)
 * - Custom metrics (latency, error_rate, queue_depth)
 * - APM tracing (request flow, database calls, external API calls)
 * - Error tracking & alerting
 *
 * Usage:
 * import { logger, initializeDatadog, recordMetric } from './observability';
 *
 * await initializeDatadog();
 *
 * logger.info({ tenantId, requestId, latency: 45 }, 'Request completed');
 * recordMetric('api.publish.latency', 45, { platform: 'meta' });
 */

import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// LOGGER CONFIGURATION
// ============================================================================

/**
 * Sanitize URL by removing sensitive query parameters
 * Prevents secrets from leaking in logs, analytics, error reports
 */
function sanitizeUrl(url: string | undefined): string {
  if (!url) return '';
  
  // List of sensitive query param names to redact
  const sensitiveParams = ['secret', 'token', 'key', 'password', 'apikey', 'api_key'];
  
  try {
    const urlObj = new URL(url, 'http://dummy.com'); // Need base for relative URLs
    
    // Redact sensitive params
    sensitiveParams.forEach(param => {
      if (urlObj.searchParams.has(param)) {
        urlObj.searchParams.set(param, '[REDACTED]');
      }
    });
    
    // Return path + sanitized query string
    return urlObj.pathname + urlObj.search;
  } catch {
    // If URL parsing fails, just return the path part (before ?)
    return url.split('?')[0];
  }
}

const isProduction = process.env.NODE_ENV === 'production';

const _pinoLogger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  transport: isProduction
    ? undefined // In production, pino sends to stdout for ECS/Lambda log aggregation
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          singleLine: false,
          translateTime: 'SYS:standard',
        },
      },
  serializers: {
    req: (req: any) => ({
      method: req.method,
      url: sanitizeUrl(req.url),
      headers: req.headers,
      remoteAddress: req.ip,
    }),
    res: (res: any) => ({
      statusCode: res.statusCode,
    }),
    error: (err: any) => ({
      name: err?.name || 'Error',
      message: err?.message || String(err),
      stack: err?.stack,
      code: err?.code,
    }),
  },
});

// Export logger with proper types that support structured logging
// Pino supports both logger.info(obj, msg) and logger.info(msg) formats
export const logger = _pinoLogger as any as {
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
// STRUCTURED LOGGING CONTEXT
// ============================================================================

export interface LogContext {
  cycleId?: string; // Unique ID for a batch of operations
  requestId?: string; // Unique ID for a single request
  tenantId?: string; // Multi-tenant identifier
  userId?: string; // User identifier
  connectionId?: string; // API connection identifier
  platform?: string; // Integration platform (meta, linkedin, tiktok, etc.)
  jobId?: string; // Queue job identifier
  latencyMs?: number; // Operation latency in milliseconds
  statusCode?: number; // HTTP status code
  errorCode?: string; // Error classification
  retryAttempt?: number; // Retry attempt number
}

/**
 * Log with full context
 * Use this for all logging to ensure consistent, traceable logs
 */
export function log(context: LogContext, level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) {
  const logData = {
    ...context,
    ...data,
    timestamp: new Date().toISOString(),
  };

  // Call logger method directly to preserve overload types
  switch (level) {
    case 'debug':
      logger.debug(logData, message);
      break;
    case 'info':
      logger.info(logData, message);
      break;
    case 'warn':
      logger.warn(logData, message);
      break;
    case 'error':
      logger.error(logData, message);
      break;
  }
}

// ============================================================================
// DATADOG METRICS
// ============================================================================

interface MetricValue {
  value: number;
  timestamp?: number;
  tags?: Record<string, string>;
}

class MetricsCollector {
  private metrics: Map<string, MetricValue[]> = new Map();
  private flushIntervalMs = 10000; // Flush every 10 seconds
  private enabled = false;

  constructor() {
    if (process.env.DATADOG_API_KEY) {
      this.enabled = true;
      this.startFlushInterval();
    }
  }

  /**
   * Record a metric value
   */
  record(metricName: string, value: number, tags?: Record<string, string>): void {
    if (!this.enabled) return;

    const key = metricName;
    const metric: MetricValue = {
      value,
      timestamp: Math.floor(Date.now() / 1000),
      tags,
    };

    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    this.metrics.get(key)!.push(metric);
  }

  /**
   * Periodically flush metrics to Datadog
   */
  private startFlushInterval(): void {
    setInterval(() => {
      this.flush().catch(error => {
        logger.error({ error: error.message }, 'Failed to flush metrics to Datadog');
      });
    }, this.flushIntervalMs);
  }

  /**
   * Send accumulated metrics to Datadog
   */
  private async flush(): Promise<void> {
    if (this.metrics.size === 0) return;

    const datadogApiKey = process.env.DATADOG_API_KEY;
    const datadogSite = process.env.DATADOG_SITE || 'datadoghq.com';

    const series = Array.from(this.metrics.entries()).flatMap(([metricName, values]) =>
      values.map(metric => ({
        metric: `aligned_connector.${metricName}`,
        points: [[metric.timestamp || Math.floor(Date.now() / 1000), metric.value]],
        type: 'gauge',
        tags: [
          ...Object.entries(metric.tags || {}).map(([k, v]) => `${k}:${v}`),
          `env:${process.env.NODE_ENV || 'development'}`,
        ],
      }))
    );

    try {
      const response = await fetch(`https://api.${datadogSite}/api/v1/series`, {
        method: 'POST',
        headers: {
          'DD-API-KEY': datadogApiKey || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ series }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      logger.debug({ metricCount: this.metrics.size }, 'Metrics flushed to Datadog');
      this.metrics.clear();
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        'Failed to send metrics to Datadog'
      );
    }
  }
}

export const metricsCollector = new MetricsCollector();

/**
 * Record a metric for Datadog
 * Format: api.publish.latency, queue.depth, etc.
 */
export function recordMetric(metricName: string, value: number, tags?: Record<string, string>): void {
  metricsCollector.record(metricName, value, tags);
}

// ============================================================================
// REQUEST TRACING
// ============================================================================

/**
 * Generate unique IDs for tracing
 */
export function generateTraceIds(): { cycleId: string; requestId: string } {
  return {
    cycleId: process.env.CYCLE_ID || `cycle_${uuidv4().substring(0, 8)}`,
    requestId: `req_${uuidv4().substring(0, 8)}`,
  };
}

/**
 * Middleware for Express to add trace IDs to all requests
 */
export function tracingMiddleware(req: any, res: any, next: any): void {
  const { cycleId, requestId } = generateTraceIds();

  // Attach to request context
  req.cycleId = cycleId;
  req.requestId = requestId;

  // Add to response headers for client to track
  res.setHeader('X-Request-ID', requestId);
  res.setHeader('X-Cycle-ID', cycleId);

  // Log request start
  logger.info(
    {
      cycleId,
      requestId,
      method: req.method,
      url: sanitizeUrl(req.url),
      ip: req.ip,
    },
    'HTTP request'
  );

  // Log response
  const startTime = Date.now();
  res.on('finish', () => {
    const latencyMs = Date.now() - startTime;

    logger.info(
      {
        cycleId,
        requestId,
        method: req.method,
        url: sanitizeUrl(req.url),
        statusCode: res.statusCode,
        latencyMs,
      },
      'HTTP response'
    );

    // Record metrics
    recordMetric('http.request.latency', latencyMs, {
      method: req.method,
      status: String(res.statusCode),
    });
  });

  next();
}

// ============================================================================
// ERROR TRACKING
// ============================================================================

export interface TrackedError {
  code: string;
  message: string;
  context: LogContext;
  stackTrace?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Track an error for Datadog error tracking
 */
export async function trackError(error: Error, context: LogContext, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'): Promise<void> {
  const errorCode = extractErrorCode(error.message);

  const trackedError: TrackedError = {
    code: errorCode,
    message: error.message,
    context,
    stackTrace: error.stack,
    severity,
  };

  // Log the error
  logger.error(
    {
      ...context,
      errorCode,
      severity,
      stackTrace: error.stack,
    },
    `Error: ${error.message}`
  );

  // Record error metric
  recordMetric('api.error_rate', 1, {
    errorCode,
    severity,
    platform: context.platform || 'unknown',
  });

  // Future work: Send to Datadog error tracking service
  // This requires Datadog API key configuration and client library integration
  // await datadogClient.trackError(trackedError);
}

/**
 * Extract error code from error message
 */
function extractErrorCode(message: string): string {
  const match = message.match(/\b(AUTH_FAILED|RATE_LIMIT_EXCEEDED|TIMEOUT|SERVER_ERROR|NETWORK_ERROR|TOKEN_EXPIRED|PERMISSION_DENIED)\b/);
  return match ? match[1] : 'UNKNOWN_ERROR';
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Measure operation latency
 */
export async function measureLatency<T>(
  operationName: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await fn();
    const latencyMs = Date.now() - startTime;

    recordMetric('operation.latency', latencyMs, {
      operation: operationName,
      status: 'success',
    });

    if (context) {
      logger.debug({ ...context, latencyMs, operation: operationName }, 'Operation completed');
    }

    return result;
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    recordMetric('operation.latency', latencyMs, {
      operation: operationName,
      status: 'error',
    });

    if (error instanceof Error) {
      trackError(error, { ...context, latencyMs }, 'medium');
    }

    throw error;
  }
}

// ============================================================================
// HEALTH & READINESS CHECKS
// ============================================================================

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    database: 'ok' | 'error';
    queue: 'ok' | 'error';
    datadog: 'ok' | 'error';
  };
  timestamp: string;
}

export async function getHealthStatus(): Promise<HealthStatus> {
  // Future work: Check actual service health (database, external APIs, etc.)
  return {
    status: 'healthy',
    components: {
      database: 'ok',
      queue: 'ok',
      datadog: process.env.DATADOG_API_KEY ? 'ok' : 'error',
    },
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// DATADOG INITIALIZATION
// ============================================================================

export async function initializeDatadog(): Promise<void> {
  const apiKey = process.env.DATADOG_API_KEY;
  const site = process.env.DATADOG_SITE || 'datadoghq.com';
  const env = process.env.NODE_ENV || 'development';

  if (!apiKey) {
    logger.warn('DATADOG_API_KEY not configured. Datadog integration disabled.');
    return;
  }

  logger.info(
    {
      site,
      env,
    },
    'Datadog observability initialized'
  );

  // Send initial heartbeat to Datadog
  recordMetric('app.startup', 1, {
    env,
    version: process.env.APP_VERSION || 'unknown',
  });
}

export default {
  logger,
  log,
  recordMetric,
  trackError,
  generateTraceIds,
  tracingMiddleware,
  measureLatency,
  getHealthStatus,
  initializeDatadog,
};
