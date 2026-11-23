import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { Container } from './container';
import { Environment } from './config/environment';
import { isDatabaseConnected } from './database/connection';
import { openApiDocument } from './docs/openapi';
import { createHealthRouter } from './health/health.router';
import { createAuthRouter } from './identity/presentation/auth.router';
import { authenticate } from './identity/presentation/authenticate';
import { createErrorHandler, notFoundHandler } from './shared/presentation/error-handler';
import { requestLogger } from './shared/presentation/request-logger';
import { PAGINATION_HEADERS } from './transactions/presentation/transactions.presenters';
import { createTransactionsRouter } from './transactions/presentation/transactions.router';

const EXPOSED_HEADERS = ['X-Request-Id', ...Object.values(PAGINATION_HEADERS)];

export type AppConfig = Pick<
  Environment,
  'CORS_ORIGINS' | 'LOGIN_MAX_FAILED_ATTEMPTS' | 'LOGIN_ATTEMPTS_WINDOW_SECONDS'
>;

const parseOrigins = (origins: string): string[] =>
  origins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

export const createApp = (container: Container, config: AppConfig): Express => {
  const app = express();

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use(requestLogger(container.loggerFor('Http')));
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: parseOrigins(config.CORS_ORIGINS), exposedHeaders: EXPOSED_HEADERS }));
  app.use(express.json());

  app.use('/health', createHealthRouter(isDatabaseConnected));
  app.use(
    '/v1/auth',
    createAuthRouter(container, {
      maxFailedAttempts: config.LOGIN_MAX_FAILED_ATTEMPTS,
      windowSeconds: config.LOGIN_ATTEMPTS_WINDOW_SECONDS,
    }),
  );

  app.use('/v1', authenticate(container.tokens));
  app.use('/v1/transactions', createTransactionsRouter(container));

  app.use(notFoundHandler);
  app.use(createErrorHandler(container.loggerFor('Http')));

  return app;
};
