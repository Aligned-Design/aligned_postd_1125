/**
 * Publishing Routes
 * Platform connections, OAuth, and publishing job management
 */

import { Router } from 'express';
import {
  initiateOAuth,
  handleOAuthCallback,
  getConnections,
  disconnectPlatform,
  publishContent,
  getPublishingJobs,
  retryJob,
  cancelJob,
  refreshToken,
  verifyConnection,
  updateScheduledTime
} from './publishing';
import { oauthRateLimiters } from '../lib/rate-limiting';
import { validateOAuthState } from '../lib/csrf-middleware';
import { extractAuthMiddleware } from '../lib/auth-middleware';
import { authenticateUser } from '../middleware/security';
import { requireScope } from '../middleware/requireScope';

const router = Router();

/**
 * ✅ SECURE: OAuth routes with rate limiting and CSRF validation
 * - Rate limited to prevent brute force attacks
 * - CSRF state validation on callback
 * - Auth context extraction on callback (required by handler)
 */
router.post('/oauth/initiate', oauthRateLimiters.initiate, initiateOAuth);
router.get(
  '/oauth/callback/:platform',
  oauthRateLimiters.callback,
  validateOAuthState,
  extractAuthMiddleware,
  handleOAuthCallback
);

// Connection management routes (with auth middleware)
router.get('/:brandId/connections', authenticateUser, requireScope('integrations:view'), getConnections);
router.post('/:brandId/:platform/disconnect', authenticateUser, requireScope('integrations:manage'), disconnectPlatform);
router.post('/:brandId/:platform/refresh', authenticateUser, requireScope('integrations:manage'), refreshToken);
router.get('/:brandId/:platform/verify', authenticateUser, requireScope('integrations:view'), verifyConnection);

// Publishing routes (with auth middleware)
router.post('/:brandId/publish', authenticateUser, requireScope('content:publish'), publishContent);
router.get('/:brandId/jobs', authenticateUser, requireScope('content:view'), getPublishingJobs);
router.post('/jobs/:jobId/retry', authenticateUser, requireScope('content:publish'), retryJob);
router.post('/jobs/:jobId/cancel', authenticateUser, requireScope('content:publish'), cancelJob);
router.patch('/jobs/:jobId/schedule', authenticateUser, requireScope('content:publish'), updateScheduledTime);

export default router;
