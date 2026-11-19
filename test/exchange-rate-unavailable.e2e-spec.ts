import { createTestApp, TestContext } from './support/create-test-app';
import { bearer, registerUser } from './support/session-helpers';

describe('Transactions without an exchange rate (e2e)', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await createTestApp();
  });

  afterAll(async () => {
    await context.close();
  });

  it('refuses to operate until a rate has been stored', async () => {
    const session = await registerUser(context);

    const { body } = await context.http
      .post('/v1/transactions')
      .set(...bearer(session))
      .send({ monedaOrigen: 'USD', monedaDestino: 'PEN', monto: 100 })
      .expect(503);

    expect(body.code).toBe('EXCHANGE_RATE_NOT_AVAILABLE');
  });
});
