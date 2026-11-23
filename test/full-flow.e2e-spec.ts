import { createTestApp, TestContext } from './support/create-test-app';
import { PASSWORD, todayInLima, uniqueEmail } from './support/session-helpers';

describe('Full user journey (e2e)', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await createTestApp();
    await context.container.refreshExchangeRate.execute();
  });

  afterAll(async () => {
    await context.close();
  });

  it('registers, logs in, exchanges currency, reads the history and closes the session', async () => {
    const email = uniqueEmail();
    const today = todayInLima();

    const { body: registered } = await context.http
      .post('/v1/auth/register')
      .send({ nombre: 'Juan Pérez', email, password: PASSWORD })
      .expect(201);
    expect(registered.rol).toBe('user');

    const { body: session } = await context.http
      .post('/v1/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);
    const authorization = ['Authorization', `Bearer ${session.access_token}`] as const;

    const { body: dollars } = await context.http
      .post('/v1/transactions')
      .set(...authorization)
      .send({ monedaOrigen: 'USD', monedaDestino: 'PEN', monto: 100 })
      .expect(201);
    expect(dollars).toMatchObject({ montoCambiado: 373.9, tipoCambio: 3.739 });

    const { body: soles } = await context.http
      .post('/v1/transactions')
      .set(...authorization)
      .send({ monedaOrigen: 'PEN', monedaDestino: 'USD', monto: 100 })
      .expect(201);
    expect(soles).toMatchObject({ montoCambiado: 26.79, tipoCambio: 3.733 });

    const history = await context.http
      .get(`/v1/transactions/history?startDate=${today}&endDate=${today}`)
      .set(...authorization)
      .expect(200);
    expect(history.body).toEqual([soles, dollars]);
    expect(history.headers['x-total-count']).toBe('2');

    const { body: renewed } = await context.http
      .post('/v1/auth/refresh')
      .send({ refresh_token: session.refresh_token })
      .expect(200);

    const afterRefresh = await context.http
      .get(`/v1/transactions/history?startDate=${today}&endDate=${today}`)
      .set('Authorization', `Bearer ${renewed.access_token}`)
      .expect(200);
    expect(afterRefresh.body).toEqual([soles, dollars]);

    await context.http
      .post('/v1/auth/logout')
      .send({ refresh_token: renewed.refresh_token })
      .expect(204);
    await context.http
      .post('/v1/auth/refresh')
      .send({ refresh_token: renewed.refresh_token })
      .expect(401);
  });
});
