/**
 * Central Error Logger
 * 
 * Standardized logging with brandId, workspaceId, userId context.
 * All errors are logged with consistent structure.
 */

export interface LogContext {
  brandId?: string;
  workspaceId?: string;
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  /**
   * Log an error with context
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "error",
      message,
      context,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    };

    console.error(JSON.stringify(entry));
  }

  /**
   * Log a warning with context
   */
  warn(message: string, context?: LogContext): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "warn",
      message,
      context,
    };

    console.warn(JSON.stringify(entry));
  }

  /**
   * Log info with context
   */
  info(message: string, context?: LogContext): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message,
      context,
    };

    console.log(JSON.stringify(entry));
  }

  /**
   * Log debug with context
   */
  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === "development") {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: "debug",
        message,
        context,
      };

      console.debug(JSON.stringify(entry));
    }
  }
}

export const logger = new Logger();

