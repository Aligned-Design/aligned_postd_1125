import { RequestHandler, Request, Router } from 'express';
import { WorkflowTemplate, WorkflowAction } from '@shared/workflow';
import { workflowDB } from '../lib/workflow-db-service';
import { AppError } from '../lib/error-middleware';
import { ErrorCode, HTTP_STATUS } from '../lib/error-responses';
import { requireScope } from '../middleware/requireScope';

// Extended request interface with user context
interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
    brandId?: string;
    email?: string;
  };
  userId?: string;
}

/**
 * GET /api/workflow/templates
 * Get workflow templates for a brand
 */
export const getWorkflowTemplates: RequestHandler = async (req, res, next) => {
  try {
    const { brandId } = req.query;
    const authReq = req as AuthenticatedRequest;
    const userBrandId = authReq.user?.brandId;

    // Use provided brandId or fall back to user's brand
    const targetBrandId = (brandId as string) || userBrandId;

    if (!targetBrandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'brandId is required',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    // Fetch templates from database
    const templates = await workflowDB.getWorkflowTemplates(targetBrandId);
    (res as any).json(templates);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/workflow/templates
 * Create a new workflow template
 */
export const createWorkflowTemplate: RequestHandler = async (req, res, next) => {
  try {
    const template: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt'> = req.body;
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

    if (!template.name || !template.steps || template.steps.length === 0) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'name and steps are required',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

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
    next(error);
  }
};

/**
 * POST /api/workflow/start
 * Start a workflow for content
 */
export const startWorkflow: RequestHandler = async (req, res, next) => {
  try {
    const { contentId, templateId, assignedUsers, priority, deadline } = req.body;
    const authReq = req as AuthenticatedRequest;
    const brandId = authReq.user?.brandId;
    const _userId = authReq.user?.id || authReq.userId;

    // Validate required fields
    if (!brandId || !contentId || !templateId || !assignedUsers) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'brandId, contentId, templateId, and assignedUsers are required',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

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
    const { workflowId } = req.params;
    const action: WorkflowAction = req.body;
    const authReq = req as AuthenticatedRequest;
    const _userId = authReq.user?.id || authReq.userId;

    // Validate input
    if (!workflowId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'workflowId is required',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    if (!action || !action.type || !action.stepInstanceId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'action.type and action.stepInstanceId are required',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    // Process action via database
    const updatedWorkflow = await workflowDB.processWorkflowAction(
      workflowId,
      action.stepInstanceId,
      action.type as 'approve' | 'reject' | 'comment' | 'reassign',
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
    const unreadOnly = (req as any).query.unreadOnly === 'true';

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
      notifications: mappedNotifications,
      total: mappedNotifications.length,
      unread: mappedNotifications.filter((n) => !n.readAt).length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/workflow/notifications/:notificationId/read
 * Mark notification as read
 */
export const markNotificationRead: RequestHandler = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    if (!notificationId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'notificationId is required',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

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
    const { workflowId } = req.params;
    const { reason } = req.body;

    if (!workflowId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'workflowId is required',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

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
    const { workflowId } = req.params;

    if (!workflowId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'workflowId is required',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

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

    (res as any).json(workflow);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/workflow/content/:contentId
 * Get workflow instances for content
 */
export const getWorkflowsForContent: RequestHandler = async (req, res, next) => {
  try {
    const { contentId } = req.params;

    if (!contentId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'contentId is required',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    // Fetch workflows from database
    const workflows = await workflowDB.getWorkflowInstancesForContent(contentId);

    (res as any).json({
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
  getWorkflowTemplates,
);

workflowRouter.post(
  "/templates",
  requireScope("workflow:manage"),
  createWorkflowTemplate,
);

workflowRouter.post(
  "/start",
  requireScope("workflow:manage"),
  startWorkflow,
);

workflowRouter.post(
  "/:workflowId/action",
  requireScope("workflow:manage"),
  processWorkflowAction,
);

workflowRouter.get(
  "/notifications",
  requireScope("content:view"),
  getWorkflowNotifications,
);

workflowRouter.put(
  "/notifications/:notificationId/read",
  requireScope("content:view"),
  markNotificationRead,
);

workflowRouter.post(
  "/:workflowId/cancel",
  requireScope("workflow:manage"),
  cancelWorkflow,
);

workflowRouter.get(
  "/:workflowId",
  requireScope("workflow:manage"),
  getWorkflow,
);

workflowRouter.get(
  "/content/:contentId",
  requireScope("content:view"),
  getWorkflowsForContent,
);

export default workflowRouter;
