export abstract class OpaqueTokenGenerator {
  abstract generate(): string;
  abstract fingerprint(token: string): string;
}
