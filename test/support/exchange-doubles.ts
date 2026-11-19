import {
  ExchangeRateProvider,
  ExchangeRateQuote,
} from '../../src/exchange-rate/application/exchange-rate.provider';
import { ExchangeRateRepository } from '../../src/exchange-rate/application/exchange-rate.repository';
import { ExchangeRate } from '../../src/exchange-rate/domain/exchange-rate';

export const SUNAT_QUOTE: ExchangeRateQuote = {
  buy: 3.733,
  sell: 3.739,
  source: 'SUNAT',
  quotedOn: '2026-11-18',
};

export class InMemoryExchangeRateRepository implements ExchangeRateRepository {
  readonly items: ExchangeRate[] = [];

  async save(rate: ExchangeRate): Promise<void> {
    this.items.push(rate);
  }

  async findLatest(): Promise<ExchangeRate | null> {
    const newestFirst = [...this.items].sort(
      (a, b) => b.fetchedAt.getTime() - a.fetchedAt.getTime(),
    );
    return newestFirst[0] ?? null;
  }
}

export class StubExchangeRateProvider implements ExchangeRateProvider {
  constructor(private readonly outcome: ExchangeRateQuote | Error = SUNAT_QUOTE) {}

  async fetchLatest(): Promise<ExchangeRateQuote> {
    if (this.outcome instanceof Error) {
      throw this.outcome;
    }
    return this.outcome;
  }
}
