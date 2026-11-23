import { CryptoOpaqueTokenGenerator } from './crypto-opaque-token.generator';

describe('CryptoOpaqueTokenGenerator', () => {
  const generator = new CryptoOpaqueTokenGenerator();

  it('generates url safe tokens with 256 bits of entropy', () => {
    const token = generator.generate();

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('never repeats a token', () => {
    const tokens = new Set(Array.from({ length: 200 }, () => generator.generate()));

    expect(tokens.size).toBe(200);
  });

  it('fingerprints a token deterministically without revealing it', () => {
    const token = generator.generate();

    expect(generator.fingerprint(token)).toBe(generator.fingerprint(token));
    expect(generator.fingerprint(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(generator.fingerprint(token)).not.toContain(token);
  });

  it('produces a different fingerprint for a different token', () => {
    expect(generator.fingerprint('uno')).not.toBe(generator.fingerprint('dos'));
  });
});
