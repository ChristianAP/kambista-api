export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export abstract class InvalidInputError extends DomainError {}
export abstract class ConflictError extends DomainError {}
export abstract class NotFoundError extends DomainError {}
export abstract class AuthenticationError extends DomainError {}
export abstract class ServiceUnavailableError extends DomainError {}
