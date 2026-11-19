import { STATUS_CODES } from 'node:http';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import {
  AuthenticationError,
  ConflictError,
  DomainError,
  InvalidInputError,
  NotFoundError,
  ServiceUnavailableError,
} from '../domain/domain-error';
import { Logger } from '../infrastructure/logger';
import { ApiErrorBody } from './api-error.schema';

type DomainErrorType = abstract new (...args: never[]) => DomainError;
type ErrorDescription = Omit<ApiErrorBody, 'path' | 'timestamp'>;

const STATUS_BY_ERROR_TYPE: ReadonlyArray<readonly [DomainErrorType, number]> = [
  [InvalidInputError, 422],
  [ConflictError, 409],
  [NotFoundError, 404],
  [AuthenticationError, 401],
  [ServiceUnavailableError, 503],
];

const INTERNAL_ERROR: ErrorDescription = {
  statusCode: 500,
  code: 'INTERNAL_ERROR',
  message: 'Ocurrió un error inesperado',
};

interface HttpLikeError {
  status: number;
  type?: string;
  message: string;
}

export class RouteNotFoundError extends NotFoundError {
  readonly code = 'ROUTE_NOT_FOUND';

  constructor(method: string, path: string) {
    super(`No existe la ruta ${method} ${path}`);
  }
}

const statusOf = (error: DomainError): number =>
  STATUS_BY_ERROR_TYPE.find(([type]) => error instanceof type)?.[1] ?? INTERNAL_ERROR.statusCode;

const isHttpLikeError = (error: unknown): error is HttpLikeError =>
  typeof error === 'object' &&
  error !== null &&
  'status' in error &&
  typeof error.status === 'number' &&
  error.status >= 400 &&
  error.status < 500;

const codeOf = (status: number): string =>
  (STATUS_CODES[status] ?? 'Error').toUpperCase().replace(/\W+/g, '_');

export const describeError = (error: unknown): ErrorDescription => {
  if (error instanceof DomainError) {
    return { statusCode: statusOf(error), code: error.code, message: error.message };
  }

  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'La solicitud contiene datos inválidos',
      details: error.issues.map(({ path, message }) => ({ field: path.join('.'), message })),
    };
  }

  if (isHttpLikeError(error)) {
    return error.type === 'entity.parse.failed'
      ? {
          statusCode: 400,
          code: 'INVALID_JSON',
          message: 'El cuerpo de la solicitud no es un JSON válido',
        }
      : { statusCode: error.status, code: codeOf(error.status), message: error.message };
  }

  return INTERNAL_ERROR;
};

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new RouteNotFoundError(req.method, req.originalUrl));
};

export const createErrorHandler =
  (logger: Logger): ErrorRequestHandler =>
  (error, req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }

    const description = describeError(error);

    if (description === INTERNAL_ERROR) {
      logger.error(`${req.method} ${req.originalUrl} falló`, error);
    }

    const body: ApiErrorBody = {
      ...description,
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    };
    res.status(body.statusCode).json(body);
  };
