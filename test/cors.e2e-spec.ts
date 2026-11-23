import { createTestApp, TestContext } from './support/create-test-app';

const FRONTEND_ORIGIN = 'http://localhost:5173';

describe('CORS (e2e)', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await createTestApp();
  });

  afterAll(async () => {
    await context.close();
  });

  it('lets the frontend read the pagination and tracing headers', async () => {
    const response = await context.http.get('/health').set('Origin', FRONTEND_ORIGIN).expect(200);

    expect(response.headers['access-control-allow-origin']).toBe(FRONTEND_ORIGIN);
    expect(response.headers['access-control-expose-headers']).toEqual(
      expect.stringContaining('X-Total-Count'),
    );
    expect(response.headers['access-control-expose-headers']).toEqual(
      expect.stringContaining('X-Total-Pages'),
    );
    expect(response.headers['access-control-expose-headers']).toEqual(
      expect.stringContaining('X-Request-Id'),
    );
  });

  it('does not allow other origins', async () => {
    const response = await context.http
      .get('/health')
      .set('Origin', 'https://sitio-malicioso.example')
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
