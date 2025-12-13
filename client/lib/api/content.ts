/**
 * Content API Functions
 */

import { apiGet, apiPost, apiPut, apiDelete } from "../api";

// Use Record<string, unknown> for ContentItem until proper type is exported from shared
export type ContentItem = Record<string, unknown>;

export interface ListContentFilters {
  status?: string;
  platform?: string;
  limit?: number;
  offset?: number;
}

export interface CreateContentPayload {
  brandId: string;
  type: string;
  content: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * List content items for a brand
 */
export async function listContentItems(
  brandId: string,
  filters?: ListContentFilters
): Promise<ContentItem[]> {
  const params = new URLSearchParams({ brandId });
  
  if (filters?.status) params.append('status', filters.status);
  if (filters?.platform) params.append('platform', filters.platform);
  if (filters?.limit) params.append('limit', String(filters.limit));
  if (filters?.offset) params.append('offset', String(filters.offset));
  
  const response = await apiGet<{ items: ContentItem[] }>(`/api/content-items?${params}`);
  return response.items || [];
}

/**
 * Get a single content item
 */
export async function getContentItem(contentId: string): Promise<ContentItem> {
  return apiGet<ContentItem>(`/api/content-items/${contentId}`);
}

/**
 * Create a new content item
 */
export async function createContentItem(payload: CreateContentPayload): Promise<ContentItem> {
  return apiPost<ContentItem>("/api/content-items", payload);
}

/**
 * Update a content item
 */
export async function updateContentItem(
  contentId: string,
  patch: Partial<CreateContentPayload>
): Promise<ContentItem> {
  return apiPut<ContentItem>(`/api/content-items/${contentId}`, patch);
}

/**
 * Delete a content item
 */
export async function deleteContentItem(contentId: string): Promise<void> {
  await apiDelete(`/api/content-items/${contentId}`);
}

