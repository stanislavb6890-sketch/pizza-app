export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  correlationId?: string;
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;
  withCorrelationId(correlationId: string): Logger;
}

class ConsoleLogger implements Logger {
  constructor(private context?: string) {}

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      service: 'pizza-delivery-platform',
      environment: process.env.NODE_ENV,
      message,
      ...context,
    };
    return JSON.stringify(logEntry);
  }

  private shouldLog(level: LogLevel): boolean {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase() || 'info';
    const levels: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[envLevel as LogLevel] || process.env.NODE_ENV === 'development';
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorContext = error
        ? { ...context, error: { message: error.message, stack: error.stack } }
        : context;
      console.error(this.formatMessage('error', message, errorContext));
    }
  }

  withCorrelationId(correlationId: string): Logger {
    return new CorrelatedLogger(this.context, correlationId);
  }
}

class CorrelatedLogger implements Logger {
  constructor(private context?: string, private correlationId?: string) {}

  private addCorrelationId(context?: LogContext): LogContext {
    return { ...context, correlationId: this.correlationId };
  }

  debug(message: string, context?: LogContext): void {
    const logger = new ConsoleLogger(this.context);
    logger.debug(message, this.addCorrelationId(context));
  }

  info(message: string, context?: LogContext): void {
    const logger = new ConsoleLogger(this.context);
    logger.info(message, this.addCorrelationId(context));
  }

  warn(message: string, context?: LogContext): void {
    const logger = new ConsoleLogger(this.context);
    logger.warn(message, this.addCorrelationId(context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const logger = new ConsoleLogger(this.context);
    logger.error(message, error, this.addCorrelationId(context));
  }

  withCorrelationId(correlationId: string): Logger {
    return new CorrelatedLogger(this.context, correlationId);
  }
}

export function createLogger(context?: string): Logger {
  return new ConsoleLogger(context);
}

export const logger = createLogger();

export function generateCorrelationId(): string {
  return `corr_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
