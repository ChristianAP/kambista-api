import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { Logger } from '../infrastructure/logger';

const REQUEST_ID_HEADER = 'X-Request-Id';
const SAFE_REQUEST_ID = /^[\w-]{1,64}$/;
const NANOSECONDS_PER_MILLISECOND = 1_000_000n;

const resolveRequestId = (incoming: string | undefined): string =>
  incoming && SAFE_REQUEST_ID.test(incoming) ? incoming : randomUUID();

export const requestLogger =
  (logger: Logger): RequestHandler =>
  (req, res, next) => {
    const startedAt = process.hrtime.bigint();
    const requestId = resolveRequestId(req.get(REQUEST_ID_HEADER));

    res.locals.requestId = requestId;
    res.setHeader(REQUEST_ID_HEADER, requestId);

    res.on('finish', () => {
      const durationMs = Number(
        (process.hrtime.bigint() - startedAt) / NANOSECONDS_PER_MILLISECOND,
      );
      const fields = {
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
        userId: res.locals.user?.id,
        errorCode: res.locals.errorCode,
      };

      if (res.statusCode >= 500) {
        logger.error('Petición fallida', undefined, fields);
      } else if (res.statusCode >= 400) {
        logger.warn('Petición rechazada', fields);
      } else {
        logger.info('Petición atendida', fields);
      }
    });

    next();
  };
