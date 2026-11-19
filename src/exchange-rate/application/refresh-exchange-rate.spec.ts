import { FIXED_NOW, FixedClock, SequentialIdGenerator } from '../../../test/support/common-doubles';
import {
  InMemoryExchangeRateRepository,
  StubExchangeRateProvider,
  SUNAT_QUOTE,
} from '../../../test/support/exchange-doubles';
import {
  ExchangeRateProviderError,
  InvalidExchangeRateError,
} from '../domain/exchange-rate.errors';
import { ExchangeRateProvider } from './exchange-rate.provider';
import { RefreshExchangeRate } from './refresh-exchange-rate';

const setup = (provider: ExchangeRateProvider) => {
  const rates = new InMemoryExchangeRateRepository();
  const refreshExchangeRate = new RefreshExchangeRate(
    provider,
    rates,
    new SequentialIdGenerator(),
    new FixedClock(),
  );
  return { rates, refreshExchangeRate };
};

describe('RefreshExchangeRate', () => {
  it('stores the quote returned by the provider', async () => {
    const { rates, refreshExchangeRate } = setup(new StubExchangeRateProvider());

    const rate = await refreshExchangeRate.execute();

    expect(rates.items).toEqual([rate]);
    expect(rate).toMatchObject({
      id: 'id-1',
      source: 'SUNAT',
      quotedOn: '2026-11-18',
      fetchedAt: FIXED_NOW,
    });
    expect(rate.sell.toNumber()).toBe(SUNAT_QUOTE.sell);
  });

  it('stores nothing when the provider fails', async () => {
    const failure = new ExchangeRateProviderError('timeout');
    const { rates, refreshExchangeRate } = setup(new StubExchangeRateProvider(failure));

    await expect(refreshExchangeRate.execute()).rejects.toThrow(failure);
    expect(rates.items).toHaveLength(0);
  });

  it('stores nothing when the provider returns an invalid quote', async () => {
    const { rates, refreshExchangeRate } = setup(
      new StubExchangeRateProvider({ ...SUNAT_QUOTE, buy: 0 }),
    );

    await expect(refreshExchangeRate.execute()).rejects.toThrow(InvalidExchangeRateError);
    expect(rates.items).toHaveLength(0);
  });
});
