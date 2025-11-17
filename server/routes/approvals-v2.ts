import { Router } from "express";
import { z } from "zod";

const r = Router();

// Mock approvals data
const MOCK_APPROVALS = [
  {
    id: "approval_1",
    brandId: "brand_abd",
    contentId: "post_123",
    title: "LinkedIn Post Review",
    platform: "linkedin",
    status: "pending",
    requestedBy: "Sarah Johnson",
    requestedAt: new Date(Date.now() - 86400000).toISOString(),
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    content: {
      headline: "5 Ways AI is Transforming Marketing",
      body: "Discover how leading brands are leveraging AI...",
    },
  },
  {
    id: "approval_2",
    brandId: "brand_abd",
    contentId: "post_124",
    title: "Twitter Thread Approval",
    platform: "twitter",
    status: "pending",
    requestedBy: "Mike Chen",
    requestedAt: new Date(Date.now() - 43200000).toISOString(),
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    content: {
      body: "Thread about our latest product launch...",
    },
  },
  {
    id: "approval_3",
    brandId: "brand_abd",
    contentId: "post_125",
    title: "Instagram Reel Script",
    platform: "instagram",
    status: "approved",
    requestedBy: "Emma Davis",
    requestedAt: new Date(Date.now() - 172800000).toISOString(),
    approvedBy: "Lauren",
    approvedAt: new Date(Date.now() - 86400000).toISOString(),
    content: {
      body: "Behind the scenes of our creative process...",
    },
  },
];

/** GET /api/approvals/pending?brandId=...&limit=10&offset=0
 *  List pending approvals with pagination
 */
r.get("/pending", (req, res) => {
  const { brandId, limit, offset, status } = z
    .object({
      brandId: z.string().default("brand_abd"),
      limit: z.coerce.number().int().min(1).max(100).default(10),
      offset: z.coerce.number().int().min(0).default(0),
      status: z.enum(["pending", "approved", "rejected"]).optional(),
    })
    .parse(req.query);

  let filtered = MOCK_APPROVALS.filter((a) => a.brandId === brandId);

  if (status) {
    filtered = filtered.filter((a) => a.status === status);
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

/** GET /api/approvals/:approvalId
 *  Get single approval details
 */
r.get("/:approvalId", (req, res) => {
  const { approvalId } = req.params;
  const approval = MOCK_APPROVALS.find((a) => a.id === approvalId);

  if (!approval) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "Approval not found",
      },
    });
  }

  res.json(approval);
});

/** POST /api/approvals/:approvalId/approve
 *  Approve content
 */
r.post("/:approvalId/approve", (req, res) => {
  const { approvalId } = req.params;
  const { notes } = z
    .object({
      notes: z.string().optional(),
    })
    .parse(req.body);

  res.json({
    success: true,
    approvalId,
    status: "approved",
    approvedAt: new Date().toISOString(),
    notes,
  });
});

/** POST /api/approvals/:approvalId/reject
 *  Reject content
 */
r.post("/:approvalId/reject", (req, res) => {
  const { approvalId } = req.params;
  const { reason } = z
    .object({
      reason: z.string(),
    })
    .parse(req.body);

  res.json({
    success: true,
    approvalId,
    status: "rejected",
    rejectedAt: new Date().toISOString(),
    reason,
  });
});

/** GET /api/approvals/history?brandId=...&limit=20
 *  Get approval history
 */
r.get("/history", (req, res) => {
  const { brandId, limit } = z
    .object({
      brandId: z.string().default("brand_abd"),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    })
    .parse(req.query);

  const history = MOCK_APPROVALS.filter(
    (a) => a.brandId === brandId && a.status !== "pending",
  ).slice(0, limit);

  res.json({ items: history, total: history.length });
});

export default r;
