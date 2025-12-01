/**
 * Billing API Routes
 * 
 * Handles billing status, history, upgrades, and invoice management.
 */

import { Router, Request, Response, RequestHandler } from "express";
import { z } from "zod";
import { authenticateUser } from "../middleware/security";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { validateBody, validateParams } from "../lib/validation-middleware";

const router = Router();

// ✅ VALIDATION: Zod schemas for billing routes
const UpgradePlanBodySchema = z.object({
  plan: z.enum(['base', 'agency', 'enterprise'], {
    errorMap: () => ({ message: 'Plan must be base, agency, or enterprise' }),
  }),
  paymentMethodId: z.string().min(1, 'Payment method ID is required'),
}).strict();

const AddBrandBodySchema = z.object({
  brandName: z.string().min(1, 'Brand name is required').max(200),
}).strict();

const InvoiceIdParamSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
}).strict();

interface BillingStatus {
  subscription: {
    plan: "trial" | "base" | "agency";
    status: "active" | "past_due" | "canceled" | "trial";
    currentPeriodEnd: string;
    price: number;
    brands: number;
  };
  usage: {
    postsPublished: number;
    brandsManaged: number;
    aiInsightsUsed?: number;
    limits: {
      postsPublished: number | null;
      brandsManaged: number;
    };
  };
  paymentMethod?: {
    last4: string;
    expiry: string;
    brand: string;
  };
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  downloadUrl?: string;
}

/**
 * GET /api/billing/status
 * Get current billing status and subscription details
 */
router.get("/status", authenticateUser, (async (req: Request, res: Response, next) => {
  try {
    const user = (req as any).user;

    if (!user) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "Authentication required",
        HTTP_STATUS.UNAUTHORIZED,
        "warning"
      );
    }

    // Calculate brand count from database
    // const brandCount = await db.from('brands').where('user_id', user.id).count();
    const brandCount = 3; // Mock

    const plan = user.plan || "base";
    const isAgencyTier = brandCount >= 5;
    const pricePerBrand = isAgencyTier ? 99 : 199;

    const status: BillingStatus = {
      subscription: {
        plan,
        status: plan === "trial" ? "trial" : "active",
        currentPeriodEnd: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        price: pricePerBrand,
        brands: brandCount,
      },
      usage: {
        postsPublished: user.trial_published_count || 0,
        brandsManaged: brandCount,
        aiInsightsUsed: 0,
        limits: {
          postsPublished: plan === "trial" ? 2 : null,
          brandsManaged: plan === "trial" ? 1 : 100,
        },
      },
    };

    // Add payment method for paid plans
    if (plan !== "trial") {
      status.paymentMethod = {
        last4: "4242",
        expiry: "12/26",
        brand: "Visa",
      };
    }

    (res as any).json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
}) as RequestHandler);

/**
 * GET /api/billing/history
 * Get billing history and invoices
 */
router.get(
  "/history",
  authenticateUser,
  (async (req: Request, res: Response, next) => {
    try {
      const user = (req as any).user;

      if (!user) {
        throw new AppError(
          ErrorCode.UNAUTHORIZED,
          "Authentication required",
          HTTP_STATUS.UNAUTHORIZED,
          "warning"
        );
      }

      // Trial users have no billing history
      if (user.plan === "trial") {
        return res.json({
          success: true,
          data: [],
        });
      }

      // Fetch invoices from database or payment provider (Stripe, etc.)
      const invoices: Invoice[] = [
        {
          id: "INV-2025-001",
          date: new Date().toISOString(),
          amount: 597,
          status: "paid",
          downloadUrl: "/api/billing/invoice/INV-2025-001/download",
        },
        {
          id: "INV-2025-002",
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 597,
          status: "paid",
          downloadUrl: "/api/billing/invoice/INV-2025-002/download",
        },
      ];

      (res as any).json({
        success: true,
        data: invoices,
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,
);

/**
 * POST /api/billing/upgrade
 * Upgrade from trial to paid plan
 */
router.post(
  "/upgrade",
  authenticateUser,
  validateBody(UpgradePlanBodySchema),
  (async (req: Request, res: Response, next) => {
    try {
      const user = (req as any).user;

      if (!user) {
        throw new AppError(
          ErrorCode.UNAUTHORIZED,
          "Authentication required",
          HTTP_STATUS.UNAUTHORIZED,
          "warning"
        );
      }

      // ✅ VALIDATION: Body is already validated by middleware
      const { plan, paymentMethodId } = req.body as z.infer<typeof UpgradePlanBodySchema>;

      if (user.plan !== "trial") {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          "User is already on a paid plan",
          HTTP_STATUS.BAD_REQUEST,
          "warning"
        );
      }

      // Process upgrade
      // 1. Validate payment method
      // 2. Create subscription in payment provider (Stripe, etc.)
      // 3. Update user plan in database
      // 4. Send confirmation email

      // Mock response
      (res as any).json({
        success: true,
        data: {
          plan,
          status: "active",
          message: "Successfully upgraded to paid plan",
        },
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,
);

/**
 * POST /api/billing/add-brand
 * Add a new brand to subscription
 */
router.post(
  "/add-brand",
  authenticateUser,
  validateBody(AddBrandBodySchema),
  (async (req: Request, res: Response, next) => {
    try {
      const user = (req as any).user;

      if (!user) {
        throw new AppError(
          ErrorCode.UNAUTHORIZED,
          "Authentication required",
          HTTP_STATUS.UNAUTHORIZED,
          "warning"
        );
      }

      if (user.plan === "trial") {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          "Trial users cannot add brands. Please upgrade first.",
          HTTP_STATUS.FORBIDDEN,
          "warning"
        );
      }

      // ✅ VALIDATION: Body is already validated by middleware
      const { brandName } = req.body as z.infer<typeof AddBrandBodySchema>;

      // Add brand to database
      // Update subscription quantity in payment provider
      // Recalculate pricing (auto-switch to Agency at 5+)

      (res as any).json({
        success: true,
        data: {
          message: "Brand added successfully",
          brandName,
        },
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,
);

/**
 * GET /api/billing/invoice/:invoiceId/download
 * Download invoice PDF
 */
router.get(
  "/invoice/:invoiceId/download",
  authenticateUser,
  validateParams(InvoiceIdParamSchema),
  (async (req: Request, res: Response, next) => {
    try {
      const user = (req as any).user;
      // ✅ VALIDATION: Params are already validated by middleware
      const { invoiceId } = req.params as z.infer<typeof InvoiceIdParamSchema>;

      if (!user) {
        throw new AppError(
          ErrorCode.UNAUTHORIZED,
          "Authentication required",
          HTTP_STATUS.UNAUTHORIZED,
          "warning"
        );
      }

      // Fetch invoice from payment provider
      // Generate PDF or redirect to hosted invoice URL

      (res as any).json({
        success: true,
        data: {
          downloadUrl: `https://example.com/invoices/${invoiceId}.pdf`,
        },
      });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,
);

export default router;
