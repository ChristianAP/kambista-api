import { createTestApp, TestContext } from './support/create-test-app';
import {
  bearer,
  registerAdmin,
  registerUser,
  Session,
  todayInLima,
} from './support/session-helpers';

const usdToPen = { monedaOrigen: 'USD', monedaDestino: 'PEN', monto: 100 };

describe('Transactions (e2e)', () => {
  let context: TestContext;
  let session: Session;

  const createTransaction = (payload: object, as: Session = session) =>
    context.http
      .post('/v1/transactions')
      .set(...bearer(as))
      .send(payload);

  const history = (query: string, as: Session = session) =>
    context.http.get(`/v1/transactions/history?${query}`).set(...bearer(as));

  const today = () => `startDate=${todayInLima()}&endDate=${todayInLima()}`;

  beforeAll(async () => {
    context = await createTestApp();
    await context.container.refreshExchangeRate.execute();
  });

  beforeEach(async () => {
    session = await registerUser(context);
  });

  afterAll(async () => {
    await context.close();
  });

  describe('POST /v1/transactions', () => {
    it('converts USD to PEN with the sell rate', async () => {
      const { body } = await createTransaction(usdToPen).expect(201);

      expect(body).toEqual({
        id: expect.any(String),
        monedaOrigen: 'USD',
        monedaDestino: 'PEN',
        monto: 100,
        montoCambiado: 373.9,
        tipoCambio: 3.739,
        fecha: expect.any(String),
      });
      expect(new Date(body.fecha).toISOString()).toBe(body.fecha);
    });

    it('converts PEN to USD with the buy rate', async () => {
      const { body } = await createTransaction({
        monedaOrigen: 'PEN',
        monedaDestino: 'USD',
        monto: 100,
      }).expect(201);

      expect(body.montoCambiado).toBe(26.79);
      expect(body.tipoCambio).toBe(3.733);
    });

    it.each([
      ['identical currencies', { ...usdToPen, monedaDestino: 'USD' }, 'SAME_CURRENCY'],
      ['a zero amount', { ...usdToPen, monto: 0 }, 'INVALID_AMOUNT'],
      ['a negative amount', { ...usdToPen, monto: -10 }, 'INVALID_AMOUNT'],
      ['three decimals', { ...usdToPen, monto: 10.123 }, 'INVALID_AMOUNT'],
      [
        'more than seven integer digits',
        { ...usdToPen, monto: 10_000_000 },
        'AMOUNT_EXCEEDS_LIMIT',
      ],
    ])('rejects %s with 422', async (_description, payload, code) => {
      const { body } = await createTransaction(payload).expect(422);

      expect(body.code).toBe(code);
    });

    it('accepts the maximum allowed amount', async () => {
      await createTransaction({ ...usdToPen, monto: 9_999_999.99 }).expect(201);
    });

    it.each([
      ['an unsupported currency', { ...usdToPen, monedaOrigen: 'EUR' }],
      ['a text amount', { ...usdToPen, monto: '100' }],
      ['a missing amount', { monedaOrigen: 'USD', monedaDestino: 'PEN' }],
    ])('rejects %s with 400', async (_description, payload) => {
      const { body } = await createTransaction(payload).expect(400);

      expect(body.code).toBe('VALIDATION_ERROR');
    });

    it('requires authentication', async () => {
      await context.http.post('/v1/transactions').send(usdToPen).expect(401);
    });
  });

  describe('GET /v1/transactions/history', () => {
    it('returns the operations of the session user within the range', async () => {
      const { body: created } = await createTransaction(usdToPen).expect(201);

      const { body } = await history(today()).expect(200);

      expect(body).toEqual([created]);
    });

    it('excludes operations outside the range', async () => {
      await createTransaction(usdToPen).expect(201);

      const { body } = await history('startDate=2020-01-01&endDate=2020-01-31').expect(200);

      expect(body).toEqual([]);
    });

    it('lists the newest operation first', async () => {
      const { body: first } = await createTransaction(usdToPen).expect(201);
      const { body: second } = await createTransaction({ ...usdToPen, monto: 50 }).expect(201);

      const { body } = await history(today()).expect(200);

      expect(body.map((item: { id: string }) => item.id)).toEqual([second.id, first.id]);
    });

    it('requires both dates', async () => {
      const { body } = await history('startDate=2026-11-01').expect(400);

      expect(body.details).toEqual([expect.objectContaining({ field: 'endDate' })]);
    });

    it('rejects a start date after the end date', async () => {
      const { body } = await history('startDate=2026-11-10&endDate=2026-11-01').expect(422);

      expect(body.code).toBe('INVALID_DATE_RANGE');
    });

    it('never shows other users operations to a regular user', async () => {
      const other = await registerUser(context);
      await createTransaction(usdToPen, other).expect(201);

      const { body } = await history(`${today()}&userId=${other.userId}`).expect(200);

      expect(body).toEqual([]);
    });

    it('lets an admin query any user', async () => {
      const admin = await registerAdmin(context);
      const { body: created } = await createTransaction(usdToPen).expect(201);

      const { body } = await history(`${today()}&userId=${session.userId}`, admin).expect(200);

      expect(body).toEqual([created]);
    });

    it('shows an admin their own operations when no userId is given', async () => {
      const admin = await registerAdmin(context);
      await createTransaction(usdToPen).expect(201);

      const { body } = await history(today(), admin).expect(200);

      expect(body).toEqual([]);
    });
  });
});
