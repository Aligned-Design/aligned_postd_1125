/**
 * Database Client Wrapper
 * Type-safe interface to Supabase for Phase 9 features
 * Provides unified error handling and query patterns
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    "⚠️  Supabase credentials not configured. Database features will not work.",
  );
  console.warn(
    "   Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.",
  );
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceKey,
);

// ==================== ERROR HANDLING ====================

export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string = "DB_ERROR",
    public originalError?: Error,
  ) {
    super(message);
    this.name = "DatabaseError";
  }
}

function handleError(error: unknown, operation: string): DatabaseError {
  console.error(`[Database] ${operation} failed:`, error);

  const message =
    (error && (error.message || error.error_description)) ||
    "Unknown database error";
  const code = (error && (error.code || "UNKNOWN")) || "UNKNOWN";

  return new DatabaseError(`${operation}: ${message}`, code, error as Error);
}

// ==================== CLIENT SETTINGS ====================

export interface ClientSettingsRecord {
  id: string;
  client_id: string;
  brand_id: string;
  email_preferences: Record<string, unknown>;
  timezone: string;
  language: string;
  unsubscribe_token?: string;
  unsubscribed_from_all: boolean;
  unsubscribed_types: string[];
  created_at: string;
  updated_at: string;
  last_modified_by?: string;
}

export const clientSettings = {
  async get(
    clientId: string,
    brandId: string,
  ): Promise<ClientSettingsRecord | null> {
    try {
      const { data, error } = await supabase
        .from("client_settings")
        .select("*")
        .eq("client_id", clientId)
        .eq("brand_id", brandId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Not found is not an error in this context
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      throw handleError(error, "clientSettings.get");
    }
  },

  async create(
    data: Omit<ClientSettingsRecord, "id" | "created_at" | "updated_at">,
  ): Promise<ClientSettingsRecord> {
    try {
      const { data: record, error } = await supabase
        .from("client_settings")
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return record;
    } catch (error) {
      throw handleError(error, "clientSettings.create");
    }
  },

  async update(
    clientId: string,
    brandId: string,
    updates: Partial<ClientSettingsRecord>,
  ): Promise<ClientSettingsRecord> {
    try {
      const { data, error } = await supabase
        .from("client_settings")
        .update(updates)
        .eq("client_id", clientId)
        .eq("brand_id", brandId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw handleError(error, "clientSettings.update");
    }
  },

  async findByUnsubscribeToken(
    token: string,
  ): Promise<ClientSettingsRecord | null> {
    try {
      const { data, error } = await supabase
        .from("client_settings")
        .select("*")
        .eq("unsubscribe_token", token)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }

      return data;
    } catch (error) {
      throw handleError(error, "clientSettings.findByUnsubscribeToken");
    }
  },

  async getByBrandId(brandId: string): Promise<ClientSettingsRecord | null> {
    try {
      const { data, error } = await supabase
        .from("client_settings")
        .select("*")
        .eq("brand_id", brandId)
        .limit(1)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }

      return data;
    } catch (error) {
      throw handleError(error, "clientSettings.getByBrandId");
    }
  },
};

// ==================== POST APPROVALS ====================

export interface PostApprovalRecord {
  id: string;
  brand_id: string;
  post_id: string;
  status: "pending" | "approved" | "rejected";
  approved_at?: string;
  approved_by?: string;
  rejected_at?: string;
  rejected_by?: string;
  locked: boolean;
  created_at: string;
  updated_at: string;
}

export const postApprovals = {
  async get(
    brandId: string,
    postId: string,
  ): Promise<PostApprovalRecord | null> {
    try {
      const { data, error } = await supabase
        .from("post_approvals")
        .select("*")
        .eq("brand_id", brandId)
        .eq("post_id", postId)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }

      return data;
    } catch (error) {
      throw handleError(error, "postApprovals.get");
    }
  },

  async getById(approvalId: string): Promise<PostApprovalRecord | null> {
    try {
      const { data, error } = await supabase
        .from("post_approvals")
        .select("*")
        .eq("id", approvalId)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }

      return data;
    } catch (error) {
      throw handleError(error, "postApprovals.getById");
    }
  },

  async upsert(
    data: Omit<PostApprovalRecord, "id" | "created_at" | "updated_at">,
  ): Promise<PostApprovalRecord> {
    try {
      const { data: record, error } = await supabase
        .from("post_approvals")
        .upsert([data], { onConflict: "brand_id,post_id" })
        .select()
        .single();

      if (error) throw error;
      return record;
    } catch (error) {
      throw handleError(error, "postApprovals.upsert");
    }
  },

  async getByStatus(
    brandId: string,
    status: string,
    limit: number = 50,
  ): Promise<PostApprovalRecord[]> {
    try {
      const { data, error } = await supabase
        .from("post_approvals")
        .select("*")
        .eq("brand_id", brandId)
        .eq("status", status)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw handleError(error, "postApprovals.getByStatus");
    }
  },

  async batchUpdate(
    brandId: string,
    postIds: string[],
    updates: Partial<PostApprovalRecord>,
  ): Promise<PostApprovalRecord[]> {
    try {
      const { data, error } = await supabase
        .from("post_approvals")
        .update(updates)
        .eq("brand_id", brandId)
        .in("post_id", postIds)
        .select();

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw handleError(error, "postApprovals.batchUpdate");
    }
  },
};

// ==================== AUDIT LOGS ====================

export interface AuditLogRecord {
  id: string;
  brand_id: string;
  post_id?: string;
  actor_id: string;
  actor_email: string;
  action: string;
  metadata: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
}

export const auditLogs = {
  async create(
    data: Omit<AuditLogRecord, "id" | "created_at" | "updated_at">,
  ): Promise<AuditLogRecord> {
    try {
      const { data: log, error } = await supabase
        .from("audit_logs")
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return log;
    } catch (error) {
      throw handleError(error, "auditLogs.create");
    }
  },

  async query(
    brandId: string,
    filters?: {
      postId?: string;
      actorEmail?: string;
      action?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ logs: AuditLogRecord[]; total: number }> {
    try {
      let query = supabase
        .from("audit_logs")
        .select("*", { count: "exact" })
        .eq("brand_id", brandId);

      if (filters?.postId) {
        query = query.eq("post_id", filters.postId);
      }
      if (filters?.action) {
        query = query.eq("action", filters.action);
      }
      if (filters?.actorEmail) {
        query = query.ilike("actor_email", `%${filters.actorEmail}%`);
      }
      if (filters?.startDate) {
        query = query.gte("created_at", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("created_at", filters.endDate);
      }

      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        logs: data || [],
        total: count || 0,
      };
    } catch (error) {
      throw handleError(error, "auditLogs.query");
    }
  },

  async getByPostId(
    brandId: string,
    postId: string,
  ): Promise<AuditLogRecord[]> {
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("brand_id", brandId)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw handleError(error, "auditLogs.getByPostId");
    }
  },

  async deleteOlderThan(daysOld: number): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { count, error } = await supabase
        .from("audit_logs")
        .delete()
        .lt("created_at", cutoffDate.toISOString());

      if (error) throw error;
      return count || 0;
    } catch (error) {
      throw handleError(error, "auditLogs.deleteOlderThan");
    }
  },
};

// ==================== WEBHOOK EVENTS & ATTEMPTS ====================

interface WebhookEventRecord {
  id: string;
  brand_id: string;
  provider: string;
  event_type: string;
  payload: Record<string, unknown>;
  idempotency_key: string;
  status: string;
  attempt_count: number;
  max_attempts: number;
  last_error?: string;
  created_at: string;
  updated_at: string;
  delivered_at?: string;
}

interface WebhookAttemptRecord {
  id: string;
  event_id: string;
  attempt_number: number;
  status: string;
  error?: string;
  response_code?: number;
  backoff_ms: number;
  created_at: string;
}

export const webhookEvents = {
  async create(
    data: Omit<WebhookEventRecord, "id" | "created_at" | "updated_at">,
  ): Promise<WebhookEventRecord> {
    const { data: result, error } = await supabase
      .from("webhook_events")
      .insert([data])
      .select()
      .single();

    if (error)
      throw new DatabaseError(
        `Failed to create webhook event: ${error.message}`,
        error.code,
        error,
      );
    return result as WebhookEventRecord;
  },

  async getById(eventId: string): Promise<WebhookEventRecord | null> {
    const { data, error } = await supabase
      .from("webhook_events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new DatabaseError(
        `Failed to get webhook event: ${error.message}`,
        error.code,
        error,
      );
    }
    return data as WebhookEventRecord;
  },

  async getByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<WebhookEventRecord | null> {
    const { data, error } = await supabase
      .from("webhook_events")
      .select("*")
      .eq("idempotency_key", idempotencyKey)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new DatabaseError(
        `Failed to get webhook event by idempotency key: ${error.message}`,
        error.code,
        error,
      );
    }
    return data as WebhookEventRecord;
  },

  async query(filters: {
    brandId?: string;
    provider?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ events: WebhookEventRecord[]; total: number }> {
    let query = supabase.from("webhook_events").select("*", { count: "exact" });

    if (filters.brandId) query = query.eq("brand_id", filters.brandId);
    if (filters.provider) query = query.eq("provider", filters.provider);
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.startDate) query = query.gte("created_at", filters.startDate);
    if (filters.endDate) query = query.lte("created_at", filters.endDate);

    query = query.order("created_at", { ascending: false });

    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset)
      query = query.range(
        filters.offset,
        (filters.offset || 0) + (filters.limit || 50) - 1,
      );

    const { data, error, count } = await query;

    if (error)
      throw new DatabaseError(
        `Failed to query webhook events: ${error.message}`,
        error.code,
        error,
      );
    return { events: (data || []) as WebhookEventRecord[], total: count || 0 };
  },

  async update(
    eventId: string,
    updates: Partial<Omit<WebhookEventRecord, "id" | "created_at">>,
  ): Promise<WebhookEventRecord> {
    const { data, error } = await supabase
      .from("webhook_events")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", eventId)
      .select()
      .single();

    if (error)
      throw new DatabaseError(
        `Failed to update webhook event: ${error.message}`,
        error.code,
        error,
      );
    return data as WebhookEventRecord;
  },

  async markDelivered(eventId: string): Promise<void> {
    const { error } = await supabase.rpc("mark_webhook_delivered", {
      event_id: eventId,
    });
    if (error)
      throw new DatabaseError(
        `Failed to mark webhook as delivered: ${error.message}`,
        error.code,
        error,
      );
  },

  async markDeadLetter(eventId: string, errorMsg: string): Promise<void> {
    const { error } = await supabase.rpc("mark_webhook_dead_letter", {
      event_id: eventId,
      error_msg: errorMsg,
    });
    if (error)
      throw new DatabaseError(
        `Failed to mark webhook as dead-letter: ${error.message}`,
        error.code,
        error,
      );
  },

  async getRetryPendingEvents(
    maxAgeMinutes: number = 60,
  ): Promise<WebhookEventRecord[]> {
    const { data, error } = await supabase.rpc("get_webhook_retry_candidates", {
      max_age_minutes: maxAgeMinutes,
    });

    if (error)
      throw new DatabaseError(
        `Failed to get webhook retry candidates: ${error.message}`,
        error.code,
        error,
      );
    return (data || []) as WebhookEventRecord[];
  },
};

export const webhookAttempts = {
  async create(
    data: Omit<WebhookAttemptRecord, "id" | "created_at">,
  ): Promise<WebhookAttemptRecord> {
    const { data: result, error } = await supabase
      .from("webhook_attempts")
      .insert([data])
      .select()
      .single();

    if (error)
      throw new DatabaseError(
        `Failed to log webhook attempt: ${error.message}`,
        error.code,
        error,
      );
    return result as WebhookAttemptRecord;
  },

  async getByEventId(eventId: string): Promise<WebhookAttemptRecord[]> {
    const { data, error } = await supabase
      .from("webhook_attempts")
      .select("*")
      .eq("event_id", eventId)
      .order("attempt_number", { ascending: false });

    if (error)
      throw new DatabaseError(
        `Failed to get webhook attempts: ${error.message}`,
        error.code,
        error,
      );
    return (data || []) as WebhookAttemptRecord[];
  },

  async getLatest(eventId: string): Promise<WebhookAttemptRecord | null> {
    const { data, error } = await supabase.rpc("get_latest_webhook_attempt", {
      event_id: eventId,
    });

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new DatabaseError(
        `Failed to get latest webhook attempt: ${error.message}`,
        error.code,
        error,
      );
    }
    return data?.[0] as WebhookAttemptRecord | null;
  },

  async getHistory(
    eventId: string,
    limitRows: number = 20,
  ): Promise<WebhookAttemptRecord[]> {
    const { data, error } = await supabase.rpc("get_webhook_attempt_history", {
      event_id: eventId,
      limit_rows: limitRows,
    });

    if (error)
      throw new DatabaseError(
        `Failed to get webhook attempt history: ${error.message}`,
        error.code,
        error,
      );
    return (data || []) as WebhookAttemptRecord[];
  },
};

// ==================== ESCALATION RULES & EVENTS ====================

interface EscalationRuleRecord {
  id: string;
  brand_id: string;
  rule_type: string;
  trigger_hours: number;
  target_type: string;
  escalate_to_role: string;
  escalate_to_user_id?: string;
  notify_via: string[];
  enabled: boolean;
  send_email: boolean;
  send_slack: boolean;
  created_at: string;
  updated_at: string;
}

interface EscalationEventRecord {
  id: string;
  brand_id: string;
  approval_id?: string;
  post_id?: string;
  rule_id: string;
  escalation_level: string;
  status: string;
  escalated_to_role?: string;
  escalated_to_user_id?: string;
  notification_type?: string;
  triggered_at: string;
  scheduled_send_at?: string;
  sent_at?: string;
  resolved_at?: string;
  resolved_by?: string;
  delivery_attempt_count: number;
  last_delivery_error?: string;
  created_at: string;
  updated_at: string;
}

export const escalationRules = {
  async getById(ruleId: string): Promise<EscalationRuleRecord | null> {
    const { data, error } = await supabase
      .from("escalation_rules")
      .select("*")
      .eq("id", ruleId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new DatabaseError(
        `Failed to get escalation rule: ${error.message}`,
        error.code,
        error,
      );
    }
    return data as EscalationRuleRecord;
  },

  async getByBrand(
    brandId: string,
    enabled?: boolean,
  ): Promise<EscalationRuleRecord[]> {
    let query = supabase
      .from("escalation_rules")
      .select("*")
      .eq("brand_id", brandId);

    if (enabled !== undefined) {
      query = query.eq("enabled", enabled);
    }

    const { data, error } = await query.order("trigger_hours", {
      ascending: true,
    });

    if (error)
      throw new DatabaseError(
        `Failed to get escalation rules: ${error.message}`,
        error.code,
        error,
      );
    return (data || []) as EscalationRuleRecord[];
  },

  async create(
    data: Omit<EscalationRuleRecord, "id" | "created_at" | "updated_at">,
  ): Promise<EscalationRuleRecord> {
    const { data: result, error } = await supabase
      .from("escalation_rules")
      .insert([data])
      .select()
      .single();

    if (error)
      throw new DatabaseError(
        `Failed to create escalation rule: ${error.message}`,
        error.code,
        error,
      );
    return result as EscalationRuleRecord;
  },

  async update(
    ruleId: string,
    updates: Partial<EscalationRuleRecord>,
  ): Promise<EscalationRuleRecord> {
    const { data, error } = await supabase
      .from("escalation_rules")
      .update(updates)
      .eq("id", ruleId)
      .select()
      .single();

    if (error)
      throw new DatabaseError(
        `Failed to update escalation rule: ${error.message}`,
        error.code,
        error,
      );
    return data as EscalationRuleRecord;
  },

  async delete(ruleId: string): Promise<void> {
    const { error } = await supabase
      .from("escalation_rules")
      .delete()
      .eq("id", ruleId);

    if (error)
      throw new DatabaseError(
        `Failed to delete escalation rule: ${error.message}`,
        error.code,
        error,
      );
  },
};

export const escalationEvents = {
  async getById(eventId: string): Promise<EscalationEventRecord | null> {
    const { data, error } = await supabase
      .from("escalation_events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new DatabaseError(
        `Failed to get escalation event: ${error.message}`,
        error.code,
        error,
      );
    }
    return data as EscalationEventRecord;
  },

  async create(
    data: Omit<EscalationEventRecord, "id" | "created_at" | "updated_at">,
  ): Promise<EscalationEventRecord> {
    const { data: result, error } = await supabase
      .from("escalation_events")
      .insert([data])
      .select()
      .single();

    if (error)
      throw new DatabaseError(
        `Failed to create escalation event: ${error.message}`,
        error.code,
        error,
      );
    return result as EscalationEventRecord;
  },

  async getPendingForDelivery(
    maxAgeHours: number = 168,
    limit: number = 50,
  ): Promise<EscalationEventRecord[]> {
    const { data, error } = await supabase.rpc("get_pending_escalations", {
      p_max_age_hours: maxAgeHours,
    });

    if (error)
      throw new DatabaseError(
        `Failed to get pending escalations: ${error.message}`,
        error.code,
        error,
      );
    return (data || []).slice(0, limit) as EscalationEventRecord[];
  },

  async markAsSent(eventId: string): Promise<EscalationEventRecord> {
    const { data, error } = await supabase.rpc("mark_escalation_sent", {
      p_event_id: eventId,
      p_sent_at: new Date().toISOString(),
    });

    if (error)
      throw new DatabaseError(
        `Failed to mark escalation as sent: ${error.message}`,
        error.code,
        error,
      );
    return (data || {})[0] as EscalationEventRecord;
  },

  async markAsResolved(
    eventId: string,
    resolvedBy: string,
    reason?: string,
  ): Promise<EscalationEventRecord> {
    const { data, error } = await supabase.rpc("mark_escalation_resolved", {
      p_event_id: eventId,
      p_resolved_by: resolvedBy,
      p_reason: reason,
    });

    if (error)
      throw new DatabaseError(
        `Failed to mark escalation as resolved: ${error.message}`,
        error.code,
        error,
      );
    return (data || {})[0] as EscalationEventRecord;
  },

  async logAttemptFailure(eventId: string, errorMsg: string): Promise<void> {
    const { data: event } = await supabase
      .from("escalation_events")
      .select("delivery_attempt_count")
      .eq("id", eventId)
      .single();

    const attemptCount = (event?.delivery_attempt_count || 0) + 1;

    const { error } = await supabase
      .from("escalation_events")
      .update({
        delivery_attempt_count: attemptCount,
        last_delivery_error: errorMsg,
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId);

    if (error)
      throw new DatabaseError(
        `Failed to log escalation attempt failure: ${error.message}`,
        error.code,
        error,
      );
  },

  async query(filters: {
    brandId: string;
    status?: string;
    escalationLevel?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ events: EscalationEventRecord[]; total: number }> {
    let query = supabase
      .from("escalation_events")
      .select("*", { count: "exact" })
      .eq("brand_id", filters.brandId);

    if (filters.status) query = query.eq("status", filters.status);
    if (filters.escalationLevel)
      query = query.eq("escalation_level", filters.escalationLevel);

    query = query.order("triggered_at", { ascending: false });

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const { data, error, count } = await query.range(
      offset,
      offset + limit - 1,
    );

    if (error)
      throw new DatabaseError(
        `Failed to query escalation events: ${error.message}`,
        error.code,
        error,
      );
    return {
      events: (data || []) as EscalationEventRecord[],
      total: count || 0,
    };
  },
};

// ==================== HEALTH CHECK ====================

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("client_settings")
      .select("id")
      .limit(1);
    if (error) {
      console.error("Database connection check failed:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Database connection check error:", error);
    return false;
  }
}

export async function initializeDatabase(): Promise<void> {
  const isConnected = await checkDatabaseConnection();
  if (!isConnected) {
    console.error("❌ Failed to connect to database");
    throw new Error("Database initialization failed");
  }
  console.log("✅ Database connection established");
}
