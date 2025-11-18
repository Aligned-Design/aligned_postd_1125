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
  contentType: "post" | "blog" | "email";
  platform: string;
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

    // Get brand info
    const { data: brand } = await supabase
      .from("brands")
      .select("id, name, website_url, brand_kit")
      .eq("id", brandId)
      .single();

    if (!brand) {
      throw new Error(`Brand not found: ${brandId}`);
    }

    const brandKit = (brand.brand_kit as any) || {};

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

    // 5. Store content items in database
    const storedItems = await storeContentItems(brandId, contentItems, tenantId);

    const durationMs = Date.now() - startTime;
    logger.info("Content plan generated", {
      requestId,
      brandId,
      durationMs,
      itemsCount: storedItems.length,
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
    const systemPrompt = `You are The Creative Agent for Postd. Your role is to plan and generate a 7-day content calendar.

Guidelines:
- Generate 5 social media posts (mix of platforms: Instagram, Facebook, LinkedIn, Twitter)
- Generate 1 blog post
- Generate 1 email campaign
- Schedule content across 7 days (distribute evenly)
- Each post should be on-brand, engaging, and aligned with brand guide
- Include specific content text for each item
- Output as JSON array with this structure:
[
  {
    "title": "Post title",
    "contentType": "post" | "blog" | "email",
    "platform": "instagram" | "facebook" | "linkedin" | "twitter" | "email" | "blog",
    "content": "Full content text...",
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

      // Assign IDs and default status
      contentItems = items.map((item: any) => ({
        id: randomUUID(),
        title: item.title || `${item.contentType} - ${item.platform}`,
        contentType: item.contentType || "post",
        platform: item.platform || "instagram",
        content: item.content || "",
        scheduledDate: item.scheduledDate || getDefaultScheduledDate(),
        scheduledTime: item.scheduledTime || "09:00",
        status: "draft" as const,
      }));

      // Ensure we have exactly 7 items (5 social + 1 blog + 1 email)
      if (contentItems.length < 7) {
        // Fill missing items with defaults
        const needed = 7 - contentItems.length;
        for (let i = 0; i < needed; i++) {
          contentItems.push({
            id: randomUUID(),
            title: `Content ${contentItems.length + 1}`,
            contentType: i === 0 ? "blog" : i === 1 ? "email" : "post",
            platform: i === 0 ? "blog" : i === 1 ? "email" : "instagram",
            content: "Content to be generated...",
            scheduledDate: getDefaultScheduledDate(i),
            scheduledTime: "09:00",
            status: "draft",
          });
        }
      }
    } catch (parseError) {
      logger.warn("Failed to parse content plan", { brandId, error: parseError });
      // Generate default content plan
      contentItems = generateDefaultContentPlan();
    }

    // Assign images from scraped images
    if (scrapedImages.length > 0) {
      contentItems.forEach((item, index) => {
        const imageIndex = index % scrapedImages.length;
        item.imageUrl = scrapedImages[imageIndex].url;
      });
    }

    return contentItems;
  } catch (error: any) {
    logger.error("Content planning failed", error, { brandId });
    return generateDefaultContentPlan(); // Return default plan on error
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

      const { data, error } = await supabase
        .from("content_items")
        .insert({
          id: item.id,
          brand_id: brandId,
          title: item.title,
          content_type: item.contentType,
          platform: item.platform,
          body: item.content,
          media_urls: item.imageUrl ? [item.imageUrl] : [],
          scheduled_for: scheduledFor,
          status: item.status,
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

  prompt += `## Current Brand Guide\n`;
  prompt += JSON.stringify(brandGuide, null, 2);
  prompt += `\n\n## Brand Profile\n`;
  prompt += JSON.stringify(brandProfile, null, 2);
  prompt += `\n\n## Scraped Content\n`;
  prompt += `Headlines: ${(brandKit.headlines || []).join(", ")}\n`;
  prompt += `About: ${brandKit.about_blurb || ""}\n`;
  prompt += `Services: ${(brandKit.keyword_themes || []).join(", ")}\n`;

  prompt += `\n\n## Instructions\n`;
  prompt += `Fill in missing fields and enhance existing ones based on scraped content.\n`;
  prompt += `Return JSON with completed/enhanced brand guide fields.`;

  return prompt;
}

function buildAdvisorRecommendationsPrompt(
  brandGuide: any,
  brandProfile: any,
  brandKit: any
): string {
  let prompt = `Provide content strategy recommendations for this brand.\n\n`;

  prompt += `## Brand Context\n`;
  prompt += `Brand Name: ${brandGuide?.brandName || brandProfile?.name || "Brand"}\n`;
  prompt += `Target Audience: ${brandProfile?.targetAudience || "General"}\n`;
  prompt += `Tone: ${brandProfile?.tone || "Professional"}\n`;

  prompt += `\n\n## Instructions\n`;
  prompt += `Provide 5-7 specific, actionable recommendations for content strategy.\n`;
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

  prompt += `## Brand Guide\n`;
  prompt += `Tone: ${(brandGuide?.voiceAndTone?.tone || []).join(", ")}\n`;
  prompt += `Audience: ${brandProfile?.targetAudience || "General"}\n`;
  prompt += `Services: ${(brandKit.keyword_themes || []).join(", ")}\n`;

  prompt += `\n\n## Advisor Recommendations\n`;
  prompt += advisorRecommendations.map((r, i) => `${i + 1}. ${r}`).join("\n");

  prompt += `\n\n## Instructions\n`;
  prompt += `Generate 7 content items:\n`;
  prompt += `- 5 social media posts (mix platforms)\n`;
  prompt += `- 1 blog post\n`;
  prompt += `- 1 email campaign\n`;
  prompt += `Schedule across 7 days starting from tomorrow.\n`;
  prompt += `Each item should be on-brand and engaging.`;

  return prompt;
}

// Helper functions

function getDefaultScheduledDate(offset: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + 1 + offset); // Start from tomorrow
  return date.toISOString().split("T")[0];
}

function generateDefaultContentPlan(): ContentPlanItem[] {
  const platforms = ["instagram", "facebook", "linkedin", "twitter", "instagram"];
  const contentTypes: Array<"post" | "blog" | "email"> = ["post", "post", "post", "post", "post", "blog", "email"];

  return contentTypes.map((contentType, index) => ({
    id: randomUUID(),
    title: `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} ${index + 1}`,
    contentType,
    platform: contentType === "blog" ? "blog" : contentType === "email" ? "email" : platforms[index % platforms.length],
    content: `This is a ${contentType} for your brand. Edit this content in the studio.`,
    scheduledDate: getDefaultScheduledDate(index),
    scheduledTime: "09:00",
    status: "draft" as const,
  }));
}

