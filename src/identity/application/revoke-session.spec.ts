import { buildUser } from '../../../test/support/builders';
import { FakePasswordHasher, InMemoryUserRepository } from '../../../test/support/identity-doubles';
import { buildSessionTools } from '../../../test/support/session-doubles';
import { InvalidRefreshTokenError } from '../domain/identity.errors';
import { LoginUser } from './login-user';
import { RefreshSession } from './refresh-session';
import { RevokeSession } from './revoke-session';

const setup = async () => {
  const users = new InMemoryUserRepository();
  await users.save(buildUser());
  const tools = buildSessionTools();
  return {
    ...tools,
    loginUser: new LoginUser(users, new FakePasswordHasher(), tools.issueSession),
    revokeSession: new RevokeSession(tools.refreshTokens, tools.opaqueTokens, tools.clock),
    refreshSession: new RefreshSession(
      tools.refreshTokens,
      users,
      tools.issueSession,
      tools.opaqueTokens,
      tools.clock,
    ),
  };
};

describe('RevokeSession', () => {
  it('revokes every token of the session', async () => {
    const { loginUser, revokeSession, refreshSession, refreshTokens } = await setup();
    const { refreshToken } = await loginUser.execute({
      email: 'juan@example.com',
      password: 'contraseña123',
    });
    const { refreshToken: rotated } = await refreshSession.execute(refreshToken);

    await revokeSession.execute(rotated);

    expect(refreshTokens.items.every((item) => item.isRevoked())).toBe(true);
  });

  it('makes the refresh token unusable afterwards', async () => {
    const { loginUser, revokeSession, refreshSession } = await setup();
    const { refreshToken } = await loginUser.execute({
      email: 'juan@example.com',
      password: 'contraseña123',
    });

    await revokeSession.execute(refreshToken);

    await expect(refreshSession.execute(refreshToken)).rejects.toThrow();
  });

  it('is idempotent for tokens it does not know', async () => {
    const { revokeSession, refreshSession } = await setup();

    await expect(revokeSession.execute('desconocido')).resolves.toBeUndefined();
    await expect(refreshSession.execute('desconocido')).rejects.toThrow(InvalidRefreshTokenError);
  });
});
