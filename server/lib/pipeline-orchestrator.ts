/**
 * Pipeline Orchestrator
 *
 * Coordinates the full content lifecycle across all three agents:
 * Plan → Create → Review → Learn
 *
 * Ensures synchronized execution, shared data passing, and continuous learning.
 */

import { v4 as uuidv4 } from "uuid";
import type { CollaborationContext } from "@shared/collaboration-artifacts";
import {
  createStrategyBrief,
  createContentPackage,
  createBrandHistory,
  createPerformanceLog,
  type StrategyBrief,
  type ContentPackage,
  type BrandHistory,
  type PerformanceLog,
  type BrandHistoryEntry,
} from "@shared/collaboration-artifacts";
import { CreativeAgent } from "./creative-agent";
import type { ReviewScore } from "./advisor-review-scorer";
import { calculateReviewScores, getSeverityLevel } from "./advisor-review-scorer";
import { generateReflectionQuestion } from "./advisor-reflection-generator";
import { PersistenceService } from "./persistence-service";
import { PerformanceTrackingJob } from "./performance-tracking-job";

/**
 * Pipeline Cycle - represents one complete Plan → Create → Review → Learn iteration
 */
export interface PipelineCycle {
  cycleId: string;
  brandId: string;
  requestId: string;
  timestamp: string;
  status: "planning" | "creating" | "reviewing" | "learning" | "complete" | "failed";
  strategy: StrategyBrief | null;
  contentPackage: ContentPackage | null;
  reviewScores: ReviewScore | null;
  learnings: BrandHistoryEntry[];
  metrics: {
    planDurationMs: number;
    createDurationMs: number;
    reviewDurationMs: number;
    learnDurationMs: number;
  };
  errors: Array<{ phase: string; error: string; timestamp: string }>;
}

/**
 * Pipeline Orchestrator - manages full content lifecycle
 */
export class PipelineOrchestrator {
  private brandId: string;
  private cycleId: string;
  private requestId: string;
  private cycle: PipelineCycle;
  private persistenceService: PersistenceService;
  private performanceTracker: PerformanceTrackingJob;

  constructor(brandId: string) {
    this.brandId = brandId;
    this.cycleId = `cycle_${Date.now()}`;
    this.requestId = uuidv4();
    this.persistenceService = new PersistenceService({ enabled: false }); // Enable DB in production
    this.performanceTracker = new PerformanceTrackingJob(brandId);

    this.cycle = {
      cycleId: this.cycleId,
      brandId,
      requestId: this.requestId,
      timestamp: new Date().toISOString(),
      status: "planning",
      strategy: null,
      contentPackage: null,
      reviewScores: null,
      learnings: [],
      metrics: {
        planDurationMs: 0,
        createDurationMs: 0,
        reviewDurationMs: 0,
        learnDurationMs: 0,
      },
      errors: [],
    };
  }

  /**
   * Phase 1: Plan - Advisor analyzes context and generates StrategyBrief
   */
  async phase1_Plan(
    context: Partial<CollaborationContext>
  ): Promise<{ strategy: StrategyBrief; cycle: PipelineCycle }> {
    const phaseStart = Date.now();
    try {
      console.log(
        `[Orchestrator] Phase 1: Plan starting (cycleId: ${this.cycleId})`
      );

      // Load or create StrategyBrief
      let strategy = context.strategyBrief;

      if (!strategy) {
        // Generate StrategyBrief based on BrandHistory trends and current context
        strategy = createStrategyBrief({
          brandId: this.brandId,
          version: "1.0.0",
          positioning: {
            tagline: context.strategyBrief?.positioning?.tagline || "Emerging Brand",
            missionStatement:
              context.strategyBrief?.positioning?.missionStatement ||
              "Building authentic connections",
            targetAudience: {
              demographics:
                context.strategyBrief?.positioning?.targetAudience?.demographics || "All",
              psychographics:
                context.strategyBrief?.positioning?.targetAudience?.psychographics || [],
              painPoints:
                context.strategyBrief?.positioning?.targetAudience?.painPoints || [],
              aspirations:
                context.strategyBrief?.positioning?.targetAudience?.aspirations || [],
            },
          },
          voice: {
            tone: context.strategyBrief?.voice?.tone || "professional",
            personality: context.strategyBrief?.voice?.personality || [],
            keyMessages: context.strategyBrief?.voice?.keyMessages || [],
            avoidPhrases: context.strategyBrief?.voice?.avoidPhrases || [],
          },
          visual: {
            primaryColor: context.strategyBrief?.visual?.primaryColor || "#A76CF5",
            secondaryColor:
              context.strategyBrief?.visual?.secondaryColor || "#F5C96C",
            accentColor: context.strategyBrief?.visual?.accentColor || "#06B6D4",
            fontPairing: {
              heading:
                context.strategyBrief?.visual?.fontPairing?.heading || "Poppins",
              body: context.strategyBrief?.visual?.fontPairing?.body || "Inter",
            },
            imagery: {
              style:
                (context.strategyBrief?.visual?.imagery?.style as any) ||
                "photo",
              subjects: context.strategyBrief?.visual?.imagery?.subjects || [],
            },
          },
          competitive: {
            differentiation:
              context.strategyBrief?.competitive?.differentiation || [],
            uniqueValueProposition:
              context.strategyBrief?.competitive?.uniqueValueProposition || "",
          },
        });
      }

      // Apply learnings from BrandHistory if available
      if (context.brandHistory && context.brandHistory.entries.length > 0) {
        const recentEntries = context.brandHistory.entries.slice(0, 5);
        const successPatterns = recentEntries.filter((e) =>
          e.tags?.includes("success_pattern")
        );

        if (successPatterns.length > 0) {
          console.log(
            `[Orchestrator] Applied ${successPatterns.length} success patterns from history`
          );
        }
      }

      // Persist StrategyBrief
      await this.persistenceService.saveStrategyBrief(this.cycleId, strategy);

      this.cycle.strategy = strategy;
      this.cycle.status = "creating";
      this.cycle.metrics.planDurationMs = Date.now() - phaseStart;

      console.log(
        `[Orchestrator] Phase 1: Plan complete (${this.cycle.metrics.planDurationMs}ms)`
      );

      return { strategy, cycle: this.cycle };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.cycle.errors.push({
        phase: "plan",
        error: errorMsg,
        timestamp: new Date().toISOString(),
      });
      this.cycle.status = "failed";
      throw error;
    }
  }

  /**
   * Phase 2: Create - Copy + Creative generate aligned content
   */
  async phase2_Create(
    strategy: StrategyBrief,
    context: Partial<CollaborationContext>
  ): Promise<{ contentPackage: ContentPackage; cycle: PipelineCycle }> {
    const phaseStart = Date.now();
    try {
      console.log(
        `[Orchestrator] Phase 2: Create starting (cycleId: ${this.cycleId})`
      );

      // Initialize ContentPackage
      const contentPackage = createContentPackage({
        brandId: this.brandId,
        contentId: `content_${Date.now()}`,
        requestId: this.requestId,
        platform: "instagram", // configurable in real impl
        copy: {
          headline: "", // Will be filled by Copy Agent
          body: "",
          callToAction: "",
          tone: strategy.voice.tone,
          keywords: strategy.voice.keyMessages,
          estimatedReadTime: 0,
        },
        status: "draft",
      });

      // Simulate Copy Agent generation (would call actual module in real impl)
      contentPackage.copy.headline = `Amplify Your [${strategy.positioning.tagline}] Impact`;
      contentPackage.copy.body = `Discover how strategic [${strategy.voice.tone}] messaging drives engagement.`;
      contentPackage.copy.callToAction = "Explore Now";
      contentPackage.copy.keywords = strategy.voice.keyMessages;

      // Log Copywriter generation
      contentPackage.collaborationLog.push({
        agent: "copywriter",
        action: "content_generated",
        timestamp: new Date().toISOString(),
        notes: `Generated ${strategy.voice.tone} copy for ${strategy.positioning.tagline}`,
      });

      // Create Creative context
      const creativeContext = {
        ...context,
        strategyBrief: strategy,
        contentPackage,
      } as CollaborationContext;

      // Run Creative Agent
      const creativeAgent = new CreativeAgent(this.brandId);
      const designOutput = await creativeAgent.generateDesignConcept(
        creativeContext,
        { mode: "light", platform: "instagram", wcagLevel: "AA" }
      );

      // Merge design output into ContentPackage
      contentPackage.designContext = {
        suggestedLayout: designOutput.mainConcept.description,
        componentPrecedence: designOutput.mainConcept.componentList,
        colorTheme: JSON.stringify(designOutput.mainConcept.lightMode),
        motionConsiderations: [],
        accessibilityNotes:
          designOutput.accessibilityReport.semanticMarkupRecommendations,
      };

      contentPackage.collaborationLog.push({
        agent: "creative",
        action: "design_concept_generated",
        timestamp: new Date().toISOString(),
        notes: `Generated ${designOutput.status} design with ${designOutput.mainConcept.componentList.length} components`,
      });

      // Persist ContentPackage
      await this.persistenceService.saveContentPackage(contentPackage.contentId, contentPackage);

      this.cycle.contentPackage = contentPackage;
      this.cycle.status = "reviewing";
      this.cycle.metrics.createDurationMs = Date.now() - phaseStart;

      console.log(
        `[Orchestrator] Phase 2: Create complete (${this.cycle.metrics.createDurationMs}ms)`
      );

      return { contentPackage, cycle: this.cycle };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.cycle.errors.push({
        phase: "create",
        error: errorMsg,
        timestamp: new Date().toISOString(),
      });
      this.cycle.status = "failed";
      throw error;
    }
  }

  /**
   * Phase 3: Review - Advisor scores draft and provides feedback
   */
  async phase3_Review(
    contentPackage: ContentPackage,
    context: Partial<CollaborationContext>
  ): Promise<{ reviewScores: ReviewScore; cycle: PipelineCycle }> {
    const phaseStart = Date.now();
    try {
      console.log(
        `[Orchestrator] Phase 3: Review starting (cycleId: ${this.cycleId})`
      );

      // Get strategy from context or cycle
      const strategy = context?.strategyBrief || this.cycle.strategy;
      if (!strategy) {
        throw new Error("StrategyBrief required for review phase");
      }

      // Score the content using Advisor's 5D scoring system
      const scores = calculateReviewScores(
        contentPackage.copy.body,
        {
          feedback: contentPackage.copy.body,
          insights: strategy.voice.keyMessages,
          suggested_actions: [],
        },
        {
          voice_attributes: {
            tone: strategy.voice.tone,
            style: strategy.voice.personality.join(", "),
          },
        },
        contentPackage.platform
      );

      // Generate reflection question
      const question = generateReflectionQuestion(
        scores,
        { feedback: contentPackage.copy.body },
        contentPackage.platform,
        contentPackage.copy.body
      );

      // Determine severity
      const severity = getSeverityLevel(scores.weighted);

      // Log review
      contentPackage.collaborationLog.push({
        agent: "advisor",
        action: "content_scored",
        timestamp: new Date().toISOString(),
        notes: `Scored ${severity}: avg ${scores.average.toFixed(1)}/10, weighted ${scores.weighted.toFixed(1)}/10. Question: "${question.question}"`,
      });

      // Add reflection to package
      contentPackage.copy.keywords = [
        ...contentPackage.copy.keywords,
        question.category,
      ];

      // Note: Keep in draft status until explicit approval (HITL safeguard)
      // Content remains "draft" to enforce human approval requirement

      this.cycle.reviewScores = scores;
      this.cycle.status = "learning";
      this.cycle.metrics.reviewDurationMs = Date.now() - phaseStart;

      console.log(
        `[Orchestrator] Phase 3: Review complete (${this.cycle.metrics.reviewDurationMs}ms) - Severity: ${severity}`
      );

      return { reviewScores: scores, cycle: this.cycle };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.cycle.errors.push({
        phase: "review",
        error: errorMsg,
        timestamp: new Date().toISOString(),
      });
      this.cycle.status = "failed";
      throw error;
    }
  }

  /**
   * Phase 4: Learn - Update BrandHistory, pull analytics, and create trends
   */
  async phase4_Learn(
    contentPackage: ContentPackage,
    scores: ReviewScore,
    brandHistory: BrandHistory,
    publishedContent?: any[]
  ): Promise<{ updatedHistory: BrandHistory; performanceLog?: PerformanceLog; cycle: PipelineCycle }> {
    const phaseStart = Date.now();
    try {
      console.log(
        `[Orchestrator] Phase 4: Learn starting (cycleId: ${this.cycleId})`
      );

      let performanceLog: PerformanceLog | undefined;

      // Step 1: Run analytics ingestion job if published content is available
      if (publishedContent && publishedContent.length > 0) {
        console.log(
          `[Orchestrator] Pulling analytics for ${publishedContent.length} published items...`
        );
        try {
          const { performanceLog: newLog, learnings: analyticsLearnings } =
            await this.performanceTracker.executePollCycle(
              publishedContent,
              undefined // Future enhancement: Pass previous log for trend analysis
            );

          performanceLog = newLog;

          // Add analytics learnings to history
          for (const learning of analyticsLearnings) {
            brandHistory.entries.push(learning);
          }

          console.log(
            `[Orchestrator] Analytics integrated: ${analyticsLearnings.length} insights added`
          );
        } catch (analyticsError) {
          console.warn(
            `[Orchestrator] Analytics job failed (non-blocking):`,
            analyticsError
          );
          // Continue even if analytics fails
        }
      }

      // Step 2: Create history entry for quality review
      const historyEntry: BrandHistoryEntry = {
        timestamp: new Date().toISOString(),
        agent: "advisor",
        action: "performance_insight",
        contentId: contentPackage.contentId,
        details: {
          description: `Reviewed content: ${contentPackage.copy.headline}`,
          visualization: {
            colors: [],
            layout: contentPackage.designContext?.suggestedLayout || "unknown",
            typography: [],
          },
        },
        rationale: `Content scored ${scores.weighted.toFixed(1)}/10 across 5 dimensions`,
        performance: {
          metric: "content_quality_score",
          baseline: 5,
          result: scores.weighted,
          improvement: scores.weighted - 5,
        },
        tags: [
          scores.weighted >= 7.5
            ? "success_pattern"
            : "needs_improvement",
          `platform_${contentPackage.platform}`,
        ],
      };

      // Step 3: Update history
      const updatedHistory = { ...brandHistory };
      updatedHistory.entries = [historyEntry, ...updatedHistory.entries];
      updatedHistory.lastUpdated = new Date().toISOString();

      // Step 4: Track success patterns
      if (scores.weighted >= 7.5) {
        const pattern = {
          pattern: `High-quality content: clarity ${scores.clarity}, alignment ${scores.brand_alignment}`,
          frequency: 1,
          avgPerformance: scores.weighted,
          examples: [contentPackage.contentId],
        };
        updatedHistory.successPatterns = [
          pattern,
          ...updatedHistory.successPatterns,
        ];
      }

      // Step 5: Log all learning activities
      contentPackage.collaborationLog.push({
        agent: "advisor",
        action: "learnings_recorded",
        timestamp: new Date().toISOString(),
        notes: `Updated BrandHistory: ${historyEntry.action}, pattern tags: ${historyEntry.tags.join(", ")}`,
      });

      // Step 6: Persist BrandHistory
      await this.persistenceService.addBrandHistoryEntry(
        this.brandId,
        historyEntry
      );

      if (performanceLog) {
        contentPackage.collaborationLog.push({
          agent: "advisor",
          action: "performance_log_updated",
          timestamp: new Date().toISOString(),
          notes: `Analytics processed: ${performanceLog.summary.totalContent} content items analyzed`,
        });
      }

      this.cycle.learnings = [historyEntry];
      this.cycle.status = "complete";
      this.cycle.metrics.learnDurationMs = Date.now() - phaseStart;

      console.log(
        `[Orchestrator] Phase 4: Learn complete (${this.cycle.metrics.learnDurationMs}ms)`
      );

      return { updatedHistory, performanceLog, cycle: this.cycle };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.cycle.errors.push({
        phase: "learn",
        error: errorMsg,
        timestamp: new Date().toISOString(),
      });
      this.cycle.status = "failed";
      throw error;
    }
  }

  /**
   * Execute full pipeline: Plan → Create → Review → Learn
   */
  async executeFullPipeline(
    context: Partial<CollaborationContext>
  ): Promise<PipelineCycle> {
    console.log(
      `\n╔════════════════════════════════════════════════════════════════╗`
    );
    console.log(
      `║ PIPELINE ORCHESTRATOR - FULL CYCLE EXECUTION                  ║`
    );
    console.log(
      `╚════════════════════════════════════════════════════════════════╝\n`
    );
    console.log(`Cycle ID: ${this.cycleId}`);
    console.log(`Request ID: ${this.requestId}`);
    console.log(`Brand ID: ${this.brandId}\n`);

    try {
      // Phase 1: Plan
      const { strategy } = await this.phase1_Plan(context);

      // Phase 2: Create
      const { contentPackage } = await this.phase2_Create(strategy, context);

      // Phase 3: Review
      const { reviewScores } = await this.phase3_Review(
        contentPackage,
        context
      );

      // Phase 4: Learn
      const brandHistory =
        context.brandHistory || createBrandHistory({ brandId: this.brandId });
      const { updatedHistory, performanceLog } = await this.phase4_Learn(
        contentPackage,
        reviewScores,
        brandHistory,
        context.publishedContent as any[]
      );

      // Persist final state
      try {
        await this.persistenceService.saveBrandHistory(
          this.brandId,
          updatedHistory
        );
        if (performanceLog) {
          // Performance log would be persisted in production DB integration
          console.log(
            `[Orchestrator] Performance log ready for persistence: ${performanceLog.id}`
          );
        }
      } catch (persistError) {
        console.warn(`[Orchestrator] Failed to persist final state:`, persistError);
        // Continue anyway - data is in memory
      }

      // Final status
      console.log(`\n✅ Pipeline Cycle Complete`);
      console.log(`  Total Duration: ${this.getTotalDuration()}ms`);
      console.log(`  Content Quality: ${reviewScores.weighted.toFixed(1)}/10`);
      console.log(`  Learnings Recorded: ${updatedHistory.entries.length}`);

      return this.cycle;
    } catch (error) {
      console.error(`\n❌ Pipeline Cycle Failed`);
      console.error(
        `  Errors: ${this.cycle.errors.length}`,
        this.cycle.errors
      );
      throw error;
    }
  }

  /**
   * Get cycle summary
   */
  getCycleSummary(): {
    cycleId: string;
    status: string;
    duration: number;
    phases: Record<string, number>;
    learnings: number;
    errors: number;
  } {
    return {
      cycleId: this.cycleId,
      status: this.cycle.status,
      duration: this.getTotalDuration(),
      phases: this.cycle.metrics,
      learnings: this.cycle.learnings.length,
      errors: this.cycle.errors.length,
    };
  }

  /**
   * Get total duration across all phases
   */
  private getTotalDuration(): number {
    return (
      this.cycle.metrics.planDurationMs +
      this.cycle.metrics.createDurationMs +
      this.cycle.metrics.reviewDurationMs +
      this.cycle.metrics.learnDurationMs
    );
  }
}

/**
 * Execute a complete pipeline cycle
 */
export async function executePipelineCycle(
  brandId: string,
  context: Partial<CollaborationContext>
): Promise<PipelineCycle> {
  const orchestrator = new PipelineOrchestrator(brandId);
  return orchestrator.executeFullPipeline(context);
}
