import { LucideIcon, TrendingUp } from "lucide-react";

interface HeroMetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle: string;
  change: string;
  trend: "up" | "down" | "neutral";
}

export function HeroMetricCard({
  icon: Icon,
  label,
  value,
  subtitle,
  change,
  trend = "up",
}: HeroMetricCardProps) {
  const trendColor = trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-slate-400";

  return (
    <div className="bg-white/40 backdrop-blur-2xl rounded-2xl p-8 border border-white/60 shadow-2xl hover:shadow-2xl hover:bg-white/50 transition-all duration-300 relative overflow-hidden group">
      {/* Glassmorphism gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-blue-50/20 to-transparent rounded-2xl -z-10"></div>

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-indigo-600 text-xs font-black uppercase tracking-widest mb-3">{label}</p>
          <h2 className="text-7xl font-black bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4 leading-tight group-hover:scale-105 transition-transform duration-300 origin-left">
            {value}
          </h2>
          <p className="text-slate-700 text-base font-semibold leading-relaxed mb-5 max-w-md">{subtitle}</p>
          <div className="flex items-center gap-2">
            <TrendingUp className={`w-5 h-5 ${trendColor}`} />
            <span className={`text-sm font-bold ${trendColor}`}>{change}</span>
          </div>
        </div>
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-400/20 to-blue-400/20 backdrop-blur flex items-center justify-center flex-shrink-0 border border-indigo-200/50 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
          <Icon className="w-10 h-10 text-indigo-600" />
        </div>
      </div>
    </div>
  );
}
