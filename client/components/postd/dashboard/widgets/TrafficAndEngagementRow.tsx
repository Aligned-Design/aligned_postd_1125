/**
 * TrafficAndEngagementRow
 * 
 * Displays traffic and engagement trends using chart primitives.
 */

import { SimpleLineChart } from "@/components/postd/ui/charts/SimpleLineChart";
import type { ChartDataPoint } from "@/components/postd/dashboard/hooks/useDashboardData";

interface TrafficAndEngagementRowProps {
  chartData: ChartDataPoint[];
}

export function TrafficAndEngagementRow({ chartData }: TrafficAndEngagementRowProps) {
  return (
    <SimpleLineChart 
      data={chartData} 
      title="Traffic & Engagement Over Time"
    />
  );
}

