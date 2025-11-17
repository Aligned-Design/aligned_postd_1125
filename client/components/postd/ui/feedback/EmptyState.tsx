/**
 * EmptyState
 * 
 * Standard empty state component for Postd.
 * Used when there's no data to display.
 */

import { ReactNode } from "react";
import { cn } from "@/lib/design-system";
import { PackageX } from "lucide-react";
import { PrimaryButton } from "../buttons/PrimaryButton";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  title = "No data available",
  description = "There's nothing to display here yet.",
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center",
      "py-12 sm:py-16 md:py-20",
      "text-center",
      className
    )}>
      <div className={cn(
        "w-16 h-16 sm:w-20 sm:h-20",
        "rounded-full",
        "bg-slate-100",
        "flex items-center justify-center",
        "mb-4 sm:mb-6"
      )}>
        {icon || <PackageX className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />}
      </div>
      
      <h3 className={cn(
        "text-lg sm:text-xl md:text-2xl",
        "font-semibold",
        "text-foreground",
        "mb-2"
      )}>
        {title}
      </h3>
      
      <p className={cn(
        "text-sm sm:text-base",
        "text-muted-foreground",
        "max-w-md",
        "mb-6 sm:mb-8"
      )}>
        {description}
      </p>
      
      {action && (
        <PrimaryButton onClick={action.onClick} size="md">
          {action.label}
        </PrimaryButton>
      )}
    </div>
  );
}

