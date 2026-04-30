/**
 * JSON Logger Utility for Production
 * 
 * Provides structured JSON logging for production environments.
 * Supports multiple log levels and automatic metadata enrichment.
 * 
 * @example
 * ```typescript
 * import { logger } from './utils/json-logger.js';
 * 
 * logger.info('Server started', { port: 3000 });
 * logger.error('Connection failed', { error: err, retryCount: 3 });
 * ```
 */

import { EventEmitter } from 'node:events';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  version: string;
  environment: string;
  pid: number;
  hostname: string;
  metadata?: Record<string, unknown>;
  traceId?: string;
  spanId?: string;
}

export interface LoggerOptions {
  service?: string;
  version?: string;
  environment?: string;
  minLevel?: LogLevel;
  includeMetadata?: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class JsonLogger extends EventEmitter {
  private readonly service: string;
  private readonly version: string;
  private readonly environment: string;
  private readonly minLevel: LogLevel;
  private readonly includeMetadata: boolean;

  constructor(options: LoggerOptions = {}) {
    super();
    this.service = options.service || process.env.SERVICE_NAME || 'openclaw';
    this.version = options.version || process.env.npm_package_version || 'unknown';
    this.environment = options.environment || process.env.NODE_ENV || 'development';
    this.minLevel = options.minLevel || (this.environment === 'production' ? 'info' : 'debug');
    this.includeMetadata = options.includeMetadata ?? true;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  private createEntry(level: LogLevel, message: string, metadata?: Record<string, unknown>): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      version: this.version,
      environment: this.environment,
      pid: process.pid,
      hostname: process.hostname || 'localhost',
    };

    if (this.includeMetadata && metadata) {
      entry.metadata = this.sanitizeMetadata(metadata);
    }

    // Add tracing context if available
    if (process.env.TRACE_ID) {
      entry.traceId = process.env.TRACE_ID;
    }
    if (process.env.SPAN_ID) {
      entry.spanId = process.env.SPAN_ID;
    }

    return entry;
  }

  private sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(metadata)) {
      if (value instanceof Error) {
        sanitized[key] = {
          name: value.name,
          message: value.message,
          stack: value.stack,
          code: (value as NodeJS.ErrnoException).code,
        };
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeMetadata(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = this.createEntry(level, message, metadata);
    const jsonOutput = JSON.stringify(entry);

    // Write to appropriate stream based on level
    if (level === 'error') {
      console.error(jsonOutput);
    } else if (level === 'warn') {
      console.warn(jsonOutput);
    } else {
      console.log(jsonOutput);
    }

    this.emit('log', entry);
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log('debug', message, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log('warn', message, metadata);
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    this.log('error', message, metadata);
  }

  /**
   * Create a child logger with additional metadata
   */
  child(metadata: Record<string, unknown>): JsonLogger {
    const childLogger = new JsonLogger({
      service: this.service,
      version: this.version,
      environment: this.environment,
      minLevel: this.minLevel,
    });

    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
      originalLog(level, message, { ...metadata, ...meta });
    };

    return childLogger;
  }
}

// Default exported logger instance
export const logger = new JsonLogger();

export function createLogger(options?: LoggerOptions): JsonLogger {
  return new JsonLogger(options);
}

export default logger;
