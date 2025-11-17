/**
 * Interactive Demo Dashboard
 * 
 * Full-featured interactive demo that allows visitors to explore
 * the dashboard without signing up. Shows real UI components with
 * mock data and interactive elements.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  Zap, 
  BarChart3,
  FileText,
  Clock,
  AlertCircle,
  Eye,
  Settings,
  Sparkles
} from "lucide-react";
import { MetricCard } from "@/components/postd/ui/cards/MetricCard";
import { SectionCard } from "@/components/postd/ui/cards/SectionCard";
import { PrimaryButton } from "@/components/postd/ui/buttons/PrimaryButton";
import { SecondaryButton } from "@/components/postd/ui/buttons/SecondaryButton";

interface DemoPost {
  id: string;
  title: string;
  platform: string;
  status: "scheduled" | "published" | "reviewing" | "draft";
  scheduledDate?: string;
  engagement?: number;
}

const mockPosts: DemoPost[] = [
  { id: "1", title: "New Product Launch Announcement", platform: "LinkedIn", status: "scheduled", scheduledDate: "Today, 2:00 PM", engagement: 1250 },
  { id: "2", title: "Behind the Scenes: Team Spotlight", platform: "Instagram", status: "published", engagement: 3420 },
  { id: "3", title: "Weekly Tips: Content Strategy", platform: "Twitter", status: "reviewing" },
  { id: "4", title: "Customer Success Story", platform: "Facebook", status: "draft" },
];

const mockKPIs = [
  { id: "total-posts", label: "Total Posts", value: "24", change: "+12%", trend: "up" as const },
  { id: "engagement-rate", label: "Engagement Rate", value: "8.4%", change: "+2.1%", trend: "up" as const },
  { id: "top-channel", label: "Top Channel", value: "Instagram", change: "+18%", trend: "up" as const },
  { id: "scheduled", label: "Scheduled", value: "12", change: "+5", trend: "up" as const },
];

export function InteractiveDemo() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "content" | "analytics">("overview");
  const [selectedPost, setSelectedPost] = useState<DemoPost | null>(null);

  const handleGetStarted = () => {
    navigate("/onboarding");
  };

  const handleTryDemo = () => {
    // Scroll to demo section if already on page, or navigate
    const demoSection = document.getElementById("interactive-demo");
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section 
      id="interactive-demo"
      className="py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-white via-slate-50/20 to-white relative overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-10 right-0 w-96 h-96 bg-indigo-200/25 rounded-full blur-3xl animate-gradient-shift"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-slate-200/15 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }}></div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4 px-4 py-2 bg-indigo-100 rounded-full border border-indigo-200">
            <p className="text-sm font-bold text-indigo-700">🎬 Interactive Demo</p>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-4 leading-tight">
            Explore Your Dashboard
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-6">
            Click around and see how Postd works. No signup required.
          </p>
          <div className="flex items-center justify-center gap-4">
            <PrimaryButton onClick={handleGetStarted} className="px-8 py-3">
              Get Started Free
              <Zap className="w-4 h-4 ml-2" />
            </PrimaryButton>
            <SecondaryButton onClick={handleTryDemo} className="px-8 py-3">
              Try Demo
            </SecondaryButton>
          </div>
        </div>

        {/* Interactive Dashboard */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-indigo-300/30 border border-white/70 overflow-hidden">
          {/* Tab Navigation */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 md:px-8 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-white/80 uppercase tracking-wider">
                  Demo Dashboard
                </p>
                <p className="text-sm font-black text-white">
                  Your Postd Workspace
                </p>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-black border border-white/30">
                Z
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-2">
              {[
                { id: "overview", label: "Overview", icon: BarChart3 },
                { id: "content", label: "Content", icon: FileText },
                { id: "analytics", label: "Analytics", icon: TrendingUp },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                      activeTab === tab.id
                        ? "bg-white text-indigo-600"
                        : "bg-white/10 text-white/80 hover:bg-white/20"
                    }`}
                  >
                    <Icon className="w-4 h-4 inline mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6 md:p-8">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* KPI Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {mockKPIs.map((kpi) => {
                    const iconMap: Record<string, typeof FileText> = {
                      "total-posts": FileText,
                      "engagement-rate": TrendingUp,
                      "top-channel": BarChart3,
                      "scheduled": Calendar,
                    };
                    const Icon = iconMap[kpi.id] || FileText;
                    return (
                      <MetricCard
                        key={kpi.id}
                        icon={Icon}
                        label={kpi.label}
                        value={kpi.value}
                        change={kpi.change}
                        trend={kpi.trend}
                        color="primary"
                      />
                    );
                  })}
                </div>

                {/* Status Overview */}
                <SectionCard>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Content Status</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Scheduled", count: 12, color: "blue", icon: Calendar },
                      { label: "Published", count: 8, color: "green", icon: CheckCircle },
                      { label: "Reviewing", count: 4, color: "orange", icon: Clock },
                      { label: "Drafts", count: 3, color: "gray", icon: FileText },
                    ].map((status) => {
                      const Icon = status.icon;
                      return (
                        <div
                          key={status.label}
                          className="p-4 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
                          onClick={() => setActiveTab("content")}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className={`w-4 h-4 text-${status.color}-600`} />
                            <span className="text-xs font-bold text-slate-600">{status.label}</span>
                          </div>
                          <p className="text-2xl font-black text-slate-900">{status.count}</p>
                        </div>
                      );
                    })}
                  </div>
                </SectionCard>

                {/* AI Advisor Insight */}
                <SectionCard>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🦓</div>
                    <div>
                      <p className="text-sm font-bold text-slate-700 mb-1">Zia's Smart Tip</p>
                      <p className="text-sm text-slate-600">
                        "Your best posting time is 2-4 PM EST. I've scheduled 3 posts for Monday during that window."
                      </p>
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}

            {activeTab === "content" && (
              <div className="space-y-4">
                <SectionCard>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Content</h3>
                  <div className="space-y-3">
                    {mockPosts.map((post) => (
                      <div
                        key={post.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                          selectedPost?.id === post.id
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-slate-200 bg-white"
                        }`}
                        onClick={() => setSelectedPost(post)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-bold text-slate-600 uppercase">{post.platform}</span>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                post.status === "published" ? "bg-green-100 text-green-700" :
                                post.status === "scheduled" ? "bg-blue-100 text-blue-700" :
                                post.status === "reviewing" ? "bg-orange-100 text-orange-700" :
                                "bg-gray-100 text-gray-700"
                              }`}>
                                {post.status}
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-900 mb-1">{post.title}</h4>
                            {post.scheduledDate && (
                              <p className="text-xs text-slate-500">Scheduled: {post.scheduledDate}</p>
                            )}
                            {post.engagement && (
                              <p className="text-xs text-slate-500 mt-1">Engagement: {post.engagement.toLocaleString()}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button className="p-2 rounded hover:bg-slate-100 transition-colors">
                              <Eye className="w-4 h-4 text-slate-600" />
                            </button>
                            <button className="p-2 rounded hover:bg-slate-100 transition-colors">
                              <Settings className="w-4 h-4 text-slate-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="space-y-6">
                <SectionCard>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Performance Overview</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-bold text-slate-600 mb-2">Total Reach</p>
                      <p className="text-3xl font-black text-slate-900">24.5K</p>
                      <p className="text-xs text-green-600 mt-1">+18% vs last month</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-600 mb-2">Total Engagement</p>
                      <p className="text-3xl font-black text-slate-900">1,842</p>
                      <p className="text-xs text-green-600 mt-1">+12% vs last month</p>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Top Performing Content</h3>
                  <div className="space-y-3">
                    {mockPosts
                      .filter(p => p.engagement)
                      .sort((a, b) => (b.engagement || 0) - (a.engagement || 0))
                      .map((post) => (
                        <div key={post.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{post.title}</p>
                            <p className="text-xs text-slate-500">{post.platform}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-slate-900">{post.engagement?.toLocaleString()}</p>
                            <p className="text-xs text-slate-500">engagements</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </SectionCard>
              </div>
            )}
          </div>

          {/* Footer CTA */}
          <div className="bg-slate-50 border-t border-slate-200/50 px-6 md:px-8 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-600 text-center sm:text-left">
                ✨ Ready to see this in your workspace? Start your free trial today.
              </p>
              <PrimaryButton onClick={handleGetStarted} className="px-6 py-2">
                Get Started Free
                <Zap className="w-4 h-4 ml-2" />
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

