import { Router } from 'express';
import { LoginUser } from '../application/login-user';
import { RegisterUser } from '../application/register-user';
import { toLoginResponse, toUserResponse } from './auth.presenters';
import { loginBody, registerBody } from './auth.schemas';

export interface AuthRouterDependencies {
  registerUser: RegisterUser;
  loginUser: LoginUser;
}

export const createAuthRouter = ({ registerUser, loginUser }: AuthRouterDependencies): Router => {
  const router = Router();

  router.post('/register', async (req, res) => {
    const { nombre, email, password } = registerBody.parse(req.body);
    const user = await registerUser.execute({ name: nombre, email, password });
    res.status(201).json(toUserResponse(user));
  });

  router.post('/login', async (req, res) => {
    const credentials = loginBody.parse(req.body);
    const { accessToken, user } = await loginUser.execute(credentials);
    res.json(toLoginResponse(accessToken, user));
  });

  return router;
};
