export interface RefreshTokenProps {
  readonly id: string;
  readonly userId: string;
  readonly familyId: string;
  readonly tokenHash: string;
  readonly createdAt: Date;
  readonly expiresAt: Date;
  readonly revokedAt: Date | null;
}

export type NewRefreshToken = Omit<RefreshTokenProps, 'revokedAt'>;

export class RefreshToken {
  private constructor(
    readonly id: string,
    readonly userId: string,
    readonly familyId: string,
    readonly tokenHash: string,
    readonly createdAt: Date,
    readonly expiresAt: Date,
    readonly revokedAt: Date | null,
  ) {}

  static issue(newToken: NewRefreshToken): RefreshToken {
    return RefreshToken.restore({ ...newToken, revokedAt: null });
  }

  static restore(props: RefreshTokenProps): RefreshToken {
    return new RefreshToken(
      props.id,
      props.userId,
      props.familyId,
      props.tokenHash,
      props.createdAt,
      props.expiresAt,
      props.revokedAt,
    );
  }

  isExpired(now: Date): boolean {
    return this.expiresAt.getTime() <= now.getTime();
  }

  isRevoked(): boolean {
    return this.revokedAt !== null;
  }
}
