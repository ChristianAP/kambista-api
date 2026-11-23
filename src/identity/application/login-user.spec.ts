import { buildUser } from '../../../test/support/builders';
import { FakePasswordHasher, InMemoryUserRepository } from '../../../test/support/identity-doubles';
import { buildSessionTools, REFRESH_TTL_SECONDS } from '../../../test/support/session-doubles';
import { Role } from '../../shared/domain/role';
import { InvalidCredentialsError } from '../domain/identity.errors';
import { LoginUser } from './login-user';

const setup = async (role = Role.User) => {
  const users = new InMemoryUserRepository();
  await users.save(buildUser({ role }));
  const { issueSession, refreshTokens, clock } = buildSessionTools();
  const loginUser = new LoginUser(users, new FakePasswordHasher(), issueSession);
  return { loginUser, refreshTokens, clock };
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

  it('issues a refresh token and stores only its fingerprint', async () => {
    const { loginUser, refreshTokens, clock } = await setup();

    const result = await loginUser.execute({
      email: 'juan@example.com',
      password: 'contraseña123',
    });

    expect(result.refreshToken).toBe('refresh-1');
    expect(refreshTokens.items).toHaveLength(1);
    expect(refreshTokens.items[0]).toMatchObject({
      userId: 'user-1',
      tokenHash: 'fingerprint:refresh-1',
      expiresAt: new Date(clock.now().getTime() + REFRESH_TTL_SECONDS * 1000),
    });
    expect(JSON.stringify(refreshTokens.items)).not.toContain('"refresh-1"');
  });

  it('starts a new token family on every login', async () => {
    const { loginUser, refreshTokens } = await setup();
    const command = { email: 'juan@example.com', password: 'contraseña123' };

    await loginUser.execute(command);
    await loginUser.execute(command);

    const [first, second] = refreshTokens.items;
    expect(first.familyId).not.toBe(second.familyId);
  });

  it('rejects a wrong password without issuing a refresh token', async () => {
    const { loginUser, refreshTokens } = await setup();

    await expect(
      loginUser.execute({ email: 'juan@example.com', password: 'incorrecta' }),
    ).rejects.toThrow(InvalidCredentialsError);
    expect(refreshTokens.items).toHaveLength(0);
  });

  it('answers an unknown email exactly like a wrong password', async () => {
    const { loginUser } = await setup();

    await expect(
      loginUser.execute({ email: 'otro@example.com', password: 'contraseña123' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });
});
