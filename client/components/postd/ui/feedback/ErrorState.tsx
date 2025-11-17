/**
 * ErrorState
 * 
 * Standard error state component for Postd.
 * Used when there's an error loading data.
 */

import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/design-system";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { PrimaryButton } from "../buttons/PrimaryButton";
import { GhostButton } from "../buttons/GhostButton";

interface ErrorStateProps {
  title?: string;
  message?: string;
  icon?: ReactNode;
  onRetry?: () => void;
  onDismiss?: () => void;
  onGoHome?: () => void;
  showGoHome?: boolean;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this content. Please try again.",
  icon,
  onRetry,
  onDismiss,
  onGoHome,
  showGoHome = false,
  className,
}: ErrorStateProps) {
  const navigate = useNavigate();

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      navigate("/dashboard");
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Default: reload the page
      window.location.reload();
    }
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center",
      "py-12 sm:py-16 md:py-20",
      "text-center",
      className
    )}>
      <div className={cn(
        "w-16 h-16 sm:w-20 sm:h-20",
                "rounded-lg", /* Rounded rectangle for icon container */
        "bg-red-50",
        "flex items-center justify-center",
        "mb-4 sm:mb-6"
      )}>
        {icon || <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" />}
      </div>
      
      <h3 className={cn(
        "text-lg sm:text-xl md:text-2xl",
        "font-semibold",
        "text-foreground",
        "mb-2"
      )}>
        {title}
      </h3>
      
      <p className={cn(
        "text-sm sm:text-base",
        "text-muted-foreground",
        "max-w-md",
        "mb-6 sm:mb-8"
      )}>
        {message}
      </p>
      
      <div className="flex items-center gap-3 flex-wrap justify-center">
        {onRetry && (
          <PrimaryButton onClick={handleRetry} size="md">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </PrimaryButton>
        )}
        {showGoHome && (
          <PrimaryButton onClick={handleGoHome} size="md" variant="default">
            <Home className="w-4 h-4" />
            Go Home
          </PrimaryButton>
        )}
        {onDismiss && (
          <GhostButton onClick={onDismiss} size="md">
            Dismiss
          </GhostButton>
        )}
      </div>
    </div>
  );
}

