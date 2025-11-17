/**
 * Copy Intelligence Agent
 *
 * Generates on-brand copy that aligns with strategy and resonates with audience.
 * Works in tandem with Advisor insights and Creative designs.
 */

import { v4 as uuidv4 } from "uuid";
import type { StrategyBrief } from "./collaboration-artifacts";

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
}

/**
 * Copy Agent - generates on-brand content
 */
export class CopyAgent {
  private brandId: string;
  private requestId: string;

  constructor(brandId: string) {
    this.brandId = brandId;
    this.requestId = uuidv4();
  }

  /**
   * Generate copy using strategy brief
   */
  async generateCopy(
    strategy: StrategyBrief,
    options?: {
      platform?: string;
      contentType?: string;
      additionalContext?: string;
    }
  ): Promise<CopyOutput> {
    const startTime = Date.now();
    const platform = options?.platform || "instagram";
    const contentType = options?.contentType || "post";

    try {
      // Validate strategy (required)
      if (!strategy || !strategy.positioning || !strategy.voice) {
        throw new Error(
          "StrategyBrief required: Must include positioning and voice"
        );
      }

      // Extract key elements from strategy
      const { positioning, voice, competitive } = strategy;
      const toneKeywords = voice.keyMessages || [];
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
        tone: voice.tone,
        emotion,
        hookType: "benefit", // Could vary
        ctaType: "benefit",
        platform,
        targetLength: platform === "instagram" ? 200 : 500,
        keywords: toneKeywords,
        generatedBy: "copy-agent",
      };

      const output: CopyOutput = {
        requestId: this.requestId,
        status: "success",
        headline: selectedHeadline,
        body,
        callToAction: cta,
        hashtags,
        metadata,
        alternativeVersions: headlines.slice(1, 3).map((h) => ({
          hookType: "question",
          headline: h,
          body: this.generateBodyCopy(h, toneKeywords, voice.tone, positioning.missionStatement, platform),
        })),
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        qualityScore: 8.0, // Would be calculated by scoring system
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
  }
): Promise<CopyOutput> {
  const agent = new CopyAgent(brandId);
  return agent.generateCopy(strategy, options);
}
