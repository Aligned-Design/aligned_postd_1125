import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

interface AccessibleChartProps {
  data: Record<string, unknown>[];
  title: string;
  description?: string;
  type: "line" | "bar";
  dataKey: string;
  xAxisKey: string;
  color?: string;
  height?: number;
}

export function AccessibleChart({
  data,
  title,
  description,
  type,
  dataKey,
  xAxisKey,
  color = "#3b82f6",
  height = 300,
}: AccessibleChartProps) {
  const chartId = React.useId();

  // Prepare data summary for screen readers
  const dataSummary = React.useMemo(() => {
    if (!data.length) return "No data available";

    const values = data
      .map((item) => item[dataKey])
      .filter((val) => typeof val === "number");
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;

    return `Chart showing ${data.length} data points. Minimum value: ${min.toFixed(1)}, Maximum value: ${max.toFixed(1)}, Average: ${avg.toFixed(1)}`;
  }, [data, dataKey]);

  const Chart = type === "line" ? LineChart : BarChart;
  const DataComponent: React.ReactNode =
    type === "line" ? (
      <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} />
    ) : (
      <Bar dataKey={dataKey} fill={color} />
    );

  return (
    <div
      role="img"
      aria-labelledby={`${chartId}-title`}
      aria-describedby={`${chartId}-desc`}
    >
      <div id={`${chartId}-title`} className="sr-only">
        {title}
      </div>
      <div id={`${chartId}-desc`} className="sr-only">
        {description} {dataSummary}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <Chart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey={xAxisKey}
            tick={{ fontSize: 12 }}
            aria-label="X-axis"
          />
          <YAxis tick={{ fontSize: 12 }} aria-label="Y-axis" />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
            }}
          />
          {DataComponent}
        </Chart>
      </ResponsiveContainer>

      {/* Data table for screen readers */}
      <div className="sr-only">
        <table>
          <caption>{title} - Data Table</caption>
          <thead>
            <tr>
              <th>{xAxisKey}</th>
              <th>{dataKey}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                <td>{String(item[xAxisKey])}</td>
                <td>{String(item[dataKey])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
