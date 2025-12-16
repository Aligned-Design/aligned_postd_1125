/**
 * Screen 3: AI Scrape & Generate
 * 
 * Shows progress animations while AI scans the website and generates brand profile.
 * This creates a magical, exciting moment for users.
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, CheckCircle2, Loader2, Palette, Image, MessageSquare, Package, Globe, Calendar } from "lucide-react";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { useConfetti } from "@/hooks/useConfetti";
import { saveBrandGuideFromOnboarding } from "@/lib/onboarding-brand-sync";
import { logInfo, logWarning, logError } from "@/lib/logger";
import { isFeatureEnabled } from "@/lib/featureFlags";
import type { OnboardingRunAllResponse } from "@shared/api";

interface ScrapeProgress {
  step: string;
  status: "pending" | "processing" | "complete" | "error";
  message: string;
}

const SCRAPE_STEPS: ScrapeProgress[] = [
  {
    step: "explore",
    status: "pending",
    message: "Exploring your website to understand your brand",
  },
  {
    step: "images",
    status: "pending",
    message: "Automatically detecting your brand assets (logos & images)",
  },
  {
    step: "colors",
    status: "pending",
    message: "Identifying your brand colors and visual style",
  },
  {
    step: "voice",
    status: "pending",
    message: "Learning how you communicate with your audience",
  },
  {
    step: "offerings",
    status: "pending",
    message: "Understanding what you offer and how you describe it",
  },
  {
    step: "generate",
    status: "pending",
    message: "Creating your personalized Brand Guide",
  },
];

export default function Screen3AiScrape() {
  const { user, setBrandSnapshot, setOnboardingStep } = useAuth();
  const { fire } = useConfetti();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<ScrapeProgress[]>(SCRAPE_STEPS);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Auto-workflow state (generates first week of content after scrape)
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [contentGenerationError, setContentGenerationError] = useState<string | null>(null);

  useEffect(() => {
    if (import.meta.env.DEV) {
      logInfo("Screen3AiScrape loaded", {
        hasWebsite: !!user?.website,
      });
    }

    if (!user?.website) {
      if (import.meta.env.DEV) {
        logWarning("No website provided - skipping scraping, using default data");
      }
      // No website provided, skip scraping and generate default brand snapshot
      setTimeout(() => {
        generateDefaultBrandSnapshot();
      }, 2000);
      return;
    }

    if (import.meta.env.DEV) {
      logInfo("Starting scraping process");
    }
    startScraping();
  }, []);

  const startScraping = async () => {
    try {
      // Simulate progress through each step
      for (let i = 0; i < steps.length; i++) {
        setCurrentStepIndex(i);
        setSteps((prev) =>
          prev.map((s, idx) =>
            idx === i
              ? { ...s, status: "processing" }
              : idx < i
              ? { ...s, status: "complete" }
              : s
          )
        );

        // Simulate processing time (1-2 seconds per step)
        await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

        // Mark step as complete
        setSteps((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, status: "complete" } : s
          )
        );
      }

      // Call actual API to scrape website
      await scrapeWebsite();

      // Celebrate completion
      setIsComplete(true);
      fire({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.5 },
        colors: ["#632bf0", "#c084fc", "#e2e8f0", "#a855f7"], // primary-light, purple-400, slate-200, purple-500 (design tokens)
      });

      // Move to brand summary review after a moment
      setTimeout(() => {
        setOnboardingStep(5);
      }, 2000);
    } catch (err) {
      // ✅ ENHANCED ERROR HANDLING: Log full error details and show user-friendly message
      const errorMessage = err instanceof Error ? err.message : String(err);
      logError("Scraping failed", err instanceof Error ? err : new Error(errorMessage), {
        step: "scraping_process",
      });
      
      // Show user-friendly error message
      let userMessage = "Failed to scrape website. ";
      if (errorMessage.includes("timeout")) {
        userMessage += "The website took too long to load. Please try again.";
      } else if (errorMessage.includes("browser") || errorMessage.includes("launch")) {
        userMessage += "Unable to access the website. Please verify the URL is correct.";
      } else if (errorMessage.includes("network") || errorMessage.includes("connection")) {
        userMessage += "Unable to connect to the website. Please check your internet connection.";
      } else if (errorMessage.includes("401") || errorMessage.includes("403") || errorMessage.includes("Unauthorized")) {
        userMessage += "Authentication error. Please refresh the page and try again.";
      } else {
        userMessage += "Please try again or contact support if the issue persists.";
      }
      
      setError(userMessage);
      
      // Still proceed to brand summary review with default data (don't block onboarding)
      setTimeout(() => {
        generateDefaultBrandSnapshot();
        setOnboardingStep(5);
      }, 2000);
    }
  };

  const scrapeWebsite = async () => {
    if (!user?.website) {
      if (import.meta.env.DEV) {
        logWarning("scrapeWebsite called but no website provided");
      }
      return;
    }

    try {
      // ✅ CRITICAL: Use REAL brandId from database (created in step 2)
      // Do NOT create temporary IDs - brand should already exist
      const brandId = localStorage.getItem("postd_brand_id");
      if (!brandId) {
        const errorMsg = "Brand ID not found. Please go back to step 2 and complete brand creation.";
        logError("Brand ID not found", new Error(errorMsg), { step: "scrape_validation" });
        setError(errorMsg);
        // Show error to user
        setTimeout(() => {
          alert(errorMsg);
        }, 100);
        return;
      }

      // ✅ Validate brandId is a UUID (not temporary brand_*)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(brandId)) {
        const errorMsg = `Invalid brand ID format. Brand must be created first. Please go back to step 2.`;
        logError("Invalid brand ID format", new Error(errorMsg), { step: "scrape_validation" });
        setError(errorMsg);
        setTimeout(() => {
          alert(errorMsg);
        }, 100);
        return;
      }

      if (import.meta.env.DEV) {
        logInfo("Starting scrape", { step: "crawl_started", sync: true });
      }

      // Call the backend crawler endpoint (sync mode for onboarding)
      // ✅ CRITICAL: Include workspaceId/tenantId so images can be persisted
      const crawlerWorkspaceId = (user as any)?.workspaceId || (user as any)?.tenantId || localStorage.getItem("aligned_workspace_id");
      
      // ✅ Use centralized API utility for authenticated requests
      const { apiPost } = await import("@/lib/api");
      
      // ✅ Check if token exists before making request
      const token = localStorage.getItem("aligned_access_token");
      if (import.meta.env.DEV) {
        logInfo("Calling crawler API", {
          step: "crawl_api_call",
          hasToken: !!token,
        });
      }
      
      // ✅ NEW ASYNC API: Start crawl job and get runId
      const startResult = await apiPost<{ runId: string; status: string; message: string }>(`/api/crawl/start`, {
        url: user.website,
        brand_id: brandId,
        workspaceId: crawlerWorkspaceId,
      });

      const runId = startResult.runId;
      if (!runId) {
        throw new Error("Failed to start crawl job - no runId returned");
      }

      if (import.meta.env.DEV) {
        logInfo("Crawl job started", { step: "crawl_queued", runId });
      }

      // ✅ POLL FOR RESULTS: Check status until completed or failed
      let pollAttempts = 0;
      const maxPollAttempts = 120; // 2 minutes (120 * 1000ms)
      let crawlStatus: any = null;

      while (pollAttempts < maxPollAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
        pollAttempts++;

        try {
          const { apiGet } = await import("@/lib/api");
          crawlStatus = await apiGet<{
            id: string;
            status: 'pending' | 'processing' | 'completed' | 'failed';
            progress: number;
            brandKit: any | null;
            errorMessage: string | null;
          }>(`/api/crawl/status/${runId}`);

          if (import.meta.env.DEV) {
            logInfo("Crawl status", {
              step: "poll_status",
              status: crawlStatus.status,
              progress: crawlStatus.progress,
              attempt: pollAttempts,
            });
          }

          // Update progress based on status
          if (crawlStatus.status === "processing") {
            // Progress is tracked automatically by the steps state
            const progressStep = Math.floor(crawlStatus.progress / 25); // 0-3
            if (progressStep < steps.length) {
              setCurrentStepIndex(progressStep);
              setSteps(steps.map((s, i) => ({
                ...s,
                status: i < progressStep ? "complete" : i === progressStep ? "processing" : "pending"
              })));
            }
          }

          // Exit loop when completed or failed
          if (crawlStatus.status === "completed" || crawlStatus.status === "failed") {
            break;
          }
        } catch (pollError) {
          logError("Crawl status poll error", pollError instanceof Error ? pollError : new Error(String(pollError)), {
            step: "poll_error",
            attempt: pollAttempts,
          });
          // Continue polling even if one request fails
        }
      }

      // Check final status
      if (!crawlStatus || crawlStatus.status === "failed") {
        throw new Error(crawlStatus?.errorMessage || "Crawl failed");
      }

      if (crawlStatus.status !== "completed") {
        throw new Error("Crawl timed out - please try again");
      }

      if (import.meta.env.DEV) {
        logInfo("Crawler API success", {
          step: "crawl_complete",
          hasBrandKit: !!crawlStatus.brandKit,
          hasImages: !!(crawlStatus.brandKit?.images?.length),
          hasAboutBlurb: !!crawlStatus.brandKit?.about_blurb,
        });
      }
      
      // Handle both success and fallback responses
      const brandKit = crawlStatus.brandKit || {};
      
      // ✅ CRITICAL: Log if about_blurb is missing or invalid
      if (!brandKit?.about_blurb || brandKit.about_blurb === "0" || brandKit.about_blurb.length < 10) {
        logError("Invalid about_blurb from crawler", new Error("about_blurb missing or invalid"), {
          step: "crawl_validation",
          aboutBlurbType: typeof brandKit?.about_blurb,
          aboutBlurbLength: brandKit?.about_blurb?.length || 0,
        });
      }
      
      // Transform result into BrandSnapshot format
      // Use brandKit from result (sync mode returns brandKit directly)
      const brandSnapshot = {
        name: user.businessName || extractBrandNameFromUrl(user.website),
        voice: brandKit?.voice_summary?.style || "Professional and clear",
        tone: Array.isArray(brandKit?.voice_summary?.tone) 
          ? brandKit.voice_summary.tone 
          : ["Professional", "Trustworthy"],
        audience: brandKit?.voice_summary?.audience || "Your target audience",
        goal: "Grow brand awareness and engagement",
        colors: brandKit?.colors?.allColors && brandKit.colors.allColors.length > 0
          ? brandKit.colors.allColors.slice(0, 6) // Use allColors array (up to 6 colors)
          : brandKit?.colors?.primaryColors && brandKit.colors.primaryColors.length > 0
          ? brandKit.colors.primaryColors
          : brandKit?.colors
          ? [
              brandKit.colors.primary,
              brandKit.colors.secondary,
              brandKit.colors.accent,
            ].filter(Boolean)
          : ["#4F46E5", "#818CF8"],
        industry: user.industry,
        logo: brandKit?.logoUrl, // Include logo URL
          extractedMetadata: {
            keywords: brandKit?.keyword_themes || [],
            coreMessaging: [],
            dos: [],
            donts: brandKit?.voice_summary?.avoid || [],
            images: brandKit?.images?.map((img: any) => img.url) || [], // Extract image URLs
            // ✅ SINGLE SOURCE OF TRUTH: Use server-generated about_blurb only
            // Server (processBrandIntake) generates AI story, client just uses it
            brandIdentity: (brandKit?.about_blurb && typeof brandKit.about_blurb === "string" && brandKit.about_blurb.length > 10 && brandKit.about_blurb !== "0")
              ? brandKit.about_blurb 
              : "", // Empty string - will be handled by Screen5BrandSummaryReview fallback
            headlines: brandKit?.headlines || [], // Include headlines
            // ✅ MVP2: Host-aware copy extraction fields
            heroHeadline: brandKit?.heroHeadline || "",
            aboutText: brandKit?.aboutText || "",
            services: brandKit?.services || [],
            // ✅ MVP2: Host metadata for observability and styling hints
            host: brandKit?.metadata?.host || null,
          },
      };
      
      // Log successful scrape
      if (import.meta.env.DEV) {
        logInfo("Successfully scraped website data", { step: "scrape_complete" });
      }

      setBrandSnapshot(brandSnapshot);
      
      // ✅ Brand already exists (created in step 2), just save Brand Guide
      const brandName = user.businessName || extractBrandNameFromUrl(user.website);
      
      // Save Brand Guide to Supabase with real brandId
      try {
        await saveBrandGuideFromOnboarding(brandId, brandSnapshot, brandName);
        if (import.meta.env.DEV) {
          logInfo("Brand Guide saved", { step: "brand_guide_saved" });
        }
      } catch (error) {
        logError("Failed to save Brand Guide", error instanceof Error ? error : new Error(String(error)), {
          step: "brand_guide_save",
        });
        // Continue anyway - don't block onboarding
      }
      
      // ✅ AUTO-WORKFLOW: If feature flag is enabled, run onboarding workflow to generate first week
      // Also check if workflow was already triggered (double-execution prevention)
      const workflowAlreadyCompleted = localStorage.getItem(`postd:onboarding:${brandId}:workflow_completed`) === "true";
      const workflowInProgress = localStorage.getItem(`postd:onboarding:${brandId}:workflow_in_progress`) === "true";
      
      if (isFeatureEnabled("onboarding_auto_run_workflow") && !workflowAlreadyCompleted && !workflowInProgress) {
        console.log("[OnboardingWorkflow] brandId=" + brandId + " triggered");
        logInfo("Auto-workflow enabled, generating first week of content", { step: "auto_workflow_start", brandId });
        await runOnboardingWorkflow(brandId);
      } else if (workflowAlreadyCompleted) {
        console.log("[OnboardingWorkflow] brandId=" + brandId + " skipped (already completed)");
      } else if (workflowInProgress) {
        console.log("[OnboardingWorkflow] brandId=" + brandId + " skipped (in progress)");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Scraping failed";
      logError("Scraping error", err instanceof Error ? err : new Error(errorMessage), {
        step: "scrape_error",
      });
      
      // ✅ Show error to user instead of silently falling back
      setError(errorMessage);
      
      // Don't generate default - show error state
      // User can retry or go back
    }
  };

  const generateDefaultBrandSnapshot = () => {
    const brandSnapshot = {
      name: user?.businessName || extractBrandNameFromUrl(user?.website || ""),
      voice: "Professional and clear",
      tone: ["Professional", "Trustworthy", "Approachable"],
      audience: "Your target customers",
      goal: "Grow brand awareness and engagement",
      colors: ["#632bf0", "#c084fc", "#e2e8f0"], // primary-light, purple-400, slate-200 (design tokens)
      industry: user?.industry,
      extractedMetadata: {
        keywords: [],
        coreMessaging: [],
        dos: [],
        donts: [],
        images: [],
        brandIdentity: `${user?.businessName || "Your brand"} is a ${user?.industry || "business"} that connects with customers through authentic communication.`,
      },
    };

    setBrandSnapshot(brandSnapshot);
  };

  /**
   * Auto-run onboarding workflow (generates first week of content)
   * Called after successful scrape if feature flag is enabled
   * 
   * Double-execution prevention:
   * - Sets `workflow_in_progress` flag at start
   * - Clears flag on completion or error
   * - Screen7 checks `workflow_completed` before calling content-plan API
   */
  const runOnboardingWorkflow = async (brandId: string) => {
    const startTime = Date.now();
    
    // ✅ Double-execution prevention: set in-progress flag
    localStorage.setItem(`postd:onboarding:${brandId}:workflow_in_progress`, "true");
    
    try {
      setIsGeneratingContent(true);
      setContentGenerationError(null);
      
      logInfo("Starting onboarding workflow", { step: "workflow_started", brandId });
      
      // Get workspaceId from user context
      const workspaceId = (user as any)?.workspaceId || (user as any)?.tenantId || localStorage.getItem("aligned_workspace_id");
      
      // Use centralized API utility for authenticated requests
      const { apiPost } = await import("@/lib/api");
      
      const result = await apiPost<OnboardingRunAllResponse>("/api/orchestration/onboarding/run-all", {
        brandId,
        workspaceId,
        websiteUrl: user?.website,
        industry: user?.industry,
      });
      
      const durationMs = Date.now() - startTime;
      
      if (result.success && result.status === "completed") {
        logInfo("Onboarding workflow completed", {
          step: "workflow_complete",
          brandId,
          stepsCompleted: result.steps?.filter((s) => s.status === "completed").length || 0,
        });
        
        // Store workflow result for later screens (e.g., skip Screen7 if content already generated)
        // NOTE: Keys are brand-specific to support multi-brand / agency onboarding
        localStorage.setItem(`postd:onboarding:${brandId}:workflow_completed`, "true");
        localStorage.setItem(`postd:onboarding:${brandId}:workflow_result`, JSON.stringify({
          completedAt: result.completedAt,
          stepsCompleted: result.steps?.map((s) => s.id) || [],
        }));
        
        // ✅ Diagnostic logging (DEV only via console, always via structured log)
        console.log(`[OnboardingWorkflow] completed in ${durationMs} ms`);
        console.log(`[OnboardingWorkflow] result keys set: workflow_completed & workflow_result`);
        
        return true;
      } else {
        // Workflow failed but we don't block onboarding
        logWarning("Onboarding workflow failed or incomplete", {
          step: "workflow_incomplete",
          brandId,
          status: result.status,
          errors: result.errors,
        });
        console.warn(`[OnboardingWorkflow] failed after ${durationMs} ms`, { status: result.status, errors: result.errors });
        setContentGenerationError("We couldn't auto-generate your first week. You can still continue and create content manually.");
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const durationMs = Date.now() - startTime;
      logError("Onboarding workflow error", err instanceof Error ? err : new Error(errorMessage), {
        step: "workflow_error",
      });
      console.error(`[OnboardingWorkflow] error after ${durationMs} ms:`, errorMessage);
      setContentGenerationError("We couldn't auto-generate your first week. You can still continue and create content manually.");
      return false;
    } finally {
      setIsGeneratingContent(false);
      // ✅ Clear in-progress flag
      localStorage.removeItem(`postd:onboarding:${brandId}:workflow_in_progress`);
    }
  };

  const extractBrandNameFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
      return urlObj.hostname.replace("www.", "").split(".")[0];
    } catch {
      return "Your Brand";
    }
  };

  // ✅ REMOVED: generateBrandStoryFromData
  // Brand story is now generated by server (processBrandIntake) using AI
  // Client should only use what server provides, no client-side generation

  const getStepIcon = (step: string) => {
    switch (step) {
      case "explore":
        return <Globe className="w-5 h-5" />;
      case "images":
        return <Image className="w-5 h-5" />;
      case "colors":
        return <Palette className="w-5 h-5" />;
      case "voice":
        return <MessageSquare className="w-5 h-5" />;
      case "offerings":
        return <Package className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Indicator */}
        <OnboardingProgress currentStep={4} totalSteps={10} label="AI scanning your brand" />

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-3">
            We're learning your brand...
          </h1>
          <p className="text-slate-600 font-medium text-lg mb-2">
            POSTD is automatically detecting your logos, images, colors, and brand voice
          </p>
          <p className="text-slate-500 text-sm">
            This usually takes 30-60 seconds. Grab a coffee! ☕
          </p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 p-8 space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.step}
              className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                step.status === "complete"
                  ? "bg-green-50 border border-green-200"
                  : step.status === "processing"
                  ? "bg-indigo-50 border border-indigo-200"
                  : "bg-slate-50 border border-slate-200"
              }`}
            >
              {/* Icon */}
              <div
                className={`flex-shrink-0 ${
                  step.status === "complete"
                    ? "text-green-600"
                    : step.status === "processing"
                    ? "text-indigo-600"
                    : "text-slate-400"
                }`}
              >
                {step.status === "complete" ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : step.status === "processing" ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  getStepIcon(step.step)
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <p
                  className={`font-bold text-sm ${
                    step.status === "complete"
                      ? "text-green-900"
                      : step.status === "processing"
                      ? "text-indigo-900"
                      : "text-slate-600"
                  }`}
                >
                  {step.message}
                </p>
                {step.status === "processing" && (
                  <div className="mt-2 h-1 bg-indigo-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full animate-pulse" style={{ width: "60%" }} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Content Generation State (Auto-workflow) */}
        {isGeneratingContent && (
          <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <Calendar className="w-5 h-5 text-indigo-600 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-900 mb-1">
                  ✨ Generating your first week of content...
                </p>
                <p className="text-xs text-indigo-700">
                  Our AI is creating social posts, emails, and more tailored to your brand. This takes 1-2 minutes.
                </p>
              </div>
              <Loader2 className="w-5 h-5 text-indigo-600 animate-spin ml-auto" />
            </div>
          </div>
        )}

        {/* Content Generation Error (non-blocking) */}
        {contentGenerationError && !isGeneratingContent && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm font-semibold text-amber-900 mb-1">
              ℹ️ Content generation note
            </p>
            <p className="text-xs text-amber-800">
              {contentGenerationError}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm font-semibold text-amber-900 mb-1">
              ⚠️ Couldn't scan your website
            </p>
            <p className="text-xs text-amber-800">
              {error}. Don't worry—we'll create a default profile you can customize in the next step.
            </p>
          </div>
        )}

        {/* Completion Message */}
        {isComplete && !isGeneratingContent && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-lg font-bold text-green-900 mb-1">
              🎉 We've automatically detected your brand assets!
            </p>
            <p className="text-sm text-green-700">
              Your logos, images, colors, and brand voice are ready.
              {(() => {
                // Check brand-specific key for multi-brand/agency support
                const brandId = localStorage.getItem("postd_brand_id");
                return brandId && localStorage.getItem(`postd:onboarding:${brandId}:workflow_completed`) === "true";
              })() && (
                <> We've also generated your first week of content!</>
              )}
              {" "}Taking you to review...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

