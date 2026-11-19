import { AuthenticatedUser } from '../../shared/domain/authenticated-user';

export abstract class TokenService {
  abstract issue(user: AuthenticatedUser): Promise<string>;
  abstract verify(token: string): Promise<AuthenticatedUser>;
}
