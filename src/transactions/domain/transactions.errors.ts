import { InvalidInputError } from '../../shared/domain/domain-error';

export class InvalidAmountError extends InvalidInputError {
  readonly code = 'INVALID_AMOUNT';
}

export class AmountExceedsLimitError extends InvalidInputError {
  readonly code = 'AMOUNT_EXCEEDS_LIMIT';

  constructor(limit: number) {
    super(`El monto no puede superar ${limit.toLocaleString('en-US')}`);
  }
}

export class AmountTooSmallError extends InvalidInputError {
  readonly code = 'AMOUNT_TOO_SMALL';

  constructor() {
    super('El monto es demasiado pequeño: el resultado del cambio sería cero');
  }
}

export class SameCurrencyError extends InvalidInputError {
  readonly code = 'SAME_CURRENCY';

  constructor() {
    super('La moneda de origen y la de destino no pueden ser iguales');
  }
}

export class InvalidDateRangeError extends InvalidInputError {
  readonly code = 'INVALID_DATE_RANGE';
}
