import { buildUser } from '../../../test/support/builders';
import { FakePasswordHasher, InMemoryUserRepository } from '../../../test/support/identity-doubles';
import { buildSessionTools, REFRESH_TTL_SECONDS } from '../../../test/support/session-doubles';
import { Role } from '../../shared/domain/role';
import { InvalidRefreshTokenError, RefreshTokenReusedError } from '../domain/identity.errors';
import { LoginUser } from './login-user';
import { RefreshSession } from './refresh-session';

const credentials = { email: 'juan@example.com', password: 'contraseña123' };

const setup = async () => {
  const users = new InMemoryUserRepository();
  await users.save(buildUser());
  const tools = buildSessionTools();
  const loginUser = new LoginUser(users, new FakePasswordHasher(), tools.issueSession);
  const refreshSession = new RefreshSession(
    tools.refreshTokens,
    users,
    tools.issueSession,
    tools.opaqueTokens,
    tools.clock,
  );
  return { ...tools, users, loginUser, refreshSession };
};

describe('RefreshSession', () => {
  it('rotates the refresh token and issues a new access token', async () => {
    const { loginUser, refreshSession } = await setup();
    const { refreshToken } = await loginUser.execute(credentials);

    const renewed = await refreshSession.execute(refreshToken);

    expect(renewed.accessToken).toBe('token:user-1:user');
    expect(renewed.refreshToken).not.toBe(refreshToken);
    expect(renewed.user.id).toBe('user-1');
  });

  it('keeps the rotated tokens in the same family', async () => {
    const { loginUser, refreshSession, refreshTokens } = await setup();
    const { refreshToken } = await loginUser.execute(credentials);

    await refreshSession.execute(refreshToken);

    const [original, rotated] = refreshTokens.items;
    expect(rotated.familyId).toBe(original.familyId);
    expect(original.isRevoked()).toBe(true);
    expect(rotated.isRevoked()).toBe(false);
  });

  it('reflects the role the user has at the moment of the refresh', async () => {
    const { loginUser, refreshSession, users } = await setup();
    const { refreshToken } = await loginUser.execute(credentials);
    await users.save(buildUser({ role: Role.Admin }));

    const renewed = await refreshSession.execute(refreshToken);

    expect(renewed.accessToken).toBe('token:user-1:admin');
  });

  it('rejects a token that was never issued', async () => {
    const { refreshSession } = await setup();

    await expect(refreshSession.execute('inventado')).rejects.toThrow(InvalidRefreshTokenError);
  });

  it('rejects an expired token', async () => {
    const { loginUser, refreshSession, clock } = await setup();
    const { refreshToken } = await loginUser.execute(credentials);

    clock.advanceSeconds(REFRESH_TTL_SECONDS);

    await expect(refreshSession.execute(refreshToken)).rejects.toThrow(InvalidRefreshTokenError);
  });

  it('rejects a token whose user no longer exists', async () => {
    const { loginUser, refreshSession, users } = await setup();
    const { refreshToken } = await loginUser.execute(credentials);
    users.items.length = 0;

    await expect(refreshSession.execute(refreshToken)).rejects.toThrow(InvalidRefreshTokenError);
  });

  it('detects the reuse of a rotated token and revokes the whole family', async () => {
    const { loginUser, refreshSession, refreshTokens } = await setup();
    const { refreshToken } = await loginUser.execute(credentials);
    const { refreshToken: rotated } = await refreshSession.execute(refreshToken);

    await expect(refreshSession.execute(refreshToken)).rejects.toThrow(RefreshTokenReusedError);

    expect(refreshTokens.items.every((item) => item.isRevoked())).toBe(true);
    await expect(refreshSession.execute(rotated)).rejects.toThrow(RefreshTokenReusedError);
  });

  it('does not touch the sessions of other logins', async () => {
    const { loginUser, refreshSession, refreshTokens } = await setup();
    const first = await loginUser.execute(credentials);
    const second = await loginUser.execute(credentials);
    await refreshSession.execute(first.refreshToken);

    await expect(refreshSession.execute(first.refreshToken)).rejects.toThrow(
      RefreshTokenReusedError,
    );

    const secondStored = refreshTokens.items.find(
      (item) => item.tokenHash === `fingerprint:${second.refreshToken}`,
    );
    expect(secondStored?.isRevoked()).toBe(false);
  });
});
