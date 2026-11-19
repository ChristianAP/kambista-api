import { ExchangeRate } from '../domain/exchange-rate';
import { ExchangeRateNotAvailableError } from '../domain/exchange-rate.errors';
import { ExchangeRateRepository } from './exchange-rate.repository';

export class GetLatestExchangeRate {
  constructor(private readonly rates: ExchangeRateRepository) {}

  async execute(): Promise<ExchangeRate> {
    const latest = await this.rates.findLatest();

    if (!latest) {
      throw new ExchangeRateNotAvailableError();
    }

    return latest;
  }
}
