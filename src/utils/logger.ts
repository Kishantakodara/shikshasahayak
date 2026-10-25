// ============================================================
// SHIKSHA SAHAYAK OS - UNIFIED APPLICATION LOGGER
// ============================================================

import { envConfig } from '../config/env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private prefix = '[ShikshaSahayak OS]';

  private formatMessage(level: LogLevel, message: string, context?: unknown): string {
    const timestamp = new Date().toISOString();
    return `${this.prefix} [${timestamp}] [${level.toUpperCase()}]: ${message}`;
  }

  debug(message: string, context?: unknown): void {
    if (envConfig.isDev) {
      console.debug(this.formatMessage('debug', message), context || '');
    }
  }

  info(message: string, context?: unknown): void {
    console.info(this.formatMessage('info', message), context || '');
  }

  warn(message: string, context?: unknown): void {
    console.warn(this.formatMessage('warn', message), context || '');
  }

  error(message: string, error?: unknown): void {
    console.error(this.formatMessage('error', message), error || '');
  }
}

export const logger = new Logger();
