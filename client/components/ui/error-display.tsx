/**
 * User-Friendly Error Display Component
 * 
 * Displays errors in a friendly, actionable way
 */

import { AlertCircle, X, HelpCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatErrorForUI } from "@/lib/user-friendly-errors";
import { Link } from "react-router-dom";

interface ErrorDisplayProps {
  error: Error | string | unknown;
  context?: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
}

export function ErrorDisplay({
  error,
  context,
  onDismiss,
  onRetry,
  className = "",
}: ErrorDisplayProps) {
  const friendlyError = formatErrorForUI(error, context);
  
  const severityColors = {
    error: "bg-red-50 border-red-200 text-red-900",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-900",
    info: "bg-blue-50 border-blue-200 text-blue-900",
  };
  
  const iconColors = {
    error: "text-red-600",
    warning: "text-yellow-600",
    info: "text-blue-600",
  };

  return (
    <div
      className={`rounded-lg border p-4 ${severityColors[friendlyError.severity]} ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${iconColors[friendlyError.severity]}`}>
          <AlertCircle className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">{friendlyError.title}</h3>
          <p className="text-sm mb-3 opacity-90">{friendlyError.message}</p>
          
          <div className="flex flex-wrap gap-2">
            {onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                className="text-xs"
              >
                Try Again
              </Button>
            )}
            
            {friendlyError.helpLink && (
              <Button
                size="sm"
                variant="ghost"
                asChild
                className="text-xs"
              >
                <Link to={friendlyError.helpLink}>
                  <HelpCircle className="w-3 h-3 mr-1" />
                  Get Help
                </Link>
              </Button>
            )}
            
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                className="text-xs"
              >
                Dismiss
              </Button>
            )}
          </div>
          
          {friendlyError.action && (
            <p className="text-xs mt-2 opacity-75 italic">
              💡 {friendlyError.action}
            </p>
          )}
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

