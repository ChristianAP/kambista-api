import { BcryptPasswordHasher } from './bcrypt-password-hasher';

describe('BcryptPasswordHasher', () => {
  const hasher = new BcryptPasswordHasher();

  it('never returns the plain password', async () => {
    const hashed = await hasher.hash('contraseña123');

    expect(hashed).not.toContain('contraseña123');
    expect(hashed).toMatch(/^\$2[aby]\$10\$/);
  });

  it('salts every hash differently', async () => {
    const [first, second] = await Promise.all([
      hasher.hash('contraseña123'),
      hasher.hash('contraseña123'),
    ]);

    expect(first).not.toBe(second);
  });

  it('verifies only the original password', async () => {
    const hashed = await hasher.hash('contraseña123');

    await expect(hasher.verify('contraseña123', hashed)).resolves.toBe(true);
    await expect(hasher.verify('otra-contraseña', hashed)).resolves.toBe(false);
  });
});
