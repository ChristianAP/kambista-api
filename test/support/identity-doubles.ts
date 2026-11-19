import { PasswordHasher } from '../../src/identity/application/password-hasher';
import { TokenService } from '../../src/identity/application/token-service';
import { UserRepository } from '../../src/identity/application/user.repository';
import { Email } from '../../src/identity/domain/email';
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
