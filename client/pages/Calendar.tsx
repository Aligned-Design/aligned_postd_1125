import { useState } from "react";
import { AppShell } from "@postd/layout/AppShell";
import { CalendarAccordion } from "@/components/dashboard/CalendarAccordion";
import { MonthCalendarView } from "@/components/dashboard/MonthCalendarView";
import { DayViewHourly } from "@/components/dashboard/DayViewHourly";
import { SchedulingAdvisor } from "@/components/dashboard/SchedulingAdvisor";
import { AnalyticsPanel } from "@/components/dashboard/AnalyticsPanel";
import { FirstVisitTooltip } from "@/components/dashboard/FirstVisitTooltip";
import { X, Filter } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";

type ViewType = "day" | "week" | "month";

export default function Calendar() {
  const { currentWorkspace } = useWorkspace();
  const [view, setView] = useState<ViewType>("week");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const brands = ["Aligned-20AI", "Brand B", "Brand C"];
  const platforms = ["LinkedIn", "Instagram", "Facebook", "Twitter", "TikTok", "YouTube"];
  const campaigns = ["Product Launch", "Holiday Promo", "Brand Awareness", "Customer Spotlight"];

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const clearFilters = () => {
    setSelectedBrand(null);
    setSelectedPlatforms([]);
    setSelectedCampaign(null);
  };

  const hasActiveFilters = selectedBrand || selectedPlatforms.length > 0 || selectedCampaign;

  return (
    <AppShell>
      <FirstVisitTooltip page="calendar">
        <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20">
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2 sm:mb-3">
              Content Calendar
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm font-medium">
              {currentWorkspace?.logo} {currentWorkspace?.name} — Visualize and manage all your scheduled content across platforms.
            </p>
          </div>

          {/* ZONE 1: View Toggles & Filters */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* View Toggle */}
            <div className="inline-flex gap-2 rounded-lg bg-white/50 backdrop-blur-xl border border-white/60 p-1">
              <button
                onClick={() => setView("day")}
                className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${
                  view === "day"
                    ? "bg-lime-400 text-indigo-950"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/30"
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setView("week")}
                className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${
                  view === "week"
                    ? "bg-lime-400 text-indigo-950"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/30"
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setView("month")}
                className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${
                  view === "month"
                    ? "bg-lime-400 text-indigo-950"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/30"
                }`}
              >
                Month
              </button>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/50 backdrop-blur-xl border border-white/60 hover:border-indigo-300/50 text-slate-700 font-bold text-sm transition-all"
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && <span className="ml-1 px-2 py-0.5 rounded-full bg-lime-400 text-indigo-950 text-xs font-black">Active</span>}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mb-8 p-4 rounded-lg bg-white/50 backdrop-blur-xl border border-white/60 space-y-4 animate-[slideDown_200ms_ease-out]">
              {/* Brand Filter */}
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-2">Brand</h3>
                <div className="flex flex-wrap gap-2">
                  {brands.map((brand) => (
                    <button
                      key={brand}
                      onClick={() => setSelectedBrand(selectedBrand === brand ? null : brand)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedBrand === brand
                          ? "bg-lime-400 text-indigo-950"
                          : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform Filter */}
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-2">Platforms</h3>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((platform) => (
                    <button
                      key={platform}
                      onClick={() => togglePlatform(platform)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedPlatforms.includes(platform)
                          ? "bg-lime-400 text-indigo-950"
                          : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                      }`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>

              {/* Campaign Filter */}
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-2">Campaign</h3>
                <div className="flex flex-wrap gap-2">
                  {campaigns.map((campaign) => (
                    <button
                      key={campaign}
                      onClick={() => setSelectedCampaign(selectedCampaign === campaign ? null : campaign)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedCampaign === campaign
                          ? "bg-lime-400 text-indigo-950"
                          : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                      }`}
                    >
                      {campaign}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* ZONE 2: Calendar Views */}
          <div className="mb-12">
            {view === "day" && (
              <DayViewHourly
                filterBrand={selectedBrand}
                filterPlatforms={selectedPlatforms}
                filterCampaign={selectedCampaign}
              />
            )}
            {view === "week" && (
              <CalendarAccordion
                view={view}
                filterBrand={selectedBrand}
                filterPlatforms={selectedPlatforms}
                filterCampaign={selectedCampaign}
              />
            )}
            {view === "month" && (
              <MonthCalendarView
                filterBrand={selectedBrand}
                filterPlatforms={selectedPlatforms}
                filterCampaign={selectedCampaign}
              />
            )}
          </div>

          {/* ZONE 3: Scheduling Advisor */}
          <div className="mb-12">
            <SchedulingAdvisor />
          </div>

          {/* ZONE 4: Performance Metrics */}
          <div>
            <h2 className="text-xl font-black text-slate-900 mb-4">Performance Insights</h2>
            <AnalyticsPanel />
          </div>
        </div>
      </div>
      </FirstVisitTooltip>
    </AppShell>
  );
}
