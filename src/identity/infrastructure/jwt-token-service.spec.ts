import jwt from 'jsonwebtoken';
import { Role } from '../../shared/domain/role';
import { InvalidTokenError } from '../domain/identity.errors';
import { JwtTokenService } from './jwt-token-service';

const SECRET = 'a-secret-with-at-least-thirty-two-characters';

const toBase64Url = (value: object): string =>
  Buffer.from(JSON.stringify(value)).toString('base64url');

const service = new JwtTokenService(SECRET, 3600);

describe('JwtTokenService', () => {
  it('issues a token that identifies the user and the role', async () => {
    const token = await service.issue({ id: 'user-1', role: Role.Admin });

    await expect(service.verify(token)).resolves.toEqual({ id: 'user-1', role: Role.Admin });
  });

  it('sets an expiration according to the configured lifetime', async () => {
    const token = await service.issue({ id: 'user-1', role: Role.User });

    const { iat, exp } = jwt.decode(token) as { iat: number; exp: number };

    expect(exp - iat).toBe(3600);
  });

  it('rejects a token signed with another secret', async () => {
    const forged = jwt.sign({ role: Role.Admin }, 'another-secret-with-more-than-32-chars', {
      subject: 'user-1',
    });

    await expect(service.verify(forged)).rejects.toThrow(InvalidTokenError);
  });

  it('rejects an expired token', async () => {
    const expired = jwt.sign({ role: Role.User }, SECRET, { subject: 'user-1', expiresIn: -10 });

    await expect(service.verify(expired)).rejects.toThrow(InvalidTokenError);
  });

  it('rejects an unsigned token', async () => {
    const unsigned = `${toBase64Url({ alg: 'none', typ: 'JWT' })}.${toBase64Url({ sub: 'user-1', role: 'admin' })}.`;

    await expect(service.verify(unsigned)).rejects.toThrow(InvalidTokenError);
  });

  it('rejects a valid signature with an unknown role or without subject', async () => {
    const unknownRole = jwt.sign({ role: 'root' }, SECRET, { subject: 'user-1' });
    const noSubject = jwt.sign({ role: Role.User }, SECRET);

    await expect(service.verify(unknownRole)).rejects.toThrow(InvalidTokenError);
    await expect(service.verify(noSubject)).rejects.toThrow(InvalidTokenError);
  });

  it.each(['', 'abc', 'a.b.c'])('rejects the malformed token "%s"', async (token) => {
    await expect(service.verify(token)).rejects.toThrow(InvalidTokenError);
  });
});
