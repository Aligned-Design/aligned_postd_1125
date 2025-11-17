/**
 * SecondaryButton
 * 
 * Secondary action button for Postd.
 * Outlined style with consistent spacing and hover states.
 */

import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/design-system";
import { Loader2 } from "lucide-react";

interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  isLoading?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-9 px-4 text-sm",
  md: "h-10 px-6 text-base",
  lg: "h-12 px-8 text-lg",
};

export function SecondaryButton({
  children,
  isLoading = false,
  size = "md",
  className,
  disabled,
  ...props
}: SecondaryButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2",
        "whitespace-nowrap",
        "font-semibold",
        "rounded-[var(--btn-secondary-radius)]", /* Uses component token */
        "border-2 border-[var(--btn-secondary-border)] bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-text)]",
        "transition-all duration-200",
        "hover:bg-[var(--btn-secondary-hover-bg)] hover:border-[var(--btn-secondary-hover-border)]",
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

