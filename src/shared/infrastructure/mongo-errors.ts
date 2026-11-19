const DUPLICATE_KEY_ERROR_CODE = 11000;

export const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === DUPLICATE_KEY_ERROR_CODE;
