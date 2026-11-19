import type { Request, RequestHandler, Response } from 'express';
import { AuthenticatedUser } from '../../shared/domain/authenticated-user';
import { TokenService } from '../application/token-service';
import { MissingTokenError } from '../domain/identity.errors';

const BEARER_SCHEME = 'Bearer';

const extractToken = (req: Request): string => {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? [];

  if (scheme !== BEARER_SCHEME || !token) {
    throw new MissingTokenError();
  }

  return token;
};

export const authenticate =
  (tokens: TokenService): RequestHandler =>
  async (req, res, next) => {
    res.locals.user = await tokens.verify(extractToken(req));
    next();
  };

export const currentUser = (res: Response): AuthenticatedUser => res.locals.user;
