/**
 * PageShell
 * 
 * Standard page container for Postd authenticated pages.
 * Provides consistent spacing, max-width, and layout structure.
 */

import { ReactNode } from "react";
import { cn } from "@/lib/design-system";

interface PageShellProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

const maxWidthClasses = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
  full: "max-w-full",
};

export function PageShell({ 
  children, 
  className,
  maxWidth = "2xl"
}: PageShellProps) {
  return (
    <div className={cn(
      "w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 md:py-10",
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  );
}

