/**
 * Notifications API Routes
 * 
 * Handles fetching and managing user notifications.
 */

import { Router, RequestHandler } from "express";
import { notificationService } from "../lib/notification-service";
import { authenticateUser } from "../middleware/security";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";

const router = Router();

/**
 * GET /api/notifications
 * Get unread notifications for the current user
 */
router.get(
  "/",
  authenticateUser,
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

      const brandId = req.query.brandId as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;

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
 */
router.post(
  "/:notificationId/read",
  authenticateUser,
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

      const { notificationId } = req.params;
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
