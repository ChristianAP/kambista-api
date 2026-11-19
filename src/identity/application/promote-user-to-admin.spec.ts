import { buildUser } from '../../../test/support/builders';
import { InMemoryUserRepository } from '../../../test/support/identity-doubles';
import { Role } from '../../shared/domain/role';
import { UserNotFoundError } from '../domain/identity.errors';
import { PromoteUserToAdmin } from './promote-user-to-admin';

describe('PromoteUserToAdmin', () => {
  it('persists the user with the admin role', async () => {
    const users = new InMemoryUserRepository();
    await users.save(buildUser());

    const promoted = await new PromoteUserToAdmin(users).execute('juan@example.com');

    expect(promoted.role).toBe(Role.Admin);
    expect(users.items[0].role).toBe(Role.Admin);
  });

  it('fails when the user does not exist', async () => {
    const promoteUserToAdmin = new PromoteUserToAdmin(new InMemoryUserRepository());

    await expect(promoteUserToAdmin.execute('nadie@example.com')).rejects.toThrow(
      UserNotFoundError,
    );
  });
});
