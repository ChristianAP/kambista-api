import { Clock } from '../../shared/application/clock';
import { IdGenerator } from '../../shared/application/id-generator';
import { AuthenticatedUser } from '../../shared/domain/authenticated-user';
import { RefreshToken } from '../domain/refresh-token';
import { OpaqueTokenGenerator } from './opaque-token-generator';
import { RefreshTokenRepository } from './refresh-token.repository';
import { TokenService } from './token-service';

export interface IssuedSession {
  readonly accessToken: string;
  readonly refreshToken: string;
}

export class IssueSession {
  constructor(
    private readonly tokens: TokenService,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly opaqueTokens: OpaqueTokenGenerator,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
    private readonly refreshTtlSeconds: number,
  ) {}

  async execute(
    user: AuthenticatedUser,
    familyId: string = this.ids.next(),
  ): Promise<IssuedSession> {
    const now = this.clock.now();
    const refreshToken = this.opaqueTokens.generate();

    await this.refreshTokens.save(
      RefreshToken.issue({
        id: this.ids.next(),
        userId: user.id,
        familyId,
        tokenHash: this.opaqueTokens.fingerprint(refreshToken),
        createdAt: now,
        expiresAt: new Date(now.getTime() + this.refreshTtlSeconds * 1000),
      }),
    );

    return { accessToken: await this.tokens.issue(user), refreshToken };
  }
}
