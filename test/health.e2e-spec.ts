import { createTestApp, TestContext } from './support/create-test-app';

describe('Health (e2e)', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await createTestApp();
  });

  afterAll(async () => {
    await context.close();
  });

  it('reports the service and database state without authentication', async () => {
    const { body } = await context.http.get('/health').expect(200);

    expect(body).toEqual({ status: 'ok', database: 'up' });
  });
});
