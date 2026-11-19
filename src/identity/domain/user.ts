import { Role } from '../../shared/domain/role';
import { Email } from './email';

export interface UserProps {
  readonly id: string;
  readonly name: string;
  readonly email: Email;
  readonly passwordHash: string;
  readonly role: Role;
  readonly createdAt: Date;
}

export type NewUser = Omit<UserProps, 'role'>;

export class User {
  private constructor(
    readonly id: string,
    readonly name: string,
    readonly email: Email,
    readonly passwordHash: string,
    readonly role: Role,
    readonly createdAt: Date,
  ) {}

  static register(newUser: NewUser): User {
    return User.restore({ ...newUser, role: Role.User });
  }

  static restore(props: UserProps): User {
    return new User(
      props.id,
      props.name,
      props.email,
      props.passwordHash,
      props.role,
      props.createdAt,
    );
  }

  promoteToAdmin(): User {
    return User.restore({ ...this, role: Role.Admin });
  }
}
