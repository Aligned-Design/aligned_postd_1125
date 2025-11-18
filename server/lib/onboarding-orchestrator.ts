/**
 * Onboarding Orchestrator
 * 
 * Handles the complete onboarding workflow for new workspaces/brands:
 * 1. Website scrape (crawler)
 * 2. Brand guide generation (Doc + Design agents)
 * 3. Starter content strategy (Advisor)
 * 4. Sample content pieces (Doc + Design)
 * 
 * Can be triggered automatically on workspace creation or manually via API.
 */

import { logger } from "./logger";
import { supabase } from "./supabase";
import { getCurrentBrandGuide } from "./brand-guide-service";
import { PipelineOrchestrator } from "./pipeline-orchestrator";

export interface OnboardingOptions {
  workspaceId?: string;
  brandId: string;
  websiteUrl?: string;
  industry?: string;
  goals?: string[];
  regenerate?: boolean; // If true, regenerate even if onboarding already completed
}

export interface OnboardingStep {
  id: string;
  name: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  startedAt?: string;
  completedAt?: string;
  error?: string;
  result?: unknown;
}

export interface OnboardingResult {
  workspaceId?: string;
  brandId: string;
  status: "started" | "completed" | "failed";
  steps: OnboardingStep[];
  startedAt: string;
  completedAt?: string;
  errors: Array<{ step: string; error: string; timestamp: string }>;
}

/**
 * Check if onboarding has already been completed for a brand
 */
async function hasCompletedOnboarding(brandId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("brands")
      .select("onboarding_completed_at, brand_kit")
      .eq("id", brandId)
      .single();

    if (error || !data) {
      return false;
    }

    // Consider onboarding complete if brand_kit exists and onboarding_completed_at is set
    return !!(data.brand_kit && data.onboarding_completed_at);
  } catch {
    return false;
  }
}

/**
 * Mark onboarding as completed in database
 */
async function markOnboardingCompleted(brandId: string): Promise<void> {
  try {
    await supabase
      .from("brands")
      .update({
        onboarding_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", brandId);
  } catch (error) {
    logger.error("Failed to mark onboarding as completed", error, { brandId });
  }
}

/**
 * Step 1: Run website crawler
 */
async function runCrawlerStep(
  brandId: string,
  websiteUrl: string,
  step: OnboardingStep
): Promise<OnboardingStep> {
  step.status = "in_progress";
  step.startedAt = new Date().toISOString();

  try {
    logger.info("Onboarding: Starting crawler step", {
      brandId,
      websiteUrl,
      stepId: step.id,
    });

    // Call crawler via HTTP endpoint (simplest approach)
    // In production, this could be optimized to call the function directly
    const apiBaseUrl = process.env.VITE_API_BASE_URL || "http://localhost:8080";
    const crawlResponse = await fetch(`${apiBaseUrl}/api/crawl/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        brand_id: brandId,
        url: websiteUrl,
        sync: true, // Use sync mode for onboarding
      }),
    });

    if (!crawlResponse.ok) {
      throw new Error(`Crawler failed: ${crawlResponse.statusText}`);
    }

    const crawlData = await crawlResponse.json();
    const crawlResult = {
      brandKit: crawlData.brandKit || {},
      pages: crawlData.pages || [],
    };

    // Store crawl results in brand_kit
    const { error: updateError } = await supabase
      .from("brands")
      .update({
        brand_kit: {
          ...crawlResult.brandKit,
          crawled_at: new Date().toISOString(),
          crawled_url: websiteUrl,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", brandId);

    if (updateError) {
      throw new Error(`Failed to save crawl results: ${updateError.message}`);
    }

    step.status = "completed";
    step.completedAt = new Date().toISOString();
    step.result = {
      pagesCrawled: crawlResult.pages?.length || 0,
      colorsExtracted: Object.keys(crawlResult.brandKit?.colors || {}).length,
    };

    logger.info("Onboarding: Crawler step completed", {
      brandId,
      stepId: step.id,
      duration: Date.now() - new Date(step.startedAt!).getTime(),
    });

    return step;
  } catch (error: any) {
    step.status = "failed";
    step.completedAt = new Date().toISOString();
    step.error = error.message || "Crawler failed";
    logger.error("Onboarding: Crawler step failed", error, {
      brandId,
      stepId: step.id,
    });
    return step;
  }
}

/**
 * Step 2: Generate brand guide using Doc + Design agents
 */
async function runBrandGuideStep(
  brandId: string,
  step: OnboardingStep
): Promise<OnboardingStep> {
  step.status = "in_progress";
  step.startedAt = new Date().toISOString();

  try {
    logger.info("Onboarding: Starting brand guide generation", {
      brandId,
      stepId: step.id,
    });

    // Get existing brand guide (may have been populated by crawler)
    const existingGuide = await getCurrentBrandGuide(brandId);

    // If brand guide already exists and is complete, skip
    if (existingGuide && existingGuide.voice && existingGuide.visualIdentity) {
      step.status = "completed";
      step.completedAt = new Date().toISOString();
      step.result = { message: "Brand guide already exists" };
      return step;
    }

    // Use orchestrator to generate strategy (which includes brand guide elements)
    const orchestrator = new PipelineOrchestrator(brandId);
    const cycle = await orchestrator.phase1_Plan({
      brandId,
      goals: ["Establish brand voice", "Define visual identity"],
    });

    // Extract brand guide from strategy
    if (cycle.strategy) {
      const brandGuide = {
        voice: {
          tone: cycle.strategy.voice?.tone || "professional",
          style: cycle.strategy.voice?.style || "conversational",
          personality: cycle.strategy.voice?.personality || [],
        },
        visualIdentity: {
          colors: existingGuide?.visualIdentity?.colors || {},
          typography: existingGuide?.visualIdentity?.typography || {},
        },
        positioning: cycle.strategy.positioning,
      };

      // Update brand_kit with generated guide
      const { error: updateError } = await supabase
        .from("brands")
        .update({
          brand_kit: {
            ...existingGuide?.brandKit,
            ...brandGuide,
            generated_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", brandId);

      if (updateError) {
        throw new Error(`Failed to save brand guide: ${updateError.message}`);
      }
    }

    step.status = "completed";
    step.completedAt = new Date().toISOString();
    step.result = {
      strategyGenerated: !!cycle.strategy,
      brandGuideCreated: true,
    };

    logger.info("Onboarding: Brand guide step completed", {
      brandId,
      stepId: step.id,
      duration: Date.now() - new Date(step.startedAt!).getTime(),
    });

    return step;
  } catch (error: any) {
    step.status = "failed";
    step.completedAt = new Date().toISOString();
    step.error = error.message || "Brand guide generation failed";
    logger.error("Onboarding: Brand guide step failed", error, {
      brandId,
      stepId: step.id,
    });
    return step;
  }
}

/**
 * Step 3: Generate starter content strategy (Advisor)
 */
async function runStrategyStep(
  brandId: string,
  step: OnboardingStep
): Promise<OnboardingStep> {
  step.status = "in_progress";
  step.startedAt = new Date().toISOString();

  try {
    logger.info("Onboarding: Starting strategy generation", {
      brandId,
      stepId: step.id,
    });

    // Use orchestrator to generate full strategy
    const orchestrator = new PipelineOrchestrator(brandId);
    const cycle = await orchestrator.phase1_Plan({
      brandId,
      goals: ["Create initial content strategy", "Identify key messaging"],
    });

    step.status = "completed";
    step.completedAt = new Date().toISOString();
    step.result = {
      strategyId: cycle.strategy?.id,
      positioning: cycle.strategy?.positioning,
    };

    logger.info("Onboarding: Strategy step completed", {
      brandId,
      stepId: step.id,
      duration: Date.now() - new Date(step.startedAt!).getTime(),
    });

    return step;
  } catch (error: any) {
    step.status = "failed";
    step.completedAt = new Date().toISOString();
    step.error = error.message || "Strategy generation failed";
    logger.error("Onboarding: Strategy step failed", error, {
      brandId,
      stepId: step.id,
    });
    return step;
  }
}

/**
 * Step 4: Generate sample content pieces
 */
async function runSampleContentStep(
  brandId: string,
  step: OnboardingStep
): Promise<OnboardingStep> {
  step.status = "in_progress";
  step.startedAt = new Date().toISOString();

  try {
    logger.info("Onboarding: Starting sample content generation", {
      brandId,
      stepId: step.id,
    });

    // Generate a few sample pieces using orchestrator
    const orchestrator = new PipelineOrchestrator(brandId);
    const cycle = await orchestrator.executeFullPipeline({
      brandId,
      goals: ["Create sample social media posts", "Demonstrate brand voice"],
    });

    step.status = "completed";
    step.completedAt = new Date().toISOString();
    step.result = {
      contentPackageId: cycle.contentPackage?.contentId,
      variantsGenerated: cycle.contentPackage?.copy?.variants?.length || 0,
    };

    logger.info("Onboarding: Sample content step completed", {
      brandId,
      stepId: step.id,
      duration: Date.now() - new Date(step.startedAt!).getTime(),
    });

    return step;
  } catch (error: any) {
    step.status = "failed";
    step.completedAt = new Date().toISOString();
    step.error = error.message || "Sample content generation failed";
    logger.error("Onboarding: Sample content step failed", error, {
      brandId,
      stepId: step.id,
    });
    return step;
  }
}

/**
 * Execute full onboarding workflow
 */
export async function runOnboardingWorkflow(
  options: OnboardingOptions
): Promise<OnboardingResult> {
  const { brandId, websiteUrl, workspaceId, regenerate = false } = options;
  const requestId = `onboarding-${Date.now()}-${brandId}`;

  const result: OnboardingResult = {
    workspaceId,
    brandId,
    status: "started",
    steps: [
      {
        id: "crawler",
        name: "Website Crawler",
        status: "pending",
      },
      {
        id: "brand-guide",
        name: "Brand Guide Generation",
        status: "pending",
      },
      {
        id: "strategy",
        name: "Content Strategy",
        status: "pending",
      },
      {
        id: "sample-content",
        name: "Sample Content",
        status: "pending",
      },
    ],
    startedAt: new Date().toISOString(),
    errors: [],
  };

  logger.info("Onboarding workflow started", {
    requestId,
    brandId,
    workspaceId,
    websiteUrl,
    regenerate,
  });

  try {
    // Check if already completed (unless regenerating)
    if (!regenerate && (await hasCompletedOnboarding(brandId))) {
      logger.info("Onboarding already completed, skipping", { brandId });
      result.status = "completed";
      result.completedAt = new Date().toISOString();
      result.steps.forEach((step) => {
        step.status = "completed";
        step.result = { message: "Already completed" };
      });
      return result;
    }

    // Step 1: Crawler (if website URL provided)
    if (websiteUrl) {
      const crawlerStep = result.steps.find((s) => s.id === "crawler");
      if (crawlerStep) {
        await runCrawlerStep(brandId, websiteUrl, crawlerStep);
        if (crawlerStep.status === "failed") {
          result.errors.push({
            step: "crawler",
            error: crawlerStep.error || "Crawler failed",
            timestamp: new Date().toISOString(),
          });
        }
      }
    } else {
      // Skip crawler if no URL
      const crawlerStep = result.steps.find((s) => s.id === "crawler");
      if (crawlerStep) {
        crawlerStep.status = "completed";
        crawlerStep.result = { message: "Skipped - no website URL provided" };
      }
    }

    // Step 2: Brand Guide
    const brandGuideStep = result.steps.find((s) => s.id === "brand-guide");
    if (brandGuideStep) {
      await runBrandGuideStep(brandId, brandGuideStep);
      if (brandGuideStep.status === "failed") {
        result.errors.push({
          step: "brand-guide",
          error: brandGuideStep.error || "Brand guide generation failed",
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Step 3: Strategy
    const strategyStep = result.steps.find((s) => s.id === "strategy");
    if (strategyStep) {
      await runStrategyStep(brandId, strategyStep);
      if (strategyStep.status === "failed") {
        result.errors.push({
          step: "strategy",
          error: strategyStep.error || "Strategy generation failed",
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Step 4: Sample Content
    const sampleContentStep = result.steps.find((s) => s.id === "sample-content");
    if (sampleContentStep) {
      await runSampleContentStep(brandId, sampleContentStep);
      if (sampleContentStep.status === "failed") {
        result.errors.push({
          step: "sample-content",
          error: sampleContentStep.error || "Sample content generation failed",
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Determine final status
    const allCompleted = result.steps.every(
      (s) => s.status === "completed" || s.status === "failed"
    );
    const hasFailures = result.steps.some((s) => s.status === "failed");

    if (allCompleted) {
      result.status = hasFailures ? "failed" : "completed";
      result.completedAt = new Date().toISOString();

      if (result.status === "completed") {
        await markOnboardingCompleted(brandId);
      }

      logger.info("Onboarding workflow completed", {
        requestId,
        brandId,
        status: result.status,
        duration: Date.now() - new Date(result.startedAt).getTime(),
        errors: result.errors.length,
      });
    }

    return result;
  } catch (error: any) {
    result.status = "failed";
    result.completedAt = new Date().toISOString();
    result.errors.push({
      step: "workflow",
      error: error.message || "Onboarding workflow failed",
      timestamp: new Date().toISOString(),
    });

    logger.error("Onboarding workflow failed", error, {
      requestId,
      brandId,
    });

    return result;
  }
}

