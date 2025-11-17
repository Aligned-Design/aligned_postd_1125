import * as React from "react";

import { cn } from "@/lib/design-system";

/**
 * Input Component
 *
 * Form input field that consumes design tokens for:
 * - Height (--spacing-xl / 40px)
 * - Border radius (--radius-md)
 * - Padding (--spacing-sm)
 * - Border color (--color-border)
 * - Focus ring (--color-primary)
 * - Font size (--font-size-body)
 *
 * Usage:
 * <Input type="text" placeholder="Enter text..." />
 * <Input type="email" disabled />
 */

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full",
          "h-[var(--spacing-xl)] rounded-[var(--input-radius)]", /* Uses component token */
          "border border-[var(--input-border)] bg-[var(--input-bg)]",
          "px-[var(--spacing-sm)] py-[var(--spacing-xs)]",
          "text-[var(--font-size-body)] text-[var(--color-foreground)]",
          "placeholder:text-[var(--input-placeholder)]",
          "ring-offset-white",
          "focus-visible:outline-none focus-visible:ring-[var(--input-focus-ring-width)] focus-visible:ring-[var(--input-focus-ring)] focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--color-gray-100)]",
          "transition-colors duration-[var(--animation-duration-quick)]",
          "file:border-0 file:bg-transparent file:text-[var(--font-size-body-sm)] file:font-[var(--font-weight-semibold)] file:text-[var(--color-foreground)]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
