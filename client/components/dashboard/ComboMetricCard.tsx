import { LucideIcon } from "lucide-react";

interface MetricItem {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
}

interface ComboMetricCardProps {
  metrics: MetricItem[];
}

export function ComboMetricCard({ metrics }: ComboMetricCardProps) {
  return (
    <div className="bg-white/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/60 hover:bg-white/50 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
      {/* Glassmorphism gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 via-blue-50/10 to-transparent rounded-2xl -z-10"></div>

      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          const trendColors = {
            up: "text-green-500",
            down: "text-red-500",
            neutral: "text-slate-400",
          };

          const trendColor = trendColors[metric.trend || "neutral"];

          return (
            <div key={idx} className="flex flex-col justify-between group/metric">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-200/50 to-blue-200/50 backdrop-blur flex items-center justify-center border border-indigo-200/30 group-hover/metric:scale-110 transition-transform duration-300">
                    <Icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <p className="text-indigo-700 text-xs font-black uppercase tracking-widest">{metric.label}</p>
                </div>
                <p className="text-4xl font-black text-slate-900 group-hover/metric:text-indigo-600 transition-colors duration-300">{metric.value}</p>
              </div>
              {metric.change && (
                <p className={`text-xs font-bold ${trendColor}`}>
                  {metric.trend === "up" ? "↑" : metric.trend === "down" ? "↓" : ""} {metric.change}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
