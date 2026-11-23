import express from 'express';
import request from 'supertest';
import { Logger } from '../infrastructure/logger';
import { requestLogger } from './request-logger';

const buildLogger = (): jest.Mocked<Logger> => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

const buildApp = (logger: Logger) => {
  const app = express();
  app.use(requestLogger(logger));
  app.get('/ok', (_req, res) => {
    res.locals.user = { id: 'user-1' };
    res.json({ ok: true });
  });
  app.get('/rechazado', (_req, res) => {
    res.locals.errorCode = 'INVALID_TOKEN';
    res.status(401).json({});
  });
  app.get('/roto', (_req, res) => {
    res.status(500).json({});
  });
  return request(app);
};

describe('requestLogger', () => {
  it('logs the request with its method, path, status, duration and user', async () => {
    const logger = buildLogger();

    await buildApp(logger).get('/ok?startDate=2026-11-01').expect(200);

    expect(logger.info).toHaveBeenCalledWith('Petición atendida', {
      requestId: expect.any(String),
      method: 'GET',
      path: '/ok?startDate=2026-11-01',
      statusCode: 200,
      durationMs: expect.any(Number),
      userId: 'user-1',
      errorCode: undefined,
    });
  });

  it('logs rejected requests as warnings with their error code', async () => {
    const logger = buildLogger();

    await buildApp(logger).get('/rechazado').expect(401);

    expect(logger.warn).toHaveBeenCalledWith(
      'Petición rechazada',
      expect.objectContaining({ statusCode: 401, errorCode: 'INVALID_TOKEN' }),
    );
  });

  it('logs server failures as errors', async () => {
    const logger = buildLogger();

    await buildApp(logger).get('/roto').expect(500);

    expect(logger.error).toHaveBeenCalledWith(
      'Petición fallida',
      undefined,
      expect.objectContaining({ statusCode: 500 }),
    );
  });

  it('generates a request id and returns it in the response', async () => {
    const logger = buildLogger();

    const response = await buildApp(logger).get('/ok').expect(200);

    const logged = logger.info.mock.calls[0][1] as { requestId: string };
    expect(response.headers['x-request-id']).toBe(logged.requestId);
    expect(logged.requestId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('keeps the request id sent by the client', async () => {
    const logger = buildLogger();

    const response = await buildApp(logger).get('/ok').set('X-Request-Id', 'trace-123').expect(200);

    expect(response.headers['x-request-id']).toBe('trace-123');
  });

  it('replaces a request id with unsafe characters', async () => {
    const logger = buildLogger();

    const response = await buildApp(logger).get('/ok').set('X-Request-Id', 'a b"c').expect(200);

    expect(response.headers['x-request-id']).not.toBe('a b"c');
  });
});
