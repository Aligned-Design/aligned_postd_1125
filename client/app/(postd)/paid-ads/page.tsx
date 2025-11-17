import { ActionableAdvisor, AdvisorInsight } from "@/components/dashboard/ActionableAdvisor";
import { Zap, AlertCircle, TrendingUp, DollarSign, Plus, RefreshCw, Clock } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useState, useEffect } from "react";
import { usePaidAds } from "@/hooks/use-paid-ads";
import { useToast } from "@/hooks/use-toast";

export default function PaidAds() {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const { accounts, campaigns, loading, error, fetchAccounts, fetchCampaigns, pauseCampaign, resumeCampaign } = usePaidAds({
    autoFetch: true,
  });

  const [advisorInsights, setAdvisorInsights] = useState<AdvisorInsight[]>([]);

  // Generate advisor insights based on campaign data
  useEffect(() => {
    const newInsights: AdvisorInsight[] = [];

    if (campaigns.length === 0 && accounts.length > 0) {
      newInsights.push({
        id: "no-campaigns",
        type: "opportunity",
        priority: "high",
        title: "Create Your First Campaign",
        description: "You have connected accounts but no active campaigns yet.",
        action: {
          label: "Create Campaign",
          handler: () => {
            toast({
              title: "Coming Soon",
              description: "Campaign creation wizard will be available soon",
            });
          },
          icon: <Plus className="w-4 h-4" />,
        },
      });
    }

    if (accounts.length === 0) {
      newInsights.push({
        id: "no-accounts",
        type: "warning",
        priority: "high",
        title: "No Ad Accounts Connected",
        description: "Connect Meta, Google, or LinkedIn accounts to get started.",
        action: {
          label: "Connect Account",
          handler: () => {
            toast({
              title: "Coming Soon",
              description: "Account connection wizard will be available soon",
            });
          },
          icon: <Plus className="w-4 h-4" />,
        },
      });
    }

    // Check for underperforming campaigns
    const underperforming = campaigns.filter(
      (c) => c.performance && c.performance.roas < 1.5 && c.status === "active"
    );
    if (underperforming.length > 0) {
      newInsights.push({
        id: "underperforming",
        type: "warning",
        priority: "high",
        title: `${underperforming.length} Underperforming Campaign${underperforming.length > 1 ? "s" : ""}`,
        description: `Campaign${underperforming.length > 1 ? "s" : ""} with ROAS below 1.5x. Consider optimizing targeting or creatives.`,
        action: {
          label: "View Optimization Tips",
          handler: () => {
            toast({
              title: "Optimization Tips",
              description: "Review creative performance and adjust targeting",
            });
          },
          icon: <TrendingUp className="w-4 h-4" />,
        },
      });
    }

    // Budget warnings
    const highSpend = campaigns.filter(
      (c) => c.performance && c.performance.spend > c.budget * 0.8
    );
    if (highSpend.length > 0) {
      newInsights.push({
        id: "high-spend",
        type: "suggestion",
        priority: "medium",
        title: "Review Campaign Budgets",
        description: `${highSpend.length} campaign${highSpend.length > 1 ? "s" : ""} approaching budget limits.`,
        action: {
          label: "Adjust Budgets",
          handler: () => {
            toast({
              title: "Budget Management",
              description: "Adjust campaign budgets to optimize spending",
            });
          },
          icon: <DollarSign className="w-4 h-4" />,
        },
      });
    }

    setAdvisorInsights(newInsights);
  }, [campaigns, accounts, toast]);

  const totalSpend = campaigns.reduce((sum, c) => sum + c.performance.spend, 0);
  const totalRoas = campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + c.performance.roas, 0) / campaigns.length : 0;
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;

  return (    
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20">
        <div className="p-4 sm:p-6 md:p-8">
          {/* BETA BANNER - Prominent "Coming Soon" Message */}
          <div className="mb-8 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-lg flex items-start gap-3">
            <Clock className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-black text-amber-900 text-lg">Paid Ads – Coming Soon</h2>
              <p className="text-sm text-amber-800 mt-1">
                This feature is currently in beta testing. Full campaign management across Meta, Google, and LinkedIn will be available in a future update.
              </p>
              <button
                onClick={() => {
                  toast({
                    title: "Notify Me",
                    description: "We'll let you know when Paid Ads launches!",
                  });
                }}
                className="mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-lg transition-colors"
              >
                Notify Me When Live
              </button>
            </div>
          </div>

          {/* Page Header */}
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
                Paid Ads
              </h1>
              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-black rounded-full uppercase tracking-wide">
                Beta
              </span>
            </div>
            <p className="text-slate-600 text-xs sm:text-sm font-medium">
              {currentWorkspace?.logo} {currentWorkspace?.name} — Preview: Manage and optimize campaigns across Meta, Google, and LinkedIn (coming soon).
            </p>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-900">Error loading campaigns</h3>
                <p className="text-sm text-red-800 mt-1">{error.message}</p>
              </div>
            </div>
          )}

          {/* ZONE 1: Campaign Overview */}
          <div className="mb-12 bg-white/50 backdrop-blur-xl rounded-2xl p-6 border border-white/60 hover:bg-white/70 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-200/50 to-blue-200/40 flex items-center justify-center border border-indigo-200/30">
                  <Zap className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Active Campaigns</h2>
                  <p className="text-xs text-slate-600 font-medium">{activeCampaigns} running • ${totalSpend.toFixed(2)} spend</p>
                </div>
              </div>
              <button
                onClick={() => {
                  fetchAccounts();
                  fetchCampaigns();
                }}
                disabled={loading}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh campaign data"
              >
                <RefreshCw className={`w-5 h-5 text-indigo-600 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div>
                <p className="text-xs text-slate-600 font-bold uppercase tracking-wider mb-1">Connected Accounts</p>
                <p className="text-2xl font-black text-slate-900">{accounts.length}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 font-bold uppercase tracking-wider mb-1">Total ROAS</p>
                <p className="text-2xl font-black text-slate-900">{totalRoas.toFixed(2)}x</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 font-bold uppercase tracking-wider mb-1">Avg CPC</p>
                <p className="text-2xl font-black text-slate-900">
                  ${campaigns.length > 0 ? (campaigns.reduce((sum, c) => sum + c.performance.cpc, 0) / campaigns.length).toFixed(2) : "0.00"}
                </p>
              </div>
            </div>
          </div>

          {/* ZONE 2: Campaign List & Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-12">
            <div className="lg:col-span-2">
              {campaigns.length === 0 ? (
                <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-12 border border-white/60 text-center">
                  <div className="mb-4 text-4xl">🕐</div>
                  <h3 className="text-lg font-black text-slate-900 mb-2">Paid Ads Coming Soon</h3>
                  <p className="text-slate-600 text-sm mb-6">
                    Full campaign management and optimization features are currently in development. Check back soon!
                  </p>
                  <button
                    disabled
                    title="This feature is coming soon"
                    className="px-6 py-3 bg-slate-200 text-slate-500 font-bold rounded-lg cursor-not-allowed opacity-60"
                  >
                    Coming Soon
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-900 mb-4">Campaigns ({campaigns.length})</h3>
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="bg-white/50 backdrop-blur-xl rounded-lg p-4 border border-white/60 hover:border-indigo-200 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-slate-900">{campaign.name}</h4>
                          <p className="text-xs text-slate-600 mt-1">
                            {campaign.platform.charAt(0).toUpperCase() + campaign.platform.slice(1)} • {campaign.objective}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          campaign.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          {campaign.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs mb-3">
                        <div>
                          <p className="text-slate-600">Spend</p>
                          <p className="font-bold text-slate-900">${campaign.performance.spend.toFixed(0)}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">ROAS</p>
                          <p className="font-bold text-slate-900">{campaign.performance.roas.toFixed(2)}x</p>
                        </div>
                        <div>
                          <p className="text-slate-600">CTR</p>
                          <p className="font-bold text-slate-900">{campaign.performance.ctr.toFixed(2)}%</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Conversions</p>
                          <p className="font-bold text-slate-900">{campaign.performance.conversions}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {campaign.status === "active" ? (
                          <button
                            onClick={() => pauseCampaign(campaign.id)}
                            className="flex-1 px-3 py-2 text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 rounded transition-colors"
                          >
                            Pause
                          </button>
                        ) : (
                          <button
                            onClick={() => resumeCampaign(campaign.id)}
                            className="flex-1 px-3 py-2 text-xs font-bold bg-green-100 hover:bg-green-200 text-green-950 rounded transition-colors"
                          >
                            Resume
                          </button>
                        )}
                        <button className="flex-1 px-3 py-2 text-xs font-bold bg-indigo-100 hover:bg-indigo-200 text-indigo-950 rounded transition-colors">
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="lg:sticky lg:top-20 lg:h-fit">
              <ActionableAdvisor
                title="Ads Advisor"
                subtitle="Campaign optimization tips"
                insights={advisorInsights}
                emptyState={
                  <div className="text-center py-6">
                    <p className="text-slate-600 text-sm">All campaigns performing well!</p>
                  </div>
                }
              />
            </div>
          </div>
        </div>
      </div>
    
  );
}
