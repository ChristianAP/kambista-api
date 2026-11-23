import type { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import { TooManyLoginAttemptsError } from '../domain/identity.errors';

export interface LoginRateLimitOptions {
  readonly maxFailedAttempts: number;
  readonly windowSeconds: number;
}

export const createLoginRateLimiter = ({
  maxFailedAttempts,
  windowSeconds,
}: LoginRateLimitOptions): RequestHandler =>
  rateLimit({
    windowMs: windowSeconds * 1000,
    limit: maxFailedAttempts,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, _res, next) => next(new TooManyLoginAttemptsError()),
  });
