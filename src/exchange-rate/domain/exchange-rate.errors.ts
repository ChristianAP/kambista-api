import { InvalidInputError, ServiceUnavailableError } from '../../shared/domain/domain-error';

export class InvalidExchangeRateError extends InvalidInputError {
  readonly code = 'INVALID_EXCHANGE_RATE';

  constructor() {
    super('El tipo de cambio recibido no es válido');
  }
}

export class ExchangeRateNotAvailableError extends ServiceUnavailableError {
  readonly code = 'EXCHANGE_RATE_NOT_AVAILABLE';

  constructor() {
    super('Aún no hay un tipo de cambio registrado, intenta nuevamente en unos instantes');
  }
}

export class ExchangeRateProviderError extends ServiceUnavailableError {
  readonly code = 'EXCHANGE_RATE_PROVIDER_ERROR';

  constructor(reason: string) {
    super(`No se pudo obtener el tipo de cambio del proveedor: ${reason}`);
  }
}
