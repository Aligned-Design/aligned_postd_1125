/**
 * Client Settings API routes
 * Manages email preferences, notification settings, and account preferences
 * Now uses Supabase database for persistence
 */

import { RequestHandler } from "express";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import {
  ClientSettings,
  EmailPreferences,
  UpdateClientSettingsSchema,
  DEFAULT_CLIENT_SETTINGS,
  UnsubscribeRequest,
  EmailNotificationType,
} from "@shared/client-settings";
import { logAuditAction } from "../lib/audit-logger";
import {
  clientSettings as dbClientSettings,
  ClientSettingsRecord,
} from "../lib/dbClient";
import crypto from "crypto";

/**
 * Helper function to convert database record to API response format
 */
function dbRecordToClientSettings(record: ClientSettingsRecord): ClientSettings {
  return {
    id: record.id,
    clientId: record.client_id,
    brandId: record.brand_id,
    emailPreferences:
      (record.email_preferences as unknown as EmailPreferences) || DEFAULT_CLIENT_SETTINGS.emailPreferences,
    timezone: record.timezone,
    language: record.language as 'en' | 'es' | 'fr' | 'de',
    unsubscribeToken: record.unsubscribe_token,
    unsubscribedFromAll: record.unsubscribed_from_all,
    unsubscribedTypes: (record.unsubscribed_types || []) as EmailNotificationType[],
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    lastModifiedBy: record.last_modified_by,
  };
}

/**
 * Helper function to convert API input to database format
 */
function _clientSettingsToDbRecord(settings: Partial<ClientSettings>): unknown {
  return {
    client_id: settings.clientId,
    brand_id: settings.brandId,
    email_preferences: settings.emailPreferences,
    timezone: settings.timezone,
    language: settings.language,
    unsubscribe_token: settings.unsubscribeToken,
    unsubscribed_from_all: settings.unsubscribedFromAll,
    unsubscribed_types: settings.unsubscribedTypes,
    last_modified_by: settings.lastModifiedBy,
  };
}

/**
 * GET /api/client/settings
 * Retrieve client settings for current user
 */
export const getClientSettings: RequestHandler = async (req, res) => {
  try {
    const clientId = req.headers["x-client-id"] as string;
    const brandId = req.headers["x-brand-id"] as string;

    if (!clientId || !brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Missing required headers: x-client-id, x-brand-id",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    let settings = await dbClientSettings.get(clientId, brandId);

    if (!settings) {
      // Create default settings if not found
      const defaultSettings = {
        client_id: clientId,
        brand_id: brandId,
        email_preferences:
          DEFAULT_CLIENT_SETTINGS.emailPreferences as unknown as Record<
            string,
            unknown
          >,
        timezone: DEFAULT_CLIENT_SETTINGS.timezone,
        language: DEFAULT_CLIENT_SETTINGS.language,
        unsubscribed_from_all: false,
        unsubscribed_types: [],
      };
      settings = await dbClientSettings.create(defaultSettings);
    }

    const apiSettings = dbRecordToClientSettings(settings);

    (res as any).json({
      success: true,
      settings: apiSettings,
    });
  } catch (error) {
    console.error("[Client Settings] Get error:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : "Failed to retrieve settings",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
};

/**
 * PUT /api/client/settings
 * Update client settings
 */
export const updateClientSettings: RequestHandler = async (req, res) => {
  try {
    const clientId = req.headers["x-client-id"] as string;
    const brandId = req.headers["x-brand-id"] as string;
    const userId = req.headers["x-user-id"] as string;
    const userEmail = req.headers["x-user-email"] as string;

    if (!clientId || !brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Missing required headers: x-client-id, x-brand-id",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Validate update payload
    const validationResult = UpdateClientSettingsSchema.safeParse(req.body);
    if (!validationResult.success) {
      const validationErrors = validationResult.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
        code: e.code,
      }));
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Request validation failed",
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        "warning",
        { validationErrors },
        "Please review the validation errors and retry your request"
      );
    }

    // Get current settings or create defaults
    let currentSettings = await dbClientSettings.get(clientId, brandId);
    if (!currentSettings) {
      currentSettings = await dbClientSettings.create({
        client_id: clientId,
        brand_id: brandId,
        email_preferences:
          DEFAULT_CLIENT_SETTINGS.emailPreferences as unknown as Record<
            string,
            unknown
          >,
        timezone: DEFAULT_CLIENT_SETTINGS.timezone,
        language: DEFAULT_CLIENT_SETTINGS.language,
        unsubscribed_from_all: false,
        unsubscribed_types: [],
      });
    }

    // Merge updates
    const updates = validationResult.data;
    const mergedUpdates = {
      timezone: updates.timezone,
      language: updates.language,
      email_preferences: {
        ...currentSettings.email_preferences,
        ...(updates.emailPreferences || {}),
      },
      unsubscribed_types:
        updates.unsubscribedTypes || currentSettings.unsubscribed_types,
      last_modified_by: userEmail,
    };

    // Update in database
    const updatedSettings = await dbClientSettings.update(
      clientId,
      brandId,
      mergedUpdates,
    );
    const apiSettings = dbRecordToClientSettings(updatedSettings);

    // Log the change
    await logAuditAction(
      brandId,
      "settings",
      userId || "system",
      userEmail || "system",
      "SETTINGS_UPDATED",
      {
        changes: {
          emailPreferences: updates.emailPreferences ? true : false,
          timezone: updates.timezone ? true : false,
          language: updates.language ? true : false,
        },
      },
    );

    (res as any).json({
      success: true,
      settings: apiSettings,
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("[Client Settings] Update error:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : "Failed to update settings",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
};

/**
 * POST /api/client/settings/email-preferences
 * Update email preferences only
 */
export const updateEmailPreferences: RequestHandler = async (req, res) => {
  try {
    const clientId = req.headers["x-client-id"] as string;
    const brandId = req.headers["x-brand-id"] as string;
    const userId = req.headers["x-user-id"] as string;
    const userEmail = req.headers["x-user-email"] as string;

    // Get current settings or create defaults
    let currentSettings = await dbClientSettings.get(clientId, brandId);
    if (!currentSettings) {
      currentSettings = await dbClientSettings.create({
        client_id: clientId,
        brand_id: brandId,
        email_preferences:
          DEFAULT_CLIENT_SETTINGS.emailPreferences as unknown as Record<
            string,
            unknown
          >,
        timezone: DEFAULT_CLIENT_SETTINGS.timezone,
        language: DEFAULT_CLIENT_SETTINGS.language,
        unsubscribed_from_all: false,
        unsubscribed_types: [],
      });
    }

    // Merge email preferences
    const updatedPreferences = {
      ...currentSettings.email_preferences,
      ...req.body,
    };

    // Update in database
    const updatedSettings = await dbClientSettings.update(clientId, brandId, {
      email_preferences: updatedPreferences as unknown as Record<
        string,
        unknown
      >,
      last_modified_by: userEmail,
    });
    const apiSettings = dbRecordToClientSettings(updatedSettings);

    // Log the change
    await logAuditAction(
      brandId,
      "settings",
      userId || "system",
      userEmail || "system",
      "EMAIL_PREFERENCES_UPDATED",
      {
        preferences: updatedPreferences,
      },
    );

    (res as any).json({
      success: true,
      settings: apiSettings,
    });
  } catch (error) {
    console.error("[Client Settings] Email preferences error:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error
        ? error.message
        : "Failed to update email preferences",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
};

/**
 * POST /api/client/settings/generate-unsubscribe-link
 * Generate unsubscribe link for client
 */
export const generateUnsubscribeLink: RequestHandler = async (req, res) => {
  try {
    const clientId = req.headers["x-client-id"] as string;
    const brandId = req.headers["x-brand-id"] as string;

    // Get current settings or create defaults
    let currentSettings = await dbClientSettings.get(clientId, brandId);
    if (!currentSettings) {
      currentSettings = await dbClientSettings.create({
        client_id: clientId,
        brand_id: brandId,
        email_preferences:
          DEFAULT_CLIENT_SETTINGS.emailPreferences as unknown as Record<
            string,
            unknown
          >,
        timezone: DEFAULT_CLIENT_SETTINGS.timezone,
        language: DEFAULT_CLIENT_SETTINGS.language,
        unsubscribed_from_all: false,
        unsubscribed_types: [],
      });
    }

    // Generate secure unsubscribe token
    const unsubscribeToken = crypto.randomBytes(32).toString("hex");

    // Update in database
    const __updatedSettings = await dbClientSettings.update(clientId, brandId, {
      unsubscribe_token: unsubscribeToken,
    });

    // In production, this would be a full URL with client domain
    const unsubscribeUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/unsubscribe?token=${unsubscribeToken}`;

    (res as any).json({
      success: true,
      unsubscribeUrl,
      token: unsubscribeToken,
    });
  } catch (error) {
    console.error("[Client Settings] Generate unsubscribe error:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error
        ? error.message
        : "Failed to generate unsubscribe link",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
};

/**
 * POST /api/client/unsubscribe
 * Process unsubscribe request (can be called without authentication for email links)
 */
export const unsubscribeFromEmails: RequestHandler = async (req, res) => {
  try {
    const { unsubscribeToken, fromType } = req.body as UnsubscribeRequest;

    if (!unsubscribeToken) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Unsubscribe token is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Find settings by token
    const settings =
      await dbClientSettings.findByUnsubscribeToken(unsubscribeToken);

    if (!settings) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Invalid or expired unsubscribe token",
        HTTP_STATUS.NOT_FOUND,
        "info"
      );
    }

    let updatePayload: unknown;

    if (fromType) {
      // Unsubscribe from specific notification type
      const unsubscribedTypes = new Set(settings.unsubscribed_types || []);
      unsubscribedTypes.add(fromType);

      updatePayload = {
        unsubscribed_types: Array.from(
          unsubscribedTypes,
        ) as EmailNotificationType[],
      };
    } else {
      // Unsubscribe from all
      updatePayload = {
        unsubscribed_from_all: true,
        unsubscribed_types: [
          "approvals_needed",
          "approval_reminders",
          "publish_failures",
          "publish_success",
          "weekly_digest",
          "daily_digest",
        ] as EmailNotificationType[],
      };
    }

    // Update in database
    const updatedSettings = await dbClientSettings.update(
      settings.client_id,
      settings.brand_id,
      updatePayload,
    );
    const apiSettings = dbRecordToClientSettings(updatedSettings);

    (res as any).json({
      success: true,
      message: fromType
        ? `Unsubscribed from ${fromType}`
        : "Unsubscribed from all email notifications",
      unsubscribedFromAll: apiSettings.unsubscribedFromAll,
      unsubscribedTypes: apiSettings.unsubscribedTypes,
    });
  } catch (error) {
    console.error("[Client Settings] Unsubscribe error:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error
        ? error.message
        : "Failed to process unsubscribe",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
};

/**
 * POST /api/client/settings/resubscribe
 * Resubscribe to email notifications
 */
export const resubscribeToEmails: RequestHandler = async (req, res) => {
  try {
    const clientId = req.headers["x-client-id"] as string;
    const brandId = req.headers["x-brand-id"] as string;
    const { notificationType } = req.body;

    // Get current settings
    const settings = await dbClientSettings.get(clientId, brandId);

    if (!settings) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Client settings not found",
        HTTP_STATUS.NOT_FOUND,
        "info"
      );
    }

    const unsubscribedTypes = new Set(settings.unsubscribed_types || []);
    if (notificationType) {
      unsubscribedTypes.delete(notificationType);
    } else {
      // Resubscribe to all
      unsubscribedTypes.clear();
    }

    // Update in database
    const updatedSettings = await dbClientSettings.update(clientId, brandId, {
      unsubscribed_from_all:
        unsubscribedTypes.size === 0 ? false : settings.unsubscribed_from_all,
      unsubscribed_types: Array.from(
        unsubscribedTypes,
      ) as EmailNotificationType[],
    });
    const apiSettings = dbRecordToClientSettings(updatedSettings);

    (res as any).json({
      success: true,
      message: notificationType
        ? `Resubscribed to ${notificationType}`
        : "Resubscribed to all notifications",
      settings: apiSettings,
    });
  } catch (error) {
    console.error("[Client Settings] Resubscribe error:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : "Failed to resubscribe",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
};

/**
 * GET /api/client/settings/verify-unsubscribe
 * Verify if unsubscribe token is valid
 */
export const verifyUnsubscribeToken: RequestHandler = async (req, res) => {
  try {
    const { token } = req.query as { token: string };

    if (!token) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Token is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Find settings by token
    const settings = await dbClientSettings.findByUnsubscribeToken(token);

    if (settings) {
      return (res as any).json({
        valid: true,
        clientId: settings.client_id,
        unsubscribedTypes: settings.unsubscribed_types,
        unsubscribedFromAll: settings.unsubscribed_from_all,
      });
    }

    (res as any).json({
      valid: false,
    });
  } catch (error) {
    console.error("[Client Settings] Verify token error:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : "Failed to verify token",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support"
    );
  }
};
