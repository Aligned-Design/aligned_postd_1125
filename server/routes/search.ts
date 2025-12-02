import { Router } from "express";
import { z } from "zod";
import { searchService } from "../lib/search-service";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { requireScope } from "../middleware/requireScope";
import { assertBrandAccess } from "../lib/brand-access";

const router = Router();

const searchSchema = z.object({
  q: z.string().min(1).max(120),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  brand: z.string().uuid().optional(), // Filter by specific brand
  platform: z.string().optional(), // Filter by platform (instagram, facebook, etc.)
  types: z.string().optional(), // Comma-separated entity types: "brand,content,post,user,asset,campaign"
});

router.get(
  "/",
  requireScope("content:view"),
  async (req, res, next) => {
    try {
      const user = (req as any).user || (req as any).auth;
      if (!user) {
        throw new AppError(
          ErrorCode.UNAUTHORIZED,
          "Authentication required",
          HTTP_STATUS.UNAUTHORIZED,
          "warning",
        );
      }

      const { q, limit, brand, platform, types } = searchSchema.parse(req.query);

      // Parse entity types filter
      const entityTypes = types
        ? types.split(",").map((t) => t.trim() as any)
        : undefined;

      // Determine brandIds to search
      let brandIds: string[] | undefined;
      if (brand) {
        // ✅ SECURITY: Verify user has access to this brand using database-backed check
        await assertBrandAccess(req, brand, true, true);
        brandIds = [brand];
      } else {
        brandIds = Array.isArray(user.brandIds) ? user.brandIds : user.brandId ? [user.brandId] : undefined;
      }

      const results = await searchService.search(q, {
        brandIds,
        platform,
        entityTypes,
        role: user.role,
        limit,
      });

      (res as any).json({ 
        results,
        query: q,
        filters: {
          brand: brand || null,
          platform: platform || null,
          types: entityTypes || null,
        },
        total: results.length,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;

