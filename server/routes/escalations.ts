/**
 * Escalation Routes
 * RESTful endpoints for managing escalation rules and events
 */

import {
  Router,
  Request,
  RequestHandler,
  Response,
  NextFunction,
} from "express";
import { z } from "zod";
import {
  escalationRules,
  escalationEvents,
  postApprovals,
  auditLogs,
} from "../lib/dbClient";
import {
  CreateEscalationRuleSchema,
  UpdateEscalationRuleSchema,
  CreateEscalationRequestSchema,
  UpdateEscalationEventSchema,
  calculateEscalationTime,
} from "@shared/escalation";
import {
  AppError,
} from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";

const router = Router();

// ==================== REQUEST VALIDATION ====================

interface AuthRequest extends Request {
  brandId?: string;
  headers: {
    "x-brand-id"?: string;
    "x-user-id"?: string;
    "x-user-email"?: string;
  };
}

// Middleware: Extract brand ID from headers
const requireBrandId: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const brandId = req.headers["x-brand-id"];
  if (!brandId) {
    throw new AppError(
      ErrorCode.MISSING_REQUIRED_FIELD,
      "Missing required header: x-brand-id",
      HTTP_STATUS.BAD_REQUEST,
      "warning",
      undefined,
      "Please provide x-brand-id header in your request"
    );
  }
  (req as AuthRequest).brandId = brandId as string;
  next();
};

router.use(requireBrandId);

// ==================== ESCALATION RULES ROUTES ====================

/**
 * GET /api/escalations/rules
 * Get all escalation rules for a brand
 */
router.get("/rules", async (req: AuthRequest, res: Response) => {
  try {
    const brandId = req.brandId as string;

    const rules = await escalationRules.getByBrand(brandId, true);

    (res as any).json({
      success: true,
      data: rules,
      count: rules.length,
    });
  } catch (error) {
    console.error("[Escalation Routes] GET /rules error:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Failed to fetch escalation rules",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
});

/**
 * GET /api/escalations/rules/:ruleId
 * Get a specific escalation rule
 */
router.get("/rules/:ruleId", async (req: AuthRequest, res: Response) => {
  try {
    const { ruleId } = req.params;

    const rule = await escalationRules.getById(ruleId);
    if (!rule) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Escalation rule not found",
        HTTP_STATUS.NOT_FOUND,
        "info"
      );
    }

    (res as any).json({
      success: true,
      data: rule,
    });
  } catch (error) {
    console.error("[Escalation Routes] GET /rules/:ruleId error:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Failed to fetch escalation rule",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
});

/**
 * POST /api/escalations/rules
 * Create a new escalation rule
 */
router.post("/rules", async (req: AuthRequest, res: Response) => {
  try {
    const brandId = req.brandId as string;
    const userId = req.headers["x-user-id"] as string;
    const userEmail = req.headers["x-user-email"] as string;

    // Validate request
    const payload = CreateEscalationRuleSchema.parse({
      ...req.body,
      brand_id: brandId,
    });

    // Create rule
    const rule = await escalationRules.create({
      ...(payload as any),
      brand_id: brandId,
    });

    // Audit log
    await auditLogs.create({
      brand_id: brandId,
      actor_id: userId,
      actor_email: userEmail,
      action: "ESCALATION_RULE_CREATED",
      metadata: {
        rule_id: rule.id,
        rule_type: rule.rule_type,
        trigger_hours: rule.trigger_hours,
      },
    });

    (res as any).status(201).json({
      success: true,
      data: rule,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors = error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
        code: e.code,
      }));
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Request validation failed",
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        "warning",
        { validationErrors },
        "Please review the validation errors and retry"
      );
    }

    console.error("[Escalation Routes] POST /rules error:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Failed to create escalation rule",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
});

/**
 * PUT /api/escalations/rules/:ruleId
 * Update an escalation rule
 */
router.put("/rules/:ruleId", async (req: AuthRequest, res: Response) => {
  try {
    const { ruleId } = req.params;
    const brandId = req.brandId as string;
    const userId = req.headers["x-user-id"] as string;
    const userEmail = req.headers["x-user-email"] as string;

    // Verify rule exists
    const existingRule = await escalationRules.getById(ruleId);
    if (!existingRule) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Escalation rule not found",
        HTTP_STATUS.NOT_FOUND,
        "info"
      );
    }

    // Validate request
    const updates = UpdateEscalationRuleSchema.parse(req.body);

    // Update rule
    const updatedRule = await escalationRules.update(
      ruleId,
      updates as Partial<typeof updates>,
    );

    // Audit log
    await auditLogs.create({
      brand_id: brandId,
      actor_id: userId,
      actor_email: userEmail,
      action: "ESCALATION_RULE_UPDATED",
      metadata: {
        rule_id: ruleId,
        changes: updates,
      },
    });

    (res as any).json({
      success: true,
      data: updatedRule,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors = error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
        code: e.code,
      }));
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Request validation failed",
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        "warning",
        { validationErrors },
        "Please review the validation errors and retry"
      );
    }

    console.error("[Escalation Routes] PUT /rules/:ruleId error:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Failed to update escalation rule",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
});

/**
 * DELETE /api/escalations/rules/:ruleId
 * Delete an escalation rule
 */
router.delete("/rules/:ruleId", async (req: AuthRequest, res: Response) => {
  try {
    const { ruleId } = req.params;
    const brandId = req.brandId as string;
    const userId = req.headers["x-user-id"] as string;
    const userEmail = req.headers["x-user-email"] as string;

    // Verify rule exists
    const existingRule = await escalationRules.getById(ruleId);
    if (!existingRule) {
      throw new AppError(
      ErrorCode.NOT_FOUND,
      "Escalation rule not found",
      HTTP_STATUS.NOT_FOUND,
      "info"
    );
    }

    // Delete rule
    await escalationRules.delete(ruleId);

    // Audit log
    await auditLogs.create({
      brand_id: brandId,
      actor_id: userId,
      actor_email: userEmail,
      action: "ESCALATION_RULE_DELETED",
      metadata: {
        rule_id: ruleId,
        rule_type: existingRule.rule_type,
      },
    });

    (res as any).json({
      success: true,
      message: "Escalation rule deleted",
    });
  } catch (error) {
    console.error("[Escalation Routes] DELETE /rules/:ruleId error:", error);
    (res as any).status(500).json({
      error: "Failed to delete escalation rule",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ==================== ESCALATION EVENTS ROUTES ====================

/**
 * GET /api/escalations/events
 * Get escalation events for a brand
 */
router.get("/events", async (req: AuthRequest, res: Response) => {
  try {
    const brandId = req.brandId as string;
    const { status, level, limit = 50, offset = 0 } = req.query;

    const { events, total } = await escalationEvents.query({
      brandId,
      status: status as string | undefined,
      escalationLevel: level as string | undefined,
      limit: parseInt(limit as string) || 50,
      offset: parseInt(offset as string) || 0,
    });

    (res as any).json({
      success: true,
      data: events,
      pagination: {
        total,
        limit: parseInt(limit as string) || 50,
        offset: parseInt(offset as string) || 0,
        hasMore:
          (parseInt(offset as string) || 0) +
            (parseInt(limit as string) || 50) <
          total,
      },
    });
  } catch (error) {
    console.error("[Escalation Routes] GET /events error:", error);
    (res as any).status(500).json({
      error: "Failed to fetch escalation events",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/escalations/events/:eventId
 * Get a specific escalation event
 */
router.get("/events/:eventId", async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;

    const event = await escalationEvents.getById(eventId);
    if (!event) {
      throw new AppError(
      ErrorCode.NOT_FOUND,
      "Escalation event not found",
      HTTP_STATUS.NOT_FOUND,
      "info"
    );
    }

    (res as any).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("[Escalation Routes] GET /events/:eventId error:", error);
    (res as any).status(500).json({
      error: "Failed to fetch escalation event",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/escalations/events
 * Create a new escalation event
 */
router.post("/events", async (req: AuthRequest, res: Response) => {
  try {
    const brandId = req.brandId as string;
    const userId = req.headers["x-user-id"] as string;
    const userEmail = req.headers["x-user-email"] as string;

    // Validate request
    const payload = CreateEscalationRequestSchema.parse(req.body);

    // Get rule for scheduling calculation
    const rule = await escalationRules.getById(payload.rule_id);
    if (!rule) {
      throw new AppError(
      ErrorCode.NOT_FOUND,
      "Escalation rule not found",
      HTTP_STATUS.NOT_FOUND,
      "info"
    );
    }

    // Get approval for timing reference
    const approval = await postApprovals.getById(payload.approval_id);
    if (!approval) {
      throw new AppError(
      ErrorCode.NOT_FOUND,
      "Approval not found",
      HTTP_STATUS.NOT_FOUND,
      "info"
    );
    }

    // Calculate scheduled send time
    const scheduledSendAt = payload.scheduled_send_at
      ? new Date(payload.scheduled_send_at)
      : calculateEscalationTime(approval.created_at, rule.trigger_hours);

    // Create event
    const event = await escalationEvents.create({
      brand_id: brandId,
      approval_id: payload.approval_id,
      rule_id: payload.rule_id,
      escalation_level: payload.escalation_level,
      escalated_to_role: rule.escalate_to_role,
      escalated_to_user_id: rule.escalate_to_user_id,
      notification_type: (rule.notify_via[0] as string) || "email",
      triggered_at: new Date().toISOString(),
      scheduled_send_at: scheduledSendAt.toISOString(),
      status: "pending",
      delivery_attempt_count: 0,
    });

    // Audit log
    await auditLogs.create({
      brand_id: brandId,
      actor_id: userId,
      actor_email: userEmail,
      action: "ESCALATION_CREATED",
      metadata: {
        event_id: event.id,
        escalation_level: payload.escalation_level,
        approval_id: payload.approval_id,
      },
    });

    (res as any).status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return (res as any).status(400).json({
        error: "Invalid request",
        details: error.errors,
      });
    }

    console.error("[Escalation Routes] POST /events error:", error);
    (res as any).status(500).json({
      error: "Failed to create escalation event",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * PUT /api/escalations/events/:eventId
 * Update an escalation event status
 */
router.put("/events/:eventId", async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const brandId = req.brandId as string;
    const userId = req.headers["x-user-id"] as string;
    const userEmail = req.headers["x-user-email"] as string;

    // Verify event exists
    const existingEvent = await escalationEvents.getById(eventId);
    if (!existingEvent) {
      throw new AppError(
      ErrorCode.NOT_FOUND,
      "Escalation event not found",
      HTTP_STATUS.NOT_FOUND,
      "info"
    );
    }

    // Validate request
    const updates = UpdateEscalationEventSchema.parse(req.body);

    // Handle resolution
    if (updates.status === "resolved") {
      const event = await escalationEvents.markAsResolved(
        eventId,
        updates.resolved_by || userId,
        updates.reason,
      );

      // Audit log
      await auditLogs.create({
        brand_id: brandId,
        actor_id: userId,
        actor_email: userEmail,
        action: "ESCALATION_RESOLVED",
        metadata: {
          event_id: eventId,
          reason: updates.reason,
        },
      });

      return (res as any).json({
        success: true,
        data: event,
      });
    }

    // For other updates, we'd update the event directly
    // This is a simplified version
    (res as any).json({
      success: true,
      data: existingEvent,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return (res as any).status(400).json({
        error: "Invalid request",
        details: error.errors,
      });
    }

    console.error("[Escalation Routes] PUT /events/:eventId error:", error);
    (res as any).status(500).json({
      error: "Failed to update escalation event",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
