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
import { createLogger } from './shared/infrastructure/logger';
import { createErrorHandler, notFoundHandler } from './shared/presentation/error-handler';
import { createTransactionsRouter } from './transactions/presentation/transactions.router';

const parseOrigins = (origins: string): string[] =>
  origins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

export const createApp = (
  container: Container,
  config: Pick<Environment, 'CORS_ORIGINS'>,
): Express => {
  const app = express();

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: parseOrigins(config.CORS_ORIGINS) }));
  app.use(express.json());

  app.use('/health', createHealthRouter(isDatabaseConnected));
  app.use('/v1/auth', createAuthRouter(container));

  app.use('/v1', authenticate(container.tokens));
  app.use('/v1/transactions', createTransactionsRouter(container));

  app.use(notFoundHandler);
  app.use(createErrorHandler(createLogger('Http')));

  return app;
};
