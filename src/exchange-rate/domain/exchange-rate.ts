import { Decimal } from 'decimal.js';
import { InvalidExchangeRateError } from './exchange-rate.errors';

export interface ExchangeRateProps {
  readonly id: string;
  readonly buy: Decimal;
  readonly sell: Decimal;
  readonly source: string;
  readonly quotedOn: string;
  readonly fetchedAt: Date;
}

export interface NewExchangeRate extends Omit<ExchangeRateProps, 'buy' | 'sell'> {
  readonly buy: number;
  readonly sell: number;
}

const isPositiveRate = (value: number): boolean => Number.isFinite(value) && value > 0;

export class ExchangeRate {
  private constructor(
    readonly id: string,
    readonly buy: Decimal,
    readonly sell: Decimal,
    readonly source: string,
    readonly quotedOn: string,
    readonly fetchedAt: Date,
  ) {}

  static create(newRate: NewExchangeRate): ExchangeRate {
    if (!isPositiveRate(newRate.buy) || !isPositiveRate(newRate.sell)) {
      throw new InvalidExchangeRateError();
    }

    return ExchangeRate.restore({
      ...newRate,
      buy: new Decimal(newRate.buy),
      sell: new Decimal(newRate.sell),
    });
  }

  static restore(props: ExchangeRateProps): ExchangeRate {
    return new ExchangeRate(
      props.id,
      props.buy,
      props.sell,
      props.source,
      props.quotedOn,
      props.fetchedAt,
    );
  }
}
