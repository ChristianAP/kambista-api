import { Clock } from '../../shared/application/clock';
import { InvalidRefreshTokenError, RefreshTokenReusedError } from '../domain/identity.errors';
import { User } from '../domain/user';
import { IssuedSession, IssueSession } from './issue-session';
import { OpaqueTokenGenerator } from './opaque-token-generator';
import { RefreshTokenRepository } from './refresh-token.repository';
import { UserRepository } from './user.repository';

export interface RefreshResult extends IssuedSession {
  readonly user: User;
}

export class RefreshSession {
  constructor(
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly users: UserRepository,
    private readonly sessions: IssueSession,
    private readonly opaqueTokens: OpaqueTokenGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(rawToken: string): Promise<RefreshResult> {
    const now = this.clock.now();
    const stored = await this.refreshTokens.findByHash(this.opaqueTokens.fingerprint(rawToken));

    if (!stored || stored.isExpired(now)) {
      throw new InvalidRefreshTokenError();
    }

    const consumed = await this.refreshTokens.revokeIfActive(stored.id, now);

    if (!consumed) {
      await this.refreshTokens.revokeFamily(stored.familyId, now);
      throw new RefreshTokenReusedError();
    }

    const user = await this.users.findById(stored.userId);

    if (!user) {
      throw new InvalidRefreshTokenError();
    }

    const session = await this.sessions.execute({ id: user.id, role: user.role }, stored.familyId);
    return { ...session, user };
  }
}
