import { supabase } from "./dbClient";
import type { MilestoneKey } from "../../client/lib/milestones";

interface MilestoneRecord {
  id: string;
  workspace_id: string;
  key: MilestoneKey;
  unlocked_at: string;
  acknowledged_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Unlock a milestone for a workspace (idempotent)
 * @param workspaceId - The workspace ID
 * @param key - The milestone key
 * @returns The milestone record
 */
export async function unlockMilestone(workspaceId: string, key: MilestoneKey) {
  try {
    // Check if already unlocked
    const { data: existing, error: checkError } = await supabase
      .from("milestones")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("key", key)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError;
    }

    if (existing) {
      return existing; // Already unlocked - idempotent
    }

    // Create new milestone
    const { data: milestone, error } = await supabase
      .from("milestones")
      .insert({
        workspace_id: workspaceId,
        key,
        unlocked_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Future work: Notify clients via WebSocket when available
    // This would enable real-time milestone notifications in the UI
    // ws.publish(`milestones:${workspaceId}`, { key });

    console.log(`[Milestone] Unlocked ${key} for workspace ${workspaceId}`);

    return milestone;
  } catch (err) {
    console.error(`[Milestone] Failed to unlock ${key}:`, err);
    throw err;
  }
}

/**
 * Check if a milestone is unlocked
 * @param workspaceId - The workspace ID
 * @param key - The milestone key
 */
export async function isMilestoneUnlocked(
  workspaceId: string,
  key: MilestoneKey,
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("milestones")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("key", key)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return !!data;
  } catch (err) {
    console.error(`[Milestone] Failed to check ${key}:`, err);
    return false;
  }
}

/**
 * Get all milestones for a workspace
 * @param workspaceId - The workspace ID
 */
export async function getMilestones(
  workspaceId: string,
): Promise<MilestoneRecord[]> {
  try {
    const { data, error } = await supabase
      .from("milestones")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("unlocked_at", { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (err) {
    console.error("[Milestone] Failed to fetch milestones:", err);
    return [];
  }
}

/**
 * Acknowledge a milestone (user has seen the celebration)
 * @param workspaceId - The workspace ID
 * @param key - The milestone key
 */
export async function acknowledgeMilestone(
  workspaceId: string,
  key: MilestoneKey,
) {
  try {
    const { error } = await supabase
      .from("milestones")
      .update({ acknowledged_at: new Date().toISOString() })
      .eq("workspace_id", workspaceId)
      .eq("key", key);

    if (error) throw error;

    console.log(`[Milestone] Acknowledged ${key} for workspace ${workspaceId}`);
  } catch (err) {
    console.error(`[Milestone] Failed to acknowledge ${key}:`, err);
    throw err;
  }
}
