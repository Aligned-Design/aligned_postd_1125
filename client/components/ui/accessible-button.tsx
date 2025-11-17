import * as React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/design-system";

export interface AccessibleButtonProps extends ButtonProps {
  /** Ensures minimum 44x44px touch target for mobile */
  touchOptimized?: boolean;
}

export const AccessibleButton = React.forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ className, touchOptimized = true, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          touchOptimized && "min-h-[44px] min-w-[44px]",
          className
        )}
        {...props}
      />
    );
  }
);
AccessibleButton.displayName = "AccessibleButton";
