import { Decimal } from 'decimal.js';
import { InvalidAmountError } from './transactions.errors';

const DECIMAL_PLACES = 2;

export class Money {
  private constructor(private readonly value: Decimal) {}

  static of(raw: number): Money {
    if (!Number.isFinite(raw) || raw <= 0) {
      throw new InvalidAmountError('El monto debe ser mayor a cero');
    }

    const value = new Decimal(raw);

    if (value.decimalPlaces() > DECIMAL_PLACES) {
      throw new InvalidAmountError(`El monto admite como máximo ${DECIMAL_PLACES} decimales`);
    }

    return new Money(value);
  }

  static fromDecimal(value: Decimal): Money {
    return new Money(value.toDecimalPlaces(DECIMAL_PLACES, Decimal.ROUND_HALF_UP));
  }

  times(factor: Decimal): Money {
    return Money.fromDecimal(this.value.times(factor));
  }

  dividedBy(divisor: Decimal): Money {
    return Money.fromDecimal(this.value.dividedBy(divisor));
  }

  exceeds(limit: number): boolean {
    return this.value.greaterThan(limit);
  }

  isZero(): boolean {
    return this.value.isZero();
  }

  toDecimal(): Decimal {
    return this.value;
  }

  toNumber(): number {
    return this.value.toNumber();
  }
}
