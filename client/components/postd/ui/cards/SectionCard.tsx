/**
 * SectionCard
 * 
 * Standard panel card component for Postd.
 * Provides consistent styling: rounded rectangle (12px), soft border, shadow-md, padding.
 */

import { ReactNode } from "react";
import { cn } from "@/lib/design-system";

interface SectionCardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  variant?: "default" | "subtle" | "elevated";
}

const paddingClasses = {
  none: "p-0",
  sm: "p-4 sm:p-5",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
  xl: "p-8 sm:p-10",
};

const variantClasses = {
  default: "bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--card-shadow)] hover:shadow-[var(--card-hover-shadow)] hover:border-[var(--card-hover-border)] transition-all",
  subtle: "bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm",
  elevated: "bg-[var(--card-bg)] border border-[var(--card-border)] shadow-lg",
};

export function SectionCard({ 
  children, 
  className,
  padding = "md",
  variant = "default"
}: SectionCardProps) {
  return (
    <div className={cn(
      "rounded-[var(--card-radius)]", /* Uses component token */
      "break-normal break-words",
      paddingClasses[padding],
      variantClasses[variant],
      className
    )}>
      {children}
    </div>
  );
}

