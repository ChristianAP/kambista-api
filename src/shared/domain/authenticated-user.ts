import { Role } from './role';

export interface AuthenticatedUser {
  readonly id: string;
  readonly role: Role;
}
