interface SparklineProps {
  trend: "up" | "down";
  percentage: number;
}

export function Sparkline({ trend, percentage }: SparklineProps) {
  const points = [20, 15, 25, 18, 30, 22, 35, 28, 40];
  const width = 60;
  const height = 20;
  const padding = 2;
  
  const maxValue = 40;
  const minValue = 15;
  const range = maxValue - minValue;
  
  const svgPoints = points
    .map((point, idx) => {
      const x = (idx / (points.length - 1)) * (width - padding * 2) + padding;
      const y = height - ((point - minValue) / range) * (height - padding * 2) - padding;
      return `${x},${y}`;
    })
    .join(" ");

  const lineColor = trend === "up" ? "#B9F227" : "#BFDBFE"; // lime or light blue

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        {/* Gradient definition */}
        <defs>
          <linearGradient
            id="sparkline-gradient"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor={lineColor}
              stopOpacity={0.6}
              className="animate-pulse"
            />
            <stop offset="100%" stopColor={lineColor} stopOpacity={0.1} />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <polygon
          points={`0,${height} ${svgPoints} ${width},${height}`}
          fill="url(#sparkline-gradient)"
          className="animate-[fadeIn_400ms_ease-out]"
        />

        {/* Trend line */}
        <polyline
          points={svgPoints}
          fill="none"
          stroke={lineColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-[fadeIn_400ms_ease-out]"
        />
      </svg>

      {/* Percentage change */}
      <span
        className={`text-xs font-bold ${
          trend === "up" ? "text-lime-600" : "text-gray-400"
        }`}
      >
        {trend === "up" ? "+" : ""}{percentage}%
      </span>
    </div>
  );
}
