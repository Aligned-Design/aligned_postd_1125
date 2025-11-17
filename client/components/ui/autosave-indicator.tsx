import { Check, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AutosaveIndicatorProps {
  saving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

export function AutosaveIndicator({ saving, lastSaved, error }: AutosaveIndicatorProps) {
  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive" role="status" aria-live="polite">
        <CloudOff className="h-4 w-4" aria-hidden="true" />
        <span>Failed to save</span>
      </div>
    );
  }

  if (saving) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status" aria-live="polite">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span>Saving...</span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status" aria-live="polite">
        <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
        <span>Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status" aria-live="polite">
      <Cloud className="h-4 w-4" aria-hidden="true" />
      <span>Autosave enabled</span>
    </div>
  );
}
