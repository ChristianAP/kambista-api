import { createLogger } from './logger';

const parse = (spy: jest.SpyInstance): Record<string, unknown> =>
  JSON.parse(spy.mock.calls[0][0] as string);

describe('createLogger', () => {
  let log: jest.SpyInstance;
  let warn: jest.SpyInstance;
  let error: jest.SpyInstance;

  beforeEach(() => {
    log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('writes one JSON line with timestamp, level, context and message', () => {
    createLogger('Http').info('Petición atendida', { statusCode: 200 });

    expect(log).toHaveBeenCalledTimes(1);
    expect(parse(log)).toEqual({
      timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      level: 'info',
      context: 'Http',
      message: 'Petición atendida',
      statusCode: 200,
    });
  });

  it('writes warnings to the warning stream', () => {
    createLogger('Http').warn('Petición rechazada', { statusCode: 401 });

    expect(parse(warn)).toMatchObject({ level: 'warn', statusCode: 401 });
  });

  it('serializes the error with its name, message and stack', () => {
    createLogger('Http').error('Falló', new TypeError('boom'), { requestId: 'abc' });

    expect(parse(error)).toMatchObject({
      level: 'error',
      requestId: 'abc',
      error: { name: 'TypeError', message: 'boom', stack: expect.any(String) },
    });
  });

  it('serializes values that are not errors', () => {
    createLogger('Http').error('Falló', 'texto suelto');

    expect(parse(error)).toMatchObject({ error: { message: 'texto suelto' } });
  });

  it('skips the entries below the minimum level', () => {
    const logger = createLogger('Http', 'error');

    logger.info('a');
    logger.warn('b');
    logger.error('c');

    expect(log).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledTimes(1);
  });

  it('writes nothing when silenced', () => {
    const logger = createLogger('Http', 'silent');

    logger.info('a');
    logger.warn('b');
    logger.error('c');

    expect(log).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });
});
