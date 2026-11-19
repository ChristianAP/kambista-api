import { FIXED_NOW } from '../../../test/support/common-doubles';
import { ExchangeRate } from './exchange-rate';
import { InvalidExchangeRateError } from './exchange-rate.errors';

const newRate = {
  id: 'rate-1',
  buy: 3.733,
  sell: 3.739,
  source: 'SUNAT',
  quotedOn: '2026-11-18',
  fetchedAt: FIXED_NOW,
};

describe('ExchangeRate', () => {
  it('keeps the rates with exact decimal precision', () => {
    const rate = ExchangeRate.create(newRate);

    expect(rate.buy.toString()).toBe('3.733');
    expect(rate.sell.toString()).toBe('3.739');
  });

  it.each([0, -3.7, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects a non positive or non finite rate (%s)',
    (value) => {
      expect(() => ExchangeRate.create({ ...newRate, buy: value })).toThrow(
        InvalidExchangeRateError,
      );
      expect(() => ExchangeRate.create({ ...newRate, sell: value })).toThrow(
        InvalidExchangeRateError,
      );
    },
  );
});
