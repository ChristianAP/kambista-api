import { Email } from './email';
import { InvalidEmailError } from './identity.errors';

describe('Email', () => {
  it('normalizes the address to lowercase without surrounding spaces', () => {
    expect(Email.of('  Juan.Perez@Example.COM ').value).toBe('juan.perez@example.com');
  });

  it.each(['', 'sin-arroba', 'a@b', 'a b@example.com', '@example.com'])(
    'rejects the invalid address "%s"',
    (raw) => {
      expect(() => Email.of(raw)).toThrow(InvalidEmailError);
    },
  );
});
