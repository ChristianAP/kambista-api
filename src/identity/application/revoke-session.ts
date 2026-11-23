import { Clock } from '../../shared/application/clock';
import { OpaqueTokenGenerator } from './opaque-token-generator';
import { RefreshTokenRepository } from './refresh-token.repository';

export class RevokeSession {
  constructor(
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly opaqueTokens: OpaqueTokenGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(rawToken: string): Promise<void> {
    const stored = await this.refreshTokens.findByHash(this.opaqueTokens.fingerprint(rawToken));

    if (stored) {
      await this.refreshTokens.revokeFamily(stored.familyId, this.clock.now());
    }
  }
}
