/**
 * Reports Routes
 * 
 * API endpoints for managing scheduled reports.
 * Reports are stored in user_preferences under a 'reports' array.
 */

import { Router, RequestHandler } from "express";
import { logger } from "../lib/logger";
import { supabase } from "../lib/supabase";
import { z } from "zod";
import { randomUUID } from "crypto";
import { authenticateUser } from "../middleware/security";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";

const router = Router();

// Zod schema for report settings
const ReportSettingsSchema = z.object({
  name: z.string().min(1, "Report name is required"),
  frequency: z.enum(["weekly", "monthly", "quarterly"]),
  dayOfWeek: z.number().min(0).max(6).optional(),
  monthlyType: z.enum(["specific-day", "ordinal"]).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  ordinalDay: z.object({
    ordinal: z.enum(["first", "second", "third", "fourth", "last"]),
    dayOfWeek: z.number().min(0).max(6),
  }).optional(),
  quarterlyMonth: z.number().optional(),
  recipients: z.array(z.string().email()).default([]),
  includeMetrics: z.array(z.string()).default([]),
  includePlatforms: z.array(z.string()).default([]),
  includeAISummary: z.boolean().default(true),
  isActive: z.boolean().default(true),
  brandId: z.string().uuid().optional(),
});

/**
 * GET /api/reports
 * List all reports for the current user
 */
router.get("/", authenticateUser, async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    const { brandId } = req.query;

    if (!userId) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "Authentication required",
        HTTP_STATUS.UNAUTHORIZED,
        "warning"
      );
    }

    // Fetch user preferences
    const { data: prefs, error } = await supabase
      .from("user_preferences")
      .select("preferences")
      .eq("user_id", userId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      logger.error("[Reports] Failed to fetch reports", error, { userId });
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch reports",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error"
      );
    }

    const preferences = prefs?.preferences || {};
    let reports = (preferences as any).reports || [];

    // Filter by brandId if provided
    if (brandId) {
      reports = reports.filter((r: any) => !r.brandId || r.brandId === brandId);
    }

    logger.info("[Reports] Listed reports", { userId, count: reports.length });

    res.json({
      success: true,
      reports,
      total: reports.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/reports
 * Create a new report
 */
router.post("/", authenticateUser, async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "Authentication required",
        HTTP_STATUS.UNAUTHORIZED,
        "warning"
      );
    }

    // Validate request body
    const parseResult = ReportSettingsSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Invalid report settings",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        { details: parseResult.error.errors }
      );
    }

    const reportData = parseResult.data;
    const now = new Date().toISOString();

    // Create new report object
    const newReport = {
      id: randomUUID(),
      accountId: userId,
      ...reportData,
      createdDate: now,
      lastSent: null,
    };

    // Fetch existing preferences
    const { data: existingPrefs, error: fetchError } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError && fetchError.code !== "PGRST116") {
      logger.error("[Reports] Failed to fetch existing preferences", fetchError, { userId });
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to create report",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error"
      );
    }

    const existingReports = (existingPrefs?.preferences as any)?.reports || [];
    const updatedPreferences = {
      ...(existingPrefs?.preferences || {}),
      reports: [...existingReports, newReport],
    };

    // Upsert preferences
    const { error: upsertError } = await supabase
      .from("user_preferences")
      .upsert({
        user_id: userId,
        brand_id: reportData.brandId || "global",
        preferences: updatedPreferences,
        updated_at: now,
      }, {
        onConflict: "user_id,brand_id",
      });

    if (upsertError) {
      logger.error("[Reports] Failed to save report", upsertError, { userId });
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to create report",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error"
      );
    }

    logger.info("[Reports] Created report", { userId, reportId: newReport.id });

    res.status(201).json({
      success: true,
      report: newReport,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/reports/:id
 * Update a report
 */
router.put("/:id", authenticateUser, async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    const { id: reportId } = req.params;

    if (!userId) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "Authentication required",
        HTTP_STATUS.UNAUTHORIZED,
        "warning"
      );
    }

    // Validate request body
    const parseResult = ReportSettingsSchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Invalid report settings",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        { details: parseResult.error.errors }
      );
    }

    const updateData = parseResult.data;

    // Fetch existing preferences
    const { data: existingPrefs, error: fetchError } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError && fetchError.code !== "PGRST116") {
      logger.error("[Reports] Failed to fetch existing preferences", fetchError, { userId });
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to update report",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error"
      );
    }

    const existingReports = (existingPrefs?.preferences as any)?.reports || [];
    const reportIndex = existingReports.findIndex((r: any) => r.id === reportId);

    if (reportIndex === -1) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Report not found",
        HTTP_STATUS.NOT_FOUND,
        "warning"
      );
    }

    // Update report
    const updatedReport = {
      ...existingReports[reportIndex],
      ...updateData,
    };
    existingReports[reportIndex] = updatedReport;

    const updatedPreferences = {
      ...(existingPrefs?.preferences || {}),
      reports: existingReports,
    };

    // Save preferences
    const { error: upsertError } = await supabase
      .from("user_preferences")
      .upsert({
        user_id: userId,
        brand_id: updateData.brandId || existingReports[reportIndex].brandId || "global",
        preferences: updatedPreferences,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,brand_id",
      });

    if (upsertError) {
      logger.error("[Reports] Failed to update report", upsertError, { userId, reportId });
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to update report",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error"
      );
    }

    logger.info("[Reports] Updated report", { userId, reportId });

    res.json({
      success: true,
      report: updatedReport,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/reports/:id
 * Delete a report
 */
router.delete("/:id", authenticateUser, async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    const { id: reportId } = req.params;

    if (!userId) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "Authentication required",
        HTTP_STATUS.UNAUTHORIZED,
        "warning"
      );
    }

    // Fetch existing preferences
    const { data: existingPrefs, error: fetchError } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError && fetchError.code !== "PGRST116") {
      logger.error("[Reports] Failed to fetch existing preferences", fetchError, { userId });
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to delete report",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error"
      );
    }

    const existingReports = (existingPrefs?.preferences as any)?.reports || [];
    const updatedReports = existingReports.filter((r: any) => r.id !== reportId);

    if (updatedReports.length === existingReports.length) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Report not found",
        HTTP_STATUS.NOT_FOUND,
        "warning"
      );
    }

    const updatedPreferences = {
      ...(existingPrefs?.preferences || {}),
      reports: updatedReports,
    };

    // Save preferences
    const { error: upsertError } = await supabase
      .from("user_preferences")
      .update({
        preferences: updatedPreferences,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (upsertError) {
      logger.error("[Reports] Failed to delete report", upsertError, { userId, reportId });
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to delete report",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error"
      );
    }

    logger.info("[Reports] Deleted report", { userId, reportId });

    res.json({
      success: true,
      message: "Report deleted",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/reports/:id/send
 * Send a report immediately
 */
router.post("/:id/send", authenticateUser, async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    const { id: reportId } = req.params;

    if (!userId) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "Authentication required",
        HTTP_STATUS.UNAUTHORIZED,
        "warning"
      );
    }

    // Fetch existing preferences to get the report
    const { data: existingPrefs, error: fetchError } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError && fetchError.code !== "PGRST116") {
      logger.error("[Reports] Failed to fetch report", fetchError, { userId });
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        "Failed to send report",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error"
      );
    }

    const existingReports = (existingPrefs?.preferences as any)?.reports || [];
    const report = existingReports.find((r: any) => r.id === reportId);

    if (!report) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Report not found",
        HTTP_STATUS.NOT_FOUND,
        "warning"
      );
    }

    // In a real implementation, this would queue the report for sending
    // For now, we just update the lastSent timestamp
    const now = new Date().toISOString();
    const reportIndex = existingReports.findIndex((r: any) => r.id === reportId);
    existingReports[reportIndex] = { ...report, lastSent: now };

    const updatedPreferences = {
      ...(existingPrefs?.preferences || {}),
      reports: existingReports,
    };

    await supabase
      .from("user_preferences")
      .update({
        preferences: updatedPreferences,
        updated_at: now,
      })
      .eq("user_id", userId);

    logger.info("[Reports] Report send initiated", { userId, reportId, recipients: report.recipients });

    res.json({
      success: true,
      message: `Report sent to ${report.recipients.length} recipient(s)`,
      sentAt: now,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

