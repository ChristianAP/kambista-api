import { IssuedSession } from '../application/issue-session';
import { User } from '../domain/user';
import { LoginResponse, UserResponse } from './auth.schemas';

export const toUserResponse = (user: User): UserResponse => ({
  id: user.id,
  nombre: user.name,
  email: user.email.value,
  rol: user.role,
});

export const toLoginResponse = (
  { accessToken, refreshToken }: IssuedSession,
  user: User,
): LoginResponse => ({
  access_token: accessToken,
  refresh_token: refreshToken,
  usuario: toUserResponse(user),
});
