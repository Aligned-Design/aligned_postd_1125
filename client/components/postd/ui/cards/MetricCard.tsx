import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/design-system";
import { useNavigate } from "react-router-dom";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  color?: "primary" | "secondary" | "accent";
  onClick?: () => void;
  href?: string;
  kpiId?: string;
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  change,
  trend = "neutral",
  color = "primary",
  onClick,
  href,
  kpiId,
}: MetricCardProps) {
  const navigate = useNavigate();
  
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

  // Determine route based on KPI ID if href not provided
  const getRoute = () => {
    if (href) return href;
    // Total Posts and Scheduled Posts should go to content queue
    if (kpiId === "total-posts") return "/queue";
    if (kpiId === "scheduled" || kpiId === "scheduled-posts") return "/queue?status=scheduled";
    if (kpiId === "engagement-rate") return "/analytics?tab=engagement";
    if (kpiId === "top-channel") return "/analytics?tab=channels";
    return null;
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      const route = getRoute();
      if (route) {
        navigate(route);
      }
    }
  };

  const isClickable = onClick || getRoute() !== null;

  return (
    <div
      onClick={isClickable ? handleClick : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={isClickable ? `View ${label} details` : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          handleClick();
        }
      }}
      className={cn(
        "bg-white rounded-[var(--radius-card)] border border-[var(--color-card-border)] transition-all",
        "min-h-[120px] p-4 sm:p-5 md:p-6",
        isClickable && [
          "cursor-pointer hover:shadow-lg hover:-translate-y-0.5",
          "active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
        ],
        !isClickable && "hover:shadow-md"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0", colorClasses[color])}>
          <Icon className="w-6 h-6" />
        </div>
        {change && (
          <span className={cn("text-sm font-medium", trendColors[trend])}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : ""} {change}
          </span>
        )}
      </div>
      <p className="text-foreground/70 text-sm font-medium mb-1 break-normal">{label}</p>
      <p className="text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
}

