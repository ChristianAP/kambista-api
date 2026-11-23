import { openApiDocument } from './openapi';

type Operation = { parameters?: { name: string }[]; responses: Record<string, unknown> };

const operation = (path: string, method: string): Operation => {
  const paths = openApiDocument.paths as unknown as Record<string, Record<string, Operation>>;
  return paths[path][method];
};

describe('openApiDocument', () => {
  it('documents every public route of the API', () => {
    expect(Object.keys(openApiDocument.paths).sort()).toEqual([
      '/health',
      '/v1/auth/login',
      '/v1/auth/logout',
      '/v1/auth/refresh',
      '/v1/auth/register',
      '/v1/transactions',
      '/v1/transactions/history',
    ]);
  });

  it('documents the pagination parameters and headers of the history', () => {
    const history = operation('/v1/transactions/history', 'get');

    expect(history.parameters?.map(({ name }) => name)).toEqual(
      expect.arrayContaining(['startDate', 'endDate', 'userId', 'page', 'limit']),
    );
    expect(history.responses[200]).toMatchObject({
      headers: expect.objectContaining({ 'X-Total-Count': expect.anything() }),
    });
  });

  it('documents the rate limit of the login', () => {
    expect(Object.keys(operation('/v1/auth/login', 'post').responses)).toContain('429');
  });

  it('describes the refresh token in the login response', () => {
    const login = JSON.stringify(operation('/v1/auth/login', 'post').responses[200]);

    expect(login).toContain('refresh_token');
  });
});
