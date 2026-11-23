import { Email } from '../domain/email';
import { User } from '../domain/user';

export abstract class UserRepository {
  abstract save(user: User): Promise<void>;
  abstract findByEmail(email: Email): Promise<User | null>;
  abstract findById(id: string): Promise<User | null>;
}
