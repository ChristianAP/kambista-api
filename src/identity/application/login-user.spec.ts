import { buildUser } from '../../../test/support/builders';
import {
  FakePasswordHasher,
  FakeTokenService,
  InMemoryUserRepository,
} from '../../../test/support/identity-doubles';
import { Role } from '../../shared/domain/role';
import { InvalidCredentialsError } from '../domain/identity.errors';
import { LoginUser } from './login-user';

const setup = async (role = Role.User) => {
  const users = new InMemoryUserRepository();
  await users.save(buildUser({ role }));
  const loginUser = new LoginUser(users, new FakePasswordHasher(), new FakeTokenService());
  return { loginUser };
};

describe('LoginUser', () => {
  it('returns an access token and the user when credentials are valid', async () => {
    const { loginUser } = await setup();

    const result = await loginUser.execute({
      email: 'JUAN@example.com',
      password: 'contraseña123',
    });

    expect(result.accessToken).toBe('token:user-1:user');
    expect(result.user.email.value).toBe('juan@example.com');
  });

  it('issues a token that carries the admin role', async () => {
    const { loginUser } = await setup(Role.Admin);

    const result = await loginUser.execute({
      email: 'juan@example.com',
      password: 'contraseña123',
    });

    expect(result.accessToken).toBe('token:user-1:admin');
  });

  it('rejects a wrong password', async () => {
    const { loginUser } = await setup();

    await expect(
      loginUser.execute({ email: 'juan@example.com', password: 'incorrecta' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('answers an unknown email exactly like a wrong password', async () => {
    const { loginUser } = await setup();

    await expect(
      loginUser.execute({ email: 'otro@example.com', password: 'contraseña123' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });
});
