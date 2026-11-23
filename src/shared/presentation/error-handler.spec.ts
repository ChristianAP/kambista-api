import { z } from 'zod';
import { ExchangeRateNotAvailableError } from '../../exchange-rate/domain/exchange-rate.errors';
import {
  EmailAlreadyRegisteredError,
  InvalidEmailError,
  InvalidRefreshTokenError,
  InvalidTokenError,
  RefreshTokenReusedError,
  TooManyLoginAttemptsError,
} from '../../identity/domain/identity.errors';
import { InvalidPaginationError } from '../domain/pagination.errors';
import { RouteNotFoundError, describeError } from './error-handler';

describe('describeError', () => {
  it.each([
    [new InvalidEmailError(), 422, 'INVALID_EMAIL'],
    [new EmailAlreadyRegisteredError(), 409, 'EMAIL_ALREADY_REGISTERED'],
    [new InvalidTokenError(), 401, 'INVALID_TOKEN'],
    [new InvalidRefreshTokenError(), 401, 'INVALID_REFRESH_TOKEN'],
    [new RefreshTokenReusedError(), 401, 'REFRESH_TOKEN_REUSED'],
    [new TooManyLoginAttemptsError(), 429, 'TOO_MANY_LOGIN_ATTEMPTS'],
    [new InvalidPaginationError('Página inválida'), 422, 'INVALID_PAGINATION'],
    [new RouteNotFoundError('GET', '/nada'), 404, 'ROUTE_NOT_FOUND'],
    [new ExchangeRateNotAvailableError(), 503, 'EXCHANGE_RATE_NOT_AVAILABLE'],
  ])('maps the domain error %p to its HTTP status', (error, statusCode, code) => {
    expect(describeError(error)).toMatchObject({ statusCode, code, message: error.message });
  });

  it('lists every invalid field of a validation error', () => {
    const schema = z.object({
      nombre: z.string('nombre es obligatorio'),
      datos: z.object({ edad: z.number('edad debe ser un número') }),
    });
    const { error } = schema.safeParse({ datos: { edad: 'x' } });

    expect(describeError(error)).toEqual({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'La solicitud contiene datos inválidos',
      details: [
        { field: 'nombre', message: 'nombre es obligatorio' },
        { field: 'datos.edad', message: 'edad debe ser un número' },
      ],
    });
  });

  it('recognizes a malformed JSON body', () => {
    const error = Object.assign(new SyntaxError('Unexpected token'), {
      status: 400,
      type: 'entity.parse.failed',
    });

    expect(describeError(error)).toMatchObject({ statusCode: 400, code: 'INVALID_JSON' });
  });

  it('keeps the status of other client errors raised by Express', () => {
    const error = Object.assign(new Error('Solicitud mal formada'), { status: 400 });

    expect(describeError(error)).toEqual({
      statusCode: 400,
      code: 'BAD_REQUEST',
      message: 'Solicitud mal formada',
    });
  });

  it('hides the details of unexpected failures', () => {
    expect(describeError(new Error('conexión rota con la base'))).toEqual({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Ocurrió un error inesperado',
    });
  });
});
