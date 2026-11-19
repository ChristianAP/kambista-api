import { User } from '../domain/user';
import { LoginResponse, UserResponse } from './auth.schemas';

export const toUserResponse = (user: User): UserResponse => ({
  id: user.id,
  nombre: user.name,
  email: user.email.value,
  rol: user.role,
});

export const toLoginResponse = (accessToken: string, user: User): LoginResponse => ({
  access_token: accessToken,
  usuario: toUserResponse(user),
});
