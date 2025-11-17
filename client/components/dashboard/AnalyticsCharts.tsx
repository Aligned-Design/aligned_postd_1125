import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/design-system";

/**
 * Chart Color Constants - Sourced from Design Tokens
 * Using CSS custom properties for consistency across themes
 */
const CHART_COLORS = {
  primary: "var(--color-primary)", // #3D0FD6 - Primary brand color
  success: "var(--color-success)", // #12B76A - Success/positive trend
  warning: "var(--color-warning)", // #F59E0B - Warning/alert
  error: "var(--color-error)", // #DC2626 - Error/negative trend
  info: "var(--color-info)", // #2563EB - Info state
  muted: "var(--color-muted)", // #6B7280 - Secondary/comparison
  slate400: "var(--color-slate-400)", // #94A3B8 - Accent
} as const;

// Reach/Engagement Area Chart
interface TrendData {
  date: string;
  value: number;
  label?: string;
}

export function TrendAreaChart({
  data,
  dataKey = "value",
  color = CHART_COLORS.primary,
  className,
}: {
  data: TrendData[];
  dataKey?: string;
  color?: string;
  className?: string;
}) {
  const chartConfig: ChartConfig = {
    [dataKey]: {
      label: "Value",
      color,
    },
  };

  return (
    <ChartContainer config={chartConfig} className={cn("h-[200px]", className)}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`fill${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          fill={`url(#fill${dataKey})`}
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}

// Mini Sparkline (small trend indicator)
export function Sparkline({
  data,
  color = CHART_COLORS.primary,
  className,
}: {
  data: number[];
  color?: string;
  className?: string;
}) {
  const chartData = data.map((value, index) => ({ index, value }));

  const chartConfig: ChartConfig = {
    value: {
      label: "Value",
      color,
    },
  };

  return (
    <ChartContainer
      config={chartConfig}
      className={cn("h-[40px] w-full", className)}
    >
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}

// Pipeline Status Bar Chart
interface PipelineData {
  stage: string;
  count: number;
  color: string;
}

export function PipelineBarChart({
  data,
  className,
}: {
  data: PipelineData[];
  className?: string;
}) {
  const chartConfig: ChartConfig = data.reduce((acc, item) => {
    acc[item.stage] = {
      label: item.stage,
      color: item.color,
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <ChartContainer config={chartConfig} className={cn("h-[200px]", className)}>
      <BarChart data={data} layout="vertical">
        <XAxis type="number" tick={{ fontSize: 12 }} />
        <YAxis
          dataKey="stage"
          type="category"
          width={100}
          tick={{ fontSize: 12 }}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

// Channel Mix Donut Chart
interface ChannelData {
  platform: string;
  percentage: number;
  color: string;
}

export function ChannelDonutChart({
  data,
  className,
}: {
  data: ChannelData[];
  className?: string;
}) {
  const chartConfig: ChartConfig = data.reduce((acc, item) => {
    acc[item.platform] = {
      label: item.platform,
      color: item.color,
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <ChartContainer config={chartConfig} className={cn("h-[250px]", className)}>
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent />} />
        <Pie
          data={data}
          dataKey="percentage"
          nameKey="platform"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}

// Growth Line Chart with comparison
interface GrowthData {
  date: string;
  current: number;
  previous?: number;
}

export function GrowthLineChart({
  data,
  showComparison = false,
  className,
}: {
  data: GrowthData[];
  showComparison?: boolean;
  className?: string;
}) {
  const chartConfig: ChartConfig = {
    current: {
      label: "Current Period",
      color: CHART_COLORS.primary,
    },
    previous: {
      label: "Previous Period",
      color: CHART_COLORS.muted,
    },
  };

  return (
    <ChartContainer config={chartConfig} className={cn("h-[250px]", className)}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          type="monotone"
          dataKey="current"
          stroke={CHART_COLORS.primary}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        {showComparison && (
          <Line
            type="monotone"
            dataKey="previous"
            stroke={CHART_COLORS.muted}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 3 }}
          />
        )}
      </LineChart>
    </ChartContainer>
  );
}

// Metric Card with Mini Chart
export function MetricCard({
  title,
  value,
  change,
  trend,
  icon,
  sparklineData,
  className,
}: {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  sparklineData?: number[];
  className?: string;
}) {
  const trendColors = {
    up: "text-mint",
    down: "text-coral",
    neutral: "text-muted-foreground",
  };

  const trendColor = trend ? trendColors[trend] : "text-muted-foreground";

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/50 bg-card p-6 shadow-soft transition-all hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {title}
          </p>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
          {change && (
            <p className={cn("text-sm font-medium mt-1", trendColor)}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-muted-foreground transition-colors group-hover:text-violet">
            {icon}
          </div>
        )}
      </div>
      {sparklineData && sparklineData.length > 0 && (
        <Sparkline data={sparklineData} />
      )}
    </div>
  );
}
