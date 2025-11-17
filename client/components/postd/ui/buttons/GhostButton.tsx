/**
 * GhostButton
 * 
 * Ghost/tertiary button for Postd.
 * Minimal styling, used for less prominent actions.
 */

import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/design-system";
import { Loader2 } from "lucide-react";

interface GhostButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  isLoading?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-base",
  lg: "h-12 px-6 text-lg",
};

export function GhostButton({
  children,
  isLoading = false,
  size = "md",
  className,
  disabled,
  ...props
}: GhostButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2",
        "whitespace-nowrap",
        "font-medium",
        "rounded-lg", /* Rounded rectangle */
        "text-[var(--color-foreground)]",
        "transition-all duration-200",
        "hover:bg-[var(--color-surface)]",
        "active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
        sizeClasses[size],
        (disabled || isLoading) && "opacity-50 cursor-not-allowed",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

