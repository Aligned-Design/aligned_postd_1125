import { TrendingUp } from "lucide-react";

interface WeekData {
  week: string;
  reach: number;
  engagement: number;
}

export function CampaignHealth() {
  const weekData: WeekData[] = [
    { week: "Week 1", reach: 45, engagement: 38 },
    { week: "Week 2", reach: 58, engagement: 45 },
    { week: "Week 3", reach: 72, engagement: 62 },
    { week: "Week 4", reach: 89, engagement: 78 },
  ];

  const maxReach = Math.max(...weekData.map((d) => d.reach));
  const maxEngagement = Math.max(...weekData.map((d) => d.engagement));

  return (
    <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 border border-white/60 hover:bg-white/70 hover:shadow-md transition-all duration-300 relative overflow-hidden mb-12">
      {/* Glassmorphism gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-blue-50/20 to-transparent rounded-2xl -z-10"></div>

      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-200/50 to-blue-200/50 backdrop-blur flex items-center justify-center border border-indigo-200/30">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Campaign Health</h3>
            <p className="text-xs text-slate-600 font-medium">4-week performance trend</p>
          </div>
        </div>
        <span className="text-xs font-bold px-2.5 py-1.5 rounded-full bg-green-100/60 text-green-700 border border-green-300/50">
          📈 +78% Growth
        </span>
      </div>

      {/* Chart Area */}
      <div className="relative space-y-6">
        {/* Reach & Engagement Bars */}
        <div className="space-y-4">
          {weekData.map((data, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-700">{data.week}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-600">{data.reach}K reach</span>
                  <span className="text-xs font-bold text-lime-600">{data.engagement}% eng</span>
                </div>
              </div>
              <div className="flex gap-2 h-2 rounded-full overflow-hidden">
                {/* Reach bar */}
                <div
                  className="bg-gradient-to-r from-indigo-400 to-blue-400 rounded-full transition-all duration-500"
                  style={{ width: `${(data.reach / maxReach) * 100}%` }}
                />
                {/* Engagement bar */}
                <div
                  className="bg-gradient-to-r from-lime-400 to-green-400 rounded-full transition-all duration-500"
                  style={{ width: `${(data.engagement / maxEngagement) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 pt-4 border-t border-indigo-200/30">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-400 to-blue-400"></div>
            <span className="text-xs text-slate-600 font-medium">Total Reach</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-lime-400 to-green-400"></div>
            <span className="text-xs text-slate-600 font-medium">Engagement Rate</span>
          </div>
        </div>
      </div>
    </div>
  );
}
