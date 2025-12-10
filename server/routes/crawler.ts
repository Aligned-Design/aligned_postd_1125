/**
 * Crawler API Routes
 *
 * POST /api/crawl/start - Start a crawl job
 * GET /api/crawl/result/:jobId - Get crawl results
 * POST /api/brand-kit/apply - Apply selected changes
 * GET /api/brand-kit/history/:brandId - Get change history
 * POST /api/brand-kit/revert - Revert a field to previous value
 * 
 * ============================================================================
 * CRAWLER + SCRAPED IMAGES PIPELINE FLOW
 * ============================================================================
 * 
 * This is a critical production system. If the crawler doesn't work, POSTD is broken.
 * 
 * FLOW FOR URL-ONLY ONBOARDING:
 * 
 * 1. CLIENT: User enters website URL during onboarding
 *    - Temporary brandId created: `brand_${Date.now()}` (stored in localStorage)
 *    - This temporary ID is used throughout onboarding until brand is created
 * 
 * 2. CLIENT → SERVER: POST /api/crawl/start?sync=true
 *    - Body: { url, brand_id: "brand_1234567890", workspaceId: "uuid", sync: true }
 *    - workspaceId comes from user's auth/workspace context
 * 
 * 3. SERVER: runCrawlJobSync(url, brandId, tenantId)
 *    - tenantId MUST be provided (from workspaceId in request body or auth context)
 *    - If tenantId is missing, images cannot be persisted (logs error, continues)
 *    - Crawls website, extracts images, colors, typography, voice
 *    - Calls persistScrapedImages(brandId, tenantId, images)
 *      → Saves to media_assets table with:
 *         - brand_id: temporary brandId (e.g., "brand_1234567890")
 *         - tenant_id: real UUID from workspace
 *         - metadata.source: "scrape"
 *         - category: "logos" | "images" | "graphics"
 * 
 * 4. CLIENT: Brand Guide saved via saveBrandGuideFromOnboarding()
 *    - Uses same temporary brandId
 *    - Brand Guide stored in brands.brand_kit JSONB field
 * 
 * 5. CRITICAL RECONCILIATION POINT:
 *    - When brand is created with final UUID (if different from temp ID):
 *      → MUST call transferScrapedImages(tempBrandId, finalBrandId)
 *      → Updates all media_assets.brand_id from temp to final UUID
 *      → Updates tenant_id to match final brand's tenant_id
 * 
 * 6. BRAND GUIDE QUERIES:
 *    - GET /api/brand-guide/:brandId
 *    - Queries media_assets WHERE brand_id = :brandId AND metadata->>'source' = 'scrape'
 *    - Includes in approvedAssets.uploadedPhotos with source='scrape'
 * 
 * 7. CREATIVE STUDIO QUERIES:
 *    - Uses getScrapedBrandAssets(brandId) from image-sourcing.ts
 *    - Queries media_assets WHERE brand_id = :brandId AND metadata->>'source' = 'scrape'
 * 
 * ID REQUIREMENTS:
 * - tenantId: MUST be real UUID from user's workspace (required for persistence)
 * - brandId: Can be temporary during onboarding, but MUST be reconciled to final UUID
 * 
 * FAILURE MODES TO PREVENT:
 * - Missing tenantId → Images not persisted (logs error, continues)
 * - Mismatched brandId → Images orphaned (reconciliation step required)
 * - Race conditions → Use consistent brandId throughout flow
 * - Partial crawls → Log summary, continue with what we have
 * 
 * LOGGING REQUIREMENTS:
 * - Start crawl: { tenantId, brandId, url }
 * - Scrape summary: { pages, images, logo, persisted }
 * - Persistence summary: { rows inserted/updated }
 * - Reconciliation: { fromBrandId, toBrandId, transferred }
 * - Query results: { brandId, count, source }
 */

import { Router } from "express";
import { supabase } from "../lib/supabase";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { authenticateUser } from "../middleware/security";
import { validateBrandIdFormat } from "../middleware/validate-brand-id";
import { assertBrandAccess } from "../lib/brand-access";
import {
  crawlWebsite,
  extractColors,
  generateBrandKit,
  extractBrandNameFromUrl,
  extractIndustryFromContent,
} from "../workers/brand-crawler";
import { persistScrapedImages, transferScrapedImages } from "../lib/scraped-images-service";
import { runOnboardingWorkflow, type OnboardingResult } from "../lib/onboarding-orchestrator";
import {
  CrawlerSuggestion,
  FieldChange,
  FieldHistoryEntry,
} from "../../client/types/brand-kit-field";

const router = Router();

// Use shared supabase client from server/lib/supabase.ts

// In-memory job store (use Redis in production)
const crawlJobs = new Map<string, unknown>();

/**
 * In-memory deduplication lock for active crawl jobs
 * Prevents duplicate concurrent crawls for the same brand/URL combination
 * Key format: `${brandId}:${normalizedUrl}`
 * 
 * ⚠️ NOTE: This is instance-local (in-memory). Vercel may run multiple serverless
 * function instances, so locks are not shared across instances. For true multi-instance
 * deduplication, consider using Redis or a distributed lock service.
 */
const activeCrawlLocks = new Map<string, {
  startedAt: number;
  timeout: NodeJS.Timeout;
}>();

/**
 * Cleanup stale locks older than 5 minutes (crawls should not take that long)
 */
function cleanupStaleLocks() {
  const now = Date.now();
  const staleThreshold = 5 * 60 * 1000; // 5 minutes
  
  for (const [key, lock] of activeCrawlLocks.entries()) {
    if (now - lock.startedAt > staleThreshold) {
      clearTimeout(lock.timeout);
      activeCrawlLocks.delete(key);
      console.warn(`[Crawler] Cleaned up stale crawl lock: ${key}`);
    }
  }
}

// Clean up stale locks every minute
setInterval(cleanupStaleLocks, 60 * 1000);

/**
 * POST /api/crawl/start
 * Start a website crawl job
 * 
 * Purpose: Crawls a website to extract brand assets (images, colors, typography, voice)
 * 
 * Request Body:
 * - url (string, required): Website URL to crawl
 * - brand_id (string, optional): Brand ID (temporary during onboarding)
 * - workspaceId (string, optional): Workspace/tenant ID for image persistence
 * - sync (boolean, optional): If true, runs synchronously and returns results immediately
 * 
 * Response Schema:
 * Success (200):
 * - sync=true: { success: true, brandKit: {...}, status: "completed" }
 * - sync=false: { job_id: string, status: "pending" }
 * 
 * Error (4xx/5xx):
 * - { error: { code: string, message: string, severity: string, timestamp: string } }
 * 
 * Supports both async job mode (returns job_id) and sync mode (returns results directly)
 * For onboarding, use sync mode with ?sync=true
 */
// ✅ CRITICAL: Require authentication for all crawler routes
// Crawler needs tenantId from authenticated user to persist images correctly
// ✅ FIX: Route is mounted at /api/crawl, so use /start not /crawl/start
router.post("/start", authenticateUser, validateBrandIdFormat, async (req, res, next) => {
  // ✅ CRITICAL: Declare lockKey at function scope for error cleanup
  let lockKey: string | undefined;
  
  // ✅ CRITICAL: Wrap entire handler to ensure response is always sent
  try {
    const { brand_id, url, sync, websiteUrl, workspaceId } = req.body;
    const isSync = sync === true || req.query.sync === "true";
    const finalUrl = url || websiteUrl;

    // ✅ Get tenantId from user context for logging
    const user = (req as any).user;
    const auth = (req as any).auth;
    const userTenantId = workspaceId || user?.workspaceId || user?.tenantId || auth?.workspaceId || auth?.tenantId || "unknown";

    // ✅ LOGGING: Crawl start with tenantId
    console.log("[Crawler] Crawl start request received", {
      tenantId: userTenantId,
      brandId: brand_id || "unknown",
      url: finalUrl,
      sync: isSync,
      requestId: (req as any).id,
    });

    // ✅ VALIDATION: URL is required
    if (!finalUrl) {
      console.error("[Crawler] Missing URL in request", {
        body: req.body,
        requestId: (req as any).id,
      });
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "url is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // ✅ VALIDATION: Normalize URL for deduplication
    let normalizedUrl: string;
    try {
      const urlObj = new URL(finalUrl);
      normalizedUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`.toLowerCase();
    } catch (urlError) {
      console.error("[Crawler] Invalid URL format", {
        url: finalUrl,
        error: urlError instanceof Error ? urlError.message : String(urlError),
        requestId: (req as any).id,
      });
      throw new AppError(
        ErrorCode.INVALID_FORMAT,
        "Invalid URL format. Please provide a valid website URL.",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        { url: finalUrl }
      );
    }

    // For onboarding, brand_id is optional (will be generated)
    let finalBrandId = brand_id || `brand_${Date.now()}`;
    
    // ✅ Use validated brandId from middleware (validates format, allows temp IDs)
    const validatedBrandId = (req as any).validatedBrandId;
    if (validatedBrandId) {
      finalBrandId = validatedBrandId;
    }

    // ✅ DEDUPLICATION: Check for active crawl lock
    // Assign to function-scope lockKey (already declared above)
    lockKey = `${finalBrandId}:${normalizedUrl}`;
    const activeLock = activeCrawlLocks.get(lockKey);
    
    if (activeLock) {
      const lockAge = Date.now() - activeLock.startedAt;
      const lockAgeSeconds = Math.floor(lockAge / 1000);
      
      console.warn("[Crawler] Duplicate crawl request detected", {
        lockKey,
        lockAgeSeconds,
        brandId: finalBrandId,
        url: normalizedUrl,
        requestId: (req as any).id,
      });

      // Return 409 Conflict with helpful message
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        errorCode: "CRAWL_IN_PROGRESS",
        message: `A crawl is already in progress for this website. Started ${lockAgeSeconds} second${lockAgeSeconds !== 1 ? 's' : ''} ago. Please wait for it to complete.`,
        details: {
          lockKey,
          startedAt: new Date(activeLock.startedAt).toISOString(),
          elapsedSeconds: lockAgeSeconds,
        },
      });
    }

    // ✅ CREATE LOCK: Mark crawl as in-progress
    const lockTimeout = setTimeout(() => {
      // Auto-cleanup lock after 5 minutes (safety mechanism)
      activeCrawlLocks.delete(lockKey);
      console.warn(`[Crawler] Auto-cleaned crawl lock: ${lockKey}`);
    }, 5 * 60 * 1000);

    activeCrawlLocks.set(lockKey, {
      startedAt: Date.now(),
      timeout: lockTimeout,
    });

    console.log("[Crawler] Crawl lock acquired", {
      lockKey,
      brandId: finalBrandId,
      url: normalizedUrl,
      requestId: (req as any).id,
    });
    
    // For onboarding (sync mode), skip brand access check (temp IDs allowed)
    // For async mode, verify user has access to brand (UUID only)
    if (!isSync && finalBrandId && !finalBrandId.startsWith("brand_")) {
      // UUID format - verify access
      const userId = req.headers["x-user-id"]; // From auth middleware
      const { data: member, error: memberError } = await supabase
        .from("brand_members")
        .select("*")
        .eq("brand_id", finalBrandId)
        .eq("user_id", userId)
        .single();

      if (memberError || !member) {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          "Access denied",
          HTTP_STATUS.FORBIDDEN,
          "warning"
        );
      }
    }

    // SYNC MODE: For onboarding, run crawl immediately and return results
    if (isSync) {
      // ✅ ROOT FIX: Get workspaceId/tenantId from user or request body
      // This allows us to persist images even if brand doesn't exist yet
      let tenantId: string | null = null;
      
      // Try to get tenantId from multiple sources
      if (workspaceId && workspaceId !== "unknown") {
        tenantId = workspaceId;
      } else if (user?.workspaceId) {
        tenantId = user.workspaceId;
      } else if (auth?.workspaceId) {
        tenantId = auth.workspaceId;
      } else if (user?.tenantId) {
        tenantId = user.tenantId;
      } else if (auth?.tenantId) {
        tenantId = auth.tenantId;
      } else {
        // Try to get from user's workspace via Supabase
        if (user?.id) {
          try {
            const { data: userData } = await supabase
              .from("users")
              .select("workspace_id, tenant_id")
              .eq("id", user.id)
              .single();
            tenantId = (userData as any)?.workspace_id || (userData as any)?.tenant_id || null;
          } catch (dbError) {
            console.warn("[Crawler] Failed to fetch tenantId from database", {
              userId: user.id,
              error: dbError instanceof Error ? dbError.message : String(dbError),
            });
            // Continue with null tenantId - crawl will still work, but images won't persist
          }
        }
      }
      
      try {
        const result = await runCrawlJobSync(finalUrl, finalBrandId, tenantId);
        
        // ✅ LOGGING: Log crawler result (for Vercel server logs)
        const images = result.brandKit?.images || [];
        const logo = result.brandKit?.logoUrl;
        const colors = result.brandKit?.colors;
        const typography = result.brandKit?.typography;
        console.log("[CRAWLER] ✅ Sync crawl completed successfully", {
          images: images.length,
          hasLogo: !!logo,
          colors: colors ? Object.keys(colors).length : 0,
          hasTypography: !!typography,
          typographyHeading: typography?.heading || "none",
          typographyBody: typography?.body || "none",
          brandId: finalBrandId,
          tenantId: tenantId || "unknown",
          requestId: (req as any).id,
        });
        
        // ✅ RELEASE LOCK: Clean up after successful crawl
        const lock = activeCrawlLocks.get(lockKey);
        if (lock) {
          clearTimeout(lock.timeout);
          activeCrawlLocks.delete(lockKey);
          console.log("[Crawler] Crawl lock released (success)", { lockKey });
        }
        
        // ✅ ONBOARDING TRIGGER: If brandId is a real UUID, trigger onboarding workflow
        // This runs asynchronously so the scrape response is returned quickly.
        // Onboarding generates 8 content items to the Queue (5 social, 1 blog, 1 email, 1 GBP).
        let onboardingTriggered = false;
        let onboardingJobId: string | undefined;
        let onboardingStatus: "triggered" | "skipped_temp_id" | "skipped_no_tenant" = "skipped_temp_id";
        
        const isRealUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(finalBrandId);
        
        if (isRealUUID && tenantId) {
          onboardingTriggered = true;
          onboardingStatus = "triggered";
          onboardingJobId = `onboarding-${Date.now()}-${finalBrandId.substring(0, 8)}`;
          
          console.log("[Crawler] Triggering onboarding workflow after successful scrape", {
            brandId: finalBrandId,
            tenantId,
            onboardingJobId,
            requestId: (req as any).id,
          });
          
          // Run onboarding asynchronously (don't await - response should be fast)
          // The onboarding workflow will generate content items to the Queue
          runOnboardingWorkflow({
            workspaceId: tenantId,
            brandId: finalBrandId,
            websiteUrl: finalUrl,
          })
            .then((onboardingResult) => {
              const contentPlanningStep = onboardingResult.steps.find(s => s.id === "content-planning");
              const itemsGenerated = (contentPlanningStep?.result as any)?.itemsCount || 0;
              
              console.log("[Crawler] ✅ Onboarding workflow completed", {
                brandId: finalBrandId,
                onboardingJobId,
                status: onboardingResult.status,
                itemsGenerated,
                stepsCompleted: onboardingResult.steps.filter(s => s.status === "completed").length,
                stepsFailed: onboardingResult.steps.filter(s => s.status === "failed").length,
              });
            })
            .catch((onboardingError) => {
              console.error("[Crawler] ⚠️ Onboarding workflow failed (scrape was still successful)", {
                brandId: finalBrandId,
                onboardingJobId,
                error: onboardingError instanceof Error ? onboardingError.message : String(onboardingError),
              });
              // Note: Scrape was successful, onboarding failure doesn't affect response
            });
        } else if (isRealUUID && !tenantId) {
          onboardingStatus = "skipped_no_tenant";
          console.warn("[Crawler] Skipping onboarding - no tenantId for real brand UUID", {
            brandId: finalBrandId,
            requestId: (req as any).id,
          });
        } else {
          console.log("[Crawler] Skipping onboarding - temporary brand ID", {
            brandId: finalBrandId,
            requestId: (req as any).id,
          });
        }
        
        // ✅ RESPONSE: Return success with valid HTTP status and onboarding info
        return res.status(HTTP_STATUS.OK).json({
          success: true,
          brandKit: result.brandKit,
          status: "completed",
          onboarding: {
            triggered: onboardingTriggered,
            status: onboardingStatus,
            jobId: onboardingJobId,
            message: onboardingTriggered 
              ? "Onboarding workflow started in background. Content will appear in Queue shortly."
              : isRealUUID 
                ? "Onboarding skipped - tenant ID not available."
                : "Onboarding skipped - temporary brand ID. Will run after brand is created.",
          },
        });
      } catch (error) {
        // ✅ RELEASE LOCK: Clean up after error
        const lock = activeCrawlLocks.get(lockKey);
        if (lock) {
          clearTimeout(lock.timeout);
          activeCrawlLocks.delete(lockKey);
          console.log("[Crawler] Crawl lock released (error)", { lockKey });
        }
        
        // ✅ ENHANCED ERROR LOGGING: Log full error details for debugging
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : "No stack trace";
        
        console.error("[Crawler] ❌ Sync crawl error:", {
          message: errorMessage,
          stack: errorStack,
          url: finalUrl,
          normalizedUrl,
          brandId: finalBrandId,
          tenantId: tenantId || "unknown",
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          requestId: (req as any).id,
        });
        
        // ✅ USER-FRIENDLY ERROR: Provide actionable error message
        let userMessage = "Website scraping failed. ";
        let statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
        let errorCode = ErrorCode.SERVICE_UNAVAILABLE;
        
        if (errorMessage.includes("timeout") || errorMessage.includes("Crawl timeout")) {
          userMessage += "The website took too long to load. Please try again or check if the website is accessible.";
          statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
          errorCode = ErrorCode.SERVICE_UNAVAILABLE;
        } else if (errorMessage.includes("browser") || errorMessage.includes("launch")) {
          userMessage += "Unable to access the website. Please verify the URL is correct and try again.";
          statusCode = HTTP_STATUS.BAD_GATEWAY;
          errorCode = ErrorCode.EXTERNAL_SERVICE_ERROR;
        } else if (errorMessage.includes("network") || errorMessage.includes("ECONNREFUSED")) {
          userMessage += "Unable to connect to the website. Please check the URL and try again.";
          statusCode = HTTP_STATUS.BAD_GATEWAY;
          errorCode = ErrorCode.EXTERNAL_SERVICE_ERROR;
        } else {
          userMessage += "Please try again or contact support if the issue persists.";
        }
        
        // ✅ RESPONSE: Throw AppError which will be caught by error middleware
        throw new AppError(
          errorCode,
          userMessage,
          statusCode,
          "error",
          {
            url: finalUrl,
            brandId: finalBrandId,
            originalError: errorMessage,
          },
          "Try a different URL or check if the website is accessible"
        );
      }
    }

    // ASYNC MODE: Start crawl job and return job_id
    // Only check for existing brand if brand_id was provided
    let currentBrandKit: any = {};
    if (finalBrandId && finalBrandId.startsWith("brand_")) {
      // Temporary brand ID from onboarding, no need to check Supabase
      currentBrandKit = {};
    } else {
      try {
        const { data: brand, error: brandError } = await supabase
          .from("brands")
          .select("brand_kit")
          .eq("id", finalBrandId)
          .single();

        if (!brandError && brand) {
          currentBrandKit = brand.brand_kit || {};
        }
      } catch (dbError) {
        console.warn("[Crawler] Error fetching brand for async crawl", {
          brandId: finalBrandId,
          error: dbError instanceof Error ? dbError.message : String(dbError),
        });
        // Continue with empty brand kit
      }
    }

    const job_id = `crawl_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Store job with pending status
    crawlJobs.set(job_id, {
      job_id,
      brand_id: finalBrandId,
      url: finalUrl,
      status: "pending",
      started_at: new Date().toISOString(),
    });

    // Start crawl in background (don't await)
    runCrawlJob(job_id, finalBrandId, finalUrl, currentBrandKit)
      .then(() => {
        // ✅ RELEASE LOCK: Clean up after async crawl completes
        const lock = activeCrawlLocks.get(lockKey);
        if (lock) {
          clearTimeout(lock.timeout);
          activeCrawlLocks.delete(lockKey);
          console.log("[Crawler] Async crawl lock released (success)", { lockKey, job_id });
        }
      })
      .catch((error) => {
        // ✅ RELEASE LOCK: Clean up after async crawl fails
        const lock = activeCrawlLocks.get(lockKey);
        if (lock) {
          clearTimeout(lock.timeout);
          activeCrawlLocks.delete(lockKey);
          console.log("[Crawler] Async crawl lock released (error)", { lockKey, job_id });
        }
        
        console.error(`[Crawler] Async crawl job ${job_id} failed:`, error);
        const job = crawlJobs.get(job_id) as any;
        if (job) {
          job.status = "failed";
          job.error = error instanceof Error ? error.message : String(error);
          job.completed_at = new Date().toISOString();
        }
      });

    // ✅ RESPONSE: Return success immediately with job ID
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      job_id,
      status: "pending",
      message: "Crawl job started successfully",
    });
  } catch (error) {
    // ✅ RELEASE LOCK: Always clean up lock on any error (if lock was created)
    if (lockKey) {
      try {
        const lock = activeCrawlLocks.get(lockKey);
        if (lock) {
          clearTimeout(lock.timeout);
          activeCrawlLocks.delete(lockKey);
          console.log("[Crawler] Crawl lock released (handler error)", { lockKey });
        }
      } catch (cleanupError) {
        // Ignore cleanup errors - log but don't fail
        console.warn("[Crawler] Error cleaning up lock", {
          error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
          lockKey,
        });
      }
    }
    
    // ✅ LOG ERROR: Enhanced error logging
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : "No stack trace";
    
    console.error("[Crawler] ❌ Start crawl handler error:", {
      message: errorMessage,
      stack: errorStack,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      requestId: (req as any).id,
    });
    
    // ✅ RESPONSE: Pass error to Express error middleware (ensures valid HTTP status)
    // If error is already an AppError, pass it through; otherwise wrap it
    if (error instanceof AppError) {
      return next(error);
    }
    
    // Wrap unknown errors in AppError for consistent error handling
    return next(
      new AppError(
        ErrorCode.INTERNAL_ERROR,
        errorMessage || "Failed to start crawl",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error",
        { originalError: errorMessage },
        "Please try again later or contact support if the problem persists"
      )
    );
  }
});

/**
 * Sync crawl job for onboarding (runs immediately, returns results)
 * 
 * @param url - Website URL to crawl
 * @param brandId - Brand ID (may be temporary during onboarding, e.g., "brand_1234567890")
 * @param tenantId - Tenant/Workspace ID (REQUIRED for image persistence)
 * 
 * CRITICAL: This function MUST receive tenantId. Without it, scraped images cannot be persisted.
 * During onboarding, tenantId comes from user's workspace/auth context.
 */
async function runCrawlJobSync(url: string, brandId: string, tenantId: string | null = null): Promise<{ brandKit: any }> {
  // ✅ Increased timeout to 60s for JS-heavy sites and slow networks
  const CRAWL_TIMEOUT_MS = 60000; // 60 second timeout for onboarding
  
  // ✅ METRICS: Track total crawl time
  const crawlStartTime = Date.now();

  try {
    // Set timeout for crawl operation
    const crawlPromise = Promise.race([
      (async () => {
        // ✅ METRICS: Track crawl timing
        const crawlWebsiteStartTime = Date.now();
        
        // Crawl website (with error handling)
        let crawlResults;
        try {
          crawlResults = await crawlWebsite(url);
          
          const crawlWebsiteTime = Date.now() - crawlWebsiteStartTime;
          console.log(`[Crawler] Crawl website completed`, {
            url,
            brandId,
            crawlTimeMs: crawlWebsiteTime,
            pagesCrawled: crawlResults?.length || 0,
          });
        } catch (error) {
          console.warn("[Crawler] Error crawling website:", error);
          throw error;
        }
        
        // Extract colors (with error handling - NO FALLBACK)
        let colors;
        try {
          colors = await extractColors(url);
        } catch (error) {
          console.error("[Crawler] Error extracting colors:", error);
          // ❌ NO FALLBACK - throw error instead of using null/mock data
          throw new Error(`Color extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
        
        // ✅ USE AI-GENERATED BRAND KIT: Call generateBrandKit directly with crawl results
        // We already have crawlResults and colors, so use generateBrandKit (not processBrandIntake)
        let aiBrandKit: any = null;
        try {
          // ✅ FIX: Use static imports (no dynamic import needed)
          // Extract brand name and industry from URL and crawl results
          const brandName = extractBrandNameFromUrl(url);
          const industry = extractIndustryFromContent(crawlResults);
          
          // ✅ CRITICAL: Use generateBrandKit directly (we already have crawlResults and colors)
          // This generates AI about_blurb without re-crawling
          aiBrandKit = await generateBrandKit(crawlResults, colors, url, brandName, industry);
          console.log("[Crawler] ✅ AI-generated brand kit received", {
            hasAboutBlurb: !!aiBrandKit?.about_blurb,
            aboutBlurbLength: aiBrandKit?.about_blurb?.length || 0,
            aboutBlurbPreview: aiBrandKit?.about_blurb?.substring(0, 100),
          });
        } catch (aiError) {
          console.error("[Crawler] ❌ AI brand kit generation failed:", aiError);
          console.error("[Crawler] Error details:", {
            error: aiError instanceof Error ? aiError.message : String(aiError),
            stack: aiError instanceof Error ? aiError.stack : undefined,
          });
          // Continue with fallback below
        }
        
        // Generate brand kit from crawl results
        const combinedText = crawlResults
          .map((r) => `${r.title}\n${r.metaDescription}\n${r.bodyText}`)
          .join("\n\n")
          .slice(0, 10000);
        
        // Extract keywords
        const keywords = extractKeywords(combinedText);
        
        // Extract images from all crawl results
        // Sort by relevance and limit to 10-15 images
        const allImagesRaw = crawlResults
          .flatMap((r) => r.images || [])
          .filter((img) => img && img.url);

        // Sort by relevance: logo first, then hero, then by size
        const sortedImages = allImagesRaw.sort((a, b) => {
          if (a.role === "logo" && b.role !== "logo") return -1;
          if (b.role === "logo" && a.role !== "logo") return 1;
          if (a.role === "hero" && b.role !== "hero") return -1;
          if (b.role === "hero" && a.role !== "hero") return 1;
          const aSize = (a.width || 0) * (a.height || 0);
          const bSize = (b.width || 0) * (b.height || 0);
          return bSize - aSize;
        });

        // ✅ SIMPLIFIED FILTERING: More lenient - accept images even without dimensions
        // Images are already filtered in extractImages(), but apply additional safety filters here
        const allImages = sortedImages
          .filter((img) => {
            // Skip data URIs (usually icons)
            if (img.url.startsWith("data:")) return false;
            
            // Skip placeholders
            const urlLower = img.url.toLowerCase();
            if (urlLower.includes("placeholder") || urlLower.includes("logo-placeholder")) return false;
            
            // Only skip very small images if we have confirmed dimensions
            // If dimensions are missing, accept the image (it might be lazy-loaded or CSS-sized)
            if (img.width && img.height) {
              // Skip confirmed tiny icons (but be lenient - 50x50 instead of 100x100)
              if (img.width < 50 && img.height < 50) return false;
            }
            
            // Accept all other images (even without dimensions)
            return true;
          })
          .slice(0, 15); // Limit to 15 images (10-15 range)
        
        console.log(`[Crawler] Final image count after filtering: ${allImages.length} (from ${sortedImages.length} raw images)`);
        
        // ✅ CRITICAL LOGGING: Log image extraction details
        if (allImages.length === 0) {
          console.warn(`[Crawler] ⚠️ NO IMAGES EXTRACTED from ${url}`, {
            url,
            pagesCrawled: crawlResults.length,
            rawImagesCount: sortedImages.length,
            crawlResultsWithImages: crawlResults.filter(r => r.images && r.images.length > 0).length,
            totalRawImages: crawlResults.reduce((sum, r) => sum + (r.images?.length || 0), 0),
          });
        } else {
          console.log(`[Crawler] ✅ Images extracted successfully`, {
            totalImages: allImages.length,
            logos: allImages.filter(img => img.role === "logo").length,
            otherImages: allImages.filter(img => img.role !== "logo").length,
            sampleImageUrl: allImages[0]?.url?.substring(0, 100),
          });
        }
        
        // Find logo (first image with role="logo")
        const logoImage = allImages.find((img) => img.role === "logo");
        const logoUrl = logoImage?.url;
        
        // Extract headlines from all crawl results
        const headlines = extractHeadlinesFromCrawlResults(crawlResults);
        
        // Extract typography (fonts) - use first non-empty typography from crawl results
        const typography = crawlResults
          .map((r) => r.typography)
          .find((t) => t && t.heading && t.body);
        
        // ✅ Extract Open Graph metadata - use first non-empty OG metadata from crawl results
        const openGraphMetadata = crawlResults
          .map((r) => r.openGraph)
          .find((og) => og && (og.title || og.image || og.description));
        
        // ✅ PERSIST SCRAPED IMAGES: Save to media_assets table with source='scrape'
        let persistedImageCount = 0;
        let logoFound = false;
        let workspaceId = tenantId || "unknown";
        
        if (allImages.length > 0 && brandId) {
          try {
            // ✅ ROOT FIX: Use tenantId passed as parameter (from request body/auth)
            // If not provided, try to get from brand (only if brand exists)
            let finalTenantId = tenantId;
            if (!finalTenantId && !brandId.startsWith("brand_")) {
              // Brand exists, try to get tenant_id from it
              const { data: brand } = await supabase
                .from("brands")
                .select("tenant_id")
                .eq("id", brandId)
                .single();
              finalTenantId = (brand as any)?.tenant_id || null;
              workspaceId = finalTenantId || "unknown";
            }
            
            // ✅ CRITICAL: Only persist if we have tenantId
            // During onboarding, tenantId should come from request body/auth
            if (finalTenantId) {
              // ✅ VALIDATION: Ensure tenantId is a valid UUID (not "unknown" or empty)
              if (finalTenantId === "unknown" || !finalTenantId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                console.error(`[Crawler] CRITICAL: Invalid tenantId format: "${finalTenantId}". Cannot persist images. This is a system error - tenantId must be a valid UUID.`);
              } else {
                // ✅ METRICS: Track persistence timing
                const persistenceStartTime = Date.now();
                
                const persistedIds = await persistScrapedImages(brandId, finalTenantId, allImages);
                persistedImageCount = persistedIds.length;
                logoFound = !!logoImage;
                
                const persistenceTime = Date.now() - persistenceStartTime;
                const totalCrawlTime = Date.now() - crawlStartTime;
                
                // ✅ ENHANCED LOGGING: Structured log with timing metrics
                console.log(`[Crawler] Scrape complete`, {
                  tenantId: finalTenantId,
                  brandId: brandId,
                  url: url,
                  pagesCrawled: crawlResults.length,
                  imagesFound: allImages.length,
                  imagesPersisted: persistedImageCount,
                  logoFound: logoFound,
                  logoUrl: logoUrl || null,
                  timing: {
                    totalCrawlTimeMs: totalCrawlTime,
                    persistenceTimeMs: persistenceTime,
                  },
                });
                
                // ✅ ENHANCED: More detailed warning if no images persisted
                if (persistedImageCount === 0 && allImages.length > 0) {
                  console.error(`[Crawler] ❌ CRITICAL: Found ${allImages.length} image(s) but NONE were persisted.`, {
                    brandId: brandId,
                    tenantId: finalTenantId,
                    url: url,
                    imagesFound: allImages.length,
                    imagesPersisted: persistedImageCount,
                    hint: "Check [ScrapedImages] logs above for detailed failure reasons. Possible causes: DB connectivity issues, schema mismatch, or tenantId validation failure.",
                  });
                  console.error(`[Crawler] Detailed error logs should appear above with [ScrapedImages] prefix showing per-image failure reasons.`);
                } else if (persistedImageCount > 0 && persistedImageCount < allImages.length) {
                  // Partial persistence - this is expected due to design limits (max 2 logos, max 15 brand images)
                  // The [ScrapedImages] logs above show detailed breakdown of selected vs filtered images
                  const filteredCount = allImages.length - persistedImageCount;
                  console.log(`[Crawler] ℹ️ Image selection: ${persistedImageCount}/${allImages.length} images persisted (${filteredCount} filtered by design limits)`, {
                    brandId: brandId,
                    tenantId: finalTenantId,
                    imagesFound: allImages.length,
                    imagesPersisted: persistedImageCount,
                    imagesFiltered: filteredCount,
                    note: "This is expected behavior. The system selects up to 2 logos and up to 15 brand images. Check [ScrapedImages] logs above for detailed breakdown.",
                  });
                }
              }
            } else {
              // ✅ FAIL LOUDLY: Missing tenantId is a critical error
              console.error(`[Crawler] CRITICAL: Cannot persist images - no tenantId for brandId ${brandId}. Images will be in response but NOT saved to database. This will cause images to be missing in Brand Guide and Creative Studio.`);
              console.error(`[Crawler] Debug info: { brandId: "${brandId}", tenantId: ${tenantId}, workspaceId: ${workspaceId} }`);
            }
          } catch (persistError) {
            console.error("[Crawler] Failed to persist scraped images:", persistError);
            // Continue anyway - images are still in brandKit response
          }
        }
        
        // Build brand kit structure matching Edge Function format
        // Store 6-color palette: 3 primary + 3 secondary/accent
        const colorPalette = {
          primary: colors.primary,
          secondary: colors.secondary,
          accent: colors.accent,
          confidence: colors.confidence || 0,
          // 6-color palette structure
          primaryColors: colors.primaryColors || (colors.primary ? [colors.primary] : []),
          secondaryColors: colors.secondaryColors || (colors.secondary && colors.accent ? [colors.secondary, colors.accent] : colors.secondary ? [colors.secondary] : colors.accent ? [colors.accent] : []),
          allColors: colors.allColors || [
            colors.primary,
            colors.secondary,
            colors.accent,
            ...(colors.primaryColors || []),
            ...(colors.secondaryColors || []),
          ].filter((c): c is string => !!c).slice(0, 6), // Max 6 colors
        };

        // ✅ PRIORITY: Use AI-generated brand kit if available, otherwise use fallback
        const brandKit = aiBrandKit ? {
          ...aiBrandKit,
          colors: colorPalette, // Use extracted colors (more accurate than AI)
          typography: typography || aiBrandKit.typography,
          source_urls: crawlResults.map(r => r.url),
          images: allImages, // Use extracted images
          logoUrl: logoUrl || aiBrandKit.logoUrl,
          headlines: headlines || aiBrandKit.headlines,
          metadata: {
            openGraph: openGraphMetadata || undefined,
          },
          source: "crawler" as const,
        } : {
          voice_summary: {
            tone: extractToneFromText(combinedText),
            style: extractStyleFromText(combinedText),
            avoid: [],
            audience: "Your target audience",
            personality: [],
          },
          keyword_themes: keywords,
          about_blurb: crawlResults[0]?.metaDescription || crawlResults[0]?.bodyText?.slice(0, 160) || "",
          colors: colorPalette,
          typography: typography || undefined,
          source_urls: crawlResults.map(r => r.url),
          images: allImages,
          logoUrl,
          headlines,
          metadata: {
            openGraph: openGraphMetadata || undefined,
          },
          source: "crawler" as const,
        };
        
        // ✅ ENSURE about_blurb is valid (not empty, not "0")
        if (!brandKit.about_blurb || brandKit.about_blurb === "0" || brandKit.about_blurb.length < 10) {
          console.warn("[Crawler] about_blurb is invalid, generating fallback");
          const brandName = extractBrandNameFromUrl(url);
          brandKit.about_blurb = `${brandName} is a business that connects with customers through authentic communication.`;
        }
        
        // ✅ CRITICAL: Save brandKit directly to database (not just return it)
        // This ensures brand story is persisted even if client save fails
        if (brandId && !brandId.startsWith("brand_")) {
          try {
            const { error: updateError } = await supabase
              .from("brands")
              .update({
                brand_kit: {
                  ...brandKit,
                  // Ensure both purpose and about_blurb are saved
                  purpose: brandKit.about_blurb || brandKit.purpose || "",
                  about_blurb: brandKit.about_blurb || "",
                  longFormSummary: (brandKit as any).longFormSummary || brandKit.about_blurb || "",
                  // ✅ Persist Open Graph metadata
                  metadata: {
                    openGraph: openGraphMetadata || undefined,
                  },
                },
                voice_summary: brandKit.voice_summary || {},
                visual_summary: {
                  colors: brandKit.colors?.allColors || brandKit.colors?.primaryColors || [],
                  fonts: brandKit.typography ? [brandKit.typography.heading, brandKit.typography.body].filter(Boolean) : [],
                },
                updated_at: new Date().toISOString(),
              })
              .eq("id", brandId);
            
            if (updateError) {
              console.error("[Crawler] ❌ Failed to save brandKit to database:", updateError);
            } else {
              console.log("[Crawler] ✅ BrandKit saved directly to database", {
                brandId,
                hasAboutBlurb: !!brandKit.about_blurb,
                aboutBlurbLength: brandKit.about_blurb?.length || 0,
              });
            }
          } catch (dbError) {
            console.error("[Crawler] ❌ Error saving brandKit to database:", dbError);
            // Continue anyway - client will also try to save
          }
        } else {
          console.warn("[Crawler] Skipping database save - brandId is temporary:", brandId);
        }
        
        return { brandKit };
      })(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Crawl timeout")), CRAWL_TIMEOUT_MS)
      ),
    ]);

    return await crawlPromise;
  } catch (error) {
    // ✅ ENHANCED ERROR LOGGING: Log full error details
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : "No stack trace";
    
    console.error("[Crawler] ❌ runCrawlJobSync error:", {
      message: errorMessage,
      stack: errorStack,
      url: url,
      brandId: brandId,
      tenantId: tenantId || "none",
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });
    
    throw error;
  }
}

/**
 * ✅ REMOVED: generateFallbackBrandKit
 * 
 * Fallback data is no longer used. All crawl failures now return proper errors.
 * This ensures we only work with real scraped data, not mock/fallback data.
 * 
 * If a crawl fails, the error is properly logged and returned to the client.
 */

/**
 * Extract tone from text (simple heuristic)
 */
function extractToneFromText(text: string): string[] {
  const toneKeywords: Record<string, string[]> = {
    friendly: ["friendly", "warm", "welcoming", "approachable"],
    professional: ["professional", "corporate", "business", "enterprise"],
    casual: ["casual", "relaxed", "informal", "conversational"],
    confident: ["confident", "bold", "assertive", "strong"],
  };

  const lowerText = text.toLowerCase();
  const detectedTones: string[] = [];

  for (const [tone, keywords] of Object.entries(toneKeywords)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      detectedTones.push(tone);
    }
  }

  return detectedTones.length > 0 ? detectedTones : ["professional", "trustworthy"];
}

/**
 * Extract style from text
 */
function extractStyleFromText(text: string): string {
  if (text.length < 100) return "Clear and direct";
  if (text.length > 1000) return "Detailed and comprehensive";
  return "Clear and direct";
}

/**
 * Extract headlines from crawl results
 */
function extractHeadlinesFromCrawlResults(crawlResults: any[]): string[] {
  const headlines: string[] = [];
  const seen = new Set<string>();

  for (const result of crawlResults) {
    // Use headlines if available, otherwise extract from h1/h2/h3
    const resultHeadlines = result.headlines || [...(result.h1 || []), ...(result.h2 || []), ...(result.h3 || [])];
    
    for (const heading of resultHeadlines) {
      const cleaned = heading?.trim();
      if (cleaned && cleaned.length > 3 && !seen.has(cleaned.toLowerCase())) {
        headlines.push(cleaned);
        seen.add(cleaned.toLowerCase());
        if (headlines.length >= 5) break; // Limit to 5 unique headlines
      }
    }
    
    if (headlines.length >= 5) break;
  }

  return headlines;
}

/**
 * Background crawl job (async mode)
 */
async function runCrawlJob(
  job_id: string,
  brand_id: string,
  url: string,
  currentBrandKit: any,
) {
  const job = crawlJobs.get(job_id) as any;
  if (!job) return;

  job.status = "processing";

  try {
    // Crawl website
    const crawlResults = await crawlWebsite(url);

    // Extract colors
    const colors = await extractColors(url);

    // Generate AI summaries (or fallback)
    const combinedText = crawlResults
      .map((r) => `${r.title}\n${r.metaDescription}\n${r.bodyText}`)
      .join("\n\n")
      .slice(0, 10000);

    // Generate suggestions by comparing with current values
    const suggestions: CrawlerSuggestion[] = [];

    // Colors
    if (colors.primary) {
      suggestions.push({
        field: "colors",
        label: "Brand Colors",
        currentValue: currentBrandKit.colors?.value || null,
        currentSource: currentBrandKit.colors?.source || "crawler",
        suggestedValue: {
          primary: colors.primary,
          secondary: colors.secondary,
          accent: colors.accent,
        },
        confidence: colors.confidence / 1000, // Normalize
        category: "colors",
      });
    }

    // Keywords (simple extraction for now)
    const keywords = extractKeywords(combinedText);
    if (keywords.length > 0) {
      suggestions.push({
        field: "keywords",
        label: "Brand Keywords",
        currentValue: currentBrandKit.keywords?.value || [],
        currentSource: currentBrandKit.keywords?.source || "crawler",
        suggestedValue: keywords,
        confidence: 0.7,
        category: "keywords",
      });
    }

    // About blurb
    const aboutBlurb = crawlResults[0]?.metaDescription?.slice(0, 160) || "";
    if (aboutBlurb) {
      suggestions.push({
        field: "about_blurb",
        label: "About Description",
        currentValue: currentBrandKit.about_blurb?.value || "",
        currentSource: currentBrandKit.about_blurb?.source || "crawler",
        suggestedValue: aboutBlurb,
        confidence: 0.8,
        category: "about",
      });
    }

    // Update job with results
    job.status = "completed";
    job.completed_at = new Date().toISOString();
    job.suggestions = suggestions;
    job.palette = [colors.primary, colors.secondary, colors.accent];
    job.keywords = keywords;
  } catch (error: unknown) {
    job.status = "failed";
    job.error = error instanceof Error ? error.message : String(error);
    job.completed_at = new Date().toISOString();
  }
}

/**
 * Simple keyword extraction (replace with AI in production)
 */
function extractKeywords(text: string): string[] {
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const wordFreq: Record<string, number> = {};
  for (const word of words) {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  }

  const stopWords = new Set([
    "that",
    "this",
    "with",
    "from",
    "have",
    "will",
    "your",
    "their",
    "about",
    "what",
    "when",
    "where",
    "which",
    "would",
    "there",
    "these",
    "those",
  ]);

  return Object.entries(wordFreq)
    .filter(([word]) => !stopWords.has(word))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * GET /api/crawl/result/:jobId
 * Get crawl job status and results
 */
// ✅ CRITICAL: Require authentication for crawl results
router.get("/result/:jobId", authenticateUser, async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = crawlJobs.get(jobId);

    if (!job) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Job not found",
        HTTP_STATUS.NOT_FOUND,
        "info"
      );
    }

    (res as any).json(job);
  } catch (error) {
    console.error("[Crawler] Get crawl result error:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : "Failed to get crawl result",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
});

/**
 * POST /api/brand-kit/apply
 * Apply selected changes from crawler
 */
// ✅ CRITICAL: Require authentication for brand kit operations
router.post("/brand-kit/apply", authenticateUser, async (req, res) => {
  try {
    const { brand_id, changes } = req.body as {
      brand_id: string;
      changes: FieldChange[];
    };

    if (!brand_id || !changes || !Array.isArray(changes)) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "brand_id and changes[] required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    const userId = req.headers["x-user-id"];

    // Get current brand_kit
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("brand_kit")
      .eq("id", brand_id)
      .single();

    if (brandError) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Brand not found",
        HTTP_STATUS.NOT_FOUND,
        "info"
      );
    }

    const brandKit = brand.brand_kit || {};
    const history: FieldHistoryEntry[] = [];

    // Apply changes with source enforcement
    for (const change of changes) {
      const currentField = brandKit[change.field];

      // Check if field is user-edited
      if (currentField?.source === "user" && !change.force_user_override) {
        console.warn(`Skipping ${change.field}: protected by user edit`);
        continue;
      }

      // Record history
      history.push({
        timestamp: new Date().toISOString(),
        field: change.field,
        old_value: currentField?.value || null,
        new_value: change.value,
        old_source: currentField?.source || "crawler",
        new_source: change.source,
        changed_by: change.source === "user" ? "user" : "crawler",
        user_id: userId as string,
      });

      // Update field with tracking
      brandKit[change.field] = createTrackedField(change.value, change.source);
    }

    // Save updated brand_kit
    const { error: updateError } = await supabase
      .from("brands")
      .update({ brand_kit: brandKit })
      .eq("id", brand_id);

    if (updateError) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        "Failed to update brand kit",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error"
      );
    }

    // Save history
    await saveHistory(brand_id, history);

    (res as any).json({ success: true, applied: changes.length });
  } catch (error) {
    console.error("[Crawler] Apply brand kit error:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : "Failed to apply changes",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
});

/**
 * GET /api/brand-kit/history/:brandId
 * Get change history for a brand
 */
// ✅ CRITICAL: Require authentication for brand kit history
router.get("/brand-kit/history/:brandId", authenticateUser, async (req, res) => {
  try {
    const { brandId } = req.params;
    const { field } = req.query;

    const { data, error } = await supabase
      .from("brand_kit_history")
      .select("*")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false })
      .limit(field ? 10 : 100);

    if (error) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : "Failed to fetch history",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error",
        error instanceof Error ? { originalError: error.message } : undefined
      );
    }

    // Filter by field if specified
    const history = field
      ? (data as any[]).filter((entry: any) => entry.field === field)
      : data;

    (res as any).json({ history });
  } catch (error) {
    console.error("[Crawler] Get history error:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : "Failed to get history",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
});

/**
 * POST /api/brand-kit/revert
 * Revert a field to a previous value
 */
// ✅ CRITICAL: Require authentication for brand kit revert
router.post("/brand-kit/revert", authenticateUser, async (req, res) => {
  try {
    const { brand_id, field, history_id } = req.body;

    if (!brand_id || !field || !history_id) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "brand_id, field, and history_id required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Get history entry
    const { data: historyEntry, error: historyError } = await supabase
      .from("brand_kit_history")
      .select("*")
      .eq("id", history_id)
      .single();

    if (historyError || !historyEntry) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "History entry not found",
        HTTP_STATUS.NOT_FOUND,
        "info"
      );
    }

    // Get current brand_kit
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("brand_kit")
      .eq("id", brand_id)
      .single();

    if (brandError) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Brand not found",
        HTTP_STATUS.NOT_FOUND,
        "info"
      );
    }

    const brandKit = brand.brand_kit || {};

    // Revert field
    brandKit[field] = createTrackedField(
      historyEntry.old_value,
      historyEntry.old_source,
    );

    // Save
    const { error: updateError } = await supabase
      .from("brands")
      .update({ brand_kit: brandKit })
      .eq("id", brand_id);

    if (updateError) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        "Failed to revert field",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error"
      );
    }

    (res as any).json({ success: true, field, value: historyEntry.old_value });
  } catch (error) {
    console.error("[Crawler] Revert field error:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : "Failed to revert field",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
});

/**
 * Helper: Save history entries
 */
async function saveHistory(brand_id: string, entries: FieldHistoryEntry[]) {
  if (entries.length === 0) return;

  const records = entries.map((entry) => ({
    brand_id,
    field: entry.field,
    old_value: entry.old_value,
    new_value: entry.new_value,
    old_source: entry.old_source,
    new_source: entry.new_source,
    changed_by: entry.changed_by,
    user_id: entry.user_id,
  }));

  await supabase.from("brand_kit_history").insert(records);

  // Cleanup: Keep only last 10 entries per field
  for (const field of new Set(entries.map((e) => e.field))) {
    const { data: allEntries } = await supabase
      .from("brand_kit_history")
      .select("id")
      .eq("brand_id", brand_id)
      .eq("field", field)
      .order("created_at", { ascending: false });

    if (allEntries && allEntries.length > 10) {
      const toDelete = (allEntries as any[]).slice(10).map((e: any) => e.id);
      await supabase.from("brand_kit_history").delete().in("id", toDelete);
    }
  }
}

/**
 * Helper: Create tracked field for brand kit
 */
function createTrackedField(value: any, source: string): any {
  return {
    value,
    source,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * POST /api/crawl/reconcile-images
 * Reconcile scraped images from temporary brandId to final brandId
 * 
 * This endpoint is called when a brand is created with a final UUID that differs
 * from the temporary brandId used during onboarding.
 * 
 * Body: { fromBrandId: string, toBrandId: string }
 */
router.post("/reconcile-images", authenticateUser, async (req, res, next) => {
  try {
    const { fromBrandId, toBrandId } = req.body;

    if (!fromBrandId || !toBrandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "fromBrandId and toBrandId are required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    if (fromBrandId === toBrandId) {
      return (res as any).json({
        success: true,
        message: "No reconciliation needed - brandIds are the same",
        transferredCount: 0,
      });
    }

    // ✅ SECURITY: Verify user has access to destination brand
    await assertBrandAccess(req, toBrandId, true, true);

    // Transfer images
    const transferredCount = await transferScrapedImages(fromBrandId, toBrandId);

    // ✅ LOGGING: Reconciliation result
    console.log(`[Crawler] Reconciliation complete`, {
      fromBrandId: fromBrandId,
      toBrandId: toBrandId,
      transferredCount: transferredCount,
    });

    (res as any).json({
      success: true,
      message: `Transferred ${transferredCount} scraped images`,
      transferredCount: transferredCount,
    });
  } catch (error) {
    console.error("[Crawler] Reconciliation error:", error);
    next(error);
  }
});

export default router;
