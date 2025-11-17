import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/design-system";

/**
 * Badge Component
 *
 * Small labeled element that consumes design tokens for:
 * - Border radius (--radius-sm)
 * - Padding (--spacing-sm)
 * - Font size (--font-size-label)
 * - Colors (primary, secondary, success, error, warning)
 *
 * Usage:
 * <Badge variant="default">New</Badge>
 * <Badge variant="success">Approved</Badge>
 * <Badge variant="warning">Pending</Badge>
 */

const badgeVariants = cva(
  cn(
    "inline-flex items-center gap-[var(--spacing-xs)]",
    "whitespace-nowrap",
    "rounded-[var(--radius-sm)] border",
    "px-[var(--spacing-sm)] py-[var(--spacing-xs)]",
    "text-[var(--font-size-label)] font-[var(--font-weight-semibold)]",
    "transition-colors duration-[var(--animation-duration-quick)]",
    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)]",
  ),
  {
    variants: {
      variant: {
        /* Primary brand */
        default: cn(
          "border-transparent bg-[var(--color-primary)] text-white",
          "hover:bg-[var(--color-primary-light)]",
          "dark:bg-[var(--color-primary-light)] dark:hover:bg-[var(--color-primary)]",
        ),

        /* Secondary - muted */
        secondary: cn(
          "border border-[var(--color-border)]",
          "bg-[var(--color-surface)] text-[var(--color-foreground)]",
          "hover:bg-[var(--color-gray-100)]",
          "dark:bg-[var(--color-dark-surface)] dark:text-[var(--color-dark-foreground)] dark:hover:bg-[var(--color-slate-700)]",
        ),

        /* Error/Destructive */
        destructive: cn(
          "border-transparent bg-[var(--color-error)] text-white",
          "hover:bg-[var(--color-red-700)]",
        ),

        /* Outline - bordered */
        outline: cn(
          "border border-[var(--color-border)] text-[var(--color-foreground)]",
          "hover:border-[var(--color-primary)]",
          "dark:border-[var(--color-slate-600)] dark:text-[var(--color-dark-foreground)]",
        ),

        /* Success */
        success: cn(
          "border-transparent bg-[var(--color-success)] text-white",
          "hover:bg-[var(--color-green-700)]",
        ),

        /* Warning */
        warning: cn(
          "border-transparent bg-[var(--color-warning)] text-white",
          "hover:bg-[var(--color-amber-700)]",
        ),

        /* Info */
        info: cn(
          "border-transparent bg-[var(--color-info)] text-white",
          "hover:bg-[var(--color-blue-700)]",
        ),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
