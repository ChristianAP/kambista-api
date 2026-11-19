import { ExchangeRate } from '../domain/exchange-rate';

export abstract class ExchangeRateRepository {
  abstract save(rate: ExchangeRate): Promise<void>;
  abstract findLatest(): Promise<ExchangeRate | null>;
}
