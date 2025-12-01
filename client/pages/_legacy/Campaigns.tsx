// LEGACY PAGE (archived)
// This file is not routed or imported anywhere.
// Canonical implementation lives under client/app/(postd)/...
// Safe to delete after one or two stable releases.

/* eslint-disable */
import { AppShell } from "@postd/layout/AppShell";
import { CampaignCard } from "@/components/dashboard/CampaignCard";
import { StartNewCampaignModal } from "@/components/dashboard/StartNewCampaignModal";
import { CampaignInsightsPanel } from "@/components/dashboard/CampaignInsightsPanel";
import { Campaign, CampaignIdea } from "@/types/campaign";
import { Plus, TrendingUp, Users, Target } from "lucide-react";
import { useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { logTelemetry } from "@/lib/logger";

export default function Campaigns() {
  const { currentWorkspace } = useWorkspace();
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: "1",
      name: "Spring Product Launch",
      status: "active",
      goal: "awareness",
      description: "Launch of our new product line across all social channels with influencer partnerships",
      startDate: "2024-03-01",
      endDate: "2024-03-31",
      targetPlatforms: ["instagram", "tiktok", "youtube"],
      brand: "POSTD",
      createdDate: "2024-02-10",
      postCount: 15,
      performance: {
        reach: 45000,
        engagement: 8.2,
        conversions: 320,
        performancePercent: 18,
      },
      keyMessage: "Transform your creativity with our new AI tools",
    },
    {
      id: "2",
      name: "Customer Testimonial Campaign",
      status: "active",
      goal: "engagement",
      description: "Showcase real customer success stories and testimonials",
      startDate: "2024-02-15",
      endDate: "2024-03-15",
      targetPlatforms: ["linkedin", "instagram", "facebook"],
      brand: "POSTD",
      createdDate: "2024-02-01",
      postCount: 10,
      performance: {
        reach: 32000,
        engagement: 10.5,
        conversions: 240,
        performancePercent: 25,
      },
    },
    {
      id: "3",
      name: "Q2 Content Series",
      status: "planned",
      goal: "engagement",
      description: "Educational content series focusing on industry trends and best practices",
      startDate: "2024-04-01",
      endDate: "2024-06-30",
      targetPlatforms: ["linkedin", "youtube"],
      brand: "POSTD",
      createdDate: "2024-02-20",
      postCount: 24,
    },
    {
      id: "4",
      name: "Summer Giveaway Campaign",
      status: "planned",
      goal: "sales",
      description: "Summer promotion with giveaways to drive sales and grow audience",
      startDate: "2024-06-15",
      endDate: "2024-07-31",
      targetPlatforms: ["instagram", "tiktok", "facebook"],
      brand: "POSTD",
      createdDate: "2024-02-18",
    },
    {
      id: "5",
      name: "Holiday Campaign 2023",
      status: "completed",
      goal: "sales",
      description: "Holiday season promotional campaign",
      startDate: "2023-11-15",
      endDate: "2023-12-31",
      targetPlatforms: ["facebook", "instagram", "youtube"],
      brand: "POSTD",
      createdDate: "2023-10-01",
      postCount: 28,
      performance: {
        reach: 120000,
        engagement: 12.3,
        conversions: 1200,
        performancePercent: 35,
      },
    },
    {
      id: "6",
      name: "Email Winter Series",
      status: "draft",
      goal: "engagement",
      description: "Winter-themed email marketing campaign",
      startDate: "2024-01-15",
      endDate: "2024-02-28",
      targetPlatforms: ["linkedin"],
      brand: "POSTD",
      createdDate: "2024-01-05",
    },
  ]);

  const [ideas, setIdeas] = useState<CampaignIdea[]>([
    {
      id: "idea-1",
      name: "Black Friday Mega Sale",
      status: "idea",
      notes: "50% off all products, limited time. Include countdowns, urgency messaging, and bundle offers.",
      tags: ["sales", "seasonal", "high-impact"],
      theme: "Black Friday",
      createdDate: "2024-02-10",
      brand: "POSTD",
    },
    {
      id: "idea-2",
      name: "Behind-the-Scenes Series",
      status: "idea",
      notes: "Show team culture, product development, daily operations. Build authentic connection with audience.",
      tags: ["engagement", "authentic", "content-series"],
      theme: "Culture",
      createdDate: "2024-02-08",
      brand: "POSTD",
    },
    {
      id: "idea-3",
      name: "AI Ethics Discussion",
      status: "idea",
      notes: "Educational campaign on responsible AI use, data privacy, and ethical considerations.",
      tags: ["awareness", "thought-leadership", "education"],
      theme: "Education",
      createdDate: "2024-02-05",
      brand: "POSTD",
    },
    {
      id: "idea-4",
      name: "Partner Collaboration Series",
      status: "idea",
      notes: "Co-marketing with complementary brands to reach new audiences.",
      tags: ["partnership", "growth", "collaboration"],
      theme: "Partnership",
      createdDate: "2024-01-28",
      brand: "POSTD",
    },
  ]);

  const quickStats = {
    activeCampaigns: campaigns.filter((c) => c.status === "active").length,
    totalReach: campaigns
      .filter((c) => c.performance)
      .reduce((sum, c) => sum + (c.performance?.reach || 0), 0),
    bestPerformer:
      campaigns.reduce((max, c) =>
        (c.performance?.performancePercent || 0) >
        (max.performance?.performancePercent || 0)
          ? c
          : max
      )?.name || "N/A",
  };

  const handleCreateCampaign = (
    campaignData: Partial<Campaign>,
    aiGenerate: boolean
  ) => {
    const totalPosts = campaignData.contentDistribution?.reduce(
      (sum, item) => sum + item.count,
      0
    ) || 0;

    const newCampaign: Campaign = {
      id: Date.now().toString(),
      name: campaignData.name || "Untitled Campaign",
      status: campaignData.status || "draft",
      goal: campaignData.goal || "awareness",
      description: campaignData.description,
      startDate: campaignData.startDate || new Date().toISOString().split("T")[0],
      endDate: campaignData.endDate || new Date().toISOString().split("T")[0],
      targetPlatforms: campaignData.targetPlatforms || [],
      brand: campaignData.brand || "POSTD",
      createdDate: new Date().toISOString().split("T")[0],
      tone: campaignData.tone,
      keyMessage: campaignData.keyMessage,
      audiencePersona: campaignData.audiencePersona,
      postFrequency: campaignData.postFrequency,
      contentDistribution: campaignData.contentDistribution,
      postCount: totalPosts || (aiGenerate ? parseInt(campaignData.postFrequency || "5") : undefined),
    };

    setCampaigns([newCampaign, ...campaigns]);

    if (aiGenerate) {
      logTelemetry("AI will generate content for campaign", { campaignId: newCampaign.id, campaignName: newCampaign.name });
    }
  };

  const handleEditCampaign = (campaign: Campaign) => {
    logTelemetry("Edit campaign", { campaignId: campaign.id, campaignName: campaign.name });
  };

  const handleDeleteCampaign = (id: string) => {
    if (window.confirm("Are you sure you want to delete this campaign?")) {
      setCampaigns(campaigns.filter((c) => c.id !== id));
    }
  };

  const handleConvertIdea = (idea: CampaignIdea) => {
    const newCampaign: Campaign = {
      id: Date.now().toString(),
      name: idea.name,
      status: "draft",
      goal: "awareness",
      description: idea.notes,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      targetPlatforms: [],
      brand: idea.brand,
      createdDate: new Date().toISOString().split("T")[0],
    };

    setCampaigns([newCampaign, ...campaigns]);
    setIdeas(ideas.filter((i) => i.id !== idea.id));
  };

  const handleDeleteIdea = (id: string) => {
    if (window.confirm("Are you sure you want to delete this idea?")) {
      setIdeas(ideas.filter((i) => i.id !== id));
    }
  };

  const activeCampaigns = campaigns.filter((c) => c.status === "active");
  const plannedCampaigns = campaigns.filter((c) => c.status === "planned");
  const draftCampaigns = campaigns.filter((c) => c.status === "draft");
  const completedCampaigns = campaigns.filter((c) => c.status === "completed");

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20">
        <div className="p-4 sm:p-6 md:p-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">Campaigns</h1>
            <p className="text-slate-600 text-xs sm:text-sm font-medium">
              {currentWorkspace?.logo} {currentWorkspace?.name} — Plan, track, and analyze your marketing campaigns across all platforms
            </p>
          </div>

          {/* Quick Stats Bar */}
          <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/50 backdrop-blur-xl rounded-xl p-4 sm:p-5 border border-white/60 hover:bg-white/70 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Active Campaigns
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900">
                    {quickStats.activeCampaigns}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-lime-200/50 to-green-200/50 flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/50 backdrop-blur-xl rounded-xl p-4 sm:p-5 border border-white/60 hover:bg-white/70 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Total Reach
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900">
                    {(quickStats.totalReach / 1000).toFixed(0)}K
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-200/50 to-indigo-200/50 flex items-center justify-center">
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/50 backdrop-blur-xl rounded-xl p-4 sm:p-5 border border-white/60 hover:bg-white/70 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Best Performer
                  </p>
                  <p className="text-sm sm:text-base font-black text-slate-900 line-clamp-2">
                    {quickStats.bestPerformer}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-200/50 to-orange-200/50 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Start New Campaign Button */}
          <div className="mb-8">
            <button
              onClick={() => setShowNewCampaignModal(true)}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-base sm:text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              Start New Campaign
            </button>
          </div>

          {/* AI Insights Panel */}
          <div className="mb-12">
            <CampaignInsightsPanel />
          </div>

          {/* Active Campaigns Section */}
          {activeCampaigns.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Active Campaigns ({activeCampaigns.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeCampaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onEdit={handleEditCampaign}
                    onDelete={handleDeleteCampaign}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Planned Campaigns Section */}
          {plannedCampaigns.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Planned Campaigns ({plannedCampaigns.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plannedCampaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onEdit={handleEditCampaign}
                    onDelete={handleDeleteCampaign}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Draft Campaigns Section */}
          {draftCampaigns.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Drafts ({draftCampaigns.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {draftCampaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onEdit={handleEditCampaign}
                    onDelete={handleDeleteCampaign}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Campaigns Section */}
          {completedCampaigns.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Completed Campaigns ({completedCampaigns.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedCampaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onEdit={handleEditCampaign}
                    onDelete={handleDeleteCampaign}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Ideas Section */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Campaign Ideas & Brainstorms ({ideas.length})
              </h2>
              <p className="text-xs text-slate-500 font-medium ml-auto">
                Lightweight ideas ready to convert into campaigns
              </p>
            </div>

            {ideas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ideas.map((idea) => (
                  <div
                    key={idea.id}
                    className="group bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 hover:bg-white/70 hover:shadow-md hover:border-white/80 transition-all duration-300 overflow-hidden"
                  >
                    {/* Header */}
                    <div className="h-1 bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-500"></div>

                    <div className="p-4 sm:p-5 relative">
                      {/* Title */}
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <h3 className="text-sm font-black text-slate-900 line-clamp-2">
                          {idea.name}
                        </h3>
                      </div>

                      {/* Notes */}
                      <p className="text-xs text-slate-600 mb-4 line-clamp-3">
                        {idea.notes}
                      </p>

                      {/* Theme badge */}
                      {idea.theme && (
                        <div className="mb-4">
                          <span className="inline-block px-2 py-1 rounded-lg bg-orange-100/50 border border-orange-300/50 text-orange-700 text-xs font-bold">
                            📌 {idea.theme}
                          </span>
                        </div>
                      )}

                      {/* Tags */}
                      {idea.tags && idea.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4 pt-4 border-t border-slate-200">
                          {idea.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 rounded text-xs font-medium bg-slate-100/50 text-slate-600 border border-slate-200"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-3 border-t border-slate-200">
                        <button
                          onClick={() => handleConvertIdea(idea)}
                          className="flex-1 px-3 py-2 rounded-lg bg-lime-400/20 border border-lime-400/60 text-lime-700 font-bold text-xs hover:bg-lime-400/30 transition-all duration-200"
                        >
                          Convert to Campaign
                        </button>
                        <button
                          onClick={() => handleDeleteIdea(idea.id)}
                          className="px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-red-600 font-bold text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/30 backdrop-blur-xl rounded-xl border border-white/60 p-12 text-center">
                <p className="text-slate-600 font-medium mb-3">No campaign ideas yet</p>
                <button
                  onClick={() => setShowNewCampaignModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Your First Idea
                </button>
              </div>
            )}
          </div>

          {/* Empty State */}
          {campaigns.length === 0 && ideas.length === 0 && (
            <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/60">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-black text-slate-900 mb-2">No campaigns yet</h3>
              <p className="text-slate-600 font-medium mb-6">Start planning your first campaign today</p>
              <button
                onClick={() => setShowNewCampaignModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5" />
                Start New Campaign
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <StartNewCampaignModal
        isOpen={showNewCampaignModal}
        onClose={() => setShowNewCampaignModal(false)}
        onCreate={handleCreateCampaign}
      />
    </AppShell>
  );
}
