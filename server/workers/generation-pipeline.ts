/**
 * AI Agent Generation Pipeline Orchestrator
 *
 * Coordinates the three-step generation process:
 * 1. Advisor Agent analyzes and provides recommendations
 * 2. Doc Agent generates content using advisor context
 * 3. Design Agent creates visuals using doc output
 */

import { supabase } from "../lib/supabase";
import {
  AdvisorOutput,
  DocInput,
  DocOutput,
  DesignInput,
  DesignOutput,
  BrandSafetyConfig,
} from "../../client/types/agent-config";
import { generateWithAI, loadPromptTemplate } from "./ai-generation";
import { calculateBFS } from "../agents/brand-fidelity-scorer";
import { lintContent, autoFixContent } from "../agents/content-linter";

// Use shared supabase client from server/lib/supabase.ts

// Brand Kit interface for database records
interface BrandKitRecord {
  brandName?: string;
  toneKeywords?: string[];
  brandPersonality?: string[];
  writingStyle?: string;
  commonPhrases?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
}

export interface PipelineRequest {
  brand_id: string;
  content_type: "post" | "story" | "carousel" | "reel";
  platform: "instagram" | "facebook" | "linkedin" | "twitter";
  topic?: string;
  tone?: string;
  include_advisor?: boolean;
}

export interface PipelineResult {
  advisor_output?: AdvisorOutput;
  doc_output: DocOutput;
  design_output: DesignOutput;
  pipeline_logs: Array<{
    step: string;
    duration_ms: number;
    success: boolean;
    error?: string;
  }>;
  total_duration_ms: number;
}

/**
 * Orchestrate the full AI pipeline: Advisor → Doc → Design
 */
export async function runGenerationPipeline(
  request: PipelineRequest,
): Promise<PipelineResult> {
  const startTime = Date.now();
  const logs: Array<{
    step: string;
    duration_ms: number;
    success: boolean;
    error?: string;
  }> = [];

  try {
    // Load brand data
    const { data: brandKit, error: brandError } = await supabase
      .from("brand_kits")
      .select("*")
      .eq("brand_id", request.brand_id)
      .single();

    if (brandError) {
      throw new Error(`Failed to load brand kit: ${brandError.message}`);
    }

    const { data: safetyConfig, error: __safetyError } = await supabase
      .from("brand_safety_configs")
      .select("*")
      .eq("brand_id", request.brand_id)
      .single();

    const brandSafety: BrandSafetyConfig = safetyConfig || {
      safety_mode: "safe",
      banned_phrases: [],
      competitor_names: [],
      claims: [],
      required_disclaimers: [],
      required_hashtags: [],
      brand_links: [],
      disallowed_topics: [],
      allow_topics: [],
      compliance_pack: "none",
    };

    // Step 1: Advisor Agent (optional, use cache if available)
    let advisorOutput: AdvisorOutput | undefined;

    if (request.include_advisor !== false) {
      const advisorStart = Date.now();
      try {
        advisorOutput = await runAdvisorStep(request.brand_id);
        logs.push({
          step: "advisor",
          duration_ms: Date.now() - advisorStart,
          success: true,
        });
      } catch (error) {
        console.warn(
          "Advisor step failed, continuing without advisor context:",
          error,
        );
        logs.push({
          step: "advisor",
          duration_ms: Date.now() - advisorStart,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Type the brandKit record properly
    const typedBrandKit = brandKit as BrandKitRecord;

    // Step 2: Doc Agent
    const docStart = Date.now();
    const docInput: DocInput = {
      topic:
        request.topic || advisorOutput?.topics[0]?.title || "Share an update",
      tone: request.tone || typedBrandKit.toneKeywords?.[0] || "professional",
      platform: request.platform,
      format:
        request.content_type === "story"
          ? "story"
          : request.content_type === "reel"
            ? "reel"
            : request.content_type === "carousel"
              ? "carousel"
              : "post",
      max_length: getPlatformMaxLength(request.platform, request.content_type),
      include_cta: true,
      cta_type: "link",
      advisor_context: advisorOutput,
    };

    const docOutput = await runDocStep(docInput, typedBrandKit, brandSafety);
    logs.push({
      step: "doc",
      duration_ms: Date.now() - docStart,
      success: true,
    });

    // Step 3: Design Agent
    const designStart = Date.now();
    const designInput: DesignInput = {
      aspect_ratio: getAspectRatio(request.platform, request.content_type),
      theme: docOutput.post_theme,
      brand_colors: [
        typedBrandKit.primaryColor,
        typedBrandKit.secondaryColor,
        typedBrandKit.accentColor,
      ].filter(Boolean),
      tone: docOutput.tone_used,
      headline: docOutput.headline,
      doc_context: docOutput,
    };

    const designOutput = await runDesignStep(designInput, typedBrandKit);
    logs.push({
      step: "design",
      duration_ms: Date.now() - designStart,
      success: true,
    });

    return {
      advisor_output: advisorOutput,
      doc_output: docOutput,
      design_output: designOutput,
      pipeline_logs: logs,
      total_duration_ms: Date.now() - startTime,
    };
  } catch (error) {
    console.error("Pipeline failed:", error);
    throw error;
  }
}

/**
 * Run Advisor step with caching
 */
async function runAdvisorStep(brand_id: string): Promise<AdvisorOutput> {
  // Check cache first
  const { data: cached } = await supabase
    .from("advisor_cache")
    .select("*")
    .eq("brand_id", brand_id)
    .gte("valid_until", new Date().toISOString())
    .single();

  if (cached) {
    return cached.output;
  }

  // Generate new insights
  const template = await loadPromptTemplate("advisor", "v1.0", "en");

  // Load recent performance data
  const { data: posts } = await supabase
    .from("scheduled_content")
    .select("*")
    .eq("brand_id", brand_id)
    .gte(
      "scheduled_for",
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    )
    .order("scheduled_for", { ascending: false })
    .limit(20);

  const prompt = template
    .replace(/\{\{brand_id\}\}/g, brand_id)
    .replace(/\{\{recent_posts\}\}/g, JSON.stringify(posts || []));

  const aiResponse = await generateWithAI(prompt, "advisor");

  let output: AdvisorOutput;
  try {
    output = JSON.parse(aiResponse);
  } catch {
    // Fallback if parsing fails
    output = {
      topics: [
        {
          title: "Continue Current Strategy",
          rationale: "Maintain consistent approach",
        },
      ],
      best_times: [{ day: "Thursday", slot: "18:00", confidence: 0.8 }],
      format_mix: { reel: 0.4, carousel: 0.4, image: 0.2 },
      hashtags: ["#YourBrand"],
      keywords: ["engagement", "growth"],
      cached_at: new Date().toISOString(),
      valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  // Cache the results
  const validUntil = new Date();
  validUntil.setHours(validUntil.getHours() + 24);

  await supabase.from("advisor_cache").upsert({
    brand_id,
    output,
    cached_at: new Date().toISOString(),
    valid_until: validUntil.toISOString(),
  });

  return output;
}

/**
 * Run Doc step with BFS and linting
 */
async function runDocStep(
  input: DocInput,
  brandKit: BrandKitRecord,
  safetyConfig: BrandSafetyConfig,
): Promise<DocOutput> {
  const MAX_ATTEMPTS = 3;
  let attempts = 0;

  while (attempts < MAX_ATTEMPTS) {
    attempts++;

    // Generate content
    const template = await loadPromptTemplate("doc", "v1.0", "en");
    const prompt = template
      .replace(/\{\{brand_name\}\}/g, brandKit.brandName || "Your Brand")
      .replace(
        /\{\{tone_keywords\}\}/g,
        (brandKit.toneKeywords || []).join(", "),
      )
      .replace(
        /\{\{writing_style\}\}/g,
        brandKit.writingStyle || "professional",
      )
      .replace(/\{\{topic\}\}/g, input.topic)
      .replace(/\{\{platform\}\}/g, input.platform)
      .replace(/\{\{format\}\}/g, input.format)
      .replace(/\{\{max_length\}\}/g, input.max_length?.toString() || "2200");

    const aiResponse = await generateWithAI(prompt, "doc");

    let parsedOutput;
    try {
      parsedOutput = JSON.parse(aiResponse);
    } catch {
      parsedOutput = {
        headline: aiResponse.split("\n")[0] || "",
        body: aiResponse,
        cta: "Learn more",
        hashtags: ["#YourBrand"],
        post_theme: input.format,
        tone_used: "professional",
        aspect_ratio: getAspectRatio(input.platform, input.format),
        char_count: aiResponse.length,
      };
    }

    // Calculate BFS
    const bfs = await calculateBFS(
      {
        body: parsedOutput.body,
        headline: parsedOutput.headline,
        cta: parsedOutput.cta,
        hashtags: parsedOutput.hashtags,
        platform: input.platform,
      },
      {
        tone_keywords: brandKit.toneKeywords || [],
        brandPersonality: brandKit.brandPersonality || [],
        writingStyle: brandKit.writingStyle || "professional",
        commonPhrases: brandKit.commonPhrases || "",
        required_disclaimers: safetyConfig.required_disclaimers || [],
        required_hashtags: safetyConfig.required_hashtags || [],
        banned_phrases: safetyConfig.banned_phrases || [],
      },
    );

    // Run linter
    const linterResult = await lintContent(
      {
        body: parsedOutput.body,
        headline: parsedOutput.headline,
        cta: parsedOutput.cta,
        hashtags: parsedOutput.hashtags,
        platform: input.platform,
      },
      safetyConfig,
    );

    // Auto-fix if possible
    if (!linterResult.passed && !linterResult.blocked) {
      const { content: fixedContent, fixes } = autoFixContent(
        {
          body: parsedOutput.body,
          headline: parsedOutput.headline,
          cta: parsedOutput.cta,
          hashtags: parsedOutput.hashtags,
          platform: input.platform,
        },
        linterResult,
        safetyConfig,
      );

      parsedOutput.body = fixedContent.body;
      parsedOutput.headline = fixedContent.headline || parsedOutput.headline;
      parsedOutput.cta = fixedContent.cta || parsedOutput.cta;
      parsedOutput.hashtags = fixedContent.hashtags || parsedOutput.hashtags;
      linterResult.fixes_applied = fixes;
    }

    // Check if acceptable
    if (linterResult.blocked) {
      throw new Error("Content blocked by safety filters");
    }

    if (
      bfs.passed &&
      (linterResult.passed || linterResult.fixes_applied.length > 0)
    ) {
      return {
        ...parsedOutput,
        char_count: parsedOutput.body.length,
        bfs,
        linter: linterResult,
      };
    }

    if (attempts >= MAX_ATTEMPTS) {
      throw new Error(
        "Failed to generate acceptable content after multiple attempts",
      );
    }
  }

  throw new Error("Unexpected end of doc generation");
}

/**
 * Run Design step
 */
async function runDesignStep(
  input: DesignInput,
  brandKit: BrandKitRecord,
): Promise<DesignOutput> {
  const template = await loadPromptTemplate("design", "v1.0", "en");

  const prompt = template
    .replace(/\{\{brand_colors\}\}/g, input.brand_colors.join(", "))
    .replace(/\{\{theme\}\}/g, input.theme)
    .replace(/\{\{aspect_ratio\}\}/g, input.aspect_ratio)
    .replace(/\{\{headline\}\}/g, input.headline || "");

  const aiResponse = await generateWithAI(prompt, "design");

  let parsedOutput;
  try {
    parsedOutput = JSON.parse(aiResponse);
  } catch {
    parsedOutput = {
      cover_title: input.headline || "Your Content",
      template_ref: `${input.theme}-template`,
      alt_text: `${input.theme} content template`,
      visual_elements: ["Text overlay", "Brand colors", "Logo placement"],
      color_palette_used: input.brand_colors,
      font_suggestions: [brandKit.fontFamily || "Inter"],
    };
  }

  return {
    cover_title: parsedOutput.cover_title || input.headline || "",
    template_ref: parsedOutput.template_ref || `${input.theme}-template`,
    alt_text: parsedOutput.alt_text || "",
    thumbnail_ref: parsedOutput.thumbnail_ref,
    visual_elements: parsedOutput.visual_elements || [],
    color_palette_used: parsedOutput.color_palette_used || [],
    font_suggestions: parsedOutput.font_suggestions || [],
  };
}

/**
 * Get platform-specific max content length
 */
function getPlatformMaxLength(platform: string, contentType: string): number {
  const limits = {
    instagram: { post: 2200, story: 2200, carousel: 2200, reel: 2200 },
    facebook: { post: 63206, story: 2200, carousel: 2200, reel: 2200 },
    linkedin: { post: 3000, story: 2200, carousel: 3000, reel: 2200 },
    twitter: { post: 280, story: 280, carousel: 280, reel: 280 },
  };

  return (
    limits[platform as keyof typeof limits]?.[
      contentType as keyof typeof limits.instagram
    ] || 2200
  );
}

/**
 * Get platform and content type specific aspect ratio
 */
function getAspectRatio(platform: string, contentType: string): string {
  if (contentType === "story") return "1080x1920";
  if (contentType === "reel") return "1080x1920";
  if (platform === "linkedin") return "1200x627";
  if (platform === "twitter") return "1200x675";
  return "1080x1080"; // Default square for Instagram/Facebook posts
}
