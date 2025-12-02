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
    
    return {
      id: `${itemSpec.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
    console.error(`[OnboardingContentGenerator] Error generating ${itemSpec.type} for ${itemSpec.platform}:`, error);
    
    // Return fallback content
    return {
      id: `${itemSpec.type}-fallback-${Date.now()}`,
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
  
  // Generate all items (in parallel for speed, but with rate limiting consideration)
  const items = await Promise.all(
    itemSpecs.map((spec, index) => {
          // Stagger requests slightly to avoid rate limits
          return new Promise<ContentItem>((resolve) => {
            setTimeout(async () => {
              const item = await generateContentItem(brand, brandSnapshot, weeklyFocus, brandId, spec);
              resolve(item);
            }, index * 500); // 500ms delay between requests
          });
    })
  );
  
  // Create package
  const packageId = `content-package-${Date.now()}`;
  const packageData: WeeklyContentPackage = {
    id: packageId,
    brandId,
    weeklyFocus,
    generatedAt: new Date().toISOString(),
    items,
  };
  
  return packageData;
}

