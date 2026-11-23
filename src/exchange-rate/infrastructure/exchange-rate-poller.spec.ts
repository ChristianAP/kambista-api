import { FixedClock, SequentialIdGenerator } from '../../../test/support/common-doubles';
import {
  InMemoryExchangeRateRepository,
  StubExchangeRateProvider,
  SUNAT_QUOTE,
} from '../../../test/support/exchange-doubles';
import { ExchangeRateProvider } from '../application/exchange-rate.provider';
import { RefreshExchangeRate } from '../application/refresh-exchange-rate';
import { ExchangeRateProviderError } from '../domain/exchange-rate.errors';
import { ExchangeRatePoller } from './exchange-rate-poller';

const INTERVAL_MS = 30_000;

const setup = (provider: ExchangeRateProvider) => {
  const rates = new InMemoryExchangeRateRepository();
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  const refresh = new RefreshExchangeRate(
    provider,
    rates,
    new SequentialIdGenerator(),
    new FixedClock(),
  );
  return { rates, logger, poller: new ExchangeRatePoller(refresh, INTERVAL_MS, logger) };
};

describe('ExchangeRatePoller', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('stores a rate right away and then once per interval', async () => {
    const { rates, poller } = setup(new StubExchangeRateProvider());

    poller.start();
    await jest.advanceTimersByTimeAsync(0);
    expect(rates.items).toHaveLength(1);

    await jest.advanceTimersByTimeAsync(INTERVAL_MS - 1);
    expect(rates.items).toHaveLength(1);

    await jest.advanceTimersByTimeAsync(1);
    expect(rates.items).toHaveLength(2);

    await jest.advanceTimersByTimeAsync(INTERVAL_MS);
    expect(rates.items).toHaveLength(3);
    poller.stop();
  });

  it('keeps polling after the provider fails and reports a warning', async () => {
    const provider: ExchangeRateProvider = {
      fetchLatest: jest
        .fn()
        .mockRejectedValueOnce(new ExchangeRateProviderError('timeout'))
        .mockResolvedValue(SUNAT_QUOTE),
    };
    const { rates, logger, poller } = setup(provider);

    poller.start();
    await jest.advanceTimersByTimeAsync(0);

    expect(rates.items).toHaveLength(0);
    expect(logger.warn).toHaveBeenCalledWith(expect.any(String), {
      reason: expect.stringContaining('timeout'),
    });

    await jest.advanceTimersByTimeAsync(INTERVAL_MS);

    expect(rates.items).toHaveLength(1);
    poller.stop();
  });

  it('stops polling', async () => {
    const { rates, poller } = setup(new StubExchangeRateProvider());
    poller.start();
    await jest.advanceTimersByTimeAsync(0);

    poller.stop();
    await jest.advanceTimersByTimeAsync(INTERVAL_MS * 3);

    expect(rates.items).toHaveLength(1);
  });

  it('ignores a second start while running', async () => {
    const { rates, poller } = setup(new StubExchangeRateProvider());

    poller.start();
    poller.start();
    await jest.advanceTimersByTimeAsync(0);

    expect(rates.items).toHaveLength(1);
    poller.stop();
  });
});
