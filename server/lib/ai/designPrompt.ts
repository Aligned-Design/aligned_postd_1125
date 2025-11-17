/**
 * Design Agent Prompt Builder
 * 
 * Constructs prompts for the AI Design Agent (art director) based on brand context and requirements.
 */

import type { BrandProfile } from "@shared/advisor";
import type { AiDesignGenerationRequest } from "@shared/aiContent";
import type { StrategyBrief, ContentPackage, BrandHistory, PerformanceLog } from "@shared/collaboration-artifacts";
import type { BrandVisualIdentity } from "../brand-visual-identity";
import type { BrandGuide } from "@shared/brand-guide";

export interface DesignPromptContext {
  brand: BrandProfile;
  brandGuide?: BrandGuide | null;
  request: AiDesignGenerationRequest;
  strategyBrief?: StrategyBrief | null;
  contentPackage?: ContentPackage | null;
  brandHistory?: BrandHistory | null;
  performanceLog?: PerformanceLog | null;
  brandVisualIdentity?: BrandVisualIdentity | null;
  availableImages?: Array<{
    url: string;
    source: "brand_asset" | "stock_image" | "generic";
    title?: string;
    alt?: string;
  }>;
}

/**
 * Builds the system prompt for the design agent
 */
export function buildDesignSystemPrompt(): string {
  return `You are The Creative for Postd. Your role is to generate on-brand images, graphics, templates, and layouts that follow design norms, use brand tokens, and evolve based on performance insights.

## 🎨 PRIMARY CAPABILITIES

1. **Template Generation**: Create branded templates for:
   - IG post templates (square, vertical, carousel)
   - Reel cover templates (9:16 vertical)
   - Carousel slide layouts (multi-slide educational/informational)
   - LinkedIn post graphics (horizontal, professional)
   - Quote cards (inspirational, testimonial)
   - Announcement layouts (product launches, events)
   - Story templates (vertical, full-screen)

2. **Image & Graphic Generation**: Generate:
   - On-brand graphics (icons, patterns, shapes reflecting brand style)
   - Backgrounds using brand gradients and textures
   - Simple, clean visual elements
   - Realistic team photos (composed with reference images)
   - Lifestyle imagery matching brand aesthetic
   - Performance-driven imagery (based on what works)

3. **Layout Composition**: Create layouts with:
   - Brand color + type + spacing tokens
   - Clear visual hierarchy
   - Balanced compositions
   - Accessible contrast (WCAG AA minimum)
   - Emotion and tone matched to Copywriter's draft

## 📋 DESIGN REQUIREMENTS

### Brand Tokens (MUST USE)
- **Colors**: Use ONLY brand palette colors (primary, secondary, accent)
- **Typography**: Use brand font pairing (heading + body fonts)
- **Spacing**: Use brand spacing scale (xs, sm, md, lg, xl, 2xl, 3xl)
- **Shadows**: Use approved shadow tokens only
- **Border Radius**: Use approved radius tokens

### Design Norms (MUST FOLLOW)
- Clear visual hierarchy (headline > body > CTA)
- Brand color contrast accessibility (4.5:1 minimum)
- Consistent spacing and padding (use tokens)
- Legible typography (appropriate sizes, weights)
- Balanced compositions (rule of thirds, focal points)
- Emotion and tone matched to Copywriter's draft

### Template Structure
Each template must be:
- Properly structured and editable
- Include layout metadata for Advisor review
- Use brand tokens throughout
- Follow platform-specific best practices

## 📊 PERFORMANCE-DRIVEN ADAPTATION

You MUST adapt based on performance insights:

- **If team photos outperform** → Generate more posts using team imagery
- **If stock images underperform** → Avoid stock or use stylized versions
- **If carousels are trending** → Create carousel template variations
- **If warm tones perform better** → Update template palettes accordingly
- **If clean typography is winning** → Shift hierarchy rules

All adaptations must be:
- Logged to BrandHistory
- Propagated to Copywriter for messaging alignment
- Passed to Advisor for future scoring

## 📤 OUTPUT FORMAT

Return concepts as a JSON array with this structure:
[
  {
    "label": "Concept A",
    "type": "template" | "image" | "graphic" | "layout",
    "format": "ig_post" | "reel_cover" | "carousel" | "linkedin_post" | "quote_card" | "announcement" | "story" | "feed" | "ad" | "other",
    "templateRef": "carousel-5-slide-educational", // If template
    "imagePrompt": "Detailed text prompt for image generator...", // If image/graphic
    "description": "Short explanation of the visual concept and mood",
    "aspectRatio": "1:1",
    "useCase": "Instagram Feed Post",
    "metadata": {
      "format": "Visual format description",
      "colorUsage": ["primary", "secondary"], // Brand token names
      "typeStructure": {
        "headingFont": "Poppins",
        "bodyFont": "Inter",
        "fontSize": "xl",
        "fontWeight": "bold"
      },
      "emotion": "energetic" | "calm" | "professional" | "friendly",
      "layoutStyle": "centered" | "asymmetric" | "grid" | "split",
      "aspectRatio": "1:1"
    },
    "performanceInsights": {
      "basedOnTrend": "Team photos outperform by 25%",
      "expectedOutcome": "High engagement based on similar visuals"
    }
  }
]`;
}

/**
 * Builds the user prompt with brand and request context
 */
export function buildDesignUserPrompt(context: DesignPromptContext): string {
  const { brand, brandGuide, request, strategyBrief, contentPackage, brandHistory, performanceLog, brandVisualIdentity } = context;
  
  let prompt = `Create visual concepts for ${request.format} content on ${request.platform}.\n\n`;

  // ✅ BRAND GUIDE (Source of Truth) - Include first, as it's the primary authority
  if (brandGuide) {
    prompt += `## Brand Guide (Source of Truth)\n`;
    prompt += `Brand Name: ${brandGuide.brandName}\n`;
    
    if (brandGuide.visualIdentity) {
      prompt += `\n### Visual Identity\n`;
      if (brandGuide.visualIdentity.colors && brandGuide.visualIdentity.colors.length > 0) {
        prompt += `Brand Colors: ${brandGuide.visualIdentity.colors.join(", ")}\n`;
      }
      if (brandGuide.visualIdentity.typography) {
        prompt += `Typography: ${brandGuide.visualIdentity.typography.heading || "Not specified"} (heading), ${brandGuide.visualIdentity.typography.body || "Not specified"} (body)\n`;
      }
      if (brandGuide.visualIdentity.photographyStyle) {
        prompt += `\n### Photography Style Rules (CRITICAL - MUST FOLLOW)\n`;
        if (brandGuide.visualIdentity.photographyStyle.mustInclude && brandGuide.visualIdentity.photographyStyle.mustInclude.length > 0) {
          prompt += `MUST INCLUDE: ${brandGuide.visualIdentity.photographyStyle.mustInclude.join(", ")}\n`;
          prompt += `Example: "${brandGuide.visualIdentity.photographyStyle.mustInclude[0]}"\n`;
        }
        if (brandGuide.visualIdentity.photographyStyle.mustAvoid && brandGuide.visualIdentity.photographyStyle.mustAvoid.length > 0) {
          prompt += `MUST AVOID: ${brandGuide.visualIdentity.photographyStyle.mustAvoid.join(", ")}\n`;
          prompt += `Example: "${brandGuide.visualIdentity.photographyStyle.mustAvoid[0]}"\n`;
        }
      }
    }
    
    if (brandGuide.contentRules) {
      prompt += `\n### Content Rules\n`;
      if (brandGuide.contentRules.neverDo && brandGuide.contentRules.neverDo.length > 0) {
        prompt += `NEVER DO: ${brandGuide.contentRules.neverDo.join(", ")}\n`;
      }
    }
    prompt += `\n`;
  }

  // ✅ COLLABORATION: Include StrategyBrief if available
  if (strategyBrief) {
    prompt += `## Strategy Brief (from The Advisor)\n`;
    prompt += `Tagline: ${strategyBrief.positioning.tagline}\n`;
    prompt += `Visual Identity: ${strategyBrief.visual.primaryColor}, ${strategyBrief.visual.secondaryColor}\n`;
    prompt += `Imagery Style: ${strategyBrief.visual.imagery.style}\n`;
    if (strategyBrief.visual.imagery.subjects && strategyBrief.visual.imagery.subjects.length > 0) {
      prompt += `Preferred Subjects: ${strategyBrief.visual.imagery.subjects.join(", ")}\n`;
    }
    prompt += `\n`;
  }

  // ✅ COLLABORATION: Include ContentPackage from Copywriter if available
  if (contentPackage) {
    prompt += `## Content from The Copywriter\n`;
    prompt += `Headline: ${contentPackage.copy.headline}\n`;
    prompt += `Body: ${contentPackage.copy.body.substring(0, 200)}${contentPackage.copy.body.length > 200 ? "..." : ""}\n`;
    prompt += `Tone: ${contentPackage.copy.tone}\n`;
    prompt += `Call to Action: ${contentPackage.copy.callToAction}\n`;
    prompt += `\n`;
  }

  // Brand context
  prompt += `## Brand Visual Identity\n`;
  prompt += `Name: ${brand.name}\n`;
  if (brand.tone) {
    prompt += `Brand Tone: ${brand.tone}\n`;
  }
  if (brand.values && brand.values.length > 0) {
    prompt += `Brand Values: ${brand.values.join(", ")}\n`;
  }
  if (brand.targetAudience) {
    prompt += `Target Audience: ${brand.targetAudience}\n`;
  }
  if (brand.allowedToneDescriptors && brand.allowedToneDescriptors.length > 0) {
    prompt += `Visual Style Mood: ${brand.allowedToneDescriptors.join(", ")}\n`;
  }
  // Note: For design, we'd typically have brand colors, typography, etc.
  // For now, we'll use tone descriptors as visual style guidance

  // Request context
  prompt += `\n## Visual Requirements\n`;
  if (request.campaignName) {
    prompt += `Campaign/Content Name: ${request.campaignName}\n`;
  }
  prompt += `Platform: ${request.platform}\n`;
  prompt += `Format: ${request.format}\n`;
  if (request.tone) {
    prompt += `Requested Tone: ${request.tone}\n`;
  }
  if (request.visualStyle) {
    prompt += `Visual Style: ${request.visualStyle}\n`;
  }
  if (request.additionalContext) {
    prompt += `\nAdditional Context:\n${request.additionalContext}\n`;
  }

  // Image context (if available images are provided)
  if (context.availableImages && context.availableImages.length > 0) {
    prompt += `\n## Available Visual Assets\n`;
    const brandAssets = context.availableImages.filter(img => img.source === "brand_asset");
    const stockImages = context.availableImages.filter(img => img.source === "stock_image");
    
    if (brandAssets.length > 0) {
      prompt += `Brand-owned images available: ${brandAssets.length}\n`;
      brandAssets.slice(0, 3).forEach((img, idx) => {
        prompt += `- ${img.title || img.alt || `Image ${idx + 1}`}\n`;
      });
      prompt += `Prefer referencing these brand-owned visuals in your design concepts.\n`;
    }
    if (stockImages.length > 0) {
      prompt += `Approved stock images available: ${stockImages.length}\n`;
      prompt += `These can be used as reference for visual style and composition.\n`;
    }
  }

  // Format-specific guidance
  prompt += `\n## Format-Specific Guidance\n`;
  if (request.format === "story") {
    prompt += `- Vertical format (9:16 aspect ratio)\n`;
    prompt += `- Bold, attention-grabbing visuals\n`;
    prompt += `- Text overlay friendly\n`;
    prompt += `- Full-screen composition\n`;
  } else if (request.format === "reel") {
    prompt += `- Vertical format (9:16 aspect ratio)\n`;
    prompt += `- Dynamic, engaging visuals\n`;
    prompt += `- Thumbnail-friendly composition\n`;
    prompt += `- Motion-ready (consider animation)\n`;
  } else if (request.format === "feed") {
    prompt += `- Square (1:1) or vertical (4:5) format\n`;
    prompt += `- Clean, scroll-stopping composition\n`;
    prompt += `- Balanced text/image ratio\n`;
  } else if (request.format === "carousel") {
    prompt += `- Square (1:1) format for each slide\n`;
    prompt += `- Consistent visual style across slides\n`;
    prompt += `- Clear progression/narrative\n`;
    prompt += `- First slide must be attention-grabbing\n`;
  } else if (request.format === "ad") {
    prompt += `- Platform-appropriate format\n`;
    prompt += `- Clear focal point for CTA\n`;
    prompt += `- High contrast for visibility\n`;
  } else if (request.format === "linkedin_post") {
    prompt += `- Horizontal or square format\n`;
    prompt += `- Professional, clean aesthetic\n`;
    prompt += `- Minimal text overlay\n`;
  } else if (request.format === "quote_card") {
    prompt += `- Square or vertical format\n`;
    prompt += `- Typography-focused design\n`;
    prompt += `- Elegant, readable layout\n`;
  } else if (request.format === "announcement") {
    prompt += `- Platform-appropriate format\n`;
    prompt += `- Bold, celebratory aesthetic\n`;
    prompt += `- Clear headline hierarchy\n`;
  }

  // ✅ ADAPTIVE LOGIC: Apply performance-driven recommendations
  if (brandHistory?.performance) {
    prompt += `\n## Performance-Driven Recommendations\n`;
    
    const insights = brandHistory.performance.visualInsights || [];
    const trends = brandHistory.performance.trends || [];
    
    // Check for team photo preference
    const teamPhotoInsight = insights.find(i => i.insight.toLowerCase().includes("team") || i.insight.toLowerCase().includes("people"));
    if (teamPhotoInsight && teamPhotoInsight.trend === "positive") {
      prompt += `- PREFER: Team/people imagery (outperforms by ${teamPhotoInsight.confidence * 100}% confidence)\n`;
    }

    // Check for stock image avoidance
    const stockInsight = insights.find(i => i.insight.toLowerCase().includes("stock") && i.trend === "negative");
    if (stockInsight) {
      prompt += `- AVOID: Stock images (underperforming)\n`;
      prompt += `- USE: Stylized versions or brand-specific imagery instead\n`;
    }

    // Check for carousel trend
    const carouselTrend = trends.find(t => t.trend.toLowerCase().includes("carousel"));
    if (carouselTrend && carouselTrend.strength === "strong") {
      prompt += `- CONSIDER: Carousel format (trending strongly)\n`;
    }

    // Check for warm/cool tone preference
    const warmToneTrend = trends.find(t => t.trend.toLowerCase().includes("warm") && t.trend.toLowerCase().includes("cool"));
    if (warmToneTrend) {
      prompt += `- PREFER: ${warmToneTrend.trend}\n`;
    }

    // Check for typography preference
    const typographyTrend = trends.find(t => t.trend.toLowerCase().includes("typography") || t.trend.toLowerCase().includes("clean"));
    if (typographyTrend && typographyTrend.strength === "strong") {
      prompt += `- EMPHASIZE: Clean typography hierarchy (performing well)\n`;
    }
  }

  prompt += `\nGenerate 3 distinct visual concepts (templates, images, graphics, or layouts) that:\n`;
  prompt += `1. Use brand tokens (colors, fonts, spacing) from the Brand Visual Identity above\n`;
  prompt += `2. Follow design norms (hierarchy, balance, accessibility)\n`;
  prompt += `3. Adapt based on performance insights provided\n`;
  prompt += `4. Match the emotion and tone from The Copywriter's content\n`;
  prompt += `5. Include complete metadata (format, colorUsage, typeStructure, emotion, layoutStyle)\n`;
  prompt += `6. Reference performance insights that influenced each concept\n`;
  
  return prompt;
}

/**
 * Builds a retry prompt with stricter brand compliance emphasis
 */
export function buildDesignRetryPrompt(context: DesignPromptContext, previousContent: string): string {
  const basePrompt = buildDesignUserPrompt(context);
  
  return `${basePrompt}

IMPORTANT: The previous response did not fully align with brand guidelines. Please review and regenerate visual concepts with STRICT adherence to:
- Brand tone/visual style: ${context.brand.tone || "professional"}
- Brand values: ${context.brand.values?.join(", ") || "none specified"}
- Avoid imagery that suggests unrealistic promises or misleading visuals

Previous response (for reference only - regenerate completely):
${previousContent}

Generate new visual concepts that strictly comply with all brand guidelines.`;
}

