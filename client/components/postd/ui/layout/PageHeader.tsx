/**
 * PageHeader
 * 
 * Standard page header component for Postd pages.
 * Provides consistent title, subtitle, and action button layout.
 */

import { ReactNode } from "react";
import { cn } from "@/lib/design-system";

interface PageHeaderProps {
  title: string;
  subtitle?: string | ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ 
  title, 
  subtitle, 
  actions,
  className 
}: PageHeaderProps) {
  return (
    <div className={cn(
      "mb-6 sm:mb-8 md:mb-10",
      className
    )}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className={cn(
            "text-2xl sm:text-3xl md:text-4xl font-bold",
            "text-foreground",
            "tracking-tight"
          )}>
            {title}
          </h1>
          {subtitle && (
            <p className={cn(
              "mt-2 sm:mt-3",
              "text-sm sm:text-base",
              "text-muted-foreground",
              "max-w-2xl"
            )}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-start gap-3 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

