export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
}

class ConsoleLogger implements Logger {
  constructor(private context?: string) {}

  private formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    const prefix = this.context ? `[${this.context}] ` : '';
    return `${timestamp} ${level.toUpperCase()}: ${prefix}${message}${contextStr}`;
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    console.info(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    const errorContext = error
      ? { ...context, error: { message: error.message, stack: error.stack } }
      : context;
    console.error(this.formatMessage('error', message, errorContext));
  }
}

export function createLogger(context?: string): Logger {
  return new ConsoleLogger(context);
}

export const logger = createLogger();
