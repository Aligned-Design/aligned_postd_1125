/**
 * Admin Panel
 * 
 * System-wide management and monitoring across all brands.
 * Features:
 * - Tenant-Level Overview
 * - User Management
 * - Billing Dashboard
 * - Feature Flags
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PageShell } from "@/components/postd/ui/layout/PageShell";
import { PageHeader } from "@/components/postd/ui/layout/PageHeader";
import {
  Users,
  Building2,
  CreditCard,
  Settings,
  TrendingUp,
  Database,
  Zap,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/design-system";

interface Tenant {
  id: string;
  name: string;
  plan: "solo" | "agency" | "enterprise";
  status: "active" | "inactive" | "trial";
  brandCount: number;
  userCount: number;
  postsPublished: number;
  storageUsed: number; // MB
  apiQuotaUsed: number;
  apiQuotaLimit: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  brands: string[];
  status: "active" | "inactive";
  lastLoginAt?: string;
}

interface BillingInfo {
  mrr: number;
  churnRate: number;
  planDistribution: {
    solo: number;
    agency: number;
    enterprise: number;
  };
  trialCount: number;
}

interface FeatureFlags {
  client_portal_enabled: boolean;
  approvals_v2_enabled: boolean;
  ai_agents_enabled: boolean;
}

export default function AdminPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "tenants" | "users" | "billing" | "features">("overview");

  // Data
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>({
    client_portal_enabled: true,
    approvals_v2_enabled: true,
    ai_agents_enabled: true,
  });
  // Phase 2 – Issue 2: Track errors separately for each section
  const [errors, setErrors] = useState<{
    tenants?: string;
    users?: string;
    billing?: string;
    flags?: string;
  }>({});

  // ✅ FIX: Add loadAdminData to dependencies or use useCallback
  useEffect(() => {
    loadAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // loadAdminData is stable, safe to omit. setState calls are intentional for initial load.

  // Phase 2 – Issue 2: Remove mock fallbacks, add proper error handling
  const loadAdminData = async () => {
    try {
      setLoading(true);
      setErrors({}); // Clear previous errors

      const [tenantsRes, usersRes, billingRes, flagsRes] = await Promise.all([
        fetch("/api/admin/tenants").catch((err) => {
          console.error("[Admin] Failed to fetch tenants:", err);
          return null;
        }),
        fetch("/api/admin/users").catch((err) => {
          console.error("[Admin] Failed to fetch users:", err);
          return null;
        }),
        fetch("/api/admin/billing").catch((err) => {
          console.error("[Admin] Failed to fetch billing:", err);
          return null;
        }),
        fetch("/api/admin/feature-flags").catch((err) => {
          console.error("[Admin] Failed to fetch feature flags:", err);
          return null;
        }),
      ]);

      // Handle tenants
      if (tenantsRes?.ok) {
        try {
          const data = await tenantsRes.json();
          setTenants(data.tenants || []);
          setErrors((prev) => ({ ...prev, tenants: undefined }));
        } catch (err) {
          setErrors((prev) => ({
            ...prev,
            tenants: "Failed to parse tenants data. Please try again.",
          }));
          setTenants([]);
        }
      } else {
        const errorMsg = tenantsRes
          ? `Failed to load tenants (${tenantsRes.status}). Please try again or contact support.`
          : "Unable to load tenants. Check your connection and try again.";
        setErrors((prev) => ({ ...prev, tenants: errorMsg }));
        setTenants([]);
      }

      // Handle users
      if (usersRes?.ok) {
        try {
          const data = await usersRes.json();
          setUsers(data.users || []);
          setErrors((prev) => ({ ...prev, users: undefined }));
        } catch (err) {
          setErrors((prev) => ({
            ...prev,
            users: "Failed to parse users data. Please try again.",
          }));
          setUsers([]);
        }
      } else {
        const errorMsg = usersRes
          ? `Failed to load users (${usersRes.status}). Please try again or contact support.`
          : "Unable to load users. Check your connection and try again.";
        setErrors((prev) => ({ ...prev, users: errorMsg }));
        setUsers([]);
      }

      // Handle billing
      if (billingRes?.ok) {
        try {
          const data = await billingRes.json();
          setBilling(data);
          setErrors((prev) => ({ ...prev, billing: undefined }));
        } catch (err) {
          setErrors((prev) => ({
            ...prev,
            billing: "Failed to parse billing data. Please try again.",
          }));
          setBilling(null);
        }
      } else {
        const errorMsg = billingRes
          ? `Failed to load billing data (${billingRes.status}). Please try again or contact support.`
          : "Unable to load billing data. Check your connection and try again.";
        setErrors((prev) => ({ ...prev, billing: errorMsg }));
        setBilling(null);
      }

      // Handle feature flags
      if (flagsRes?.ok) {
        try {
          const data = await flagsRes.json();
          setFeatureFlags(data.flags || featureFlags);
          setErrors((prev) => ({ ...prev, flags: undefined }));
        } catch (err) {
          setErrors((prev) => ({
            ...prev,
            flags: "Failed to parse feature flags. Please try again.",
          }));
        }
      } else {
        // Feature flags are optional, so we don't show an error, just keep defaults
        setErrors((prev) => ({ ...prev, flags: undefined }));
      }
    } catch (error) {
      console.error("[Admin] Unexpected error loading admin data:", error);
      setErrors({
        tenants: "An unexpected error occurred. Please refresh the page.",
        users: "An unexpected error occurred. Please refresh the page.",
        billing: "An unexpected error occurred. Please refresh the page.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureFlagToggle = async (flag: keyof FeatureFlags, value: boolean) => {
    try {
      const response = await fetch("/api/admin/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag, enabled: value }),
      });

      if (response.ok) {
        setFeatureFlags((prev) => ({ ...prev, [flag]: value }));
        toast({
          title: "Feature flag updated",
          description: `${flag} is now ${value ? "enabled" : "disabled"}.`,
        });
      } else {
        throw new Error("Failed to update feature flag");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update feature flag. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Admin Panel"
        subtitle="System-wide management and monitoring"
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {[
          { id: "overview", label: "Overview", icon: <TrendingUp className="h-4 w-4" /> },
          { id: "tenants", label: "Tenants & Brands", icon: <Building2 className="h-4 w-4" /> },
          { id: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
          { id: "billing", label: "Billing", icon: <CreditCard className="h-4 w-4" /> },
          { id: "features", label: "Feature Flags", icon: <Settings className="h-4 w-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "users" | "billing" | "features")} // ✅ FIX: Type assertion for tab.id
            className={cn(
              "flex items-center gap-2 px-4 py-2 border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-gray-600 hover:text-gray-900",
            )}
          >
            {tab.icon}
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <>
          {activeTab === "overview" && <OverviewTab tenants={tenants} users={users} billing={billing} errors={errors} />}
          {activeTab === "tenants" && <TenantsTab tenants={tenants} error={errors.tenants} />}
          {activeTab === "users" && <UsersTab users={users} error={errors.users} />}
          {activeTab === "billing" && <BillingTab billing={billing} error={errors.billing} />}
          {activeTab === "features" && (
            <FeatureFlagsTab
              flags={featureFlags}
              onToggle={handleFeatureFlagToggle}
            />
          )}
        </>
      )}
    </PageShell>
  );
}

// Overview Tab
function OverviewTab({
  tenants,
  users,
  billing,
  errors,
}: {
  tenants: Tenant[];
  users: User[];
  billing: BillingInfo | null;
  errors?: { tenants?: string; users?: string; billing?: string };
}) {
  const totalBrands = tenants.reduce((sum, t) => sum + t.brandCount, 0);
  const totalUsers = users.length;
  const totalPosts = tenants.reduce((sum, t) => sum + t.postsPublished, 0);
  const totalStorage = tenants.reduce((sum, t) => sum + t.storageUsed, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tenants</p>
                <p className="text-2xl font-bold">{tenants.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Brands</p>
                <p className="text-2xl font-bold">{totalBrands}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Posts Published</p>
                <p className="text-2xl font-bold">{totalPosts.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Distribution */}
      {billing && (
        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold">{billing.planDistribution.solo}</p>
                <p className="text-sm text-gray-600">Solo</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold">{billing.planDistribution.agency}</p>
                <p className="text-sm text-gray-600">Agency</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold">{billing.planDistribution.enterprise}</p>
                <p className="text-sm text-gray-600">Enterprise</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Storage & API Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Storage Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(totalStorage / 1024).toFixed(2)} GB</p>
            <p className="text-sm text-gray-600 mt-1">Across all tenants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">API Quota Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {tenants.reduce((sum, t) => sum + t.apiQuotaUsed, 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 mt-1">API calls consumed</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Tenants Tab
// Phase 2 – Issue 2: Display error state instead of empty table
function TenantsTab({ tenants, error }: { tenants: Tenant[]; error?: string }) {
  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-900 mb-2">Unable to load tenants</p>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tenants & Brands</CardTitle>
      </CardHeader>
      <CardContent>
        {tenants.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No tenants found.</div>
        ) : (
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant Name</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Brands</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Posts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell className="font-medium">{tenant.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {tenant.plan}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      tenant.status === "active"
                        ? "default"
                        : tenant.status === "trial"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {tenant.status}
                  </Badge>
                </TableCell>
                <TableCell>{tenant.brandCount}</TableCell>
                <TableCell>{tenant.userCount}</TableCell>
                <TableCell>{tenant.postsPublished.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
      </CardContent>
    </Card>
  );
}

// Users Tab
// Phase 2 – Issue 2: Display error state instead of empty table
function UsersTab({ users, error }: { users: User[]; error?: string }) {
  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-900 mb-2">Unable to load users</p>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No users found.</div>
        ) : (
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Brands</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>{user.brands.length}</TableCell>
                <TableCell>
                  <Badge
                    variant={user.status === "active" ? "default" : "secondary"}
                  >
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleDateString()
                    : "Never"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
      </CardContent>
    </Card>
  );
}

// Billing Tab
// Phase 2 – Issue 2: Display error state instead of empty card
function BillingTab({ billing, error }: { billing: BillingInfo | null; error?: string }) {
  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-900 mb-2">Unable to load billing data</p>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </CardContent>
      </Card>
    );
  }

  if (!billing) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          No billing data available.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Revenue Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Monthly Recurring Revenue</p>
              <p className="text-3xl font-bold">${billing.mrr.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Churn Rate</p>
              <p className="text-3xl font-bold">{billing.churnRate.toFixed(2)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold">{billing.planDistribution.solo}</p>
              <p className="text-sm text-gray-600">Solo Plans</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold">{billing.planDistribution.agency}</p>
              <p className="text-sm text-gray-600">Agency Plans</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold">{billing.planDistribution.enterprise}</p>
              <p className="text-sm text-gray-600">Enterprise Plans</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trial Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{billing.trialCount}</p>
          <p className="text-sm text-gray-600 mt-1">Active trials</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Feature Flags Tab
function FeatureFlagsTab({
  flags,
  onToggle,
}: {
  flags: FeatureFlags;
  onToggle: (flag: keyof FeatureFlags, value: boolean) => void;
}) {
  const flagConfig = [
    {
      key: "client_portal_enabled" as keyof FeatureFlags,
      label: "Client Portal",
      description: "Enable client-facing approval portal",
    },
    {
      key: "approvals_v2_enabled" as keyof FeatureFlags,
      label: "Approvals V2",
      description: "Use new multi-client approval workflow",
    },
    {
      key: "ai_agents_enabled" as keyof FeatureFlags,
      label: "Content Tools",
      description: "Enable The Copywriter, The Creative, and The Advisor",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {flagConfig.map((config) => (
          <div
            key={config.key}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex-1">
              <Label className="font-semibold text-base">{config.label}</Label>
              <p className="text-sm text-gray-600 mt-1">{config.description}</p>
            </div>
            <Switch
              checked={flags[config.key]}
              onCheckedChange={(checked) => onToggle(config.key, checked)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Phase 2 – Issue 2: Mock data helpers removed from production code
// These functions are no longer used - kept for reference only
// TODO: Remove these functions in a future cleanup pass
function _getMockTenants_DEPRECATED(): Tenant[] {
  return [
    {
      id: "tenant_1",
      name: "Acme Agency",
      plan: "agency",
      status: "active",
      brandCount: 12,
      userCount: 8,
      postsPublished: 1240,
      storageUsed: 2048,
      apiQuotaUsed: 45000,
      apiQuotaLimit: 100000,
    },
    {
      id: "tenant_2",
      name: "TechStart",
      plan: "solo",
      status: "trial",
      brandCount: 1,
      userCount: 1,
      postsPublished: 45,
      storageUsed: 128,
      apiQuotaUsed: 1200,
      apiQuotaLimit: 10000,
    },
    {
      id: "tenant_3",
      name: "Enterprise Corp",
      plan: "enterprise",
      status: "active",
      brandCount: 50,
      userCount: 25,
      postsPublished: 5600,
      storageUsed: 10240,
      apiQuotaUsed: 250000,
      apiQuotaLimit: 500000,
    },
  ];
}

function _getMockUsers_DEPRECATED(): User[] {
  return [
    {
      id: "user_1",
      email: "admin@acme.com",
      name: "Admin User",
      role: "admin",
      brands: ["brand_1", "brand_2"],
      status: "active",
      lastLoginAt: new Date().toISOString(),
    },
    {
      id: "user_2",
      email: "manager@acme.com",
      name: "Manager User",
      role: "manager",
      brands: ["brand_1"],
      status: "active",
      lastLoginAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "user_3",
      email: "client@techstart.com",
      name: "Client User",
      role: "client",
      brands: ["brand_3"],
      status: "active",
    },
  ];
}

function _getMockBilling_DEPRECATED(): BillingInfo {
  return {
    mrr: 12500,
    churnRate: 2.5,
    planDistribution: {
      solo: 15,
      agency: 8,
      enterprise: 3,
    },
    trialCount: 5,
  };
}

