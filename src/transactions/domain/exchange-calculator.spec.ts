import { Decimal } from 'decimal.js';
import { Currency } from './currency';
import { convert, MAX_EXCHANGE_AMOUNT } from './exchange-calculator';
import { Money } from './money';
import {
  AmountExceedsLimitError,
  AmountTooSmallError,
  SameCurrencyError,
} from './transactions.errors';

const rates = { buy: new Decimal('3.733'), sell: new Decimal('3.739') };

describe('convert', () => {
  it('multiplies by the sell rate when exchanging USD for PEN', () => {
    const { convertedAmount, appliedRate } = convert(
      Money.of(100),
      Currency.USD,
      Currency.PEN,
      rates,
    );

    expect(convertedAmount.toNumber()).toBe(373.9);
    expect(appliedRate.toNumber()).toBe(3.739);
  });

  it('divides by the buy rate when exchanging PEN for USD', () => {
    const { convertedAmount, appliedRate } = convert(
      Money.of(100),
      Currency.PEN,
      Currency.USD,
      rates,
    );

    expect(convertedAmount.toNumber()).toBe(26.79);
    expect(appliedRate.toNumber()).toBe(3.733);
  });

  it('rejects identical currencies', () => {
    expect(() => convert(Money.of(100), Currency.USD, Currency.USD, rates)).toThrow(
      SameCurrencyError,
    );
  });

  it('accepts the maximum amount and rejects anything above it', () => {
    expect(() =>
      convert(Money.of(MAX_EXCHANGE_AMOUNT), Currency.USD, Currency.PEN, rates),
    ).not.toThrow();
    expect(() => convert(Money.of(10_000_000), Currency.USD, Currency.PEN, rates)).toThrow(
      AmountExceedsLimitError,
    );
  });

  it('rejects amounts that would convert to zero', () => {
    expect(() => convert(Money.of(0.01), Currency.PEN, Currency.USD, rates)).toThrow(
      AmountTooSmallError,
    );
  });
});
