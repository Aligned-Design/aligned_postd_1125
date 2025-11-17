/**
 * Modal
 * 
 * Standard modal/dialog component for Postd.
 * Provides consistent structure: header (with optional gradient), body, footer.
 * Built on top of Radix UI Dialog for accessibility.
 */

import { ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/design-system";
import { X } from "lucide-react";
import { PrimaryButton } from "../buttons/PrimaryButton";
import { SecondaryButton } from "../buttons/SecondaryButton";
import { GhostButton } from "../buttons/GhostButton";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    isLoading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    isLoading?: boolean;
  };
  showCloseButton?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl";
  variant?: "default" | "gradient-header";
  className?: string;
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
};

export function Modal({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
  footer,
  primaryAction,
  secondaryAction,
  showCloseButton = true,
  maxWidth = "lg",
  variant = "default",
  className,
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "p-0",
        "max-h-[90vh]",
        "overflow-hidden",
        "flex flex-col",
        maxWidthClasses[maxWidth],
        className
      )}>
        {/* Header */}
        <DialogHeader className={cn(
          "px-6 pt-6 pb-4",
          "border-b border-border",
          variant === "gradient-header" && "bg-gradient-to-r from-primary/10 via-primary-light/10 to-primary-lighter/10"
        )}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className={cn(
                "text-xl sm:text-2xl",
                "font-bold",
                "text-foreground",
                "pr-4"
              )}>
                {title}
              </DialogTitle>
              {subtitle && (
                <DialogDescription className={cn(
                  "mt-2",
                  "text-sm sm:text-base",
                  "text-muted-foreground"
                )}>
                  {subtitle}
                </DialogDescription>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={() => onOpenChange(false)}
                className={cn(
                  "p-2",
                  "rounded-lg",
                  "hover:bg-slate-100",
                  "transition-colors",
                  "flex-shrink-0",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                )}
                aria-label="Close"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            )}
          </div>
        </DialogHeader>

        {/* Body */}
        <div className={cn(
          "flex-1",
          "overflow-y-auto",
          "px-6 py-6"
        )}>
          {children}
        </div>

        {/* Footer */}
        {(footer || primaryAction || secondaryAction) && (
          <div className={cn(
            "px-6 py-4",
            "border-t border-border",
            "bg-slate-50/50",
            "flex items-center justify-end gap-3"
          )}>
            {footer || (
              <>
                {secondaryAction && (
                  <SecondaryButton
                    onClick={secondaryAction.onClick}
                    isLoading={secondaryAction.isLoading}
                  >
                    {secondaryAction.label}
                  </SecondaryButton>
                )}
                {primaryAction && (
                  <PrimaryButton
                    onClick={primaryAction.onClick}
                    isLoading={primaryAction.isLoading}
                  >
                    {primaryAction.label}
                  </PrimaryButton>
                )}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

