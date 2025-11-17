/**
 * SimpleLineChart
 * 
 * A simple line chart component for displaying ChartDataPoint[] data.
 * Uses Recharts for rendering.
 */

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ChartDataPoint } from "@/components/postd/dashboard/hooks/useDashboardData";

interface SimpleLineChartProps {
  data: ChartDataPoint[];
  title?: string;
  dataKey?: string;
  valueKey?: string;
}

export function SimpleLineChart({
  data,
  title = "Analytics Trend",
  dataKey = "date",
  valueKey = "value",
}: SimpleLineChartProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-border shadow-sm h-80">
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="80%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 10,
            left: 10,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey={dataKey} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              borderColor: "hsl(var(--border))",
              borderRadius: "0.5rem",
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
            itemStyle={{ color: "hsl(var(--foreground))" }}
          />
          <Line
            type="monotone"
            dataKey={valueKey}
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 4, fill: "hsl(var(--primary))" }}
            activeDot={{ r: 6, fill: "hsl(var(--primary))", stroke: "hsl(var(--primary))", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

