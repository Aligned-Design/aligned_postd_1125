import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/design-system";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  color?: "primary" | "secondary" | "accent";
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  change,
  trend = "neutral",
  color = "primary",
}: MetricCardProps) {
  const colorClasses = {
    primary: "text-primary bg-primary/10",
    secondary: "text-secondary bg-secondary/10",
    accent: "text-accent bg-accent/10",
  };

  const trendColors = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-muted-foreground",
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-border hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", colorClasses[color])}>
          <Icon className="w-6 h-6" />
        </div>
        {change && (
          <span className={cn("text-sm font-medium", trendColors[trend])}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : ""} {change}
          </span>
        )}
      </div>
      <p className="text-foreground/70 text-sm font-medium mb-1">{label}</p>
      <p className="text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
}
