import { Router } from 'express';
import { LoginUser } from '../application/login-user';
import { RefreshSession } from '../application/refresh-session';
import { RegisterUser } from '../application/register-user';
import { RevokeSession } from '../application/revoke-session';
import { toLoginResponse, toUserResponse } from './auth.presenters';
import { loginBody, refreshBody, registerBody } from './auth.schemas';
import { createLoginRateLimiter, LoginRateLimitOptions } from './login-rate-limiter';

export interface AuthRouterDependencies {
  registerUser: RegisterUser;
  loginUser: LoginUser;
  refreshSession: RefreshSession;
  revokeSession: RevokeSession;
}

export const createAuthRouter = (
  { registerUser, loginUser, refreshSession, revokeSession }: AuthRouterDependencies,
  loginRateLimit: LoginRateLimitOptions,
): Router => {
  const router = Router();

  router.post('/register', async (req, res) => {
    const { nombre, email, password } = registerBody.parse(req.body);
    const user = await registerUser.execute({ name: nombre, email, password });
    res.status(201).json(toUserResponse(user));
  });

  router.post('/login', createLoginRateLimiter(loginRateLimit), async (req, res) => {
    const credentials = loginBody.parse(req.body);
    const { user, ...session } = await loginUser.execute(credentials);
    res.json(toLoginResponse(session, user));
  });

  router.post('/refresh', async (req, res) => {
    const { refresh_token } = refreshBody.parse(req.body);
    const { user, ...session } = await refreshSession.execute(refresh_token);
    res.json(toLoginResponse(session, user));
  });

  router.post('/logout', async (req, res) => {
    const { refresh_token } = refreshBody.parse(req.body);
    await revokeSession.execute(refresh_token);
    res.status(204).end();
  });

  return router;
};
