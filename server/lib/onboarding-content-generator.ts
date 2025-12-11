/**
 * Onboarding Content Generator
 * 
 * Generates a 7-day content package using AI agents.
 * Creates: 5 social posts, 1 email, 1 GBP post, 1 blog expansion.
 */

import { generateWithAI } from "../workers/ai-generation";
import { buildDocSystemPrompt, buildDocUserPrompt } from "./ai/docPrompt";
import { calculateBrandFidelityScore } from "./ai/brandFidelity";
import { getBrandProfile } from "./brand-profile";
import { getPrioritizedImage } from "./image-sourcing";
import { getCurrentBrandGuide } from "./brand-guide-service";
import { buildFullBrandGuidePrompt } from "./prompts/brand-guide-prompts";
import { logger } from "./logger";
import { supabase } from "./supabase";
import type { BrandProfile } from "@shared/advisor";

// BrandSnapshot type (from onboarding context)
interface BrandSnapshot {
  colors?: string[];
  images?: string[];
  tone?: string[];
  keywords?: string[];
  brandIdentity?: string;
}

interface ContentItem {
  id: string;
  title: string;
  platform: string;
  type: "social" | "email" | "gbp" | "blog";
  content: string;
  scheduledDate: string;
  scheduledTime: string;
  imageUrl?: string;
  brandFidelityScore?: number;
}

interface WeeklyContentPackage {
  id: string;
  brandId: string;
  weeklyFocus: string;
  generatedAt: string;
  items: ContentItem[];
}

/**
 * Generate a single content item using AI
 */
async function generateContentItem(
  brand: BrandProfile,
  brandSnapshot: BrandSnapshot | null,
  weeklyFocus: string,
  brandId: string,
  itemSpec: {
    platform: string;
    type: "social" | "email" | "gbp" | "blog";
    contentType: string;
    topic: string;
    length: "short" | "medium" | "long";
    scheduledDate: string;
    scheduledTime: string;
  }
): Promise<ContentItem> {
  const systemPrompt = buildDocSystemPrompt();
  
  // ✅ Get Brand Guide (preferred over BrandProfile)
  const brandGuide = await getCurrentBrandGuide(brandId);
  
  // Build enhanced prompt with weekly focus and brand snapshot context
  let userPrompt = `Create ${itemSpec.contentType} content for ${itemSpec.platform}.\n\n`;
  
  // ✅ BRAND GUIDE (Source of Truth) - Use centralized prompt library
  if (brandGuide) {
    userPrompt += buildFullBrandGuidePrompt(brandGuide);
    userPrompt += `\n`;
  } else {
    // Fallback to Brand Profile if Brand Guide not available
    userPrompt += `## Brand Profile\n`;
    userPrompt += `Name: ${brand.name}\n`;
    if (brand.tone) {
      userPrompt += `Tone: ${brand.tone}\n`;
    }
    if (brand.values && brand.values.length > 0) {
      userPrompt += `Values: ${brand.values.join(", ")}\n`;
    }
    if (brand.targetAudience) {
      userPrompt += `Target Audience: ${brand.targetAudience}\n`;
    }
    if (brand.allowedToneDescriptors && brand.allowedToneDescriptors.length > 0) {
      userPrompt += `Allowed Tone: ${brand.allowedToneDescriptors.join(", ")}\n`;
    }
    if (brand.forbiddenPhrases && brand.forbiddenPhrases.length > 0) {
      userPrompt += `FORBIDDEN PHRASES (DO NOT USE): ${brand.forbiddenPhrases.join(", ")}\n`;
    }
  }
  
  // Weekly focus context
  userPrompt += `\n## Weekly Focus\n`;
  userPrompt += `This week's focus: ${weeklyFocus}\n`;
  userPrompt += `Align the content with this focus while staying true to the brand.\n`;
  
  // Brand snapshot context (if available and Brand Guide not present)
  if (brandSnapshot && !brandGuide) {
    if (brandSnapshot.brandIdentity) {
      userPrompt += `\n## Brand Identity\n${brandSnapshot.brandIdentity}\n`;
    }
    if (brandSnapshot.keywords && brandSnapshot.keywords.length > 0) {
      userPrompt += `\n## Brand Keywords\n${brandSnapshot.keywords.join(", ")}\n`;
    }
  }
  
  // Image context (prioritized: brand assets → stock images)
  // Get image source before generating content so we can include it in the prompt
  const imageSource = await getPrioritizedImage(brandId, "image");
  if (imageSource) {
    userPrompt += `\n## Available Visual Assets\n`;
    userPrompt += `The brand has ${imageSource.source === "scrape" || imageSource.source === "upload" ? "brand-owned" : "approved stock"} images available.\n`;
    if (imageSource.metadata?.alt) {
      userPrompt += `Recommended image: ${imageSource.metadata.alt}\n`;
    }
    userPrompt += `When creating content, reference or align with these visual assets when relevant.\n`;
  } else if (brandSnapshot?.images && brandSnapshot.images.length > 0) {
    userPrompt += `\n## Available Visual Assets\n`;
    userPrompt += `Brand has ${brandSnapshot.images.length} image(s) available from brand snapshot.\n`;
    userPrompt += `Reference these visuals when creating content.\n`;
  }
  
  // Content requirements
  userPrompt += `\n## Content Requirements\n`;
  userPrompt += `Topic: ${itemSpec.topic}\n`;
  userPrompt += `Platform: ${itemSpec.platform}\n`;
  userPrompt += `Content Type: ${itemSpec.contentType}\n`;
  userPrompt += `Length: ${itemSpec.length}\n`;
  
  // Platform-specific guidance
  if (itemSpec.platform === "instagram") {
    userPrompt += `\nPlatform Guidelines: Instagram posts should be visual, engaging, and use relevant hashtags. Keep captions concise but compelling.\n`;
  } else if (itemSpec.platform === "facebook") {
    userPrompt += `\nPlatform Guidelines: Facebook posts can be longer and more conversational. Encourage engagement with questions.\n`;
  } else if (itemSpec.platform === "linkedin") {
    userPrompt += `\nPlatform Guidelines: LinkedIn content should be professional, value-driven, and thought-leadership focused.\n`;
  } else if (itemSpec.platform === "twitter") {
    userPrompt += `\nPlatform Guidelines: Twitter posts should be concise, punchy, and encourage interaction. Use relevant hashtags.\n`;
  } else if (itemSpec.type === "email") {
    userPrompt += `\nPlatform Guidelines: Email should have a clear subject line suggestion, engaging body, and strong call-to-action.\n`;
  } else if (itemSpec.type === "gbp") {
    userPrompt += `\nPlatform Guidelines: Google Business Profile posts should be local, informative, and encourage visits or calls.\n`;
  } else if (itemSpec.type === "blog") {
    userPrompt += `\nPlatform Guidelines: Blog content should be comprehensive, SEO-friendly, and provide value to readers.\n`;
  }
  
  userPrompt += `\nGenerate ONE high-quality content piece (not multiple variants). Return as JSON: {"content": "Your content here", "title": "Brief title"}`;
  
  const fullPrompt = `${systemPrompt}\n\n## User Request\n\n${userPrompt}`;
  
  try {
    const provider = process.env.AI_PROVIDER === "anthropic" ? "claude" : "openai";
    const result = await generateWithAI(fullPrompt, "doc", provider);
    
    // Parse response (try JSON first, then fallback)
    let parsed: { content: string; title: string };
    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch {
      // Fallback: use first line as title, rest as content
      const lines = result.content.split("\n").filter(l => l.trim());
      parsed = {
        title: lines[0]?.replace(/^#+\s*/, "").substring(0, 60) || itemSpec.topic,
        content: lines.slice(1).join("\n") || result.content,
      };
    }
    
    // Calculate BFS
    const bfsResult = calculateBrandFidelityScore(parsed.content, brand);
    
    // Get prioritized image (brand assets → stock images → generic)
    const imageSource = await getPrioritizedImage(brandId, "image");
    const imageUrl = imageSource?.url || brandSnapshot?.images?.[0] || undefined;
    
    // Log image sourcing metrics
    if (imageSource) {
      logger.info("Image sourced for content item", {
        brandId,
        platform: itemSpec.platform,
        imageSource: imageSource.source,
        hasImage: !!imageUrl,
      });
    }
    
    return {
      id: crypto.randomUUID(), // Use proper UUID for content_items table
      title: parsed.title || itemSpec.topic,
      platform: itemSpec.platform,
      type: itemSpec.type,
      content: parsed.content,
      scheduledDate: itemSpec.scheduledDate,
      scheduledTime: itemSpec.scheduledTime,
      imageUrl,
      brandFidelityScore: bfsResult.brandFidelityScore,
    };
  } catch (error) {
    logger.error(
      `Error generating ${itemSpec.type} for ${itemSpec.platform}`,
      error instanceof Error ? error : new Error(String(error)),
      {
        brandId,
        platform: itemSpec.platform,
        type: itemSpec.type,
        topic: itemSpec.topic,
      }
    );
    
    // Return fallback content with proper UUID
    return {
      id: crypto.randomUUID(),
      title: `${itemSpec.topic} - ${itemSpec.platform}`,
      platform: itemSpec.platform,
      type: itemSpec.type,
      content: `This is placeholder content for ${itemSpec.topic} on ${itemSpec.platform}. Please regenerate to get AI-generated content.`,
      scheduledDate: itemSpec.scheduledDate,
      scheduledTime: itemSpec.scheduledTime,
      brandFidelityScore: 0,
    };
  }
}

/**
 * ✅ PRIORITY 1 FIX: Generate deterministic default content plan when AI is unavailable
 * Creates a sensible 7-day content plan based on brand info and weekly focus
 */
export function generateDefaultContentPackage(
  brandId: string,
  weeklyFocus: string,
  brandSnapshot: BrandSnapshot | null,
  brand: BrandProfile
): WeeklyContentPackage {
  const today = new Date();
  const dates: string[] = [];
  const times = ["09:00", "14:00", "10:00", "16:00", "11:00", "08:00", "12:00"];
  
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split("T")[0]);
  }

  const brandName = brand.name || "your brand";
  const topicMap: Record<string, string> = {
    "Social engagement": "Engaging with your community and building relationships",
    "Lead generation": "Attracting new customers with valuable content",
    "Brand consistency": "Reinforcing brand identity and values",
    "Awareness": "Increasing brand visibility and recognition",
    "Sales": "Promoting products/services and driving conversions",
  };
  const baseTopic = topicMap[weeklyFocus] || "Sharing valuable updates and insights";

  // Use proper UUIDs for content_items table compatibility
  const defaultItems: ContentItem[] = [
    {
      id: crypto.randomUUID(),
      title: `Share Your Story - ${brandName}`,
      platform: "instagram",
      type: "social",
      content: `🎯 ${baseTopic}\n\nShare what makes ${brandName} unique and connect with your community. Use this space to showcase your brand's personality and values.\n\n#${brandName.replace(/\s+/g, "")} #BrandStory`,
      scheduledDate: dates[0],
      scheduledTime: times[0],
      brandFidelityScore: 0.5,
    },
    {
      id: crypto.randomUUID(),
      title: `Engage Your Audience - ${brandName}`,
      platform: "facebook",
      type: "social",
      content: `${baseTopic}\n\nWhat questions can we answer for you today? Drop a comment below and let's start a conversation!\n\nAt ${brandName}, we're committed to delivering value and building lasting relationships with our community.`,
      scheduledDate: dates[1],
      scheduledTime: times[1],
      brandFidelityScore: 0.5,
    },
    {
      id: crypto.randomUUID(),
      title: `Professional Insight - ${brandName}`,
      platform: "linkedin",
      type: "social",
      content: `${baseTopic}\n\nWe're sharing insights and updates from ${brandName}. Follow along for industry news, tips, and behind-the-scenes content.\n\nWhat topics would you like to see us cover?`,
      scheduledDate: dates[2],
      scheduledTime: times[2],
      brandFidelityScore: 0.5,
    },
    {
      id: crypto.randomUUID(),
      title: `Quick Update - ${brandName}`,
      platform: "twitter",
      type: "social",
      content: `${baseTopic}\n\nWhat's on your mind today? Let's connect! 👋`,
      scheduledDate: dates[3],
      scheduledTime: times[3],
      brandFidelityScore: 0.5,
    },
    {
      id: crypto.randomUUID(),
      title: `Behind the Scenes - ${brandName}`,
      platform: "instagram",
      type: "social",
      content: `🌟 Take a look behind the scenes at ${brandName}!\n\n${baseTopic}\n\nWhat would you like to know about us? Drop your questions below! 👇`,
      scheduledDate: dates[4],
      scheduledTime: times[4],
      brandFidelityScore: 0.5,
    },
    {
      id: crypto.randomUUID(),
      title: `Weekly Update from ${brandName}`,
      platform: "email",
      type: "email",
      content: `Subject: Weekly Update from ${brandName}\n\nHi there,\n\n${baseTopic}\n\nWe wanted to share some updates and insights with you this week.\n\nStay tuned for more valuable content coming your way!\n\nBest regards,\nThe ${brandName} Team`,
      scheduledDate: dates[5],
      scheduledTime: times[5],
      brandFidelityScore: 0.5,
    },
  ];

  return {
    id: `default-content-package-${Date.now()}`,
    brandId,
    weeklyFocus,
    generatedAt: new Date().toISOString(),
    items: defaultItems,
  };
}

/**
 * Generate a complete 7-day content package
 */
export async function generateWeeklyContentPackage(
  brandId: string,
  weeklyFocus: string,
  brandSnapshot: BrandSnapshot | null
): Promise<WeeklyContentPackage> {
  // Get brand profile from Supabase (synced Brand Guide)
  // This ensures we use the latest Brand Guide data, not just the snapshot
  const brand = await getBrandProfile(brandId);
  
  // Calculate dates (starting from tomorrow, 7 days)
  const today = new Date();
  const dates: string[] = [];
  const times = ["09:00", "14:00", "10:00", "16:00", "11:00", "08:00", "12:00"];
  
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split("T")[0]);
  }
  
  // Define content items to generate
  const itemSpecs = [
    {
      platform: "instagram",
      type: "social" as const,
      contentType: "social media post",
      topic: weeklyFocus === "Social engagement" 
        ? "Engage with your community and build relationships"
        : weeklyFocus === "Lead generation"
        ? "Attract new customers with valuable content"
        : weeklyFocus === "Brand consistency"
        ? "Reinforce brand identity and values"
        : weeklyFocus === "Awareness"
        ? "Increase brand visibility and recognition"
        : "Promote products/services and drive sales",
      length: "short" as const,
      scheduledDate: dates[0],
      scheduledTime: times[0],
    },
    {
      platform: "facebook",
      type: "social" as const,
      contentType: "social media post",
      topic: weeklyFocus === "Social engagement"
        ? "Start a conversation with your audience"
        : weeklyFocus === "Lead generation"
        ? "Share valuable insights to attract leads"
        : weeklyFocus === "Brand consistency"
        ? "Showcase brand personality and values"
        : weeklyFocus === "Awareness"
        ? "Share brand story and mission"
        : "Highlight product benefits and special offers",
      length: "medium" as const,
      scheduledDate: dates[1],
      scheduledTime: times[1],
    },
    {
      platform: "linkedin",
      type: "social" as const,
      contentType: "professional post",
      topic: weeklyFocus === "Social engagement"
        ? "Engage with professional network"
        : weeklyFocus === "Lead generation"
        ? "Share thought leadership to attract B2B leads"
        : weeklyFocus === "Brand consistency"
        ? "Demonstrate brand expertise and values"
        : weeklyFocus === "Awareness"
        ? "Build brand authority in your industry"
        : "Share business updates and achievements",
      length: "medium" as const,
      scheduledDate: dates[2],
      scheduledTime: times[2],
    },
    {
      platform: "twitter",
      type: "social" as const,
      contentType: "tweet",
      topic: weeklyFocus === "Social engagement"
        ? "Spark conversation and engagement"
        : weeklyFocus === "Lead generation"
        ? "Share quick tips to attract followers"
        : weeklyFocus === "Brand consistency"
        ? "Reinforce brand voice in short format"
        : weeklyFocus === "Awareness"
        ? "Increase brand visibility with trending topics"
        : "Promote offers and drive traffic",
      length: "short" as const,
      scheduledDate: dates[3],
      scheduledTime: times[3],
    },
    {
      platform: "instagram",
      type: "social" as const,
      contentType: "social media post",
      topic: weeklyFocus === "Social engagement"
        ? "Show behind-the-scenes and build connection"
        : weeklyFocus === "Lead generation"
        ? "Share customer success stories"
        : weeklyFocus === "Brand consistency"
        ? "Showcase brand visual identity"
        : weeklyFocus === "Awareness"
        ? "Share brand values and mission"
        : "Feature products in lifestyle context",
      length: "short" as const,
      scheduledDate: dates[4],
      scheduledTime: times[4],
    },
    {
      platform: "email",
      type: "email" as const,
      contentType: "email newsletter",
      topic: weeklyFocus === "Social engagement"
        ? "Weekly roundup to engage subscribers"
        : weeklyFocus === "Lead generation"
        ? "Nurture leads with valuable content"
        : weeklyFocus === "Brand consistency"
        ? "Reinforce brand messaging and values"
        : weeklyFocus === "Awareness"
        ? "Share brand updates and news"
        : "Promote products and drive conversions",
      length: "medium" as const,
      scheduledDate: dates[5],
      scheduledTime: times[5],
    },
    {
      platform: "google",
      type: "gbp" as const,
      contentType: "Google Business Profile post",
      topic: weeklyFocus === "Social engagement"
        ? "Engage local community"
        : weeklyFocus === "Lead generation"
        ? "Attract local customers"
        : weeklyFocus === "Brand consistency"
        ? "Reinforce local brand presence"
        : weeklyFocus === "Awareness"
        ? "Increase local visibility"
        : "Promote local offers and events",
      length: "short" as const,
      scheduledDate: dates[6],
      scheduledTime: times[6],
    },
  ];
  
  // ✅ PRIORITY 1 FIX: Generate content with AI, but fallback to defaults if all AI fails
  let items: ContentItem[] = [];
  let aiFailedCompletely = false;
  let aiErrorCount = 0;
  
  try {
    // Generate all items (in parallel for speed, but with rate limiting consideration)
    const generationResults = await Promise.allSettled(
      itemSpecs.map((spec, index) => {
        // Stagger requests slightly to avoid rate limits
        return new Promise<ContentItem>((resolve, reject) => {
          setTimeout(async () => {
            try {
              const item = await generateContentItem(brand, brandSnapshot, weeklyFocus, brandId, spec);
              resolve(item);
            } catch (error) {
              reject(error);
            }
          }, index * 500); // 500ms delay between requests
        });
      })
    );

    // Process results - check if AI completely failed
    items = generationResults.map((result, index) => {
      if (result.status === "fulfilled") {
        // Check if item is a fallback placeholder (from individual item error)
        const item = result.value;
        const isPlaceholder = item.content.includes("placeholder") || 
                              item.content.includes("Please regenerate") ||
                              item.brandFidelityScore === 0;
        
        if (isPlaceholder) {
          aiErrorCount++;
        }
        
        return item;
      } else {
        // Generation failed for this item
        aiErrorCount++;
        logger.warn("AI generation failed for content item", {
          brandId,
          itemIndex: index,
          platform: itemSpecs[index].platform,
          type: itemSpecs[index].type,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        });
        
        // Return individual fallback with proper UUID
        const spec = itemSpecs[index];
        return {
          id: crypto.randomUUID(),
          title: `${spec.topic} - ${spec.platform}`,
          platform: spec.platform,
          type: spec.type,
          content: `This is placeholder content for ${spec.topic} on ${spec.platform}. Please regenerate to get AI-generated content.`,
          scheduledDate: spec.scheduledDate,
          scheduledTime: spec.scheduledTime,
          brandFidelityScore: 0,
        };
      }
    });

    // ✅ Check if AI failed completely (all items are placeholders or failed)
    aiFailedCompletely = aiErrorCount === itemSpecs.length || 
                         items.every(item => item.brandFidelityScore === 0 && 
                                           (item.content.includes("placeholder") || 
                                            item.content.includes("Please regenerate")));

    if (aiFailedCompletely) {
      logger.warn("AI generation failed completely, using deterministic default plan", {
        brandId,
        weeklyFocus,
        failedItems: aiErrorCount,
        totalItems: itemSpecs.length,
        aiFallbackUsed: true,
      });
      
      // ✅ Use deterministic default content plan
      const defaultPackage = generateDefaultContentPackage(brandId, weeklyFocus, brandSnapshot, brand);
      return defaultPackage;
    }
    
    // ✅ If some items failed but not all, log warning but return partial results
    if (aiErrorCount > 0) {
      logger.warn("Some content items generated with fallbacks", {
        brandId,
        failedCount: aiErrorCount,
        successCount: items.length - aiErrorCount,
        totalItems: itemSpecs.length,
        partialFallback: true,
      });
    }
  } catch (error) {
    // ✅ Catch-all: if entire generation process fails, use defaults
    logger.error(
      "Content generation process failed, using default plan",
      error instanceof Error ? error : new Error(String(error)),
      {
        brandId,
        weeklyFocus,
        completeFallback: true,
      }
    );
    
    aiFailedCompletely = true;
    const defaultPackage = generateDefaultContentPackage(brandId, weeklyFocus, brandSnapshot, brand);
    return defaultPackage;
  }
  
  // Create package with generated (or default) items
  const packageId = `content-package-${Date.now()}`;
  const packageData: WeeklyContentPackage = {
    id: packageId,
    brandId,
    weeklyFocus,
    generatedAt: new Date().toISOString(),
    items,
  };
  
  // Log content plan generation success metrics
  const itemsWithImages = items.filter(item => item.imageUrl).length;
  const avgBFS = items.reduce((sum, item) => sum + (item.brandFidelityScore || 0), 0) / items.length;
  
  logger.info("Content plan generated successfully", {
    brandId,
    packageId,
    weeklyFocus,
    totalItems: items.length,
    itemsWithImages,
    avgBrandFidelityScore: avgBFS,
    platforms: [...new Set(items.map(item => item.platform))],
  });
  
  // ✅ PIPELINE FIX: Log generation to generation_logs for tracking
  await logGenerationToDatabase(brandId, packageId, items, avgBFS, aiFailedCompletely);
  
  return packageData;
}

/**
 * Log generation attempt to generation_logs table for tracking and review
 */
async function logGenerationToDatabase(
  brandId: string,
  packageId: string,
  items: ContentItem[],
  avgBFS: number,
  usedFallback: boolean
): Promise<void> {
  try {
    const logEntries = items.map((item, index) => ({
      brand_id: brandId,
      agent: "doc",
      post_id: item.id,
      generated_content: {
        headline: item.title,
        body: item.content,
        platform: item.platform,
        type: item.type,
        scheduledDate: item.scheduledDate,
        scheduledTime: item.scheduledTime,
        imageUrl: item.imageUrl,
        packageId: packageId,
        itemIndex: index,
      },
      brand_fidelity_score: item.brandFidelityScore || 0,
      linter_passed: (item.brandFidelityScore || 0) >= 0.7,
      approved: false, // Requires human review
      generation_metadata: {
        source: "onboarding-content-generator",
        packageId,
        usedFallback,
        itemIndex: index,
        avgPackageBFS: avgBFS,
        isPlaceholder: item.content.includes("placeholder") || (item.brandFidelityScore || 0) === 0,
      },
    }));

    // Insert all logs (batch insert for efficiency)
    const { error } = await supabase.from("generation_logs").insert(logEntries);
    
    if (error) {
      logger.warn("Failed to log generation to database", {
        brandId,
        packageId,
        error: error.message,
        code: error.code,
      });
    } else {
      logger.info("Generation logged to database", {
        brandId,
        packageId,
        logsCreated: logEntries.length,
      });
    }
  } catch (error) {
    // Non-blocking: don't fail generation if logging fails
    logger.warn("Error logging generation to database", {
      brandId,
      packageId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * ✅ PIPELINE FIX: Sync content_packages items to content_items table
 * 
 * This ensures generated content is visible in the Queue page (/queue)
 * which fetches from content_items, not content_packages.
 * 
 * Schema: content_items has columns:
 * - id, brand_id, title, type, content (JSONB), platform, media_urls,
 * - scheduled_for, status, generated_by_agent, created_by, approved_by,
 * - published_at, created_at, updated_at
 * 
 * @param brandId - Brand UUID
 * @param contentPackage - The generated content package
 * @returns Promise<{synced: number, failed: number}> - Sync results
 */
export async function syncPackageToContentItems(
  brandId: string,
  contentPackage: WeeklyContentPackage
): Promise<{ synced: number; failed: number }> {
  let synced = 0;
  let failed = 0;

  try {
    // Map content package items to content_items format (matching DB schema)
    const contentItemsToInsert = contentPackage.items.map((item) => ({
      id: item.id,
      brand_id: brandId,
      title: item.title,
      type: item.type === "social" ? "post" : item.type, // Normalize type
      platform: item.platform,
      status: "draft", // All generated content starts as draft
      generated_by_agent: "doc", // Content generated by Doc agent
      // Store all content and metadata in the content JSONB field
      content: {
        headline: item.title,
        body: item.content,
        caption: item.content,
        text: item.content,
        platform: item.platform,
        type: item.type,
        imageUrl: item.imageUrl,
        brandFidelityScore: item.brandFidelityScore,
        // Include metadata in content JSONB (no separate metadata column)
        scheduledDate: item.scheduledDate,
        scheduledTime: item.scheduledTime,
        source: "onboarding",
        packageId: contentPackage.id,
        generatedAt: contentPackage.generatedAt,
      },
      // Use scheduled_for (not scheduled_at) per schema
      scheduled_for: item.scheduledDate && item.scheduledTime 
        ? new Date(`${item.scheduledDate}T${item.scheduledTime}:00`).toISOString()
        : null,
      // Add media URLs if image is available
      media_urls: item.imageUrl ? [item.imageUrl] : null,
    }));

    // Insert content items (upsert to avoid duplicates)
    for (const contentItem of contentItemsToInsert) {
      const { error } = await supabase
        .from("content_items")
        .upsert(contentItem, { 
          onConflict: "id",
          ignoreDuplicates: false 
        });

      if (error) {
        logger.warn("Failed to sync content item to content_items", {
          brandId,
          itemId: contentItem.id,
          error: error.message,
          code: error.code,
        });
        failed++;
      } else {
        synced++;
      }
    }

    logger.info("Content package synced to content_items", {
      brandId,
      packageId: contentPackage.id,
      synced,
      failed,
      total: contentPackage.items.length,
    });

    return { synced, failed };
  } catch (error) {
    logger.error(
      "Error syncing content package to content_items",
      error instanceof Error ? error : new Error(String(error)),
      { brandId, packageId: contentPackage.id }
    );
    return { synced, failed: contentPackage.items.length };
  }
}

