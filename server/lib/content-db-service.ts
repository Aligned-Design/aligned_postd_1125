/**
 * Content Database Service
 * 
 * Centralized service for saving AI-generated content to the canonical content_items table.
 * Used by AI routes, Studio, and content planning to ensure consistent persistence.
 */

import { supabase } from "./supabase";
import { randomUUID } from "crypto";
import { logger } from "./logger";

export interface SaveContentItemInput {
  brandId: string;
  title?: string;
  content: string;
  platform: string;
  contentType: "post" | "blog" | "email" | "gbp" | "caption" | "ad" | "script" | "creative_studio";
  status?: "draft" | "pending_review" | "scheduled" | "published";
  scheduledFor?: string; // ISO date string
  imageUrl?: string;
  metadata?: Record<string, unknown>;
  generatedByAgent?: string;
  brandFidelityScore?: number;
  createdBy?: string;
}

export interface SavedContentItem {
  id: string;
  brandId: string;
  title: string;
  content: string;
  platform: string;
  contentType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Save a single content item to the content_items table
 * 
 * @param input - Content item data to save
 * @returns The saved content item with its ID
 */
export async function saveContentItem(input: SaveContentItemInput): Promise<SavedContentItem> {
  const id = randomUUID();
  const now = new Date().toISOString();
  
  // Map contentType to type field (handle gbp as post)
  const type = input.contentType === "gbp" ? "post" : input.contentType;
  
  // Build content JSONB
  const contentJson = {
    body: input.content,
    headline: input.title || "",
    platform: input.platform,
    ...(input.metadata || {}),
  };
  
  // Build insert data matching content_items schema
  const insertData: Record<string, unknown> = {
    id,
    brand_id: input.brandId,
    title: input.title || `${input.platform} ${type}`,
    type: type,
    platform: input.platform,
    content: contentJson,
    status: input.status || "draft",
    generated_by_agent: input.generatedByAgent || "ai-generation",
    created_at: now,
    updated_at: now,
  };
  
  // Add optional fields
  if (input.scheduledFor) {
    insertData.scheduled_for = input.scheduledFor;
  }
  
  if (input.imageUrl) {
    insertData.media_urls = [input.imageUrl];
  }
  
  if (input.brandFidelityScore !== undefined) {
    insertData.bfs_score = input.brandFidelityScore;
  }
  
  if (input.createdBy) {
    insertData.created_by = input.createdBy;
  }
  
  try {
    const { data, error } = await supabase
      .from("content_items")
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      logger.error("Failed to save content item", new Error(error.message), {
        brandId: input.brandId,
        contentType: input.contentType,
        platform: input.platform,
        errorCode: error.code,
        errorDetails: error.details,
      });
      throw new Error(`Failed to save content item: ${error.message}`);
    }
    
    if (!data) {
      throw new Error("Content item insert returned no data");
    }
    
    logger.info("Content item saved successfully", {
      id: data.id,
      brandId: input.brandId,
      platform: input.platform,
      contentType: type,
    });
    
    return {
      id: data.id,
      brandId: data.brand_id,
      title: data.title,
      content: typeof data.content === "object" && data.content !== null 
        ? (data.content as Record<string, unknown>).body as string || ""
        : "",
      platform: data.platform || input.platform,
      contentType: data.type,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error("Error saving content item", error, {
      brandId: input.brandId,
      contentType: input.contentType,
    });
    throw error;
  }
}

/**
 * Save multiple content items in a batch
 * 
 * @param items - Array of content items to save
 * @returns Array of saved content items
 */
export async function saveContentItemsBatch(items: SaveContentItemInput[]): Promise<SavedContentItem[]> {
  const savedItems: SavedContentItem[] = [];
  
  for (const item of items) {
    try {
      const saved = await saveContentItem(item);
      savedItems.push(saved);
    } catch (error) {
      logger.warn("Failed to save item in batch, continuing", {
        brandId: item.brandId,
        title: item.title,
        error: error instanceof Error ? error.message : String(error),
      });
      // Continue with other items
    }
  }
  
  return savedItems;
}

/**
 * Get content items for a brand
 * 
 * @param brandId - Brand ID to filter by
 * @param options - Query options
 * @returns Array of content items
 */
export async function getContentItemsForBrand(
  brandId: string,
  options?: {
    status?: string;
    platform?: string;
    limit?: number;
    offset?: number;
  }
): Promise<SavedContentItem[]> {
  const { status, platform, limit = 50, offset = 0 } = options || {};
  
  let query = supabase
    .from("content_items")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (status) {
    query = query.eq("status", status);
  }
  
  if (platform) {
    query = query.or(`platform.eq.${platform},content->>platform.eq.${platform}`);
  }
  
  const { data, error } = await query;
  
  if (error) {
    logger.error("Failed to get content items", new Error(error.message), {
      brandId,
      status,
      platform,
    });
    throw new Error(`Failed to get content items: ${error.message}`);
  }
  
  return (data || []).map((item): SavedContentItem => ({
    id: item.id,
    brandId: item.brand_id,
    title: item.title || "",
    content: typeof item.content === "object" && item.content !== null
      ? (item.content as Record<string, unknown>).body as string || ""
      : "",
    platform: item.platform || "",
    contentType: item.type || "",
    status: item.status || "draft",
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));
}

/**
 * Update a content item's status
 * 
 * @param contentId - Content item ID
 * @param status - New status
 * @returns Updated content item
 */
export async function updateContentItemStatus(
  contentId: string,
  status: "draft" | "pending_review" | "scheduled" | "published" | "errored"
): Promise<SavedContentItem> {
  const { data, error } = await supabase
    .from("content_items")
    .update({ 
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contentId)
    .select()
    .single();
  
  if (error) {
    logger.error("Failed to update content item status", new Error(error.message), {
      contentId,
      status,
    });
    throw new Error(`Failed to update content item status: ${error.message}`);
  }
  
  if (!data) {
    throw new Error("Content item not found");
  }
  
  return {
    id: data.id,
    brandId: data.brand_id,
    title: data.title || "",
    content: typeof data.content === "object" && data.content !== null
      ? (data.content as Record<string, unknown>).body as string || ""
      : "",
    platform: data.platform || "",
    contentType: data.type || "",
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

