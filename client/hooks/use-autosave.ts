import { useEffect, useRef, useState } from "react";
import { useToast } from "./use-toast";

interface UseAutosaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  interval?: number; // milliseconds, default 5000 (5 seconds)
  enabled?: boolean;
}

export function useAutosave<T>({
  data,
  onSave,
  interval = 5000,
  enabled = true,
}: UseAutosaveOptions<T>) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dataRef = useRef(data);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (!enabled) return;

    const save = async () => {
      setSaving(true);
      setError(null);
      try {
        await onSave(dataRef.current);
        setLastSaved(new Date());
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : String(err) || "Failed to autosave";
        setError(errorMessage);
        toast({
          title: "Autosave failed",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setSaving(false);
      }
    };

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(save, interval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, interval, enabled]);

  return {
    saving,
    lastSaved,
    error,
  };
}
