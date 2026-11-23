import { InvalidInputError } from './domain-error';

export class InvalidPaginationError extends InvalidInputError {
  readonly code = 'INVALID_PAGINATION';
}
