/**
 * Centralized logging service for POSTD
 * Provides structured logging across client and server
 * Supports different log levels and metadata tracking
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface LogEntry {
  level: LogLevel;
  timestamp: string;
  message: string;
  context?: string;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  userId?: string;
  requestId?: string;
}

export interface LoggerConfig {
  enableConsole?: boolean;
  enableRemote?: boolean;
  remoteEndpoint?: string;
  minLevel?: LogLevel;
  context?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

export class Logger {
  private config: Required<LoggerConfig>;
  private queue: LogEntry[] = [];
  private isProcessing = false;

  constructor(config: LoggerConfig = {}) {
    this.config = {
      enableConsole: config.enableConsole ?? true,
      enableRemote: config.enableRemote ?? true,
      remoteEndpoint: config.remoteEndpoint ?? "/api/logs",
      minLevel: config.minLevel ?? "debug",
      context: config.context ?? "app",
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  private createEntry(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    return {
      level,
      timestamp: new Date().toISOString(),
      message,
      context: this.config.context,
      metadata,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    };
  }

  private async logRemote(entry: LogEntry): Promise<void> {
    if (!this.config.enableRemote) return;

    try {
      // Queue log entry for batch sending
      this.queue.push(entry);

      // Process queue if it reaches threshold or after delay
      if (this.queue.length >= 10) {
        await this.flushQueue();
      } else if (!this.isProcessing) {
        this.scheduleFlush();
      }
    } catch (err) {
      // Silently fail to avoid recursive errors
      if (this.config.enableConsole) {
        console.error("[Logger] Failed to queue log:", err);
      }
    }
  }

  private scheduleFlush(): void {
    if (this.isProcessing || this.queue.length === 0) return;

    setTimeout(() => {
      this.flushQueue().catch((err) => {
        if (this.config.enableConsole) {
          console.error("[Logger] Failed to flush queue:", err);
        }
      });
    }, 5000); // Flush every 5 seconds
  }

  private async flushQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const logsToSend = [...this.queue];
    this.queue = [];

    try {
      // Only send from client side (server logs directly to database)
      if (typeof window !== "undefined") {
        const response = await fetch(this.config.remoteEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ logs: logsToSend }),
        });

        if (!response.ok) {
          // Re-queue failed logs
          this.queue = [...logsToSend, ...this.queue];
        }
      }
    } catch (err) {
      // Re-queue logs if request failed
      this.queue = [...logsToSend, ...this.queue];
      throw err;
    } finally {
      this.isProcessing = false;
    }
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog("debug")) return;

    const entry = this.createEntry("debug", message, metadata);
    if (this.config.enableConsole) {
      console.debug(`[${this.config.context}]`, message, metadata);
    }
    this.logRemote(entry).catch(() => {
      // Silently fail
    });
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog("info")) return;

    const entry = this.createEntry("info", message, metadata);
    if (this.config.enableConsole) {
      console.info(`[${this.config.context}]`, message, metadata);
    }
    this.logRemote(entry).catch(() => {
      // Silently fail
    });
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog("warn")) return;

    const entry = this.createEntry("warn", message, metadata);
    if (this.config.enableConsole) {
      console.warn(`[${this.config.context}]`, message, metadata);
    }
    this.logRemote(entry).catch(() => {
      // Silently fail
    });
  }

  error(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog("error")) return;

    const entry = this.createEntry("error", message, metadata, error);
    if (this.config.enableConsole) {
      console.error(`[${this.config.context}]`, message, error, metadata);
    }
    this.logRemote(entry).catch(() => {
      // Silently fail
    });
  }

  fatal(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog("fatal")) return;

    const entry = this.createEntry("fatal", message, metadata, error);
    if (this.config.enableConsole) {
      console.error(`[${this.config.context}] FATAL:`, message, error, metadata);
    }
    this.logRemote(entry).catch(() => {
      // Silently fail
    });
  }

  async flush(): Promise<void> {
    await this.flushQueue();
  }

  setContext(context: string): void {
    this.config.context = context;
  }
}

// Global singleton instance
let globalLogger: Logger;

export function initializeLogger(config?: LoggerConfig): Logger {
  globalLogger = new Logger(config);
  return globalLogger;
}

export function getLogger(context?: string): Logger {
  if (!globalLogger) {
    globalLogger = new Logger();
  }
  if (context) {
    globalLogger.setContext(context);
  }
  return globalLogger;
}

export default getLogger();
