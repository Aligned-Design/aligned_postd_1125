/**
 * PrimaryButton
 * 
 * Primary action button for Postd.
 * Uses brand gradient (violet→fuchsia) with consistent styling.
 */

import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/design-system";
import { Loader2 } from "lucide-react";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  isLoading?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "gradient";
}

const sizeClasses = {
  sm: "h-9 px-4 text-sm",
  md: "h-10 px-6 text-base",
  lg: "h-12 px-8 text-lg",
};

export function PrimaryButton({
  children,
  isLoading = false,
  size = "md",
  variant = "gradient",
  className,
  disabled,
  ...props
}: PrimaryButtonProps) {
  const baseClasses = cn(
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap",
    "font-semibold",
    "rounded-[var(--btn-primary-radius)]", /* Uses component token */
    "transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
    sizeClasses[size],
    disabled || isLoading ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02] active:scale-[0.98]"
  );

  /* Primary: Uses component tokens from tokens.css (bright lime with black text) */
  const variantClasses = "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border-[var(--btn-primary-border)] shadow-[var(--btn-primary-shadow)] hover:bg-[var(--btn-primary-hover-bg)] hover:shadow-[var(--btn-primary-hover-shadow)]";

  return (
    <button
      className={cn(baseClasses, variantClasses, className)}
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

