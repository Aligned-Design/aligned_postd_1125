/**
 * Brand Guide Version History Service
 * 
 * Tracks all changes to Brand Guide for audit trail, rollback, and change tracking.
 */

import { supabase } from "./supabase";
import type { BrandGuide } from "@shared/brand-guide";

export interface BrandGuideVersion {
  id: string;
  brandId: string;
  version: number;
  brandGuide: Partial<BrandGuide>; // Snapshot of Brand Guide at this version
  changedFields: string[]; // List of fields that changed
  changedBy?: string; // User ID who made the change
  changeReason?: string; // Optional reason for change
  createdAt: string;
}

/**
 * Create a version history entry when Brand Guide is updated
 */
export async function createVersionHistory(
  brandId: string,
  brandGuide: BrandGuide,
  previousVersion: BrandGuide | null,
  changedBy?: string,
  changeReason?: string
): Promise<void> {
  try {
    // Calculate changed fields
    const changedFields = calculateChangedFields(brandGuide, previousVersion);

    // Only create version history if there are actual changes
    if (changedFields.length === 0) {
      return;
    }

    // Create version history entry for database
    const versionEntry = {
      brand_id: brandId,
      version: brandGuide.version,
      brand_guide: {
        identity: brandGuide.identity,
        voiceAndTone: brandGuide.voiceAndTone,
        visualIdentity: brandGuide.visualIdentity,
        contentRules: brandGuide.contentRules,
        personas: brandGuide.personas,
        goals: brandGuide.goals,
        purpose: brandGuide.purpose,
        mission: brandGuide.mission,
        vision: brandGuide.vision,
        approvedAssets: brandGuide.approvedAssets,
        performanceInsights: brandGuide.performanceInsights,
      },
      changed_fields: changedFields,
      changed_by: changedBy || null,
      change_reason: changeReason || null,
    };

    // @supabase-scope-ok INSERT includes brand_id in versionEntry payload
    // Store in Supabase brand_guide_versions table
    const { error } = await supabase
      .from("brand_guide_versions")
      .insert(versionEntry);

    if (error) {
      console.error("[BrandGuideVersionHistory] Error inserting version history:", error);
      // Log but don't throw - version history is non-critical
    } else {
      console.log("[BrandGuideVersionHistory] Version history created:", {
        brandId,
        version: brandGuide.version,
        changedFields,
        changedBy,
      });
    }
  } catch (error) {
    console.error("[BrandGuideVersionHistory] Error creating version history:", error);
    // Don't throw - version history is non-critical
  }
}

/**
 * Calculate which fields changed between two Brand Guide versions
 */
function calculateChangedFields(
  current: BrandGuide,
  previous: BrandGuide | null
): string[] {
  if (!previous) {
    return ["initial_creation"];
  }

  const changedFields: string[] = [];

  // Identity changes
  if (current.identity.name !== previous.identity.name) changedFields.push("identity.name");
  if (current.identity.businessType !== previous.identity.businessType) changedFields.push("identity.businessType");
  if (current.identity.industry !== previous.identity.industry) changedFields.push("identity.industry");
  if (JSON.stringify(current.identity.industryKeywords) !== JSON.stringify(previous.identity.industryKeywords)) {
    changedFields.push("identity.industryKeywords");
  }
  if (JSON.stringify(current.identity.values) !== JSON.stringify(previous.identity.values)) {
    changedFields.push("identity.values");
  }
  if (current.identity.targetAudience !== previous.identity.targetAudience) {
    changedFields.push("identity.targetAudience");
  }
  if (JSON.stringify(current.identity.painPoints) !== JSON.stringify(previous.identity.painPoints)) {
    changedFields.push("identity.painPoints");
  }

  // Voice & Tone changes
  if (JSON.stringify(current.voiceAndTone.tone) !== JSON.stringify(previous.voiceAndTone.tone)) {
    changedFields.push("voiceAndTone.tone");
  }
  if (current.voiceAndTone.friendlinessLevel !== previous.voiceAndTone.friendlinessLevel) {
    changedFields.push("voiceAndTone.friendlinessLevel");
  }
  if (current.voiceAndTone.formalityLevel !== previous.voiceAndTone.formalityLevel) {
    changedFields.push("voiceAndTone.formalityLevel");
  }
  if (current.voiceAndTone.confidenceLevel !== previous.voiceAndTone.confidenceLevel) {
    changedFields.push("voiceAndTone.confidenceLevel");
  }
  if (current.voiceAndTone.voiceDescription !== previous.voiceAndTone.voiceDescription) {
    changedFields.push("voiceAndTone.voiceDescription");
  }

  // Visual Identity changes
  if (JSON.stringify(current.visualIdentity.colors) !== JSON.stringify(previous.visualIdentity.colors)) {
    changedFields.push("visualIdentity.colors");
  }
  if (current.visualIdentity.typography.heading !== previous.visualIdentity.typography.heading) {
    changedFields.push("visualIdentity.typography.heading");
  }
  if (current.visualIdentity.logoUrl !== previous.visualIdentity.logoUrl) {
    changedFields.push("visualIdentity.logoUrl");
  }

  // Content Rules changes
  if (JSON.stringify(current.contentRules.contentPillars) !== JSON.stringify(previous.contentRules.contentPillars)) {
    changedFields.push("contentRules.contentPillars");
  }
  if (JSON.stringify(current.contentRules.guardrails) !== JSON.stringify(previous.contentRules.guardrails)) {
    changedFields.push("contentRules.guardrails");
  }

  // Legacy fields
  if (current.purpose !== previous.purpose) changedFields.push("purpose");
  if (current.mission !== previous.mission) changedFields.push("mission");
  if (current.vision !== previous.vision) changedFields.push("vision");
  if (JSON.stringify(current.personas) !== JSON.stringify(previous.personas)) {
    changedFields.push("personas");
  }
  if (JSON.stringify(current.goals) !== JSON.stringify(previous.goals)) {
    changedFields.push("goals");
  }

  return changedFields;
}

/**
 * Get version history for a brand
 */
export async function getVersionHistory(brandId: string): Promise<BrandGuideVersion[]> {
  try {
    const { data, error } = await supabase
      .from("brand_guide_versions")
      .select("*")
      .eq("brand_id", brandId)
      .order("version", { ascending: false });

    if (error) {
      console.error("[BrandGuideVersionHistory] Error fetching version history:", error);
      return [];
    }

    // Map database rows to BrandGuideVersion interface
    return (data || []).map((row) => ({
      id: row.id,
      brandId: row.brand_id,
      version: row.version,
      brandGuide: row.brand_guide as Partial<BrandGuide>,
      changedFields: row.changed_fields || [],
      changedBy: row.changed_by || undefined,
      changeReason: row.change_reason || undefined,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error("[BrandGuideVersionHistory] Error fetching version history:", error);
    return [];
  }
}

/**
 * Get a specific version of Brand Guide
 */
export async function getBrandGuideVersion(
  brandId: string,
  version: number
): Promise<BrandGuideVersion | null> {
  try {
    const { data, error } = await supabase
      .from("brand_guide_versions")
      .select("*")
      .eq("brand_id", brandId)
      .eq("version", version)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null;
      }
      console.error("[BrandGuideVersionHistory] Error fetching version:", error);
      return null;
    }

    if (!data) {
      return null;
    }

    // Map database row to BrandGuideVersion interface
    return {
      id: data.id,
      brandId: data.brand_id,
      version: data.version,
      brandGuide: data.brand_guide as Partial<BrandGuide>,
      changedFields: data.changed_fields || [],
      changedBy: data.changed_by || undefined,
      changeReason: data.change_reason || undefined,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error("[BrandGuideVersionHistory] Error fetching version:", error);
    return null;
  }
}

