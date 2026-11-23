import { createTestApp, TestContext } from './support/create-test-app';
import { PASSWORD, registerUser, uniqueEmail } from './support/session-helpers';

const MAX_FAILED_ATTEMPTS = 3;

describe('Login rate limiting (e2e)', () => {
  let context: TestContext;

  const login = (email: string, password: string) =>
    context.http.post('/v1/auth/login').send({ email, password });

  beforeEach(async () => {
    context = await createTestApp({
      environment: {
        LOGIN_MAX_FAILED_ATTEMPTS: String(MAX_FAILED_ATTEMPTS),
        LOGIN_ATTEMPTS_WINDOW_SECONDS: '60',
      },
    });
  });

  afterEach(async () => {
    await context.close();
  });

  it('blocks further attempts after too many failures', async () => {
    const { email } = await registerUser(context);

    for (let attempt = 0; attempt < MAX_FAILED_ATTEMPTS; attempt += 1) {
      await login(email, 'incorrecta123').expect(401);
    }
    const blocked = await login(email, 'incorrecta123').expect(429);

    expect(blocked.body.code).toBe('TOO_MANY_LOGIN_ATTEMPTS');
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
  });

  it('also blocks the correct password once the limit is exceeded', async () => {
    const { email } = await registerUser(context);

    for (let attempt = 0; attempt < MAX_FAILED_ATTEMPTS; attempt += 1) {
      await login(email, 'incorrecta123').expect(401);
    }

    await login(email, PASSWORD).expect(429);
  });

  it('limits the failures of a client across different emails', async () => {
    for (let attempt = 0; attempt < MAX_FAILED_ATTEMPTS; attempt += 1) {
      await login(uniqueEmail(), PASSWORD).expect(401);
    }

    await login(uniqueEmail(), PASSWORD).expect(429);
  });

  it('does not count successful logins', async () => {
    const { email } = await registerUser(context);

    for (let attempt = 0; attempt < MAX_FAILED_ATTEMPTS * 2; attempt += 1) {
      await login(email, PASSWORD).expect(200);
    }
  });

  it('does not limit the other endpoints', async () => {
    for (let attempt = 0; attempt < MAX_FAILED_ATTEMPTS; attempt += 1) {
      await login(uniqueEmail(), PASSWORD).expect(401);
    }

    await context.http
      .post('/v1/auth/register')
      .send({ nombre: 'Juan Pérez', email: uniqueEmail(), password: PASSWORD })
      .expect(201);
  });
});
