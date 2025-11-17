import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  variant?: "default" | "destructive";
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  variant = "destructive",
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Alert variant={variant} className="max-w-lg">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="mt-2">{message}</AlertDescription>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="mt-4 min-h-[44px]"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        )}
      </Alert>
    </div>
  );
}

export function InlineError({ message }: { message: string }) {
  return (
    <div
      className="flex items-start gap-2 text-sm text-destructive"
      role="alert"
    >
      <AlertCircle
        className="h-4 w-4 mt-0.5 flex-shrink-0"
        aria-hidden="true"
      />
      <p>{message}</p>
    </div>
  );
}
