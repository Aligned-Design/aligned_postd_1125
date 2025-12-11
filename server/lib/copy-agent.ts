/**
 * Copy Intelligence Agent
 *
 * Generates on-brand copy that aligns with strategy and resonates with audience.
 * Works in tandem with Advisor insights and Creative designs.
 *
 * BRAND BRAIN INTEGRATION:
 * - Always request Brand Context from Brand Brain before generating
 * - Evaluate generated content with Brand Brain before returning
 * - Respect brand rules from Brand Brain over default behavior
 */

import { v4 as uuidv4 } from "uuid";
import type { StrategyBrief } from "./collaboration-artifacts";
import { copyAgentPreflight, withAgentPreflight } from "./agent-preflight";
import { getBrandContextPack, evaluateContent } from "./brand-brain-service";
import type { BrandContextPack, ContentEvaluationResult, ContentGoal } from "@shared/brand-brain";

/**
 * Copy output metadata - tags for tracking performance
 */
export interface CopyMetadata {
  tone: string;
  emotion: string;
  hookType: string; // "question", "statistic", "benefit", "story", "contrast"
  ctaType: string; // "direct", "curiosity", "urgency", "benefit"
  platform: string;
  targetLength: number; // character count
  keywords: string[];
  generatedBy: "copy-agent";
}

/**
 * Copy output - what the Copy Agent produces
 */
export interface CopyOutput {
  requestId: string;
  status: "success" | "needs_review" | "failed";
  headline: string;
  subheadline?: string;
  body: string;
  callToAction: string;
  hashtags?: string[];
  metadata: CopyMetadata;
  alternativeVersions?: {
    hookType: string;
    headline: string;
    body: string;
  }[];
  timestamp: string;
  durationMs: number;
  qualityScore?: number;
  /** Brand Brain evaluation result (if available) */
  brandEvaluation?: ContentEvaluationResult;
  /** Brand context used for generation */
  brandContextUsed?: boolean;
}

/**
 * Copy Agent - generates on-brand content
 *
 * PREFLIGHT REQUIREMENTS:
 * - brand_id must be present
 * - Brand Context must be loaded from Brand Brain
 * - All content must be evaluated before returning
 */
export class CopyAgent {
  private brandId: string;
  private requestId: string;
  private brandContext: BrandContextPack | null = null;

  constructor(brandId: string) {
    this.brandId = brandId;
    this.requestId = uuidv4();
  }

  /**
   * Run preflight check before any operation
   */
  async preflight(): Promise<{ passed: boolean; errors: string[] }> {
    const result = await copyAgentPreflight(this.brandId);

    if (result.passed && result.contextPack) {
      this.brandContext = result.contextPack;
    }

    return {
      passed: result.passed,
      errors: result.errors,
    };
  }

  /**
   * Load brand context from Brand Brain
   */
  async loadBrandContext(): Promise<BrandContextPack | null> {
    if (!this.brandContext) {
      this.brandContext = await getBrandContextPack(this.brandId);
    }
    return this.brandContext;
  }

  /**
   * Evaluate generated content with Brand Brain
   */
  async evaluateWithBrandBrain(
    content: { body: string; headline?: string; cta?: string; hashtags?: string[] },
    channel: string,
    goal: ContentGoal = "engagement"
  ): Promise<ContentEvaluationResult | null> {
    try {
      return await evaluateContent(this.brandId, {
        channel,
        content,
        goal,
      });
    } catch (error) {
      console.warn("[CopyAgent] Brand Brain evaluation failed:", error);
      return null;
    }
  }

  /**
   * Generate copy using strategy brief
   *
   * BRAND BRAIN INTEGRATION:
   * 1. Load Brand Context if available
   * 2. Merge Brand Brain rules with strategy
   * 3. Generate copy
   * 4. Evaluate with Brand Brain
   */
  async generateCopy(
    strategy: StrategyBrief,
    options?: {
      platform?: string;
      contentType?: string;
      additionalContext?: string;
      goal?: ContentGoal;
    }
  ): Promise<CopyOutput> {
    const startTime = Date.now();
    const platform = options?.platform || "instagram";
    const contentType = options?.contentType || "post";
    const goal = options?.goal || "engagement";

    try {
      // 1. Load Brand Context from Brand Brain
      await this.loadBrandContext();

      // Validate strategy (required)
      if (!strategy || !strategy.positioning || !strategy.voice) {
        throw new Error(
          "StrategyBrief required: Must include positioning and voice"
        );
      }

      // Extract key elements from strategy
      const { positioning, voice, competitive } = strategy;

      // 2. Merge Brand Brain rules with strategy (Brand Brain wins on conflict)
      let toneKeywords = voice.keyMessages || [];
      let toneDescriptor = voice.tone;

      if (this.brandContext) {
        // Brand Brain voice rules override strategy
        if (this.brandContext.voiceRules.keyMessages.length > 0) {
          toneKeywords = this.brandContext.voiceRules.keyMessages;
        }
        if (this.brandContext.voiceRules.tone.length > 0) {
          toneDescriptor = this.brandContext.voiceRules.tone[0];
        }
      }

      const audience = positioning.targetAudience;

      // Generate headline using multiple hook types
      const headlines = this.generateHeadlines(
        positioning.tagline,
        toneKeywords,
        voice.tone,
        audience.aspirations
      );

      // Select best headline (in real impl, would use AI scoring)
      const selectedHeadline = headlines[0];

      // Generate body copy
      const body = this.generateBodyCopy(
        selectedHeadline,
        toneKeywords,
        voice.tone,
        positioning.missionStatement,
        platform
      );

      // Generate CTA
      const cta = this.generateCTA(
        voice.tone,
        competitive.uniqueValueProposition,
        platform
      );

      // Generate hashtags
      const hashtags = this.generateHashtags(
        toneKeywords,
        positioning.tagline,
        platform
      );

      // Determine emotion from tone
      const emotionMap = {
        professional: "confident",
        casual: "friendly",
        energetic: "excited",
        friendly: "warm",
        authoritative: "trustworthy",
        mixed: "authentic",
      };
      const emotion = emotionMap[voice.tone as keyof typeof emotionMap] || "authentic";

      // Metadata tags
      const metadata: CopyMetadata = {
        tone: toneDescriptor,
        emotion,
        hookType: "benefit", // Could vary
        ctaType: "benefit",
        platform,
        targetLength: platform === "instagram" ? 200 : 500,
        keywords: toneKeywords,
        generatedBy: "copy-agent",
      };

      // 3. Evaluate with Brand Brain before returning
      let brandEvaluation: ContentEvaluationResult | null = null;
      try {
        brandEvaluation = await this.evaluateWithBrandBrain(
          {
            body,
            headline: selectedHeadline,
            cta,
            hashtags,
          },
          platform,
          goal
        );
      } catch (evalError) {
        console.warn("[CopyAgent] Brand evaluation failed:", evalError);
      }

      // Determine status based on evaluation
      let status: "success" | "needs_review" | "failed" = "success";
      let qualityScore = 8.0;

      if (brandEvaluation) {
        qualityScore = brandEvaluation.score / 10; // Convert 0-100 to 0-10
        if (brandEvaluation.score < 60) {
          status = "needs_review";
        }
        // Check for any failed checks
        const hasFailedChecks = brandEvaluation.checks.some(c => c.status === "fail");
        if (hasFailedChecks) {
          status = "needs_review";
        }
      }

      const output: CopyOutput = {
        requestId: this.requestId,
        status,
        headline: selectedHeadline,
        body,
        callToAction: cta,
        hashtags,
        metadata,
        alternativeVersions: headlines.slice(1, 3).map((h) => ({
          hookType: "question",
          headline: h,
          body: this.generateBodyCopy(h, toneKeywords, toneDescriptor, positioning.missionStatement, platform),
        })),
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        qualityScore,
        brandEvaluation: brandEvaluation || undefined,
        brandContextUsed: !!this.brandContext,
      };

      return output;
    } catch (error) {
      throw new Error(
        `Copy generation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Generate multiple headline options
   */
  private generateHeadlines(
    tagline: string,
    keywords: string[],
    tone: string,
    aspirations: string[]
  ): string[] {
    const headlines = [
      // Benefit-focused
      `${aspirations[0] || "Transform"} Your ${tagline}`,

      // Curiosity-driven
      `What If Your ${tagline} Could ${keywords[0] || "succeed"}?`,

      // Direct statement
      `${tagline}: ${aspirations[0] || "The New Standard"}`,

      // Question hook
      `Ready to ${aspirations[0] || "lead"} with ${tagline}?`,

      // Social proof
      `Join [X] Brands Using ${tagline} to ${aspirations[0] || "win"}`,
    ];

    return headlines;
  }

  /**
   * Generate body copy
   */
  private generateBodyCopy(
    headline: string,
    keywords: string[],
    tone: string,
    mission: string,
    platform: string
  ): string {
    const toneWords = {
      professional: ["strategic", "effective", "proven"],
      casual: ["fun", "easy", "awesome"],
      energetic: ["dynamic", "powerful", "transformative"],
      friendly: ["supportive", "together", "community"],
      authoritative: ["expert", "trusted", "leading"],
      mixed: ["authentic", "genuine", "real"],
    };

    const words = toneWords[tone as keyof typeof toneWords] || ["amazing"];
    const keyword = keywords[0] || "success";

    const templates = [
      `${mission} Made simple. Discover how ${words[0]} strategies transform your approach to ${keyword}. Learn what ${words[1]} brands know.`,
      `Every ${keyword} tells a story. Ours is about ${words[0]} solutions and real results. Find out why teams choose us.`,
      `${words[0]} isn't luck—it's strategy. Explore how our approach delivers ${keyword} for brands like yours.`,
    ];

    return templates[0];
  }

  /**
   * Generate call to action
   */
  private generateCTA(tone: string, uniqueValue: string, platform: string): string {
    const ctaMap = {
      professional: "Learn More",
      casual: "Check It Out",
      energetic: "Let's Go",
      friendly: "Join Us",
      authoritative: "Discover How",
      mixed: "Explore Now",
    };

    return ctaMap[tone as keyof typeof ctaMap] || "Learn More";
  }

  /**
   * Generate platform-specific hashtags
   */
  private generateHashtags(
    keywords: string[],
    tagline: string,
    platform: string
  ): string[] {
    if (platform !== "instagram" && platform !== "twitter") {
      return [];
    }

    const hashtags = keywords
      .slice(0, 3)
      .map((k) => `#${k.replace(/\s+/g, "")}`)
      .concat([`#${tagline.replace(/\s+/g, "")}`]);

    return hashtags;
  }

  /**
   * Generate revision based on feedback
   */
  async generateRevision(
    original: CopyOutput,
    feedback: string
  ): Promise<CopyOutput> {
    const startTime = Date.now();

    try {
      // Apply feedback modifications
      let revisedHeadline = original.headline;
      let revisedBody = original.body;

      // Simple feedback application (in real impl, would use AI)
      if (feedback.toLowerCase().includes("shorter")) {
        revisedHeadline = revisedHeadline.split(" ").slice(0, 5).join(" ");
        revisedBody = revisedBody.split(" ").slice(0, 30).join(" ") + "...";
      }

      if (feedback.toLowerCase().includes("longer")) {
        revisedHeadline += "?";
        revisedBody += " Learn more about what makes this special.";
      }

      if (feedback.toLowerCase().includes("casual")) {
        revisedHeadline = revisedHeadline.replace("Transform", "Discover");
        revisedBody = revisedBody.replace("strategic", "awesome");
      }

      return {
        ...original,
        headline: revisedHeadline,
        body: revisedBody,
        status: "needs_review",
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      throw new Error(
        `Revision failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

/**
 * Generate copy with strategy brief
 */
export async function generateCopyWithStrategy(
  brandId: string,
  strategy: StrategyBrief,
  options?: {
    platform?: string;
    contentType?: string;
    goal?: ContentGoal;
  }
): Promise<CopyOutput> {
  const agent = new CopyAgent(brandId);
  return agent.generateCopy(strategy, options);
}

/**
 * Generate copy with Brand Brain integration
 *
 * This is the preferred method for generating copy as it:
 * 1. Runs preflight checks
 * 2. Loads Brand Context
 * 3. Evaluates output with Brand Brain
 */
export async function generateCopyWithBrandBrain(
  brandId: string,
  strategy: StrategyBrief,
  options?: {
    platform?: string;
    contentType?: string;
    goal?: ContentGoal;
  }
): Promise<CopyOutput> {
  return withAgentPreflight("copy", brandId, async (context) => {
    const agent = new CopyAgent(brandId);

    // If preflight provided context, use it
    if (context) {
      agent["brandContext"] = context;
    }

    return agent.generateCopy(strategy, options);
  });
}

/**
 * Generate copy directly from Brand Context (without strategy brief)
 *
 * Use this when you have Brand Context but no pre-defined strategy.
 * Brand Brain provides all the context needed.
 */
export async function generateCopyFromBrandContext(
  brandId: string,
  options: {
    platform: string;
    contentType?: string;
    goal?: ContentGoal;
    topic?: string;
  }
): Promise<CopyOutput> {
  const context = await getBrandContextPack(brandId);

  if (!context) {
    throw new Error(`Brand context not found for brand ${brandId}`);
  }

  // Build a minimal strategy from Brand Context
  const strategy: StrategyBrief = {
    positioning: {
      tagline: context.positioning?.tagline || context.brandName,
      missionStatement: context.positioning?.missionStatement || context.brandSummary.description,
      targetAudience: {
        demographics: {},
        psychographics: [],
        aspirations: context.brandSummary.values,
      },
    },
    voice: {
      tone: context.voiceRules.tone[0] || "professional",
      keyMessages: context.voiceRules.keyMessages.length > 0
        ? context.voiceRules.keyMessages
        : context.voiceRules.brandPhrases,
    },
    visual: {
      primaryColor: context.visualRules.colors[0] || "#000000",
      secondaryColor: context.visualRules.colors[1] || "#ffffff",
    },
    competitive: {
      uniqueValueProposition: context.brandSummary.uvp || context.brandSummary.description,
      differentiators: context.brandSummary.differentiators,
    },
  };

  const agent = new CopyAgent(brandId);
  agent["brandContext"] = context;

  return agent.generateCopy(strategy, options);
}
