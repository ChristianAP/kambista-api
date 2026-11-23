import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../../src/app';
import { loadEnvironment } from '../../src/config/environment';
import { buildContainer, Container } from '../../src/container';
import { connectDatabase, disconnectDatabase } from '../../src/database/connection';
import { ExchangeRateProvider } from '../../src/exchange-rate/application/exchange-rate.provider';
import { StubExchangeRateProvider } from './exchange-doubles';

export interface TestContext {
  readonly container: Container;
  readonly http: ReturnType<typeof request>;
  readonly close: () => Promise<void>;
}

export const createTestApp = async (
  provider: ExchangeRateProvider = new StubExchangeRateProvider(),
): Promise<TestContext> => {
  const mongo = await MongoMemoryServer.create();
  const config = loadEnvironment({
    MONGODB_URI: mongo.getUri('kambista-test'),
    JWT_SECRET: 'e2e-secret-with-at-least-thirty-two-characters',
    EXCHANGE_RATE_POLLING_ENABLED: 'false',
    LOG_LEVEL: 'silent',
  });

  await connectDatabase(config.MONGODB_URI);
  const container = buildContainer(config, { exchangeRateProvider: provider });

  return {
    container,
    http: request(createApp(container, config)),
    close: async () => {
      await disconnectDatabase();
      await mongo.stop();
    },
  };
};
