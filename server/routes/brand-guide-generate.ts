/**
 * Brand Guide Generation Route
 *
 * POST /api/ai/brand-guide/generate
 * Generates a structured BrandGuide from onboarding answers and/or scraped website content
 */

import { Router, RequestHandler } from "express";
import { generateWithAI } from "../workers/ai-generation";
import { getCurrentBrandGuide, saveBrandGuide } from "../lib/brand-guide-service";
import { authenticateUser } from "../middleware/security";
import { requireScope } from "../middleware/requireScope";
import { assertBrandAccess } from "../lib/brand-access";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { getPrioritizedImage, getPrioritizedImages } from "../lib/image-sourcing";
import { getScrapedImages } from "../lib/scraped-images-service";
import type { BrandGuide } from "@shared/brand-guide";

const router = Router();

/**
 * POST /api/ai/brand-guide/generate
 * Generate Brand Guide from onboarding data or website content
 */
router.post(
  "/generate",
  authenticateUser,
  requireScope("ai:generate"),
  async (req, res, next) => {
    try {
      const { brandId, onboardingAnswers, websiteContent } = req.body;

      if (!brandId) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "brandId is required",
          HTTP_STATUS.BAD_REQUEST,
          "warning"
        );
      }

      // ✅ ROOT FIX: During onboarding, brand may not exist yet (temporary brandId)
      // Skip brand access check for temporary brandIds (ones starting with "brand_")
      // This allows onboarding to work without creating a brand record first
      if (!brandId.startsWith("brand_")) {
        // Only check access if brand is not a temporary onboarding ID
        await assertBrandAccess(req, brandId);
      }

      // Check if Brand Guide already exists
      const existing = await getCurrentBrandGuide(brandId);
      if (existing && existing.version > 0) {
        return res.status(200).json({
          success: true,
          brandGuide: existing,
          message: "Brand Guide already exists. Use PUT /api/brand-guide/:brandId to update.",
        });
      }

      // Build prompt for Brand Guide generation using onboarding data
      const prompt = `Generate a comprehensive Brand Guide for a brand in Postd. The Brand Guide is the "source of truth" for all AI agents (Copywriter, Creative, Advisor).

Requirements:
1. **Identity**: Use business type and industry keywords from onboarding data
2. **Voice & Tone**: Use tone descriptors, voice description, writing rules, and avoid phrases from onboarding
3. **Visual Identity**: Use colors, typography, and photography style rules (must include / must avoid) from onboarding
4. **Content Rules**: Use preferred platforms, preferred post types, formality level, and "never do" rules from onboarding
5. **Performance Insights**: Leave empty initially (will be populated over time)

Onboarding Data Provided:
${onboardingAnswers ? `\n${JSON.stringify(onboardingAnswers, null, 2)}` : ""}
${websiteContent ? `\nWebsite Content (first 5000 chars):\n${websiteContent.substring(0, 5000)}` : ""}

IMPORTANT: Use the onboarding data directly when available. Only infer or generate missing fields. Preserve all provided values exactly as given.

Generate a Brand Guide in JSON format matching this structure:
{
  "identity": {
    "name": "Brand Name",
    "businessType": "e.g., SaaS, E-commerce, Agency",
    "industryKeywords": ["keyword1", "keyword2"]
  },
  "voiceAndTone": {
    "tone": ["Professional", "Friendly"],
    "friendlinessLevel": 70,
    "formalityLevel": 60,
    "confidenceLevel": 80,
    "voiceDescription": "Clear description of brand voice",
    "writingRules": ["rule1", "rule2"],
    "avoidPhrases": ["phrase1", "phrase2"]
  },
  "visualIdentity": {
    "colors": ["#hex1", "#hex2"],
    "typography": {
      "heading": "Font Name",
      "body": "Font Name",
      "source": "google"
    },
    "photographyStyle": {
      "mustInclude": ["e.g., poured coffee only, no espresso shots"],
      "mustAvoid": ["e.g., no stock photos of people"]
    }
  },
  "contentRules": {
    "platformGuidelines": {},
    "neverDo": ["rule1", "rule2"],
    "guardrails": []
  },
  "performanceInsights": {
    "visualPatterns": [],
    "copyPatterns": []
  }
}`;

      // Generate Brand Guide using AI
      const result = await generateWithAI(prompt, "advisor", "openai");
      
      // Parse JSON response
      let brandGuideData: Partial<BrandGuide>;
      try {
        const jsonMatch = result.content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        const jsonString = jsonMatch ? jsonMatch[1] : result.content.trim();
        brandGuideData = JSON.parse(jsonString);
      } catch (parseError) {
        throw new AppError(
          ErrorCode.INTERNAL_ERROR,
          "Failed to parse Brand Guide from AI response",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "error"
        );
      }

      // ✅ PRIORITY: Get scraped images for logo and hero (source='scrape')
      const scrapedLogo = await getPrioritizedImage(brandId, "logo");
      const scrapedHero = await getPrioritizedImage(brandId, "image");
      const scrapedImages = await getScrapedImages(brandId);
      
      // ✅ PRIORITY: Extract scraped typography from websiteContent (if provided)
      // websiteContent may be a BrandKitData object from the crawler
      let scrapedTypography: { heading: string; body: string; source: "scrape" | "google" | "custom" } | undefined;
      if (websiteContent && typeof websiteContent === "object") {
        const brandKit = (websiteContent as any).brandKit || websiteContent;
        if (brandKit?.typography && brandKit.typography.heading && brandKit.typography.body) {
          scrapedTypography = {
            heading: brandKit.typography.heading,
            body: brandKit.typography.body,
            source: brandKit.typography.source || "scrape",
          };
        }
      }
      
      // ✅ FALLBACK: Only use stock images if scraped images are insufficient
      // If crawler returns ≥ 2 scraped images, use those; otherwise fall back to stock
      const SCRAPED_IMAGE_THRESHOLD = 2;
      let stockImagesCount = 0;
      let stockImages: any[] = [];
      
      // Only fetch stock images if we have fewer than threshold scraped images
      if (scrapedImages.length < SCRAPED_IMAGE_THRESHOLD) {
        // Get additional images from prioritized images (which includes stock as fallback)
        const additionalImages = await getPrioritizedImages(brandId, SCRAPED_IMAGE_THRESHOLD - scrapedImages.length);
        stockImages = additionalImages.filter(img => img.source === "stock");
        stockImagesCount = stockImages.length;
      }
      
      // ✅ LOGGING: Log brand visuals selection (for Vercel server logs)
      const workspaceId = (req as any).user?.workspaceId || (req as any).auth?.workspaceId || "unknown";
      console.log(`[BrandGuide] Brand visuals: { workspaceId: ${workspaceId}, brandId: ${brandId}, scrapedImages: ${scrapedImages.length}, stockImages: ${stockImagesCount} }`);

      // Merge AI-generated data with onboarding data (onboarding takes precedence)
      // ✅ PRIORITY: Use scraped logo/hero if available, otherwise use onboarding data
      const brandGuide: BrandGuide = {
        id: brandId,
        brandId,
        brandName: onboardingAnswers?.businessName || brandGuideData.identity?.name || "Untitled Brand",
        identity: {
          name: onboardingAnswers?.businessName || brandGuideData.identity?.name || "Untitled Brand",
          businessType: onboardingAnswers?.industry || brandGuideData.identity?.businessType,
          industryKeywords: onboardingAnswers?.keywords || brandGuideData.identity?.industryKeywords || [],
          competitors: onboardingAnswers?.competitors || brandGuideData.identity?.competitors || [],
          sampleHeadlines: onboardingAnswers?.headlines || brandGuideData.identity?.sampleHeadlines || [],
        },
        voiceAndTone: {
          tone: onboardingAnswers?.tone || brandGuideData.voiceAndTone?.tone || [],
          friendlinessLevel: brandGuideData.voiceAndTone?.friendlinessLevel || 50,
          formalityLevel: brandGuideData.voiceAndTone?.formalityLevel || 50,
          confidenceLevel: brandGuideData.voiceAndTone?.confidenceLevel || 50,
          voiceDescription: onboardingAnswers?.voice || brandGuideData.voiceAndTone?.voiceDescription || "",
          writingRules: onboardingAnswers?.dos || brandGuideData.voiceAndTone?.writingRules || [],
          avoidPhrases: onboardingAnswers?.donts || brandGuideData.voiceAndTone?.avoidPhrases || [],
        },
        visualIdentity: {
          colors: onboardingAnswers?.colors || brandGuideData.visualIdentity?.colors || [],
          // ✅ PRIORITY: Use scraped typography first, then onboarding, then AI-generated
          typography: scrapedTypography || (onboardingAnswers?.fontFamily ? {
            heading: onboardingAnswers.fontFamily,
            body: onboardingAnswers.fontFamily,
            source: onboardingAnswers.fontSource || "google",
          } : undefined) || brandGuideData.visualIdentity?.typography || {
            heading: "",
            body: "",
            source: "google",
          },
          photographyStyle: {
            mustInclude: onboardingAnswers?.imageRules?.mustInclude || brandGuideData.visualIdentity?.photographyStyle?.mustInclude || [],
            mustAvoid: onboardingAnswers?.imageRules?.mustAvoid || brandGuideData.visualIdentity?.photographyStyle?.mustAvoid || [],
          },
          // ✅ PRIORITY: Use scraped logo if available, otherwise onboarding logo, otherwise AI-generated
          logoUrl: scrapedLogo?.url || onboardingAnswers?.logo || brandGuideData.visualIdentity?.logoUrl,
          visualNotes: brandGuideData.visualIdentity?.visualNotes,
        },
        contentRules: {
          platformGuidelines: brandGuideData.contentRules?.platformGuidelines || {},
          preferredPlatforms: onboardingAnswers?.preferredPlatforms || brandGuideData.contentRules?.preferredPlatforms || [],
          preferredPostTypes: onboardingAnswers?.preferredPostTypes || brandGuideData.contentRules?.preferredPostTypes || [],
          brandPhrases: onboardingAnswers?.brandPhrases || brandGuideData.contentRules?.brandPhrases || [],
          formalityLevel: onboardingAnswers?.formalityLevel || brandGuideData.contentRules?.formalityLevel,
          neverDo: onboardingAnswers?.donts || brandGuideData.contentRules?.neverDo || [],
          guardrails: brandGuideData.contentRules?.guardrails || [],
        },
        approvedAssets: {
          // ✅ PRIORITY: Use scraped images first, then onboarding images, then stock as fallback
          uploadedPhotos: [
            ...scrapedImages.map((img) => ({
              id: img.id,
              url: img.url,
              category: "website_scrape",
              source: "scrape" as const,
            })),
            ...(onboardingAnswers?.images || []).map((url: string, idx: number) => ({
              id: `img-${idx}`,
              url,
              category: "website_scrape",
              source: "scrape" as const,
            })),
            // Only include stock images if scraped images are insufficient
            ...stockImages.map((img) => ({
              id: img.assetId || `stock-${Date.now()}-${Math.random()}`,
              url: img.url,
              category: "stock",
              source: "stock" as const,
            })),
          ],
          uploadedGraphics: [],
          uploadedTemplates: [],
          approvedStockImages: onboardingAnswers?.approvedStockImages || [],
          productsServices: [],
        },
        performanceInsights: brandGuideData.performanceInsights || {
          visualPatterns: [],
          copyPatterns: [],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        setupMethod: "ai_generated",
      };

      // Save Brand Guide
      await saveBrandGuide(brandId, brandGuide);

      // ✅ DEBUG: Add debug info to response showing image source
      const imageSource = scrapedImages.length >= 2 ? "scrape" : stockImagesCount > 0 ? "stock" : "none";
      const debug = {
        imageSource,
        scrapedCount: scrapedImages.length,
        stockCount: stockImagesCount,
        hasLogo: !!scrapedLogo,
        hasHero: !!scrapedHero,
      };

      return res.status(200).json({
        success: true,
        brandGuide,
        message: "Brand Guide generated successfully",
        debug, // Include debug info for troubleshooting
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

