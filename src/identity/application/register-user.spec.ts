import { FIXED_NOW, FixedClock, SequentialIdGenerator } from '../../../test/support/common-doubles';
import { FakePasswordHasher, InMemoryUserRepository } from '../../../test/support/identity-doubles';
import { Role } from '../../shared/domain/role';
import { EmailAlreadyRegisteredError, InvalidEmailError } from '../domain/identity.errors';
import { RegisterUser } from './register-user';

const command = { name: 'Juan Pérez', email: 'Juan@Example.com', password: 'contraseña123' };

const setup = () => {
  const users = new InMemoryUserRepository();
  const registerUser = new RegisterUser(
    users,
    new FakePasswordHasher(),
    new SequentialIdGenerator(),
    new FixedClock(),
  );
  return { users, registerUser };
};

describe('RegisterUser', () => {
  it('registers the user with the default user role', async () => {
    const { users, registerUser } = setup();

    const user = await registerUser.execute(command);

    expect(user).toMatchObject({
      id: 'id-1',
      name: 'Juan Pérez',
      role: Role.User,
      createdAt: FIXED_NOW,
    });
    expect(user.email.value).toBe('juan@example.com');
    expect(users.items).toHaveLength(1);
  });

  it('stores a hash instead of the plain password', async () => {
    const { registerUser } = setup();

    const user = await registerUser.execute(command);

    expect(user.passwordHash).not.toBe(command.password);
    expect(user.passwordHash).toBe('hashed:contraseña123');
  });

  it('rejects an email that is already registered regardless of casing', async () => {
    const { registerUser } = setup();
    await registerUser.execute(command);

    await expect(registerUser.execute({ ...command, email: 'JUAN@example.com' })).rejects.toThrow(
      EmailAlreadyRegisteredError,
    );
  });

  it('rejects a malformed email', async () => {
    const { registerUser } = setup();

    await expect(registerUser.execute({ ...command, email: 'no-es-un-correo' })).rejects.toThrow(
      InvalidEmailError,
    );
  });
});
