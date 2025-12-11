/**
 * Events Routes
 * 
 * API endpoints for managing brand events (campaigns, launches, promotions).
 * Events are stored in content_items table with type='event'.
 */

import { RequestHandler } from "express";
import { logger } from "../lib/logger";
import { supabase } from "../lib/supabase";
import { z } from "zod";
import { randomUUID } from "crypto";

// Zod schemas for validation
const EventPlatformSchema = z.object({
  platform: z.enum(["facebook", "google_business", "squarespace"]),
  isConnected: z.boolean(),
  syncStatus: z.enum(["synced", "pending", "failed", "not_linked"]),
  linkedDate: z.string().optional(),
  externalId: z.string().optional(),
});

const PromotionPostSchema = z.object({
  id: z.string(),
  type: z.enum(["before", "during", "after"]),
  title: z.string(),
  content: z.string(),
  platforms: z.array(z.enum(["facebook", "google_business", "squarespace"])),
  scheduledDate: z.string(),
  status: z.enum(["draft", "scheduled", "published"]),
});

const CreateEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().default(""),
  location: z.string().default(""),
  startDate: z.string(),
  startTime: z.string().default("00:00"),
  endDate: z.string(),
  endTime: z.string().default("23:59"),
  imageUrl: z.string().optional(),
  eventType: z.enum(["digital", "in_person", "promo"]),
  visibility: z.enum(["public", "private"]).default("public"),
  rsvpUrl: z.string().optional(),
  tags: z.array(z.string()).default([]),
  platforms: z.array(EventPlatformSchema).default([]),
  promotionSchedule: z.array(PromotionPostSchema).default([]),
  assignedCampaignId: z.string().optional(),
});

const UpdateEventSchema = CreateEventSchema.partial().extend({
  status: z.enum(["draft", "scheduled", "published", "live", "completed", "cancelled"]).optional(),
});

/**
 * List events for a brand
 */
export const listEvents: RequestHandler = async (req, res) => {
  try {
    const brandId = req.params.brandId;
    
    if (!brandId) {
      res.status(400).json({ error: "Brand ID is required" });
      return;
    }

    const { data: events, error } = await supabase
      .from("content_items")
      .select("*")
      .eq("brand_id", brandId)
      .eq("type", "event")
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("[Events] Failed to fetch events", error, { brandId });
      res.status(500).json({ error: "Failed to fetch events" });
      return;
    }

    // Transform content_items to Event format
    const transformedEvents = (events || []).map((item) => ({
      id: item.id,
      title: item.title,
      status: item.status || "draft",
      createdDate: item.created_at,
      updatedDate: item.updated_at,
      brand: brandId,
      ...(item.content as Record<string, unknown>),
    }));

    logger.info("[Events] Listed events", { brandId, count: transformedEvents.length });

    res.json({
      events: transformedEvents,
      total: transformedEvents.length,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    logger.error("[Events] Failed to list events", err instanceof Error ? err : new Error(errorMessage));
    res.status(500).json({
      error: "Failed to list events",
      message: errorMessage,
    });
  }
};

/**
 * Create a new event
 */
export const createEvent: RequestHandler = async (req, res) => {
  try {
    const brandId = req.params.brandId;
    
    if (!brandId) {
      res.status(400).json({ error: "Brand ID is required" });
      return;
    }

    // Validate request body
    const parseResult = CreateEventSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ 
        error: "Validation failed", 
        details: parseResult.error.errors 
      });
      return;
    }

    const eventData = parseResult.data;
    const eventId = randomUUID();
    const now = new Date().toISOString();

    // @supabase-scope-ok INSERT includes brand_id in payload
    // Store event in content_items with type='event'
    const { data: createdItem, error } = await supabase
      .from("content_items")
      .insert({
        id: eventId,
        brand_id: brandId,
        title: eventData.title,
        type: "event",
        status: "draft",
        content: {
          description: eventData.description,
          location: eventData.location,
          startDate: eventData.startDate,
          startTime: eventData.startTime,
          endDate: eventData.endDate,
          endTime: eventData.endTime,
          imageUrl: eventData.imageUrl,
          eventType: eventData.eventType,
          visibility: eventData.visibility,
          rsvpUrl: eventData.rsvpUrl,
          tags: eventData.tags,
          platforms: eventData.platforms,
          promotionSchedule: eventData.promotionSchedule,
          assignedCampaignId: eventData.assignedCampaignId,
          rsvpStats: { interested: 0, going: 0, views: 0 },
          engagementData: { impressions: 0, clicks: 0, shares: 0 },
        },
        platform: "event",
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      logger.error("[Events] Failed to create event", error, { brandId });
      res.status(500).json({ error: "Failed to create event" });
      return;
    }

    // Transform to Event format
    const event = {
      id: createdItem.id,
      title: createdItem.title,
      status: createdItem.status,
      createdDate: createdItem.created_at,
      updatedDate: createdItem.updated_at,
      brand: brandId,
      ...(createdItem.content as Record<string, unknown>),
    };

    logger.info("[Events] Created event", { brandId, eventId: event.id });

    res.status(201).json({ event });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    logger.error("[Events] Failed to create event", err instanceof Error ? err : new Error(errorMessage));
    res.status(500).json({
      error: "Failed to create event",
      message: errorMessage,
    });
  }
};

/**
 * Get a single event
 */
export const getEvent: RequestHandler = async (req, res) => {
  try {
    const { brandId, eventId } = req.params;
    
    if (!brandId || !eventId) {
      res.status(400).json({ error: "Brand ID and Event ID are required" });
      return;
    }

    const { data: item, error } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", eventId)
      .eq("brand_id", brandId)
      .eq("type", "event")
      .single();

    if (error || !item) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    const event = {
      id: item.id,
      title: item.title,
      status: item.status,
      createdDate: item.created_at,
      updatedDate: item.updated_at,
      brand: brandId,
      ...(item.content as Record<string, unknown>),
    };

    res.json({ event });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    logger.error("[Events] Failed to get event", err instanceof Error ? err : new Error(errorMessage));
    res.status(500).json({ error: "Failed to get event" });
  }
};

/**
 * Update an existing event
 */
export const updateEvent: RequestHandler = async (req, res) => {
  try {
    const { brandId, eventId } = req.params;
    
    if (!brandId || !eventId) {
      res.status(400).json({ error: "Brand ID and Event ID are required" });
      return;
    }

    // Validate request body
    const parseResult = UpdateEventSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ 
        error: "Validation failed", 
        details: parseResult.error.errors 
      });
      return;
    }

    const updateData = parseResult.data;

    // Fetch existing event
    const { data: existing, error: fetchError } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", eventId)
      .eq("brand_id", brandId)
      .eq("type", "event")
      .single();

    if (fetchError || !existing) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    const existingContent = existing.content as Record<string, unknown>;
    const now = new Date().toISOString();

    // Merge updates
    const { status, title, ...contentUpdates } = updateData;
    const updatedContent = { ...existingContent, ...contentUpdates };

    // @supabase-scope-ok ID-based lookup by event's primary key
    const { data: updatedItem, error: updateError } = await supabase
      .from("content_items")
      .update({
        title: title || existing.title,
        status: status || existing.status,
        content: updatedContent,
        updated_at: now,
      })
      .eq("id", eventId)
      .select()
      .single();

    if (updateError) {
      logger.error("[Events] Failed to update event", updateError, { brandId, eventId });
      res.status(500).json({ error: "Failed to update event" });
      return;
    }

    const event = {
      id: updatedItem.id,
      title: updatedItem.title,
      status: updatedItem.status,
      createdDate: updatedItem.created_at,
      updatedDate: updatedItem.updated_at,
      brand: brandId,
      ...(updatedItem.content as Record<string, unknown>),
    };

    logger.info("[Events] Updated event", { brandId, eventId });

    res.json({ event });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    logger.error("[Events] Failed to update event", err instanceof Error ? err : new Error(errorMessage));
    res.status(500).json({ error: "Failed to update event" });
  }
};

/**
 * Delete an event
 */
export const deleteEvent: RequestHandler = async (req, res) => {
  try {
    const { brandId, eventId } = req.params;
    
    if (!brandId || !eventId) {
      res.status(400).json({ error: "Brand ID and Event ID are required" });
      return;
    }

    const { error } = await supabase
      .from("content_items")
      .delete()
      .eq("id", eventId)
      .eq("brand_id", brandId)
      .eq("type", "event");

    if (error) {
      logger.error("[Events] Failed to delete event", error, { brandId, eventId });
      res.status(500).json({ error: "Failed to delete event" });
      return;
    }

    logger.info("[Events] Deleted event", { brandId, eventId });

    res.json({ success: true, message: "Event deleted" });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    logger.error("[Events] Failed to delete event", err instanceof Error ? err : new Error(errorMessage));
    res.status(500).json({ error: "Failed to delete event" });
  }
};
