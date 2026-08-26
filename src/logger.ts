export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
}

export type LogFormatter = (entry: LogEntry) => string;

export interface PipelineLogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string): void;
}

export interface DefaultLoggerOptions {
  prefix?: string;
  format?: LogFormatter;
}

function defaultFormat(prefix: string): LogFormatter {
  return (entry) => `${prefix} ${entry.message}`;
}

/**
 * Default logger using console.
 * Prefixes all messages with [pipeline] for easy filtering.
 * Customize via prefix string or a full format function.
 */
export class DefaultLogger implements PipelineLogger {
  #format: LogFormatter;

  constructor(options?: DefaultLoggerOptions) {
    const prefix = options?.prefix ?? '[pipeline]';
    this.#format = options?.format ?? defaultFormat(prefix);
  }

  info(message: string): void {
    console.log(this.#format({ level: 'info', message, timestamp: new Date() }));
  }

  warn(message: string): void {
    console.warn(this.#format({ level: 'warn', message, timestamp: new Date() }));
  }

  error(message: string): void {
    console.error(this.#format({ level: 'error', message, timestamp: new Date() }));
  }

  debug(message: string): void {
    console.debug(this.#format({ level: 'debug', message, timestamp: new Date() }));
  }
}

/**
 * No-op logger. Silences all pipeline output.
 */
export class SilentLogger implements PipelineLogger {
  info(): void {}
  warn(): void {}
  error(): void {}
  debug(): void {}
}
