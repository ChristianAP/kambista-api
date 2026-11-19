import { Decimal } from 'decimal.js';
import { Money } from './money';
import { InvalidAmountError } from './transactions.errors';

describe('Money', () => {
  it('accepts amounts with up to two decimals', () => {
    expect(Money.of(100.25).toNumber()).toBe(100.25);
  });

  it.each([0, -5, Number.NaN, Number.POSITIVE_INFINITY])('rejects the amount %s', (raw) => {
    expect(() => Money.of(raw)).toThrow(InvalidAmountError);
  });

  it('rejects more than two decimals', () => {
    expect(() => Money.of(100.123)).toThrow('como máximo 2 decimales');
  });

  it('rounds half up to two decimals', () => {
    expect(Money.fromDecimal(new Decimal('2.675')).toNumber()).toBe(2.68);
  });

  it('multiplies and divides without floating point drift', () => {
    expect(Money.of(100).times(new Decimal('3.739')).toNumber()).toBe(373.9);
    expect(Money.of(1.1).times(new Decimal(3)).toNumber()).toBe(3.3);
    expect(Money.of(100).dividedBy(new Decimal('3.733')).toNumber()).toBe(26.79);
  });

  it('compares against a limit', () => {
    expect(Money.of(10).exceeds(9.99)).toBe(true);
    expect(Money.of(10).exceeds(10)).toBe(false);
  });
});
