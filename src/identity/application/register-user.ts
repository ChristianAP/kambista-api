import { Clock } from '../../shared/application/clock';
import { IdGenerator } from '../../shared/application/id-generator';
import { Email } from '../domain/email';
import { EmailAlreadyRegisteredError } from '../domain/identity.errors';
import { User } from '../domain/user';
import { PasswordHasher } from './password-hasher';
import { UserRepository } from './user.repository';

export interface RegisterUserCommand {
  readonly name: string;
  readonly email: string;
  readonly password: string;
}

export class RegisterUser {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(command: RegisterUserCommand): Promise<User> {
    const email = Email.of(command.email);

    if (await this.users.findByEmail(email)) {
      throw new EmailAlreadyRegisteredError();
    }

    const user = User.register({
      id: this.ids.next(),
      name: command.name,
      email,
      passwordHash: await this.passwordHasher.hash(command.password),
      createdAt: this.clock.now(),
    });

    await this.users.save(user);
    return user;
  }
}
