/**
 * AnalyticsChart
 * 
 * A simple line chart component for displaying analytics data.
 * Uses SVG for rendering.
 */

import { DashboardChartData } from "@shared/api";

interface AnalyticsChartProps {
  data: DashboardChartData;
  height?: number;
}

export function AnalyticsChart({ data, height = 200 }: AnalyticsChartProps) {
  const chartWidth = 600;
  const chartHeight = height;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Find max value across all datasets
  const maxValue = Math.max(
    ...data.datasets.flatMap((d) => d.data),
    1
  );

  // Normalize data to chart coordinates
  const normalize = (value: number) => {
    return (value / maxValue) * innerHeight;
  };

  // Generate path for a dataset
  const generatePath = (dataset: typeof data.datasets[0]) => {
    const points = dataset.data.map((value, index) => {
      const x = (index / (dataset.data.length - 1 || 1)) * innerWidth + padding.left;
      const y = chartHeight - padding.bottom - normalize(value);
      return `${x},${y}`;
    });
    return points.join(" L ");
  };

  return (
    <div className="w-full">
      <svg
        width="100%"
        height={chartHeight}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="overflow-visible"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = chartHeight - padding.bottom - ratio * innerHeight;
          return (
            <line
              key={ratio}
              x1={padding.left}
              y1={y}
              x2={chartWidth - padding.right}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Chart lines */}
        {data.datasets.map((dataset, idx) => {
          const path = `M ${generatePath(dataset)}`;
          return (
            <g key={idx}>
              <defs>
                <linearGradient id={`gradient-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={dataset.color} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={dataset.color} stopOpacity="0.05" />
                </linearGradient>
              </defs>
              {/* Area fill */}
              <path
                d={`${path} L ${chartWidth - padding.right},${chartHeight - padding.bottom} L ${padding.left},${chartHeight - padding.bottom} Z`}
                fill={`url(#gradient-${idx})`}
              />
              {/* Line */}
              <path
                d={path}
                fill="none"
                stroke={dataset.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Data points */}
              {dataset.data.map((value, pointIdx) => {
                const x = (pointIdx / (dataset.data.length - 1 || 1)) * innerWidth + padding.left;
                const y = chartHeight - padding.bottom - normalize(value);
                return (
                  <circle
                    key={pointIdx}
                    cx={x}
                    cy={y}
                    r="4"
                    fill={dataset.color}
                    stroke="white"
                    strokeWidth="2"
                  />
                );
              })}
            </g>
          );
        })}

        {/* X-axis labels */}
        {data.labels.map((label, idx) => {
          const x = (idx / (data.labels.length - 1 || 1)) * innerWidth + padding.left;
          return (
            <text
              key={idx}
              x={x}
              y={chartHeight - padding.bottom + 20}
              textAnchor="middle"
              className="text-xs fill-gray-600"
            >
              {label}
            </text>
          );
        })}

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const value = Math.round(ratio * maxValue);
          const y = chartHeight - padding.bottom - ratio * innerHeight;
          return (
            <text
              key={ratio}
              x={padding.left - 10}
              y={y + 4}
              textAnchor="end"
              className="text-xs fill-gray-600"
            >
              {value}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex gap-4 mt-4 justify-center">
        {data.datasets.map((dataset, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: dataset.color }}
            />
            <span className="text-sm text-gray-600">{dataset.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

