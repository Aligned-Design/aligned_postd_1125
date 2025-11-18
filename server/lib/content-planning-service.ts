/**
 * Content Planning Service
 * 
 * Uses AI agents to:
 * 1. Copywriter (Doc Agent) - Complete brand guide based on crawler data
 * 2. Advisor Agent - Recommend plan of action
 * 3. Creative/Design Agent - Plan content (5 social posts, blog, email)
 * 
 * Generates a 7-day content plan and stores content in content_items table.
 */

import { logger } from "./logger";
import { supabase } from "./supabase";
import { getCurrentBrandGuide } from "./brand-guide-service";
import { getBrandProfile } from "./brand-profile";
import { generateWithAI } from "../workers/ai-generation";
import { getScrapedImages } from "./scraped-images-service";
import { randomUUID } from "crypto";

export interface ContentPlanItem {
  id: string;
  title: string;
  contentType: "post" | "blog" | "email" | "gbp";
  platform: string; // "instagram" | "facebook" | "linkedin" | "twitter" | "blog" | "email" | "google_business"
  content: string;
  scheduledDate: string; // ISO date string
  scheduledTime: string; // HH:mm format
  imageUrl?: string;
  status: "draft" | "scheduled";
}

export interface ContentPlan {
  brandId: string;
  items: ContentPlanItem[];
  advisorRecommendations: string[];
  generatedAt: string;
}

/**
 * Generate complete content plan using all AI agents
 */
export async function generateContentPlan(
  brandId: string,
  tenantId?: string
): Promise<ContentPlan> {
  const startTime = Date.now();
  const requestId = `content-plan-${Date.now()}-${brandId}`;

  try {
    logger.info("Generating content plan", {
      requestId,
      brandId,
      tenantId,
    });

    // 1. Load brand context
    const brandGuide = await getCurrentBrandGuide(brandId);
    const brandProfile = await getBrandProfile(brandId);
    const scrapedImages = await getScrapedImages(brandId);

    // Get brand info (including industry for better context)
    const { data: brand } = await supabase
      .from("brands")
      .select("id, name, website_url, industry, description, brand_kit")
      .eq("id", brandId)
      .single();

    if (!brand) {
      throw new Error(`Brand not found: ${brandId}`);
    }

    const brandKit = (brand.brand_kit as any) || {};
    
    // Ensure industry is in brandKit for agent context
    if (brand.industry && !brandKit.industry) {
      brandKit.industry = brand.industry;
    }
    if (brand.description && !brandKit.description) {
      brandKit.description = brand.description;
    }

    // 2. Step 1: Copywriter completes brand guide
    const completedBrandGuide = await completeBrandGuideWithDocAgent(
      brandId,
      brandGuide,
      brandProfile,
      brandKit,
      scrapedImages
    );

    // 3. Step 2: Advisor recommends plan of action
    const advisorRecommendations = await getAdvisorRecommendations(
      brandId,
      brandGuide,
      brandProfile,
      brandKit
    );

    // 4. Step 3: Creative plans content (5 social posts, blog, email)
    const contentItems = await planContentWithCreativeAgent(
      brandId,
      brandGuide,
      brandProfile,
      brandKit,
      scrapedImages,
      advisorRecommendations
    );

    // 5. Verify content quality before storing
    if (contentItems.length === 0) {
      throw new Error("No content items generated. Content generation may have failed.");
    }

    // Verify all items have real content (not placeholders)
    const invalidItems = contentItems.filter(item => 
      !item.content || 
      item.content.length < 50 ||
      item.content.toLowerCase().includes("placeholder") ||
      item.content.toLowerCase().includes("edit this")
    );

    if (invalidItems.length > 0) {
      logger.warn("Some content items have placeholder content", {
        brandId,
        invalidCount: invalidItems.length,
        totalCount: contentItems.length,
      });
      // Filter out invalid items
      contentItems = contentItems.filter(item => 
        item.content && 
        item.content.length >= 50 &&
        !item.content.toLowerCase().includes("placeholder") &&
        !item.content.toLowerCase().includes("edit this")
      );
    }

    if (contentItems.length === 0) {
      throw new Error("All generated content items were invalid (placeholders). Content generation failed.");
    }

    // 6. Store content items in database
    const storedItems = await storeContentItems(brandId, contentItems, tenantId);

    const durationMs = Date.now() - startTime;
    logger.info("Content plan generated and stored", {
      requestId,
      brandId,
      durationMs,
      itemsCount: storedItems.length,
      storedCount: storedItems.length,
    });

    return {
      brandId,
      items: storedItems,
      advisorRecommendations,
      generatedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    logger.error("Content plan generation failed", error, {
      requestId,
      brandId,
      durationMs,
    });
    throw error;
  }
}

/**
 * Step 1: Copywriter completes brand guide
 */
async function completeBrandGuideWithDocAgent(
  brandId: string,
  brandGuide: any,
  brandProfile: any,
  brandKit: any,
  scrapedImages: any[]
): Promise<any> {
  try {
    const systemPrompt = `You are The Copywriter for Postd. Your role is to complete and enhance the Brand Guide based on scraped website data.

Guidelines:
- Fill in missing brand guide fields based on scraped content
- Enhance existing fields with more specific details
- Use scraped headlines, about text, and services to inform brand identity
- Maintain consistency with existing brand guide data
- Output as JSON with completed brand guide fields`;

    const userPrompt = buildBrandGuideCompletionPrompt(
      brandGuide,
      brandProfile,
      brandKit,
      scrapedImages
    );

    const provider: "openai" | "claude" = process.env.AI_PROVIDER === "anthropic" ? "claude" : "openai";
    const aiResponse = await generateWithAI(
      `${systemPrompt}\n\n${userPrompt}`,
      "doc",
      provider
    );

    // Parse and merge with existing brand guide
    let completedFields: any = {};
    try {
      const cleaned = aiResponse.content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      completedFields = JSON.parse(cleaned);
    } catch (parseError) {
      logger.warn("Failed to parse brand guide completion", { brandId, error: parseError });
      return brandGuide; // Return original if parsing fails
    }

    // Update brand_kit with completed fields
    const updatedBrandKit = {
      ...brandKit,
      ...completedFields,
      brandGuideCompletedAt: new Date().toISOString(),
    };

    await supabase
      .from("brands")
      .update({
        brand_kit: updatedBrandKit,
        updated_at: new Date().toISOString(),
      })
      .eq("id", brandId);

    return { ...brandGuide, ...completedFields };
  } catch (error: any) {
    logger.error("Brand guide completion failed", error, { brandId });
    return brandGuide; // Return original on error
  }
}

/**
 * Step 2: Advisor recommends plan of action
 */
async function getAdvisorRecommendations(
  brandId: string,
  brandGuide: any,
  brandProfile: any,
  brandKit: any
): Promise<string[]> {
  try {
    const systemPrompt = `You are The Advisor for Postd. Your role is to provide actionable content strategy recommendations.

Guidelines:
- Provide 5-7 specific, actionable recommendations
- Focus on content types, posting frequency, platform strategy
- Base recommendations on brand identity, audience, and goals
- Output as JSON array of recommendation strings`;

    const userPrompt = buildAdvisorRecommendationsPrompt(
      brandGuide,
      brandProfile,
      brandKit
    );

    const provider: "openai" | "claude" = process.env.AI_PROVIDER === "anthropic" ? "claude" : "openai";
    const aiResponse = await generateWithAI(
      `${systemPrompt}\n\n${userPrompt}`,
      "advisor",
      provider
    );

    // Parse recommendations
    let recommendations: string[] = [];
    try {
      const cleaned = aiResponse.content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      recommendations = Array.isArray(parsed) ? parsed : parsed.recommendations || [];
    } catch (parseError) {
      logger.warn("Failed to parse advisor recommendations", { brandId, error: parseError });
      // Fallback recommendations
      recommendations = [
        "Post 3-5 times per week on primary platforms",
        "Focus on educational and value-driven content",
        "Engage with audience comments within 24 hours",
        "Use brand colors and imagery consistently",
        "Test different content formats to find what resonates",
      ];
    }

    return recommendations;
  } catch (error: any) {
    logger.error("Advisor recommendations failed", error, { brandId });
    return []; // Return empty array on error
  }
}

/**
 * Step 3: Creative plans content (5 social posts, blog, email)
 */
async function planContentWithCreativeAgent(
  brandId: string,
  brandGuide: any,
  brandProfile: any,
  brandKit: any,
  scrapedImages: any[],
  advisorRecommendations: string[]
): Promise<ContentPlanItem[]> {
  try {
    const systemPrompt = `You are The Creative Agent for Postd. Your role is to plan and generate a 7-day content calendar with ready-to-post content.

CRITICAL REQUIREMENTS:
- All content must be COMPLETE and READY TO POST (not drafts or outlines)
- Content must be industry-specific and use appropriate terminology
- Each post must be engaging, valuable, and on-brand
- Include full content text (not just topics or ideas)
- Content should address industry-specific pain points, opportunities, and trends
- Match platform best practices (character limits, hashtags, etc.)

Guidelines:
- Generate 5 social media posts (mix of platforms: Instagram, Facebook, LinkedIn, Twitter)
- Generate 1 blog post (in-depth, valuable content, 500+ words)
- Generate 1 email campaign (newsletter or promotional with subject line)
- Generate 1 Google Business Profile post (local, informative, encourages visits/calls)
- Schedule content across 7 days (distribute evenly)
- Each post should be on-brand, engaging, and aligned with brand guide
- Include specific, complete content text for each item (READY TO POST)
- Output as JSON array with this structure:
[
  {
    "title": "Post title",
    "contentType": "post" | "blog" | "email" | "gbp",
    "platform": "instagram" | "facebook" | "linkedin" | "twitter" | "email" | "blog" | "google_business",
    "content": "Full content text (complete, ready to post)...",
    "scheduledDate": "YYYY-MM-DD",
    "scheduledTime": "HH:mm"
  }
]`;

    const userPrompt = buildContentPlanningPrompt(
      brandGuide,
      brandProfile,
      brandKit,
      scrapedImages,
      advisorRecommendations
    );

    const provider: "openai" | "claude" = process.env.AI_PROVIDER === "anthropic" ? "claude" : "openai";
    const aiResponse = await generateWithAI(
      `${systemPrompt}\n\n${userPrompt}`,
      "design",
      provider
    );

    // Parse content items
    let contentItems: ContentPlanItem[] = [];
    try {
      const cleaned = aiResponse.content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      const items = Array.isArray(parsed) ? parsed : parsed.items || [];

      // Assign IDs and default status, with content quality validation
      contentItems = items
        .filter((item: any) => {
          // Filter out items with placeholder or empty content
          const content = item.content || "";
          return (
            content.length > 50 && // Minimum length
            !content.toLowerCase().includes("placeholder") &&
            !content.toLowerCase().includes("edit this content") &&
            !content.toLowerCase().includes("sample") &&
            !content.toLowerCase().includes("complete...") &&
            content.trim().length > 0
          );
        })
        .map((item: any) => ({
          id: randomUUID(),
          title: item.title || `${item.contentType} - ${item.platform}`,
          contentType: item.contentType || "post",
          platform: item.platform || "instagram",
          content: item.content || "",
          scheduledDate: item.scheduledDate || getDefaultScheduledDate(),
          scheduledTime: item.scheduledTime || "09:00",
          status: "draft" as const,
        }));

      // If we don't have enough quality items, log warning but don't add placeholders
      if (contentItems.length < 8) {
        logger.warn("Generated fewer than 8 content items", {
          brandId,
          count: contentItems.length,
          expected: 8,
        });
        // Don't add placeholder items - return what we have
        // The system will work with fewer items if needed
      }
    } catch (parseError) {
      logger.error("Failed to parse content plan", { brandId, error: parseError });
      // Don't generate default placeholder content - throw error instead
      // This ensures we only show real AI-generated content
      throw new Error(`Failed to generate content plan: ${parseError instanceof Error ? parseError.message : "Parse error"}`);
    }

    // Assign images from scraped images
    if (scrapedImages.length > 0) {
      contentItems.forEach((item, index) => {
        const imageIndex = index % scrapedImages.length;
        item.imageUrl = scrapedImages[imageIndex].url;
      });
    }

    // Final quality check: ensure all items have real content
    const validatedItems = contentItems.filter(item => {
      const hasRealContent = 
        item.content &&
        item.content.length > 50 &&
        !item.content.toLowerCase().includes("placeholder") &&
        !item.content.toLowerCase().includes("edit this") &&
        !item.content.toLowerCase().includes("sample");
      
      if (!hasRealContent) {
        logger.warn("Filtered out item with placeholder content", {
          brandId,
          itemId: item.id,
          title: item.title,
        });
      }
      
      return hasRealContent;
    });

    if (validatedItems.length === 0) {
      throw new Error("No valid content items generated. All items were filtered as placeholders.");
    }

    return validatedItems;
  } catch (error: any) {
    logger.error("Content planning failed", error, { brandId });
    // Don't return default plan - throw error so caller knows generation failed
    throw error;
  }
}

/**
 * Store content items in content_items table
 */
async function storeContentItems(
  brandId: string,
  items: ContentPlanItem[],
  tenantId?: string
): Promise<ContentPlanItem[]> {
  const storedItems: ContentPlanItem[] = [];

  for (const item of items) {
    try {
      // Combine date and time for scheduled_for
      const scheduledFor = new Date(`${item.scheduledDate}T${item.scheduledTime}:00`).toISOString();

      // Map contentType to content_type (handle gbp as post)
      const contentType = item.contentType === "gbp" ? "post" : item.contentType;
      // Map platform for Google Business
      const platform = item.contentType === "gbp" ? "google_business" : item.platform;
      
      const { data, error } = await supabase
        .from("content_items")
        .insert({
          id: item.id,
          brand_id: brandId,
          title: item.title,
          content_type: contentType,
          platform: platform,
          body: item.content,
          media_urls: item.imageUrl ? [item.imageUrl] : [],
          scheduled_for: scheduledFor,
          status: "pending_review", // Set to pending_review so it appears in queue
          approval_required: true, // Mark as requiring approval
          generated_by_agent: "content-planning-service",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.warn("Failed to store content item", { brandId, itemId: item.id, error });
        continue;
      }

      storedItems.push(item);
    } catch (error) {
      logger.warn("Error storing content item", { brandId, itemId: item.id, error });
      continue;
    }
  }

  return storedItems;
}

// Helper functions for prompt building

function buildBrandGuideCompletionPrompt(
  brandGuide: any,
  brandProfile: any,
  brandKit: any,
  scrapedImages: any[]
): string {
  let prompt = `Complete and enhance the Brand Guide for this brand.\n\n`;

  // Include industry context prominently
  const industry = brandKit.industry || brandGuide?.identity?.businessType || "General Business";
  prompt += `## Industry Context\n`;
  prompt += `Business Type/Industry: ${industry}\n`;
  prompt += `This is a ${industry} business. Ensure all brand guide fields reflect industry-appropriate language, values, and positioning.\n\n`;

  prompt += `## Current Brand Guide\n`;
  prompt += JSON.stringify(brandGuide, null, 2);
  prompt += `\n\n## Brand Profile\n`;
  prompt += JSON.stringify(brandProfile, null, 2);
  prompt += `\n\n## Scraped Content\n`;
  prompt += `Headlines: ${(brandKit.headlines || []).join(", ")}\n`;
  prompt += `About: ${brandKit.about_blurb || ""}\n`;
  prompt += `Services: ${(brandKit.keyword_themes || []).join(", ")}\n`;
  if (brandKit.description) {
    prompt += `Business Description: ${brandKit.description}\n`;
  }

  prompt += `\n\n## Instructions\n`;
  prompt += `Fill in missing fields and enhance existing ones based on scraped content.\n`;
  prompt += `Ensure all fields are industry-specific and appropriate for a ${industry} business.\n`;
  prompt += `Return JSON with completed/enhanced brand guide fields.`;

  return prompt;
}

function buildAdvisorRecommendationsPrompt(
  brandGuide: any,
  brandProfile: any,
  brandKit: any
): string {
  let prompt = `Provide content strategy recommendations for this brand.\n\n`;

  const industry = brandKit.industry || brandGuide?.identity?.businessType || "General Business";
  
  prompt += `## Brand Context\n`;
  prompt += `Brand Name: ${brandGuide?.brandName || brandProfile?.name || "Brand"}\n`;
  prompt += `Industry/Business Type: ${industry}\n`;
  prompt += `Target Audience: ${brandProfile?.targetAudience || "General"}\n`;
  prompt += `Tone: ${brandProfile?.tone || "Professional"}\n`;
  
  if (brandKit.keyword_themes && brandKit.keyword_themes.length > 0) {
    prompt += `Key Services/Products: ${brandKit.keyword_themes.join(", ")}\n`;
  }
  
  if (brandKit.description) {
    prompt += `Business Description: ${brandKit.description}\n`;
  }

  prompt += `\n\n## Instructions\n`;
  prompt += `Provide 5-7 specific, actionable recommendations for content strategy.\n`;
  prompt += `Recommendations should be industry-specific for ${industry} businesses.\n`;
  prompt += `Focus on content types, posting frequency, platform strategy, and industry-specific opportunities.\n`;
  prompt += `Return JSON array: ["recommendation 1", "recommendation 2", ...]`;
  return prompt;
}

function buildContentPlanningPrompt(
  brandGuide: any,
  brandProfile: any,
  brandKit: any,
  scrapedImages: any[],
  advisorRecommendations: string[]
): string {
  let prompt = `Plan a 7-day content calendar for this brand.\n\n`;

  // ✅ CRITICAL: Include comprehensive brand context
  prompt += `## Brand Identity\n`;
  prompt += `Brand Name: ${brandGuide?.brandName || brandProfile?.name || "Brand"}\n`;
  
  // Industry/Business Type (CRITICAL for generating appropriate content)
  const industry = brandKit.industry || brandGuide?.identity?.businessType || "General Business";
  prompt += `Industry/Business Type: ${industry}\n`;
  prompt += `This is a ${industry} business. Generate content that is appropriate for this industry, uses industry-specific terminology, and addresses industry-specific pain points and opportunities.\n`;
  
  if (brandKit.description || brandGuide?.purpose) {
    prompt += `Business Description: ${brandKit.description || brandGuide.purpose || ""}\n`;
  }
  
  if (brandKit.about_blurb) {
    prompt += `About: ${brandKit.about_blurb}\n`;
  }

  prompt += `\n## Brand Guide\n`;
  prompt += `Tone: ${(brandGuide?.voiceAndTone?.tone || []).join(", ") || "Professional"}\n`;
  prompt += `Target Audience: ${brandProfile?.targetAudience || brandGuide?.identity?.targetAudience || "General audience"}\n`;
  
  if (brandGuide?.voiceAndTone?.voiceDescription) {
    prompt += `Voice Description: ${brandGuide.voiceAndTone.voiceDescription}\n`;
  }
  
  if (brandKit.keyword_themes && brandKit.keyword_themes.length > 0) {
    prompt += `Key Services/Products: ${brandKit.keyword_themes.join(", ")}\n`;
  }
  
  if (brandGuide?.identity?.industryKeywords && brandGuide.identity.industryKeywords.length > 0) {
    prompt += `Industry Keywords: ${brandGuide.identity.industryKeywords.join(", ")}\n`;
  }

  // Content rules and guardrails
  if (brandGuide?.contentRules) {
    if (brandGuide.contentRules.neverDo && brandGuide.contentRules.neverDo.length > 0) {
      prompt += `\nNEVER DO: ${brandGuide.contentRules.neverDo.join(", ")}\n`;
    }
    if (brandGuide.contentRules.brandPhrases && brandGuide.contentRules.brandPhrases.length > 0) {
      prompt += `Preferred Phrases: ${brandGuide.contentRules.brandPhrases.join(", ")}\n`;
    }
  }
  
  if (brandGuide?.voiceAndTone?.avoidPhrases && brandGuide.voiceAndTone.avoidPhrases.length > 0) {
    prompt += `FORBIDDEN PHRASES: ${brandGuide.voiceAndTone.avoidPhrases.join(", ")}\n`;
  }

  // Visual context
  if (scrapedImages && scrapedImages.length > 0) {
    prompt += `\n## Visual Assets Available\n`;
    prompt += `${scrapedImages.length} brand images available (logos, products, team photos, etc.)\n`;
    prompt += `Reference these visual assets when planning content that requires imagery.\n`;
  }

  prompt += `\n## Advisor Recommendations\n`;
  prompt += advisorRecommendations.map((r, i) => `${i + 1}. ${r}`).join("\n");

  prompt += `\n## Content Requirements\n`;
  prompt += `Generate 8 content items (ready to post immediately):\n`;
  prompt += `- 5 social media posts (mix of Instagram, Facebook, LinkedIn, Twitter)\n`;
  prompt += `- 1 blog post (in-depth, valuable content for ${industry} industry, 500+ words)\n`;
  prompt += `- 1 email campaign (newsletter or promotional email with subject line and body)\n`;
  prompt += `- 1 Google Business Profile post (local, informative, encourages visits/calls)\n`;
  prompt += `\nEach item must:\n`;
  prompt += `- Be specific to the ${industry} industry\n`;
  prompt += `- Use appropriate industry terminology and address industry-specific topics\n`;
  prompt += `- Match the brand's tone and voice exactly\n`;
  prompt += `- Include engaging, actionable, complete content (not outlines or drafts)\n`;
  prompt += `- Be READY TO POST (complete, polished, on-brand, no placeholders)\n`;
  prompt += `- Include full content text with proper formatting\n`;
  prompt += `- For social posts: include hashtags, emojis if appropriate, and clear CTAs\n`;
  prompt += `- For blog: include title, introduction, body paragraphs, conclusion, and CTA\n`;
  prompt += `- For email: include subject line, greeting, body, and clear call-to-action\n`;
  prompt += `- For Google Business: include local context, business hours/contact info if relevant, and clear CTA\n`;
  prompt += `- Schedule across 7 days starting from tomorrow\n`;

  return prompt;
}

// Helper functions

function getDefaultScheduledDate(offset: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + 1 + offset); // Start from tomorrow
  return date.toISOString().split("T")[0];
}

// Removed generateDefaultContentPlan() - we don't want placeholder content
// If content generation fails, we throw an error instead

