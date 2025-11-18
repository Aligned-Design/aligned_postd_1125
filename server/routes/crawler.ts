/**
 * Crawler API Routes
 *
 * POST /api/crawl/start - Start a crawl job
 * GET /api/crawl/result/:jobId - Get crawl results
 * POST /api/brand-kit/apply - Apply selected changes
 * GET /api/brand-kit/history/:brandId - Get change history
 * POST /api/brand-kit/revert - Revert a field to previous value
 */

import { Router } from "express";
import { supabase } from "../lib/supabase";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import {
  crawlWebsite,
  extractColors,
} from "../workers/brand-crawler";
import { persistScrapedImages } from "../lib/scraped-images-service";
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
 * POST /api/crawl/start
 * Start a website crawl job
 * 
 * Supports both async job mode (returns job_id) and sync mode (returns results directly)
 * For onboarding, use sync mode with ?sync=true
 */
router.post("/crawl/start", async (req, res) => {
  try {
    const { brand_id, url, sync, websiteUrl, workspaceId } = req.body;
    const isSync = sync === true || req.query.sync === "true";
    const finalUrl = url || websiteUrl;

    // ✅ LOGGING: Log crawler start (for Vercel server logs)
    console.log("[CRAWLER] Start", { 
      websiteUrl: finalUrl, 
      brandId: brand_id || "unknown",
      workspaceId: workspaceId || "unknown",
      sync: isSync 
    });

    if (!finalUrl) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "url is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // For onboarding, brand_id is optional (will be generated)
    const finalBrandId = brand_id || `brand_${Date.now()}`;

    // For onboarding (sync mode), skip brand access check
    // For async mode, verify user has access to brand
    if (!isSync && brand_id) {
      const userId = req.headers["x-user-id"]; // From auth middleware
      const { data: member, error: memberError } = await supabase
        .from("brand_members")
        .select("*")
        .eq("brand_id", brand_id)
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
      try {
        // ✅ ROOT FIX: Get workspaceId/tenantId from user or request body
        // This allows us to persist images even if brand doesn't exist yet
        let tenantId: string | null = null;
        const user = (req as any).user;
        const auth = (req as any).auth;
        
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
            const { data: userData } = await supabase
              .from("users")
              .select("workspace_id, tenant_id")
              .eq("id", user.id)
              .single();
            tenantId = (userData as any)?.workspace_id || (userData as any)?.tenant_id || null;
          }
        }
        
        const result = await runCrawlJobSync(finalUrl, finalBrandId, tenantId);
        
        // ✅ LOGGING: Log crawler result (for Vercel server logs)
        const images = result.brandKit?.images || [];
        const logo = result.brandKit?.logoUrl;
        const colors = result.brandKit?.colors;
        const typography = result.brandKit?.typography;
        console.log("[CRAWLER] Result", {
          images: images.length,
          hasLogo: !!logo,
          colors: colors ? Object.keys(colors).length : 0,
          hasTypography: !!typography,
          typographyHeading: typography?.heading || "none",
          typographyBody: typography?.body || "none",
          brandId: finalBrandId,
          tenantId: tenantId || "unknown",
        });
        
        return res.json({
          success: true,
          brandKit: result.brandKit,
          status: "completed",
        });
      } catch (error) {
        console.error("[Crawler] Sync crawl error:", error);
        // Return fallback data instead of failing
        return res.json({
          success: false,
          brandKit: generateFallbackBrandKit(finalUrl),
          status: "fallback",
          error: error instanceof Error ? error.message : "Crawl failed, using fallback",
        });
      }
    }

    // ASYNC MODE: Start crawl job and return job_id
    // Only check for existing brand if brand_id was provided
    let currentBrandKit: any = {};
    if (finalBrandId && finalBrandId.startsWith("brand_")) {
      // Temporary brand ID from onboarding, no need to check Supabase
      currentBrandKit = {};
    } else {
      const { data: brand, error: brandError } = await supabase
        .from("brands")
        .select("brand_kit")
        .eq("id", finalBrandId)
        .single();

      if (!brandError && brand) {
        currentBrandKit = brand.brand_kit || {};
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
    runCrawlJob(job_id, finalBrandId, finalUrl, currentBrandKit).catch((error) => {
      console.error(`Crawl job ${job_id} failed:`, error);
      const job = crawlJobs.get(job_id) as any;
      if (job) {
        job.status = "failed";
        job.error = error instanceof Error ? error.message : String(error);
        job.completed_at = new Date().toISOString();
      }
    });

    res.json({ job_id, status: "pending" });
  } catch (error) {
    console.error("[Crawler] Start crawl error:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : "Failed to start crawl",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
});

/**
 * Sync crawl job for onboarding (runs immediately, returns results)
 * 
 * @param url - Website URL to crawl
 * @param brandId - Brand ID (may be temporary during onboarding)
 * @param tenantId - Tenant/Workspace ID (required for image persistence)
 */
async function runCrawlJobSync(url: string, brandId: string, tenantId: string | null = null): Promise<{ brandKit: any }> {
  // TODO: Consider increasing timeout to 30-45s for JS-heavy sites if needed
  const CRAWL_TIMEOUT_MS = 25000; // 25 second timeout for onboarding

  try {
    // Set timeout for crawl operation
    const crawlPromise = Promise.race([
      (async () => {
        // Crawl website (with error handling)
        let crawlResults;
        try {
          crawlResults = await crawlWebsite(url);
        } catch (error) {
          console.warn("[Crawler] Error crawling website:", error);
          throw error;
        }
        
        // Extract colors (with error handling)
        let colors;
        try {
          colors = await extractColors(url);
        } catch (error) {
          console.warn("[Crawler] Error extracting colors:", error);
          // Use fallback colors
          colors = {
            primary: "#8B5CF6",
            secondary: "#F0F7F7",
            accent: "#EC4899",
            confidence: 0,
          };
        }
        
        // Generate brand kit from crawl results
        const combinedText = crawlResults
          .map((r) => `${r.title}\n${r.metaDescription}\n${r.bodyText}`)
          .join("\n\n")
          .slice(0, 10000);
        
        // Extract keywords
        const keywords = extractKeywords(combinedText);
        
        // Extract images from all crawl results
        const allImages = crawlResults
          .flatMap((r) => r.images || [])
          .filter((img) => img && img.url);
        
        // Find logo (first image with role="logo")
        const logoImage = allImages.find((img) => img.role === "logo");
        const logoUrl = logoImage?.url;
        
        // Extract headlines from all crawl results
        const headlines = extractHeadlinesFromCrawlResults(crawlResults);
        
        // Extract typography (fonts) - use first non-empty typography from crawl results
        const typography = crawlResults
          .map((r) => r.typography)
          .find((t) => t && t.heading && t.body);
        
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
              const persistedIds = await persistScrapedImages(brandId, finalTenantId, allImages);
              persistedImageCount = persistedIds.length;
              logoFound = !!logoImage;
              
              // ✅ LOGGING: Log scrape results (for Vercel server logs)
              console.log(`[Crawler] Scrape result: { workspaceId: ${workspaceId}, brandId: ${brandId}, pages: ${crawlResults.length}, images: ${allImages.length}, persisted: ${persistedImageCount}, logoFound: ${logoFound} }`);
            } else {
              console.warn(`[Crawler] Cannot persist images: no tenantId for brandId ${brandId}. Images will be in response but not saved to database.`);
            }
          } catch (persistError) {
            console.error("[Crawler] Failed to persist scraped images:", persistError);
            // Continue anyway - images are still in brandKit response
          }
        }
        
        // Build brand kit structure matching Edge Function format
        const brandKit = {
          voice_summary: {
            tone: extractToneFromText(combinedText),
            style: extractStyleFromText(combinedText),
            avoid: [],
            audience: "Your target audience",
            personality: [],
          },
          keyword_themes: keywords,
          about_blurb: crawlResults[0]?.metaDescription || crawlResults[0]?.bodyText?.slice(0, 160) || "",
          colors: {
            primary: colors.primary || "#8B5CF6",
            secondary: colors.secondary || "#F0F7F7",
            accent: colors.accent || "#EC4899",
            confidence: colors.confidence || 0,
          },
          typography: typography || undefined,
          source_urls: crawlResults.map(r => r.url),
          images: allImages,
          logoUrl,
          headlines,
          source: "crawler" as const,
        };
        
        return { brandKit };
      })(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Crawl timeout")), CRAWL_TIMEOUT_MS)
      ),
    ]);

    return await crawlPromise;
  } catch (error) {
    console.error("[Crawler] Sync crawl error:", error);
    throw error;
  }
}

/**
 * Generate fallback brand kit (used when crawl fails)
 */
function generateFallbackBrandKit(url: string): any {
  const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
  const domain = urlObj.hostname.replace("www.", "");

  return {
    voice_summary: {
      tone: ["professional", "trustworthy"],
      style: "Clear and direct",
      avoid: ["jargon", "slang"],
      audience: "Business professionals",
      personality: ["helpful", "reliable"],
    },
    keyword_themes: [domain],
    about_blurb: `Brand from ${domain}. Please complete intake form for more details.`,
    colors: {
      primary: "#8B5CF6",
      secondary: "#F0F7F7",
      accent: "#EC4899",
      confidence: 0,
    },
    source_urls: [url],
    images: [],
    logoUrl: undefined,
    headlines: [],
    source: "fallback" as const,
  };
}

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
router.get("/crawl/result/:jobId", async (req, res) => {
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
router.post("/brand-kit/apply", async (req, res) => {
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
router.get("/brand-kit/history/:brandId", async (req, res) => {
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
router.post("/brand-kit/revert", async (req, res) => {
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

export default router;
