import { Model } from 'mongoose';
import { isDuplicateKeyError } from '../../shared/infrastructure/mongo-errors';
import { UserRepository } from '../application/user.repository';
import { Email } from '../domain/email';
import { EmailAlreadyRegisteredError } from '../domain/identity.errors';
import { User } from '../domain/user';
import { UserRecord } from './user.model';

const toRecord = (user: User): UserRecord => ({
  _id: user.id,
  name: user.name,
  email: user.email.value,
  passwordHash: user.passwordHash,
  role: user.role,
  createdAt: user.createdAt,
});

const toEntity = (record: UserRecord): User =>
  User.restore({
    id: record._id,
    name: record.name,
    email: Email.of(record.email),
    passwordHash: record.passwordHash,
    role: record.role,
    createdAt: record.createdAt,
  });

export class MongoUserRepository implements UserRepository {
  constructor(private readonly model: Model<UserRecord>) {}

  async save(user: User): Promise<void> {
    try {
      await this.model.replaceOne({ _id: user.id }, toRecord(user), { upsert: true });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new EmailAlreadyRegisteredError();
      }
      throw error;
    }
  }

  async findByEmail(email: Email): Promise<User | null> {
    const record = await this.model.findOne({ email: email.value }).lean<UserRecord>();
    return record ? toEntity(record) : null;
  }
}
