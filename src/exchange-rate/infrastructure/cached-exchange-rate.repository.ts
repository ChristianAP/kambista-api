import { ExchangeRateRepository } from '../application/exchange-rate.repository';
import { ExchangeRate } from '../domain/exchange-rate';

export class CachedExchangeRateRepository implements ExchangeRateRepository {
  private latest: ExchangeRate | null = null;

  constructor(private readonly source: ExchangeRateRepository) {}

  async save(rate: ExchangeRate): Promise<void> {
    await this.source.save(rate);
    this.remember(rate);
  }

  async findLatest(): Promise<ExchangeRate | null> {
    if (this.latest) {
      return this.latest;
    }

    const stored = await this.source.findLatest();

    if (stored) {
      this.remember(stored);
    }

    return stored;
  }

  private remember(rate: ExchangeRate): void {
    if (!this.latest || rate.fetchedAt.getTime() >= this.latest.fetchedAt.getTime()) {
      this.latest = rate;
    }
  }
}
