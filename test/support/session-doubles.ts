import { IssueSession } from '../../src/identity/application/issue-session';
import { AdjustableClock, SequentialIdGenerator } from './common-doubles';
import {
  FakeOpaqueTokenGenerator,
  FakeTokenService,
  InMemoryRefreshTokenRepository,
} from './identity-doubles';

export const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

export const buildSessionTools = () => {
  const clock = new AdjustableClock();
  const refreshTokens = new InMemoryRefreshTokenRepository();
  const opaqueTokens = new FakeOpaqueTokenGenerator();
  const issueSession = new IssueSession(
    new FakeTokenService(),
    refreshTokens,
    opaqueTokens,
    new SequentialIdGenerator(),
    clock,
    REFRESH_TTL_SECONDS,
  );

  return { refreshTokens, opaqueTokens, issueSession, clock };
};
