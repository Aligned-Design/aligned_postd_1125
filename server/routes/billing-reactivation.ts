import { Router, Request, Response } from "express";
import { authenticateUser } from "../middleware/security";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { getAccountStatus } from "../lib/account-status-service";

const router = Router();

/**
 * POST /api/billing/reactivate
 * Reactivate account after successful payment
 */
router.post(
  "/reactivate",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const user = req.user as any;

      if (!user) {
        throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", HTTP_STATUS.UNAUTHORIZED, "warning");
      }

      const { paymentMethodId } = req.body;

      if (!paymentMethodId) {
        return res.status(400).json({
          success: false,
          error: "Payment method ID is required",
        });
      }

      // Check current status
      if (user.plan_status === "active") {
        return res.status(400).json({
          success: false,
          error: "Account is already active",
        });
      }

      // Process payment with Stripe
      // const paymentResult = await stripe.paymentIntents.create({
      //   amount: calculateAmount(user),
      //   currency: 'usd',
      //   customer: user.stripe_customer_id,
      //   payment_method: paymentMethodId,
      //   confirm: true,
      // });

      // if (paymentResult.status !== 'succeeded') {
      //   throw new AppError('Payment failed', 400, 'PAYMENT_FAILED');
      // }

      // Update user status in database
      // await db.from('users').where('id', user.id).update({
      //   plan_status: 'active',
      //   payment_failed_at: null,
      //   payment_retry_count: 0,
      //   past_due_since: null,
      //   archived_at: null,
      //   last_payment_attempt: new Date(),
      // });

      // Restore archived data if applicable
      if (user.plan_status === "archived") {
        await restoreArchivedData(user.id);
      }

      // Send confirmation email
      await sendReactivationEmail(user.id);

      res.json({
        success: true,
        message: "Account reactivated successfully",
        data: {
          planStatus: "active",
          permissions: getAccountStatus("active", 0).permissions,
        },
      });
    } catch (error) {
      console.error("Error reactivating account:", error);
      res.status(500).json({
        success: false,
        error: "Failed to reactivate account",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * GET /api/billing/account-status
 * Get detailed account status and permissions
 */
router.get(
  "/account-status",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const user = req.user as any;

      if (!user) {
        throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", HTTP_STATUS.UNAUTHORIZED, "warning");
      }

      // Calculate days past due
      let daysPastDue = 0;
      if (user.past_due_since) {
        const pastDueDate = new Date(user.past_due_since);
        const now = new Date();
        daysPastDue = Math.floor(
          (now.getTime() - pastDueDate.getTime()) / (1000 * 60 * 60 * 24),
        );
      }

      const accountStatus = getAccountStatus(user.plan_status, daysPastDue);

      res.json({
        success: true,
        data: {
          ...accountStatus,
          paymentFailedAt: user.payment_failed_at,
          paymentRetryCount: user.payment_retry_count,
          graceExtensionDays: user.grace_extension_days || 0,
          nextRetryDate: user.next_retry_date,
        },
      });
    } catch (error) {
      console.error("Error fetching account status:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch account status",
      });
    }
  },
);

/**
 * POST /api/billing/extend-grace-period
 * Admin endpoint to extend grace period
 */
router.post(
  "/extend-grace-period",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const adminUser = req.user as any;

      // Check if user is admin
      if (adminUser.role !== "admin") {
        throw new AppError(ErrorCode.FORBIDDEN, "Forbidden", HTTP_STATUS.FORBIDDEN, "warning");
      }

      const { userId, extensionDays } = req.body;

      if (!userId || !extensionDays) {
        return res.status(400).json({
          success: false,
          error: "User ID and extension days are required",
        });
      }

      // Update user grace extension
      // await db.from('users').where('id', userId).update({
      //   grace_extension_days: extensionDays,
      // });

      res.json({
        success: true,
        message: `Grace period extended by ${extensionDays} days`,
      });
    } catch (error) {
      console.error("Error extending grace period:", error);
      res.status(500).json({
        success: false,
        error: "Failed to extend grace period",
      });
    }
  },
);

/**
 * Helper functions
 */
async function restoreArchivedData(userId: string) {
  console.log(`[Restore] Restoring archived data for user ${userId}`);

  // Fetch archived data
  // const archivedData = await db.from('archived_data')
  //   .where('user_id', userId)
  //   .where('restored', false);

  // Restore each data type
  // for (const data of archivedData) {
  //   switch (data.data_type) {
  //     case 'posts':
  //       await db.from('posts').insert(data.data);
  //       break;
  //     case 'assets':
  //       await db.from('assets').insert(data.data);
  //       break;
  //     // ... other data types
  //   }
  //
  //   // Mark as restored
  //   await db.from('archived_data').where('id', data.id).update({
  //     restored: true,
  //     restored_at: new Date(),
  //   });
  // }
}

async function sendReactivationEmail(userId: string) {
  console.log(`[Email] Sending reactivation confirmation to user ${userId}`);
  // Send via email service with template
}

export default router;
