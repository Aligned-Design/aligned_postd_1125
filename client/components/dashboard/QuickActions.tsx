import { Plus, Sparkles, CheckCircle2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuickActions() {
  const actions = [
    {
      icon: Plus,
      label: "Create Post",
      description: "Start a new post or campaign",
      color: "from-indigo-500 to-blue-500",
    },
    {
      icon: Sparkles,
      label: "AI Ideas",
      description: "Generate content suggestions",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: CheckCircle2,
      label: "Bulk Approve",
      description: "Review pending content",
      color: "from-lime-400 to-emerald-500",
    },
    {
      icon: BarChart3,
      label: "View Report",
      description: "Weekly performance summary",
      color: "from-indigo-400 to-indigo-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
      {actions.map((action, idx) => {
        const Icon = action.icon;
        return (
          <button
            key={idx}
            className="group relative bg-white/50 backdrop-blur-xl rounded-xl p-4 border border-white/60 hover:bg-white/70 hover:border-indigo-300/50 transition-all duration-300 hover:shadow-md text-left overflow-hidden"
          >
            {/* Subtle gradient background on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 -z-10`}></div>

            <div className={`w-9 sm:w-10 h-9 sm:h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-2 sm:mb-3 shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300`}>
              <Icon className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
            </div>
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-0.5 group-hover:text-indigo-600 transition-colors duration-300">
              {action.label}
            </h4>
            <p className="text-xs text-slate-500 font-medium line-clamp-2">{action.description}</p>
          </button>
        );
      })}
    </div>
  );
}
