import { loadEnvironment } from './environment';

const required = {
  MONGODB_URI: 'mongodb://localhost:27017/kambista',
  JWT_SECRET: 'a-secret-with-at-least-thirty-two-characters',
};

describe('loadEnvironment', () => {
  it('applies the documented defaults', () => {
    expect(loadEnvironment(required)).toEqual({
      ...required,
      PORT: 3000,
      JWT_EXPIRES_IN_SECONDS: 900,
      REFRESH_TOKEN_EXPIRES_IN_SECONDS: 604_800,
      LOGIN_MAX_FAILED_ATTEMPTS: 10,
      LOGIN_ATTEMPTS_WINDOW_SECONDS: 900,
      LOG_LEVEL: 'info',
      CORS_ORIGINS: 'http://localhost:5173',
      EXCHANGE_RATE_API_URL: 'https://api.apis.net.pe/v1/tipo-cambio-sunat',
      EXCHANGE_RATE_POLL_INTERVAL_MS: 30_000,
      EXCHANGE_RATE_POLLING_ENABLED: true,
    });
  });

  it('converts numbers and booleans written as text', () => {
    const environment = loadEnvironment({
      ...required,
      PORT: '4000',
      EXCHANGE_RATE_POLL_INTERVAL_MS: '5000',
      EXCHANGE_RATE_POLLING_ENABLED: 'false',
    });

    expect(environment).toMatchObject({
      PORT: 4000,
      EXCHANGE_RATE_POLL_INTERVAL_MS: 5000,
      EXCHANGE_RATE_POLLING_ENABLED: false,
    });
  });

  it('lists every missing or invalid variable', () => {
    const load = () => loadEnvironment({ JWT_SECRET: 'corto', PORT: 'abc' });

    expect(load).toThrow('MONGODB_URI: es obligatoria');
    expect(load).toThrow('JWT_SECRET: debe tener al menos 32 caracteres');
    expect(load).toThrow('PORT');
  });

  it.each(['http://localhost:27017', 'mongo://x', ''])('rejects the MongoDB URI "%s"', (uri) => {
    expect(() => loadEnvironment({ ...required, MONGODB_URI: uri })).toThrow('MONGODB_URI');
  });

  it('rejects an unknown log level', () => {
    expect(() => loadEnvironment({ ...required, LOG_LEVEL: 'verbose' })).toThrow('LOG_LEVEL');
  });

  it('rejects a login limit below one attempt', () => {
    expect(() => loadEnvironment({ ...required, LOGIN_MAX_FAILED_ATTEMPTS: '0' })).toThrow(
      'LOGIN_MAX_FAILED_ATTEMPTS',
    );
  });

  it('rejects a polling interval shorter than one second', () => {
    expect(() => loadEnvironment({ ...required, EXCHANGE_RATE_POLL_INTERVAL_MS: '500' })).toThrow(
      'EXCHANGE_RATE_POLL_INTERVAL_MS',
    );
  });
});
