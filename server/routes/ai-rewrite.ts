/**
 * AI Content Rewrite Route
 * 
 * Rewrites social media content for different platforms using AI.
 * Used by PostEditor component for content optimization.
 */

import { Router, RequestHandler } from "express";
import { z } from "zod";
import { generateWithChatCompletions } from "../lib/openai-client";
import { AppError, asyncHandler } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { authenticateUser } from "../middleware/security";
import { validateBrandId } from "../middleware/validate-brand-id";
import { logger } from "../lib/logger";

const router = Router();

// ✅ VALIDATION: Zod schemas
const AIRewriteRequestSchema = z.object({
  content: z.string().min(1, "Content is required").max(5000, "Content must be 5000 characters or less"),
  platform: z.enum(["instagram", "facebook", "tiktok", "twitter", "linkedin", "threads", "pinterest", "youtube"]),
  brandId: z.string().uuid("Invalid brand ID format"),
  tone: z.enum(["professional", "casual", "friendly", "formal", "enthusiastic"]).optional(),
  style: z.enum(["concise", "detailed", "creative", "informative"]).optional(),
});

const AIRewriteResponseSchema = z.object({
  success: z.boolean(),
  rewrittenContent: z.string(),
});

type AIRewriteRequest = z.infer<typeof AIRewriteRequestSchema>;
type AIRewriteResponse = z.infer<typeof AIRewriteResponseSchema>;

/**
 * POST /api/ai-rewrite
 * Rewrite content for a specific platform
 * 
 * @requires authenticateUser - Must be authenticated
 * @requires validateBrandId - Must have access to the brand
 */
const handleAIRewrite: RequestHandler = asyncHandler(async (req, res) => {
  // Validate request body
  const validation = AIRewriteRequestSchema.safeParse(req.body);
  
  if (!validation.success) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Invalid request body",
      HTTP_STATUS.BAD_REQUEST,
      "warning",
      { errors: validation.error.errors }
    );
  }

  const { content, platform, brandId, tone = "professional", style = "concise" } = validation.data;

  logger.info("AI rewrite request", {
    brandId,
    platform,
    contentLength: content.length,
    tone,
    style,
  });

  // Build platform-specific prompt
  const platformGuidelines: Record<string, string> = {
    instagram: "Instagram post (max 2200 chars, engaging and visual, use emojis appropriately)",
    facebook: "Facebook post (max 63206 chars, conversational and engaging)",
    tiktok: "TikTok caption (max 2200 chars, trendy and energetic, use hashtags)",
    twitter: "Twitter/X post (max 280 chars, concise and impactful)",
    linkedin: "LinkedIn post (max 3000 chars, professional and insightful)",
    threads: "Threads post (max 500 chars, conversational and engaging)",
    pinterest: "Pinterest description (max 500 chars, descriptive and keyword-rich)",
    youtube: "YouTube description (max 5000 chars, detailed and SEO-friendly)",
  };

  const systemPrompt = `You are an expert social media content writer. 
Rewrite the following content for ${platformGuidelines[platform]}.
Tone: ${tone}
Style: ${style}

Guidelines:
- Maintain the core message and intent
- Optimize for the platform's best practices
- Keep it ${style} and ${tone}
- Do NOT add extra commentary or explanations
- Return ONLY the rewritten content`;

  const userPrompt = `Rewrite this content:\n\n${content}`;

  try {
    // Generate rewrite using OpenAI
    const rewrittenContent = await generateWithChatCompletions(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      {
        temperature: 0.7,
        maxTokens: 1000,
      }
    );

    if (!rewrittenContent || rewrittenContent.trim().length === 0) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        "AI generated empty response",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error"
      );
    }

    logger.info("AI rewrite successful", {
      brandId,
      platform,
      originalLength: content.length,
      rewrittenLength: rewrittenContent.length,
    });

    const response: AIRewriteResponse = {
      success: true,
      rewrittenContent: rewrittenContent.trim(),
    };

    res.json(response);
  } catch (error) {
    logger.error("AI rewrite failed", error instanceof Error ? error : new Error(String(error)), {
      brandId,
      platform,
    });

    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Failed to rewrite content",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
});

// Register route
router.post("/", authenticateUser, validateBrandId, handleAIRewrite);

export default router;

