import { OpaqueTokenGenerator } from '../../src/identity/application/opaque-token-generator';
import { PasswordHasher } from '../../src/identity/application/password-hasher';
import { RefreshTokenRepository } from '../../src/identity/application/refresh-token.repository';
import { TokenService } from '../../src/identity/application/token-service';
import { UserRepository } from '../../src/identity/application/user.repository';
import { Email } from '../../src/identity/domain/email';
import { RefreshToken } from '../../src/identity/domain/refresh-token';
import { User } from '../../src/identity/domain/user';
import { AuthenticatedUser } from '../../src/shared/domain/authenticated-user';
import { Role } from '../../src/shared/domain/role';

export class InMemoryUserRepository implements UserRepository {
  readonly items: User[] = [];

  async save(user: User): Promise<void> {
    const index = this.items.findIndex((item) => item.id === user.id);
    if (index >= 0) {
      this.items[index] = user;
    } else {
      this.items.push(user);
    }
  }

  async findByEmail(email: Email): Promise<User | null> {
    return this.items.find((item) => item.email.value === email.value) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }
}

export class InMemoryRefreshTokenRepository implements RefreshTokenRepository {
  readonly items: RefreshToken[] = [];

  async save(token: RefreshToken): Promise<void> {
    this.items.push(token);
  }

  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.items.find((item) => item.tokenHash === tokenHash) ?? null;
  }

  async revokeIfActive(id: string, revokedAt: Date): Promise<boolean> {
    const index = this.items.findIndex((item) => item.id === id && !item.isRevoked());

    if (index < 0) {
      return false;
    }

    this.items[index] = RefreshToken.restore({ ...this.items[index], revokedAt });
    return true;
  }

  async revokeFamily(familyId: string, revokedAt: Date): Promise<void> {
    this.items.forEach((item, index) => {
      if (item.familyId === familyId && !item.isRevoked()) {
        this.items[index] = RefreshToken.restore({ ...item, revokedAt });
      }
    });
  }
}

export class FakePasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }

  async verify(plain: string, hashed: string): Promise<boolean> {
    return hashed === `hashed:${plain}`;
  }
}

export class FakeTokenService implements TokenService {
  async issue(user: AuthenticatedUser): Promise<string> {
    return `token:${user.id}:${user.role}`;
  }

  async verify(token: string): Promise<AuthenticatedUser> {
    const [, id, role] = token.split(':');
    return { id, role: role as Role };
  }
}

export class FakeOpaqueTokenGenerator implements OpaqueTokenGenerator {
  private counter = 0;

  generate(): string {
    this.counter += 1;
    return `refresh-${this.counter}`;
  }

  fingerprint(token: string): string {
    return `fingerprint:${token}`;
  }
}
