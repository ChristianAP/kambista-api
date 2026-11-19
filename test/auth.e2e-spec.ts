import { createTestApp, TestContext } from './support/create-test-app';
import { PASSWORD, uniqueEmail } from './support/session-helpers';

describe('Authentication (e2e)', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await createTestApp();
  });

  afterAll(async () => {
    await context.close();
  });

  describe('POST /v1/auth/register', () => {
    it('creates a user with the default role and never returns credentials', async () => {
      const email = uniqueEmail();

      const { body } = await context.http
        .post('/v1/auth/register')
        .send({ nombre: 'Juan Pérez', email, password: PASSWORD })
        .expect(201);

      expect(body).toEqual({ id: expect.any(String), nombre: 'Juan Pérez', email, rol: 'user' });
    });

    it('ignores any role sent by the client', async () => {
      const { body } = await context.http
        .post('/v1/auth/register')
        .send({ nombre: 'Ana Ruiz', email: uniqueEmail(), password: PASSWORD, rol: 'admin' })
        .expect(201);

      expect(body.rol).toBe('user');
    });

    it('rejects an email that is already registered', async () => {
      const email = uniqueEmail();
      const payload = { nombre: 'Juan Pérez', email, password: PASSWORD };
      await context.http.post('/v1/auth/register').send(payload).expect(201);

      const { body } = await context.http
        .post('/v1/auth/register')
        .send({ ...payload, email: email.toUpperCase() })
        .expect(409);

      expect(body.code).toBe('EMAIL_ALREADY_REGISTERED');
    });

    it('reports every invalid field', async () => {
      const { body } = await context.http
        .post('/v1/auth/register')
        .send({ nombre: 'J', email: 'no-es-correo', password: '123' })
        .expect(400);

      expect(body.code).toBe('VALIDATION_ERROR');
      expect(body.details.map((detail: { field: string }) => detail.field).sort()).toEqual([
        'email',
        'nombre',
        'password',
      ]);
    });
  });

  describe('POST /v1/auth/login', () => {
    it('returns the access token and the user data', async () => {
      const email = uniqueEmail();
      await context.http
        .post('/v1/auth/register')
        .send({ nombre: 'Juan Pérez', email, password: PASSWORD })
        .expect(201);

      const { body } = await context.http
        .post('/v1/auth/login')
        .send({ email, password: PASSWORD })
        .expect(200);

      expect(body.access_token.split('.')).toHaveLength(3);
      expect(body.usuario).toEqual({
        id: expect.any(String),
        nombre: 'Juan Pérez',
        email,
        rol: 'user',
      });
    });

    it('answers a wrong password and an unknown email identically', async () => {
      const email = uniqueEmail();
      await context.http
        .post('/v1/auth/register')
        .send({ nombre: 'Juan Pérez', email, password: PASSWORD })
        .expect(201);

      const wrongPassword = await context.http
        .post('/v1/auth/login')
        .send({ email, password: 'incorrecta123' })
        .expect(401);
      const unknownEmail = await context.http
        .post('/v1/auth/login')
        .send({ email: uniqueEmail(), password: PASSWORD })
        .expect(401);

      expect(wrongPassword.body.code).toBe('INVALID_CREDENTIALS');
      expect(unknownEmail.body.message).toBe(wrongPassword.body.message);
    });
  });

  describe('protected routes', () => {
    const history = '/v1/transactions/history?startDate=2026-01-01&endDate=2026-12-31';

    it('rejects requests without a token', async () => {
      const { body } = await context.http.get(history).expect(401);

      expect(body.code).toBe('MISSING_TOKEN');
    });

    it('rejects a malformed or forged token', async () => {
      const { body } = await context.http
        .get(history)
        .set('Authorization', 'Bearer token.falso.invalido')
        .expect(401);

      expect(body.code).toBe('INVALID_TOKEN');
    });
  });
});
