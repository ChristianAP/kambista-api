import { Clock } from '../../shared/application/clock';
import { IdGenerator } from '../../shared/application/id-generator';
import { ExchangeRate } from '../domain/exchange-rate';
import { ExchangeRateProvider } from './exchange-rate.provider';
import { ExchangeRateRepository } from './exchange-rate.repository';

export class RefreshExchangeRate {
  constructor(
    private readonly provider: ExchangeRateProvider,
    private readonly rates: ExchangeRateRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<ExchangeRate> {
    const quote = await this.provider.fetchLatest();
    const rate = ExchangeRate.create({
      id: this.ids.next(),
      ...quote,
      fetchedAt: this.clock.now(),
    });

    await this.rates.save(rate);
    return rate;
  }
}
