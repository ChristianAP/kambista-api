import { Decimal } from 'decimal.js';
import { Types } from 'mongoose';

export const toDecimal128 = (value: Decimal): Types.Decimal128 =>
  Types.Decimal128.fromString(value.toFixed());

export const fromDecimal128 = (value: Types.Decimal128): Decimal => new Decimal(value.toString());
