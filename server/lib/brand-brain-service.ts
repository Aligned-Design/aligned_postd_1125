/**
 * Brand Brain Service
 *
 * Central service for Brand Brain AI operations:
 * - getBrandContextPack: Returns context for other agents
 * - evaluateContent: Evaluates content for brand alignment (BFS-like scoring)
 * - registerOutcome: Logs performance outcomes for learning
 * - refreshStateFromBrandGuide: Syncs state from Brand Guide
 *
 * SCOPE: Brand Brain is the ONLY intelligence that may:
 * - Read/write brand content
 * - Read/write brand-level memory
 * - Evaluate content for a brand
 * - Suggest creative fixes based on brand rules
 */

import { v4 as uuidv4 } from "uuid";
import { supabase } from "./supabase";
import { getCurrentBrandGuide } from "./brand-guide-service";
import { calculateBFS } from "../agents/brand-fidelity-scorer";
import type { BrandGuide } from "@shared/brand-guide";
import type {
  BrandBrainState,
  BrandContextPack,
  ContentEvaluationInput,
  ContentEvaluationResult,
  OutcomeRegistrationInput,
  BrandBrainEvent,
  BrandBrainExample,
  EvaluationCheck,
  ExampleSnippet,
  VoiceRules,
  VisualRules,
  BrandSummary,
  BrandPreferences,
} from "@shared/brand-brain";

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class BrandBrainService {
  private static instance: BrandBrainService;
  private evaluationVersion = "v1.0.0";

  private constructor() {}

  static getInstance(): BrandBrainService {
    if (!BrandBrainService.instance) {
      BrandBrainService.instance = new BrandBrainService();
    }
    return BrandBrainService.instance;
  }

  // ==========================================================================
  // GET BRAND CONTEXT PACK
  // ==========================================================================

  /**
   * Returns a structured JSON object used to prime other agents.
   * Includes brandSummary, voiceRules, visualRules, dosAndDonts, exampleSnippets.
   *
   * Used by: Copy Agent, Creative/Design Agent, Advisor Agent
   */
  async getBrandContextPack(brandId: string): Promise<BrandContextPack | null> {
    try {
      // 1. Get or create Brand Brain state
      let state = await this.getBrandBrainState(brandId);

      if (!state) {
        // State doesn't exist - try to create from Brand Guide
        await this.refreshStateFromBrandGuide(brandId);
        state = await this.getBrandBrainState(brandId);

        if (!state) {
          console.warn(`[BrandBrain] Could not create state for brand ${brandId}`);
          return null;
        }
      }

      // 2. Get example snippets
      const examples = await this.getExampleSnippets(brandId);

      // 3. Get brand name from Brand Guide
      const brandGuide = await getCurrentBrandGuide(brandId);
      const brandName = brandGuide?.brandName || "Unknown Brand";

      // 4. Build do's and don'ts from voice rules and preferences
      const dosAndDonts = this.buildDosAndDonts(state);

      // 5. Build context pack
      const contextPack: BrandContextPack = {
        brandId,
        brandName,
        brandSummary: state.summary,
        voiceRules: state.voiceRules,
        visualRules: state.visualRules,
        dosAndDonts,
        exampleSnippets: examples,
        positioning: brandGuide
          ? {
              tagline: brandGuide.identity?.sampleHeadlines?.[0],
              missionStatement: brandGuide.mission,
              visionStatement: brandGuide.vision,
            }
          : undefined,
        offers: brandGuide?.approvedAssets?.productsServices?.map((p) => p.name) || [],
        audienceSegments: brandGuide?.personas?.map((p) => p.name) || [],
        contentPillars: state.preferences.contentPillars,
        regulatedIndustry:
          state.preferences.requiredDisclaimers.length > 0
            ? {
                isRegulated: true,
                requiredDisclaimers: state.preferences.requiredDisclaimers,
              }
            : undefined,
        version: state.version,
        generatedAt: new Date().toISOString(),
      };

      // 6. Log event
      await this.logEvent(brandId, "CONTEXT_BUILT", "brand-brain-service", { brandId }, { contextPackVersion: state.version });

      return contextPack;
    } catch (error) {
      console.error(`[BrandBrain] Error getting context pack for ${brandId}:`, error);
      throw error;
    }
  }

  // ==========================================================================
  // EVALUATE CONTENT
  // ==========================================================================

  /**
   * Evaluates content for brand alignment.
   *
   * Input: channel, content (text + metadata), goal
   * Output: score (0-100), checks[], recommendations[], canAutoFix
   *
   * Side effects: Logs a brand_brain_events row
   */
  async evaluateContent(
    brandId: string,
    input: ContentEvaluationInput
  ): Promise<ContentEvaluationResult> {
    const startTime = Date.now();

    try {
      // 1. Get Brand Brain state
      const state = await this.getBrandBrainState(brandId);
      if (!state) {
        throw new Error(`Brand Brain state not found for brand ${brandId}`);
      }

      // 2. Get Brand Guide for additional context
      const brandGuide = await getCurrentBrandGuide(brandId);

      // 3. Run individual checks
      const checks: EvaluationCheck[] = [];
      let totalWeight = 0;
      let weightedScore = 0;

      // Tone alignment check (30% weight)
      const toneCheck = this.checkToneAlignment(input.content, state.voiceRules);
      checks.push(toneCheck);
      totalWeight += toneCheck.weight;
      weightedScore += this.statusToScore(toneCheck.status) * toneCheck.weight;

      // Compliance check (20% weight)
      const complianceCheck = this.checkCompliance(input.content, state.voiceRules, state.preferences);
      checks.push(complianceCheck);
      totalWeight += complianceCheck.weight;
      weightedScore += this.statusToScore(complianceCheck.status) * complianceCheck.weight;

      // CTA check (15% weight)
      const ctaCheck = this.checkCTA(input.content, state.voiceRules);
      checks.push(ctaCheck);
      totalWeight += ctaCheck.weight;
      weightedScore += this.statusToScore(ctaCheck.status) * ctaCheck.weight;

      // Platform fit check (15% weight)
      const platformCheck = this.checkPlatformFit(input.content, input.channel);
      checks.push(platformCheck);
      totalWeight += platformCheck.weight;
      weightedScore += this.statusToScore(platformCheck.status) * platformCheck.weight;

      // Clarity check (10% weight)
      const clarityCheck = this.checkClarity(input.content);
      checks.push(clarityCheck);
      totalWeight += clarityCheck.weight;
      weightedScore += this.statusToScore(clarityCheck.status) * clarityCheck.weight;

      // Brand terminology check (10% weight)
      const terminologyCheck = this.checkTerminology(input.content, state.voiceRules);
      checks.push(terminologyCheck);
      totalWeight += terminologyCheck.weight;
      weightedScore += this.statusToScore(terminologyCheck.status) * terminologyCheck.weight;

      // 4. Calculate overall score
      const score = Math.round((weightedScore / totalWeight) * 100);

      // 5. Generate recommendations
      const recommendations = this.generateRecommendations(checks, state, input);

      // 6. Use existing BFS calculator for additional validation
      let bfsScore = score;
      if (brandGuide) {
        try {
          const bfsResult = await calculateBFS(
            {
              body: input.content.body,
              headline: input.content.headline,
              cta: input.content.cta,
              hashtags: input.content.hashtags,
              platform: input.channel,
            },
            brandGuide
          );
          // Blend BFS with our checks (70% our checks, 30% BFS)
          bfsScore = Math.round(score * 0.7 + bfsResult.overall * 100 * 0.3);
        } catch (bfsError) {
          console.warn("[BrandBrain] BFS calculation failed, using check-based score:", bfsError);
        }
      }

      const result: ContentEvaluationResult = {
        score: bfsScore,
        checks,
        recommendations,
        canAutoFix: false, // Future feature
        evaluatedAt: new Date().toISOString(),
        evaluationVersion: this.evaluationVersion,
      };

      // 7. Log event
      await this.logEvent(brandId, "CONTENT_EVALUATED", "brand-brain-service", { input, channel: input.channel, goal: input.goal }, { score: result.score, checksCount: checks.length, durationMs: Date.now() - startTime });

      return result;
    } catch (error) {
      console.error(`[BrandBrain] Error evaluating content for ${brandId}:`, error);
      throw error;
    }
  }

  // ==========================================================================
  // REGISTER OUTCOME
  // ==========================================================================

  /**
   * Registers content performance outcome for learning.
   *
   * Input: contentId, channel, performanceMetrics, userFeedback
   * Action: Writes to brand_brain_examples, optionally updates brand_brain_state
   */
  async registerOutcome(brandId: string, input: OutcomeRegistrationInput): Promise<void> {
    try {
      // 1. Determine example type based on performance and feedback
      let exampleType: "POSITIVE" | "NEGATIVE" | "NEUTRAL" = "NEUTRAL";

      if (input.userFeedback) {
        if (input.userFeedback.rating === "great" || input.userFeedback.rating === "good") {
          exampleType = "POSITIVE";
        } else if (input.userFeedback.rating === "poor" || input.userFeedback.rating === "off_brand") {
          exampleType = "NEGATIVE";
        }
      } else if (input.performanceMetrics.engagementRate !== undefined) {
        // Use engagement rate as heuristic
        if (input.performanceMetrics.engagementRate > 5) {
          exampleType = "POSITIVE";
        } else if (input.performanceMetrics.engagementRate < 1) {
          exampleType = "NEGATIVE";
        }
      }

      // 2. Create example entry
      const example: Partial<BrandBrainExample> = {
        brandId,
        exampleType,
        channel: input.channel,
        content: {
          body: "", // Content body would come from content service
        },
        performance: input.performanceMetrics,
        notes: input.userFeedback?.comment,
        source: input.userFeedback ? "user_feedback" : "analytics",
      };

      const { error } = await supabase.from("brand_brain_examples").insert({
        brand_id: brandId,
        example_type: exampleType,
        channel: input.channel,
        content: example.content,
        performance: input.performanceMetrics,
        notes: input.userFeedback?.comment,
        source: example.source,
      });

      if (error) {
        throw new Error(`Failed to register outcome: ${error.message}`);
      }

      // 3. Log event
      await this.logEvent(brandId, "OUTCOME_REGISTERED", "brand-brain-service", { contentId: input.contentId, channel: input.channel }, { exampleType, hasUserFeedback: !!input.userFeedback });

      console.log(`[BrandBrain] Registered outcome for content ${input.contentId} as ${exampleType}`);
    } catch (error) {
      console.error(`[BrandBrain] Error registering outcome for ${brandId}:`, error);
      throw error;
    }
  }

  // ==========================================================================
  // REFRESH STATE FROM BRAND GUIDE
  // ==========================================================================

  /**
   * Refreshes Brand Brain state from Brand Guide.
   *
   * Called after:
   * - Initial scrape + brand guide generation
   * - Major brand settings change
   *
   * Action: Reads Brand Guide, writes distilled fields into brand_brain_state
   */
  async refreshStateFromBrandGuide(brandId: string): Promise<void> {
    try {
      // 1. Get Brand Guide
      const brandGuide = await getCurrentBrandGuide(brandId);
      if (!brandGuide) {
        console.warn(`[BrandBrain] No Brand Guide found for ${brandId}`);
        return;
      }

      // 2. Distill into Brand Brain state format
      const summary: BrandSummary = {
        description: this.generateBrandDescription(brandGuide),
        businessType: brandGuide.identity?.businessType,
        industry: brandGuide.identity?.industry,
        values: brandGuide.identity?.values || [],
        targetAudience: brandGuide.identity?.targetAudience,
        differentiators: brandGuide.identity?.industryKeywords || [],
        uvp: brandGuide.purpose,
      };

      const voiceRules: VoiceRules = {
        tone: brandGuide.voiceAndTone?.tone || [],
        formalityLevel: brandGuide.voiceAndTone?.formalityLevel ?? 50,
        friendlinessLevel: brandGuide.voiceAndTone?.friendlinessLevel ?? 50,
        confidenceLevel: brandGuide.voiceAndTone?.confidenceLevel ?? 50,
        voiceDescription: brandGuide.voiceAndTone?.voiceDescription,
        writingRules: brandGuide.voiceAndTone?.writingRules || [],
        avoidPhrases: brandGuide.voiceAndTone?.avoidPhrases || [],
        brandPhrases: brandGuide.contentRules?.brandPhrases || [],
        keyMessages: [],
      };

      const visualRules: VisualRules = {
        colors: brandGuide.visualIdentity?.colors || [],
        primaryFont: brandGuide.visualIdentity?.typography?.heading,
        secondaryFont: brandGuide.visualIdentity?.typography?.body,
        photographyMustInclude: brandGuide.visualIdentity?.photographyStyle?.mustInclude || [],
        photographyMustAvoid: brandGuide.visualIdentity?.photographyStyle?.mustAvoid || [],
        logoGuidelines: undefined,
        visualNotes: brandGuide.visualIdentity?.visualNotes,
      };

      const preferences: BrandPreferences = {
        strictnessLevel: "moderate",
        preferredPlatforms: brandGuide.contentRules?.preferredPlatforms || [],
        defaultCtaStyle: undefined,
        contentPillars: brandGuide.contentRules?.contentPillars || [],
        platformGuidelines: brandGuide.contentRules?.platformGuidelines || {},
        requiredDisclaimers: [],
        requiredHashtags: [],
      };

      // 3. Upsert state
      const { error } = await supabase.from("brand_brain_state").upsert(
        {
          brand_id: brandId,
          summary,
          voice_rules: voiceRules,
          visual_rules: visualRules,
          bfs_baseline: brandGuide.performanceInsights?.bfsBaseline?.score || 80,
          preferences,
          last_refreshed_at: new Date().toISOString(),
        },
        {
          onConflict: "brand_id",
        }
      );

      if (error) {
        throw new Error(`Failed to refresh state: ${error.message}`);
      }

      // 4. Log event
      await this.logEvent(brandId, "STATE_REFRESHED", "brand-brain-service", { source: "brand-guide" }, { version: brandGuide.version });

      console.log(`[BrandBrain] Refreshed state for brand ${brandId} from Brand Guide v${brandGuide.version}`);
    } catch (error) {
      console.error(`[BrandBrain] Error refreshing state for ${brandId}:`, error);
      throw error;
    }
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private async getBrandBrainState(brandId: string): Promise<BrandBrainState | null> {
    const { data, error } = await supabase
      .from("brand_brain_state")
      .select("*")
      .eq("brand_id", brandId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      brandId: data.brand_id,
      summary: data.summary as BrandSummary,
      voiceRules: data.voice_rules as VoiceRules,
      visualRules: data.visual_rules as VisualRules,
      bfsBaseline: data.bfs_baseline,
      preferences: data.preferences as BrandPreferences,
      lastRefreshedAt: data.last_refreshed_at,
      version: data.version,
    };
  }

  private async getExampleSnippets(brandId: string): Promise<ExampleSnippet[]> {
    const { data, error } = await supabase
      .from("brand_brain_examples")
      .select("*")
      .eq("brand_id", brandId)
      .in("example_type", ["POSITIVE", "NEGATIVE"])
      .order("created_at", { ascending: false })
      .limit(10);

    if (error || !data) {
      return [];
    }

    return data.map((ex) => ({
      type: ex.example_type as "POSITIVE" | "NEGATIVE",
      channel: ex.channel,
      text: (ex.content as { body?: string })?.body?.slice(0, 200) || "",
      reason: ex.notes || undefined,
    }));
  }

  private buildDosAndDonts(state: BrandBrainState): { do: string[]; dont: string[] } {
    const dos: string[] = [];
    const donts: string[] = [];

    // From voice rules
    if (state.voiceRules.brandPhrases.length > 0) {
      dos.push(`Use brand phrases: ${state.voiceRules.brandPhrases.slice(0, 3).join(", ")}`);
    }
    if (state.voiceRules.tone.length > 0) {
      dos.push(`Maintain ${state.voiceRules.tone.join(", ")} tone`);
    }
    if (state.voiceRules.writingRules.length > 0) {
      dos.push(...state.voiceRules.writingRules.slice(0, 3));
    }

    // Don'ts from avoid phrases
    if (state.voiceRules.avoidPhrases.length > 0) {
      donts.push(`Never use: ${state.voiceRules.avoidPhrases.slice(0, 5).join(", ")}`);
    }

    // From preferences
    if (state.preferences.requiredDisclaimers.length > 0) {
      dos.push("Include required disclaimers for regulated content");
    }

    return { do: dos, dont: donts };
  }

  private generateBrandDescription(guide: BrandGuide): string {
    const parts: string[] = [];

    if (guide.brandName) {
      parts.push(`${guide.brandName} is`);
    }

    if (guide.identity?.businessType) {
      parts.push(`a ${guide.identity.businessType}`);
    }

    if (guide.identity?.industry) {
      parts.push(`in the ${guide.identity.industry} industry`);
    }

    if (guide.identity?.targetAudience) {
      parts.push(`serving ${guide.identity.targetAudience}`);
    }

    if (guide.purpose) {
      parts.push(`. ${guide.purpose}`);
    }

    return parts.join(" ") || "Brand description not available";
  }

  // ==========================================================================
  // EVALUATION CHECKS
  // ==========================================================================

  private checkToneAlignment(
    content: ContentEvaluationInput["content"],
    voiceRules: VoiceRules
  ): EvaluationCheck {
    const combinedText = `${content.headline || ""} ${content.body} ${content.cta || ""}`.toLowerCase();
    const toneKeywords = voiceRules.tone.map((t) => t.toLowerCase());

    // Simple heuristic: check for tone indicators
    let matchCount = 0;
    for (const keyword of toneKeywords) {
      if (combinedText.includes(keyword)) {
        matchCount++;
      }
    }

    // Check formality level
    const hasContractions = /\b(don't|can't|won't|it's|you're|we're)\b/.test(combinedText);
    const isFormal = voiceRules.formalityLevel > 70;

    let status: "pass" | "warn" | "fail" = "pass";
    let details = "Content aligns with brand tone";

    if (isFormal && hasContractions) {
      status = "warn";
      details = "Formal brand voice detected but content uses contractions";
    } else if (toneKeywords.length > 0 && matchCount === 0) {
      status = "warn";
      details = `Content may not reflect brand tone keywords: ${voiceRules.tone.slice(0, 3).join(", ")}`;
    }

    return {
      name: "Tone Alignment",
      status,
      details,
      category: "tone",
      weight: 3, // 30%
    };
  }

  private checkCompliance(
    content: ContentEvaluationInput["content"],
    voiceRules: VoiceRules,
    preferences: BrandPreferences
  ): EvaluationCheck {
    const combinedText = `${content.headline || ""} ${content.body} ${content.cta || ""}`.toLowerCase();
    const violations: string[] = [];

    // Check for banned phrases
    for (const phrase of voiceRules.avoidPhrases) {
      if (combinedText.includes(phrase.toLowerCase())) {
        violations.push(`Contains avoided phrase: "${phrase}"`);
      }
    }

    // Check for required disclaimers
    for (const disclaimer of preferences.requiredDisclaimers) {
      if (!content.body.includes(disclaimer)) {
        violations.push(`Missing required disclaimer`);
      }
    }

    // Check for required hashtags
    const contentHashtags = content.hashtags || [];
    for (const hashtag of preferences.requiredHashtags) {
      if (!contentHashtags.includes(hashtag)) {
        violations.push(`Missing required hashtag: ${hashtag}`);
      }
    }

    let status: "pass" | "warn" | "fail" = "pass";
    let details = "Content passes compliance checks";

    if (violations.length > 0) {
      status = violations.some((v) => v.includes("avoided phrase")) ? "fail" : "warn";
      details = violations.join("; ");
    }

    return {
      name: "Compliance",
      status,
      details,
      category: "compliance",
      weight: 2, // 20%
    };
  }

  private checkCTA(content: ContentEvaluationInput["content"], voiceRules: VoiceRules): EvaluationCheck {
    const cta = content.cta || "";

    if (!cta || cta.trim().length === 0) {
      return {
        name: "CTA Quality",
        status: "warn",
        details: "No CTA provided",
        category: "cta",
        weight: 1.5, // 15%
      };
    }

    // Check for action verbs
    const actionVerbs = ["click", "visit", "learn", "discover", "explore", "get", "join", "start", "try", "shop", "book", "download", "subscribe", "follow", "share"];
    const ctaLower = cta.toLowerCase();
    const hasActionVerb = actionVerbs.some((verb) => ctaLower.includes(verb));

    let status: "pass" | "warn" | "fail" = hasActionVerb ? "pass" : "warn";
    let details = hasActionVerb ? "CTA includes clear action verb" : "CTA could be more action-oriented";

    // Check length
    const wordCount = cta.split(/\s+/).length;
    if (wordCount > 10) {
      status = "warn";
      details = "CTA is too long - keep it under 10 words";
    }

    return {
      name: "CTA Quality",
      status,
      details,
      category: "cta",
      weight: 1.5, // 15%
    };
  }

  private checkPlatformFit(content: ContentEvaluationInput["content"], channel: string): EvaluationCheck {
    const bodyLength = content.body.length;
    const hashtagCount = content.hashtags?.length || 0;
    const issues: string[] = [];

    switch (channel.toLowerCase()) {
      case "instagram":
        if (bodyLength > 2200) {
          issues.push("Caption exceeds Instagram limit (2200 chars)");
        }
        if (hashtagCount > 30) {
          issues.push("Too many hashtags (max 30 for Instagram)");
        }
        if (hashtagCount < 5 && hashtagCount > 0) {
          issues.push("Consider using 5-10 hashtags for better reach");
        }
        break;

      case "linkedin":
        if (bodyLength > 3000) {
          issues.push("Post exceeds LinkedIn limit (3000 chars)");
        }
        if (hashtagCount > 5) {
          issues.push("LinkedIn performs better with fewer hashtags (3-5)");
        }
        break;

      case "twitter":
      case "x":
        if (bodyLength > 280) {
          issues.push("Tweet exceeds character limit (280 chars)");
        }
        if (hashtagCount > 2) {
          issues.push("Twitter performs better with fewer hashtags (1-2)");
        }
        break;

      case "facebook":
        if (bodyLength > 63206) {
          issues.push("Post exceeds Facebook limit");
        }
        if (hashtagCount > 3) {
          issues.push("Facebook posts perform better with minimal hashtags");
        }
        break;

      case "email":
        if (!content.headline) {
          issues.push("Email should have a subject line (headline)");
        }
        break;
    }

    let status: "pass" | "warn" | "fail" = "pass";
    if (issues.some((i) => i.includes("exceeds"))) {
      status = "fail";
    } else if (issues.length > 0) {
      status = "warn";
    }

    return {
      name: "Platform Fit",
      status,
      details: issues.length > 0 ? issues.join("; ") : `Content is well-suited for ${channel}`,
      category: "platform",
      weight: 1.5, // 15%
    };
  }

  private checkClarity(content: ContentEvaluationInput["content"]): EvaluationCheck {
    const body = content.body;
    const sentences = body.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) / Math.max(sentences.length, 1);

    const issues: string[] = [];

    // Check sentence length
    if (avgSentenceLength > 25) {
      issues.push("Sentences are quite long - consider breaking them up");
    }

    // Check for passive voice (simple heuristic)
    const passivePatterns = /\b(is|are|was|were|been|being)\s+\w+ed\b/gi;
    const passiveMatches = body.match(passivePatterns) || [];
    if (passiveMatches.length > 2) {
      issues.push("Consider using more active voice");
    }

    // Check for filler words
    const fillerWords = ["very", "really", "actually", "basically", "literally"];
    const fillerCount = fillerWords.reduce((count, word) => {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      return count + (body.match(regex) || []).length;
    }, 0);
    if (fillerCount > 2) {
      issues.push("Consider removing filler words for stronger copy");
    }

    let status: "pass" | "warn" | "fail" = "pass";
    if (issues.length >= 2) {
      status = "warn";
    }

    return {
      name: "Clarity",
      status,
      details: issues.length > 0 ? issues.join("; ") : "Content is clear and readable",
      category: "clarity",
      weight: 1, // 10%
    };
  }

  private checkTerminology(
    content: ContentEvaluationInput["content"],
    voiceRules: VoiceRules
  ): EvaluationCheck {
    const combinedText = `${content.headline || ""} ${content.body} ${content.cta || ""}`.toLowerCase();
    const brandPhrases = voiceRules.brandPhrases.map((p) => p.toLowerCase());

    if (brandPhrases.length === 0) {
      return {
        name: "Brand Terminology",
        status: "pass",
        details: "No specific brand phrases defined",
        category: "tone",
        weight: 1, // 10%
      };
    }

    const matchedPhrases = brandPhrases.filter((phrase) => combinedText.includes(phrase));
    const matchRate = matchedPhrases.length / brandPhrases.length;

    let status: "pass" | "warn" | "fail" = "pass";
    let details = "Content uses brand terminology appropriately";

    if (matchRate === 0 && brandPhrases.length > 0) {
      status = "warn";
      details = `Consider incorporating brand phrases: ${brandPhrases.slice(0, 3).join(", ")}`;
    } else if (matchRate < 0.3) {
      status = "pass";
      details = `Using ${matchedPhrases.length} of ${brandPhrases.length} brand phrases`;
    }

    return {
      name: "Brand Terminology",
      status,
      details,
      category: "tone",
      weight: 1, // 10%
    };
  }

  private statusToScore(status: "pass" | "warn" | "fail"): number {
    switch (status) {
      case "pass":
        return 1.0;
      case "warn":
        return 0.6;
      case "fail":
        return 0.2;
    }
  }

  private generateRecommendations(
    checks: EvaluationCheck[],
    state: BrandBrainState,
    input: ContentEvaluationInput
  ): string[] {
    const recommendations: string[] = [];

    // Add recommendations based on failed/warned checks
    for (const check of checks) {
      if (check.status === "fail") {
        recommendations.push(`[Critical] ${check.details}`);
      } else if (check.status === "warn") {
        recommendations.push(`[Suggestion] ${check.details}`);
      }
    }

    // Add goal-specific recommendations
    switch (input.goal) {
      case "lead_gen":
      case "conversion":
        if (!input.content.cta) {
          recommendations.push("[Important] Add a clear call-to-action for conversion goals");
        }
        break;

      case "engagement":
        if (!input.content.body.includes("?")) {
          recommendations.push("[Tip] Consider adding a question to boost engagement");
        }
        break;

      case "awareness":
        if (input.content.hashtags && input.content.hashtags.length < 5 && input.channel === "instagram") {
          recommendations.push("[Tip] Use more hashtags to increase discoverability");
        }
        break;
    }

    return recommendations;
  }

  // ==========================================================================
  // EVENT LOGGING
  // ==========================================================================

  private async logEvent(
    brandId: string,
    eventType: BrandBrainEvent["eventType"],
    source: string,
    inputSnapshot: Record<string, unknown>,
    resultSnapshot: Record<string, unknown>
  ): Promise<void> {
    try {
      await supabase.from("brand_brain_events").insert({
        id: uuidv4(),
        brand_id: brandId,
        event_type: eventType,
        source,
        input_snapshot: inputSnapshot,
        result_snapshot: resultSnapshot,
        created_at: new Date().toISOString(),
        created_by: "system",
      });
    } catch (error) {
      console.warn("[BrandBrain] Failed to log event:", error);
      // Don't throw - event logging should not break the main flow
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const brandBrain = BrandBrainService.getInstance();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Get Brand Context Pack for use by other agents
 */
export async function getBrandContextPack(brandId: string): Promise<BrandContextPack | null> {
  return brandBrain.getBrandContextPack(brandId);
}

/**
 * Evaluate content for brand alignment
 */
export async function evaluateContent(
  brandId: string,
  input: ContentEvaluationInput
): Promise<ContentEvaluationResult> {
  return brandBrain.evaluateContent(brandId, input);
}

/**
 * Register content outcome for learning
 */
export async function registerOutcome(brandId: string, input: OutcomeRegistrationInput): Promise<void> {
  return brandBrain.registerOutcome(brandId, input);
}

/**
 * Refresh Brand Brain state from Brand Guide
 */
export async function refreshBrandBrainState(brandId: string): Promise<void> {
  return brandBrain.refreshStateFromBrandGuide(brandId);
}

