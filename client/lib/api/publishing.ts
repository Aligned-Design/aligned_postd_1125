/**
 * Publishing & Scheduling API Functions
 */

import { apiGet, apiPost } from "../api";

export interface PublishJob {
  id: string;
  content_id: string;
  platform: string;
  scheduled_for: string;
  status: "pending" | "published" | "failed";
  created_at: string;
}

export interface SchedulePublishPayload {
  contentId: string;
  platform: string;
  scheduledFor: string;
  metadata?: Record<string, unknown>;
}

/**
 * Schedule content for publishing
 */
export async function schedulePublish(
  brandId: string,
  payload: SchedulePublishPayload
): Promise<PublishJob> {
  return apiPost<PublishJob>(`/api/brands/${brandId}/publish/schedule`, payload);
}

/**
 * Create and immediately publish content (alias for backward compatibility)
 */
export async function createPublishJob(
  brandId: string,
  payload: SchedulePublishPayload
): Promise<PublishJob> {
  return schedulePublish(brandId, payload);
}

/**
 * List publishing jobs for a brand
 */
export async function listPublishJobs(brandId: string): Promise<PublishJob[]> {
  const response = await apiGet<{ jobs: PublishJob[] }>(`/api/brands/${brandId}/publish/jobs`);
  return response.jobs || [];
}

