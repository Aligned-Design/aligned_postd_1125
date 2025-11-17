/**
 * Validation Schemas
 *
 * Zod schemas for all API endpoints across PHASE 6-9
 * Ensures type-safe request validation with consistent error messages
 */

import { z } from 'zod';

// ==================== Platform Types ====================

const PLATFORMS = ['instagram', 'facebook', 'linkedin', 'twitter', 'google_business'] as const;
const PlatformSchema = z.enum(PLATFORMS);

const JOB_STATUSES = ['pending', 'processing', 'published', 'failed', 'cancelled', 'scheduled'] as const;
const JobStatusSchema = z.enum(JOB_STATUSES);

// ==================== Publishing Routes ====================

/**
 * OAuth Initiation
 * POST /api/publishing/oauth/initiate
 */
export const InitiateOAuthSchema = z.object({
  platform: PlatformSchema.describe('Social media platform to connect'),
  brandId: z.string()
    .uuid('Invalid brand ID format')
    .describe('UUID of the brand to connect'),
}).strict();

export type InitiateOAuthRequest = z.infer<typeof InitiateOAuthSchema>;

/**
 * OAuth Callback Query Params
 * GET /api/publishing/oauth/callback/:platform
 */
export const OAuthCallbackQuerySchema = z.object({
  code: z.string().optional().describe('Authorization code from OAuth provider'),
  state: z.string().optional().describe('State parameter for CSRF protection'),
  error: z.string().optional().describe('Error code if authorization failed'),
}).refine(
  (data) => data.code || data.error,
  { message: 'Either code or error must be provided' }
);

export type OAuthCallbackQuery = z.infer<typeof OAuthCallbackQuerySchema>;

/**
 * Publish Content Request
 * POST /api/publishing/:brandId/publish
 */
export const PublishContentSchema = z.object({
  brandId: z.string()
    .uuid('Invalid brand ID')
    .describe('The brand to publish from'),
  platforms: z.array(PlatformSchema)
    .min(1, 'At least one platform is required')
    .describe('Target platforms for publishing'),
  content: z.string()
    .min(1, 'Content cannot be empty')
    .max(5000, 'Content exceeds maximum length of 5000 characters')
    .describe('The content to publish'),
  scheduledAt: z.string()
    .datetime()
    .optional()
    .describe('ISO 8601 timestamp for scheduled publishing'),
  validateOnly: z.boolean()
    .optional()
    .describe('If true, only validate without publishing'),
  mediaAssets: z.array(z.string().uuid())
    .optional()
    .describe('UUIDs of media assets to include'),
  contentId: z.string()
    .uuid('Invalid content ID')
    .optional()
    .describe('Content ID if publishing existing AI-generated content (requires approval)'),
  postId: z.string()
    .uuid('Invalid post ID')
    .optional()
    .describe('Post ID if publishing existing content (requires approval)'),
}).strict();

export type PublishContentRequest = z.infer<typeof PublishContentSchema>;

/**
 * Get Publishing Jobs Query Params
 * GET /api/publishing/:brandId/jobs
 */
export const GetJobsQuerySchema = z.object({
  status: JobStatusSchema.optional().describe('Filter by job status'),
  platform: z.enum([...PLATFORMS, 'all']).optional().describe('Filter by platform'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('50')
    .refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100')
    .describe('Number of results to return'),
  offset: z.string().regex(/^\d+$/).transform(Number).default('0')
    .refine(n => n >= 0, 'Offset must be >= 0')
    .describe('Number of results to skip'),
}).strict();

export type GetJobsQuery = z.infer<typeof GetJobsQuerySchema>;

/**
 * Retry Job Params
 * POST /api/publishing/:jobId/retry
 */
export const RetryJobParamsSchema = z.object({
  jobId: z.string()
    .uuid('Invalid job ID')
    .describe('ID of the job to retry'),
});

export type RetryJobParams = z.infer<typeof RetryJobParamsSchema>;

/**
 * Cancel Job Params
 * POST /api/publishing/:jobId/cancel
 */
export const CancelJobParamsSchema = z.object({
  jobId: z.string()
    .uuid('Invalid job ID')
    .describe('ID of the job to cancel'),
});

export type CancelJobParams = z.infer<typeof CancelJobParamsSchema>;

// ==================== Analytics Routes ====================

/**
 * Get Analytics Query Params
 * GET /api/analytics/:brandId
 */
export const GetAnalyticsQuerySchema = z.object({
  days: z.string().regex(/^\d+$/).transform(Number).default('30')
    .refine(n => n > 0 && n <= 365, 'Days must be between 1 and 365')
    .describe('Number of days to analyze'),
  platforms: z.string().optional().describe('Comma-separated platform list'),
}).strict();

export type GetAnalyticsQuery = z.infer<typeof GetAnalyticsQuerySchema>;

/**
 * Get Insights Query Params
 * GET /api/analytics/:brandId/insights
 */
export const GetInsightsQuerySchema = z.object({
  days: z.string().regex(/^\d+$/).transform(Number).default('30')
    .refine(n => n > 0 && n <= 365, 'Days must be between 1 and 365'),
  focus: z.enum(['engagement', 'reach', 'growth', 'content']).optional()
    .describe('Type of insights to focus on'),
}).strict();

export type GetInsightsQuery = z.infer<typeof GetInsightsQuerySchema>;

/**
 * Sync Platform Data Request
 * POST /api/analytics/:brandId/sync
 */
export const SyncPlatformDataSchema = z.object({
  platforms: z.array(PlatformSchema)
    .optional()
    .describe('Platforms to sync (defaults to all connected)'),
  dateRange: z.object({
    start: z.string().datetime('Invalid start date').describe('Start date for sync'),
    end: z.string().datetime('Invalid end date').describe('End date for sync'),
  }).optional().refine(
    (data) => !data || new Date(data.start) < new Date(data.end),
    { message: 'Start date must be before end date' }
  ),
}).strict();

export type SyncPlatformDataRequest = z.infer<typeof SyncPlatformDataSchema>;

/**
 * Create Goal Request
 * POST /api/analytics/:brandId/goals
 */
export const CreateGoalSchema = z.object({
  name: z.string()
    .min(1, 'Goal name required')
    .max(100, 'Goal name too long')
    .describe('Name of the goal'),
  type: z.enum(['followers', 'engagement', 'reach', 'conversion'])
    .describe('Type of goal'),
  targetValue: z.number()
    .positive('Target value must be positive')
    .describe('Target value to achieve'),
  deadline: z.string()
    .datetime('Invalid deadline date')
    .describe('ISO 8601 deadline date'),
  platforms: z.array(PlatformSchema)
    .optional()
    .describe('Platforms this goal applies to'),
}).strict();

export type CreateGoalRequest = z.infer<typeof CreateGoalSchema>;

/**
 * Provide Feedback Request
 * POST /api/analytics/:brandId/feedback
 */
export const ProvideFeedbackSchema = z.object({
  contentId: z.string()
    .uuid('Invalid content ID')
    .describe('ID of the content'),
  feedback: z.string()
    .min(1, 'Feedback cannot be empty')
    .max(500, 'Feedback too long')
    .describe('User feedback'),
  rating: z.number()
    .int()
    .min(1, 'Rating must be 1-5')
    .max(5, 'Rating must be 1-5')
    .optional()
    .describe('Rating 1-5'),
}).strict();

export type ProvideFeedbackRequest = z.infer<typeof ProvideFeedbackSchema>;

// ==================== Media Routes ====================

/**
 * Media Upload Form Data
 * POST /api/media/upload
 * Note: This would use multipart/form-data, so validation differs
 */
export const MediaUploadSchema = z.object({
  brandId: z.string()
    .uuid('Invalid brand ID')
    .describe('Brand ID for upload'),
  category: z.enum(['images', 'videos', 'graphics', 'documents'])
    .optional()
    .describe('Asset category'),
  tags: z.array(z.string())
    .optional()
    .describe('Tags for the asset'),
  // file is handled separately as FormData
}).strict();

export type MediaUploadRequest = z.infer<typeof MediaUploadSchema>;

/**
 * List Media Query Params
 * GET /api/media/list
 */
export const ListMediaQuerySchema = z.object({
  brandId: z.string()
    .uuid('Invalid brand ID')
    .describe('Brand ID to list media for'),
  category: z.string().optional().describe('Filter by category'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('50')
    .refine(n => n > 0 && n <= 500, 'Limit must be 1-500'),
  offset: z.string().regex(/^\d+$/).transform(Number).default('0')
    .refine(n => n >= 0, 'Offset must be >= 0'),
  search: z.string().optional().describe('Search media by name or tags'),
}).strict();

export type ListMediaQuery = z.infer<typeof ListMediaQuerySchema>;

/**
 * Duplicate Asset Check Query
 * GET /api/media/duplicate
 */
export const CheckDuplicateQuerySchema = z.object({
  brandId: z.string()
    .uuid('Invalid brand ID'),
  fileHash: z.string()
    .regex(/^[a-f0-9]{64}$/, 'Invalid SHA256 hash')
    .describe('SHA256 hash of the file'),
}).strict();

export type CheckDuplicateQuery = z.infer<typeof CheckDuplicateQuerySchema>;

/**
 * Track Asset Usage Request
 * POST /api/media/track-usage
 */
export const TrackAssetUsageSchema = z.object({
  assetId: z.string()
    .uuid('Invalid asset ID')
    .describe('Asset ID'),
  usageType: z.enum(['published', 'draft', 'preview', 'archived'])
    .describe('How the asset was used'),
  platform: PlatformSchema.optional().describe('Platform where used'),
}).strict();

export type TrackAssetUsageRequest = z.infer<typeof TrackAssetUsageSchema>;

// ==================== White Label Routes ====================

/**
 * Update White Label Config Request
 * POST /api/white-label/:clientId/config
 */
export const UpdateWhiteLabelConfigSchema = z.object({
  brandName: z.string()
    .min(1, 'Brand name required')
    .max(100, 'Brand name too long')
    .optional(),
  logo: z.string().url('Invalid logo URL').optional(),
  primaryColor: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color')
    .optional(),
  secondaryColor: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color')
    .optional(),
  customDomain: z.string().url('Invalid domain').optional(),
  emailFrom: z.string().email('Invalid email').optional(),
}).strict();

export type UpdateWhiteLabelConfigRequest = z.infer<typeof UpdateWhiteLabelConfigSchema>;

// ==================== Client Portal Routes ====================

/**
 * Approve Content Request
 * POST /api/client-portal/:projectId/approve
 */
export const ApproveContentSchema = z.object({
  contentId: z.string()
    .uuid('Invalid content ID')
    .describe('Content to approve'),
  approved: z.boolean().describe('Approval decision'),
  feedback: z.string()
    .max(500, 'Feedback too long')
    .optional()
    .describe('Optional approval feedback'),
}).strict();

export type ApproveContentRequest = z.infer<typeof ApproveContentSchema>;

/**
 * Add Content Comment Request
 * POST /api/client-portal/:projectId/comments
 */
export const AddCommentSchema = z.object({
  contentId: z.string()
    .uuid('Invalid content ID'),
  comment: z.string()
    .min(1, 'Comment cannot be empty')
    .max(500, 'Comment too long'),
  isInternal: z.boolean()
    .optional()
    .default(false)
    .describe('Internal comment (not visible to client)'),
}).strict();

export type AddCommentRequest = z.infer<typeof AddCommentSchema>;

// ==================== Workflow Routes ====================

/**
 * Create Workflow Template Request
 * POST /api/workflows/templates
 */
export const CreateWorkflowTemplateSchema = z.object({
  name: z.string()
    .min(1, 'Template name required')
    .max(100, 'Template name too long'),
  description: z.string()
    .max(500, 'Description too long')
    .optional(),
  steps: z.array(z.object({
    id: z.string().describe('Step ID'),
    name: z.string().describe('Step name'),
    type: z.enum(['approval', 'generation', 'review', 'publish']).describe('Step type'),
    config: z.record(z.unknown()).optional().describe('Step configuration'),
  })).min(1, 'At least one step required'),
}).strict();

export type CreateWorkflowTemplateRequest = z.infer<typeof CreateWorkflowTemplateSchema>;

/**
 * Start Workflow Request
 * POST /api/workflows/start
 */
export const StartWorkflowSchema = z.object({
  templateId: z.string()
    .uuid('Invalid template ID'),
  brandId: z.string()
    .uuid('Invalid brand ID'),
  context: z.record(z.unknown())
    .optional()
    .describe('Workflow execution context'),
}).strict();

export type StartWorkflowRequest = z.infer<typeof StartWorkflowSchema>;

/**
 * Process Workflow Action Request
 * POST /api/workflows/:workflowId/action
 */
export const ProcessWorkflowActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'proceed', 'cancel'])
    .describe('Action to perform'),
  stepId: z.string()
    .uuid('Invalid step ID')
    .describe('Step that action applies to'),
  data: z.record(z.unknown())
    .optional()
    .describe('Additional data for the action'),
}).strict();

export type ProcessWorkflowActionRequest = z.infer<typeof ProcessWorkflowActionSchema>;

// ==================== AI Routes ====================

/**
 * Generate Content Request
 * POST /api/ai/generate
 */
export const GenerateContentSchema = z.object({
  brandId: z.string()
    .uuid('Invalid brand ID')
    .describe('Brand context for generation'),
  prompt: z.string()
    .min(10, 'Prompt too short')
    .max(1000, 'Prompt too long')
    .describe('Content generation prompt'),
  platforms: z.array(PlatformSchema)
    .optional()
    .describe('Target platforms'),
  style: z.enum(['professional', 'casual', 'creative', 'promotional'])
    .optional()
    .describe('Content style'),
  tone: z.enum(['formal', 'friendly', 'humorous', 'serious'])
    .optional()
    .describe('Tone of content'),
  maxLength: z.number()
    .int()
    .positive()
    .optional()
    .describe('Maximum content length'),
}).strict();

export type GenerateContentRequest = z.infer<typeof GenerateContentSchema>;

/**
 * Advisor Request
 * POST /api/ai/advisor
 */
export const AdvisorRequestSchema = z.object({
  brandId: z.string()
    .uuid('Invalid brand ID')
    .describe('Brand ID for advisor insights'),
  workspaceId: z.string()
    .uuid('Invalid workspace ID')
    .optional()
    .describe('Workspace ID (can be derived from brandId, but explicit for validation)'),
  timeRange: z.enum(['7d', '30d', '90d', 'all'])
    .optional()
    .describe('Time range for analysis'),
  period: z.string()
    .optional()
    .describe('Alternative time period specification'),
  // Collaboration context (optional)
  requestId: z.string()
    .optional()
    .describe('Request ID for collaboration tracking'),
  strategyBriefId: z.string()
    .optional()
    .describe('StrategyBrief ID to read/write'),
  contentPackageId: z.string()
    .optional()
    .describe('ContentPackage ID to read/write'),
  metrics: z.object({
    topPosts: z.array(z.object({
      title: z.string(),
      platform: z.string(),
      engagement: z.number(),
      reach: z.number(),
    })).optional(),
    bestTimes: z.array(z.string()).optional(),
    underperformingChannels: z.array(z.string()).optional(),
    recentAnalytics: z.object({
      totalReach: z.number().optional(),
      totalEngagement: z.number().optional(),
      avgEngagementRate: z.number().optional(),
    }).optional(),
  }).optional()
    .describe('Analytics metrics for context'),
  context: z.record(z.unknown())
    .optional()
    .describe('Additional context'),
  brandContext: z.object({
    tone: z.string().optional(),
    values: z.array(z.string()).optional(),
    targetAudience: z.string().optional(),
    forbiddenPhrases: z.array(z.string()).optional(),
    requiredDisclaimers: z.array(z.string()).optional(),
    allowedToneDescriptors: z.array(z.string()).optional(),
  }).strict().optional()
    .describe('Optional brand overrides'),
}).strict();

export type AdvisorRequest = z.infer<typeof AdvisorRequestSchema>;

/**
 * Doc Agent Generation Request
 * POST /api/ai/doc
 */
export const AiDocGenerationRequestSchema = z.object({
  brandId: z.string()
    .uuid('Invalid brand ID')
    .describe('Brand ID for content generation'),
  workspaceId: z.string()
    .uuid('Invalid workspace ID')
    .optional()
    .describe('Workspace ID (can be derived from brandId, but explicit for validation)'),
  topic: z.string()
    .min(1, 'Topic is required')
    .max(500, 'Topic too long')
    .describe('Content topic'),
  platform: z.string()
    .min(1, 'Platform is required')
    .describe('Target platform'),
  contentType: z.enum(['caption', 'email', 'blog', 'ad', 'script', 'other'])
    .describe('Type of content to generate'),
  // Collaboration context (optional)
  requestId: z.string()
    .optional()
    .describe('Request ID for collaboration tracking'),
  strategyBriefId: z.string()
    .optional()
    .describe('StrategyBrief ID to read (from Advisor)'),
  contentPackageId: z.string()
    .optional()
    .describe('ContentPackage ID to read/write'),
  tone: z.string()
    .optional()
    .describe('Content tone'),
  length: z.enum(['short', 'medium', 'long'])
    .optional()
    .describe('Content length'),
  callToAction: z.string()
    .max(200, 'Call to action too long')
    .optional()
    .describe('Call to action text'),
  additionalContext: z.string()
    .max(1000, 'Additional context too long')
    .optional()
    .describe('Additional context for generation'),
  brandContext: z.object({
    tone: z.string().optional(),
    values: z.array(z.string()).optional(),
    targetAudience: z.string().optional(),
    forbiddenPhrases: z.array(z.string()).optional(),
    requiredDisclaimers: z.array(z.string()).optional(),
    allowedToneDescriptors: z.array(z.string()).optional(),
  }).strict().optional()
    .describe('Optional brand overrides'),
}).strict();

export type AiDocGenerationRequest = z.infer<typeof AiDocGenerationRequestSchema>;

/**
 * Design Agent Generation Request
 * POST /api/ai/design
 */
export const AiDesignGenerationRequestSchema = z.object({
  brandId: z.string()
    .uuid('Invalid brand ID')
    .describe('Brand ID for design generation'),
  workspaceId: z.string()
    .uuid('Invalid workspace ID')
    .optional()
    .describe('Workspace ID (can be derived from brandId, but explicit for validation)'),
  campaignName: z.string()
    .max(200, 'Campaign name too long')
    .optional()
    .describe('Campaign name'),
  platform: z.string()
    .min(1, 'Platform is required')
    .describe('Target platform'),
  format: z.enum(['story', 'feed', 'reel', 'short', 'ad', 'other'])
    .describe('Visual format'),
  // Collaboration context (optional)
  requestId: z.string()
    .optional()
    .describe('Request ID for collaboration tracking'),
  strategyBriefId: z.string()
    .optional()
    .describe('StrategyBrief ID to read (from Advisor)'),
  contentPackageId: z.string()
    .optional()
    .describe('ContentPackage ID to read (from Copywriter) and write'),
  tone: z.string()
    .optional()
    .describe('Visual tone'),
  visualStyle: z.string()
    .max(200, 'Visual style too long')
    .optional()
    .describe('Visual style description'),
  additionalContext: z.string()
    .max(1000, 'Additional context too long')
    .optional()
    .describe('Additional context for generation'),
  brandContext: z.object({
    tone: z.string().optional(),
    values: z.array(z.string()).optional(),
    targetAudience: z.string().optional(),
    forbiddenPhrases: z.array(z.string()).optional(),
    requiredDisclaimers: z.array(z.string()).optional(),
    allowedToneDescriptors: z.array(z.string()).optional(),
  }).strict().optional()
    .describe('Optional brand overrides'),
}).strict();

export type AiDesignGenerationRequest = z.infer<typeof AiDesignGenerationRequestSchema>;

// ==================== Utilities ====================

/**
 * Create a validation middleware function
 */
export function createValidationMiddleware<T extends z.ZodSchema>(schema: T) {
  return (req: { body: unknown }, res: { status: (code: number) => { json: (data: unknown) => void } }, next: (error?: unknown) => void) => {
    try {
      // Validate request body
      if (Object.keys(req.body).length > 0) {
        req.body = schema.parse(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            statusCode: 400,
            validationErrors: error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code,
            })),
          },
        });
      } else {
        next(error);
      }
    }
  };
}

/**
 * Validate query parameters
 */
export function validateQuery<T extends z.ZodSchema>(schema: T, query: unknown) {
  return schema.parse(query);
}

/**
 * Validate URL parameters
 */
export function validateParams<T extends z.ZodSchema>(schema: T, params: unknown) {
  return schema.parse(params);
}
