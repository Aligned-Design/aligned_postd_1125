import { Router, Request, Response } from 'express';
import { aiMetricsService } from '../lib/ai-metrics';
import { AppError } from '../lib/error-middleware';
import { ErrorCode, HTTP_STATUS } from '../lib/error-responses';

const router = Router();

/**
 * GET /api/metrics/ai/snapshot
 * Get AI metrics snapshot for dashboard
 */
router.get('/ai/snapshot', (req: Request, res: Response) => {
  try {
    const agentType = (req as any).query.agentType as 'doc' | 'design' | 'advisor' | undefined;
    const hoursBack = (req as any).query.hoursBack ? parseInt((req as any).query.hoursBack as string) : 24;

    const snapshot = aiMetricsService.getSnapshot(agentType, hoursBack);

    (res as any).json({
      success: true,
      data: snapshot
    });
  } catch (error) {
    console.error('Error getting AI metrics snapshot:', error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      'Failed to get metrics snapshot',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'error',
      error instanceof Error ? { originalError: error.message } : undefined,
      'Please try again later or contact support'
    );
  }
});

/**
 * GET /api/metrics/ai/alerts
 * Get active alerts from AI metrics
 */
router.get('/ai/alerts', (req: Request, res: Response) => {
  try {
    const hoursBack = (req as any).query.hoursBack ? parseInt((req as any).query.hoursBack as string) : 1;

    const alerts = aiMetricsService.getAlerts(hoursBack);

    (res as any).json({
      success: true,
      data: {
        alertCount: alerts.length,
        alerts,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting AI metrics alerts:', error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      'Failed to get alerts',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'error',
      error instanceof Error ? { originalError: error.message } : undefined,
      'Please try again later or contact support'
    );
  }
});

/**
 * GET /api/metrics/ai/detailed
 * Get detailed metrics for analysis
 */
router.get('/ai/detailed', (req: Request, res: Response) => {
  try {
    const agentType = (req as any).query.agentType as 'doc' | 'design' | 'advisor' | undefined;
    const limit = (req as any).query.limit ? parseInt((req as any).query.limit as string) : 100;

    const metrics = aiMetricsService.getDetailedMetrics(agentType, limit);

    (res as any).json({
      success: true,
      data: {
        count: metrics.length,
        metrics
      }
    });
  } catch (error) {
    console.error('Error getting detailed AI metrics:', error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      'Failed to get detailed metrics',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'error',
      error instanceof Error ? { originalError: error.message } : undefined,
      'Please try again later or contact support'
    );
  }
});

/**
 * GET /api/metrics/ai/summary
 * Get summary of AI generation quality and performance
 */
router.get('/ai/summary', (req: Request, res: Response) => {
  try {
    // Get snapshots for different time ranges for comparison
    const last1h = aiMetricsService.getSnapshot(undefined, 1);
    const last24h = aiMetricsService.getSnapshot(undefined, 24);

    (res as any).json({
      success: true,
      data: {
        current: last1h,
        daily: last24h,
        trend: {
          latencyTrend: last1h.averageLatency > last24h.averageLatency ? 'up' : 'down',
          successTrend: last1h.successRate > last24h.successRate ? 'up' : 'down',
          qualityTrend: last1h.bfsPassRate > last24h.bfsPassRate ? 'up' : 'down'
        }
      }
    });
  } catch (error) {
    console.error('Error getting AI metrics summary:', error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      'Failed to get summary',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'error',
      error instanceof Error ? { originalError: error.message } : undefined,
      'Please try again later or contact support'
    );
  }
});

export default router;
