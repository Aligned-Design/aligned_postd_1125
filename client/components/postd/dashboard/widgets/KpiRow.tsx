/**
 * KpiRow
 * 
 * Displays key performance indicators in a responsive grid.
 * Uses MetricCard primitives from the Postd UI library.
 */

import { FileText, TrendingUp, BarChart3, Calendar } from "lucide-react";
import { MetricCard } from "@/components/postd/ui/cards/MetricCard";
import { DashboardRow } from "../DashboardShell";
import type { DashboardKpi } from "@/components/postd/dashboard/hooks/useDashboardData";

interface KpiRowProps {
  kpis: DashboardKpi[];
}

const iconMap: Record<string, typeof FileText> = {
  "total-posts": FileText,
  "engagement-rate": TrendingUp,
  "top-channel": BarChart3,
  "scheduled": Calendar,
  "scheduled-posts": Calendar, // Support both IDs from backend
};

export function KpiRow({ kpis }: KpiRowProps) {
  return (
    <DashboardRow columns={4} gap="md">
      {kpis.map((kpi) => {
        const Icon = iconMap[kpi.id] || FileText;
        return (
          <MetricCard
            key={kpi.id}
            icon={Icon}
            label={kpi.label}
            value={kpi.value}
            change={kpi.change}
            trend={kpi.trend}
            color="primary"
            kpiId={kpi.id}
          />
        );
      })}
    </DashboardRow>
  );
}

