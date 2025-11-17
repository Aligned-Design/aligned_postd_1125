/**
 * Audit Log Routes
 * Provides endpoints for querying, filtering, and exporting audit logs
 */

import { RequestHandler } from 'express';
import { z } from 'zod';
import { AppError } from '../lib/error-middleware';
import { ErrorCode, HTTP_STATUS } from '../lib/error-responses';
import {
  queryAuditLogs,
  getAuditStatistics,
  exportAuditLogs,
  getPostAuditTrail,
} from '../lib/audit-logger';
import type { AuditLogQuery } from '@shared/approvals';

// ==================== TYPES & VALIDATION ====================

const AuditLogQuerySchema = z.object({
  brandId: z.string().optional(),
  postId: z.string().optional(),
  actorId: z.string().optional(),
  action: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const __AuditExportQuerySchema = z.object({
  brandId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  format: z.enum(['csv', 'json']).default('csv'),
});

/**
 * GET /api/audit/logs
 * Query audit logs with filtering and pagination
 */
export const getAuditLogs: RequestHandler = async (req, res) => {
  try {
    const brandId = req.headers['x-brand-id'] as string;

    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Missing required header: x-brand-id',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    // Validate query parameters
    const validationResult = AuditLogQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      const validationErrors = validationResult.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
        code: e.code,
      }));
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Request validation failed',
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        'warning',
        { validationErrors },
        'Please review the validation errors and retry your request'
      );
    }

    const validData = validationResult.data;
    const query: AuditLogQuery = {
      brandId,
      postId: validData.postId,
      actorId: validData.actorId,
      action: validData.action as unknown,
      startDate: validData.startDate,
      endDate: validData.endDate,
      limit: validData.limit,
      offset: validData.offset,
    };

    const { logs, total, hasMore } = await queryAuditLogs(query);

    (res as any).json({
      success: true,
      logs,
      pagination: {
        total,
        limit: query.limit || 50,
        offset: query.offset || 0,
        hasMore,
      },
    });
  } catch (error) {
    console.error('[Audit Logs] Query error:', error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : 'Failed to query audit logs',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'error',
      error instanceof Error ? { originalError: error.message } : undefined,
      'Please try again later or contact support'
    );
  }
};

/**
 * GET /api/audit/logs/:postId
 * Get complete audit trail for a specific post
 */
export const getPostAuditLog: RequestHandler = async (req, res) => {
  try {
    const { postId } = req.params;
    const brandId = req.headers['x-brand-id'] as string;

    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Missing required header: x-brand-id',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    if (!postId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Post ID is required',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    const logs = await getPostAuditTrail(brandId, postId);

    (res as any).json({
      success: true,
      postId,
      logs,
      total: logs.length,
    });
  } catch (error) {
    console.error('[Post Audit Trail] Error:', error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : 'Failed to get audit trail',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'error',
      error instanceof Error ? { originalError: error.message } : undefined,
      'Please try again later or contact support'
    );
  }
};

/**
 * GET /api/audit/stats
 * Get audit statistics and summary metrics
 */
export const getAuditStats: RequestHandler = async (req, res) => {
  try {
    const brandId = req.headers['x-brand-id'] as string;
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Missing required header: x-brand-id',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    const stats = await getAuditStatistics(brandId, startDate, endDate);

    (res as any).json({
      success: true,
      stats,
      period: {
        startDate: startDate || 'all-time',
        endDate: endDate || new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Audit Stats] Error:', error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : 'Failed to get audit statistics',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'error',
      error instanceof Error ? { originalError: error.message } : undefined,
      'Please try again later or contact support'
    );
  }
};

/**
 * GET /api/audit/export
 * Export audit logs in CSV or JSON format
 */
export const exportAuditLogsHandler: RequestHandler = async (req, res) => {
  try {
    const brandId = req.headers['x-brand-id'] as string;
    const { startDate, endDate, format } = req.query as {
      startDate?: string;
      endDate?: string;
      format?: 'csv' | 'json';
    };

    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Missing required header: x-brand-id',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    if (!startDate || !endDate) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'startDate and endDate are required',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    const exportFormat = format || 'csv';

    if (exportFormat === 'csv') {
      const csv = await exportAuditLogs(brandId, startDate, endDate);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="audit-logs-${brandId}-${Date.now()}.csv"`
      );
      res.send(csv);
    } else {
      // JSON export
      const { logs } = await queryAuditLogs({
        brandId,
        startDate,
        endDate,
        limit: 10000,
      });

      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="audit-logs-${brandId}-${Date.now()}.json"`
      );
      (res as any).json({
        exported: new Date().toISOString(),
        brandId,
        period: { startDate, endDate },
        total: logs.length,
        logs,
      });
    }
  } catch (error) {
    console.error('[Audit Export] Error:', error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : 'Failed to export audit logs',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'error',
      error instanceof Error ? { originalError: error.message } : undefined,
      'Please try again later or contact support'
    );
  }
};

/**
 * POST /api/audit/search
 * Advanced search with multiple filters
 */
export const searchAuditLogs: RequestHandler = async (req, res) => {
  try {
    const brandId = req.headers['x-brand-id'] as string;
    const { postId, actorEmail, action, startDate, endDate, limit = 50, offset = 0 } = req.body;

    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Missing required header: x-brand-id',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    const query: AuditLogQuery = {
      brandId,
      postId,
      action,
      startDate,
      endDate,
      limit: Math.min(limit, 1000),
      offset,
    };

    const { logs, total, hasMore } = await queryAuditLogs(query);

    // Filter by actor email if provided
    let filtered = logs;
    if (actorEmail) {
      filtered = logs.filter((log) => log.actorEmail.toLowerCase().includes(actorEmail.toLowerCase()));
    }

    (res as any).json({
      success: true,
      logs: filtered,
      pagination: {
        total,
        limit,
        offset,
        hasMore,
      },
      appliedFilters: {
        postId: postId || null,
        actorEmail: actorEmail || null,
        action: action || null,
        dateRange: startDate && endDate ? { startDate, endDate } : null,
      },
    });
  } catch (error) {
    console.error('[Audit Search] Error:', error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : 'Failed to search audit logs',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'error',
      error instanceof Error ? { originalError: error.message } : undefined,
      'Please try again later or contact support'
    );
  }
};

/**
 * GET /api/audit/actions
 * Get list of possible audit actions for filtering
 */
export const getAuditActions: RequestHandler = async (req, res) => {
  try {
    const actions = [
      'APPROVAL_REQUESTED',
      'APPROVED',
      'REJECTED',
      'BULK_APPROVED',
      'BULK_REJECTED',
      'PUBLISH_FAILED',
      'EMAIL_SENT',
      'COMMENT_ADDED',
      'WORKFLOW_STARTED',
      'SETTINGS_UPDATED',
      'EMAIL_PREFERENCES_UPDATED',
    ];

    (res as any).json({
      success: true,
      actions,
    });
  } catch (error) {
    console.error('[Audit Actions] Error:', error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : 'Failed to get audit actions',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'error',
      error instanceof Error ? { originalError: error.message } : undefined,
      'Please try again later or contact support'
    );
  }
};
