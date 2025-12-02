/**
 * BFS Baseline Generator
 * 
 * Generates a baseline BFS score when Brand Guide is created or significantly updated.
 * The baseline represents "perfect" brand-aligned content.
 */

import type { BrandGuide } from "@shared/brand-guide";
import { buildBFSBaselinePrompt } from "./prompts/brand-guide-prompts";
import { calculateBFS, normalizeBrandKitForBFS } from "../agents/brand-fidelity-scorer";
import {
  openai,
  DEFAULT_OPENAI_MODEL,
  generateWithChatCompletions,
  isOpenAIConfigured,
} from "./openai-client";

/**
 * Generate BFS baseline for a Brand Guide
 * 
 * Creates a sample "perfect" content piece and calculates its BFS score.
 * This becomes the baseline against which all generated content is compared.
 */
export async function generateBFSBaseline(
  brandGuide: BrandGuide
): Promise<{
  score: number;
  sampleContent: string;
  calculatedAt: string;
}> {
  try {
    if (!isOpenAIConfigured()) {
      throw new Error("OpenAI API key not configured");
    }

    // Build baseline prompt
    const prompt = buildBFSBaselinePrompt(brandGuide);

    // Generate baseline content using OpenAI
    const systemPrompt = "You are a content generator that creates perfect brand-aligned content. Generate a single social media post that perfectly matches the Brand Guide.";
    
    const sampleContent = await generateWithChatCompletions(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      {
        model: DEFAULT_OPENAI_MODEL,
        temperature: 0.7,
        maxTokens: 500,
      }
    );

    if (!sampleContent) {
      throw new Error("Failed to generate baseline content");
    }

    // ✅ FIX: Use normalizeBrandKitForBFS for consistent normalization
    // This ensures all Brand Guide fields are included in BFS calculation
    const normalizedKit = normalizeBrandKitForBFS(brandGuide);

    const bfsResult = await calculateBFS(
      {
        body: sampleContent,
        platform: brandGuide.contentRules.preferredPlatforms?.[0] || "instagram",
      },
      normalizedKit
    );

    return {
      score: bfsResult.overall,
      sampleContent,
      calculatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[BFSBaseline] Error generating baseline:", error);
    
    // Fallback: Return a default baseline
    return {
      score: 1.0, // Perfect score as baseline
      sampleContent: "Baseline content generation failed. Using default baseline score of 1.0.",
      calculatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Check if Brand Guide needs baseline regeneration
 * 
 * Returns true if:
 * - No baseline exists
 * - Baseline is older than 30 days
 * - Brand Guide has been significantly updated (version increased by 5+)
 */
export function shouldRegenerateBaseline(
  brandGuide: BrandGuide,
  lastBaselineVersion?: number
): boolean {
  const baseline = brandGuide.performanceInsights?.bfsBaseline;

  // No baseline exists
  if (!baseline) {
    return true;
  }

  // Baseline is older than 30 days
  const baselineDate = new Date(baseline.calculatedAt);
  const daysSinceBaseline = (Date.now() - baselineDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceBaseline > 30) {
    return true;
  }

  // Brand Guide version has increased significantly
  if (lastBaselineVersion && brandGuide.version - lastBaselineVersion >= 5) {
    return true;
  }

  return false;
}

