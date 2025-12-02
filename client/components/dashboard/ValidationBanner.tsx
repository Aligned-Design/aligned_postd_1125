import { AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/design-system";

interface ValidationBannerProps {
  warnings: string[];
  errors?: string[];
  onDismiss?: () => void;
  className?: string;
}

export function ValidationBanner({ warnings, errors, onDismiss, className }: ValidationBannerProps) {
  if (warnings.length === 0 && (!errors || errors.length === 0)) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-4 space-y-2",
        errors && errors.length > 0
          ? "bg-red-50 border-red-200"
          : "bg-amber-50 border-amber-200",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1">
          <AlertCircle
            className={cn(
              "w-5 h-5 flex-shrink-0 mt-0.5",
              errors && errors.length > 0 ? "text-red-600" : "text-amber-600"
            )}
          />
          <div className="flex-1 min-w-0">
            {errors && errors.length > 0 && (
              <div className="mb-2">
                <p className="text-sm font-bold text-red-900 mb-1">Validation Errors:</p>
                <ul className="text-sm text-red-800 space-y-1">
                  {errors.map((error, idx) => (
                    <li key={idx}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
            {warnings.length > 0 && (
              <div>
                <p className="text-sm font-bold text-amber-900 mb-1">Warnings:</p>
                <ul className="text-sm text-amber-800 space-y-1">
                  {warnings.map((warning, idx) => (
                    <li key={idx}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-slate-600 hover:text-slate-900 p-1 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

