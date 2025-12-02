/**
 * Preferences Database Service
 * Handles user preferences per brand (notifications, UI settings, etc)
 */

import { supabase } from "./supabase";
import { AppError } from "./error-middleware";
import { ErrorCode, HTTP_STATUS } from "./error-responses";

/**
 * User preferences record
 */
export interface UserPreferencesRecord {
  id: string;
  user_id: string;
  brand_id: string;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Default preferences structure
 */
export const DEFAULT_PREFERENCES = {
  notifications: {
    emailNotifications: true,
    pushNotifications: false,
    slackNotifications: false,
    weeklyDigest: true,
    approvalReminders: true,
    taskDueReminders: true,
    commentMentions: true,
  },
  ui: {
    theme: "light",
    language: "en",
    timezone: "UTC",
    compactMode: false,
    sidebar: "expanded",
  },
  publishing: {
    autoSaveDrafts: true,
    draftAutoSaveInterval: 30000,
    defaultScheduleTime: "09:00",
    defaultPlatforms: [],
  },
  analytics: {
    defaultMetric: "engagement",
    dateRange: "last_30_days",
    refreshInterval: 300000,
  },
};

/**
 * Preferences Database Service Class
 */
export class PreferencesDBService {
  /**
   * Get preferences for a user and brand
   * Returns default preferences if none exist
   */
  async getPreferences(
    userId: string,
    brandId: string
  ): Promise<Record<string, unknown>> {
    const { data, error } = await supabase
      .from("user_preferences")
      .select("preferences")
      .eq("user_id", userId)
      .eq("brand_id", brandId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch preferences",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    // Return user preferences merged with defaults
    if (data?.preferences) {
      return {
        ...DEFAULT_PREFERENCES,
        ...data.preferences,
      };
    }

    // Return defaults if no preferences exist
    return DEFAULT_PREFERENCES;
  }

  /**
   * Update preferences for a user and brand
   */
  async updatePreferences(
    userId: string,
    brandId: string,
    preferences: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    // First, try to get existing preferences
    const { data: existingData, error: fetchError } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .eq("brand_id", brandId)
      .maybeSingle();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch existing preferences",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    let result: UserPreferencesRecord;

    if (existingData) {
      // Update existing preferences (deep merge)
      const mergedPreferences = this.deepMerge(
        existingData.preferences || {},
        preferences
      );

      const { data, error } = await supabase
        .from("user_preferences")
        .update({ preferences: mergedPreferences })
        .eq("user_id", userId)
        .eq("brand_id", brandId)
        .select()
        .single();

      if (error) {
        throw new AppError(
          ErrorCode.DATABASE_ERROR,
          "Failed to update preferences",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "critical"
        );
      }

      result = data as UserPreferencesRecord;
    } else {
      // Create new preferences
      const { data, error } = await supabase
        .from("user_preferences")
        .insert({
          user_id: userId,
          brand_id: brandId,
          preferences: {
            ...DEFAULT_PREFERENCES,
            ...preferences,
          },
        })
        .select()
        .single();

      if (error) {
        throw new AppError(
          ErrorCode.DATABASE_ERROR,
          "Failed to create preferences",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "critical",
          { details: error.message }
        );
      }

      result = data as UserPreferencesRecord;
    }

    // Return merged preferences
    return {
      ...DEFAULT_PREFERENCES,
      ...result.preferences,
    };
  }

  /**
   * Export preferences in JSON format
   */
  async exportPreferences(
    userId: string,
    brandId: string
  ): Promise<{
    format: string;
    timestamp: string;
    userId: string;
    brandId: string;
    preferences: Record<string, unknown>;
  }> {
    const prefs = await this.getPreferences(userId, brandId);

    return {
      format: "json",
      timestamp: new Date().toISOString(),
      userId,
      brandId,
      preferences: prefs,
    };
  }

  /**
   * Delete/reset preferences for a user and brand
   */
  async deletePreferences(userId: string, brandId: string): Promise<void> {
    const { error } = await supabase
      .from("user_preferences")
      .delete()
      .eq("user_id", userId)
      .eq("brand_id", brandId);

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to delete preferences",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }
  }

  /**
   * Bulk get preferences for multiple brands
   */
  async getUserPreferencesAcrossBrands(
    userId: string
  ): Promise<Array<{ brandId: string; preferences: Record<string, unknown> }>> {
    const { data, error } = await supabase
      .from("user_preferences")
      .select("brand_id, preferences")
      .eq("user_id", userId);

    if (error) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch user preferences",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    // Type guard for database row
    type BrandPreferencesRow = { brand_id: string; preferences: Record<string, unknown> };
    return ((data || []) as BrandPreferencesRow[]).map((item) => ({
      brandId: item.brand_id,
      preferences: {
        ...DEFAULT_PREFERENCES,
        ...item.preferences,
      },
    }));
  }

  /**
   * Get notification preferences for a user and brand
   */
  async getNotificationPreferences(
    userId: string,
    brandId: string
  ): Promise<Record<string, unknown>> {
    const prefs = await this.getPreferences(userId, brandId);
    return (prefs && typeof prefs === 'object' && 'notifications' in prefs && prefs.notifications && typeof prefs.notifications === 'object') 
      ? prefs.notifications as Record<string, unknown>
      : DEFAULT_PREFERENCES.notifications;
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    userId: string,
    brandId: string,
    notificationPrefs: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const updated = await this.updatePreferences(userId, brandId, {
      notifications: notificationPrefs,
    });
    return (updated && typeof updated === 'object' && 'notifications' in updated && updated.notifications && typeof updated.notifications === 'object')
      ? updated.notifications as Record<string, unknown>
      : {};
  }

  /**
   * Check if a notification type is enabled for user
   */
  async isNotificationEnabled(
    userId: string,
    brandId: string,
    notificationType: string
  ): Promise<boolean> {
    const prefs = await this.getNotificationPreferences(userId, brandId);
    const value = this.getNestedValue(prefs, notificationType);
    return value === true || value === undefined; // Default to enabled
  }

  /**
   * Deep merge utility for nested preferences
   */
  private deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>
  ): Record<string, unknown> {
    const result = { ...target };

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        if (
          typeof source[key] === "object" &&
          source[key] !== null &&
          typeof target[key] === "object" &&
          target[key] !== null &&
          !Array.isArray(source[key]) &&
          !Array.isArray(target[key])
        ) {
          result[key] = this.deepMerge(
            target[key] as Record<string, unknown>,
            source[key] as Record<string, unknown>
          );
        } else {
          result[key] = source[key];
        }
      }
    }

    return result;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split(".").reduce((current: unknown, prop) => {
      return current?.[prop];
    }, obj);
  }
}

/**
 * Singleton instance
 */
export const preferencesDB = new PreferencesDBService();
