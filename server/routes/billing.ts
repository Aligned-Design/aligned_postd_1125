import { Router, Request, Response } from "express";
import { authenticateUser } from "../middleware/security";
import { AppError } from "../lib/error-middleware";

const router = Router();

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
router.get("/status", authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;

    if (!user) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
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

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("Error fetching billing status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch billing status",
    });
  }
});

/**
 * GET /api/billing/history
 * Get billing history and invoices
 */
router.get(
  "/history",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const user = req.user as any;

      if (!user) {
        throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
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

      res.json({
        success: true,
        data: invoices,
      });
    } catch (error) {
      console.error("Error fetching billing history:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch billing history",
      });
    }
  },
);

/**
 * POST /api/billing/upgrade
 * Upgrade from trial to paid plan
 */
router.post(
  "/upgrade",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const user = req.user as any;

      if (!user) {
        throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      }

      const { plan, paymentMethodId } = req.body;

      if (user.plan !== "trial") {
        return res.status(400).json({
          success: false,
          error: "User is already on a paid plan",
        });
      }

      // Process upgrade
      // 1. Validate payment method
      // 2. Create subscription in payment provider (Stripe, etc.)
      // 3. Update user plan in database
      // 4. Send confirmation email

      // Mock response
      res.json({
        success: true,
        data: {
          plan,
          status: "active",
          message: "Successfully upgraded to paid plan",
        },
      });
    } catch (error) {
      console.error("Error upgrading plan:", error);
      res.status(500).json({
        success: false,
        error: "Failed to upgrade plan",
      });
    }
  },
);

/**
 * POST /api/billing/add-brand
 * Add a new brand to subscription
 */
router.post(
  "/add-brand",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const user = req.user as any;

      if (!user) {
        throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      }

      if (user.plan === "trial") {
        return res.status(403).json({
          success: false,
          error: "Trial users cannot add brands. Please upgrade first.",
        });
      }

      const { brandName } = req.body;

      // Add brand to database
      // Update subscription quantity in payment provider
      // Recalculate pricing (auto-switch to Agency at 5+)

      res.json({
        success: true,
        data: {
          message: "Brand added successfully",
          brandName,
        },
      });
    } catch (error) {
      console.error("Error adding brand:", error);
      res.status(500).json({
        success: false,
        error: "Failed to add brand",
      });
    }
  },
);

/**
 * GET /api/billing/invoice/:invoiceId/download
 * Download invoice PDF
 */
router.get(
  "/invoice/:invoiceId/download",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const { invoiceId } = req.params;

      if (!user) {
        throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
      }

      // Fetch invoice from payment provider
      // Generate PDF or redirect to hosted invoice URL

      res.json({
        success: true,
        data: {
          downloadUrl: `https://example.com/invoices/${invoiceId}.pdf`,
        },
      });
    } catch (error) {
      console.error("Error downloading invoice:", error);
      res.status(500).json({
        success: false,
        error: "Failed to download invoice",
      });
    }
  },
);

export default router;
