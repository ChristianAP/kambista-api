export type LogFields = Record<string, unknown>;

export type LogLevel = 'info' | 'warn' | 'error' | 'silent';

export interface Logger {
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, error?: unknown, fields?: LogFields): void;
}

const SEVERITY: Record<LogLevel, number> = { info: 0, warn: 1, error: 2, silent: 3 };

const describeError = (error: unknown): LogFields => {
  if (error instanceof Error) {
    return { error: { name: error.name, message: error.message, stack: error.stack } };
  }

  return error === undefined ? {} : { error: { message: String(error) } };
};

export const createLogger = (context: string, minimumLevel: LogLevel = 'info'): Logger => {
  const write = (level: Exclude<LogLevel, 'silent'>, message: string, fields: LogFields): void => {
    if (SEVERITY[level] < SEVERITY[minimumLevel]) {
      return;
    }

    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      ...fields,
    });

    if (level === 'info') {
      console.log(line);
    } else if (level === 'warn') {
      console.warn(line);
    } else {
      console.error(line);
    }
  };

  return {
    info: (message, fields = {}) => write('info', message, fields),
    warn: (message, fields = {}) => write('warn', message, fields),
    error: (message, error, fields = {}) =>
      write('error', message, { ...describeError(error), ...fields }),
  };
};
