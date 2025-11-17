/**
 * DashboardShell
 * 
 * Provides the main content container and grid layout for the dashboard page.
 * This component defines the responsive grid structure for dashboard widgets.
 */

import { ReactNode } from "react";
import { cn } from "@/lib/design-system";

interface DashboardShellProps {
  children: ReactNode;
  className?: string;
}

export function DashboardShell({ children, className }: DashboardShellProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </div>
    </div>
  );
}

/**
 * DashboardRow
 * 
 * A row container for dashboard widgets with responsive grid support.
 */
interface DashboardRowProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  className?: string;
}

export function DashboardRow({ 
  children, 
  columns = 4, 
  gap = "md",
  className 
}: DashboardRowProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  const gapClasses = {
    sm: "gap-4",
    md: "gap-6",
    lg: "gap-8",
  };

  return (
    <div className={cn("grid", gridCols[columns], gapClasses[gap], className)}>
      {children}
    </div>
  );
}

