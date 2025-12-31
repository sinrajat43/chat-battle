import pino from 'pino';

/**
 * Initialize Pino logger
 * - Pretty print in development
 * - JSON format in production
 * - Uses environment variables directly to avoid circular dependencies
 */
const isDevelopment = process.env.NODE_ENV !== 'production';
const logLevel = process.env.LOG_LEVEL || 'info';

export const logger = pino({
  level: logLevel,
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

