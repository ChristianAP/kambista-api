import { Email } from '../domain/email';
import { UserNotFoundError } from '../domain/identity.errors';
import { User } from '../domain/user';
import { UserRepository } from './user.repository';

export class PromoteUserToAdmin {
  constructor(private readonly users: UserRepository) {}

  async execute(rawEmail: string): Promise<User> {
    const user = await this.users.findByEmail(Email.of(rawEmail));

    if (!user) {
      throw new UserNotFoundError();
    }

    const admin = user.promoteToAdmin();
    await this.users.save(admin);
    return admin;
  }
}
