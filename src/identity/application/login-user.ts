import { Email } from '../domain/email';
import { InvalidCredentialsError } from '../domain/identity.errors';
import { User } from '../domain/user';
import { IssuedSession, IssueSession } from './issue-session';
import { PasswordHasher } from './password-hasher';
import { UserRepository } from './user.repository';

export interface LoginUserCommand {
  readonly email: string;
  readonly password: string;
}

export interface LoginResult extends IssuedSession {
  readonly user: User;
}

export class LoginUser {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly sessions: IssueSession,
  ) {}

  async execute(command: LoginUserCommand): Promise<LoginResult> {
    const user = await this.users.findByEmail(Email.of(command.email));
    const passwordMatches =
      user !== null && (await this.passwordHasher.verify(command.password, user.passwordHash));

    if (!user || !passwordMatches) {
      throw new InvalidCredentialsError();
    }

    const session = await this.sessions.execute({ id: user.id, role: user.role });
    return { ...session, user };
  }
}
