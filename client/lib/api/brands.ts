/**
 * Brand API Functions
 */

import { apiGet, apiPost, apiPut, apiDelete } from "../api";
import type { Brand } from "../supabase";

export interface CreateBrandPayload {
  name: string;
  slug: string;
  website_url?: string;
  industry?: string;
  description?: string;
  primary_color?: string;
}

export interface UpdateBrandPayload extends Partial<CreateBrandPayload> {
  id: string;
}

/**
 * List all brands for current user
 */
export async function listBrands(): Promise<Brand[]> {
  const response = await apiGet<{ brands: Brand[] }>("/api/brands");
  return response.brands || [];
}

/**
 * Get a single brand by ID
 */
export async function getBrand(brandId: string): Promise<Brand> {
  return apiGet<Brand>(`/api/brands/${brandId}`);
}

/**
 * Get brand guide/kit for a brand
 */
export async function getBrandKit(brandId: string): Promise<Record<string, unknown>> {
  return apiGet(`/api/brands/${brandId}/guide`);
}

/**
 * Get brand guide (alias for getBrandKit)
 */
export async function getBrandGuide(brandId: string): Promise<Record<string, unknown>> {
  return getBrandKit(brandId);
}

/**
 * Create a new brand
 */
export async function createBrand(payload: CreateBrandPayload): Promise<Brand> {
  return apiPost<Brand>("/api/brands", payload);
}

/**
 * Update an existing brand
 */
export async function updateBrand(brandId: string, payload: Partial<CreateBrandPayload>): Promise<Brand> {
  return apiPut<Brand>(`/api/brands/${brandId}`, payload);
}

/**
 * Delete a brand
 */
export async function deleteBrand(brandId: string): Promise<void> {
  await apiDelete(`/api/brands/${brandId}`);
}

