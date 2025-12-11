/**
 * Generation Log Helper
 * 
 * Centralized helper for writing to generation_logs table.
 * Ensures consistent schema usage across all AI agents.
 * 
 * Schema (from 004_activate_generation_logs_table.sql):
 * - id: UUID PRIMARY KEY
 * - brand_id: UUID NOT NULL (FK to brands)
 * - agent: TEXT NOT NULL ('copywriter', 'creative', 'advisor', 'doc', 'design', 'social')
 * - prompt_version: TEXT
 * - input: JSONB NOT NULL (prompt, context, parameters)
 * - output: JSONB NOT NULL (generated content, metrics, errors)
 * - bfs_score: DECIMAL(3,1) (0.0 - 1.0)
 * - linter_results: JSONB
 * - approved: BOOLEAN DEFAULT FALSE
 * - reviewer_id: UUID (FK to auth.users)
 * - revision: INTEGER DEFAULT 0
 * - created_at: TIMESTAMPTZ DEFAULT NOW()
 */

import { supabase } from "./supabase";
import { logger } from "./logger";

/**
 * Supported agent types for generation logging
 */
export type AgentType = "doc" | "design" | "advisor" | "social" | "copywriter" | "creative";

/**
 * Input metadata for generation logging
 * All prompt-related data goes here
 */
export interface GenerationInput {
  /** The topic/prompt that was sent to the AI */
  topic?: string;
  /** Platform target (instagram, linkedin, etc.) */
  platform?: string;
  /** Tone/voice requested */
  tone?: string;
  /** Content format (post, carousel, email, etc.) */
  format?: string;
  /** Safety mode used */
  safety_mode?: string;
  /** Request ID for tracing */
  request_id?: string;
  /** Number of regeneration attempts */
  regeneration_count?: number;
  /** Additional input metadata */
  [key: string]: unknown;
}

/**
 * Output metadata for generation logging
 * All generated content and metrics go here
 */
export interface GenerationOutput {
  /** Generated headline */
  headline?: string;
  /** Generated body text */
  body?: string;
  /** Generated CTA */
  cta?: string;
  /** Generated hashtags */
  hashtags?: string[];
  /** Generation duration in milliseconds */
  duration_ms?: number;
  /** Input tokens used */
  tokens_in?: number;
  /** Output tokens generated */
  tokens_out?: number;
  /** AI provider used */
  provider?: string;
  /** Model used */
  model?: string;
  /** Error message if generation failed */
  error?: string;
  /** Whether placeholder/fallback content was used */
  is_fallback?: boolean;
  /** Reviewer notes (added during approval) */
  reviewer_notes?: string;
  /** Review timestamp (added during approval) */
  reviewed_at?: string;
  /** Additional output metadata */
  [key: string]: unknown;
}

/**
 * Linter results structure
 */
export interface LinterResults {
  /** Whether linting passed */
  passed: boolean;
  /** Detected issues */
  issues?: string[];
  /** Fixes that were applied */
  fixes_applied?: string[];
  /** Whether content was blocked */
  blocked?: boolean;
  /** Whether human review is needed */
  needs_human_review?: boolean;
  /** Additional linter data */
  [key: string]: unknown;
}

/**
 * Arguments for logging a generation event
 */
export interface LogGenerationEventArgs {
  /** Brand UUID */
  brandId: string;
  /** Agent type that performed the generation */
  agent: AgentType;
  /** Prompt version identifier */
  promptVersion?: string;
  /** Input/prompt data */
  input: GenerationInput;
  /** Output/generated data */
  output: GenerationOutput;
  /** Brand Fidelity Score (0.0 - 1.0) */
  bfsScore?: number;
  /** Linter results */
  linterResults?: LinterResults | null;
  /** Whether content is approved */
  approved?: boolean;
  /** Revision number */
  revision?: number;
}

/**
 * Result from logging a generation event
 */
export interface LogGenerationResult {
  success: boolean;
  logId?: string;
  error?: string;
}

/**
 * Log a generation event to generation_logs table
 * 
 * Use this helper for all AI generation paths to ensure:
 * 1. Consistent schema usage (no column mismatches)
 * 2. Proper JSONB structure for input/output
 * 3. Centralized error handling
 * 
 * @example
 * ```typescript
 * const result = await logGenerationEvent({
 *   brandId: "uuid-here",
 *   agent: "doc",
 *   promptVersion: "v1.0",
 *   input: {
 *     topic: "New product launch",
 *     platform: "instagram",
 *     tone: "professional",
 *     request_id: requestId,
 *   },
 *   output: {
 *     headline: "Introducing Our Latest Innovation",
 *     body: "We're excited to announce...",
 *     duration_ms: 2500,
 *     tokens_in: 150,
 *     tokens_out: 200,
 *     provider: "openai",
 *     model: "gpt-4",
 *   },
 *   bfsScore: 0.85,
 *   linterResults: { passed: true },
 *   approved: false,
 * });
 * ```
 */
export async function logGenerationEvent(
  args: LogGenerationEventArgs
): Promise<LogGenerationResult> {
  const {
    brandId,
    agent,
    promptVersion = "v1.0",
    input,
    output,
    bfsScore,
    linterResults,
    approved = false,
    revision = 0,
  } = args;

  try {
    // Validate required fields
    if (!brandId) {
      logger.warn("logGenerationEvent called without brandId", { agent });
      return { success: false, error: "brandId is required" };
    }

    if (!agent) {
      logger.warn("logGenerationEvent called without agent", { brandId });
      return { success: false, error: "agent is required" };
    }

    // Build the log entry matching schema exactly
    const logEntry = {
      brand_id: brandId,
      agent,
      prompt_version: promptVersion,
      input, // JSONB - all input data
      output, // JSONB - all output data including metrics
      bfs_score: bfsScore ?? null,
      linter_results: linterResults ?? null,
      approved,
      revision,
    };

    // @supabase-scope-ok INSERT includes brand_id in logEntry
    const { data, error } = await supabase
      .from("generation_logs")
      .insert(logEntry)
      .select("id")
      .single();

    if (error) {
      logger.warn("Failed to log generation event", {
        brandId,
        agent,
        error: error.message,
        code: error.code,
      });
      return { success: false, error: error.message };
    }

    logger.info("Generation logged successfully", {
      brandId,
      agent,
      logId: data?.id,
      bfsScore,
      approved,
    });

    return { success: true, logId: data?.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      "Error logging generation event",
      error instanceof Error ? error : new Error(errorMessage),
      { brandId, agent }
    );
    return { success: false, error: errorMessage };
  }
}

/**
 * Log multiple generation events in a batch
 * Useful for logging all items in a content package at once
 * 
 * @param events - Array of generation event arguments
 * @returns Promise with success status and count of logged events
 */
export async function logGenerationEventsBatch(
  events: LogGenerationEventArgs[]
): Promise<{ success: boolean; logged: number; failed: number; errors?: string[] }> {
  if (!events || events.length === 0) {
    return { success: true, logged: 0, failed: 0 };
  }

  const logEntries = events.map((args) => ({
    brand_id: args.brandId,
    agent: args.agent,
    prompt_version: args.promptVersion || "v1.0",
    input: args.input,
    output: args.output,
    bfs_score: args.bfsScore ?? null,
    linter_results: args.linterResults ?? null,
    approved: args.approved ?? false,
    revision: args.revision ?? 0,
  }));

  try {
    // @supabase-scope-ok INSERT includes brand_id in each logEntry
    const { error } = await supabase.from("generation_logs").insert(logEntries);

    if (error) {
      logger.warn("Failed to batch log generation events", {
        count: events.length,
        error: error.message,
        code: error.code,
      });
      return { 
        success: false, 
        logged: 0, 
        failed: events.length, 
        errors: [error.message] 
      };
    }

    logger.info("Batch generation logs created", {
      count: events.length,
      brandId: events[0]?.brandId,
      agent: events[0]?.agent,
    });

    return { success: true, logged: events.length, failed: 0 };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      "Error batch logging generation events",
      error instanceof Error ? error : new Error(errorMessage),
      { count: events.length }
    );
    return { 
      success: false, 
      logged: 0, 
      failed: events.length, 
      errors: [errorMessage] 
    };
  }
}

/**
 * Update a generation log entry (e.g., for approval/rejection)
 * 
 * @param logId - The generation log ID to update
 * @param updates - Fields to update (approved, reviewer notes, etc.)
 */
export async function updateGenerationLog(
  logId: string,
  updates: {
    approved?: boolean;
    reviewerNotes?: string;
    reviewerId?: string;
  }
): Promise<LogGenerationResult> {
  try {
    // First fetch the existing log to get current output
    const { data: existing, error: fetchError } = await supabase
      .from("generation_logs")
      .select("output")
      .eq("id", logId)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    // Merge reviewer info into output JSONB (schema doesn't have dedicated columns)
    const updatedOutput = {
      ...(existing?.output as Record<string, unknown> || {}),
      ...(updates.reviewerNotes && { reviewer_notes: updates.reviewerNotes }),
      reviewed_at: new Date().toISOString(),
    };

    const updatePayload: Record<string, unknown> = {
      output: updatedOutput,
    };

    if (updates.approved !== undefined) {
      updatePayload.approved = updates.approved;
    }

    if (updates.reviewerId) {
      updatePayload.reviewer_id = updates.reviewerId;
    }

    const { error } = await supabase
      .from("generation_logs")
      .update(updatePayload)
      .eq("id", logId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, logId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}


