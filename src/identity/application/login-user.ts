import { Email } from '../domain/email';
import { InvalidCredentialsError } from '../domain/identity.errors';
import { User } from '../domain/user';
import { PasswordHasher } from './password-hasher';
import { TokenService } from './token-service';
import { UserRepository } from './user.repository';

export interface LoginUserCommand {
  readonly email: string;
  readonly password: string;
}

export interface LoginResult {
  readonly accessToken: string;
  readonly user: User;
}

export class LoginUser {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  async execute(command: LoginUserCommand): Promise<LoginResult> {
    const user = await this.users.findByEmail(Email.of(command.email));
    const passwordMatches =
      user !== null && (await this.passwordHasher.verify(command.password, user.passwordHash));

    if (!user || !passwordMatches) {
      throw new InvalidCredentialsError();
    }

    const accessToken = await this.tokens.issue({ id: user.id, role: user.role });
    return { accessToken, user };
  }
}
