import { RefreshToken } from '../domain/refresh-token';

export abstract class RefreshTokenRepository {
  abstract save(token: RefreshToken): Promise<void>;
  abstract findByHash(tokenHash: string): Promise<RefreshToken | null>;
  abstract revokeIfActive(id: string, revokedAt: Date): Promise<boolean>;
  abstract revokeFamily(familyId: string, revokedAt: Date): Promise<void>;
}
