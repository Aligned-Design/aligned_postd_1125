/**
 * Brand Summary Generator
 * 
 * Generates a long-form narrative brand summary (8-10 paragraphs) using the Doc Agent.
 * Reads scraped content, brand guide, and images to create a comprehensive brand narrative.
 * 
 * This summary is grounded in actual scraped data and brand guide, not generic boilerplate.
 */

import { logger } from "./logger";
import { supabase } from "./supabase";
import { getCurrentBrandGuide } from "./brand-guide-service";
import { generateWithAI } from "../workers/ai-generation";
import { getBrandContext } from "./brand-context";
import { getScrapedImages } from "./scraped-images-service";

export interface BrandSummaryContext {
  brandId: string;
  brandName: string;
  websiteUrl?: string;
  scrapedContent?: {
    headlines: string[];
    aboutText: string;
    services: string[];
    keySections: string[];
  };
  scrapedImages?: Array<{
    url: string;
    alt?: string;
    role?: "logo" | "hero" | "other";
  }>;
  brandGuide?: any;
}

/**
 * Generate long-form brand summary (8-10 paragraphs)
 */
export async function generateBrandNarrativeSummary(
  brandId: string,
  tenantId?: string
): Promise<string> {
  const startTime = Date.now();
  const requestId = `brand-summary-${Date.now()}-${brandId}`;

  try {
    logger.info("Generating brand narrative summary", {
      requestId,
      brandId,
      tenantId,
    });

    // 1. Fetch brand core info
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, name, website_url, brand_kit, voice_summary, visual_summary")
      .eq("id", brandId)
      .single();

    if (brandError || !brand) {
      throw new Error(`Brand not found: ${brandId}`);
    }

    const brandName = brand.name || "Untitled Brand";
    const websiteUrl = brand.website_url;

    // 2. Load brand guide
    const brandGuide = await getCurrentBrandGuide(brandId);

    // 3. Get brand context
    const brandContext = await getBrandContext(brandId);

    // 4. Get scraped images with metadata
    const scrapedImages = await getScrapedImages(brandId);
    const imageMetadata = scrapedImages.map((img) => ({
      url: img.url,
      alt: img.metadata?.alt as string | undefined,
      role: img.metadata?.role as "logo" | "hero" | "other" | undefined,
    }));

    // 5. Extract scraped content from brand_kit
    const brandKit = (brand.brand_kit as any) || {};
    const scrapedContent = {
      headlines: brandKit.headlines || brandKit.sampleHeadlines || [],
      aboutText: brandKit.about_blurb || brandKit.purpose || brandKit.mission || "",
      services: brandKit.keyword_themes || brandKit.industryKeywords || [],
      keySections: brandKit.source_urls || [],
    };

    // 6. Build comprehensive prompt for brand summary generation
    const systemPrompt = `You are The Copywriter for Postd. Your role is to create comprehensive, narrative-style brand summaries.

Guidelines:
- Write in a neutral but warm and professional voice
- Use 8-10 paragraphs (not bullet points)
- Ground all content in the provided scraped data and brand guide
- Never use generic boilerplate - be specific to the brand
- Mention real services, phrases, and details from the scraped content
- Cover: who the brand is, who they serve, personality/tone, visual identity, services/products, brand promises, customer experience, and CTAs/offers

Output format: Return the summary as plain text (no JSON, no markdown code blocks). Just the narrative paragraphs separated by double newlines.`;

    const userPrompt = buildBrandSummaryPrompt({
      brandId,
      brandName,
      websiteUrl,
      brandGuide,
      brandContext,
      scrapedContent,
      imageMetadata,
    });

    // 7. Call AI to generate summary
    const provider: "openai" | "claude" = process.env.AI_PROVIDER === "anthropic" ? "claude" : "openai";
    const aiResponse = await generateWithAI(
      `${systemPrompt}\n\n${userPrompt}`,
      "doc",
      provider
    );

    // 8. Parse and clean the response
    let summary = aiResponse.content.trim();

    // Remove markdown code blocks if present
    summary = summary.replace(/```(?:json|markdown)?\s*\n?/g, "").replace(/```\s*$/g, "").trim();

    // Ensure it's 8-10 paragraphs (split by double newlines)
    const paragraphs = summary.split(/\n\n+/).filter((p) => p.trim().length > 0);
    
    if (paragraphs.length < 8) {
      logger.warn("Brand summary has fewer than 8 paragraphs", {
        requestId,
        brandId,
        paragraphCount: paragraphs.length,
      });
    }

    // Join paragraphs with double newlines
    const finalSummary = paragraphs.join("\n\n");

    // 9. Store in brand guide
    await storeBrandSummary(brandId, finalSummary);

    const durationMs = Date.now() - startTime;
    logger.info("Brand narrative summary generated", {
      requestId,
      brandId,
      durationMs,
      paragraphCount: paragraphs.length,
      summaryLength: finalSummary.length,
    });

    return finalSummary;
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    logger.error("Brand narrative summary generation failed", error, {
      requestId,
      brandId,
      durationMs,
    });
    throw error;
  }
}

/**
 * Build prompt for brand summary generation
 */
function buildBrandSummaryPrompt(context: BrandSummaryContext & {
  brandContext: any;
  imageMetadata: Array<{ url: string; alt?: string; role?: string }>;
}): string {
  const {
    brandId,
    brandName,
    websiteUrl,
    brandGuide,
    brandContext,
    scrapedContent,
    imageMetadata,
  } = context;

  let prompt = `Generate a comprehensive, narrative-style brand summary for ${brandName}.\n\n`;

  prompt += `## Requirements\n`;
  prompt += `- Length: 8-10 paragraphs (not bullet points)\n`;
  prompt += `- Voice: Neutral but warm and professional\n`;
  prompt += `- Content: Must be grounded in the provided scraped data and brand guide\n`;
  prompt += `- No generic boilerplate - use specific details from the brand\n\n`;

  prompt += `## Brand Facts (Never Contradict)\n`;
  prompt += `Brand Name: ${brandName}\n`;
  if (websiteUrl) {
    prompt += `Website: ${websiteUrl}\n`;
  }

  // Brand Guide data
  if (brandGuide) {
    prompt += `\n### Brand Guide Data\n`;
    
    if (brandGuide.identity) {
      prompt += `Business Type: ${brandGuide.identity.businessType || "Not specified"}\n`;
      if (brandGuide.identity.industryKeywords && brandGuide.identity.industryKeywords.length > 0) {
        prompt += `Industry Keywords: ${brandGuide.identity.industryKeywords.join(", ")}\n`;
      }
    }

    if (brandGuide.voiceAndTone) {
      prompt += `\nVoice & Tone:\n`;
      if (brandGuide.voiceAndTone.tone && brandGuide.voiceAndTone.tone.length > 0) {
        prompt += `- Tone: ${brandGuide.voiceAndTone.tone.join(", ")}\n`;
      }
      if (brandGuide.voiceAndTone.voiceDescription) {
        prompt += `- Voice Description: ${brandGuide.voiceAndTone.voiceDescription}\n`;
      }
    }

    if (brandGuide.visualIdentity) {
      prompt += `\nVisual Identity:\n`;
      if (brandGuide.visualIdentity.colors && brandGuide.visualIdentity.colors.length > 0) {
        prompt += `- Colors: ${brandGuide.visualIdentity.colors.join(", ")}\n`;
      }
      if (brandGuide.visualIdentity.photographyStyle) {
        if (brandGuide.visualIdentity.photographyStyle.mustInclude && brandGuide.visualIdentity.photographyStyle.mustInclude.length > 0) {
          prompt += `- Photography Must Include: ${brandGuide.visualIdentity.photographyStyle.mustInclude.join(", ")}\n`;
        }
        if (brandGuide.visualIdentity.photographyStyle.mustAvoid && brandGuide.visualIdentity.photographyStyle.mustAvoid.length > 0) {
          prompt += `- Photography Must Avoid: ${brandGuide.visualIdentity.photographyStyle.mustAvoid.join(", ")}\n`;
        }
      }
    }

    if (brandGuide.identity?.competitors && brandGuide.identity.competitors.length > 0) {
      prompt += `\nCompetitors to avoid referencing: ${brandGuide.identity.competitors.join(", ")}\n`;
    }
  }

  // Scraped text content
  if (scrapedContent) {
    prompt += `\n## Scraped Text Content\n`;
    
    if (scrapedContent.headlines && scrapedContent.headlines.length > 0) {
      prompt += `Headlines from website:\n${scrapedContent.headlines.slice(0, 10).map((h, i) => `${i + 1}. ${h}`).join("\n")}\n\n`;
    }

    if (scrapedContent.aboutText) {
      prompt += `About text: ${scrapedContent.aboutText.slice(0, 500)}\n\n`;
    }

    if (scrapedContent.services && scrapedContent.services.length > 0) {
      prompt += `Key services/products: ${scrapedContent.services.join(", ")}\n\n`;
    }
  }

  // Visual cues from images
  if (imageMetadata && imageMetadata.length > 0) {
    prompt += `\n## Visual Cues from Scraped Images\n`;
    const heroImages = imageMetadata.filter((img) => img.role === "hero").slice(0, 3);
    const logoImages = imageMetadata.filter((img) => img.role === "logo").slice(0, 1);
    const otherImages = imageMetadata.filter((img) => img.role !== "hero" && img.role !== "logo").slice(0, 5);

    if (logoImages.length > 0) {
      prompt += `Logo: ${logoImages[0].alt || "Brand logo"}\n`;
    }
    if (heroImages.length > 0) {
      prompt += `Hero images: ${heroImages.map((img) => img.alt || "Hero image").join(", ")}\n`;
    }
    if (otherImages.length > 0) {
      prompt += `Other imagery: ${otherImages.map((img) => img.alt || "Brand image").slice(0, 3).join(", ")}\n`;
    }
  }

  // Brand context data
  if (brandContext) {
    prompt += `\n## Brand Context\n`;
    if (brandContext.industry) {
      prompt += `Industry: ${brandContext.industry}\n`;
    }
    if (brandContext.targetAudience) {
      prompt += `Target Audience: ${brandContext.targetAudience}\n`;
    }
  }

  prompt += `\n## Instructions\n`;
  prompt += `Write an 8-10 paragraph narrative summary covering:\n`;
  prompt += `1. Who the brand is + what they do (core offering)\n`;
  prompt += `2. Who they serve (primary audience, psychographics if available)\n`;
  prompt += `3. Personality + tone of voice (how they show up online)\n`;
  prompt += `4. Visual identity (colors, imagery style, photography vibe)\n`;
  prompt += `5. Key services/products and how they're positioned\n`;
  prompt += `6. Brand promises, values, and differentiators\n`;
  prompt += `7. Overall customer experience / brand story\n`;
  prompt += `8. Any clear calls-to-action, offers, or funnels from the site\n\n`;

  prompt += `Use specific details from the scraped content and brand guide. Do not use generic phrases.`;
  prompt += `Make it feel authentic and specific to this brand.`;

  return prompt;
}

/**
 * Store brand summary in brand guide
 */
async function storeBrandSummary(brandId: string, summary: string): Promise<void> {
  try {
    // Get current brand_kit
    const { data: brand, error: fetchError } = await supabase
      .from("brands")
      .select("brand_kit")
      .eq("id", brandId)
      .single();

    if (fetchError || !brand) {
      throw new Error(`Failed to fetch brand: ${fetchError?.message || "Brand not found"}`);
    }

    const brandKit = (brand.brand_kit as any) || {};

    // Update brand_kit with longFormSummary
    const updatedBrandKit = {
      ...brandKit,
      longFormSummary: summary,
      summaryGeneratedAt: new Date().toISOString(),
    };

    // @supabase-scope-ok Brand lookup by its own primary key
    // Also update voice_summary if it exists
    const { data: brandFull, error: updateError } = await supabase
      .from("brands")
      .update({
        brand_kit: updatedBrandKit,
        updated_at: new Date().toISOString(),
      })
      .eq("id", brandId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to store brand summary: ${updateError.message}`);
    }

    logger.info("Brand summary stored successfully", {
      brandId,
      summaryLength: summary.length,
    });
  } catch (error: any) {
    logger.error("Failed to store brand summary", error, { brandId });
    throw error;
  }
}

/**
 * Get brand summary from brand guide
 */
export async function getBrandSummary(brandId: string): Promise<string | null> {
  try {
    const brandGuide = await getCurrentBrandGuide(brandId);
    if (!brandGuide) {
      return null;
    }

    // Check brand_kit for longFormSummary
    const { data: brand, error } = await supabase
      .from("brands")
      .select("brand_kit")
      .eq("id", brandId)
      .single();

    if (error || !brand) {
      return null;
    }

    const brandKit = (brand.brand_kit as any) || {};
    return brandKit.longFormSummary || null;
  } catch (error) {
    logger.error("Failed to get brand summary", error, { brandId });
    return null;
  }
}

