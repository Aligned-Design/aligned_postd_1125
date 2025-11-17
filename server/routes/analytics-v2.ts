import { Router } from "express";
import { z } from "zod";

const r = Router();

/** GET /api/analytics/overview
 *  High-level tiles for the dashboard
 */
r.get("/overview", (_req, res) => {
  res.json({
    period: "last_7_days",
    totals: {
      impressions: 128430,
      clicks: 7421,
      ctr: 0.0578,
      followers: 324,
      postsPublished: 28,
    },
  });
});

/** GET /api/analytics/engagement-trend?days=30
 *  Sparkline data for charts
 */
r.get("/engagement-trend", (req, res) => {
  const { days } = z
    .object({ days: z.coerce.number().int().min(7).max(90).default(30) })
    .parse(req.query);
  const today = new Date();
  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - i));
    return {
      date: d.toISOString().slice(0, 10),
      likes: Math.round(40 + Math.random() * 60),
      comments: Math.round(10 + Math.random() * 25),
      shares: Math.round(5 + Math.random() * 15),
    };
  });
  res.json({ periodDays: days, series });
});

/** GET /api/analytics/content-performance?limit=10
 *  Tabular view for top content
 */
r.get("/content-performance", (req, res) => {
  const { limit } = z
    .object({ limit: z.coerce.number().int().min(1).max(50).default(10) })
    .parse(req.query);
  const items = Array.from({ length: limit }, (_, i) => ({
    id: `post_${i + 1}`,
    type: ["post", "reel", "story", "email", "blog"][i % 5],
    title: `Creative #${i + 1}`,
    publishedAt: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
    impressions: 1500 + i * 137,
    clicks: 120 + i * 11,
    ctr: 0.06 + i * 0.001,
    saves: 12 + i,
    comments: 8 + (i % 5),
    shares: 6 + (i % 3),
  }));
  res.json({ items, total: 1000 });
});

/** GET /api/analytics/top-posts?brandId=...&limit=5 */
r.get("/top-posts", (req, res) => {
  const qp = z
    .object({
      brandId: z.string().default("brand_abd"),
      limit: z.coerce.number().int().min(1).max(20).default(5),
    })
    .parse(req.query);

  const items = Array.from({ length: qp.limit }, (_, i) => ({
    id: `top_${i + 1}`,
    brandId: qp.brandId,
    title: `Top Post ${i + 1}`,
    platform: ["instagram", "facebook", "tiktok", "x", "linkedin"][i % 5],
    impressions: 5000 + i * 900,
    engagementRate: 0.085 + i * 0.002,
    url: `https://example.com/post/${i + 1}`,
  }));
  res.json({ brandId: qp.brandId, items });
});

export default r;
