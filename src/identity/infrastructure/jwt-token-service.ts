import jwt from 'jsonwebtoken';
import { AuthenticatedUser } from '../../shared/domain/authenticated-user';
import { Role } from '../../shared/domain/role';
import { TokenService } from '../application/token-service';
import { InvalidTokenError } from '../domain/identity.errors';

const ALGORITHM = 'HS256';

const isRole = (value: unknown): value is Role => Object.values(Role).includes(value as Role);

export class JwtTokenService implements TokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresInSeconds: number,
  ) {}

  async issue(user: AuthenticatedUser): Promise<string> {
    return jwt.sign({ role: user.role }, this.secret, {
      algorithm: ALGORITHM,
      subject: user.id,
      expiresIn: this.expiresInSeconds,
    });
  }

  async verify(token: string): Promise<AuthenticatedUser> {
    const user = this.decode(token);

    if (!user) {
      throw new InvalidTokenError();
    }

    return user;
  }

  private decode(token: string): AuthenticatedUser | null {
    try {
      const payload = jwt.verify(token, this.secret, { algorithms: [ALGORITHM] });
      return typeof payload !== 'string' && payload.sub && isRole(payload.role)
        ? { id: payload.sub, role: payload.role }
        : null;
    } catch {
      return null;
    }
  }
}
