import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrialBanner } from "@/components/dashboard/TrialBanner";
import { useAuth } from "@/contexts/AuthContext";
import { useTrialStatus } from "@/hooks/use-trial-status";
import { usePublishCelebration } from "@/hooks/use-publish-celebration";
import { useNavigate } from "react-router-dom";
import { logError } from "@/lib/logger";
import { PageShell } from "@/components/postd/ui/layout/PageShell";
import { PageHeader } from "@/components/postd/ui/layout/PageHeader";
import {
  CreditCard,
  Download,
  ArrowUpRight,
  Calendar,
  Check,
  Sparkles,
  Info,
  AlertCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BillingData {
  subscription: {
    plan: "trial" | "base" | "agency";
    status: "active" | "past_due" | "canceled" | "trial";
    currentPeriodEnd: string;
    price: number;
    brands: number;
  };
  usage: {
    postsPublished: number;
    brandsManaged: number;
    aiInsightsUsed?: number;
    limits: {
      postsPublished: number | null;
      brandsManaged: number;
    };
  };
  invoices: Array<{
    id: string;
    date: string;
    amount: number;
    status: "paid" | "pending" | "failed";
    downloadUrl?: string;
  }>;
  paymentMethod?: {
    last4: string;
    expiry: string;
    brand: string;
  };
}

export default function Billing() {
  const { user } = useAuth();
  const { trialStatus } = useTrialStatus();
  const { celebrate } = usePublishCelebration();
  const navigate = useNavigate();
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isTrial = user?.plan === "trial";
  const isAgencyTier = (data?.subscription.brands || 0) >= 5;

  const loadBillingData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call to /api/billing/status when backend is implemented
      const response = await fetch("/api/billing/status");

      if (!response.ok) {
        // If endpoint not implemented, show empty state
        if (response.status === 404) {
          setData(null);
          setError("Billing information is not yet available. Please check back later.");
          return;
        }
        throw new Error(`Failed to load billing data: ${response.statusText}`);
      }

      const billingData: BillingData = await response.json();
      setData(billingData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load billing data";
      logError("Failed to load billing data", err instanceof Error ? err : new Error(String(err)));
      setError(errorMessage);
      setData(null); // Show empty state instead of mock data
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ FIX: Fetch real billing data from API
  useEffect(() => {
    loadBillingData();
  }, [user, loadBillingData]);

  const calculateMonthlyTotal = () => {
    if (!data) return 0;
    const rate = data.subscription.brands >= 5 ? 99 : 199;
    return data.subscription.brands * rate;
  };

  const getPlanRate = () => {
    if (!data) return 199;
    return data.subscription.brands >= 5 ? 99 : 199;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleUpgrade = () => {
    navigate("/pricing?context=billing");
  };

  if (loading) {
    return (
      <PageShell>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </PageShell>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <PageShell>
        <PageHeader
          title="Billing & Subscription"
          subtitle="Manage your subscription and billing information"
        />
        <div className="rounded-lg bg-red-50 border border-red-200 p-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900 mb-1">Unable to load billing information</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  // Empty state (no billing data available)
  if (!data) {
    return (
      <PageShell>
        <PageHeader
          title="Billing & Subscription"
          subtitle="Manage your subscription and billing information"
        />
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-12 text-center">
          <Info className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">No billing information available</h3>
          <p className="text-slate-600 mb-4">
            Billing information will appear here once your account is set up.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Billing & Subscription"
        subtitle="Aligned AI grows with your brand. Whether you're managing one business or fifty, your pricing automatically scales — no calls, no surprises."
        actions={
          !isTrial ? (
            <Button onClick={handleUpgrade} className="gap-2">
              <ArrowUpRight className="h-4 w-4" />
              Upgrade Plan
            </Button>
          ) : undefined
        }
      />

      {/* Trial-Specific Banner */}
      {isTrial && trialStatus && (
        <TrialBanner
          publishedCount={trialStatus.publishedCount}
          maxPosts={trialStatus.maxPosts}
        />
      )}

      {/* Trial-Specific Experience */}
      {isTrial ? (
        <TrialView
          trialStatus={trialStatus}
          onUpgrade={handleUpgrade}
          data={data}
        />
      ) : (
        <PaidPlanView
          data={data}
          onUpgrade={handleUpgrade}
          calculateMonthlyTotal={calculateMonthlyTotal}
          getPlanRate={getPlanRate}
          formatCurrency={formatCurrency}
          isAgencyTier={isAgencyTier}
        />
      )}

      {/* Add-ons Section (For All Users) */}
      <AddOnsSection isTrial={isTrial} />
    </PageShell>
  );
}

function TrialView({
  trialStatus,
  onUpgrade,
  data,
}: {
  trialStatus: {
    isTrial: boolean;
    publishedCount: number;
    maxPosts: number;
    remainingPosts: number;
    daysRemaining: number | null;
    isExpired: boolean;
    canPublish?: boolean;
  } | undefined;
  onUpgrade: () => void;
  data: BillingData;
}) {
  return (
    <div className="space-y-6">
      {/* Trial Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Trial Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-700">Days Remaining</span>
                <span className="text-2xl font-bold text-purple-600">
                  {trialStatus?.daysRemaining || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700">Posts Used</span>
                <span className="text-2xl font-bold text-purple-600">
                  {trialStatus?.publishedCount || 0} /{" "}
                  {trialStatus?.maxPosts || 2}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700">Posts Remaining</span>
                <span className="text-2xl font-bold text-lime-600">
                  {trialStatus?.remainingPosts || 0}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-purple-200">
              <p className="text-sm text-slate-600 mb-3">
                ✨ Enjoying your trial? Unlock unlimited publishing, analytics,
                and multi-brand tools today.
              </p>
              <Button onClick={onUpgrade} className="w-full gap-2">
                Upgrade to Unlock Unlimited Publishing
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trial Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-lime-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-slate-900">
                  Full Platform Access
                </p>
                <p className="text-sm text-slate-600">
                  Creative Studio, AI generation, approvals
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-lime-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-slate-900">2 Test Posts</p>
                <p className="text-sm text-slate-600">
                  Publish to see the full workflow
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-lime-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-slate-900">No Credit Card</p>
                <p className="text-sm text-slate-600">
                  You won't be charged until you upgrade
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-lime-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-slate-900">7-Day Access</p>
                <p className="text-sm text-slate-600">
                  Full feature exploration period
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage During Trial */}
      <Card>
        <CardHeader>
          <CardTitle>Trial Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Posts Published</span>
              <span>
                {data.usage.postsPublished} / {data.usage.limits.postsPublished}
              </span>
            </div>
            <Progress
              value={
                ((data.usage.postsPublished || 0) /
                  (data.usage.limits.postsPublished || 2)) *
                100
              }
              className="h-2"
            />
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-slate-600">
              <strong>Note:</strong> You won't be charged until you upgrade — no
              credit card required for trial.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PaidPlanView({
  data,
  onUpgrade,
  calculateMonthlyTotal,
  getPlanRate,
  formatCurrency,
  isAgencyTier,
}: {
  data: BillingData;
  onUpgrade: () => void;
  calculateMonthlyTotal: () => number;
  getPlanRate: () => number;
  formatCurrency: (amount: number) => string;
  isAgencyTier: boolean;
}) {
  const getStatusColor = (status: BillingData["subscription"]["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "past_due":
        return "bg-red-100 text-red-800";
      case "canceled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Plan Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Plan */}
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                Current Plan
              </CardTitle>
              <Badge className={getStatusColor(data.subscription.status)}>
                {data.subscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-3xl font-black text-purple-600 mb-1">
                {isAgencyTier ? "Agency Tier" : "Base Plan"}
              </h3>
              <p className="text-lg text-slate-700">
                {formatCurrency(getPlanRate())}/mo per business
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-purple-100">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Active Brands</span>
                  <span className="font-bold text-slate-900">
                    {data.subscription.brands}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Rate per Brand</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(getPlanRate())}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-900">
                      Monthly Total
                    </span>
                    <span className="font-black text-purple-600 text-lg">
                      {formatCurrency(calculateMonthlyTotal())}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {data.subscription.brands} brands ×{" "}
                    {formatCurrency(getPlanRate())}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Next billing date</span>
                <span className="font-medium text-slate-900">
                  {new Date(
                    data.subscription.currentPeriodEnd,
                  ).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Next charge</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(calculateMonthlyTotal())}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onUpgrade}
                >
                  View Plans
                </Button>
                <Button variant="outline" className="flex-1">
                  Update Payment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upgrade Opportunity (if applicable) */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isAgencyTier
                ? "You're on Agency Pricing!"
                : "Unlock Agency Pricing"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAgencyTier ? (
              <>
                <div className="flex items-center gap-2 text-lime-600 mb-3">
                  <Check className="h-5 w-5" />
                  <span className="font-semibold">
                    Auto-applied at 5+ brands
                  </span>
                </div>
                <p className="text-slate-700 mb-4">
                  You're getting the best rate at{" "}
                  <strong>{formatCurrency(99)}/mo per brand</strong>. Your
                  pricing automatically adjusted when you reached 5 brands.
                </p>
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-sm text-slate-700">
                    <strong>💡 Pro Tip:</strong> Add more brands to maximize
                    your savings. Each additional brand is just $99/mo.
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="text-slate-700 mb-4">
                  🎯 Managing 5 or more brands? You're eligible for{" "}
                  <strong>
                    Agency Pricing at {formatCurrency(99)}/mo per brand
                  </strong>
                  .
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-purple-600 mt-0.5" />
                    <span className="text-sm text-slate-700">
                      White-label portal & multi-brand dashboard
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-purple-600 mt-0.5" />
                    <span className="text-sm text-slate-700">
                      Role-based access & team analytics
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-purple-600 mt-0.5" />
                    <span className="text-sm text-slate-700">
                      Priority support & onboarding
                    </span>
                  </div>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button className="w-full gap-2">
                        Switch to Agency Plan
                        <Info className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Your pricing automatically adjusts at 5 brands — no
                        manual upgrade needed.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage Tracking */}
      <Card>
        <CardHeader>
          <CardTitle>Usage This Month</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Posts Published</span>
                <span className="font-semibold">
                  {data.usage.postsPublished}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Unlimited on paid plans
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Brands Managed</span>
                <span className="font-semibold">
                  {data.usage.brandsManaged}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Tied to pricing at {formatCurrency(getPlanRate())}/brand
              </div>
            </div>

            {data.usage.aiInsightsUsed !== undefined && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>AI Insights Used</span>
                  <span className="font-semibold">
                    {data.usage.aiInsightsUsed}
                  </span>
                </div>
                <div className="text-xs text-slate-500">Unlimited access</div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-slate-600">
              Usage resets on{" "}
              {new Date(
                data.subscription.currentPeriodEnd,
              ).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Billing History</CardTitle>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Download All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.invoices.length > 0 ? (
            <div className="space-y-4">
              {data.invoices.map((invoice) => (
                <InvoiceRow
                  key={invoice.id}
                  invoice={invoice}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600 text-center py-8">
              No billing history yet. Your first invoice will appear here after
              your first billing cycle.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Payment Method */}
      {data.paymentMethod && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">
                    {data.paymentMethod.brand} •••• {data.paymentMethod.last4}
                  </p>
                  <p className="text-sm text-gray-600">
                    Expires {data.paymentMethod.expiry}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Update
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AddOnsSection({ isTrial }: { isTrial: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Optional Add-ons</CardTitle>
        <p className="text-sm text-slate-600">
          Enhance your experience with these optional features
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-slate-900">
                  Add-on
                </th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">
                  Description
                </th>
                <th className="text-right py-3 px-4 font-semibold text-slate-900">
                  Price
                </th>
                <th className="text-right py-3 px-4 font-semibold text-slate-900">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-gray-50 transition-colors">
                <td className="py-4 px-4 font-medium text-slate-900">
                  Onboarding Concierge
                </td>
                <td className="py-4 px-4 text-slate-700">
                  Full setup & brand alignment session
                </td>
                <td className="py-4 px-4 text-right font-bold text-purple-600">
                  $299 per client
                </td>
                <td className="py-4 px-4 text-right">
                  <Button variant="outline" size="sm" disabled={isTrial}>
                    {isTrial ? "Upgrade First" : "Add Add-on"}
                  </Button>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-4 font-medium text-slate-900">
                  Custom Domain + White-Label Portal
                </td>
                <td className="py-4 px-4 text-slate-700">
                  Agency-branded interface
                </td>
                <td className="py-4 px-4 text-right font-bold text-purple-600">
                  $49/mo
                </td>
                <td className="py-4 px-4 text-right">
                  <Button variant="outline" size="sm" disabled={isTrial}>
                    {isTrial ? "Upgrade First" : "Add Add-on"}
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function InvoiceRow({
  invoice,
  formatCurrency,
}: {
  invoice: BillingData["invoices"][0];
  formatCurrency: (amount: number) => string;
}) {
  const getStatusColor = (status: BillingData["invoices"][0]["status"]) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <Calendar className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <p className="font-medium text-slate-900">{invoice.id}</p>
          <p className="text-sm text-gray-600">
            {new Date(invoice.date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-bold text-slate-900">
            {formatCurrency(invoice.amount)}
          </p>
          <Badge className={getStatusColor(invoice.status)}>
            {invoice.status}
          </Badge>
        </div>

        {invoice.status === "paid" && (
          <Button variant="ghost" size="sm" className="gap-1">
            <Download className="h-3 w-3" />
            PDF
          </Button>
        )}
      </div>
    </div>
  );
}
