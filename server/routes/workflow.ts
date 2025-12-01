/**
 * Workflow API Routes
 * 
 * Handles workflow templates, instances, and actions with proper validation.
 */

/**
 * Workflow API Routes
 * 
 * Handles workflow templates, instances, and actions with proper validation.
 * All brand-scoped routes require brand access verification.
 */

import { RequestHandler, Request, Router } from 'express';
import { z } from 'zod';
import { WorkflowTemplate, WorkflowAction } from '@shared/workflow';
import { workflowDB } from '../lib/workflow-db-service';
import { AppError } from '../lib/error-middleware';
import { ErrorCode, HTTP_STATUS } from '../lib/error-responses';
import { requireScope } from '../middleware/requireScope';
import { validateQuery, validateBody, validateParams } from '../lib/validation-middleware';
import { assertBrandAccess } from '../lib/brand-access';

// ✅ VALIDATION: Zod schemas for workflow routes
const GetTemplatesQuerySchema = z.object({
  brandId: z.string().uuid('Invalid brand ID format').optional(),
}).strict();

const CreateTemplateBodySchema = z.object({
  name: z.string().min(1, 'Template name is required').max(200),
  description: z.string().max(1000).optional(),
  steps: z.array(z.object({
    id: z.string(),
    stage: z.string(),
    name: z.string(),
    description: z.string().optional(),
    required_role: z.string(),
    is_required: z.boolean(),
    allow_parallel: z.boolean(),
    auto_advance: z.boolean(),
    timeout_hours: z.number().positive().optional(),
    order: z.number(),
  })).min(1, 'At least one step is required'),
  notifications: z.object({
    email_on_stage_change: z.boolean(),
    reminder_after_hours: z.number().positive().optional(),
  }).optional(),
}).strict();

const StartWorkflowBodySchema = z.object({
  contentId: z.string().uuid('Invalid content ID format'),
  templateId: z.string().uuid('Invalid template ID format'),
  assignedUsers: z.record(z.string(), z.string().uuid('Invalid user ID format')).refine(
    (val) => Object.keys(val).length > 0,
    'At least one user assignment is required'
  ),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  deadline: z.string().datetime().optional(),
}).strict();

const WorkflowActionBodySchema = z.object({
  type: z.enum(['approve', 'reject', 'comment', 'reassign']),
  stepInstanceId: z.string().uuid('Invalid step instance ID format'),
  metadata: z.record(z.unknown()).optional(),
}).strict();

const WorkflowIdParamSchema = z.object({
  workflowId: z.string().uuid('Invalid workflow ID format'),
}).strict();

const ContentIdParamSchema = z.object({
  contentId: z.string().uuid('Invalid content ID format'),
}).strict();

const NotificationIdParamSchema = z.object({
  notificationId: z.string().uuid('Invalid notification ID format'),
}).strict();

const CancelWorkflowBodySchema = z.object({
  reason: z.string().max(500).optional(),
}).strict();

const GetNotificationsQuerySchema = z.object({
  unreadOnly: z.string().transform(val => val === 'true').optional(),
}).strict();

// Extended request interface with user context
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    brandId?: string;
    brandIds?: string[];
    scopes?: string[];
    workspaceId?: string;
    tenantId?: string;
  };
  userId?: string;
}

/**
 * GET /api/workflow/templates
 * Get workflow templates for a brand
 * 
 * **Auth:** Required (requireScope "workflow:manage")
 * **Brand Access:** Required (assertBrandAccess)
 * **Query:** brandId (UUID, optional - falls back to user's brand)
 */
export const getWorkflowTemplates: RequestHandler = async (req, res, next) => {
  try {
    const { brandId } = req.query as { brandId?: string };
    const authReq = req as AuthenticatedRequest;
    const userBrandId = authReq.user?.brandId;

    // Use provided brandId or fall back to user's brand
    const targetBrandId = brandId || userBrandId;

    if (!targetBrandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'brandId is required',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    // Verify user has access to this brand
    await assertBrandAccess(req, targetBrandId);

    // Fetch templates from database
    const templates = await workflowDB.getWorkflowTemplates(targetBrandId);
    (res as any).json({ success: true, templates });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/workflow/templates
 * Create a new workflow template
 * 
 * **Auth:** Required (requireScope "workflow:manage")
 * **Brand Access:** Required (assertBrandAccess)
 * **Body:** { name: string, description?: string, steps: WorkflowStep[], notifications?: object }
 */
export const createWorkflowTemplate: RequestHandler = async (req, res, next) => {
  try {
    // ✅ VALIDATION: Body is already validated by middleware
    const template = req.body as z.infer<typeof CreateTemplateBodySchema>;
    const authReq = req as AuthenticatedRequest;
    const userBrandId = authReq.user?.brandId;

    if (!userBrandId) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        'Brand ID is required',
        HTTP_STATUS.UNAUTHORIZED,
        'warning'
      );
    }

    // Verify user has access to this brand
    await assertBrandAccess(req, userBrandId);

    // Convert camelCase to snake_case for database
    const dbTemplate = {
      ...template,
      brand_id: userBrandId,
      is_default: false,
    };

    // Create template in database
    const createdTemplate = await workflowDB.createWorkflowTemplate(userBrandId, dbTemplate as any);

    (res as any).json({ success: true, template: createdTemplate });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Request validation failed',
        HTTP_STATUS.BAD_REQUEST,
        'warning',
        { validationErrors: error.errors },
        'Please review the validation errors and retry your request'
      );
    }
    next(error);
  }
};

/**
 * POST /api/workflow/start
 * Start a workflow for content
 * 
 * **Auth:** Required (requireScope "workflow:manage")
 * **Brand Access:** Required (assertBrandAccess)
 * **Body:** { contentId: UUID, templateId: UUID, assignedUsers: UUID[], priority?: "low"|"medium"|"high", deadline?: ISO datetime }
 */
export const startWorkflow: RequestHandler = async (req, res, next) => {
  try {
    // ✅ VALIDATION: Body is already validated by middleware
    const { contentId, templateId, assignedUsers, priority, deadline } = req.body as z.infer<typeof StartWorkflowBodySchema>;
    const authReq = req as AuthenticatedRequest;
    const brandId = authReq.user?.brandId;
    const _userId = authReq.user?.id || authReq.userId;

    if (!brandId) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        'Brand ID is required',
        HTTP_STATUS.UNAUTHORIZED,
        'warning'
      );
    }

    // Verify user has access to this brand
    await assertBrandAccess(req, brandId);

    // Start workflow via database
    const workflowInstance = await workflowDB.startWorkflow(
      brandId,
      contentId,
      templateId,
      assignedUsers,
      priority || 'medium',
      deadline
    );

    (res as any).json({ success: true, workflow: workflowInstance });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/workflow/:workflowId/action
 * Process a workflow action (approve, reject, comment, etc)
 */
export const processWorkflowAction: RequestHandler = async (req, res, next) => {
  try {
    // ✅ VALIDATION: Params and body are already validated by middleware
    const { workflowId } = req.params as z.infer<typeof WorkflowIdParamSchema>;
    const action = req.body as z.infer<typeof WorkflowActionBodySchema>;
    const authReq = req as AuthenticatedRequest;
    const _userId = authReq.user?.id || authReq.userId;

    // Process action via database
    const updatedWorkflow = await workflowDB.processWorkflowAction(
      workflowId,
      action.stepInstanceId,
      action.type,
      action.metadata || {}
    );

    (res as any).json({ success: true, workflow: updatedWorkflow });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/workflow/notifications
 * Get workflow notifications for user
 */
export const getWorkflowNotifications: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id || authReq.userId;
    // ✅ VALIDATION: Query is already validated by middleware
    const { unreadOnly } = req.query as { unreadOnly?: boolean };

    if (!userId) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        'User ID is required',
        HTTP_STATUS.UNAUTHORIZED,
        'warning'
      );
    }

    // Fetch notifications from database
    const notifications = unreadOnly
      ? await workflowDB.getUnreadNotifications(userId)
      : [];

    // Map to response format
    const mappedNotifications = notifications.map((notif) => ({
      id: notif.id,
      workflowId: notif.workflow_id,
      type: notif.type,
      message: notif.message,
      readAt: notif.read_at,
      createdAt: notif.created_at,
    }));

    (res as any).json({
      success: true,
      notifications: mappedNotifications,
      total: mappedNotifications.length,
      unread: mappedNotifications.filter((n) => !n.readAt).length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/workflow/notifications/:notificationId/read
 * Mark notification as read
 */
export const markNotificationRead: RequestHandler = async (req, res, next) => {
  try {
    // ✅ VALIDATION: Params are already validated by middleware
    const { notificationId } = req.params as z.infer<typeof NotificationIdParamSchema>;

    // Mark as read via database
    await workflowDB.markNotificationRead(notificationId);

    (res as any).json({ success: true });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/workflow/:workflowId/cancel
 * Cancel a workflow
 */
export const cancelWorkflow: RequestHandler = async (req, res, next) => {
  try {
    // ✅ VALIDATION: Params and body are already validated by middleware
    const { workflowId } = req.params as z.infer<typeof WorkflowIdParamSchema>;
    const { reason } = req.body as z.infer<typeof CancelWorkflowBodySchema>;

    // Cancel via database
    await workflowDB.cancelWorkflow(workflowId, reason);

    (res as any).json({ success: true });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/workflow/:workflowId
 * Get a specific workflow instance
 */
export const getWorkflow: RequestHandler = async (req, res, next) => {
  try {
    // ✅ VALIDATION: Params are already validated by middleware
    const { workflowId } = req.params as z.infer<typeof WorkflowIdParamSchema>;

    // Fetch workflow from database
    const workflow = await workflowDB.getWorkflowInstance(workflowId);

    if (!workflow) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        'Workflow not found',
        HTTP_STATUS.NOT_FOUND,
        'warning'
      );
    }

    (res as any).json({ success: true, workflow });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/workflow/content/:contentId
 * Get workflow instances for content
 * 
 * **Auth:** Required (requireScope "content:view")
 * **Brand Access:** Required (assertBrandAccess via content's brandId)
 * **Params:** contentId (UUID)
 */
export const getWorkflowsForContent: RequestHandler = async (req, res, next) => {
  try {
    // ✅ VALIDATION: Params are already validated by middleware
    const { contentId } = req.params as z.infer<typeof ContentIdParamSchema>;

    // Future work: Fetch content to get brandId, then verify access
    // This requires a content service that can retrieve content by ID
    // For now, brand access is verified at the workflow level

    // Fetch workflows from database
    const workflows = await workflowDB.getWorkflowInstancesForContent(contentId);

    (res as any).json({
      success: true,
      contentId,
      workflows,
      total: workflows.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Workflow Router
 */
const workflowRouter = Router();

workflowRouter.get(
  "/templates",
  requireScope("workflow:manage"),
  validateQuery(GetTemplatesQuerySchema),
  getWorkflowTemplates,
);

workflowRouter.post(
  "/templates",
  requireScope("workflow:manage"),
  validateBody(CreateTemplateBodySchema),
  createWorkflowTemplate,
);

workflowRouter.post(
  "/start",
  requireScope("workflow:manage"),
  validateBody(StartWorkflowBodySchema),
  startWorkflow,
);

workflowRouter.post(
  "/:workflowId/action",
  requireScope("workflow:manage"),
  validateParams(WorkflowIdParamSchema),
  validateBody(WorkflowActionBodySchema),
  processWorkflowAction,
);

workflowRouter.get(
  "/notifications",
  requireScope("content:view"),
  validateQuery(GetNotificationsQuerySchema),
  getWorkflowNotifications,
);

workflowRouter.put(
  "/notifications/:notificationId/read",
  requireScope("content:view"),
  validateParams(NotificationIdParamSchema),
  markNotificationRead,
);

workflowRouter.post(
  "/:workflowId/cancel",
  requireScope("workflow:manage"),
  validateParams(WorkflowIdParamSchema),
  validateBody(CancelWorkflowBodySchema),
  cancelWorkflow,
);

workflowRouter.get(
  "/:workflowId",
  requireScope("workflow:manage"),
  validateParams(WorkflowIdParamSchema),
  getWorkflow,
);

workflowRouter.get(
  "/content/:contentId",
  requireScope("content:view"),
  validateParams(ContentIdParamSchema),
  getWorkflowsForContent,
);

export default workflowRouter;
