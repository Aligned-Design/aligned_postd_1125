import React from "react";

// Brand chaos illustration
export function BrandChaosVisual() {
  return (
    <div className="w-full h-32 flex items-center justify-center relative">
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full bg-gradient-to-br from-slate-200 to-transparent rounded-lg"></div>
      </div>
      <svg viewBox="0 0 200 120" className="w-full h-full" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.1))" }}>
        {/* Overlapping cards representing brands */}
        <g>
          <rect x="20" y="20" width="50" height="65" rx="4" fill="#4F46E5" opacity="0.8" />
          <text x="45" y="55" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Brand A</text>
        </g>
        <g>
          <rect x="50" y="35" width="50" height="65" rx="4" fill="#8B5CF6" opacity="0.8" />
          <text x="75" y="70" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Brand B</text>
        </g>
        <g>
          <rect x="80" y="25" width="50" height="65" rx="4" fill="#EC4899" opacity="0.8" />
          <text x="105" y="60" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Brand C</text>
        </g>
        <g>
          <rect x="110" y="40" width="50" height="65" rx="4" fill="#F59E0B" opacity="0.8" />
          <text x="135" y="75" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">Brand D</text>
        </g>
        {/* Chaos indicator - tangled lines */}
        <g stroke="#EF4444" strokeWidth="1.5" fill="none" opacity="0.6">
          <path d="M 30 10 Q 50 5 70 15 T 110 8 T 150 20" />
          <path d="M 40 100 Q 70 95 100 105 T 150 98" />
        </g>
      </svg>
    </div>
  );
}

// Approval bottleneck illustration
export function ApprovalBottleneckVisual() {
  return (
    <div className="w-full h-32 flex items-center justify-center">
      <svg viewBox="0 0 200 120" className="w-full h-full" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.1))" }}>
        {/* Queue of items waiting */}
        <g>
          <rect x="20" y="10" width="35" height="30" rx="3" fill="#FEE2E2" stroke="#DC2626" strokeWidth="1.5" />
          <text x="37.5" y="30" textAnchor="middle" fill="#DC2626" fontSize="11" fontWeight="bold">1</text>
        </g>
        <g opacity="0.8">
          <rect x="20" y="45" width="35" height="30" rx="3" fill="#FEE2E2" stroke="#DC2626" strokeWidth="1.5" />
          <text x="37.5" y="65" textAnchor="middle" fill="#DC2626" fontSize="11" fontWeight="bold">2</text>
        </g>
        <g opacity="0.6">
          <rect x="20" y="80" width="35" height="30" rx="3" fill="#FEE2E2" stroke="#DC2626" strokeWidth="1.5" />
          <text x="37.5" y="100" textAnchor="middle" fill="#DC2626" fontSize="11" fontWeight="bold">3</text>
        </g>
        {/* Blocked arrow */}
        <g>
          <line x1="60" y1="25" x2="130" y2="25" stroke="#F59E0B" strokeWidth="3" />
          <polygon points="130,25 120,20 120,30" fill="#F59E0B" />
          <circle cx="100" cy="25" r="12" fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="4" />
          <text x="100" y="30" textAnchor="middle" fill="#F59E0B" fontSize="14" fontWeight="bold">×</text>
        </g>
        {/* Waiting text */}
        <text x="100" y="55" textAnchor="middle" fill="#F59E0B" fontSize="12" fontWeight="bold">Waiting...</text>
      </svg>
    </div>
  );
}

// Manual overload illustration
export function ManualOverloadVisual() {
  return (
    <div className="w-full h-32 flex items-center justify-center">
      <svg viewBox="0 0 200 120" className="w-full h-full" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.1))" }}>
        {/* Multiple app windows stacked */}
        <g>
          <rect x="15" y="15" width="55" height="50" rx="3" fill="#DDD6FE" stroke="#4F46E5" strokeWidth="1.5" />
          <line x1="15" y1="25" x2="70" y2="25" stroke="#4F46E5" strokeWidth="1" />
          <circle cx="20" cy="20" r="2" fill="#4F46E5" />
        </g>
        <g transform="translate(15, 10)">
          <rect x="45" y="30" width="55" height="50" rx="3" fill="#ECFDF5" stroke="#059669" strokeWidth="1.5" />
          <line x1="45" y1="40" x2="100" y2="40" stroke="#059669" strokeWidth="1" />
          <circle cx="50" cy="35" r="2" fill="#059669" />
        </g>
        <g transform="translate(30, 15)">
          <rect x="45" y="30" width="55" height="50" rx="3" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5" />
          <line x1="45" y1="40" x2="100" y2="40" stroke="#D97706" strokeWidth="1" />
          <circle cx="50" cy="35" r="2" fill="#D97706" />
        </g>
        {/* Overflow indicator */}
        <text x="165" y="50" textAnchor="middle" fill="#DC2626" fontSize="20" fontWeight="bold">...</text>
      </svg>
    </div>
  );
}

// Reporting fatigue illustration
export function ReportingFatigueVisual() {
  return (
    <div className="w-full h-32 flex items-center justify-center">
      <svg viewBox="0 0 200 120" className="w-full h-full" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.1))" }}>
        {/* Confused data points */}
        <g>
          {/* Scattered data points */}
          <circle cx="30" cy="25" r="4" fill="#EF4444" opacity="0.6" />
          <circle cx="50" cy="35" r="4" fill="#F59E0B" opacity="0.6" />
          <circle cx="70" cy="20" r="4" fill="#8B5CF6" opacity="0.6" />
          <circle cx="90" cy="40" r="4" fill="#EC4899" opacity="0.6" />
          <circle cx="110" cy="30" r="4" fill="#3B82F6" opacity="0.6" />
          <circle cx="130" cy="35" r="4" fill="#10B981" opacity="0.6" />
          <circle cx="150" cy="25" r="4" fill="#F59E0B" opacity="0.6" />
          {/* Scattered lines (no pattern) */}
          <line x1="30" y1="25" x2="50" y2="35" stroke="#64748B" strokeWidth="0.5" opacity="0.3" />
          <line x1="50" y1="35" x2="110" y2="30" stroke="#64748B" strokeWidth="0.5" opacity="0.3" />
          <line x1="70" y1="20" x2="150" y2="25" stroke="#64748B" strokeWidth="0.5" opacity="0.3" />
          {/* Question mark */}
          <text x="90" y="80" textAnchor="middle" fill="#6B7280" fontSize="24" fontWeight="bold">?</text>
        </g>
      </svg>
    </div>
  );
}
