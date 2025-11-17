/**
 * White Label Database Service
 * Handles agency white-label configurations and branding
 */

import { supabase } from "./supabase";
import { AppError } from "./error-middleware";
import { ErrorCode, HTTP_STATUS } from "./error-responses";

/**
 * White label configuration record
 */
export interface WhiteLabelConfigRecord {
  id: string;
  agency_id: string;
  domain: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  custom_css?: string;
  custom_html_header?: string;
  custom_html_footer?: string;
  favicon_url?: string;
  company_name?: string;
  support_email?: string;
  support_phone?: string;
  terms_url?: string;
  privacy_url?: string;
  metadata?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * White Label Database Service Class
 */
export class WhiteLabelDBService {
  /**
   * Create a new white label configuration
   */
  async createWhiteLabelConfig(
    agencyId: string,
    domain: string,
    config: Partial<WhiteLabelConfigRecord>
  ): Promise<WhiteLabelConfigRecord> {
    // Validate domain format
    if (!this.isValidDomain(domain)) {
      throw new AppError(
        ErrorCode.INVALID_FORMAT,
        "Invalid domain format",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        { domain },
        "Domain must be a valid format (e.g., agency.com or subdomain.agency.com)"
      );
    }

    const { data, error } = await supabase
      .from("white_label_configs")
      .insert({
        agency_id: agencyId,
        domain,
        logo_url: config.logo_url,
        primary_color: config.primary_color,
        secondary_color: config.secondary_color,
        custom_css: config.custom_css,
        custom_html_header: config.custom_html_header,
        custom_html_footer: config.custom_html_footer,
        favicon_url: config.favicon_url,
        company_name: config.company_name,
        support_email: config.support_email,
        support_phone: config.support_phone,
        terms_url: config.terms_url,
        privacy_url: config.privacy_url,
        metadata: config.metadata,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation
      if (error.code === "23505") {
        throw new AppError(
          ErrorCode.DUPLICATE_RESOURCE,
          "White label config already exists for this domain",
          HTTP_STATUS.CONFLICT,
          "warning",
          { domain },
          "This domain is already configured. Use a different domain or delete the existing config."
        );
      }

      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to create white label config",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        { details: error.message }
      );
    }

    return data as WhiteLabelConfigRecord;
  }

  /**
   * Get white label config by agency ID
   */
  async getWhiteLabelConfig(agencyId: string): Promise<WhiteLabelConfigRecord | null> {
    const { data, error } = await supabase
      .from("white_label_configs")
      .select("*")
      .eq("agency_id", agencyId)
      .eq("is_active", true)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch white label config",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    return data as WhiteLabelConfigRecord | null;
  }

  /**
   * Get white label config by domain (for routing)
   */
  async getConfigByDomain(domain: string): Promise<WhiteLabelConfigRecord | null> {
    const { data, error } = await supabase
      .from("white_label_configs")
      .select("*")
      .eq("domain", domain)
      .eq("is_active", true)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch white label config by domain",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    return data as WhiteLabelConfigRecord | null;
  }

  /**
   * Get white label config by ID
   */
  async getWhiteLabelConfigById(configId: string): Promise<WhiteLabelConfigRecord | null> {
    const { data, error } = await supabase
      .from("white_label_configs")
      .select("*")
      .eq("id", configId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch white label config",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    return data as WhiteLabelConfigRecord | null;
  }

  /**
   * Update white label configuration
   */
  async updateWhiteLabelConfig(
    agencyId: string,
    updates: Partial<WhiteLabelConfigRecord>
  ): Promise<WhiteLabelConfigRecord> {
    // Validate domain if being updated
    if (updates.domain && !this.isValidDomain(updates.domain)) {
      throw new AppError(
        ErrorCode.INVALID_FORMAT,
        "Invalid domain format",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    const updateData: Record<string, unknown> = {};

    if (updates.domain) updateData.domain = updates.domain;
    if (updates.logo_url) updateData.logo_url = updates.logo_url;
    if (updates.primary_color) updateData.primary_color = updates.primary_color;
    if (updates.secondary_color) updateData.secondary_color = updates.secondary_color;
    if (updates.custom_css !== undefined) updateData.custom_css = updates.custom_css;
    if (updates.custom_html_header !== undefined)
      updateData.custom_html_header = updates.custom_html_header;
    if (updates.custom_html_footer !== undefined)
      updateData.custom_html_footer = updates.custom_html_footer;
    if (updates.favicon_url !== undefined) updateData.favicon_url = updates.favicon_url;
    if (updates.company_name !== undefined) updateData.company_name = updates.company_name;
    if (updates.support_email !== undefined)
      updateData.support_email = updates.support_email;
    if (updates.support_phone !== undefined)
      updateData.support_phone = updates.support_phone;
    if (updates.terms_url !== undefined) updateData.terms_url = updates.terms_url;
    if (updates.privacy_url !== undefined) updateData.privacy_url = updates.privacy_url;
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

    const { data, error } = await supabase
      .from("white_label_configs")
      .update(updateData)
      .eq("agency_id", agencyId)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new AppError(
          ErrorCode.DUPLICATE_RESOURCE,
          "Domain is already in use",
          HTTP_STATUS.CONFLICT,
          "warning"
        );
      }

      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to update white label config",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    return data as WhiteLabelConfigRecord;
  }

  /**
   * Delete white label configuration (soft delete)
   */
  async deleteWhiteLabelConfig(agencyId: string): Promise<void> {
    const { error } = await supabase
      .from("white_label_configs")
      .update({ is_active: false })
      .eq("agency_id", agencyId);

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to delete white label config",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }
  }

  /**
   * Get all white label configs for a list of agencies
   */
  async getConfigsForAgencies(
    agencyIds: string[]
  ): Promise<Array<{ agencyId: string; config: WhiteLabelConfigRecord }>> {
    const { data, error } = await supabase
      .from("white_label_configs")
      .select("*")
      .in("agency_id", agencyIds)
      .eq("is_active", true);

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch white label configs",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    return (data || []).map((config: WhiteLabelConfigRecord) => ({
      agencyId: config.agency_id,
      config,
    }));
  }

  /**
   * Check if a domain is already in use
   */
  async isDomainInUse(domain: string, excludeAgencyId?: string): Promise<boolean> {
    let query = supabase
      .from("white_label_configs")
      .select("id", { count: "exact" })
      .eq("domain", domain)
      .eq("is_active", true);

    if (excludeAgencyId) {
      query = query.neq("agency_id", excludeAgencyId);
    }

    const { data, error } = await query.limit(1);

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to check domain availability",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    return (data?.length || 0) > 0;
  }

  /**
   * Validate domain format
   */
  private isValidDomain(domain: string): boolean {
    // Simple domain validation
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
    return domainRegex.test(domain) && domain.length <= 253;
  }

  /**
   * Validate color format (hex)
   */
  isValidColor(color: string): boolean {
    const hexRegex = /^#[0-9A-F]{6}$/i;
    return hexRegex.test(color);
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

/**
 * Singleton instance
 */
export const whiteLabelDB = new WhiteLabelDBService();
