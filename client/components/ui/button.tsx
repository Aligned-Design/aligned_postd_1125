import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/design-system";

/**
 * Button Component
 *
 * Consumes design tokens for colors, spacing, and sizing.
 * All colors and dimensions come from tokens; no ad-hoc hex codes or px values.
 *
 * Usage:
 * <Button variant="default">Click me</Button>
 * <Button variant="ghost" size="sm">Small ghost button</Button>
 */

const buttonVariants = cva(
  /* Base styles - all use tokens */
  cn(
    "inline-flex items-center justify-center gap-[var(--spacing-sm)] whitespace-nowrap",
    "font-[var(--font-weight-semibold)] text-[var(--font-size-body)]",
    "transition-all duration-[var(--animation-duration-quick)]",
    "rounded-[var(--radius-button)]", /* Rounded rectangle, not fully rounded */
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
  ),
  {
    variants: {
      variant: {
        /* Primary - Bright Lime with Black text for best contrast */
        default: cn(
          "bg-[var(--color-lime-400)] text-black",
          "hover:bg-[var(--color-lime-600)] hover:shadow-[var(--shadow-md)]",
          "active:scale-95",
        ),

        /* Destructive/Error */
        destructive: cn(
          "bg-[var(--color-error)] text-white",
          "hover:bg-[var(--color-red-700)] hover:shadow-[var(--shadow-md)]",
          "active:scale-95",
        ),

        /* Outline - Purple outline with purple text */
        outline: cn(
          "border-2 border-[var(--color-primary)] bg-transparent text-[var(--color-primary)]",
          "hover:bg-[var(--color-primary)]/10 hover:border-[var(--color-primary-light)]",
          "active:scale-95",
        ),

        /* Secondary - Purple outline clear with purple text (same as outline) */
        secondary: cn(
          "border-2 border-[var(--color-primary)] bg-transparent text-[var(--color-primary)]",
          "hover:bg-[var(--color-primary)]/10 hover:border-[var(--color-primary-light)]",
          "active:scale-95",
        ),

        /* Ghost - transparent background */
        ghost: cn(
          "text-[var(--color-foreground)] hover:bg-[var(--color-surface)]",
          "active:scale-95",
        ),

        /* Link - underlined text */
        link: cn(
          "text-[var(--color-primary)] underline-offset-4 hover:underline",
          "active:scale-95",
        ),

        /* Success - White with purple text + purple border */
        success: cn(
          "bg-white border-2 border-[var(--color-primary)] text-[var(--color-primary)]",
          "hover:bg-[var(--color-primary)]/5 hover:shadow-[var(--shadow-sm)]",
          "active:scale-95",
        ),

        /* Warning */
        warning: cn(
          "bg-[var(--color-warning)] text-white",
          "hover:bg-[var(--color-amber-700)] hover:shadow-[var(--shadow-md)]",
          "active:scale-95",
        ),
      },
      size: {
        /* Default size */
        default: cn(
          "h-[var(--spacing-xl)] px-[var(--spacing-md)] py-[var(--spacing-sm)]",
        ),

        /* Small size */
        sm: cn(
          "h-9 px-[var(--spacing-sm)] py-[var(--spacing-xs)]",
          "rounded-[var(--radius-md)]",
          "text-[var(--font-size-body-sm)]",
        ),

        /* Large size */
        lg: cn(
          "h-11 px-[var(--spacing-lg)] py-[var(--spacing-md)]",
          "rounded-[var(--radius-xl)]",
        ),

        /* Icon button */
        icon: cn("h-[var(--spacing-xl)] w-[var(--spacing-xl)]"),
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
