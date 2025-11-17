import { RequestHandler } from "express";
import { asyncHandler } from "../lib/error-middleware";
import { generateBuilderContent } from "../workers/ai-generation";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";

/**
 * POST /api/builder/generate
 * AI-powered content generation for Builder.io
 */
export const generateContent: RequestHandler = asyncHandler(async (req, res) => {
  const { prompt, contentType, provider } = req.body;

  if (!prompt || !contentType) {
    throw new AppError(
      ErrorCode.MISSING_REQUIRED_FIELD,
      'Missing required fields: prompt, contentType',
      HTTP_STATUS.BAD_REQUEST,
      'warning',
      undefined,
      'Please provide both prompt and contentType in your request'
    );
  }

  const result = await generateBuilderContent({ prompt, agentType: contentType, provider });

  (res as any).json({
    success: true,
    data: result
  });
});

/**
 * POST /api/builder/webhook
 * Receive webhook events from Builder.io (content.publish, content.update, content.delete)
 */
export const builderWebhook: RequestHandler = asyncHandler(async (req, res) => {
  const { type, data } = req.body;

  console.log('Builder.io webhook received:', type, data);

  // Process webhook based on type
  switch (type) {
    case 'content.update':
      // TODO: Handle content updates (cache invalidation, etc.)
      break;
    case 'content.publish':
      // TODO: Handle content publishing (trigger builds, etc.)
      break;
    default:
      console.log('Unknown webhook type:', type);
  }

  (res as any).json({ success: true });
});
