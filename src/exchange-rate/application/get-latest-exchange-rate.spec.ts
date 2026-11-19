import { buildExchangeRate } from '../../../test/support/builders';
import { InMemoryExchangeRateRepository } from '../../../test/support/exchange-doubles';
import { ExchangeRateNotAvailableError } from '../domain/exchange-rate.errors';
import { GetLatestExchangeRate } from './get-latest-exchange-rate';

describe('GetLatestExchangeRate', () => {
  it('returns the most recently fetched rate', async () => {
    const rates = new InMemoryExchangeRateRepository();
    await rates.save(buildExchangeRate({ id: 'old', fetchedAt: new Date('2026-11-18T14:00:00Z') }));
    await rates.save(buildExchangeRate({ id: 'new', fetchedAt: new Date('2026-11-18T14:30:00Z') }));

    const latest = await new GetLatestExchangeRate(rates).execute();

    expect(latest.id).toBe('new');
  });

  it('fails when no rate has been stored yet', async () => {
    const getLatestExchangeRate = new GetLatestExchangeRate(new InMemoryExchangeRateRepository());

    await expect(getLatestExchangeRate.execute()).rejects.toThrow(ExchangeRateNotAvailableError);
  });
});
