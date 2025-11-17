import { useEffect, useRef } from "react";
import { Logger, LoggerConfig, getLogger } from "@shared/logger";

export function useLogger(context: string, config?: Partial<LoggerConfig>) {
  const loggerRef = useRef<Logger | null>(null);

  useEffect(() => {
    if (!loggerRef.current) {
      if (config) {
        loggerRef.current = new Logger({
          ...config,
          context,
        });
      } else {
        loggerRef.current = getLogger(context);
      }
    }
    return () => {
      loggerRef.current?.flush().catch(() => {
        // Silently fail
      });
    };
  }, [context, config]);

  return loggerRef.current || getLogger(context);
}
