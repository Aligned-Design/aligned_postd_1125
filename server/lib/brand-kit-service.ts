/**
 * Brand Kit Service - Single Source of Truth for Brand Kit Management
 * 
 * All brand kit updates MUST go through this service to ensure:
 * - Versioning is maintained
 * - Change tracking works
 * - Audit trail is complete
 */

import { supabase } from "./supabase";
import { logger } from "./logger";

export interface BrandKitVersion {
  id: string;
  brand_id: string;
  tenant_id: string | null;
  version_number: number;
  brand_kit: Record<string, any>;
  changed_fields: string[];
  change_summary: string | null;
  source: BrandKitSource;
  created_by: string | null;
  created_by_email: string | null;
  created_at: string;
  crawl_run_id: string | null;
  validated: boolean;
  validated_at: string | null;
  validated_by: string | null;
}

export type BrandKitSource = 
  | "crawler" 
  | "manual_edit" 
  | "api_import" 
  | "ai_refinement"
  | "onboarding";

export interface SaveBrandKitOptions {
  brandId: string;
  tenantId?: string;
  brandKit: Record<string, any>;
  source: BrandKitSource;
  createdBy?: string;
  createdByEmail?: string;
  crawlRunId?: string;
  changeSummary?: string;
  autoValidate?: boolean; // If true, marks this version as validated
}

export interface BrandKitDiff {
  version: number;
  changedFields: string[];
  changeSummary: string;
  timestamp: string;
}

/**
 * ✅ CANONICAL WRITE PATH: Save brand kit with automatic versioning
 * All brand kit saves MUST use this function
 */
export async function saveBrandKit(options: SaveBrandKitOptions): Promise<BrandKitVersion> {
  const {
    brandId,
    tenantId,
    brandKit,
    source,
    createdBy,
    createdByEmail,
    crawlRunId,
    changeSummary,
    autoValidate = false,
  } = options;

  try {
    // Step 1: Get previous version for comparison
    const previousVersion = await getLatestVersion(brandId);
    
    // Step 2: Calculate what changed
    let changedFields: string[] = [];
    if (previousVersion) {
      changedFields = await compareVersions(previousVersion.brand_kit, brandKit);
    } else {
      // First version - all fields are "new"
      changedFields = Object.keys(brandKit).map(key => `${key} (added)`);
    }

    // Step 3: Get next version number
    const { data: nextVersionData, error: versionError } = await supabase
      .rpc("get_next_brand_kit_version", { p_brand_id: brandId });

    if (versionError) {
      throw new Error(`Failed to get next version number: ${versionError.message}`);
    }

    const versionNumber = nextVersionData as number;

    // Step 4: Generate change summary if not provided
    const finalChangeSummary = changeSummary || generateChangeSummary(changedFields, source, versionNumber);

    // Step 5: Insert new version
    const { data: version, error: insertError } = await supabase
      .from("brand_kit_versions")
      .insert({
        brand_id: brandId,
        tenant_id: tenantId || null,
        version_number: versionNumber,
        brand_kit: brandKit,
        changed_fields: changedFields,
        change_summary: finalChangeSummary,
        source,
        created_by: createdBy || null,
        created_by_email: createdByEmail || null,
        crawl_run_id: crawlRunId || null,
        validated: autoValidate,
        validated_at: autoValidate ? new Date().toISOString() : null,
        validated_by: autoValidate ? createdBy : null,
      })
      .select()
      .single();

    if (insertError || !version) {
      throw new Error(`Failed to save brand kit version: ${insertError?.message}`);
    }

    logger.info("Brand kit version saved", {
      brandId,
      versionNumber,
      source,
      changedFieldCount: changedFields.length,
      validated: autoValidate,
    });

    return version as BrandKitVersion;
  } catch (error) {
    logger.error("Failed to save brand kit", error instanceof Error ? error : new Error(String(error)), {
      brandId,
      source,
    });
    throw error;
  }
}

/**
 * Get the latest version for a brand (validated if available, otherwise most recent)
 */
export async function getLatestVersion(brandId: string): Promise<BrandKitVersion | null> {
  try {
    // Try validated version first
    const { data: validated, error: validatedError } = await supabase
      .from("brand_kit_versions")
      .select("*")
      .eq("brand_id", brandId)
      .eq("validated", true)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (validatedError && validatedError.code !== "PGRST116") {
      throw validatedError;
    }

    if (validated) {
      return validated as BrandKitVersion;
    }

    // Fallback to latest version
    const { data: latest, error: latestError } = await supabase
      .from("brand_kit_versions")
      .select("*")
      .eq("brand_id", brandId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError && latestError.code !== "PGRST116") {
      throw latestError;
    }

    return latest as BrandKitVersion | null;
  } catch (error) {
    logger.error("Failed to get latest brand kit version", error instanceof Error ? error : new Error(String(error)), {
      brandId,
    });
    return null;
  }
}

/**
 * Get all versions for a brand
 */
export async function getVersionHistory(brandId: string): Promise<BrandKitVersion[]> {
  const { data, error } = await supabase
    .from("brand_kit_versions")
    .select("*")
    .eq("brand_id", brandId)
    .order("version_number", { ascending: false });

  if (error) {
    throw new Error(`Failed to get version history: ${error.message}`);
  }

  return (data || []) as BrandKitVersion[];
}

/**
 * Get a specific version
 */
export async function getVersion(versionId: string): Promise<BrandKitVersion | null> {
  const { data, error } = await supabase
    .from("brand_kit_versions")
    .select("*")
    .eq("id", versionId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to get version: ${error.message}`);
  }

  return data as BrandKitVersion;
}

/**
 * Validate a version (mark as confirmed by user)
 */
export async function validateVersion(
  versionId: string,
  validatedBy: string
): Promise<BrandKitVersion> {
  const { data, error } = await supabase
    .from("brand_kit_versions")
    .update({
      validated: true,
      validated_at: new Date().toISOString(),
      validated_by: validatedBy,
    })
    .eq("id", versionId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to validate version: ${error?.message}`);
  }

  logger.info("Brand kit version validated", {
    versionId,
    validatedBy,
  });

  return data as BrandKitVersion;
}

/**
 * Rollback to a previous version (creates a new version with old data)
 */
export async function rollbackToVersion(
  brandId: string,
  targetVersionNumber: number,
  rolledBackBy: string,
  rolledBackByEmail?: string
): Promise<BrandKitVersion> {
  // Get the target version
  const { data: targetVersion, error: fetchError } = await supabase
    .from("brand_kit_versions")
    .select("*")
    .eq("brand_id", brandId)
    .eq("version_number", targetVersionNumber)
    .single();

  if (fetchError || !targetVersion) {
    throw new Error(`Failed to fetch version ${targetVersionNumber}: ${fetchError?.message}`);
  }

  // Create a new version with the old data
  const newVersion = await saveBrandKit({
    brandId,
    tenantId: targetVersion.tenant_id,
    brandKit: targetVersion.brand_kit,
    source: "manual_edit",
    createdBy: rolledBackBy,
    createdByEmail: rolledBackByEmail,
    changeSummary: `Rolled back to version ${targetVersionNumber}`,
    autoValidate: false, // User should review rollback
  });

  logger.info("Brand kit rolled back", {
    brandId,
    targetVersion: targetVersionNumber,
    newVersion: newVersion.version_number,
    rolledBackBy,
  });

  return newVersion;
}

/**
 * Compare two versions and return changed fields
 */
async function compareVersions(
  oldKit: Record<string, any>,
  newKit: Record<string, any>
): Promise<string[]> {
  const { data, error } = await supabase.rpc("compare_brand_kit_versions", {
    p_old_kit: oldKit,
    p_new_kit: newKit,
  });

  if (error) {
    // Fallback to client-side comparison if RPC fails
    return clientSideCompare(oldKit, newKit);
  }

  return (data as string[]) || [];
}

/**
 * Client-side comparison fallback
 */
function clientSideCompare(
  oldKit: Record<string, any>,
  newKit: Record<string, any>
): string[] {
  const changed: string[] = [];
  const allKeys = new Set([...Object.keys(oldKit || {}), ...Object.keys(newKit || {})]);

  for (const key of allKeys) {
    if (!(key in oldKit) && key in newKit) {
      changed.push(`${key} (added)`);
    } else if (key in oldKit && !(key in newKit)) {
      changed.push(`${key} (removed)`);
    } else if (JSON.stringify(oldKit[key]) !== JSON.stringify(newKit[key])) {
      changed.push(key);
    }
  }

  return changed;
}

/**
 * Generate human-readable change summary
 */
function generateChangeSummary(
  changedFields: string[],
  source: BrandKitSource,
  versionNumber: number
): string {
  if (versionNumber === 1) {
    return `Initial brand kit created via ${source}`;
  }

  if (changedFields.length === 0) {
    return `No changes detected (v${versionNumber})`;
  }

  const addedFields = changedFields.filter(f => f.includes("(added)")).map(f => f.replace(" (added)", ""));
  const removedFields = changedFields.filter(f => f.includes("(removed)")).map(f => f.replace(" (removed)", ""));
  const modifiedFields = changedFields.filter(f => !f.includes("(added)") && !f.includes("(removed)"));

  const parts: string[] = [];
  
  if (addedFields.length > 0) {
    parts.push(`Added: ${addedFields.join(", ")}`);
  }
  if (modifiedFields.length > 0) {
    parts.push(`Updated: ${modifiedFields.join(", ")}`);
  }
  if (removedFields.length > 0) {
    parts.push(`Removed: ${removedFields.join(", ")}`);
  }

  return parts.join(" | ");
}

/**
 * Get diff between two versions
 */
export async function getDiff(
  brandId: string,
  version1: number,
  version2: number
): Promise<BrandKitDiff | null> {
  const { data: versions, error } = await supabase
    .from("brand_kit_versions")
    .select("*")
    .eq("brand_id", brandId)
    .in("version_number", [version1, version2]);

  if (error || !versions || versions.length !== 2) {
    return null;
  }

  const v1 = versions.find(v => v.version_number === version1);
  const v2 = versions.find(v => v.version_number === version2);

  if (!v1 || !v2) return null;

  const changedFields = await compareVersions(v1.brand_kit, v2.brand_kit);

  return {
    version: version2,
    changedFields,
    changeSummary: generateChangeSummary(changedFields, v2.source, version2),
    timestamp: v2.created_at,
  };
}

