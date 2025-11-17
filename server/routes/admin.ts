import { Router } from "express";
import { supabase } from "../lib/supabase";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { requireScope } from "../middleware/requireScope";

const adminRouter = Router();

// Require platform admin scope for all admin endpoints
adminRouter.use(requireScope("platform:admin"));

adminRouter.get("/overview", async (_req, res, next) => {
  try {
    const [tenants, billing] = await Promise.all([
      fetchTenantSummaries(),
      fetchBillingSummary(),
    ]);

    const totals = {
      tenants: tenants.length,
      brands: tenants.reduce((sum, tenant) => sum + tenant.brandCount, 0),
      users: tenants.reduce((sum, tenant) => sum + tenant.userCount, 0),
    };

    (res as any).json({ totals, billing });
  } catch (error) {
    next(toError("Failed to load admin overview", error));
  }
});

adminRouter.get("/tenants", async (_req, res, next) => {
  try {
    const tenants = await fetchTenantSummaries();
    (res as any).json({ tenants });
  } catch (error) {
    next(toError("Failed to load tenants", error));
  }
});

adminRouter.get("/users", async (_req, res, next) => {
  try {
    const users = await fetchUserSummaries();
    (res as any).json({ users });
  } catch (error) {
    next(toError("Failed to load users", error));
  }
});

adminRouter.get("/billing", async (_req, res, next) => {
  try {
    const billing = await fetchBillingSummary();
    (res as any).json(billing);
  } catch (error) {
    next(toError("Failed to load billing data", error));
  }
});

adminRouter.get("/feature-flags", async (_req, res, next) => {
  try {
    const flags = await fetchFeatureFlags();
    (res as any).json({ flags });
  } catch (error) {
    next(toError("Failed to load feature flags", error));
  }
});

const featureFlagSchema = {
  flag: "string",
  enabled: "boolean",
} as const;

adminRouter.post("/feature-flags", async (req, res, next) => {
  try {
    const { flag, enabled } = req.body as {
      flag?: string;
      enabled?: boolean;
    };

    if (!flag || typeof enabled === "undefined") {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "flag and enabled are required",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
      );
    }

    const { error } = await supabase
      .from("platform_settings")
      .upsert({ key: flag, value: enabled }, { onConflict: "key" });

    if (error) throw error;

    (res as any).json({ success: true, flags: await fetchFeatureFlags() });
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : toError("Failed to update feature flag", error),
    );
  }
});

async function fetchTenantSummaries() {
  // Prefer tenants_view, fallback to tenants table
  let { data, error } = await supabase
    .from("tenants_view")
    .select(
      "id,name,plan,status,brand_count,user_count,posts_published,storage_used,api_quota_used,api_quota_limit",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    const fallback = await supabase
      .from("tenants")
      .select(
        "id,name,plan,status,brand_count,user_count,posts_published,storage_used,api_quota_used,api_quota_limit",
      )
      .order("created_at", { ascending: false })
      .limit(100);
    data = fallback.data || [];
    error = fallback.error;
  }

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return (data || []).map(normalizeTenant);
}

function normalizeTenant(row: any) {
  return {
    id: row.id,
    name: row.name || "Tenant",
    plan: normalizePlan(row.plan),
    status: normalizeStatus(row.status),
    brandCount: coerceNumber(row.brand_count, 0),
    userCount: coerceNumber(row.user_count, 0),
    postsPublished: coerceNumber(row.posts_published, 0),
    storageUsed: coerceNumber(row.storage_used, 0),
    apiQuotaUsed: coerceNumber(row.api_quota_used, 0),
    apiQuotaLimit: coerceNumber(row.api_quota_limit, 1000),
  };
}

async function fetchUserSummaries() {
  const users: any[] = [];

  // Try profiles_view first
  let { data, error } = await supabase
    .from("profiles_view")
    .select("id,email,full_name,role,status,last_login_at,brands")
    .order("last_login_at", { ascending: false })
    .limit(200);

  if (error) {
    const fallback = await supabase
      .from("brand_users")
      .select("user_id,role,brand_id,created_at")
      .limit(200);
    data = fallback.data?.map((row) => ({
      id: row.user_id,
      email: "",
      full_name: "",
      role: row.role,
      status: "active",
      last_login_at: row.created_at,
      brands: [row.brand_id],
    }));
    error = fallback.error;
  }

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  for (const row of data || []) {
    users.push({
      id: row.id,
      email: row.email || "unknown@postd.agency",
      name: row.full_name || row.email || "User",
      role: row.role || "viewer",
      brands: Array.isArray(row.brands) ? row.brands : [],
      status: (row.status || "active") as "active" | "inactive",
      lastLoginAt: row.last_login_at,
    });
  }

  return users;
}

async function fetchBillingSummary() {
  const { data, error } = await supabase
    .from("billing_accounts")
    .select("plan,status,mrr,churn_rate")
    .limit(200);

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  const accounts = data || [];
  const mrr = accounts.reduce((sum, acc: any) => sum + (acc.mrr || 0), 0);
  const churnRates = accounts
    .map((acc: any) => Number(acc.churn_rate))
    .filter((rate) => !Number.isNaN(rate));
  const churnRate =
    churnRates.length > 0
      ? churnRates.reduce((sum, rate) => sum + rate, 0) / churnRates.length
      : 0;

  const planDistribution = accounts.reduce(
    (dist: Record<string, number>, acc: any) => {
      const plan = normalizePlan(acc.plan);
      dist[plan] = (dist[plan] || 0) + 1;
      return dist;
    },
    { solo: 0, agency: 0, enterprise: 0 },
  );

  const trialCount = accounts.filter(
    (acc: any) => normalizeStatus(acc.status) === "trial",
  ).length;

  return {
    mrr,
    churnRate,
    planDistribution,
    trialCount,
  };
}

async function fetchFeatureFlags() {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("key,value");

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  const defaults = {
    client_portal_enabled: true,
    approvals_v2_enabled: true,
    ai_agents_enabled: true,
  };

  for (const row of data || []) {
    if (row.key) {
      (defaults as any)[row.key] = row.value;
    }
  }

  return defaults;
}

const toError = (message: string, error: unknown) =>
  new AppError(
    ErrorCode.DATABASE_ERROR,
    message,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    "critical",
    { details: error instanceof Error ? error.message : error },
  );

function normalizePlan(plan: string | null | undefined) {
  if (!plan) return "agency";
  const normalized = plan.toLowerCase();
  if (normalized === "solo" || normalized === "enterprise") return normalized;
  return "agency";
}

function normalizeStatus(status: string | null | undefined) {
  if (!status) return "active";
  const normalized = status.toLowerCase();
  if (["active", "inactive", "trial"].includes(normalized)) {
    return normalized as "active" | "inactive" | "trial";
  }
  return "active";
}

function coerceNumber(value: any, fallback: number) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export default adminRouter;

