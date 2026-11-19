export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string, error?: unknown): void;
}

const print = (level: string, context: string, message: string): string =>
  `${new Date().toISOString()} ${level.padEnd(5)} [${context}] ${message}`;

export const createLogger = (context: string): Logger => ({
  info: (message) => console.log(print('INFO', context, message)),
  warn: (message) => console.warn(print('WARN', context, message)),
  error: (message, error) => {
    console.error(print('ERROR', context, message));
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
  },
});
