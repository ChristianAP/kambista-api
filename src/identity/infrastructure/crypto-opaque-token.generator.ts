import { createHash, randomBytes } from 'node:crypto';
import { OpaqueTokenGenerator } from '../application/opaque-token-generator';

const TOKEN_BYTES = 32;

export class CryptoOpaqueTokenGenerator implements OpaqueTokenGenerator {
  generate(): string {
    return randomBytes(TOKEN_BYTES).toString('base64url');
  }

  fingerprint(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
