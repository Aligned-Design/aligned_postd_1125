/**
 * Builder.io Routes
 * Handles AI content generation and webhook events from Builder.io
 */

import { Router } from 'express';
import { generateContent, builderWebhook } from './builder';

const router = Router();

/**
 * POST /api/builder/generate
 * AI-powered content generation for Builder.io pages
 * Integrates with OpenAI/Anthropic for dynamic content
 */
router.post('/generate', generateContent);

/**
 * POST /api/builder/webhook
 * Receive webhook events from Builder.io
 * Handles: content.publish, content.update, content.delete
 * Can trigger cache invalidation, revalidation, or other actions
 */
router.post('/webhook', builderWebhook);

export default router;
