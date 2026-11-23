import { RefreshToken } from './refresh-token';

const issued = () =>
  RefreshToken.issue({
    id: 'token-1',
    userId: 'user-1',
    familyId: 'family-1',
    tokenHash: 'hash-1',
    createdAt: new Date('2026-11-18T15:00:00.000Z'),
    expiresAt: new Date('2026-11-25T15:00:00.000Z'),
  });

describe('RefreshToken', () => {
  it('is issued active and not revoked', () => {
    const token = issued();

    expect(token.isRevoked()).toBe(false);
    expect(token.revokedAt).toBeNull();
  });

  it('is valid until its expiration instant', () => {
    const token = issued();

    expect(token.isExpired(new Date('2026-11-25T14:59:59.999Z'))).toBe(false);
    expect(token.isExpired(new Date('2026-11-25T15:00:00.000Z'))).toBe(true);
  });

  it('is revoked when restored with a revocation date', () => {
    const token = RefreshToken.restore({
      ...issued(),
      revokedAt: new Date('2026-11-19T10:00:00Z'),
    });

    expect(token.isRevoked()).toBe(true);
  });
});
