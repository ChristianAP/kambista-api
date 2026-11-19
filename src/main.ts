import { Server } from 'node:http';
import { createApp } from './app';
import { loadEnvironmentFromFile } from './config/load-environment-file';
import { buildContainer, Container } from './container';
import { connectDatabase, disconnectDatabase } from './database/connection';
import { createLogger, Logger } from './shared/infrastructure/logger';

const registerShutdown = (server: Server, container: Container, logger: Logger): void => {
  const shutdown = (signal: string): void => {
    logger.info(`Señal ${signal} recibida, cerrando la aplicación`);
    container.exchangeRatePoller.stop();
    server.close(() => {
      void disconnectDatabase().finally(() => process.exit(0));
    });
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
};

async function bootstrap(): Promise<void> {
  const logger = createLogger('Bootstrap');
  const config = loadEnvironmentFromFile();

  await connectDatabase(config.MONGODB_URI);
  const container = buildContainer(config);
  const server = createApp(container, config).listen(config.PORT, () => {
    logger.info(`API disponible en http://localhost:${config.PORT}/v1 (documentación en /docs)`);
  });

  if (config.EXCHANGE_RATE_POLLING_ENABLED) {
    container.exchangeRatePoller.start();
  }

  registerShutdown(server, container, logger);
}

bootstrap().catch((error: unknown) => {
  createLogger('Bootstrap').error('No se pudo iniciar la aplicación', error);
  process.exit(1);
});
