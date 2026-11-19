import { Decimal } from 'decimal.js';
import { Currency } from './currency';
import { Money } from './money';
import {
  AmountExceedsLimitError,
  AmountTooSmallError,
  SameCurrencyError,
} from './transactions.errors';

export const MAX_EXCHANGE_AMOUNT = 9_999_999.99;

export interface ConversionRates {
  readonly buy: Decimal;
  readonly sell: Decimal;
}

export interface Conversion {
  readonly convertedAmount: Money;
  readonly appliedRate: Decimal;
}

export const convert = (
  amount: Money,
  source: Currency,
  target: Currency,
  rates: ConversionRates,
): Conversion => {
  if (source === target) {
    throw new SameCurrencyError();
  }

  if (amount.exceeds(MAX_EXCHANGE_AMOUNT)) {
    throw new AmountExceedsLimitError(MAX_EXCHANGE_AMOUNT);
  }

  const fromDollars = source === Currency.USD;
  const appliedRate = fromDollars ? rates.sell : rates.buy;
  const convertedAmount = fromDollars ? amount.times(appliedRate) : amount.dividedBy(appliedRate);

  if (convertedAmount.isZero()) {
    throw new AmountTooSmallError();
  }

  return { convertedAmount, appliedRate };
};
