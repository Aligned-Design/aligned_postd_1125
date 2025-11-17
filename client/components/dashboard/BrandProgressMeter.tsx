interface BrandProgressMeterProps {
  percentage: number;
}

export function BrandProgressMeter({ percentage }: BrandProgressMeterProps) {
  return (
    <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6">
      <h3 className="text-sm font-black text-slate-900 mb-3">Brand Completeness</h3>
      <div className="relative w-full h-8 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-lime-400 to-lime-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-center text-sm font-black text-slate-900 mt-2">{percentage}%</p>
      {percentage < 100 && (
        <p className="text-xs text-slate-600 text-center mt-2">
          Complete your guide for better AI insights
        </p>
      )}
      {percentage === 100 && (
        <p className="text-xs text-green-600 text-center mt-2 font-bold">
          ✓ Brand guide complete!
        </p>
      )}
    </div>
  );
}
