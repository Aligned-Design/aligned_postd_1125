/**
 * Notifications API Routes
 * 
 * Handles fetching and managing user notifications.
 */

import { Router, RequestHandler } from "express";
import { z } from "zod";
import { notificationService } from "../lib/notification-service";
import { authenticateUser } from "../middleware/security";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { validateQuery, validateParams } from "../lib/validation-middleware";

const router = Router();

// ✅ VALIDATION: Zod schemas for notifications routes
const GetNotificationsQuerySchema = z.object({
  brandId: z.string().uuid('Invalid brand ID format').optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
}).strict();

const NotificationIdParamSchema = z.object({
  notificationId: z.string().uuid('Invalid notification ID format'),
}).strict();

/**
 * GET /api/notifications
 * Get unread notifications for the current user
 * 
 * **Auth:** Required (authenticateUser)
 * **Brand Access:** None (user-scoped)
 * **Query:** brandId (UUID, optional), limit (number, 1-100, default 50)
 */
router.get(
  "/",
  authenticateUser,
  validateQuery(GetNotificationsQuerySchema),
  (async (req, res, next) => {
    try {
      const user = (req as any).user || (req as any).auth;
      if (!user || !user.id) {
        throw new AppError(
          ErrorCode.UNAUTHORIZED,
          "Authentication required",
          HTTP_STATUS.UNAUTHORIZED,
          "warning"
        );
      }

      // ✅ VALIDATION: Query is already validated by middleware
      const { brandId, limit } = req.query as z.infer<typeof GetNotificationsQuerySchema>;

      const notifications = await notificationService.getUnreadNotifications(
        user.id,
        brandId,
        limit
      );

      (res as any).json({
        success: true,
        notifications,
        total: notifications.length,
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
);

/**
 * POST /api/notifications/:notificationId/read
 * Mark a notification as read
 * 
 * **Auth:** Required (authenticateUser)
 * **Brand Access:** None (user-scoped)
 * **Params:** notificationId (UUID)
 */
router.post(
  "/:notificationId/read",
  authenticateUser,
  validateParams(NotificationIdParamSchema),
  (async (req, res, next) => {
    try {
      const user = (req as any).user || (req as any).auth;
      if (!user || !user.id) {
        throw new AppError(
          ErrorCode.UNAUTHORIZED,
          "Authentication required",
          HTTP_STATUS.UNAUTHORIZED,
          "warning"
        );
      }

      // ✅ VALIDATION: Params are already validated by middleware
      const { notificationId } = req.params as z.infer<typeof NotificationIdParamSchema>;
      await notificationService.markAsRead(notificationId, user.id);

      (res as any).json({
        success: true,
        message: "Notification marked as read",
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
);

export default router;
