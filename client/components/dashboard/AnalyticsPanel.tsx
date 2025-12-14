import { BarChart3, TrendingUp, Plus, Youtube, Mail, ShoppingCart, Globe } from "lucide-react";
import { Facebook, Twitter, Instagram, Linkedin, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

interface AnalyticsCard {
  label: string;
  value: string;
  change?: string;
  icon: string;
}

interface Integration {
  name: string;
  icon: LucideIcon;
  connected: boolean;
}

export function AnalyticsPanel() {
  const analytics: AnalyticsCard[] = [
    { label: "Total Reach", value: "124.5K", change: "+12%", icon: "📊" },
    { label: "Engagement Rate", value: "8.2%", change: "+0.4%", icon: "📈" },
    { label: "Conversion Rate", value: "3.4%", change: "+0.8%", icon: "✨" },
  ];

  const integrations: Integration[] = [
    { name: "Meta", icon: Facebook, connected: true },
    { name: "Instagram", icon: Instagram, connected: true },
    { name: "LinkedIn", icon: Linkedin, connected: true },
    { name: "Google Business", icon: Share2, connected: false },
    { name: "YouTube", icon: Youtube, connected: false },
    { name: "TikTok", icon: Twitter, connected: false },
    { name: "Pinterest", icon: Globe, connected: false },
    { name: "Shopify", icon: ShoppingCart, connected: false },
    { name: "Email", icon: Mail, connected: false },
    { name: "Blog Posts", icon: Globe, connected: false },
  ];

  const connectedCount = integrations.filter((i) => i.connected).length;

  return (
    <div className="space-y-8 mb-12">
      {/* Analytics Cards - Match Good News Format */}
      <div className="bg-white/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/60 hover:bg-white/50 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
        {/* Glassmorphism gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 via-blue-50/10 to-transparent rounded-2xl -z-10"></div>

        <div className="relative flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-200/50 to-blue-200/50 backdrop-blur flex items-center justify-center border border-indigo-200/30 group-hover:scale-110 transition-transform duration-300">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="text-lg font-black text-slate-900">Performance Metrics</h3>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4">
          {analytics.map((metric, idx) => (
            <div
              key={idx}
              className="group/metric bg-gradient-to-br from-indigo-50/40 to-blue-50/20 border border-indigo-200/30 rounded-xl p-3 sm:p-4 hover:from-indigo-100/50 hover:to-blue-100/30 hover:border-indigo-300/50 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <span className="text-lg sm:text-2xl">{metric.icon}</span>
                {metric.change && (
                  <TrendingUp className="w-4 h-4 text-green-500 opacity-0 group-hover/metric:opacity-100 transition-opacity" />
                )}
              </div>
              <p className="text-indigo-700 text-xs font-bold uppercase tracking-widest mb-1">
                {metric.label}
              </p>
              <p className="text-slate-900 font-black text-xl sm:text-2xl mb-1">{metric.value}</p>
              {metric.change && (
                <p className="text-green-600 text-xs font-bold">{metric.change}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Platform Integrations - Simplified */}
      <div className="bg-white/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/60 hover:bg-white/50 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
        {/* Glassmorphism gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 via-blue-50/10 to-transparent rounded-2xl -z-10"></div>

        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-200/50 to-blue-200/50 backdrop-blur flex items-center justify-center border border-indigo-200/30 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Platform Integrations</h3>
          </div>
          <span className="text-xs font-bold px-2.5 py-1.5 rounded-full bg-lime-400/20 text-lime-700 border border-lime-400/40">
            {connectedCount}/{integrations.length} Connected
          </span>
        </div>

        <div className="relative space-y-4">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
            {integrations.map((integration, idx) => {
              const Icon = integration.icon;
              return (
                <div
                  key={idx}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-300 ${
                    integration.connected
                      ? "bg-lime-50 border border-lime-400 shadow-sm shadow-lime-400/20 hover:shadow-md"
                      : "bg-gray-50 border border-gray-300 hover:border-gray-400"
                  }`}
                  title={integration.name}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 transition-all duration-300 ${
                    integration.connected
                      ? "bg-white border-lime-400 text-lime-600"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className={`text-xs font-bold text-center leading-tight ${
                    integration.connected ? "text-lime-700" : "text-gray-500"
                  }`}>
                    {integration.name}
                  </p>
                </div>
              );
            })}
          </div>
          <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow-lg hover:shadow-xl transition-all duration-200 h-10">
            <Plus className="w-4 h-4" />
            Connect Another Account
          </Button>
        </div>
      </div>
    </div>
  );
}
