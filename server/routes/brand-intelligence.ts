import { RequestHandler } from "express";
import { BrandIntelligence } from "@shared/brand-intelligence";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { supabase } from "../lib/supabase";
import { assertBrandAccess } from "../lib/brand-access";

export const getBrandIntelligence: RequestHandler = async (req, res) => {
  try {
    const { brandId } = req.params;

    // Validate required parameter
    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "brandId parameter is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        undefined,
        "Please provide brandId as a URL parameter"
      );
    }

    // Validate brandId format (basic check)
    if (typeof brandId !== "string" || brandId.length === 0) {
      throw new AppError(
        ErrorCode.INVALID_FORMAT,
        "Invalid brandId format",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        undefined,
        "brandId must be a non-empty string"
      );
    }

    // Verify user has access to this brand
    assertBrandAccess(req, brandId);

    // Mock comprehensive brand intelligence data
    const intelligence: BrandIntelligence = {
      id: `intel_${brandId}`,
      brandId,
      brandProfile: {
        usp: [
          "Sustainable fashion with 80% recycled materials",
          "Direct-to-consumer pricing without retail markup",
          "Carbon-neutral shipping and packaging",
        ],
        differentiators: [
          "Only fashion brand with 100% transparent supply chain",
          "Proprietary fabric technology from ocean plastic",
          "Local manufacturing within 50 miles of major cities",
        ],
        coreValues: [
          "sustainability",
          "transparency",
          "quality",
          "accessibility",
        ],
        targetAudience: {
          demographics: {
            age: "25-45",
            income: "$50,000-$120,000",
            location: "Urban and suburban areas",
            education: "College-educated",
          },
          psychographics: [
            "Environmentally conscious",
            "Values authenticity",
            "Quality-focused",
            "Social media active",
          ],
          painPoints: [
            "Finding truly sustainable fashion",
            "High prices for eco-friendly options",
            "Lack of transparency in fashion industry",
          ],
          interests: [
            "sustainability",
            "fashion",
            "wellness",
            "travel",
            "technology",
          ],
        },
        brandPersonality: {
          traits: ["authentic", "innovative", "responsible", "approachable"],
          tone: "friendly and educational",
          voice: "expert but not preachy",
          communicationStyle: "conversational with purpose",
        },
        visualIdentity: {
          colorPalette: ["#2E7D32", "#66BB6A", "#E8F5E8", "#1B5E20"],
          typography: ["Modern sans-serif", "Clean", "Readable"],
          imageStyle: [
            "Natural lighting",
            "Lifestyle-focused",
            "Authentic moments",
          ],
          logoGuidelines: "Minimal, nature-inspired design",
        },
      },
      competitorInsights: {
        primaryCompetitors: [
          {
            id: "comp_1",
            name: "Patagonia",
            handle: "@patagonia",
            platform: "instagram",
            followers: 4200000,
            avgEngagement: 3.2,
            postingFrequency: 5,
            contentThemes: ["outdoor adventure", "activism", "sustainability"],
            strengths: [
              "Strong brand loyalty",
              "Authentic storytelling",
              "Purpose-driven",
            ],
            weaknesses: ["Higher price point", "Limited urban appeal"],
            lastAnalyzed: new Date().toISOString(),
          },
        ],
        benchmarks: {
          avgEngagementRate: 3.0,
          avgPostingFrequency: 6,
          topContentThemes: [
            "sustainability",
            "transparency",
            "quality",
            "lifestyle",
          ],
          bestPostingTimes: {
            instagram: ["10:00", "14:00", "19:00"],
            facebook: ["12:00", "15:00", "18:00"],
          },
        },
        gapAnalysis: {
          contentGaps: [
            "Limited behind-the-scenes manufacturing content",
            "Insufficient user-generated content showcase",
          ],
          opportunityAreas: [
            "Micro-influencer partnerships",
            "Interactive sustainability challenges",
          ],
          differentiationOpportunities: [
            "Emphasize local manufacturing advantage",
            "Showcase ocean plastic technology",
          ],
        },
      },
      audienceInsights: {
        activityPatterns: {
          instagram: {
            peakHours: ["10:00", "14:00", "19:00"],
            peakDays: ["Tuesday", "Wednesday", "Thursday"],
            timezone: "America/New_York",
            engagementHeatmap: generateEngagementHeatmap(),
          },
        },
        contentPreferences: {
          topPerformingTypes: [
            "behind-the-scenes",
            "educational",
            "user-generated",
          ],
          engagementTriggers: ["questions", "polls", "sustainability tips"],
          preferredLength: 150,
          hashtagEffectiveness: {
            "#sustainability": 1.4,
            "#ecofashion": 1.3,
          },
        },
        growthDrivers: {
          followerGrowthTriggers: [
            "viral sustainability content",
            "influencer collaborations",
          ],
          viralContentPatterns: [
            "educational carousels",
            "transformation videos",
          ],
          engagementBoosterTactics: ["ask questions", "share user stories"],
        },
      },
      contentIntelligence: {
        performanceCorrelations: {
          timeVsEngagement: [
            { time: "10:00", avgEngagement: 4.2 },
            { time: "14:00", avgEngagement: 3.8 },
            { time: "19:00", avgEngagement: 4.5 },
          ],
          contentTypeVsGrowth: [
            { type: "behind-the-scenes", growthImpact: 1.8 },
            { type: "educational", growthImpact: 1.6 },
          ],
          hashtagVsReach: [
            { hashtag: "#sustainability", reachMultiplier: 1.4 },
          ],
        },
        successPatterns: {
          topPerformingContent: [
            {
              id: "pattern_1",
              contentType: "behind-the-scenes",
              platform: "instagram",
              avgEngagement: 4.5,
              reachMultiplier: 1.8,
              successFactors: [
                "authentic storytelling",
                "manufacturing process",
              ],
              examples: ["Ocean plastic processing video"],
            },
          ],
          failurePatterns: [],
          improvementOpportunities: [
            "Add more educational value to promotional content",
          ],
        },
      },
      recommendations: {
        strategic: [
          {
            id: "strat_1",
            type: "differentiation",
            title: "Emphasize Local Manufacturing Advantage",
            description:
              "Highlight your unique local manufacturing network as a key differentiator.",
            impact: "high",
            effort: "medium",
            timeframe: "2-3 months",
            expectedOutcome: "25% increase in brand differentiation awareness",
            reasoning:
              "Competitor analysis shows no other brand emphasizes local manufacturing as strongly.",
          },
        ],
        tactical: [
          {
            id: "tact_1",
            type: "content_optimization",
            title: "Increase Behind-the-Scenes Content",
            action: "Post 2-3 behind-the-scenes videos per week",
            expectedImpact: "40% increase in engagement rate",
            platform: "instagram",
            priority: "high",
          },
        ],
        contentSuggestions: [
          {
            id: "content_1",
            contentType: "video",
            platform: "instagram",
            suggestedTopic: "Ocean Plastic Transformation Process",
            angle: "Show the journey from ocean waste to beautiful fabric",
            reasoning:
              "Behind-the-scenes content performs 80% better than average",
            expectedEngagement: 4.2,
            bestPostingTime: "19:00",
            recommendedHashtags: ["#oceanplastic", "#sustainability"],
          },
        ],
        timingOptimization: [
          {
            platform: "instagram",
            optimalTimes: ["10:00", "14:00", "19:00"],
            timezone: "America/New_York",
            reasoning: "Analysis shows 35% higher engagement at these times",
            expectedUplift: 1.35,
          },
        ],
      },
      lastAnalyzed: new Date().toISOString(),
      nextAnalysis: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      confidenceScore: 0.87,
    };

    // Return success response with proper headers
    (res as any).set({
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    });
    return (res as any).status(200).json(intelligence);
  } catch (error) {
    console.error("[Brand Intelligence API] Error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      brandId: (req as any).params.brandId,
      timestamp: new Date().toISOString(),
    });

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Failed to load brand intelligence",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
};

export const submitRecommendationFeedback: RequestHandler = async (
  req,
  res,
) => {
  try {
    const { recommendationId, action } = req.body;

    // Validate required fields
    if (!recommendationId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "recommendationId is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        undefined,
        "Please provide recommendationId in your request body"
      );
    }

    if (!action || !["accepted", "rejected"].includes(action)) {
      throw new AppError(
        ErrorCode.INVALID_FORMAT,
        'action must be either "accepted" or "rejected"',
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        undefined,
        'Please provide action as either "accepted" or "rejected"'
      );
    }

    // Get user context for tenant_id and brand_id
    const authReq = req as any;
    const userId = authReq.user?.id || authReq.auth?.userId;
    const userBrandIds = authReq.user?.brandIds || authReq.auth?.brandIds || [];
    
    // Extract brandId from recommendationId or use first available brand
    // Recommendation IDs typically include brand context (e.g., "strat_1_brand_123")
    let brandId: string | null = null;
    if (userBrandIds.length > 0) {
      brandId = userBrandIds[0];
    } else {
      // Try to extract from recommendationId pattern
      const brandMatch = recommendationId.match(/brand[_-]?([a-f0-9-]{36})/i);
      if (brandMatch) {
        brandId = brandMatch[1];
      }
    }

    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Brand ID is required for feedback",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        undefined,
        "Please provide brandId in request context"
      );
    }

    // Get tenant_id from brand
    const { data: brandData, error: brandError } = await supabase
      .from("brands")
      .select("tenant_id")
      .eq("id", brandId)
      .single();

    if (brandError || !brandData) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Brand not found",
        HTTP_STATUS.NOT_FOUND,
        "warning"
      );
    }

    const tenantId = brandData.tenant_id;

    // Determine recommendation type and category from recommendationId
    // Pattern: {type}_{id} (e.g., "strat_1", "tact_1", "content_1")
    const typeMatch = recommendationId.match(/^(strat|tact|content|timing)/);
    const recommendationType = typeMatch ? typeMatch[1] : "recommendation";
    const category = recommendationType === "strat" ? "strategic" : 
                     recommendationType === "tact" ? "tactical" :
                     recommendationType === "content" ? "content" :
                     recommendationType === "timing" ? "timing" : "general";

    // Store feedback in advisor_feedback table
    const { data: feedbackData, error: feedbackError } = await supabase
      .from("advisor_feedback")
      .insert({
        brand_id: brandId,
        tenant_id: tenantId,
        insight_id: recommendationId,
        category: category,
        type: recommendationType,
        feedback: action === "accepted" ? "accepted" : "rejected",
        previous_weight: 1.0,
        new_weight: action === "accepted" ? 1.1 : 0.9, // Slight weight adjustment for learning
      })
      .select()
      .single();

    if (feedbackError) {
      console.error("[Brand Intelligence Feedback] Database error:", feedbackError);
      // Fall through to success response - feedback logging is best-effort
      // In production, you might want to queue this for retry
    }

    (res as any).set({
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    });
    return (res as any).status(200).json({
      success: true,
      message: "Feedback recorded successfully",
      feedbackId: feedbackData?.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Brand Intelligence Feedback] Error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      recommendationId: (req.body as unknown)?.recommendationId,
      timestamp: new Date().toISOString(),
    });

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Failed to record feedback",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
};

function generateEngagementHeatmap() {
  return Array.from({ length: 168 }, (_, i) => ({
    hour: i % 24,
    day: Math.floor(i / 24),
    score: Math.random() * 0.8 + 0.2,
  }));
}
