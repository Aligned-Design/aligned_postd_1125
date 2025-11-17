import { Router } from "express";
import { z } from "zod";

const r = Router();

// Mock media library data
const MOCK_MEDIA = [
  {
    id: "asset_1",
    brandId: "brand_abd",
    type: "image",
    url: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=200",
    filename: "product-hero.jpg",
    size: 245600,
    width: 1920,
    height: 1080,
    mimeType: "image/jpeg",
    category: "product",
    tags: ["hero", "product", "featured"],
    uploadedBy: "Lauren",
    uploadedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: "asset_2",
    brandId: "brand_abd",
    type: "image",
    url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200",
    filename: "analytics-dashboard.jpg",
    size: 189400,
    width: 1600,
    height: 900,
    mimeType: "image/jpeg",
    category: "screenshot",
    tags: ["analytics", "dashboard", "data"],
    uploadedBy: "Sarah Johnson",
    uploadedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "asset_3",
    brandId: "brand_abd",
    type: "image",
    url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200",
    filename: "team-meeting.jpg",
    size: 312800,
    width: 2000,
    height: 1333,
    mimeType: "image/jpeg",
    category: "team",
    tags: ["team", "collaboration", "office"],
    uploadedBy: "Mike Chen",
    uploadedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "asset_4",
    brandId: "brand_abd",
    type: "video",
    url: "https://example.com/videos/promo.mp4",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=200",
    filename: "promo-video.mp4",
    size: 15728640,
    width: 1920,
    height: 1080,
    duration: 45,
    mimeType: "video/mp4",
    category: "video",
    tags: ["promo", "marketing", "video"],
    uploadedBy: "Emma Davis",
    uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

/** GET /api/media?brandId=...&category=...&limit=20
 *  List media assets with filtering and pagination
 */
r.get("/", (req, res) => {
  const { brandId, category, type, limit, offset, search } = z
    .object({
      brandId: z.string().default("brand_abd"),
      category: z.string().optional(),
      type: z.enum(["image", "video", "document"]).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      offset: z.coerce.number().int().min(0).default(0),
      search: z.string().optional(),
    })
    .parse(req.query);

  let filtered = MOCK_MEDIA.filter((m) => m.brandId === brandId);

  if (category) {
    filtered = filtered.filter((m) => m.category === category);
  }

  if (type) {
    filtered = filtered.filter((m) => m.type === type);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(
      (m) =>
        m.filename.toLowerCase().includes(searchLower) ||
        m.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
    );
  }

  const items = filtered.slice(offset, offset + limit);

  res.json({
    items,
    total: filtered.length,
    limit,
    offset,
    hasMore: offset + limit < filtered.length,
  });
});

/** GET /api/media/:assetId
 *  Get single asset details
 */
r.get("/:assetId", (req, res) => {
  const { assetId } = req.params;
  const asset = MOCK_MEDIA.find((m) => m.id === assetId);

  if (!asset) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "Asset not found",
      },
    });
  }

  res.json(asset);
});

/** GET /api/media/storage-usage?brandId=...
 *  Get storage usage stats
 */
r.get("/storage-usage", (req, res) => {
  const { brandId } = z
    .object({
      brandId: z.string().default("brand_abd"),
    })
    .parse(req.query);

  const brandAssets = MOCK_MEDIA.filter((m) => m.brandId === brandId);
  const totalSize = brandAssets.reduce((sum, asset) => sum + asset.size, 0);
  const totalCount = brandAssets.length;

  const byType = {
    image: brandAssets.filter((m) => m.type === "image").length,
    video: brandAssets.filter((m) => m.type === "video").length,
    document: brandAssets.filter((m) => m.type === "document").length,
  };

  res.json({
    brandId,
    totalSize,
    totalCount,
    byType,
    limit: 10737418240, // 10GB limit
    used: totalSize,
    percentUsed: (totalSize / 10737418240) * 100,
  });
});

/** DELETE /api/media/:assetId
 *  Delete an asset
 */
r.delete("/:assetId", (req, res) => {
  const { assetId } = req.params;

  res.json({
    success: true,
    assetId,
    deletedAt: new Date().toISOString(),
  });
});

export default r;
